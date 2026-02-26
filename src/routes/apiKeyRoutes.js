import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { generateApiKey, getMyKeys } from "../controllers/apiKeyController.js";

const router = Router();

// POST /apikey/generate  — generate a new API key (JWT required)
router.post("/generate", authMiddleware, generateApiKey);

// GET /apikey/me  — list caller's own keys (JWT required)
router.get("/me", authMiddleware, getMyKeys);

export default router;
