const logger = require("../../common/logger");

const BASE_URL = "http://localhost:3002";
const VALID_CREDENTIALS = Buffer.from("gateway-01:s3cret-gw01").toString("base64");
const INVALID_CREDENTIALS = Buffer.from("gateway-01:wrong-password").toString("base64");

async function sendTelemetry(credentials, label) {
  logger.separator(label);
  const body = {
    temperature: +(20 + Math.random() * 10).toFixed(1),
    humidity: +(40 + Math.random() * 40).toFixed(0),
  };
  logger.gateway.info(`POST /api/telemetry  Authorization: Basic ${credentials}`);
  logger.gateway.info(`Body: ${JSON.stringify(body)}`);

  const res = await fetch(`${BASE_URL}/api/telemetry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
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
  logger.separator("List stored telemetry (GET – no auth required)");
  logger.gateway.info("GET /api/telemetry");

  const res = await fetch(`${BASE_URL}/api/telemetry`);
  const data = await res.json();
  logger.gateway.success(`${res.status} OK – ${data.length} record(s)`);
  console.table(data.map(({ id, deviceId, temperature, humidity }) => ({ id: id.slice(0, 8), deviceId, temperature, humidity })));
}

async function main() {
  await sendTelemetry(VALID_CREDENTIALS, "Step 1: Send telemetry with VALID credentials");
  await listTelemetry();
  await sendTelemetry(INVALID_CREDENTIALS, "Step 3: Send telemetry with INVALID credentials");
}

main().catch((err) => {
  logger.gateway.error(`Fatal: ${err.message}`);
  process.exit(1);
});
