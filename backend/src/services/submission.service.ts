import { prisma } from "../config/db";
import { JudgeService } from "../compiler/judge.service";

export class SubmissionService {
  /**
   * Processes, judges, records, and aggregates a user code submission
   */
  static async createSubmission(userId: string, problemPublicId: string, languageSlug: string, sourceCode: string) {
    // 1. Resolve parent relational entities
    const problem = await prisma.problem.findFirst({
      where: { publicId: problemPublicId, deletedAt: null },
    });
    if (!problem) {
      const error: any = new Error("Target challenge could not be resolved.");
      error.statusCode = 404;
      throw error;
    }

    const language = await prisma.language.findUnique({
      where: { slug: languageSlug },
    });
    if (!language || !language.isActive) {
      const error: any = new Error("Requested language runtime profile is unavailable.");
      error.statusCode = 400;
      throw error;
    }

    // 2. Instantly write a persistent record marked as PENDING
    const submission = await prisma.submission.create({
      data: {
        userId: BigInt(userId),
        problemId: problem.id,
        languageId: language.id,
        sourceCode,
        verdict: "PENDING",
        score: 0,
      },
    });

    try {
      // 3. Delegate execution directly down to your sandboxed Docker judge engine
      const report = await JudgeService.evaluateSubmission(problemPublicId, languageSlug, sourceCode);

      // 4. Run an atomic database update to write evaluation results back to the submission row
      const updatedSubmission = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          verdict: report.overallVerdict,
          score: report.totalScore,
          executionTimeMs: Math.round(report.maxExecutionTimeMs),
          memoryUsedKb: 0, // Hardware configuration profiles can map RAM usage steps later
        },
      });

      // 5. Aggregate Global Analytics Statistics Metrics
      // Increment baseline submission attempts globally across both the problem and the user profile
      await prisma.user.update({
        where: { id: BigInt(userId) },
        data: { submissionsCount: { increment: 1 } },
      });

      await prisma.problem.update({
        where: { id: problem.id },
        data: { submissionCount: { increment: 1 } },
      });

      // Handle custom points scoring loops for successful ACCEPTED state submissions
      if (report.overallVerdict === "ACCEPTED") {
        // Increment global problem success metrics
        await prisma.problem.update({
          where: { id: problem.id },
          data: { acceptedCount: { increment: 1 } },
        });

        // Check if the user has ALREADY solved this specific problem before to prevent aggregate points exploitation
        const previousAcceptedRun = await prisma.submission.findFirst({
          where: {
            userId: BigInt(userId),
            problemId: problem.id,
            verdict: "ACCEPTED",
            id: { not: submission.id }, // Exclude current running row
          },
        });

        // If this is their first time passing all test blocks, increment their unique solved count tally
        if (!previousAcceptedRun) {
          await prisma.user.update({
            where: { id: BigInt(userId) },
            data: { problemsSolved: { increment: 1 } },
          });
        }
      }

      return updatedSubmission;
    } catch (error) {
      // In case of unexpected runtime system crashes, fail gracefully by updating row to SYSTEM_ERROR
      await prisma.submission.update({
        where: { id: submission.id },
        data: { verdict: "SYSTEM_ERROR" },
      });
      throw error;
    }
  }

  /**
   * Fetches the complete submission history for a specific user profile
   */
  static async getUserSubmissions(userId: string) {
    return await prisma.submission.findMany({
      where: { userId: BigInt(userId) },
      include: {
        problem: { select: { title: true, slug: true } },
        language: { select: { displayName: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  /**
   * Loads deep tracking details for an individual historic submission row
   */
  static async getSubmissionDetails(publicId: string, userId: string) {
    const submission = await prisma.submission.findFirst({
      where: { publicId, userId: BigInt(userId) },
      include: {
        problem: { select: { title: true, statement: true } },
        language: { select: { displayName: true } },
      },
    });

    if (!submission) {
      const error: any = new Error("Requested submission tracking record could not be found.");
      error.statusCode = 404;
      throw error;
    }

    return submission;
  }
}