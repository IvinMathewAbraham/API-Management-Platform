import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { validate, updatePlanSchema } from "../middlewares/validate.js";
import { updatePlan } from "../controllers/userController.js";

const router = Router();

// PATCH /user/plan  — upgrade or change the caller's plan (JWT required)
router.patch("/plan", authMiddleware, validate(updatePlanSchema), updatePlan);

export default router;
