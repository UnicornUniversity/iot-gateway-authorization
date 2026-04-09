const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");
const logger = require("../../common/logger");
const mtlsAuth = require("./middleware/auth");
const telemetryController = require("./api/controller/telemetry-controller");

const app = express();
const PORT = 3005;

const CERT_DIR = path.join(__dirname, "..", "certs");

if (!fs.existsSync(path.join(CERT_DIR, "ca-cert.pem"))) {
  console.error("Certificates not found! Run: bash 05-mtls/generate-certs.sh");
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(path.join(CERT_DIR, "server-key.pem")),
  cert: fs.readFileSync(path.join(CERT_DIR, "server-cert.pem")),
  ca: [fs.readFileSync(path.join(CERT_DIR, "ca-cert.pem"))],
  requestCert: true,
  rejectUnauthorized: false,
};

app.use(express.json());

app.use((req, res, next) => {
  logger.server.info(`${req.method} ${req.url}`);
  next();
});

app.post("/api/telemetry", mtlsAuth);
app.use("/api/telemetry", telemetryController);

https.createServer(httpsOptions, app).listen(PORT, () => {
  logger.separator("05 – Mutual TLS (mTLS) Authentication");
  logger.server.info(`HTTPS server listening on https://localhost:${PORT}`);
  logger.server.info("Requires client certificate signed by IoT Demo CA");
});
