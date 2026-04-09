const logger = require("../../../common/logger");

const DEVICE_REGISTRY = {
  "gateway-01": { secret: "s3cret-gw01", name: "Temperature Sensor Hub" },
  "gateway-02": { secret: "s3cret-gw02", name: "Humidity Sensor Hub" },
};

function basicAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Basic ")) {
    logger.server.warn("Rejected: missing Authorization header");
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const decoded = Buffer.from(header.slice(6), "base64").toString("utf-8");
  const [deviceId, secret] = decoded.split(":");

  const device = DEVICE_REGISTRY[deviceId];

  if (!device || device.secret !== secret) {
    logger.server.warn(`Rejected: invalid credentials for "${deviceId}"`);
    return res.status(403).json({ error: "Invalid credentials" });
  }

  logger.server.success(`Authorized device: ${deviceId} (${device.name})`);
  req.deviceId = deviceId;
  next();
}

module.exports = basicAuth;
