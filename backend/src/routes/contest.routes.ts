import { Router } from "express";
import { ContestController } from "../controllers/contest.controller";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// Publicly readable pathways for dashboard grids
router.get("/", requireAuth, ContestController.getAllContests);

// Secure pathways reserved exclusively for administrative seeding tools
router.post("/", requireAuth, requireAdmin, ContestController.createContest);

export default router;