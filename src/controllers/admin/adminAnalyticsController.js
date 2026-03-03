import mongoose from "mongoose";
import ApiLog from "../../models/ApiLog.js";
import User from "../../models/User.js";

function parseRange(range) {
  const now = new Date();
  let start, groupFormat;
  switch (range) {
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = "%Y-%m-%d";
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = "%Y-%m-%d";
      break;
    case "24h":
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      groupFormat = "%Y-%m-%dT%H:00";
      break;
  }
  return { start, groupFormat };
}

// GET /admin/analytics/overview?range=24h|7d|30d
export const getGlobalOverview = async (req, res) => {
  const { start } = parseRange(req.query.range);

  const [stats] = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        maxLatency: { $max: "$responseTime" },
        errorCount: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
  ]);

  if (!stats) {
    return res.json({ totalRequests: 0, avgLatency: 0, maxLatency: 0, errorRate: 0, uniqueUsers: 0 });
  }

  res.json({
    totalRequests: stats.totalRequests,
    avgLatency: stats.avgLatency ? Math.round(stats.avgLatency * 100) / 100 : 0,
    maxLatency: stats.maxLatency ? Math.round(stats.maxLatency * 100) / 100 : 0,
    errorRate: stats.totalRequests > 0 ? Math.round((stats.errorCount / stats.totalRequests) * 10000) / 100 : 0,
    uniqueUsers: stats.uniqueUsers.length,
  });
};

// GET /admin/analytics/timeseries?range=24h|7d|30d
export const getGlobalTimeseries = async (req, res) => {
  const { start, groupFormat } = parseRange(req.query.range);

  const data = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
        count: { $sum: 1 },
        errorCount: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        avgLatency: { $avg: "$responseTime" },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, time: "$_id", count: 1, errorCount: 1, avgLatency: { $round: ["$avgLatency", 2] } } },
  ]);

  res.json(data);
};

// GET /admin/analytics/top-users?range=24h|7d|30d&limit=10
export const getTopUsers = async (req, res) => {
  const { start } = parseRange(req.query.range);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

  const results = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: "$userId",
        requests: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
      },
    },
    { $sort: { requests: -1 } },
    { $limit: limit },
  ]);

  // Enrich with user details
  const userIds = results.map((r) => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select("name email plan role").lean();
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  const data = results.map((r) => ({
    userId: r._id,
    user: userMap[r._id.toString()] || { name: "Deleted", email: "—" },
    requests: r.requests,
    avgLatency: r.avgLatency ? Math.round(r.avgLatency * 100) / 100 : 0,
    errorRate: r.requests > 0 ? Math.round((r.errors / r.requests) * 10000) / 100 : 0,
  }));

  res.json(data);
};

// GET /admin/analytics/endpoints?range=24h|7d|30d
export const getGlobalEndpoints = async (req, res) => {
  const { start } = parseRange(req.query.range);

  const data = await ApiLog.aggregate([
    { $match: { createdAt: { $gte: start } } },
    {
      $group: {
        _id: "$endpoint",
        count: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        errorCount: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 15 },
    {
      $project: {
        _id: 0,
        endpoint: "$_id",
        count: 1,
        avgLatency: { $round: ["$avgLatency", 2] },
        errorRate: { $round: [{ $multiply: [{ $divide: ["$errorCount", "$count"] }, 100] }, 1] },
      },
    },
  ]);

  res.json(data);
};
