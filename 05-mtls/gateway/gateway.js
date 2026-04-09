const https = require("https");
const fs = require("fs");
const path = require("path");
const logger = require("../../common/logger");

const PORT = 3005;
const CERT_DIR = path.join(__dirname, "..", "certs");

const ca = fs.readFileSync(path.join(CERT_DIR, "ca-cert.pem"));
const validCert = fs.readFileSync(path.join(CERT_DIR, "client-cert.pem"));
const validKey = fs.readFileSync(path.join(CERT_DIR, "client-key.pem"));
const unauthorizedCert = fs.readFileSync(path.join(CERT_DIR, "unauthorized-cert.pem"));
const unauthorizedKey = fs.readFileSync(path.join(CERT_DIR, "unauthorized-key.pem"));

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function sendTelemetry(cert, key, label) {
  logger.separator(label);
  const body = {
    temperature: +(20 + Math.random() * 10).toFixed(1),
    humidity: +(40 + Math.random() * 40).toFixed(0),
  };
  logger.gateway.info(`POST /api/telemetry (with client certificate)`);
  logger.gateway.info(`Body: ${JSON.stringify(body)}`);

  try {
    const { status, data } = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/telemetry",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      ca, cert, key,
      rejectUnauthorized: false,
    }, body);

    if (status === 201) {
      logger.gateway.success(`${status} Created – id: ${data.id}`);
    } else {
      logger.gateway.error(`${status} – ${data.error}`);
    }
  } catch (err) {
    logger.gateway.error(`Connection failed: ${err.message}`);
  }
}

async function listTelemetry() {
  logger.separator("List stored telemetry (GET – mTLS not required for GET)");
  logger.gateway.info("GET /api/telemetry");

  const { status, data } = await request({
    hostname: "localhost",
    port: PORT,
    path: "/api/telemetry",
    method: "GET",
    ca,
    cert: validCert,
    key: validKey,
  });

  logger.gateway.success(`${status} OK – ${data.length} record(s)`);
  console.table(data.map(({ id, deviceId, temperature, humidity }) => ({ id: id.slice(0, 8), deviceId, temperature, humidity })));
}

async function main() {
  await sendTelemetry(validCert, validKey, "Step 1: Send telemetry with VALID client certificate");
  await listTelemetry();
  await sendTelemetry(unauthorizedCert, unauthorizedKey, "Step 3: Send telemetry with UNAUTHORIZED certificate");
}

main().catch((err) => {
  logger.gateway.error(`Fatal: ${err.message}`);
  process.exit(1);
});
