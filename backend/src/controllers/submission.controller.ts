import { Response, NextFunction } from "express";
import { z } from "zod";
import { SubmissionService } from "../services/submission.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const createSubmissionSchema = z.object({
  problemPublicId: z.string().uuid("Invalid challenge formatting tracking key"),
  languageSlug: z.string().min(1, "Language compilation runtime handle is required"),
  sourceCode: z.string().min(1, "Source code submission script cannot be empty"),
});

export class SubmissionController {
  // 1. Route Handler: Submit, process, and evaluate a coding solution
  static create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { problemPublicId, languageSlug, sourceCode } = req.body;

      const record = await SubmissionService.createSubmission(userId, problemPublicId, languageSlug, sourceCode);

      res.status(201).json({
        success: true,
        message: "Solution processed and evaluated successfully.",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  // 2. Route Handler: Load history track specific to authenticated account session
  static getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const records = await SubmissionService.getUserSubmissions(userId);

      res.status(200).json({
        success: true,
        message: "User account submission history tracks loaded.",
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  // 3. Route Handler: Resolve isolated details matching a submission hash key
  static getDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { publicId } = req.params;

      const record = await SubmissionService.getSubmissionDetails(publicId, userId);

      res.status(200).json({
        success: true,
        message: "Detailed submission performance matrix resolved.",
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };
}