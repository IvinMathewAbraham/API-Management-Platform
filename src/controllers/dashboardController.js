import ApiLog from "../models/ApiLog.js";

const PLAN_LIMITS = {
  free: 100,
  pro: 1000,
};

export const getUsage = async (req, res) => {
  const userId = req.user._id;
  const plan = req.user.plan || "free";
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  // Start of the current UTC hour
  const now = new Date();
  const hourStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())
  );

  const [totalRequests, requestsThisHour] = await Promise.all([
    ApiLog.countDocuments({ userId }),
    ApiLog.countDocuments({ userId, createdAt: { $gte: hourStart } }),
  ]);

  const remaining = Math.max(0, limit - requestsThisHour);

  res.status(200).json({
    plan,
    limit,
    totalRequests,
    requestsThisHour,
    remaining,
  });
};
