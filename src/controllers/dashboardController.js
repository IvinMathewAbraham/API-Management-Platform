import ApiLog from "../models/ApiLog.js";
import getRedis from "../config/redis.js";
import { getWindowKey, PLAN_LIMITS } from "../middlewares/rateLimiter.js";

export const getUsage = async (req, res) => {
  const userId = req.user._id;
  const plan = req.user.plan || "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const redis = getRedis();
  const key = getWindowKey(userId.toString());

  // Read the same Redis counter the rate limiter uses
  const redisCount = await redis.get(key);
  const requestsThisHour = redisCount ? parseInt(redisCount, 10) : 0;

  const totalRequests = await ApiLog.countDocuments({ userId });

  const remaining = Math.max(0, limit - requestsThisHour);

  res.status(200).json({
    plan,
    limit,
    totalRequests,
    requestsThisHour,
    remaining,
  });
};
