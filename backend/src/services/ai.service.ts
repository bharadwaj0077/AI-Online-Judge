import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/db";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export class AiService {
  /**
   * Generates progressive, pedagogical hints for the user's current code workspace without spoiling the solution.
   */
  static async generateHint(problemId: string, sourceCode: string, language: string): Promise<string> {
    const ai = getGenAI();

    const problem = await prisma.problem.findFirst({
      where: {
        OR: [
          { id: !isNaN(Number(problemId)) ? BigInt(problemId) : undefined },
          { slug: problemId }
        ],
        deletedAt: null
      }
    });

    if (!problem) {
      throw new Error("Target problem not found.");
    }

    const prompt = `You are a world-class Computer Science Professor and Technical Interview Coach.
A student is working on the following problem and has requested a hint.

[PROBLEM TITLE]: ${problem.title}
[PROBLEM STATEMENT]: ${problem.statement}
[CONSTRAINTS]: ${problem.constraintsText || "None specified"}
[PROGRAMMING LANGUAGE]: ${language || "Python"}
[STUDENT'S CURRENT CODE]:
${sourceCode || "(No code written yet)"}

CRITICAL RULES:
1. NEVER provide direct code solutions, full functions, or complete snippets. The student must write the code themselves.
2. Provide 2-3 progressive, conceptual bullet points:
   - Hint 1: What to observe about the data structure or mathematical property.
   - Hint 2: An algorithmic direction (e.g. hash map lookup, two-pointer, dynamic programming transition).
   - Hint 3: A potential edge case or boundary to be careful about.
3. Keep the response concise, encouraging, and clear.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      }
    });

    return response.text?.trim() || "Consider analyzing input constraints and testing edge cases with an alternative data structure.";
  }

  /**
   * Analyzes student's current code for Big-O Time & Space complexity and returns a concise architectural breakdown.
   */
  static async generateComplexityAnalysis(
    problemId: string,
    sourceCode: string,
    language: string
  ): Promise<{ timeComplexity: string; spaceComplexity: string; analysis: string }> {
    const ai = getGenAI();

    const problem = await prisma.problem.findFirst({
      where: {
        OR: [
          { id: !isNaN(Number(problemId)) ? BigInt(problemId) : undefined },
          { slug: problemId }
        ],
        deletedAt: null
      }
    });

    const prompt = `You are an elite competitive programming judge analyzer.
Analyze the following code for time and space complexity in the context of the problem.

[PROBLEM]: ${problem ? problem.title : "Algorithm Problem"}
[LANGUAGE]: ${language || "Python"}
[CODE]:
${sourceCode || ""}

Respond STRICTLY with a valid JSON object matching this schema:
{
  "timeComplexity": "e.g., O(N) or O(N^2)",
  "spaceComplexity": "e.g., O(1) or O(N)",
  "analysis": "1-2 sentence concise summary explaining the dominant operations and whether optimization is possible."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      }
    });

    const raw = response.text?.trim() || "{}";
    try {
      const parsed = JSON.parse(raw);
      return {
        timeComplexity: parsed.timeComplexity || "O(N)",
        spaceComplexity: parsed.spaceComplexity || "O(1)",
        analysis: parsed.analysis || "Linear scan analyzing input elements."
      };
    } catch {
      return {
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        analysis: "Analyzed dominant loop structures and memory allocation."
      };
    }
  }

  /**
   * Generates a deep structural code critique, runtime analysis, and architectural hints for a completed submission.
   */
  static async generateFeedback(submissionPublicId: string) {
    const ai = getGenAI();

    const submission = await prisma.submission.findUnique({
      where: { publicId: submissionPublicId },
      include: {
        problem: true,
        language: true,
      },
    });

    if (!submission) {
      throw new Error("Submission record could not be found to generate AI insights.");
    }

    const systemInstruction = `You are an elite, world-class Computer Science Professor and Technical Interviewer.
Your task is to review a student's code submission to an online judge platform and provide constructive feedback.

CRITICAL RULE: DO NOT provide the corrected or complete code solution under any circumstances. The student must learn by doing.

Analyze the provided Problem Statement, the User's Code, the programming language used, and the final execution verdict.

You must respond strictly with a valid JSON object matching this structural format:
{
  "analysis": "A brief overview explaining what the code did wrong or right conceptually based on the verdict.",
  "hints": "3 targeted, sequential bulleted steps or clues helping the user debug or refactor their algorithm without giving away the answer.",
  "timeComplexity": "State the current time complexity (e.g., O(N^2)) and note if it can be optimized.",
  "spaceComplexity": "State the space complexity profile of the submitted solution (e.g., O(N))."
}`;

    const userContextPrompt = `[PROBLEM TITLE]: ${submission.problem.title}
[PROBLEM STATEMENT]: ${submission.problem.statement}
[RUNTIME ENVIRONMENT]: ${submission.language?.displayName || "Standard Runtime"}
[SUBMITTED CODE]:
${submission.sourceCode}
[JUDGE VERDICT]: ${submission.verdict}
[EARNED SCORE]: ${submission.score}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemInstruction}\n\n${userContextPrompt}`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response received from the upstream AI core.");
    }

    const parsedData = JSON.parse(rawText);

    let formattedHints = "";
    if (Array.isArray(parsedData.hints)) {
      formattedHints = parsedData.hints
        .map((hint: string, index: number) => `${index + 1}. ${hint}`)
        .join("\n");
    } else {
      formattedHints = String(parsedData.hints || "");
    }

    return await prisma.aiFeedback.create({
      data: {
        submissionId: submission.id,
        analysis: parsedData.analysis || "Review compiled successfully.",
        hints: formattedHints,
        timeComplexity: parsedData.timeComplexity || "N/A",
        spaceComplexity: parsedData.spaceComplexity || "N/A",
      },
    });
  }
}