const { Router } = require("express");
const abl = require("../../abl/telemetry-abl");
const logger = require("../../../../common/logger");

const router = Router();

router.post("/", (req, res) => {
  try {
    const deviceId = req.deviceId || "unknown";
    const record = abl.create(req.body, deviceId);
    logger.server.success(`Telemetry saved: ${record.id} from ${deviceId}`);
    res.status(201).json(record);
  } catch (err) {
    const status = err.status || 500;
    logger.server.error(`Create failed: ${err.message}`);
    res.status(status).json({ error: err.message });
  }
});

router.get("/", (req, res) => {
  try {
    const records = abl.list();
    logger.server.info(`Listing ${records.length} telemetry record(s)`);
    res.json(records);
  } catch (err) {
    logger.server.error(`List failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
