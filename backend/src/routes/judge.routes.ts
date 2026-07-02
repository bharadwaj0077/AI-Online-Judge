import { Router, Response, NextFunction } from "express";
import { JudgeService } from "../compiler/judge.service";
import { requireAuth } from "../middlewares/auth.middleware";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const router = Router();

// Test Destination Gateway: POST /api/v1/judge/evaluate/:problemPublicId
router.post(
  "/evaluate/:problemPublicId",
  requireAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { problemPublicId } = req.params;
      const { languageSlug, sourceCode } = req.body;

      if (!languageSlug || !sourceCode) {
        res.status(400).json({
          success: false,
          message: "Please provide both 'languageSlug' and 'sourceCode' payload parameters.",
        });
        return;
      }

      const performanceReport = await JudgeService.evaluateSubmission(
        problemPublicId,
        languageSlug,
        sourceCode
      );

      res.status(200).json({
        success: true,
        message: "Code execution evaluation cycle completed.",
        data: performanceReport,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;