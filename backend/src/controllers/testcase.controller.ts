import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TestCaseService } from "../services/testcase.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

// Single test case payload rule validation parameters
const singleTestCaseSchema = z.object({
  inputData: z.string().min(1, "Input verification parameters cannot be completely empty"),
  expectedOutput: z.string().min(1, "Expected asset assertion output data is required"),
  isSample: z.boolean().default(false),
  weight: z.number().int().min(1, "Test score weight assignment must be at least 1").default(1),
});

// Enforce that administrators must submit payloads packaged inside a valid array list
export const batchTestCaseSchema = z.object({
  testCases: z.array(singleTestCaseSchema).min(1, "Provide at least one structural test case specification block"),
});

export class TestCaseController {
  // 1. Process Batch Upload updates (Admin Only)
  static batchUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { problemPublicId } = req.params;
      const { testCases } = req.body;

      const records = await TestCaseService.createTestCases(problemPublicId, testCases);

      res.status(201).json({
        success: true,
        message: `Successfully synchronized ${records.length} evaluation test cases for this challenge.`,
        data: { count: records.length },
      });
    } catch (error) {
      next(error);
    }
  };

  // 2. Fetch Publicly Accessible Example Samples
  static getSamples = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { problemPublicId } = req.params;
      const samples = await TestCaseService.getTestCasesByProblem(problemPublicId, false);

      res.status(200).json({
        success: true,
        message: "Public example sample test cases resolved successfully.",
        data: samples,
      });
    } catch (error) {
      next(error);
    }
  };
}