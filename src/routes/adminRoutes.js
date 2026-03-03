import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import adminMiddleware from "../middlewares/adminMiddleware.js";

import { listUsers, getUser, updateRole, deleteUser } from "../controllers/admin/adminUserController.js";
import { listKeys, toggleKeyStatus, deleteKey } from "../controllers/admin/adminKeyController.js";
import { getLogs, getLogStats } from "../controllers/admin/adminLogController.js";
import { getHealth } from "../controllers/admin/adminHealthController.js";
import { getGlobalOverview, getGlobalTimeseries, getTopUsers, getGlobalEndpoints } from "../controllers/admin/adminAnalyticsController.js";

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// Users
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.patch("/users/:id/role", updateRole);
router.delete("/users/:id", deleteUser);

// API Keys
router.get("/keys", listKeys);
router.patch("/keys/:id/suspend", toggleKeyStatus);
router.delete("/keys/:id", deleteKey);

// Logs
router.get("/logs", getLogs);
router.get("/logs/stats", getLogStats);

// Health
router.get("/health", getHealth);

// Analytics (global)
router.get("/analytics/overview", getGlobalOverview);
router.get("/analytics/timeseries", getGlobalTimeseries);
router.get("/analytics/top-users", getTopUsers);
router.get("/analytics/endpoints", getGlobalEndpoints);

export default router;
