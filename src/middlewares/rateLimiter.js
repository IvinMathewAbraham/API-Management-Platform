import getRedis from "../config/redis.js";

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
    return res.status(429).json({
      message: "Rate limit exceeded. Try again next hour.",
      limit,
      remaining: 0,
    });
  }

  next();
};

export default rateLimiter;
