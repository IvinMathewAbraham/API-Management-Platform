import mongoose from "mongoose";

const jokeSchema = new mongoose.Schema(
  {
    setup: { type: String, required: true },     // question or opening line
    punchline: { type: String, required: true },
    category: { type: String, default: "general" }, // e.g. dad, pun, programming
  },
  { timestamps: true }
);

export default mongoose.model("Joke", jokeSchema);
