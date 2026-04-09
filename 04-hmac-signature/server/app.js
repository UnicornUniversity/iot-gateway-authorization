const express = require("express");
const logger = require("../../common/logger");
const hmacAuth = require("./middleware/auth");
const telemetryController = require("./api/controller/telemetry-controller");

const app = express();
const PORT = 3004;

app.use(express.json());

app.use((req, res, next) => {
  logger.server.info(`${req.method} ${req.url}`);
  next();
});

app.post("/api/telemetry", hmacAuth);
app.use("/api/telemetry", telemetryController);

app.listen(PORT, () => {
  logger.separator("04 – HMAC Request Signing");
  logger.server.info(`Listening on http://localhost:${PORT}`);
  logger.server.info("Signing: HMAC-SHA256( METHOD\\nPATH\\nTIMESTAMP\\nBODY )");
  logger.server.info("Headers: X-Device-Id, X-Timestamp, X-Signature");
});
