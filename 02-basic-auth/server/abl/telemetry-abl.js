const crypto = require("crypto");
const dao = require("../dao/telemetry-dao");

function create(dtoIn, deviceId) {
  if (typeof dtoIn.temperature !== "number") {
    throw { status: 400, message: "Missing or invalid 'temperature' (number required)" };
  }
  if (typeof dtoIn.humidity !== "number") {
    throw { status: 400, message: "Missing or invalid 'humidity' (number required)" };
  }

  const record = {
    id: crypto.randomUUID(),
    deviceId,
    timestamp: new Date().toISOString(),
    temperature: dtoIn.temperature,
    humidity: dtoIn.humidity,
  };

  return dao.create(record);
}

function list() {
  return dao.list();
}

module.exports = { create, list };
