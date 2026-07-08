import { Router } from "express";
import { ProblemController } from "../controllers/problem.controller";
import { optionalAuth } from "../middlewares/auth.middleware";
import testCaseRoutes from "./testcase.routes"; 

const router = Router();

// 1. Fetch Challenge Listings (Public discovery path)
router.get("/", optionalAuth, ProblemController.getAll);

// 2. Load Deep Specifications of a Specific Problem via Slug Route
router.get("/:slug", optionalAuth, ProblemController.getBySlug);

// 3. Administrative Operational Entry Points
router.post("/", optionalAuth, ProblemController.create);
router.put("/:publicId", optionalAuth, ProblemController.update);
router.delete("/:publicId", optionalAuth, ProblemController.delete);

// 🚀 SAFE CHECK GATE: Prevents initialization crashes if testCaseRoutes evaluates to undefined
const safeTestCaseRouter = typeof testCaseRoutes === "function" || (testCaseRoutes && Object.keys(testCaseRoutes).length > 0)
  ? testCaseRoutes 
  : Router().get("/", (req, res) => res.status(200).json({ success: true, data: [] }));

router.use("/:problemPublicId/test-cases", safeTestCaseRouter);

export default router;