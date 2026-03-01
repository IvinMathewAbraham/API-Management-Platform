//userId, apiKeyId, endpoint, method, statusCode, timestamp, responseTime, ip, userAgent, responseSize, requestId
import mongoose from "mongoose";
const apiLogSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiKey", required: true },
        endpoint: { type: String, required: true },
        method: { type: String, required: true },
        statusCode: { type: Number, required: true },
        responseTime: { type: Number, default: null },        // milliseconds
        ip: { type: String, default: null },
        userAgent: { type: String, default: null },
        responseSize: { type: Number, default: null },         // bytes
        requestId: { type: String, default: null },
    },
    { timestamps: true }
);

// Compound indexes for fast dashboard aggregation queries
apiLogSchema.index({ userId: 1, createdAt: -1 });
apiLogSchema.index({ apiKeyId: 1, createdAt: -1 });
apiLogSchema.index({ userId: 1, endpoint: 1 });
apiLogSchema.index({ userId: 1, statusCode: 1 });

// TTL index — auto-delete logs older than 90 days
apiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model("ApiLog", apiLogSchema);