const express = require("express");
const logger = require("../../common/logger");
const apiKeyAuth = require("./middleware/auth");
const telemetryController = require("./api/controller/telemetry-controller");

const app = express();
const PORT = 3001;

app.use(express.json());

app.use((req, res, next) => {
  logger.server.info(`${req.method} ${req.url}`);
  next();
});

app.post("/api/telemetry", apiKeyAuth);
app.use("/api/telemetry", telemetryController);

app.listen(PORT, () => {
  logger.separator("01 – API Key Authentication");
  logger.server.info(`Listening on http://localhost:${PORT}`);
  logger.server.info("Authorized keys: key-abc-123 (gateway-01), key-def-456 (gateway-02)");
});
