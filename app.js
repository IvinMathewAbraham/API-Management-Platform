import express from "express";
import "express-async-errors";
import authRoutes from "./src/routes/authRoutes.js";
import publicRoutes from "./src/routes/publicRoutes.js";
// import apiKeyRoutes from "./src/routes/apiKeyRoutes.js";   // TODO: implement
// import dashboardRoutes from "./src/routes/dashboardRoutes.js"; // TODO: implement

const app = express();

// Body parsing
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/v1", publicRoutes);         // quotes, jokes, ... (API key protected)
// app.use("/apikey", apiKeyRoutes);       // TODO: implement
// app.use("/dashboard", dashboardRoutes); // TODO: implement

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
