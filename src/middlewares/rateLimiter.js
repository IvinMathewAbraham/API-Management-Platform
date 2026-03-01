import getRedis from "../config/redis.js";
import ApiLog from "../models/ApiLog.js";
import crypto from "crypto";

export const PLAN_LIMITS = {
  free: 100,
  pro: 1000,
};

export const getRateWindow = () => {
  const now = new Date();
  return (
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    String(now.getUTCHours()).padStart(2, "0")
  );
};

export const getWindowKey = (userId) => {
  return `rate:${userId}:${getRateWindow()}`;
};

const rateLimiter = async (req, res, next) => {
  const redis = getRedis();
  const userId = req.user._id.toString();
  const plan = req.user.plan || "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const key = getWindowKey(userId);
  const count = await redis.incr(key);

  if (count === 1) {
    // First request in this window — set TTL to expire at the end of the hour
    await redis.expire(key, 3600);
  }

  const remaining = Math.max(0, limit - count);

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);

  if (count > limit) {
    // Log the 429 to ApiLog so it shows in analytics
    if (req.user && req.apiKey) {
      ApiLog.create({
        userId: req.user._id,
        apiKeyId: req.apiKey._id,
        endpoint: req.originalUrl,
        method: req.method,
        statusCode: 429,
        responseTime: 0,
        ip: req.ip || req.headers["x-forwarded-for"] || null,
        userAgent: req.get("user-agent") || null,
        requestId: crypto.randomUUID(),
      }).catch(() => {});
    }

    return res.status(429).json({
      message: "Rate limit exceeded. Try again next hour.",
      limit,
      remaining: 0,
    });
  }

  next();
};

export default rateLimiter;
