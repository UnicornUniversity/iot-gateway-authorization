# 01 – API Key

The simplest authorization approach. The gateway sends a static API key in the `X-API-Key` HTTP header. The server compares the key against a device registry.

## How It Works

```
Gateway                                Server
  │                                      │
  │── POST /api/telemetry ──────────────►│
  │   X-API-Key: key-abc-123             │  looks up key in registry
  │   { temperature: 22.5, humidity: 65 }│
  │◄── 201 Created ──────────────────────│
```

1. Each device has a unique API key assigned (in the demo: `key-abc-123`, `key-def-456`)
2. The gateway sends it in every request as the `X-API-Key` header
3. The server looks up the key in the registry – if it exists, the request passes
4. If the key is missing → 401, if invalid → 403

## How the Backend Discovers Gateway Identity

The server looks up the received API key in the device registry. The key is unique per device, so the key value itself uniquely identifies the gateway – whoever sends `key-abc-123` is `gateway-01`.

In the middleware (`server/middleware/auth.js`):

```javascript
const device = Object.entries(DEVICE_REGISTRY).find(
  ([, dev]) => dev.apiKey === apiKey
);
// device = ["gateway-01", { apiKey: "key-abc-123", name: "..." }]
req.deviceId = device[0]; // "gateway-01"
```

The identity is derived indirectly from the key value. The gateway doesn't send its name – the server determines it from the registry.

## Pros and Cons

- **Simplicity** – implementation in a few lines
- **Broad support** – works in any HTTP client
- Key is transmitted in plaintext in every request → readable without TLS
- Key doesn't expire → compromised forever if leaked
- No protection against replay attacks

## Running

```bash
# Terminal 1 – server (port 3001)
node 01-api-key/server/app.js

# Terminal 2 – gateway (choose a variant)
node 01-api-key/gateway/gateway.js
python 01-api-key/gateway/gateway.py
```

Node-RED: import `gateway/flow.json` → click inject nodes.

## Device Registry


| Device ID  | API Key       | Name                   |
| ---------- | ------------- | ---------------------- |
| gateway-01 | `key-abc-123` | Temperature Sensor Hub |
| gateway-02 | `key-def-456` | Humidity Sensor Hub    |


## Endpoints


| Method | URL              | Auth               | Description          |
| ------ | ---------------- | ------------------ | -------------------- |
| `POST` | `/api/telemetry` | `X-API-Key` header | Store telemetry data |
| `GET`  | `/api/telemetry` | No                 | List stored records  |


