import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, default: "Unknown" },
    category: { type: String, default: "general" }, // e.g. motivation, humor
  },
  { timestamps: true }
);

export default mongoose.model("Quote", quoteSchema);
