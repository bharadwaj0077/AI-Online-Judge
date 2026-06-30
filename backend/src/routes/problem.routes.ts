import { Router } from "express";
import { ProblemController, createProblemSchema } from "../controllers/problem.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware";
import testCaseRoutes from "./testcase.routes"; 

const router = Router();

// Base Trajectory Scope: Linked directly from /api/v1/problems

// 1. Fetch Challenge Listings (Public discovery path, but optionally sniffs auth to show admin drafts)
router.get("/", requireAuth, ProblemController.getAll);

// 2. Load Deep Specifications of a Specific Problem via Slug Route
router.get("/:slug", requireAuth, ProblemController.getBySlug);

// 3. Inject a New Coding Challenge (Strict Admin Clearance Required)
router.post("/", requireAuth, requireAdmin, validateBody(createProblemSchema), ProblemController.create);

// 4. Update an Existing Challenge (Strict Admin Clearance Required)
router.put("/:publicId", requireAuth, requireAdmin, validateBody(createProblemSchema.partial()), ProblemController.update);

// 5. Archive / Soft-Delete a Challenge (Strict Admin Clearance Required)
router.delete("/:publicId", requireAuth, requireAdmin, ProblemController.delete);

// 2. Mount the nested sub-resource routing engine at the bottom
router.use("/:problemPublicId/test-cases", testCaseRoutes);

export default router;