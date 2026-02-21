//userId, apiKeyId, endpoint, method, statusCode, timestamp
import mongoose from "mongoose";
const apiLogSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: "ApiKey", required: true },
        endpoint: { type: String, required: true },
        method: { type: String, required: true },
        statusCode: { type: Number, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("ApiLog", apiLogSchema);