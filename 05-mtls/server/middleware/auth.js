const logger = require("../../../common/logger");

function mtlsAuth(req, res, next) {
  const cert = req.socket.getPeerCertificate();

  if (!req.client.authorized) {
    logger.server.warn(`Rejected: client certificate not authorized (${req.client.authorizationError || "no cert"})`);
    return res.status(401).json({ error: "Client certificate required and must be signed by trusted CA" });
  }

  if (!cert || !cert.subject) {
    logger.server.warn("Rejected: no client certificate provided");
    return res.status(401).json({ error: "Client certificate required" });
  }

  const deviceId = cert.subject.CN;
  logger.server.success(`Authorized device: ${deviceId} (O=${cert.subject.O})`);
  req.deviceId = deviceId;
  next();
}

module.exports = mtlsAuth;
