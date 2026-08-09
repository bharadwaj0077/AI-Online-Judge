import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";

export class ProblemController {
  static getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const problems = await prisma.problem.findMany({
        where: { visibility: "PUBLIC", deletedAt: null },
        orderBy: { id: "asc" }
      });
      res.status(200).json({ success: true, data: problems });
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
        res.status(404).json({ success: false, message: "Target problem metrics missing from data logs." });
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

  static create = async (req: Request, res: Response, next: NextFunction) => { res.status(201).json({ success: true }); };
  static update = async (req: Request, res: Response, next: NextFunction) => { res.status(200).json({ success: true }); };
  static delete = async (req: Request, res: Response, next: NextFunction) => { res.status(200).json({ success: true }); };
}