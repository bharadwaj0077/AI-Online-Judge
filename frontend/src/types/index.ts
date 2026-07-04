export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface Problem {
  id: string;
  publicId: string;
  title: string;
  slug: string;
  statement: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  createdAt: string;
}

export interface Submission {
  id: string;
  publicId: string;
  userId: string;
  problemId: string;
  languageId: string;
  sourceCode: string;
  verdict: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "COMPILATION_ERROR";
  score: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  submittedAt: string;
}

export interface AiFeedback {
  id: string;
  publicId: string;
  submissionId: string;
  analysis: string;
  hints: string;
  timeComplexity: string;
  spaceComplexity: string;
  createdAt: string;
}