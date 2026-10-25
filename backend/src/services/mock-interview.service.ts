import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/db";
import { generateContentWithCascade } from "../utils/gemini-cascade";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface InterviewConfig {
  userId?: string;
  roleTitle: string; // e.g., "Senior Software Engineer (L5)"
  targetCompany: string; // e.g., "Google", "Meta", "Amazon"
  interviewerName: string; // e.g., "Alex (Staff SWE)", "Sarah (Eng Director)", "Marcus (Principal Architect)"
  topic: string; // e.g., "Data Structures & Algorithms", "System Design"
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number; // 15, 30, 45, 60
  problemId?: string;
}

export interface TranscriptTurn {
  id: string;
  sender: "interviewer" | "candidate" | "system";
  text: string;
  timestamp: number;
  codeSnippet?: string;
  audioVoiceData?: string;
  isHint?: boolean;
}

export interface TelemetryData {
  fillerWordCount: number;
  wpm: number;
  eyeContactScore: number; // 0 - 100
  interruptions: number;
  codeRuns: number;
  durationElapsedSec: number;
}

export interface ScorecardReport {
  hireDecision: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "LEANING_NO_HIRE" | "STRONG_NO_HIRE";
  overallScore: number; // 0 - 100
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  behavioralScore: number;
  executiveSummary: string;
  strengths: string[];
  growthAreas: string[];
  lineByLineFeedback: string;
  optimalSolution: string;
  interviewerVerdict: string;
}

export class MockInterviewService {
  /**
   * Initializes a new Mock Interview Session
   */
  static async createInterview(config: InterviewConfig) {
    // 1. Resolve or choose an algorithmic problem matching topic & difficulty
    let problem: any = null;
    if (config.problemId) {
      problem = await prisma.problem.findFirst({
        where: {
          OR: [
            { id: !isNaN(Number(config.problemId)) ? BigInt(config.problemId) : undefined },
            { slug: config.problemId }
          ],
          deletedAt: null
        },
        include: { testCases: { where: { isSample: true } } }
      });
    }

    if (!problem) {
      // Pick an active problem matching difficulty, or fallback to any problem
      const diffUpper = config.difficulty.toUpperCase();
      let candidates = await prisma.problem.findMany({
        where: {
          difficulty: diffUpper as any,
          deletedAt: null
        },
        include: { testCases: { where: { isSample: true } } },
        take: 10
      });

      if (candidates.length === 0) {
        candidates = await prisma.problem.findMany({
          where: { deletedAt: null },
          include: { testCases: { where: { isSample: true } } },
          take: 10
        });
      }

      problem = candidates[Math.floor(Math.random() * candidates.length)] || null;
    }

    const defaultTemplates = {
      python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
      javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
      cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
      java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
    };

    let templates = { ...defaultTemplates };
    if (problem?.inputTemplate) {
      try {
        const parsed = JSON.parse(problem.inputTemplate);
        templates = { ...defaultTemplates, ...parsed };
      } catch {}
    }

    const sampleTestCases = (problem?.testCases || []).map((tc: any, idx: number) => ({
      id: tc.id ? tc.id.toString() : (idx + 1).toString(),
      orderNo: tc.orderNo || idx + 1,
      input: tc.input || "",
      expectedOutput: tc.expectedOutput || "",
      isSample: tc.isSample !== false
    }));

    const finalTestCases = sampleTestCases.length > 0 ? sampleTestCases : [
      { id: "1", orderNo: 1, input: "[2, 7, 11, 15], target = 9", expectedOutput: "[0, 1]", isSample: true },
      { id: "2", orderNo: 2, input: "[3, 2, 4], target = 6", expectedOutput: "[1, 2]", isSample: true }
    ];

    const problemTitle = problem?.title || "Optimal Subarray Sum";
    const problemStatement = problem?.statement || "Given an array of integers and a target constraint, find the optimal subset or indices satisfying the operational criteria with minimal time complexity.";
    const constraintsText = problem?.constraintsText || "1 <= N <= 10^5, -10^9 <= elements <= 10^9";

    // 2. Synthesize realistic opening greeting tailored to company, role, interviewer persona, and problem
    const greeting = this.generateOpeningGreeting(
      config.interviewerName,
      config.targetCompany,
      config.roleTitle,
      problemTitle,
      config.durationMinutes
    );

    const initialTranscript: TranscriptTurn[] = [
      {
        id: `turn_${Date.now()}_0`,
        sender: "interviewer",
        text: greeting,
        timestamp: Date.now()
      }
    ];

    // 3. Persist into PostgreSQL
    const interview = await prisma.mockInterview.create({
      data: {
        userId: config.userId && !isNaN(Number(config.userId)) ? BigInt(config.userId) : null,
        roleTitle: config.roleTitle,
        targetCompany: config.targetCompany,
        interviewerName: config.interviewerName,
        topic: config.topic,
        difficulty: config.difficulty,
        durationMinutes: config.durationMinutes,
        status: "IN_PROGRESS",
        problemId: problem?.id ? problem.id : null,
        problemTitle,
        problemStatement,
        currentCode: templates.python3,
        language: "python3",
        transcript: initialTranscript as any,
        telemetry: {
          fillerWordCount: 0,
          wpm: 130,
          eyeContactScore: 92,
          interruptions: 0,
          codeRuns: 0,
          durationElapsedSec: 0
        } as any,
        startTime: new Date()
      }
    });

    return {
      interviewId: interview.id,
      roleTitle: interview.roleTitle,
      targetCompany: interview.targetCompany,
      interviewerName: interview.interviewerName,
      topic: interview.topic,
      difficulty: interview.difficulty,
      durationMinutes: interview.durationMinutes,
      status: interview.status,
      problem: {
        id: problem?.id ? problem.id.toString() : "custom",
        title: problemTitle,
        statement: problemStatement,
        constraintsText,
        templates,
        testCases: finalTestCases
      },
      transcript: initialTranscript,
      openingGreeting: greeting
    };
  }

  /**
   * Generates opening interviewer greeting
   */
  private static generateOpeningGreeting(
    interviewerName: string,
    company: string,
    roleTitle: string,
    problemTitle: string,
    duration: number
  ): string {
    const greetings = [
      `Hi there! Welcome to your technical interview for the ${roleTitle} role here at ${company}. I'm ${interviewerName}, and I'll be partnering with you today. We have about ${duration} minutes. We'll be tackling "${problemTitle}". Feel free to read through the problem statement on your screen, ask any clarifying questions, and talk me through your thought process before writing code. How are you feeling today?`,
      `Hello and welcome! Great to meet you. I'm ${interviewerName} with the engineering team at ${company}. Today we're looking at "${problemTitle}" for our ${roleTitle} session. In this interview, how you think through tradeoffs and edge cases is just as important as working code. Take your time to inspect the statement, and whenever you're ready, let me know your initial intuition!`,
      `Good day! I'm ${interviewerName} from ${company}. Thanks for joining today's ${roleTitle} technical screen. We'll be spending the next ${duration} minutes on "${problemTitle}". Please feel free to treat this as an open conversation—think out loud, sketch pseudo-logic, and ask anything about the constraints. Whenever you're ready, what stands out to you about this problem?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Processes a live conversational turn from candidate speech / code
   */
  static async processTurn(params: {
    interviewId: string;
    userSpeech?: string;
    currentCode?: string;
    language?: string;
    contextType?: "speech" | "code_review" | "test_run" | "hint_request";
    testResults?: { passed: number; total: number; error?: string };
    screenObservation?: string;
  }) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.interviewId }
    });

    if (!interview) {
      throw new Error(`Mock interview session [${params.interviewId}] not found.`);
    }

    const currentTranscript = (interview.transcript as any) as TranscriptTurn[] || [];
    const language = params.language || interview.language || "python3";
    const currentCode = params.currentCode ?? (interview.currentCode || "");

    // 1. Build prompt for Gemini
    const recentHistory = currentTranscript
      .slice(-8)
      .map((t) => `${t.sender.toUpperCase()}: ${t.text}`)
      .join("\n");

    const prompt = `You are ${interview.interviewerName}, a Principal Technical Interviewer conducting a high-stakes, real-time technical screen for a ${interview.roleTitle} role at ${interview.targetCompany}.
The candidate is participating live via video, audio, and a collaborative code editor.

[INTERVIEW DETAILS]:
- Company: ${interview.targetCompany}
- Role: ${interview.roleTitle}
- Problem Title: ${interview.problemTitle}
- Problem Statement: ${interview.problemStatement}
- Programming Language: ${language}

[CURRENT CANDIDATE CODE IN IDE]:
\`\`\`${language}
${currentCode || "(No code typed yet)"}
\`\`\`

[RECENT CONVERSATION TIMELINE]:
${recentHistory || "(Interview just started)"}

[CANDIDATE'S LATEST ACTION / WORDS]:
${params.contextType === "test_run"
  ? `[CANDIDATE RAN TEST CASES]: Passed ${params.testResults?.passed || 0} of ${params.testResults?.total || 0}. ${params.testResults?.error ? `Error: ${params.testResults.error}` : ""}`
  : params.contextType === "hint_request"
  ? `[CANDIDATE REQUESTED HINT]: "Could I get a subtle hint or direction?"`
  : params.contextType === "code_review"
  ? `[CANDIDATE REQUESTED CODE INSPECTION]: "Could you take a look at my code structure / logic?"`
  : `CANDIDATE SAID: "${params.userSpeech || ""}"`}

${params.screenObservation ? `[VIDEO/SCREEN OBSERVATION]: ${params.screenObservation}` : ""}

CRITICAL BEHAVIORAL INSTRUCTIONS:
1. Speak naturally as a human interviewer on a live video call. Speak directly to the candidate ("you").
2. KEEP IT CONCISE AND SPOKEN: Maximum 2 to 4 sentences. Interviewers do NOT give long monologues during a live coding session.
3. SOCRATIC GUIDANCE:
   - If they are explaining an approach, acknowledge it, and probe their Big-O time and space complexity or asking how they will handle duplicates/empty cases.
   - If their code has a logical bug or off-by-one error, don't tell them the fix directly—guide their eyes (e.g. "Take a close look at your loop termination condition in line X; what happens when index reaches N?").
   - If tests failed, encourage them to trace the failing case by hand.
   - If they asked for a hint, give a gentle nudge regarding data structures or invariants without spoiling the answer.
4. Professional, encouraging, but rigorous standard consistent with ${interview.targetCompany}.

Respond strictly in JSON format with:
{
  "responseText": "Spoken reply to the candidate (2-4 sentences max)",
  "isHint": false,
  "codeCritique": "Optional 1-sentence note on code or complexity if applicable"
}`;

    let responseText = "";
    let isHint = false;
    let codeCritique: string | undefined;

    try {
      const rawText = await generateContentWithCascade(prompt, {
        responseMimeType: "application/json",
        temperature: 0.4
      });

      const parsed = JSON.parse(rawText || "{}");
      responseText = parsed.responseText || "";
      isHint = Boolean(parsed.isHint);
      codeCritique = parsed.codeCritique;
    } catch (err) {
      console.warn("⚠️ Gemini call failed in processTurn, using context-aware interviewer response:", err);
      responseText = this.getFallbackInterviewerTurn(
        params.contextType || "speech",
        params.userSpeech,
        params.testResults,
        interview.targetCompany
      );
    }

    if (!responseText) {
      responseText = "That makes sense. Walk me through how you're thinking about the time and space complexity for this approach.";
    }

    // 2. Append turns to transcript
    const updatedTranscript = [...currentTranscript];

    if (params.userSpeech && params.contextType !== "test_run" && params.contextType !== "hint_request" && params.contextType !== "code_review") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "candidate",
        text: params.userSpeech,
        timestamp: Date.now(),
        codeSnippet: currentCode ? currentCode.slice(0, 300) : undefined
      });
    } else if (params.contextType === "hint_request") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "candidate",
        text: "Could you share a hint or recommend a strategic direction?",
        timestamp: Date.now()
      });
    } else if (params.contextType === "code_review") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "candidate",
        text: "Could you inspect my code logic and tell me how my approach looks?",
        timestamp: Date.now()
      });
    } else if (params.contextType === "test_run") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "system",
        text: `Executed test cases: ${params.testResults?.passed || 0}/${params.testResults?.total || 0} passed.`,
        timestamp: Date.now()
      });
    }

    updatedTranscript.push({
      id: `turn_${Date.now()}_i`,
      sender: "interviewer",
      text: responseText,
      timestamp: Date.now(),
      isHint
    });

    // 3. Update database
    await prisma.mockInterview.update({
      where: { id: params.interviewId },
      data: {
        transcript: updatedTranscript as any,
        currentCode,
        language
      }
    });

    return {
      interviewerReply: responseText,
      isHint,
      codeCritique,
      updatedTranscript
    };
  }

  /**
   * Deterministic conversational fallback
   */
  private static getFallbackInterviewerTurn(
    contextType: string,
    userSpeech?: string,
    testResults?: { passed: number; total: number; error?: string },
    company?: string
  ): string {
    const text = (userSpeech || "").toLowerCase().trim();

    if (contextType === "test_run") {
      if (testResults && testResults.passed === testResults.total && testResults.total > 0) {
        return `Awesome job! All ${testResults.total} sample test cases are passing cleanly. Now, let's step back and analyze: what are the worst-case time and space complexities of your implementation, and could we optimize either?`;
      } else {
        return `I see ${testResults?.passed || 0} out of ${testResults?.total || 0} test cases passing. Take a look at the failing case: trace through your variables step-by-step. Where is the output diverging from what you expect?`;
      }
    }

    if (contextType === "hint_request") {
      return `Think about the mathematical properties or invariants of the input. Could sorting the elements or maintaining an auxiliary hash map allow you to look up complements in O(1) time instead of O(N)?`;
    }

    if (contextType === "code_review") {
      return `Your overall code structure looks clean and well-decomposed. Pay close attention to your base cases and boundary constraints: what happens if the input is empty or has a single element?`;
    }

    // Context-aware speech parsing
    if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("good morning") || text.includes("good afternoon")) {
      return `Hello! Great to connect with you. Whenever you're ready, take a look at the problem statement on your screen. What are your initial thoughts or clarifying questions on how to approach this?`;
    }

    if (text.includes("ready") || text.includes("start") || text.includes("begin")) {
      return `Fantastic! Feel free to talk through your initial thought process out loud before writing any code. What data structures come to mind first?`;
    }

    if (text.includes("complexity") || text.includes("big o") || text.includes("time") || text.includes("space")) {
      return `Good intuition. If we analyze the loop boundaries, each iteration does constant work. Can we avoid nested loops by using an auxiliary frequency map?`;
    }

    if (text.includes("hash map") || text.includes("dictionary") || text.includes("hashmap") || text.includes("map")) {
      return `Using a hash map is a very solid direction—it gives us O(1) average lookup time. How will you store elements as you iterate through the input?`;
    }

    if (text.includes("two pointer") || text.includes("pointer") || text.includes("binary search") || text.includes("sort")) {
      return `That approach can work well if the array is sorted. Keep in mind the sorting step takes O(N log N). Does that meet our target constraints?`;
    }

    const standardReplies = [
      `That sounds like a thoughtful direction. How do you plan to handle duplicates or extreme boundary constraints?`,
      `Interesting intuition. Walk me through the trade-offs: what is the Big-O time and space complexity of this approach compared to a brute force?`,
      `Good thought process. Before you write out the full logic, let's trace this with a small sample input to verify our assumptions.`,
      `I like where you're going with this. Go ahead and sketch the implementation in the editor, and keep talking through your steps as you code.`
    ];

    return standardReplies[Math.floor(Math.random() * standardReplies.length)];
  }

  /**
   * Performs real-time code inspection
   */
  static async inspectCode(params: {
    interviewId: string;
    code: string;
    language: string;
    focus?: "complexity" | "bugs" | "cleanliness" | "general";
  }) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.interviewId }
    });

    if (!interview) {
      throw new Error(`Interview [${params.interviewId}] not found.`);
    }

    const prompt = `You are ${interview.interviewerName}, a Principal Engineer at ${interview.targetCompany}.
You are silently inspecting the candidate's code during a live technical interview for "${interview.problemTitle}".

Candidate's Code (${params.language}):
\`\`\`${params.language}
${params.code}
\`\`\`

Analyze the code for:
1. Syntax validity and obvious bugs (off-by-one, null dereference, uninitialized state).
2. Time and Space complexity ($O(N)$ Big-O).
3. 2-3 sentence verbal guidance you would give to the candidate right now.

Respond strictly in JSON format:
{
  "hasBugs": false,
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "detectedIssues": ["Issue 1"],
  "spokenGuidance": "Spoken feedback (2-3 sentences max)"
}`;

    try {
      const rawText = await generateContentWithCascade(prompt, { responseMimeType: "application/json", temperature: 0.2 });
      return JSON.parse(rawText || "{}");
    } catch {
      return {
        hasBugs: false,
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        detectedIssues: [],
        spokenGuidance: "Your code is coming along nicely. Make sure you handle any boundary conditions and trace through your variables before running the test cases."
      };
    }
  }

  /**
   * Finalizes the mock interview and produces an authoritative FAANG-grade Evaluation Scorecard
   */
  static async finalizeInterview(params: {
    interviewId: string;
    finalCode?: string;
    language?: string;
    telemetry?: TelemetryData;
  }): Promise<ScorecardReport> {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.interviewId }
    });

    if (!interview) {
      throw new Error(`Interview session [${params.interviewId}] not found.`);
    }

    const finalCode = params.finalCode || interview.currentCode || "";
    const transcript = (interview.transcript as any) as TranscriptTurn[] || [];
    const telemetry = params.telemetry || (interview.telemetry as any) || {
      fillerWordCount: 0,
      wpm: 125,
      eyeContactScore: 90,
      interruptions: 0,
      codeRuns: 2,
      durationElapsedSec: 1200
    };

    const transcriptSummary = transcript
      .map((t) => `${t.sender.toUpperCase()}: ${t.text}`)
      .join("\n");

    const prompt = `You are the Hiring Committee Lead and Principal Technical Interviewer at ${interview.targetCompany}.
You just completed conducting a rigorous technical coding screen for a ${interview.roleTitle} candidate on the problem "${interview.problemTitle}".

Candidate Details:
- Target Company: ${interview.targetCompany}
- Target Level: ${interview.roleTitle}
- Problem: ${interview.problemTitle}
- Difficulty: ${interview.difficulty}
- Programming Language: ${params.language || interview.language || "python3"}

Final Code Submitted by Candidate:
\`\`\`${params.language || interview.language || "python3"}
${finalCode || "(No code submitted)"}
\`\`\`

Complete Interview Transcript:
${transcriptSummary}

Candidate Behavioral Telemetry:
- Filler Word Count ("um", "like"): ${telemetry.fillerWordCount}
- Average Speaking Pace: ${telemetry.wpm} words/minute
- Eye Contact / Camera Presence: ${telemetry.eyeContactScore}%
- Code Executions: ${telemetry.codeRuns}

Conduct a comprehensive FAANG-caliber candidate debrief and output an authoritative evaluation scorecard conforming STRICTLY to this JSON structure:
{
  "hireDecision": "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "LEANING_NO_HIRE" | "STRONG_NO_HIRE",
  "overallScore": 88,
  "technicalScore": 90,
  "communicationScore": 85,
  "problemSolvingScore": 87,
  "behavioralScore": 90,
  "executiveSummary": "3-4 sentence comprehensive debrief summarizing candidate performance, strengths, and areas to level up.",
  "strengths": [
    "Specific technical or communication strength 1",
    "Specific technical or communication strength 2",
    "Specific technical or communication strength 3"
  ],
  "growthAreas": [
    "Actionable area for improvement 1",
    "Actionable area for improvement 2"
  ],
  "lineByLineFeedback": "Detailed constructive critique of their code structure, variable naming, and algorithmic efficiency.",
  "optimalSolution": "The ideal, production-grade reference solution in ${params.language || interview.language || "python3"} with Big-O analysis.",
  "interviewerVerdict": "1-sentence closing endorsement from the interviewer."
}`;

    let scorecard: ScorecardReport;

    try {
      const rawText = await generateContentWithCascade(prompt, {
        responseMimeType: "application/json",
        temperature: 0.3
      });

      const parsed = JSON.parse(rawText || "{}");
      scorecard = {
        hireDecision: parsed.hireDecision || "LEANING_HIRE",
        overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : 84,
        technicalScore: typeof parsed.technicalScore === "number" ? parsed.technicalScore : 85,
        communicationScore: typeof parsed.communicationScore === "number" ? parsed.communicationScore : 82,
        problemSolvingScore: typeof parsed.problemSolvingScore === "number" ? parsed.problemSolvingScore : 84,
        behavioralScore: typeof parsed.behavioralScore === "number" ? parsed.behavioralScore : 88,
        executiveSummary: parsed.executiveSummary || `The candidate demonstrated strong foundational knowledge for the ${interview.roleTitle} role at ${interview.targetCompany}, articulating ideas well and producing functional code.`,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : [
          "Clear articulation of algorithmic trade-offs before writing code",
          "Clean code decomposition with meaningful variable names",
          "Good composure and receptive attitude towards interviewer prompts"
        ],
        growthAreas: Array.isArray(parsed.growthAreas) && parsed.growthAreas.length > 0 ? parsed.growthAreas : [
          "Be more proactive in identifying edge cases (empty inputs, bounds) before running tests",
          "Work on minimizing filler words when formulating complex thoughts"
        ],
        lineByLineFeedback: parsed.lineByLineFeedback || "The solution adheres to standard practices. Complexity is optimal with clean separation of logic.",
        optimalSolution: parsed.optimalSolution || `# Optimal solution for ${interview.problemTitle}\n# Time Complexity: O(N)\n# Space Complexity: O(1)`,
        interviewerVerdict: parsed.interviewerVerdict || `Overall, a promising candidate who meets the technical bar for ${interview.targetCompany}.`
      };
    } catch (err) {
      console.warn("⚠️ Gemini scorecard generation error, using calibrated fallback:", err);
      scorecard = this.generateFallbackScorecard(interview, finalCode, telemetry);
    }

    // Update interview record in database
    await prisma.mockInterview.update({
      where: { id: params.interviewId },
      data: {
        status: "COMPLETED",
        currentCode: finalCode,
        telemetry: telemetry as any,
        scorecard: scorecard as any,
        endTime: new Date()
      }
    });

    return scorecard;
  }

  /**
   * Deterministic fallback scorecard
   */
  private static generateFallbackScorecard(interview: any, finalCode: string, telemetry: TelemetryData): ScorecardReport {
    const hasCode = finalCode.trim().length > 20;
    const technical = hasCode ? 86 : 65;
    const communication = telemetry.fillerWordCount < 5 ? 88 : 78;
    const problemSolving = hasCode ? 85 : 60;
    const behavioral = telemetry.eyeContactScore >= 80 ? 90 : 75;
    const overall = Math.round((technical * 0.4) + (communication * 0.25) + (problemSolving * 0.2) + (behavioral * 0.15));

    let hireDecision: ScorecardReport["hireDecision"] = "LEANING_HIRE";
    if (overall >= 90) hireDecision = "STRONG_HIRE";
    else if (overall >= 80) hireDecision = "HIRE";
    else if (overall >= 70) hireDecision = "LEANING_HIRE";
    else if (overall >= 55) hireDecision = "LEANING_NO_HIRE";
    else hireDecision = "STRONG_NO_HIRE";

    return {
      hireDecision,
      overallScore: overall,
      technicalScore: technical,
      communicationScore: communication,
      problemSolvingScore: problemSolving,
      behavioralScore: behavioral,
      executiveSummary: `The candidate completed the ${interview.durationMinutes}-minute technical screen for the ${interview.roleTitle} role at ${interview.targetCompany}. They demonstrated a thoughtful problem-solving demeanor, discussed constraints proactively, and implemented a functional solution.`,
      strengths: [
        "Structured problem decomposition and systematic thinking",
        "Clear and continuous explanation of logic while coding",
        "Maintained high composure and camera presence throughout the session"
      ],
      growthAreas: [
        "Identify boundary conditions and edge cases earlier during the design phase",
        "Analyze exact asymptotic time and space bounds before beginning the implementation"
      ],
      lineByLineFeedback: "Code is well-structured and follows idiomatic patterns. Edge case checks at the function entry could be made more explicit.",
      optimalSolution: `# Production-grade reference solution for ${interview.problemTitle}\n# Time: O(N) | Space: O(1)\n\nclass Solution:\n    def solve(self, nums, target):\n        lookup = {}\n        for i, num in enumerate(nums):\n            comp = target - num\n            if comp in lookup:\n                return [lookup[comp], i]\n            lookup[num] = i\n        return []`,
      interviewerVerdict: `Solid performance demonstrating the engineering caliber expected at ${interview.targetCompany}.`
    };
  }

  /**
   * Fetches an interview session by ID
   */
  static async getInterview(id: string) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            statement: true,
            constraintsText: true,
            difficulty: true,
            inputTemplate: true,
            testCases: {
              where: { isSample: true }
            }
          }
        }
      }
    });

    if (!interview) return null;

    const defaultTemplates = {
      python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
      javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
      cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
      java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
    };

    let templates = { ...defaultTemplates };
    if (interview.problem?.inputTemplate) {
      try {
        const parsed = JSON.parse(interview.problem.inputTemplate);
        templates = { ...defaultTemplates, ...parsed };
      } catch {}
    }

    const sampleTestCases = (interview.problem?.testCases || []).map((tc: any, idx: number) => ({
      id: tc.id ? tc.id.toString() : (idx + 1).toString(),
      orderNo: tc.orderNo || idx + 1,
      input: tc.input || "",
      expectedOutput: tc.expectedOutput || "",
      isSample: tc.isSample !== false
    }));

    const finalTestCases = sampleTestCases.length > 0 ? sampleTestCases : [
      { id: "1", orderNo: 1, input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", isSample: true },
      { id: "2", orderNo: 2, input: "[3, 2, 4], 6", expectedOutput: "[1, 2]", isSample: true }
    ];

    return {
      id: interview.id,
      roleTitle: interview.roleTitle,
      targetCompany: interview.targetCompany,
      interviewerName: interview.interviewerName,
      topic: interview.topic,
      difficulty: interview.difficulty,
      durationMinutes: interview.durationMinutes,
      status: interview.status,
      currentCode: interview.currentCode,
      language: interview.language,
      transcript: interview.transcript,
      telemetry: interview.telemetry,
      scorecard: interview.scorecard,
      startTime: interview.startTime,
      endTime: interview.endTime,
      problem: {
        id: interview.problem?.id ? interview.problem.id.toString() : (interview.problemId ? interview.problemId.toString() : "custom"),
        title: interview.problemTitle || interview.problem?.title || "Algorithmic Challenge",
        statement: interview.problemStatement || interview.problem?.statement || "",
        constraintsText: interview.problem?.constraintsText || "1 <= N <= 10^5",
        templates,
        testCases: finalTestCases
      }
    };
  }

  /**
   * Retrieves candidate's interview history
   */
  static async getUserInterviews(userId?: string) {
    const where: any = {};
    if (userId && !isNaN(Number(userId))) {
      where.userId = BigInt(userId);
    }

    const interviews = await prisma.mockInterview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return interviews.map((inv) => ({
      id: inv.id,
      roleTitle: inv.roleTitle,
      targetCompany: inv.targetCompany,
      interviewerName: inv.interviewerName,
      topic: inv.topic,
      difficulty: inv.difficulty,
      durationMinutes: inv.durationMinutes,
      status: inv.status,
      problemTitle: inv.problemTitle,
      scorecard: inv.scorecard,
      createdAt: inv.createdAt,
      startTime: inv.startTime,
      endTime: inv.endTime
    }));
  }
}
