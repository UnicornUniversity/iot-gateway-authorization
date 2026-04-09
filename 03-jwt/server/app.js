const express = require("express");
const logger = require("../../common/logger");
const jwtAuth = require("./middleware/auth");
const authController = require("./api/controller/auth-controller");
const telemetryController = require("./api/controller/telemetry-controller");

const app = express();
const PORT = 3003;

app.use(express.json());

app.use((req, res, next) => {
  logger.server.info(`${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authController);
app.post("/api/telemetry", jwtAuth);
app.use("/api/telemetry", telemetryController);

app.listen(PORT, () => {
  logger.separator("03 – JWT Authentication");
  logger.server.info(`Listening on http://localhost:${PORT}`);
  logger.server.info("Login: POST /api/auth/login { deviceId, secret }");
});
