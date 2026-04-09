const crypto = require("crypto");
const logger = require("../../../common/logger");

const DEVICE_REGISTRY = {
  "gateway-01": { secret: "hmac-secret-gw01-very-long-key", name: "Temperature Sensor Hub" },
  "gateway-02": { secret: "hmac-secret-gw02-very-long-key", name: "Humidity Sensor Hub" },
};

const MAX_AGE_MS = 30_000;

function hmacAuth(req, res, next) {
  const deviceId = req.headers["x-device-id"];
  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];

  if (!deviceId || !timestamp || !signature) {
    logger.server.warn("Rejected: missing X-Device-Id, X-Timestamp, or X-Signature header");
    return res.status(401).json({ error: "Missing required HMAC headers (X-Device-Id, X-Timestamp, X-Signature)" });
  }

  const age = Date.now() - new Date(timestamp).getTime();
  if (Number.isNaN(age) || age > MAX_AGE_MS) {
    logger.server.warn(`Rejected: request expired (age ${age}ms, max ${MAX_AGE_MS}ms)`);
    return res.status(401).json({ error: "Request expired (timestamp too old)" });
  }

  const device = DEVICE_REGISTRY[deviceId];
  if (!device) {
    logger.server.warn(`Rejected: unknown device "${deviceId}"`);
    return res.status(403).json({ error: "Unknown device" });
  }

  const stringToSign = `${req.method}\n${req.originalUrl}\n${timestamp}\n${JSON.stringify(req.body)}`;
  const expected = crypto.createHmac("sha256", device.secret).update(stringToSign).digest("hex");

  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    logger.server.warn(`Rejected: invalid HMAC signature for device "${deviceId}"`);
    return res.status(403).json({ error: "Invalid signature" });
  }

  logger.server.success(`Authorized device: ${deviceId} (${device.name}) – HMAC valid`);
  req.deviceId = deviceId;
  next();
}

module.exports = hmacAuth;
