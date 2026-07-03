import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/db";

export class AiService {
  /**
   * Generates a structural code critique, runtime analysis, and architectural hints
   */
  static async generateFeedback(submissionPublicId: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 1. Fetch the deep relational data blocks for the submission
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

    // 2. Formulate a highly engineered system prompt matrix
    const systemInstruction = `
      You are an elite, world-class Computer Science Professor and Technical Interviewer. 
      Your task is to review a student's code submission to an online judge platform and provide constructive feedback.
      
      CRITICAL RULE: DO NOT provide the corrected or complete code solution under any circumstances. The student must learn by doing.
      
      Analyze the provided Problem Statement, the User's Code, the programming language used, and the final execution verdict.
      
      You must respond strictly with a valid JSON object matching this structural format:
      {
        "analysis": "A brief overview explaining what the code did wrong or right conceptually based on the verdict.",
        "hints": "3 targeted, sequential bulleted steps or clues helping the user debug or refactor their algorithm without giving away the answer.",
        "timeComplexity": "State the current time complexity (e.g., O(N^2)) and note if it can be optimized (e.g., can be optimized to O(N log N)).",
        "spaceComplexity": "State the space complexity profile of the submitted solution (e.g., O(N))."
      }
    `;

    const userContextPrompt = `
      [PROBLEM TITLE]: ${submission.problem.title}
      [PROBLEM STATEMENT]: ${submission.problem.statement}
      [RUNTIME ENVIRONMENT]: ${submission.language.displayName}
      [SUBMITTED CODE]: 
      ${submission.sourceCode}
      [JUDGE VERDICT]: ${submission.verdict}
      [EARNED SCORE]: ${submission.score}
    `;

    try {
      // 3. Invoke generation using the dynamically allocated client instance
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Switch to "gemini-1.5-flash" here if 503 spikes happen again
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

      // 🚀 DATA NORMALIZATION GATEWAY:
      // If Gemini outputs hints as a JSON array, map it into a clean, numbered markdown string
      let formattedHints = "";
      if (Array.isArray(parsedData.hints)) {
        formattedHints = parsedData.hints
          .map((hint: string, index: number) => `${index + 1}. ${hint}`)
          .join("\n");
      } else {
        formattedHints = String(parsedData.hints || "");
      }

      // 4. Save the structural insights directly into your relational PostgreSQL table
      return await prisma.aiFeedback.create({
        data: {
          submissionId: submission.id,
          analysis: parsedData.analysis,
          hints: formattedHints, // Pass the clean, safe text string here
          timeComplexity: parsedData.timeComplexity,
          spaceComplexity: parsedData.spaceComplexity,
        },
      });
    } catch (error: any) {
      console.error("❌ Upstream SDK Execution Failure:", error);
      throw new Error(`AI Engine Failure: ${error.message || error}`);
    }
  }
}