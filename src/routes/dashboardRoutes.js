import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getUsage } from "../controllers/dashboardController.js";
import {
  getTimeseries,
  getEndpoints,
  getStatusCodes,
  getLatency,
  getKeys,
  getRecent,
  getErrors,
  getOverview,
} from "../controllers/analyticsController.js";

const router = Router();

// GET /dashboard/usage  — usage stats for the authenticated developer (JWT required)
router.get("/usage", authMiddleware, getUsage);

// ── Analytics endpoints (all JWT-protected) ────────────
router.get("/analytics/overview",      authMiddleware, getOverview);
router.get("/analytics/timeseries",    authMiddleware, getTimeseries);
router.get("/analytics/endpoints",     authMiddleware, getEndpoints);
router.get("/analytics/status-codes",  authMiddleware, getStatusCodes);
router.get("/analytics/latency",       authMiddleware, getLatency);
router.get("/analytics/keys",          authMiddleware, getKeys);
router.get("/analytics/recent",        authMiddleware, getRecent);
router.get("/analytics/errors",        authMiddleware, getErrors);

export default router;
