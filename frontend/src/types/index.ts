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

export interface FailedTestCaseDetail {
  orderNo: number;
  isSample: boolean;
  caseType: string;
  caseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stdout?: string;
  error?: string | null;
  verdict: string;
}

export interface FailureDiagnosis {
  rootCause: string;
  traceExplanation: string;
  howToFix: string;
  suggestedInvariant: string;
}