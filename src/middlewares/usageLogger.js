import crypto from "crypto";
import ApiLog from "../models/ApiLog.js";

const usageLogger = (req, res, next) => {
  // Generate a unique request ID and attach it
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  // Record request start time
  const startTime = process.hrtime.bigint();

  res.on("finish", () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1e6; // nanoseconds → milliseconds

    ApiLog.create({
      userId: req.user._id,
      apiKeyId: req.apiKey._id,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
      responseTime: Math.round(responseTime * 100) / 100,
      ip: req.ip || req.headers["x-forwarded-for"] || null,
      userAgent: req.get("user-agent") || null,
      responseSize: parseInt(res.get("content-length"), 10) || null,
      requestId,
    }).catch((err) => {
      console.error("usageLogger: failed to write ApiLog", err.message);
    });
  });

  next();
};

export default usageLogger;
