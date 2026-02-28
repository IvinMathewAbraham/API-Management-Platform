import ApiLog from "../models/ApiLog.js";

const usageLogger = (req, res, next) => {
  res.on("finish", () => {
    ApiLog.create({
      userId: req.user._id,
      apiKeyId: req.apiKey._id,
      endpoint: req.originalUrl,
      method: req.method,
      statusCode: res.statusCode,
    }).catch((err) => {
      console.error("usageLogger: failed to write ApiLog", err.message);
    });
  });

  next();
};

export default usageLogger;
