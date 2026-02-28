import { Router } from "express";
import { getRandomQuote, getRandomJoke } from "../controllers/contentController.js";
import apiKeyMiddleware from "../middlewares/apiKeyMiddleware.js";
import rateLimiter from "../middlewares/rateLimiter.js";
import usageLogger from "../middlewares/usageLogger.js";

const router = Router();

// All content routes share the same middleware chain:
//   apiKeyMiddleware → rateLimiter → usageLogger → controller
// Expanding to new content types only requires adding a route below.

router.use(apiKeyMiddleware, rateLimiter, usageLogger);

router.get("/quotes", getRandomQuote);
router.get("/jokes", getRandomJoke);

export default router;
