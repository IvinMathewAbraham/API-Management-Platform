import { Router } from "express";
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { checkout, portal, webhook, verifySession } from "../controllers/paymentController.js";

const router = Router();

// ⚠️  Webhook MUST use raw body so Stripe can verify the signature.
//     This route is intentionally registered here (before express.json() in app.js).
router.post("/webhook", express.raw({ type: "application/json" }), webhook);

// Protected — require a valid JWT
router.post("/checkout", authMiddleware, checkout);
router.post("/portal", authMiddleware, portal);
router.get("/verify-session", authMiddleware, verifySession);

export default router;
