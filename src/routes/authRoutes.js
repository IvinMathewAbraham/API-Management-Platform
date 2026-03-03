import { Router } from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { validate, registerSchema, loginSchema } from "../middlewares/validate.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), register);

// POST /auth/login
router.post("/login", validate(loginSchema), login);

// GET /auth/me  — returns fresh user data (used to refresh stale frontend state)
router.get("/me", authMiddleware, getMe);

export default router;
