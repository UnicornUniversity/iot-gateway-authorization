const logger = require("../../../common/logger");

const DEVICE_REGISTRY = {
  "gateway-01": { apiKey: "key-abc-123", name: "Temperature Sensor Hub" },
  "gateway-02": { apiKey: "key-def-456", name: "Humidity Sensor Hub" },
};

function apiKeyAuth(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    logger.server.warn("Rejected: missing X-API-Key header");
    return res.status(401).json({ error: "Missing X-API-Key header" });
  }

  const device = Object.entries(DEVICE_REGISTRY).find(
    ([, dev]) => dev.apiKey === apiKey
  );

  if (!device) {
    logger.server.warn(`Rejected: invalid API key "${apiKey}"`);
    return res.status(403).json({ error: "Invalid API key" });
  }

  const [deviceId, deviceInfo] = device;
  logger.server.success(`Authorized device: ${deviceId} (${deviceInfo.name})`);
  req.deviceId = deviceId;
  next();
}

module.exports = apiKeyAuth;
