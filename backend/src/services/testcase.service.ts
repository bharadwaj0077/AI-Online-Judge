import { prisma } from "../config/db";

export interface TestCaseInput {
  inputData: string;
  expectedOutput: string;
  isSample: boolean;
  weight: number;
}

export class TestCaseService {
  // 1. Ingest a batch array of validation test cases for a specific challenge
  static async createTestCases(problemPublicId: string, testCases: TestCaseInput[]) {
    // Verify the target problem exists and is active
    const problem = await prisma.problem.findFirst({
      where: { publicId: problemPublicId, deletedAt: null },
    });

    if (!problem) {
      const error: any = new Error("Target challenge record not found to attach test cases.");
      error.statusCode = 404;
      throw error;
    }

    // Clear out any existing test cases if re-uploading to prevent messy duplicates
    await prisma.testCase.deleteMany({
      where: { problemId: problem.id },
    });

    // Map raw data array into Prisma creation payloads with automatic ordering sequences
    const creationPayloads = testCases.map((tc, index) => ({
      problemId: problem.id,
      orderNo: index + 1,
      inputData: tc.inputData,
      expectedOutput: tc.expectedOutput,
      isSample: tc.isSample,
      weight: tc.weight ?? 1,
    }));

    // Execute atomic batch creation inside a database transaction
    return await prisma.$transaction(
      creationPayloads.map((payload) => prisma.testCase.create({ data: payload }))
    );
  }

  // 2. Fetch test cases linked to a problem (Samples for users, all tests for the sandbox engine)
  static async getTestCasesByProblem(problemPublicId: string, includeAll: boolean = false) {
    const problem = await prisma.problem.findFirst({
      where: { publicId: problemPublicId, deletedAt: null },
    });

    if (!problem) {
      const error: any = new Error("Target challenge record could not be resolved.");
      error.statusCode = 404;
      throw error;
    }

    return await prisma.testCase.findMany({
      where: {
        problemId: problem.id,
        // If includeAll is false, filter strictly to show public samples (example cases)
        isSample: includeAll ? undefined : true,
      },
      orderBy: { orderNo: "asc" },
    });
  }
}