import { generateKey, getUserKeys } from "../services/apiKeyService.js";

export const generateApiKey = async (req, res) => {
  const rawKey = await generateKey(req.user._id);
  res.status(201).json({
    message: "API key generated. Store this key safely — it will not be shown again.",
    apiKey: rawKey,
  });
};

export const getMyKeys = async (req, res) => {
  const keys = await getUserKeys(req.user._id);
  res.status(200).json({ keys });
};
