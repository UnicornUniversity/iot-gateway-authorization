# IoT Gateway Authorization Against a Backend

Teaching material for the **Internet of Things** course – 5 approaches to authorizing an IoT gateway (hub) against an Express.js backend.

## Download

```bash
git clone https://github.com/UnicornUniversity/iot-gateway-authorization.git
cd iot-gateway-authorization
npm install
```

## Motivation

An IoT gateway is the intermediary between sensors/actuators and the cloud backend. Each gateway must **prove its identity** to the backend (authentication) and the backend must **verify its permissions** (authorization). Without this, anyone can send fake data or read other devices' measurements.

This repository contains 5 ways to solve this – from the simplest to production-grade solutions used in AWS IoT Core or Azure IoT Hub.

## Approaches

| # | Approach | Complexity | Security | Key Principle |
|---|----------|------------|----------|---------------|
| 01 | **API Key** | Very low | Low | Static key in HTTP header |
| 02 | **HTTP Basic Auth** | Low | Low–medium | Base64-encoded credentials (TLS required!) |
| 03 | **JWT Token** | Medium | Medium–high | Short-lived signed token with expiration |
| 04 | **HMAC Signing** | High | High | Request signing, secret never transmitted |
| 05 | **mTLS** | Very high | Very high | Mutual certificates, verification at TLS layer |

## Prerequisites

- **Node.js 18+** (for server and Node.js gateway clients)
- **Python 3.8+** + `pip install requests` (for Python gateway clients)
- **Node-RED** (optional, for visual flow gateway)
- **OpenSSL** (for demo 05-mTLS, certificate generation)

## Installation

```bash
# Install server dependencies
npm install

# Python dependencies (optional)
pip install -r requirements.txt

# Certificates for mTLS demo (optional)
bash 05-mtls/generate-certs.sh
```

## Server Architecture

Each server has a layered architecture:

```
server/
├── app.js                              # Express setup, server startup
├── middleware/
│   └── auth.js                         # Authorization middleware (differs per demo)
├── api/
│   └── controller/
│       └── telemetry-controller.js     # REST routes (POST + GET)
├── abl/
│   └── telemetry-abl.js               # Business logic (validation, data enrichment)
├── dao/
│   └── telemetry-dao.js               # Persistence (JSON file)
└── data/
    └── telemetry.json                  # Stored data (auto-created)
```

**Endpoints:**

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/telemetry` | Yes | Store telemetry data from gateway |
| `GET` | `/api/telemetry` | No | List all stored records |

**Data format (POST body):**

```json
{
  "temperature": 22.5,
  "humidity": 65
}
```

## Gateway Clients

Each demo has 3 versions of the gateway client:

| File | Language | Run |
|------|----------|-----|
| `gateway/gateway.js` | Node.js | `node XX-demo/gateway/gateway.js` |
| `gateway/gateway.py` | Python | `python XX-demo/gateway/gateway.py` |
| `gateway/flow.json` | Node-RED | Import in Node-RED → click inject |

Each client performs 3 steps:
1. Sends telemetry data with **valid** credentials → 201 Created
2. Lists stored data via GET → 200 OK
3. Sends data with **invalid** credentials → 401/403

---

## 01 – API Key

The simplest approach. The gateway sends a static API key in the `X-API-Key` HTTP header.

```bash
# Terminal 1: start server
node 01-api-key/server/app.js

# Terminal 2: start gateway (Node.js / Python)
node 01-api-key/gateway/gateway.js
python 01-api-key/gateway/gateway.py
```

Node-RED: import `01-api-key/gateway/flow.json` → click inject nodes.

**How it works:**
1. Each device has a unique API key assigned
2. The gateway sends it in every request as `X-API-Key: key-abc-123`
3. The server looks up the key in the device registry

**Identity discovery:** The server looks up the API key in the device registry – the key is unique per device, so the key value itself uniquely identifies the gateway. Identity is derived from the key value (whoever has key `key-abc-123` is `gateway-01`).

**Pros:** Simplicity, quick implementation.
**Cons:** Key is transmitted in plaintext in every request. If leaked, it's compromised forever (no expiration). No protection against replay attacks.

**Real-world usage:** Simple hobby projects, internal prototypes.

---

## 02 – HTTP Basic Auth

Standard HTTP authentication. The gateway sends `deviceId:secret` encoded in Base64 in the `Authorization` header.

```bash
# Terminal 1: start server
node 02-basic-auth/server/app.js

# Terminal 2: start gateway (Node.js / Python)
node 02-basic-auth/gateway/gateway.js
python 02-basic-auth/gateway/gateway.py
```

Node-RED: import `02-basic-auth/gateway/flow.json` → click inject nodes.

**How it works:**
1. The gateway encodes `gateway-01:s3cret-gw01` to Base64
2. Sends the header `Authorization: Basic Z2F0ZXdheS0wMTpzM2NyZXQtZ3cwMQ==`
3. The server decodes, splits into deviceId and secret, verifies

**Identity discovery:** The server decodes Base64 and splits the result into `deviceId:secret`. The identity (deviceId) is an explicit part of the credentials – the gateway sends it directly along with the secret.

**Pros:** Standard mechanism (RFC 7617), broad support in all languages.
**Cons:** Base64 is not encryption – the secret is readable without TLS! In IoT, always use HTTPS.

**Real-world usage:** REST APIs with TLS, simpler M2M communication.

---

## 03 – JWT (JSON Web Token)

The gateway first authenticates and receives a short-lived token. It then uses this token for subsequent communication.

```bash
# Terminal 1: start server
node 03-jwt/server/app.js

# Terminal 2: start gateway (Node.js / Python)
node 03-jwt/gateway/gateway.js
python 03-jwt/gateway/gateway.py
```

Node-RED: import `03-jwt/gateway/flow.json` → click inject nodes sequentially (1. Login → 2. Send → 3. List → 4. Invalid).

**How it works:**
1. The gateway sends `POST /api/auth/login` with `{ deviceId, secret }`
2. The server verifies credentials and returns a signed JWT token (1h expiration)
3. The gateway sends the token in `Authorization: Bearer <token>`
4. The server verifies the token signature and checks it hasn't expired

**Identity discovery:** The server decodes the JWT payload, which contains the `deviceId` (embedded when the token was issued). The token signature guarantees that the payload hasn't been tampered with – the server trusts the identity from the token because it signed the token itself.

**Pros:** Token has limited validity. Server doesn't need to store sessions (stateless). Standard format (RFC 7519).
**Cons:** Need to handle token refresh. Revoking a token before expiration is complex.

**Real-world usage:** Most modern REST APIs, OAuth 2.0 flows.

---

## 04 – HMAC Request Signing

The gateway signs every request using HMAC-SHA256. The shared secret is never transmitted over the network.

```bash
# Terminal 1: start server
node 04-hmac-signature/server/app.js

# Terminal 2: start gateway (Node.js / Python)
node 04-hmac-signature/gateway/gateway.js
python 04-hmac-signature/gateway/gateway.py
```

Node-RED: import `04-hmac-signature/gateway/flow.json` → click inject nodes. Requires Node-RED 2.0+ (`libs` property on function nodes).

**How it works:**
1. The gateway constructs a string: `METHOD\nPATH\nTIMESTAMP\nBODY`
2. Signs it with HMAC-SHA256 using the shared secret
3. Sends headers: `X-Device-Id`, `X-Timestamp`, `X-Signature`
4. The server reconstructs the same string and computes its own signature
5. Compares signatures (timing-safe comparison)
6. Rejects requests older than 30 seconds (replay protection)

**Identity discovery:** The gateway sends its identity explicitly in the `X-Device-Id` header. The server uses it to look up the shared secret in the registry. The identity cannot be spoofed – an attacker can send a different `X-Device-Id`, but without knowing the correct secret they cannot produce a valid signature.

**Pros:** Secret is never transmitted. Replay attack protection (timestamp). Data integrity verification (signed body).
**Cons:** More complex implementation. Time synchronization required.

**Real-world usage:** AWS Signature v4, Azure Shared Key, banking APIs.

---

## 05 – mTLS (Mutual TLS)

Mutual certificate authentication. Both the server and gateway have certificates signed by a common Certificate Authority (CA).

```bash
# 1. Generate certificates (once)
bash 05-mtls/generate-certs.sh

# Terminal 1: start server
node 05-mtls/server/app.js

# Terminal 2: start gateway (Node.js / Python)
node 05-mtls/gateway/gateway.js
python 05-mtls/gateway/gateway.py
```

Node-RED: requires TLS config node with certificate paths – for teaching purposes, use the Node.js or Python variant.

**How it works:**
1. During TLS handshake, the server requests the gateway's certificate
2. The gateway presents a certificate signed by a trusted CA
3. The server verifies the certificate is signed by its CA
4. The middleware extracts the identity (CN) from the certificate

**Identity discovery:** The server reads the Common Name (CN) field from the client certificate's subject (`req.socket.getPeerCertificate().subject.CN`). In the demo, CN is set to `gateway-01`. The identity cannot be spoofed because the certificate is signed by the CA and the private key never leaves the device.

**Certificates in the demo:**
- `ca-cert.pem` – Certificate Authority (root certificate)
- `server-cert.pem` / `server-key.pem` – server certificate
- `client-cert.pem` / `client-key.pem` – client certificate (gateway-01)
- `unauthorized-cert.pem` – self-signed certificate (not signed by CA → rejected)

**Where certificates would be in production:**

| Certificate | Location | Who has it |
|-------------|----------|------------|
| CA cert (`ca-cert.pem`) | Backend server + provisioning service | Public – can be distributed freely, only used to verify signatures |
| CA private key (`ca-key.pem`) | Isolated HSM / offline machine | CA authority only – never on server or gateway! Used exclusively for signing new certificates |
| Server cert + key | Backend server (e.g. `/etc/ssl/`) | Backend only – proves server identity to gateway |
| Client cert + key | Flash memory / secure element on gateway | Specific gateway only – loaded during manufacturing or provisioning. Private key ideally in HW secure element (TPM, ATECC608) |

In real-world IoT deployments (AWS IoT Core, Azure IoT Hub), certificate distribution happens during **device provisioning** – either during manufacturing (pre-provisioning) or at first connection (just-in-time provisioning). The CA key is stored in an HSM (Hardware Security Module) and is never directly accessible.

**Pros:** Strongest authentication. No tokens or passwords in the HTTP layer. Industry standard for IoT.
**Cons:** Certificate management (distribution, rotation, revocation). More complex infrastructure (PKI).

**Real-world usage:** AWS IoT Core, Azure IoT Hub, industrial SCADA systems.

---

## Node-RED

Each demo has a `flow.json` that can be imported into Node-RED:

1. Open Node-RED (typically `http://localhost:1880`)
2. Menu → Import → paste contents of `flow.json`
3. Click the inject node to run

> **Note on demo 04 (HMAC):** The flow uses the `libs` property on function nodes to import the `crypto` module. Requires Node-RED 2.0+.

> **Note on demo 05 (mTLS):** Requires TLS configuration in Node-RED settings. For teaching purposes, we recommend using the Node.js or Python variant.

---

## Comparison of Approaches

| # | Approach | Complexity | Security |
|---|----------|------------|----------|
| 01 | **API Key** | ★☆☆☆☆ | ★☆☆☆☆ |
| 02 | **HTTP Basic Auth** | ★★☆☆☆ | ★★☆☆☆ |
| 03 | **JWT Token** | ★★★☆☆ | ★★★☆☆ |
| 04 | **HMAC Signing** | ★★★★☆ | ★★★★☆ |
| 05 | **mTLS** | ★★★★★ | ★★★★★ |

| Criterion | API Key | Basic Auth | JWT | HMAC | mTLS |
|-----------|---------|------------|-----|------|------|
| Secret transmitted over network | Yes | Yes | Only at login | No | No |
| Replay protection | No | No | Partial (expiration) | Yes (timestamp) | Yes (TLS) |
| Credential expiration | No | No | Yes | No (but timestamp) | Yes (cert validity) |
| TLS requirement | Recommended | **Required** | Recommended | Optional | Built-in |
| Server statelessness | Yes | Yes | Yes | Yes | Yes |
| Implementation complexity | Minimal | Low | Medium | High | Very high |

### What Each Criterion Means

**Secret transmitted over network** – Is the secret key/password sent in the HTTP request? If yes, anyone eavesdropping on the network (man-in-the-middle) can capture and abuse it. With API Key and Basic Auth, the secret is sent in every request. JWT sends it once at login and then uses a token. The HMAC secret never leaves the device – only the signature is transmitted. With mTLS, authentication happens at the TLS layer, and the private key is never transmitted.

**Replay protection** – What happens if an attacker captures a legitimate request and sends it again? Without protection, the backend accepts the duplicate as valid (fake data, duplicate commands). API Key and Basic Auth have no protection – a captured request works forever. A JWT token has an expiration, so replay is only possible until it expires (typically hours). HMAC includes a timestamp and the server rejects requests older than 30 seconds. mTLS handles replay at the TLS level (session sequence numbers).

**Credential expiration** – Do credentials expire automatically? If not, they are compromised forever upon leaking and require manual rotation. API Key and Basic Auth don't expire – on leak, you must manually change the key on both server and device. JWT tokens have limited validity (1 hour in the demo). Certificates in mTLS have a configured validity period (365 days in the demo).

**TLS requirement** – How dependent is the approach on encrypted transport (HTTPS)? Basic Auth is just Base64 encoding (not encryption) – without TLS it's like sending a password in plaintext, hence TLS is **required**. HMAC doesn't transmit the secret, so the authorization mechanism itself is secure even without TLS (though TLS still protects data content). With mTLS, TLS is the authorization mechanism itself.

**Server statelessness** – Does the server need to remember session state? All 5 approaches are stateless – the server verifies each request independently without storing sessions. This is important for scalability (multiple server instances, load balancing).

**Implementation complexity** – How much effort does correct implementation require? API Key is trivial (string comparison). mTLS requires PKI infrastructure (certificate authority, certificate distribution, revocation and rotation). For IoT with thousands of devices, the complexity of credential management grows with each approach.

---

## Discussion Questions

1. Why isn't an API key sufficient for a production IoT system?
2. What is the difference between authentication and authorization? Which of these 5 approaches addresses which?
3. What happens if an attacker captures a JWT token? How long can they abuse it?
4. Why doesn't HMAC signing require TLS for security? In what way is TLS still useful?
5. How do real platforms (AWS IoT, Azure IoT Hub) handle certificate rotation?
6. Which approach would you choose for: (a) a home weather station, (b) an industrial sensor in a factory, (c) an autonomous vehicle?

---

## References

- [AWS IoT Core – Device Authentication](https://docs.aws.amazon.com/iot/latest/developerguide/x509-client-certs.html)
- [Azure IoT Hub – Security](https://learn.microsoft.com/en-us/azure/iot-hub/iot-hub-devguide-security)
- [RFC 7519 – JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [RFC 7617 – HTTP Basic Auth](https://tools.ietf.org/html/rfc7617)
- [MQTT Security Fundamentals](https://www.hivemq.com/mqtt-security-fundamentals/)
