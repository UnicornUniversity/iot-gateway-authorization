const logger = require("../../common/logger");

const BASE_URL = "http://localhost:3003";

async function login() {
  logger.separator("Step 1: Login (get JWT token)");
  const body = { deviceId: "gateway-01", secret: "s3cret-gw01" };
  logger.gateway.info("POST /api/auth/login");
  logger.gateway.info(`Body: ${JSON.stringify(body)}`);

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (res.ok) {
    logger.gateway.success(`${res.status} OK – token received (expires: ${data.expiresIn})`);
    return data.token;
  }
  logger.gateway.error(`${res.status} – ${data.error}`);
  throw new Error("Login failed");
}

async function sendTelemetry(token, label) {
  logger.separator(label);
  const body = {
    temperature: +(20 + Math.random() * 10).toFixed(1),
    humidity: +(40 + Math.random() * 40).toFixed(0),
  };
  logger.gateway.info(`POST /api/telemetry  Authorization: Bearer ${token.slice(0, 20)}…`);
  logger.gateway.info(`Body: ${JSON.stringify(body)}`);

  const res = await fetch(`${BASE_URL}/api/telemetry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (res.ok) {
    logger.gateway.success(`${res.status} Created – id: ${data.id}`);
  } else {
    logger.gateway.error(`${res.status} – ${data.error}`);
  }
}

async function listTelemetry() {
  logger.separator("Step 3: List stored telemetry (GET – no auth required)");
  logger.gateway.info("GET /api/telemetry");

  const res = await fetch(`${BASE_URL}/api/telemetry`);
  const data = await res.json();
  logger.gateway.success(`${res.status} OK – ${data.length} record(s)`);
  console.table(data.map(({ id, deviceId, temperature, humidity }) => ({ id: id.slice(0, 8), deviceId, temperature, humidity })));
}

async function main() {
  const token = await login();
  await sendTelemetry(token, "Step 2: Send telemetry with VALID token");
  await listTelemetry();
  await sendTelemetry("invalid-token-xxx", "Step 4: Send telemetry with INVALID token");
}

main().catch((err) => {
  logger.gateway.error(`Fatal: ${err.message}`);
  process.exit(1);
});
