# 05 – mTLS (Mutual TLS)

Mutual certificate authentication. Both the server and gateway have certificates signed by a common Certificate Authority (CA). Verification happens at the TLS layer – before any HTTP communication.

## How It Works

```
Gateway                                Server
  │                                      │
  │── TLS ClientHello ──────────────────►│
  │◄── ServerHello + ServerCert ────────│
  │◄── CertificateRequest ─────────────│  "show me your certificate"
  │── ClientCert + CertificateVerify ──►│  verifies CA signature
  │◄── Finished ───────────────────────│
  │                                      │
  │══════ encrypted channel ═══════════│
  │                                      │
  │── POST /api/telemetry ────────────►│  identity from certificate (CN=gateway-01)
  │   { temperature: 22.5, humidity: 65 }│
  │◄── 201 Created ────────────────────│
```

1. During TLS handshake, the server requests a client certificate (`requestCert: true`)
2. The gateway presents a certificate signed by a trusted CA
3. The server verifies the certificate is signed by its CA
4. The middleware extracts the identity (Common Name) from the certificate: `CN=gateway-01`
5. HTTP communication proceeds over the encrypted channel

## How the Backend Discovers Gateway Identity

The server reads the Common Name (CN) field from the client certificate's subject:

```javascript
const cert = req.socket.getPeerCertificate();
const deviceId = cert.subject.CN; // "gateway-01"
```

The identity cannot be spoofed because:
1. The certificate must be signed by a trusted CA – the server verifies the chain of trust
2. The gateway proves ownership of the private key during TLS handshake (CertificateVerify message)
3. The private key never leaves the device – only the public certificate is transmitted

## Certificates in the Demo

The `generate-certs.sh` script creates 4 key pairs:

| File | Description |
|------|-------------|
| `ca-cert.pem` / `ca-key.pem` | Certificate Authority (root certificate) |
| `server-cert.pem` / `server-key.pem` | Server certificate (CN=localhost) |
| `client-cert.pem` / `client-key.pem` | Client certificate (CN=gateway-01) – **valid** |
| `unauthorized-cert.pem` / `unauthorized-key.pem` | Self-signed certificate (CN=rogue-device) – **rejected** |

The unauthorized certificate is not signed by the CA → the server rejects it.

## Where Certificates Would Be in Production

| Certificate | Location | Who has it |
|-------------|----------|------------|
| **CA cert** (`ca-cert.pem`) | Backend server + provisioning service | Public – can be distributed freely, only used to verify signatures |
| **CA private key** (`ca-key.pem`) | Isolated HSM / offline machine | CA authority only – **never on server or gateway!** Used exclusively for signing new certificates |
| **Server cert + key** | Backend server (e.g. `/etc/ssl/`) | Backend only – proves server identity to gateway |
| **Client cert + key** | Flash memory / secure element on gateway | Specific gateway only – loaded during manufacturing or provisioning |

In real-world IoT deployments:
- **CA key** is stored in an HSM (Hardware Security Module) and is never directly accessible
- **Client private key** is ideally in an HW secure element on the device (TPM, ATECC608) – it cannot be exported even with physical access
- **Certificate distribution** happens during device provisioning – either during manufacturing (pre-provisioning) or at first connection (just-in-time provisioning, AWS IoT supports both)
- **Revocation** of compromised certificates via CRL (Certificate Revocation List) or OCSP

## Pros and Cons

- **Strongest authentication** – verification at the transport layer, no tokens in HTTP
- **Mutual** – the gateway also verifies the server's identity
- **Industry standard** – AWS IoT Core, Azure IoT Hub, SCADA systems
- Certificate management (distribution, rotation, revocation) = PKI infrastructure
- More complex setup and debugging
- Certificates have limited validity – renewal must be handled

## Running

```bash
# 1. Generate certificates (once)
bash 05-mtls/generate-certs.sh

# 2. Terminal 1 – HTTPS server (port 3005)
node 05-mtls/server/app.js

# 3. Terminal 2 – gateway (choose a variant)
node 05-mtls/gateway/gateway.js
python 05-mtls/gateway/gateway.py
```

Node-RED: mTLS requires configuring a TLS config node in Node-RED (setting certificate paths). For teaching purposes, we recommend the Node.js or Python variant.

## Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/telemetry` | Client certificate (mTLS) | Store telemetry data |
| `GET` | `/api/telemetry` | No | List stored records |
