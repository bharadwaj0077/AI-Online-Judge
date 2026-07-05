import { Router } from "express";
import { SubmissionController, createSubmissionSchema } from "../controllers/submission.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Base Trajectory Scope: Linked via /api/v1/submissions
router.use(requireAuth); // Protect all routes in this tree

// 1. Ingest and execute a hot programmatic code solution block (Contest Aware)
router.post("/", validateBody(createSubmissionSchema), SubmissionController.create);

// 2. Load the authenticated account profile's history collection arrays
router.get("/history", SubmissionController.getHistory);

// 3. Fetch deep analytics logs matching an isolated submission UUID
router.get("/details/:publicId", SubmissionController.getDetails);

export default router;