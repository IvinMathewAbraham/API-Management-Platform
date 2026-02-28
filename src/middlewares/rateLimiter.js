import redis from "../config/redis.js";

const PLAN_LIMITS = {
  free: 100,
  pro: 1000,
};

const getWindowKey = (apiKeyId) => {
  const now = new Date();
  const window =
    now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    String(now.getUTCHours()).padStart(2, "0");
  return `rate:${apiKeyId}:${window}`;
};

const rateLimiter = async (req, res, next) => {
  const apiKeyId = req.apiKey._id.toString();
  const plan = req.user.plan || "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  const key = getWindowKey(apiKeyId);
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
