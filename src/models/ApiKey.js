import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const apiKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    keyHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "revoked"], default: "active" }
  },
  { timestamps: true }
); 

apiKeySchema.statics.generateKey = async function (userId) {
  const rawKey = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const keyHash = await bcrypt.hash(rawKey, 10);
  await this.create({ userId, keyHash });
  return rawKey;
};

apiKeySchema.statics.validateKey = async function (rawKey) {
  const keyHash = await bcrypt.hash(rawKey, 10);
  const apiKey = await this.findOne({ keyHash, status: "active" });
  return !!apiKey;
};

export default mongoose.model("ApiKey", apiKeySchema);