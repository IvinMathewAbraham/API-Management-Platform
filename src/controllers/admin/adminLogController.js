import ApiLog from "../../models/ApiLog.js";

// GET /admin/logs?page=1&limit=50&userId=&statusCode=&endpoint=&method=&from=&to=
export const getLogs = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.statusCode) filter.statusCode = parseInt(req.query.statusCode, 10);
  if (req.query.endpoint) filter.endpoint = new RegExp(req.query.endpoint, "i");
  if (req.query.method) filter.method = req.query.method.toUpperCase();
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const [logs, total] = await Promise.all([
    ApiLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email")
      .populate("apiKeyId", "keyHash")
      .lean(),
    ApiLog.countDocuments(filter),
  ]);

  const data = logs.map((l) => ({
    _id: l._id,
    endpoint: l.endpoint,
    method: l.method,
    statusCode: l.statusCode,
    responseTime: l.responseTime,
    ip: l.ip,
    userAgent: l.userAgent,
    requestId: l.requestId,
    user: l.userId ? { name: l.userId.name, email: l.userId.email } : null,
    maskedKey: l.apiKeyId ? `${l.apiKeyId.keyHash.slice(0, 8)}...` : null,
    createdAt: l.createdAt,
  }));

  res.json({ logs: data, total, page, pages: Math.ceil(total / limit) });
};

// GET /admin/logs/stats — quick summary
export const getLogStats = async (req, res) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [overall, recent] = await Promise.all([
    ApiLog.countDocuments(),
    ApiLog.aggregate([
      { $match: { createdAt: { $gte: last24h } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgLatency: { $avg: "$responseTime" },
          errors: { $sum: { $cond: [{ $gte: ["$statusCode", 400] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const stats = recent[0] || { total: 0, avgLatency: 0, errors: 0 };

  res.json({
    totalLogs: overall,
    last24h: {
      requests: stats.total,
      avgLatency: stats.avgLatency ? Math.round(stats.avgLatency * 100) / 100 : 0,
      errors: stats.errors,
      errorRate: stats.total > 0 ? Math.round((stats.errors / stats.total) * 10000) / 100 : 0,
    },
  });
};
