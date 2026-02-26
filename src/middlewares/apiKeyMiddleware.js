import ApiKey from "../models/ApiKey.js";

const apiKeyMiddleware = async (req, res, next) => {
  const rawKey = req.headers["x-api-key"];

  if (!rawKey) {
    return res.status(401).json({ message: "API key required" });
  }

  const apiKeyDoc = await ApiKey.validateKey(rawKey);
  if (!apiKeyDoc) {
    return res.status(401).json({ message: "Invalid or revoked API key" });
  }

  req.apiKey = apiKeyDoc;
  req.user = apiKeyDoc.userId; // populated User document
  next();
};

export default apiKeyMiddleware;
