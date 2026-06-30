import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ProblemService } from "../services/problem.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export const createProblemSchema = z.object({
  title: z.string().min(5, "Title must contain at least 5 characters").max(255),
  statement: z.string().min(20, "Problem statement markdown must be detailed (min 20 chars)"),
  inputFormat: z.string().min(5, "Input format description is required"),
  outputFormat: z.string().min(5, "Output format description is required"),
  constraintsText: z.string().min(5, "Algorithmic constraints text is required"),
  editorial: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  visibility: z.enum(["DRAFT", "PRIVATE", "PUBLIC", "ARCHIVED"]).default("DRAFT"),
  timeLimitMs: z.number().int().min(100, "Minimum time limit is 100ms").max(10000, "Maximum limit is 10000ms"),
  memoryLimitMb: z.number().int().min(16, "Minimum memory limit is 16MB").max(2048, "Maximum limit is 2048MB"),
});

export type CreateProblemBody = z.infer<typeof createProblemSchema>;

export class ProblemController {
  // 1. Route Handler: Create unique challenge records (Admin Only)
  static create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user is guaranteed to exist due to the requireAuth middleware checkpoint
      const authorId = req.user!.id;
      const problem = await ProblemService.createProblem(req.body, authorId);

      res.status(201).json({
        success: true,
        message: "Programming problem registered successfully into platform matrices.",
        data: { publicId: problem.publicId, title: problem.title, slug: problem.slug },
      });
    } catch (error) {
      next(error);
    }
  };

  // 2. Route Handler: Fetch all active platform challenges
  static getAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Admins and Moderators can view drafts, regular users are restricted to public tasks
      const showDrafts = req.user?.role === "ADMIN" || req.user?.role === "MODERATOR";
      const problems = await ProblemService.getAllProblems(showDrafts);

      res.status(200).json({
        success: true,
        message: "Platform challenge listings resolved successfully.",
        data: problems,
      });
    } catch (error) {
      next(error);
    }
  };

  // 3. Route Handler: Fetch structural challenge parameters via specific Slug
  static getBySlug = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const showDrafts = req.user?.role === "ADMIN" || req.user?.role === "MODERATOR";
      const problem = await ProblemService.getProblemBySlug(slug, showDrafts);

      res.status(200).json({
        success: true,
        message: "Target coding problem specification loaded successfully.",
        data: problem,
      });
    } catch (error) {
      next(error);
    }
  };

  // 4. Route Handler: Update challenge parameters (Admin Only)
  static update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { publicId } = req.params;
      const updatedProblem = await ProblemService.updateProblem(publicId, req.body);

      res.status(200).json({
        success: true,
        message: "Problem specification changes applied successfully.",
        data: { publicId: updatedProblem.publicId, slug: updatedProblem.slug },
      });
    } catch (error) {
      next(error);
    }
  };

  // 5. Route Handler: Soft delete a specific challenge (Admin Only)
  static delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { publicId } = req.params;
      await ProblemService.softDeleteProblem(publicId);

      res.status(200).json({
        success: true,
        message: "Problem record soft-deleted and archived safely from public view portals.",
      });
    } catch (error) {
      next(error);
    }
  };
}