const express = require("express");
const logger = require("../../common/logger");
const basicAuth = require("./middleware/auth");
const telemetryController = require("./api/controller/telemetry-controller");

const app = express();
const PORT = 3002;

app.use(express.json());

app.use((req, res, next) => {
  logger.server.info(`${req.method} ${req.url}`);
  next();
});

app.post("/api/telemetry", basicAuth);
app.use("/api/telemetry", telemetryController);

app.listen(PORT, () => {
  logger.separator("02 – HTTP Basic Authentication");
  logger.server.info(`Listening on http://localhost:${PORT}`);
  logger.server.info("Credentials: gateway-01:s3cret-gw01, gateway-02:s3cret-gw02");
});
