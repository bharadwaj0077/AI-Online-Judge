import { Router } from "express";
import { AiController } from "../controllers/ai.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Base Trajectory Scope: Linked via /api/v1/ai
router.use(requireAuth); // Universal security verification gate

// 1. POST path to request/trigger a fresh AI analysis loop
router.post("/review/:submissionPublicId", AiController.triggerReview);

// 2. GET path to look up existing historical AI reports
router.get("/review/:submissionPublicId", AiController.getReview);

export default router;