const { Router } = require("express");
const jwt = require("jsonwebtoken");
const logger = require("../../../../common/logger");

const JWT_SECRET = "demo-jwt-secret-do-not-use-in-production";

const DEVICE_REGISTRY = {
  "gateway-01": { secret: "s3cret-gw01", name: "Temperature Sensor Hub" },
  "gateway-02": { secret: "s3cret-gw02", name: "Humidity Sensor Hub" },
};

const router = Router();

router.post("/login", (req, res) => {
  const { deviceId, secret } = req.body;

  if (!deviceId || !secret) {
    logger.server.warn("Login rejected: missing deviceId or secret");
    return res.status(400).json({ error: "Missing deviceId or secret" });
  }

  const device = DEVICE_REGISTRY[deviceId];
  if (!device || device.secret !== secret) {
    logger.server.warn(`Login rejected: invalid credentials for "${deviceId}"`);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ deviceId, name: device.name }, JWT_SECRET, { expiresIn: "1h" });
  logger.server.success(`Token issued for ${deviceId} (expires in 1h)`);
  res.json({ token, expiresIn: "1h" });
});

module.exports = router;
