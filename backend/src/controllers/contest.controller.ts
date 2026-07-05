import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { z } from "zod";

export const contestSchema = z.object({
  title: z.string().min(3, "Title must contain at least 3 characters"),
  description: z.string(),
  startTime: z.string().transform((val) => new Date(val)),
  endTime: z.string().transform((val) => new Date(val)),
  problemPublicIds: z.array(z.string()).min(1, "A contest requires at least one problem track mapping"),
});

export class ContestController {
  /**
   * POST /api/v1/contests
   * Admin-only entry point to schedule a new timed programming competition
   */
  static createContest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, startTime, endTime, problemPublicIds } = contestSchema.parse(req.body);

      // Locate internal database primary keys for the mapped challenge ids
      const problems = await prisma.problem.findMany({
        where: { publicId: { in: problemPublicIds } },
        select: { id: true },
      });

      if (problems.length === 0) {
        res.status(400).json({ success: false, message: "None of the mapped challenge identifiers exist." });
        return;
      }

      // Initialize the transaction loop within PostgreSQL
      const newContest = await prisma.contest.create({
        data: {
          title,
          description,
          startTime,
          endTime,
          problems: {
            create: problems.map((p) => ({
              problemId: p.id,
            })),
          },
        },
      });

      res.status(201).json({
        success: true,
        message: "Timed competition arena registry initialized.",
        data: { publicId: newContest.publicId, title: newContest.title },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/contests
   * Fetches all scheduled upcoming and completed contest entries
   */
  static getAllContests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contests = await prisma.contest.findMany({
        orderBy: { startTime: "asc" },
        select: {
          publicId: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
        },
      });

      res.status(200).json({ success: true, data: contests });
    } catch (error) {
      next(error);
    }
  };
}