# 04 – HMAC Request Signing

The gateway signs every request using HMAC-SHA256. The shared secret is **never transmitted over the network** – only the resulting signature is sent.

## How It Works

```
Gateway                                          Server
  │                                                │
  │  1. Constructs string:                         │
  │     POST\n/api/telemetry\n<timestamp>\n<body>  │
  │  2. Signs with HMAC-SHA256(secret, string)     │
  │                                                │
  │── POST /api/telemetry ────────────────────────►│
  │   X-Device-Id: gateway-01                      │  3. Finds secret for device
  │   X-Timestamp: 2026-04-08T10:30:00Z            │  4. Constructs same string
  │   X-Signature: a1b2c3d4...                     │  5. Computes its own HMAC
  │   { temperature: 22.5, humidity: 65 }          │  6. Compares signatures
  │◄── 201 Created ──────────────────────────────│
```

1. The gateway constructs the string to sign: `METHOD\nPATH\nTIMESTAMP\nBODY`
2. Computes HMAC-SHA256 of the string using the shared secret
3. Sends the request with headers `X-Device-Id`, `X-Timestamp`, `X-Signature`
4. The server finds the secret by `X-Device-Id`, constructs the same string, computes its own HMAC
5. Compares both signatures using `crypto.timingSafeEqual` (timing attack protection)
6. Rejects requests with timestamps older than 30 seconds (replay protection)

## How the Backend Discovers Gateway Identity

The gateway sends its identity explicitly in the `X-Device-Id` header. The server uses it to look up the shared secret in the registry:

```javascript
const deviceId = req.headers["x-device-id"];       // "gateway-01"
const device = DEVICE_REGISTRY[deviceId];           // finds secret
const expected = crypto.createHmac("sha256", device.secret)
  .update(stringToSign).digest("hex");              // computes its own signature
```

The identity cannot be spoofed – an attacker can send a different `X-Device-Id`, but without knowing the correct secret for that device, they cannot produce a valid signature. A valid signature proves the sender knows the secret assigned to that deviceId.

## Pros and Cons

- **Secret never leaves the device** – only the signature travels over the network
- **Replay protection** – timestamp + 30 second window
- **Data integrity** – signed body, any modification en route invalidates the signature
- More complex implementation on both sides
- Time synchronization required between gateway and server (NTP)
- This principle is used by AWS Signature v4, Azure Shared Key, banking APIs

## Running

```bash
# Terminal 1 – server (port 3004)
node 04-hmac-signature/server/app.js

# Terminal 2 – gateway (choose a variant)
node 04-hmac-signature/gateway/gateway.js
python 04-hmac-signature/gateway/gateway.py
```

Node-RED: import `gateway/flow.json` → click inject nodes. Requires Node-RED 2.0+ (function node with `libs` for `crypto` module import).

## Device Registry

| Device ID | Shared Secret | Name |
|-----------|---------------|------|
| gateway-01 | `hmac-secret-gw01-very-long-key` | Temperature Sensor Hub |
| gateway-02 | `hmac-secret-gw02-very-long-key` | Humidity Sensor Hub |

## Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/telemetry` | `X-Device-Id` + `X-Timestamp` + `X-Signature` | Store telemetry data |
| `GET` | `/api/telemetry` | No | List stored records |
