import ApiKey from "../models/ApiKey.js";

export const generateKey = async (userId) => {
  const rawKey = await ApiKey.generateKey(userId);
  return rawKey;
};

export const getUserKeys = async (userId) => {
  return ApiKey.find({ userId }).select("-keyHash").sort({ createdAt: -1 });
};
