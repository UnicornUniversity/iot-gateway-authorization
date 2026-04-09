const logger = require("../../common/logger");

const BASE_URL = "http://localhost:3001";
const VALID_API_KEY = "key-abc-123";
const INVALID_API_KEY = "key-WRONG-000";

async function sendTelemetry(apiKey, label) {
  logger.separator(label);
  const body = {
    temperature: +(20 + Math.random() * 10).toFixed(1),
    humidity: +(40 + Math.random() * 40).toFixed(0),
  };
  logger.gateway.info(`POST /api/telemetry  X-API-Key: ${apiKey}`);
  logger.gateway.info(`Body: ${JSON.stringify(body)}`);

  const res = await fetch(`${BASE_URL}/api/telemetry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
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
  await sendTelemetry(VALID_API_KEY, "Step 1: Send telemetry with VALID API key");
  await listTelemetry();
  await sendTelemetry(INVALID_API_KEY, "Step 3: Send telemetry with INVALID API key");
}

main().catch((err) => {
  logger.gateway.error(`Fatal: ${err.message}`);
  process.exit(1);
});
