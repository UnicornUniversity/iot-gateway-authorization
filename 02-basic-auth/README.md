# 02 – HTTP Basic Auth

Standard HTTP authentication (RFC 7617). The gateway sends `deviceId:secret` encoded in Base64 in the `Authorization` header.

## How It Works

```
Gateway                                       Server
  │                                             │
  │── POST /api/telemetry ─────────────────────►│
  │   Authorization: Basic Z2F0ZXdheS0wMTpz... │  decodes Base64
  │   { temperature: 22.5, humidity: 65 }       │  verifies deviceId + secret
  │◄── 201 Created ───────────────────────────│
```

1. The gateway encodes `gateway-01:s3cret-gw01` to Base64
2. Sends it in the header `Authorization: Basic Z2F0ZXdheS0wMTpzM2NyZXQtZ3cwMQ==`
3. The server decodes Base64, splits into `deviceId` and `secret`
4. Verifies the device exists in the registry and the secret matches

**Warning:** Base64 is encoding, not encryption! Anyone can decode it:
```bash
echo "Z2F0ZXdheS0wMTpzM2NyZXQtZ3cwMQ==" | base64 -d
# → gateway-01:s3cret-gw01
```

Therefore **TLS (HTTPS) is mandatory** – without it, credentials are readable on the network.

## How the Backend Discovers Gateway Identity

The identity is an explicit part of the credentials. The server decodes Base64 and splits by the `:` delimiter:

```javascript
const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
const [deviceId, secret] = decoded.split(":");
// decoded = "gateway-01:s3cret-gw01"
// deviceId = "gateway-01", secret = "s3cret-gw01"
```

The gateway sends its identity (`deviceId`) directly along with the secret in a single string. The server verifies that the secret matches the given deviceId in the registry.

## Pros and Cons

- **Standard mechanism** – RFC 7617, support in all languages and tools
- **Simple** – Python `requests` has a native `auth=` parameter
- Secret is transmitted in every request (TLS required!)
- Doesn't expire, no replay protection

## Running

```bash
# Terminal 1 – server (port 3002)
node 02-basic-auth/server/app.js

# Terminal 2 – gateway (choose a variant)
node 02-basic-auth/gateway/gateway.js
python 02-basic-auth/gateway/gateway.py
```

Node-RED: import `gateway/flow.json` → click inject nodes.

## Device Registry

| Device ID | Secret | Name |
|-----------|--------|------|
| gateway-01 | `s3cret-gw01` | Temperature Sensor Hub |
| gateway-02 | `s3cret-gw02` | Humidity Sensor Hub |

## Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/telemetry` | `Authorization: Basic` | Store telemetry data |
| `GET` | `/api/telemetry` | No | List stored records |
