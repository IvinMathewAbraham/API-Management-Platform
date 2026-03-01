import mongoose from "mongoose";
import ApiLog from "../models/ApiLog.js";
import ApiKey from "../models/ApiKey.js";

// ── Helpers ─────────────────────────────────────────────

/** Convert a range query-string into a Date & grouping format */
function parseRange(range) {
  const now = new Date();
  let start;
  let groupFormat;   // MongoDB date-to-string format
  let bucketLabel;

  switch (range) {
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupFormat = "%Y-%m-%d";
      bucketLabel = "day";
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      groupFormat = "%Y-%m-%d";
      bucketLabel = "day";
      break;
    case "24h":
    default:
      start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      groupFormat = "%Y-%m-%dT%H:00";
      bucketLabel = "hour";
      break;
  }

  return { start, groupFormat, bucketLabel };
}

// ── 1. Time-series ──────────────────────────────────────
// GET /dashboard/analytics/timeseries?range=24h|7d|30d
export const getTimeseries = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start, groupFormat } = parseRange(req.query.range);

  const pipeline = [
    { $match: { userId, createdAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
        count: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        errorCount: {
          $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        time: "$_id",
        count: 1,
        avgLatency: { $round: ["$avgLatency", 2] },
        errorCount: 1,
      },
    },
  ];

  const data = await ApiLog.aggregate(pipeline);
  res.json(data);
};

// ── 2. Per-endpoint breakdown ──────────────────────────
// GET /dashboard/analytics/endpoints?range=24h|7d|30d
export const getEndpoints = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start } = parseRange(req.query.range || "30d");

  const pipeline = [
    { $match: { userId, createdAt: { $gte: start } } },
    {
      $group: {
        _id: "$endpoint",
        count: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        errorCount: {
          $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
    {
      $project: {
        _id: 0,
        endpoint: "$_id",
        count: 1,
        avgLatency: { $round: ["$avgLatency", 2] },
        errorRate: {
          $round: [
            { $multiply: [{ $divide: ["$errorCount", "$count"] }, 100] },
            1,
          ],
        },
      },
    },
  ];

  const data = await ApiLog.aggregate(pipeline);
  res.json(data);
};

// ── 3. Status-code distribution ────────────────────────
// GET /dashboard/analytics/status-codes?range=24h|7d|30d
export const getStatusCodes = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start } = parseRange(req.query.range || "24h");

  const pipeline = [
    { $match: { userId, createdAt: { $gte: start } } },
    { $group: { _id: "$statusCode", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, statusCode: "$_id", count: 1 } },
  ];

  const data = await ApiLog.aggregate(pipeline);
  res.json(data);
};

// ── 4. Latency stats ──────────────────────────────────
// GET /dashboard/analytics/latency?range=24h|7d|30d
export const getLatency = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start, groupFormat } = parseRange(req.query.range);

  const pipeline = [
    { $match: { userId, createdAt: { $gte: start }, responseTime: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
        avg: { $avg: "$responseTime" },
        min: { $min: "$responseTime" },
        max: { $max: "$responseTime" },
        p95: { $percentile: { input: "$responseTime", p: [0.95], method: "approximate" } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        time: "$_id",
        avg: { $round: ["$avg", 2] },
        min: { $round: ["$min", 2] },
        max: { $round: ["$max", 2] },
        p95: { $round: [{ $arrayElemAt: ["$p95", 0] }, 2] },
      },
    },
  ];

  try {
    const data = await ApiLog.aggregate(pipeline);
    res.json(data);
  } catch {
    // Fallback for MongoDB < 7 (no $percentile)
    const fallbackPipeline = [
      { $match: { userId, createdAt: { $gte: start }, responseTime: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          avg: { $avg: "$responseTime" },
          min: { $min: "$responseTime" },
          max: { $max: "$responseTime" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          time: "$_id",
          avg: { $round: ["$avg", 2] },
          min: { $round: ["$min", 2] },
          max: { $round: ["$max", 2] },
          p95: "$max", // crude approximation
        },
      },
    ];
    const data = await ApiLog.aggregate(fallbackPipeline);
    res.json(data);
  }
};

// ── 5. Per-key breakdown ──────────────────────────────
// GET /dashboard/analytics/keys?range=24h|7d|30d
export const getKeys = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start } = parseRange(req.query.range || "30d");

  const pipeline = [
    { $match: { userId, createdAt: { $gte: start } } },
    {
      $group: {
        _id: "$apiKeyId",
        count: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        errorCount: {
          $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ];

  const results = await ApiLog.aggregate(pipeline);

  // Enrich with key metadata
  const keyIds = results.map((r) => r._id);
  const keys = await ApiKey.find({ _id: { $in: keyIds } }).select("keyHash status createdAt").lean();
  const keyMap = Object.fromEntries(keys.map((k) => [k._id.toString(), k]));

  const data = results.map((r) => {
    const key = keyMap[r._id.toString()];
    return {
      apiKeyId: r._id,
      maskedKey: key ? `${key.keyHash.slice(0, 8)}...${key.keyHash.slice(-4)}` : "unknown",
      status: key?.status || "unknown",
      count: r.count,
      avgLatency: r.avgLatency ? Math.round(r.avgLatency * 100) / 100 : null,
      errorRate: r.count > 0 ? Math.round((r.errorCount / r.count) * 10000) / 100 : 0,
    };
  });

  res.json(data);
};

// ── 6. Recent requests log ────────────────────────────
// GET /dashboard/analytics/recent?limit=20
export const getRecent = async (req, res) => {
  const userId = req.user._id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const data = await ApiLog.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("endpoint method statusCode responseTime ip createdAt requestId")
    .lean();

  res.json(data);
};

// ── 7. Error summary ─────────────────────────────────
// GET /dashboard/analytics/errors?range=24h|7d|30d
export const getErrors = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start } = parseRange(req.query.range || "24h");

  const [summary] = await ApiLog.aggregate([
    { $match: { userId, createdAt: { $gte: start } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        client4xx: {
          $sum: {
            $cond: [
              { $and: [{ $gte: ["$statusCode", 400] }, { $lt: ["$statusCode", 500] }] },
              1,
              0,
            ],
          },
        },
        server5xx: { $sum: { $cond: [{ $gte: ["$statusCode", 500] }, 1, 0] } },
      },
    },
  ]);

  if (!summary) {
    return res.json({ total: 0, errors: 0, errorRate: 0, client4xx: 0, server5xx: 0, topErrorEndpoints: [] });
  }

  // Top error endpoints
  const topErrorEndpoints = await ApiLog.aggregate([
    { $match: { userId, createdAt: { $gte: start }, statusCode: { $gte: 400 } } },
    { $group: { _id: "$endpoint", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    { $project: { _id: 0, endpoint: "$_id", count: 1 } },
  ]);

  res.json({
    total: summary.total,
    errors: summary.errors,
    errorRate: summary.total > 0 ? Math.round((summary.errors / summary.total) * 10000) / 100 : 0,
    client4xx: summary.client4xx,
    server5xx: summary.server5xx,
    topErrorEndpoints,
  });
};

// ── 8. Overview (aggregate stats for dashboard cards) ─
// GET /dashboard/analytics/overview?range=24h|7d|30d
export const getOverview = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { start } = parseRange(req.query.range || "24h");

  const [stats] = await ApiLog.aggregate([
    { $match: { userId, createdAt: { $gte: start } } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        avgLatency: { $avg: "$responseTime" },
        maxLatency: { $max: "$responseTime" },
        minLatency: { $min: "$responseTime" },
        errorCount: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
      },
    },
  ]);

  if (!stats) {
    return res.json({
      totalRequests: 0,
      avgLatency: 0,
      maxLatency: 0,
      minLatency: 0,
      errorRate: 0,
    });
  }

  res.json({
    totalRequests: stats.totalRequests,
    avgLatency: stats.avgLatency ? Math.round(stats.avgLatency * 100) / 100 : 0,
    maxLatency: stats.maxLatency ? Math.round(stats.maxLatency * 100) / 100 : 0,
    minLatency: stats.minLatency ? Math.round(stats.minLatency * 100) / 100 : 0,
    errorRate:
      stats.totalRequests > 0
        ? Math.round((stats.errorCount / stats.totalRequests) * 10000) / 100
        : 0,
  });
};
