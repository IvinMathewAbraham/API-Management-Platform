import ApiKey from "../models/ApiKey.js";

export const generateKey = async (userId) => {
  const rawKey = await ApiKey.generateKey(userId);
  return rawKey;
};

export const getUserKeys = async (userId) => {
  return ApiKey.find({ userId }).select("-keyHash").sort({ createdAt: -1 });
};

export const revokeKey = async (keyId, userId) => {
  const key = await ApiKey.findOne({ _id: keyId, userId });
  if (!key) {
    const err = new Error("API key not found");
    err.status = 404;
    throw err;
  }
  if (key.status === "revoked") {
    const err = new Error("API key is already revoked");
    err.status = 400;
    throw err;
  }
  key.status = "revoked";
  await key.save();
  return key;
};
