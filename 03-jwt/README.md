# 03 – JWT (JSON Web Token)

Two-phase approach. The gateway first authenticates (device credentials) and receives a short-lived JWT token. It then uses this token for subsequent communication.

## How It Works

```
Gateway                                Server
  │                                      │
  │── POST /api/auth/login ─────────────►│  verifies credentials
  │   { deviceId, secret }               │
  │◄── { token: "eyJ...", expiresIn }──│  issues JWT (1h expiration)
  │                                      │
  │── POST /api/telemetry ─────────────►│  verifies signature + expiration
  │   Authorization: Bearer eyJ...       │
  │   { temperature: 22.5, humidity: 65 }│
  │◄── 201 Created ────────────────────│
```

1. The gateway sends `POST /api/auth/login` with `{ deviceId: "gateway-01", secret: "s3cret-gw01" }`
2. The server verifies credentials and returns a signed JWT token (1 hour expiration)
3. The gateway sends the token in the `Authorization: Bearer <token>` header
4. The server verifies the token signature using a shared secret (HMAC-SHA256) and checks that the token hasn't expired

The JWT token contains a payload (deviceId, device name) and a signature – the server can verify it without a database lookup (stateless).

## How the Backend Discovers Gateway Identity

The identity is stored directly in the JWT payload. When issuing the token, the server embeds the `deviceId`:

```javascript
// At login (auth-controller.js):
const token = jwt.sign({ deviceId, name: device.name }, JWT_SECRET, { expiresIn: "1h" });

// At verification (middleware/auth.js):
const decoded = jwt.verify(token, JWT_SECRET);
req.deviceId = decoded.deviceId; // "gateway-01"
```

The token signature (HMAC-SHA256) guarantees that the payload hasn't been tampered with – the server trusts the identity from the token because it signed the token itself with its secret key. If an attacker modified the `deviceId` in the payload, the signature would not match and the server would reject the token.

## Pros and Cons

- **Token expires** – if leaked, it's only exploitable for a limited time
- **Stateless** – server doesn't need to store sessions, the token carries all information
- **Standard format** – RFC 7519, broad library support
- Need to handle token refresh (simplified in the demo – new login)
- Revoking a token before expiration is complex (requires a blacklist)

## Running

```bash
# Terminal 1 – server (port 3003)
node 03-jwt/server/app.js

# Terminal 2 – gateway (choose a variant)
node 03-jwt/gateway/gateway.js
python 03-jwt/gateway/gateway.py
```

Node-RED: import `gateway/flow.json` → click inject nodes sequentially (1. Login → 2. Send → 3. List → 4. Invalid).

## Device Registry

| Device ID | Secret | Name |
|-----------|--------|------|
| gateway-01 | `s3cret-gw01` | Temperature Sensor Hub |
| gateway-02 | `s3cret-gw02` | Humidity Sensor Hub |

## Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/auth/login` | No (credentials in body) | Login, issue JWT token |
| `POST` | `/api/telemetry` | `Authorization: Bearer` | Store telemetry data |
| `GET` | `/api/telemetry` | No | List stored records |
