import { Router } from "express";
import { TestCaseController, batchTestCaseSchema } from "../controllers/testcase.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";

// Merge parameters to cleanly inherit problemPublicId constraints passed from parent routers
const router = Router({ mergeParams: true });

// Base Trajectory Scope: Linked via /api/v1/problems/:problemPublicId/test-cases

// 1. Fetch public context examples (Open to any registered session profile tier)
router.get("/samples", requireAuth, TestCaseController.getSamples);

// 2. Overwrite / Insert massive evaluation matrices (Restricted completely to Admin profiles)
router.post("/batch", requireAuth, requireAdmin, validateBody(batchTestCaseSchema), TestCaseController.batchUpload);

export default router;