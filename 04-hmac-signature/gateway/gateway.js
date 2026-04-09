const crypto = require("crypto");
const logger = require("../../common/logger");

const BASE_URL = "http://localhost:3004";
const DEVICE_ID = "gateway-01";
const VALID_SECRET = "hmac-secret-gw01-very-long-key";
const WRONG_SECRET = "totally-wrong-secret";

function sign(method, path, body, secret) {
  const timestamp = new Date().toISOString();
  const bodyJson = JSON.stringify(body);
  const stringToSign = `${method}\n${path}\n${timestamp}\n${bodyJson}`;
  const signature = crypto.createHmac("sha256", secret).update(stringToSign).digest("hex");
  return { timestamp, signature, bodyJson };
}

async function sendTelemetry(secret, label) {
  logger.separator(label);
  const body = {
    temperature: +(20 + Math.random() * 10).toFixed(1),
    humidity: +(40 + Math.random() * 40).toFixed(0),
  };
  const path = "/api/telemetry";
  const { timestamp, signature, bodyJson } = sign("POST", path, body, secret);

  logger.gateway.info(`POST ${path}  X-Device-Id: ${DEVICE_ID}`);
  logger.gateway.info(`X-Timestamp: ${timestamp}`);
  logger.gateway.info(`X-Signature: ${signature.slice(0, 16)}...`);
  logger.gateway.info(`Body: ${bodyJson}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": DEVICE_ID,
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body: bodyJson,
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
  await sendTelemetry(VALID_SECRET, "Step 1: Send telemetry with VALID HMAC signature");
  await listTelemetry();
  await sendTelemetry(WRONG_SECRET, "Step 3: Send telemetry with WRONG secret (invalid signature)");
}

main().catch((err) => {
  logger.gateway.error(`Fatal: ${err.message}`);
  process.exit(1);
});
