const jwt = require("jsonwebtoken");
const logger = require("../../../common/logger");

const JWT_SECRET = "demo-jwt-secret-do-not-use-in-production";

function jwtAuth(req, res, next) {
  const header = req.headers["authorization"];

  if (!header || !header.startsWith("Bearer ")) {
    logger.server.warn("Rejected: missing or malformed Authorization header");
    return res.status(401).json({ error: "Missing or malformed Authorization header" });
  }

  const token = header.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.server.success(`Authorized device: ${decoded.deviceId} (${decoded.name})`);
    req.deviceId = decoded.deviceId;
    next();
  } catch (err) {
    logger.server.warn(`Rejected: invalid token – ${err.message}`);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = jwtAuth;
