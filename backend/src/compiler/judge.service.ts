import { prisma } from "../config/db";
import { SandboxService, ExecutionResult } from "./sandbox.service";
import { OutputMatcher } from "../utils/compare";

export interface JudgeReportCard {
  overallVerdict: "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "SYSTEM_ERROR";
  totalScore: number;
  maxExecutionTimeMs: number;
  testCaseResults: Array<{
    orderNo: number;
    verdict: string;
    timeMs: number;
    errorSummary?: string;
  }>;
}

export class JudgeService {
  /**
   * Evaluates code against a set of database test cases
   */
  static async evaluateSubmission(
    problemPublicId: string,
    languageSlug: string,
    sourceCode: string
  ): Promise<JudgeReportCard> {
    // 1. Load the challenge constraints and active validation rows
    const problem = await prisma.problem.findFirst({
      where: { publicId: problemPublicId, deletedAt: null },
      include: { testCases: { orderBy: { orderNo: "asc" } } },
    });

    if (!problem) {
      const error: any = new Error("Target challenge data points could not be resolved.");
      error.statusCode = 404;
      throw error;
    }

    if (problem.testCases.length === 0) {
      const error: any = new Error("This problem is currently missing evaluation test cases.");
      error.statusCode = 400;
      throw error;
    }

    // 2. Fetch runtime images and launch configurations for the requested language compiler
    const language = await prisma.language.findUnique({
      where: { slug: languageSlug },
    });

    if (!language || !language.isActive) {
      const error: any = new Error(`Requested language runtime pipeline '${languageSlug}' is unavailable.`);
      error.statusCode = 400;
      throw error;
    }

    // Initialize the tracking report structure
    const report: JudgeReportCard = {
      overallVerdict: "ACCEPTED",
      totalScore: 0,
      maxExecutionTimeMs: 0,
      testCaseResults: [],
    };

    // 3. Process every single test case sequentially through the sandboxed containers
    for (const testCase of problem.testCases) {
      const result: ExecutionResult = await SandboxService.executeCode(
        sourceCode,
        language.fileExtension,
        language.dockerImage,
        language.runCommand,
        testCase.inputData || "",
        problem.timeLimitMs
      );

      // Track the peak runtime duration across all runs
      if (result.executionTimeMs > report.maxExecutionTimeMs) {
        report.maxExecutionTimeMs = result.executionTimeMs;
      }

      let currentVerdict = result.verdict;

      // If the sandbox passed with an ACCEPTED state, check the output text match
      if (currentVerdict === "ACCEPTED") {
        const isMatch = OutputMatcher.match(result.stdout, testCase.expectedOutput || "");
        if (isMatch) {
          report.totalScore += testCase.weight;
        } else {
          currentVerdict = "WRONG_ANSWER";
        }
      }

      // Append this single result step to the tracking matrix
      report.testCaseResults.push({
        orderNo: testCase.orderNo,
        verdict: currentVerdict,
        timeMs: result.executionTimeMs,
        errorSummary: currentVerdict !== "ACCEPTED" ? result.stderr : undefined,
      });

      // Short-circuit evaluations: if a run fails, cascade the negative verdict out immediately
      if (currentVerdict !== "ACCEPTED" && report.overallVerdict === "ACCEPTED") {
        report.overallVerdict = currentVerdict as any;
      }
      if (currentVerdict !== "ACCEPTED") {
        break; 
      }
    }

    return report;
  }
}