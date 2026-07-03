import { Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { AiService } from "../services/ai.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export class AiController {
  /**
   * On-Demand Request: Triggers the generative AI engine to analyze a submission
   */
  static triggerReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { submissionPublicId } = req.params;

      // 1. Ownership & Security Sanity Check
      const submission = await prisma.submission.findUnique({
        where: { publicId: submissionPublicId },
      });

      if (!submission || submission.userId !== BigInt(userId)) {
        res.status(404).json({
          success: false,
          message: "Target code submission track could not be resolved.",
        });
        return;
      }

      // 2. Check if an AI review record has already been compiled to prevent double billing
      const existingFeedback = await prisma.aiFeedback.findUnique({
        where: { submissionId: submission.id },
      });

      if (existingFeedback) {
        res.status(200).json({
          success: true,
          message: "AI performance metrics resolved from cache stores.",
          data: existingFeedback,
        });
        return;
      }

      // 3. Delegate to your Gemini Service core
      const freshFeedback = await AiService.generateFeedback(submissionPublicId);

      res.status(201).json({
        success: true,
        message: "AI code critique compiled successfully.",
        data: freshFeedback,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetch Channel: Retrieves an existing AI analysis row if it has already been generated
   */
  static getReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { submissionPublicId } = req.params;

      const submission = await prisma.submission.findUnique({
        where: { publicId: submissionPublicId },
        include: { aiFeedback: true },
      });

      if (!submission || submission.userId !== BigInt(userId)) {
        res.status(404).json({
          success: false,
          message: "Target submission record not found.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "AI insights resolved successfully.",
        data: submission.aiFeedback || null,
      });
    } catch (error) {
      next(error);
    }
  };
}