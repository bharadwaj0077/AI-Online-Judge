import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db";

export const createProblemSchema = z.object({
  title: z.string().min(5).max(255),
  statement: z.string().min(20),
  inputFormat: z.string().min(5),
  outputFormat: z.string().min(5),
  constraintsText: z.string().min(5),
  editorial: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  visibility: z.enum(["DRAFT", "PRIVATE", "PUBLIC", "ARCHIVED"]).default("DRAFT"),
  timeLimitMs: z.number().int().min(100).max(10000),
  memoryLimitMb: z.number().int().min(16).max(2048),
  inputTemplate: z.string().optional().default(""), 
  driverScript: z.string().optional().default(""),   
});

export type CreateProblemBody = z.infer<typeof createProblemSchema>;

export class ProblemController {
  static getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const problems = await prisma.problem.findMany({
        where: { visibility: "PUBLIC", deletedAt: null },
        orderBy: { id: "asc" },
        include: { problemTags: { include: { tag: true } } }
      });
      // Flatten the join table into a simple tags: string[] for the client
      const shaped = problems.map((p) => {
        const { problemTags, ...rest } = p as any;
        return { ...rest, tags: (problemTags || []).map((pt: any) => pt.tag?.name).filter(Boolean) };
      });
      res.status(200).json({ success: true, data: shaped });
    } catch (error) { next(error); }
  };

  static getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const langQuery = (req.query.lang as string) || "python3";
      
      const problem = await prisma.problem.findUnique({ 
        where: { slug },
        include: { testCases: { where: { isSample: true }, orderBy: { orderNo: "asc" } } }
      });

      if (!problem) {
        res.status(404).json({ success: false, message: "Target challenge specs missing." });
        return;
      }

      try {
        const templateMap = JSON.parse(problem.inputTemplate || "{}");
        (problem as any).inputTemplate = templateMap[langQuery] || "";
      } catch {
        (problem as any).inputTemplate = "";
      }

      res.status(200).json({ success: true, data: problem });
    } catch (error) { next(error); }
  };

  // Administrative Stubs linked directly to your router pathways
  static create = async (req: Request, res: Response, next: NextFunction) => { res.status(201).json({ success: true }); };
  static update = async (req: Request, res: Response, next: NextFunction) => { res.status(200).json({ success: true }); };
  static delete = async (req: Request, res: Response, next: NextFunction) => { res.status(200).json({ success: true }); };
}