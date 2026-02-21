import express from "express";
import "express-async-errors";

const app = express();

// Body parsing
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

// Routes (mounted here as they are built)
// app.use("/auth", authRoutes);
// app.use("/apikey", apiKeyRoutes);
// app.use("/api/v1", publicRoutes);
// app.use("/dashboard", dashboardRoutes);

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
