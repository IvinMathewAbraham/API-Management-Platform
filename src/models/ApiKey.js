import mongoose from "mongoose";
import crypto from "crypto";

// SHA256 is deterministic — lets us look up a key by its hash in O(1).
// bcrypt is intentionally non-deterministic (random salt), so it cannot be
// used for lookup without scanning every row; it is appropriate only for
// passwords. API keys must use a stable hash like SHA256.

const hashKey = (rawKey) => crypto.createHash("sha256").update(rawKey).digest("hex");

const apiKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, default: "********" },
    status: { type: String, enum: ["active", "revoked"], default: "active" },
  },
  { timestamps: true }
);

// Returns the raw key (shown to the developer once). Only the hash is persisted.
apiKeySchema.statics.generateKey = async function (userId) {
  const rawKey = crypto.randomBytes(32).toString("hex");
  const keyHash = hashKey(rawKey);
  const keyPrefix = rawKey.slice(0, 8);
  await this.create({ userId, keyHash, keyPrefix });
  return rawKey;
};

// Returns the ApiKey document if valid, or null.
apiKeySchema.statics.validateKey = async function (rawKey) {
  const keyHash = hashKey(rawKey);
  return this.findOne({ keyHash, status: "active" }).populate("userId");
};

export default mongoose.model("ApiKey", apiKeySchema);