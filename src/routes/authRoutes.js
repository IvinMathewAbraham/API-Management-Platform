import { Router } from "express";
import { register, login } from "../controllers/authController.js";
import { validate, registerSchema, loginSchema } from "../middlewares/validate.js";

const router = Router();

// POST /auth/register
router.post("/register", validate(registerSchema), register);

// POST /auth/login
router.post("/login", validate(loginSchema), login);

export default router;
