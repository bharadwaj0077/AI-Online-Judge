import { prisma } from "../config/db";
import { CreateProblemBody } from "../controllers/problem.controller";

export class ProblemService {
  // Helper utility to convert raw text titles into clean web-safe URL slugs
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Strip away special characters
      .replace(/\s+/g, "-")         // Collapse whitespaces into single dashes
      .replace(/-+/g, "-");         // Prevent double dashes
  }

  // 1. Create a New Programming Challenge
  static async createProblem(data: CreateProblemBody, authorId: string) {
    let slug = this.generateSlug(data.title);

    // Verify if slug is active in the system to prevent unique namespace collisions
    const existingSlug = await prisma.problem.findFirst({
      where: { slug, deletedAt: null },
    });

    // If an identical active slug exists, append a short random string to guarantee uniqueness
    if (existingSlug) {
      const uniqueString = Math.random().toString(36).substring(2, 7);
      slug = `${slug}-${uniqueString}`;
    }

    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        slug,
        statement: data.statement,
        inputFormat: data.inputFormat,
        outputFormat: data.outputFormat,
        constraintsText: data.constraintsText,
        editorial: data.editorial || null,
        difficulty: data.difficulty,
        visibility: data.visibility,
        timeLimitMs: data.timeLimitMs,
        memoryLimitMb: data.memoryLimitMb,
        authorId: BigInt(authorId), // Cast string scalar cleanly to SQL BIGINT
      },
    });

    return problem;
  }

  // 2. Fetch All Unarchived and Non-Deleted Problems
  static async getAllProblems(includeDrafts: boolean = false) {
    return await prisma.problem.findMany({
      where: {
        deletedAt: null,
        // Standard coders only see PUBLIC challenges, while admins see DRAFT/PRIVATE items
        visibility: includeDrafts ? undefined : "PUBLIC",
      },
        select: {
          publicId: true,
          title: true,
          slug: true,
          difficulty: true,
          acceptedCount: true,
          submissionCount: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    });
  }

  // 3. Resolve a Specific Problem via URL Slug
  static async getProblemBySlug(slug: string, includeDrafts: boolean = false) {
    const problem = await prisma.problem.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!problem) {
      const error: any = new Error("Requested programming challenge could not be found.");
      error.statusCode = 404;
      throw error;
    }

    // Enforce visibility restrictions
    if (problem.visibility === "DRAFT" && !includeDrafts) {
      const error: any = new Error("Access denied. This challenge is currently an unpublished draft.");
      error.statusCode = 403;
      throw error;
    }

    return problem;
  }

  // 4. Update an Existing Problem Metadata Specification
  static async updateProblem(publicId: string, data: Partial<CreateProblemBody>) {
    const existingProblem = await prisma.problem.findFirst({
      where: { publicId, deletedAt: null },
    });

    if (!existingProblem) {
      const error: any = new Error("Target problem record not found or has been archived.");
      error.statusCode = 404;
      throw error;
    }

    // Prepare updated payloads, dynamically recalculating the slug if the title was altered
    const updatedData: any = { ...data };
    if (data.title && data.title !== existingProblem.title) {
      updatedData.slug = this.generateSlug(data.title);
    }

    return await prisma.problem.update({
      where: { id: existingProblem.id },
      data: updatedData,
    });
  }

  // 5. Execute an Production Soft-Delete Archival Action
  static async softDeleteProblem(publicId: string) {
    const existingProblem = await prisma.problem.findFirst({
      where: { publicId, deletedAt: null },
    });

    if (!existingProblem) {
      const error: any = new Error("Target problem record could not be located for removal.");
      error.statusCode = 404;
      throw error;
    }

    // Stamp the deletedAt field to remove it from active visibility query arrays
    return await prisma.problem.update({
      where: { id: existingProblem.id },
      data: { deletedAt: new Date() },
    });
  }
}