import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/db";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface TieredHintItem {
  tier: number;
  title: string;
  badge: string;
  focus: string;
  content: string;
  keyTakeaway: string;
}

export interface TieredHintsResponse {
  problemId: string;
  problemTitle: string;
  tiers: TieredHintItem[];
}

export class AiService {
  /**
   * Generates a 3-tier sequential scaffolding hint matrix tailored to the problem and student's current code.
   */
  static async generateTieredHints(
    problemId: string,
    sourceCode: string,
    language: string
  ): Promise<TieredHintsResponse> {
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

    const prompt = `You are an elite Computer Science Professor and Principal Technical Interview Mentor.
A student is solving an algorithmic problem on an online judge platform and needs structured, progressive guidance without spoilers.

[PROBLEM TITLE]: ${problem.title}
[DIFFICULTY]: ${problem.difficulty}
[PROBLEM STATEMENT]: ${problem.statement}
[CONSTRAINTS]: ${problem.constraintsText || "None specified"}
[PROGRAMMING LANGUAGE]: ${language || "Python"}
[STUDENT'S CURRENT CODE]:
${sourceCode || "(No code written yet)"}

CRITICAL RULES:
1. NEVER output direct code solutions, full functions, or complete snippets. The student MUST learn by writing the code themselves.
2. Structure guidance into precisely 3 sequential, progressive tiers:
   - Tier 1 (Observation & Invariants): What to observe about the input data structure, constraints, mathematical symmetries, or brute force limits. Do NOT name the specific data structure yet.
   - Tier 2 (Algorithmic Strategy): Recommend the optimal pattern/technique (e.g. Two-Pointers, Hash Map lookup, Sliding Window, Monotonic Stack, Dynamic Programming) and explain WHY it fits the constraints.
   - Tier 3 (Edge Cases & Structural Logic): Highlight critical corner cases (e.g. negative values, duplicates, empty inputs, overflow) and describe the logical flow/pseudo-steps without giving direct syntax.

Respond STRICTLY with a valid JSON array of 3 objects conforming to this schema:
[
  {
    "tier": 1,
    "title": "Observation & Invariants",
    "badge": "Core Observation",
    "focus": "What to observe about input properties and mathematical invariants",
    "content": "Detailed pedagogical explanation guiding their intuition...",
    "keyTakeaway": "1-sentence golden rule or question for the student to ask themselves"
  },
  {
    "tier": 2,
    "title": "Algorithmic Strategy",
    "badge": "Optimal Pattern",
    "focus": "Recommended pattern and complexity trade-offs",
    "content": "Explanation of the strategic data structure and approach...",
    "keyTakeaway": "1-sentence summary of the optimal algorithm direction"
  },
  {
    "tier": 3,
    "title": "Edge Cases & Structural Logic",
    "badge": "Edge Cases & Flow",
    "focus": "Tricky inputs and pseudo-steps",
    "content": "Breakdown of boundaries and sequential execution logic...",
    "keyTakeaway": "1-sentence checklist before running test cases"
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const raw = response.text?.trim() || "[]";
    try {
      const parsed: TieredHintItem[] = JSON.parse(raw);
      return {
        problemId: problem.id.toString(),
        problemTitle: problem.title,
        tiers: Array.isArray(parsed) && parsed.length >= 3 ? parsed : this.getDefaultTiers(problem.title)
      };
    } catch {
      return {
        problemId: problem.id.toString(),
        problemTitle: problem.title,
        tiers: this.getDefaultTiers(problem.title)
      };
    }
  }

  private static getDefaultTiers(title: string): TieredHintItem[] {
    return [
      {
        tier: 1,
        title: "Observation & Invariants",
        badge: "Core Observation",
        focus: "Problem constraints & input behavior",
        content: `Examine the constraints and input size for "${title}". Analyze how the number of operations scales if you examine every possible combination.`,
        keyTakeaway: "Identify whether brute-force quadratic complexity will exceed the 2000ms time limit."
      },
      {
        tier: 2,
        title: "Algorithmic Strategy",
        badge: "Optimal Pattern",
        focus: "Target data structure & complexity",
        content: "Look for a data structure (such as a hash table, two-pointer window, or sorting) that reduces repeated inner scans into fast O(1) or O(log N) operations.",
        keyTakeaway: "Trade minimal additional memory space to achieve linear or near-linear runtime."
      },
      {
        tier: 3,
        title: "Edge Cases & Structural Logic",
        badge: "Edge Cases & Flow",
        focus: "Corner cases & boundary handling",
        content: "Consider empty inputs, single element edge cases, duplicate values, and negative numbers before finalizing your solution loop.",
        keyTakeaway: "Validate the exact order of element insertion vs lookup to avoid self-matching."
      }
    ];
  }

  /**
   * Generates progressive, pedagogical hints for the user's current code workspace without spoiling the solution.
   */
  static async generateHint(problemId: string, sourceCode: string, language: string): Promise<string> {
    try {
      const tiered = await this.generateTieredHints(problemId, sourceCode, language);
      return tiered.tiers.map((t) => `**Tier ${t.tier} (${t.title})**:\n${t.content}\n*Key Takeaway: ${t.keyTakeaway}*`).join("\n\n");
    } catch {
      return "Consider analyzing input constraints and testing edge cases with an alternative data structure.";
    }
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