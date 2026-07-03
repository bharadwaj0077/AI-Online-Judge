import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// 1. Public Path: Users don't need to be signed in to see the platform leaderboards
router.get("/leaderboard", UserController.getLeaderboard);

// 2. Protected Path: Fetches specific profile scorecard details for signed-in users
router.get("/profile/stats", requireAuth, UserController.getMyProfileStats);

export default router;