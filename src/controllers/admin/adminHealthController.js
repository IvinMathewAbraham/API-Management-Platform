import mongoose from "mongoose";
import getRedis from "../../config/redis.js";
import User from "../../models/User.js";
import ApiKey from "../../models/ApiKey.js";
import ApiLog from "../../models/ApiLog.js";

// GET /admin/health
export const getHealth = async (req, res) => {
  // MongoDB
  const dbState = ["disconnected", "connected", "connecting", "disconnecting"];
  const mongoStatus = dbState[mongoose.connection.readyState] || "unknown";

  // Redis
  let redisStatus = "disconnected";
  let redisInfo = null;
  try {
    const redis = getRedis();
    const pong = await redis.ping();
    if (pong === "PONG") {
      redisStatus = "connected";
      const info = await redis.info("memory");
      const usedMatch = info.match(/used_memory_human:(.+)/);
      redisInfo = { usedMemory: usedMatch ? usedMatch[1].trim() : "unknown" };
    }
  } catch { /* ignore */ }

  // Counts
  const [userCount, keyCount, logCount, activeKeys, proUsers] = await Promise.all([
    User.countDocuments(),
    ApiKey.countDocuments(),
    ApiLog.estimatedDocumentCount(),
    ApiKey.countDocuments({ status: "active" }),
    User.countDocuments({ plan: "pro" }),
  ]);

  res.json({
    status: "ok",
    uptime: Math.round(process.uptime()),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    nodeVersion: process.version,
    mongo: mongoStatus,
    redis: redisStatus,
    redisInfo,
    counts: {
      users: userCount,
      proUsers,
      apiKeys: keyCount,
      activeKeys,
      logs: logCount,
    },
    timestamp: new Date().toISOString(),
  });
};
