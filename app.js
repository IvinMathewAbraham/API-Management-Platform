import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import "express-async-errors";
import authRoutes from "./src/routes/authRoutes.js";
import publicRoutes from "./src/routes/publicRoutes.js";
import apiKeyRoutes from "./src/routes/apiKeyRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  })
);

// Body parsing
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/v1", publicRoutes);         // quotes, jokes, ... (API key protected)
app.use("/apikey", apiKeyRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/user", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

export default app;
