import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { getUsage } from "../controllers/dashboardController.js";

const router = Router();

// GET /dashboard/usage  — usage stats for the authenticated developer (JWT required)
router.get("/usage", authMiddleware, getUsage);

export default router;
