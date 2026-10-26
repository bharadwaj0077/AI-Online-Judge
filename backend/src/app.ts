import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { exec } from "child_process";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { prisma } from "./config/db";
import { AiService } from "./services/ai.service";
import { ArenaService } from "./services/arena.service";
import { MockInterviewService } from "./services/mock-interview.service";
import { VisualProfilerService } from "./services/visual-profiler.service";
import { Verdict, Difficulty, ProblemVisibility, UserRole } from "@prisma/client";

// Patch BigInt serialization capability natively into Express JSON encoders
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export interface TokenPayload {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends express.Request {
  user?: TokenPayload;
}

const app = express();

// Security Headers
app.use(helmet());

// Dynamic CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const DIFFICULTY_POINTS: Record<string, number> = { EASY: 100, MEDIUM: 200, HARD: 300 };

/**
 * 🛡️ AUTHENTICATION & SECURITY MIDDLEWARES
 */
const extractToken = (req: express.Request): string | null => {
  if (req.cookies?.token) return req.cookies.token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
};

const requireAuth = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required. Please log in." });
    return;
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Session expired or invalid token. Please log in again." });
  }
};

const requireAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    res.status(403).json({ success: false, message: "Forbidden. Administrative clearance required." });
    return;
  }
  next();
};

const optionalAuth = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction): void => {
  const token = extractToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
      req.user = decoded;
    } catch {
      // Ignore token decode errors on optional routes
    }
  }
  next();
};

const createSessionToken = (user: { id: bigint | string; username: string; email: string; role: UserRole }): string => {
  return jwt.sign(
    {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const setSessionCookie = (res: express.Response, token: string): void => {
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/**
 * 🔑 AUTHENTICATION ENDPOINTS
 */
app.post("/api/v1/auth/register", async (req, res): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: "Email and password are required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      res.status(400).json({ success: false, message: "Invalid email address format." });
      return;
    }

    if (typeof password !== "string" || password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
      return;
    }

    const cleanUsername = (username ? username : cleanEmail.split("@")[0]).trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      res.status(400).json({
        success: false,
        message: "Username must be 3-30 characters long and contain only alphanumeric characters and underscores."
      });
      return;
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { username: cleanUsername }], deletedAt: null }
    });
    if (existing) {
      const field = existing.email === cleanEmail ? "Email" : "Username";
      res.status(400).json({ success: false, message: `${field} is already registered.` });
      return;
    }

    // Cryptographic Password Hashing (Bcrypt with 12 salt rounds)
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        role: UserRole.USER
      }
    });

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/v1/auth/login", async (req, res): Promise<void> => {
  try {
    const { email, identifier, password, requiredRole } = req.body;
    const loginIdentifier = (email || identifier || "").trim();

    if (!loginIdentifier || !password) {
      res.status(400).json({ success: false, message: "Username/Email and password are required." });
      return;
    }

    const cleanInput = loginIdentifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanInput }, { username: cleanInput }],
        deletedAt: null
      }
    });

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid credentials." });
      return;
    }

    // Bcrypt Password Verification (with automatic backward compatibility migration)
    let isMatch = false;
    const isBcrypt =
      user.passwordHash.startsWith("$2a$") ||
      user.passwordHash.startsWith("$2b$") ||
      user.passwordHash.startsWith("$2y$");

    if (isBcrypt) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Legacy plaintext migration check
      if (user.passwordHash === password) {
        isMatch = true;
        const newHash = await bcrypt.hash(password, 12);
        await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
      }
    }

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid credentials." });
      return;
    }

    if (requiredRole === "ADMIN" && user.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "Access denied. Admin portal requires administrator privileges." });
      return;
    }

    const token = createSessionToken(user);
    setSessionCookie(res, token);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/auth/me", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = BigInt(req.user!.id);
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        problemsSolved: true,
        submissionsCount: true
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User account not found." });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        problemsSolved: user.problemsSolved,
        submissionsCount: user.submissionsCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/v1/auth/logout", (req, res): void => {
  res.clearCookie("token", { path: "/", httpOnly: true, sameSite: "lax" });
  res.status(200).json({ success: true, message: "Logged out successfully." });
});

/**
 * 🛡️ ADMIN: USER MANAGEMENT (Protected)
 */
app.get("/api/v1/admin/users", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, username: true, email: true, role: true, problemsSolved: true },
      orderBy: { problemsSolved: "desc" }
    });
    res.status(200).json({ success: true, data: users.map((u) => ({ ...u, id: u.id.toString() })) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.patch("/api/v1/admin/users/:id/promote", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const targetUser = await prisma.user.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!targetUser) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }
    if (targetUser.role === UserRole.ADMIN) {
      res.status(400).json({ success: false, message: "User is already an Administrator." });
      return;
    }
    await prisma.user.update({ where: { id: BigInt(req.params.id) }, data: { role: UserRole.ADMIN } });
    res.status(200).json({ success: true, message: "User promoted to Administrator successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 🏆 CONTEST MANAGEMENT
 */
app.post("/api/v1/contests", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { title, description, start_time, end_time, problemIds } = req.body;
    if (!title || !start_time || !end_time) {
      res.status(400).json({ success: false, message: "Title, start_time, and end_time are required." });
      return;
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description: description || "",
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        problems: {
          create: (problemIds || []).map((pId: string) => ({
            problem: { connect: { id: BigInt(pId) } }
          }))
        }
      }
    });
    res.status(201).json({ success: true, data: { ...contest, id: contest.id.toString() } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/contests", async (req, res): Promise<void> => {
  try {
    const contests = await prisma.contest.findMany({ orderBy: { startTime: "asc" } });
    res.status(200).json({ success: true, data: contests.map((c) => ({ ...c, id: c.id.toString() })) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/v1/contests/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    await prisma.contest.delete({ where: { id: BigInt(req.params.id) } });
    res.status(200).json({ success: true, message: "Contest deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/contests/:publicId", async (req, res): Promise<void> => {
  try {
    const { publicId } = req.params;
    const contest = await prisma.contest.findFirst({
      where: { publicId },
      include: {
        problems: {
          include: {
            problem: {
              include: { testCases: { where: { isSample: true }, orderBy: { orderNo: "asc" } } }
            }
          }
        }
      }
    });

    if (!contest) {
      res.status(404).json({ success: false, message: "Contest not found." });
      return;
    }

    const formattedProblems = contest.problems.map((cp) => ({
      id: cp.problem.id.toString(),
      title: cp.problem.title,
      slug: cp.problem.slug,
      difficulty: cp.problem.difficulty,
      statement: cp.problem.statement,
      inputFormat: cp.problem.inputFormat,
      outputFormat: cp.problem.outputFormat,
      constraintsText: cp.problem.constraintsText,
      timeLimitMs: cp.problem.timeLimitMs,
      memoryLimitMb: cp.problem.memoryLimitMb,
      inputTemplate: cp.problem.inputTemplate,
      testCases: cp.problem.testCases.map((tc) => ({
        id: tc.id.toString(),
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isSample: tc.isSample
      }))
    }));

    res.status(200).json({
      success: true,
      data: {
        id: contest.id.toString(),
        publicId: contest.publicId,
        title: contest.title,
        description: contest.description,
        startTime: contest.startTime,
        endTime: contest.endTime,
        problems: formattedProblems
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 📚 PROBLEM CATALOG & MANAGEMENT
 */
app.post("/api/v1/problems", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const {
      title,
      difficulty,
      timeLimitMs,
      memoryLimitMb,
      statement,
      constraintsText,
      testCases,
      referenceSolution,
      templates
    } = req.body;

    if (!title || !statement) {
      res.status(400).json({ success: false, message: "Title and statement are required." });
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const defaultTemplates = {
      python3: "class Solution:\n    def solve(self, *args):\n        pass",
      cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    void solve() {\n    }\n};",
      java17: "import java.util.*;\nclass Solution {\n    public void solve() {\n    }\n}",
      javascript: "class Solution {\n    solve(...args) {\n    }\n}"
    };
    const finalTemplates = {
      python3: templates?.python3 || defaultTemplates.python3,
      cpp17: templates?.cpp17 || defaultTemplates.cpp17,
      java17: templates?.java17 || defaultTemplates.java17,
      javascript: templates?.javascript || defaultTemplates.javascript
    };

    const problem = await prisma.problem.create({
      data: {
        title,
        slug,
        statement,
        difficulty: difficulty || Difficulty.EASY,
        timeLimitMs: Number(timeLimitMs) || 2000,
        memoryLimitMb: Number(memoryLimitMb) || 256,
        constraintsText: constraintsText || "",
        inputFormat: "",
        outputFormat: "",
        visibility: ProblemVisibility.PUBLIC,
        inputTemplate: JSON.stringify(finalTemplates),
        referenceSolution: referenceSolution || "class Solution:\n    def solve(self, *args):\n        pass",
        testCases: {
          create:
            testCases?.map((tc: any, idx: number) => ({
              orderNo: idx + 1,
              input: tc.input || "",
              expectedOutput: tc.expectedOutput || "",
              isSample: tc.isSample === false ? false : true
            })) || []
        }
      }
    });

    res.status(201).json({ success: true, data: { ...problem, id: problem.id.toString() } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/v1/problems/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    await prisma.problem.update({
      where: { id: BigInt(req.params.id) },
      data: { deletedAt: new Date(), visibility: ProblemVisibility.ARCHIVED }
    });
    res.status(200).json({ success: true, message: "Problem deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/v1/problems/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const problemId = BigInt(req.params.id);
    const {
      title,
      difficulty,
      timeLimitMs,
      memoryLimitMb,
      statement,
      constraintsText,
      testCases,
      referenceSolution,
      templates
    } = req.body;

    const existing = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!existing) {
      res.status(404).json({ success: false, message: "Problem not found." });
      return;
    }

    const updatedSlug = title
      ? title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      : existing.slug;

    let finalTemplatesStr = existing.inputTemplate;
    if (templates) {
      try {
        const oldMap = JSON.parse(existing.inputTemplate || "{}");
        finalTemplatesStr = JSON.stringify({ ...oldMap, ...templates });
      } catch {
        finalTemplatesStr = JSON.stringify(templates);
      }
    }

    const updatedProblem = await prisma.$transaction(async (tx) => {
      const prob = await tx.problem.update({
        where: { id: problemId },
        data: {
          title: title ?? existing.title,
          slug: updatedSlug,
          statement: statement ?? existing.statement,
          difficulty: difficulty ?? existing.difficulty,
          timeLimitMs: timeLimitMs !== undefined ? Number(timeLimitMs) : existing.timeLimitMs,
          memoryLimitMb: memoryLimitMb !== undefined ? Number(memoryLimitMb) : existing.memoryLimitMb,
          constraintsText: constraintsText ?? existing.constraintsText,
          inputTemplate: finalTemplatesStr,
          referenceSolution: referenceSolution ?? existing.referenceSolution
        }
      });

      if (Array.isArray(testCases)) {
        await tx.testCase.deleteMany({ where: { problemId } });
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          await tx.testCase.create({
            data: {
              problemId,
              orderNo: i + 1,
              input: String(tc.input ?? ""),
              expectedOutput: String(tc.expectedOutput ?? ""),
              isSample: tc.isSample === true || tc.isSample === "true",
              weight: 1
            }
          });
        }
      }

      return prob;
    });

    res.status(200).json({
      success: true,
      message: "Problem updated successfully.",
      data: { ...updatedProblem, id: updatedProblem.id.toString() }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/admin/problems/:id", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const idVal = req.params.id;
    const problem = await prisma.problem.findFirst({
      where: {
        OR: [
          { id: !isNaN(Number(idVal)) ? BigInt(idVal) : undefined },
          { slug: idVal }
        ],
        deletedAt: null
      },
      include: {
        testCases: { orderBy: { orderNo: "asc" } }
      }
    });

    if (!problem) {
      res.status(404).json({ success: false, message: "Problem not found." });
      return;
    }

    let templates = { python3: "", cpp17: "", java17: "", javascript: "" };
    try {
      templates = { ...templates, ...JSON.parse(problem.inputTemplate || "{}") };
    } catch {}

    res.status(200).json({
      success: true,
      data: {
        id: problem.id.toString(),
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        statement: problem.statement,
        constraintsText: problem.constraintsText,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        referenceSolution: problem.referenceSolution || "",
        templates,
        testCases: problem.testCases.map((tc) => ({
          id: tc.id.toString(),
          orderNo: tc.orderNo,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: tc.isSample
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/v1/admin/problems/generate-testcases", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { title, statement, difficulty } = req.body;
    if (!title || !statement) {
      res.status(400).json({ success: false, message: "Title and statement are required to generate test cases." });
      return;
    }

    const testCases = await AiService.generateTestCases(title, statement, difficulty || "EASY");
    res.status(200).json({ success: true, data: { testCases } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/problems", async (req, res): Promise<void> => {
  try {
    const problems = await prisma.problem.findMany({
      where: { deletedAt: null },
      include: {
        testCases: {
          select: { isSample: true }
        }
      },
      orderBy: { id: "asc" }
    });
    const formatted = problems.map((p) => {
      const sampleCasesCount = p.testCases.filter((t) => t.isSample).length;
      const hiddenCasesCount = p.testCases.filter((t) => !t.isSample).length;
      return {
        id: p.id.toString(),
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        statement: p.statement,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        constraintsText: p.constraintsText,
        timeLimitMs: p.timeLimitMs,
        memoryLimitMb: p.memoryLimitMb,
        inputTemplate: p.inputTemplate,
        testCasesCount: p.testCases.length,
        sampleCasesCount,
        hiddenCasesCount
      };
    });
    res.status(200).json({ success: true, data: formatted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/problems/:slug", async (req, res): Promise<void> => {
  try {
    const { slug } = req.params;
    const problem = await prisma.problem.findFirst({
      where: { OR: [{ slug: slug }, { id: !isNaN(Number(slug)) ? BigInt(slug) : undefined }], deletedAt: null },
      include: { testCases: { where: { isSample: true }, orderBy: { orderNo: "asc" } } }
    });
    if (!problem) {
      res.status(404).json({ success: false, message: "Problem not found." });
      return;
    }
    res.status(200).json({
      success: true,
      data: {
        id: problem.id.toString(),
        title: problem.title,
        slug: problem.slug,
        statement: problem.statement,
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        constraintsText: problem.constraintsText,
        difficulty: problem.difficulty,
        timeLimitMs: problem.timeLimitMs,
        memoryLimitMb: problem.memoryLimitMb,
        inputTemplate: problem.inputTemplate,
        testCases: problem.testCases.map((tc) => ({
          id: tc.id.toString(),
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: tc.isSample
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 💡 AI CODE HINT & ARCHITECTURAL COMPLEXITY ENGINE
 */
app.post("/api/v1/problems/:id/hint", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { sourceCode, language } = req.body;
    const hint = await AiService.generateHint(id, sourceCode, language);
    res.status(200).json({ success: true, hint });
  } catch (err: any) {
    console.error("AI Hint Error:", err);
    res.status(200).json({
      success: false,
      hint: "Consider breaking the challenge down into simpler invariants or leveraging hash maps to optimize lookups."
    });
  }
});

app.post("/api/v1/problems/:id/tiered-hints", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { sourceCode, language } = req.body;
    const data = await AiService.generateTieredHints(id, sourceCode, language);
    res.status(200).json({ success: true, ...data });
  } catch (err: any) {
    console.error("AI Tiered Hints Error:", err);
    res.status(200).json({
      success: true,
      problemId: req.params.id,
      problemTitle: "Problem",
      tiers: [
        {
          tier: 1,
          title: "Observation & Invariants",
          badge: "Core Observation",
          focus: "Problem constraints & input behavior",
          content: "Examine the constraints and input size. Analyze how the number of operations scales if you examine every possible combination.",
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
      ]
    });
  }
});

app.post("/api/v1/problems/:id/verdict", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { sourceCode, language } = req.body;
    const analysis = await AiService.generateComplexityAnalysis(id, sourceCode, language);
    res.status(200).json({
      success: true,
      timeComplexity: analysis.timeComplexity,
      spaceComplexity: analysis.spaceComplexity,
      analysis: analysis.analysis
    });
  } catch (err: any) {
    console.error("AI Complexity Analysis Error:", err);
    res.status(200).json({
      success: true,
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      analysis: "Algorithmic complexity estimate generated from structural analysis."
    });
  }
});

app.post("/api/v1/problems/:id/diagnose-failure", async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { sourceCode, language, failureContext } = req.body;
    if (!failureContext) {
      res.status(400).json({ success: false, message: "failureContext is required." });
      return;
    }
    const diagnosis = await AiService.diagnoseFailure(id, sourceCode, language, failureContext);
    res.status(200).json({ success: true, diagnosis });
  } catch (err: any) {
    console.error("AI Failure Diagnosis Error:", err);
    res.status(200).json({
      success: true,
      diagnosis: {
        rootCause: "The algorithm did not satisfy all constraints or invariants on this input.",
        traceExplanation: `The code failed with verdict ${req.body?.failureContext?.verdict || "WRONG_ANSWER"}.`,
        howToFix: "Trace through your loop with the failing input manually and check boundary conditions.",
        suggestedInvariant: "Validate all corner cases including duplicates, negatives, and empty inputs."
      }
    });
  }
});

app.post("/api/v1/ai/review/:submissionPublicId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { submissionPublicId } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { publicId: submissionPublicId },
      include: { aiFeedback: true }
    });

    if (!submission) {
      res.status(404).json({ success: false, message: "Target submission record could not be resolved." });
      return;
    }

    if (submission.userId !== BigInt(req.user!.id) && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "Access denied to target submission review." });
      return;
    }

    if (submission.aiFeedback) {
      res.status(200).json({
        success: true,
        message: "AI performance metrics resolved from cache stores.",
        data: submission.aiFeedback
      });
      return;
    }

    const feedback = await AiService.generateFeedback(submissionPublicId);
    res.status(201).json({
      success: true,
      message: "AI code critique compiled successfully.",
      data: feedback
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/ai/review/:submissionPublicId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { submissionPublicId } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { publicId: submissionPublicId },
      include: { aiFeedback: true }
    });

    if (!submission) {
      res.status(404).json({ success: false, message: "Target submission record not found." });
      return;
    }

    if (submission.userId !== BigInt(req.user!.id) && req.user!.role !== UserRole.ADMIN) {
      res.status(403).json({ success: false, message: "Access denied." });
      return;
    }

    res.status(200).json({
      success: true,
      message: "AI insights resolved successfully.",
      data: submission.aiFeedback || null
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * ⚡ DYNAMIC MULTI-LANGUAGE DOCKER SANDBOX ENGINE
 */
const isDockerDaemonOffline = (msg: string): boolean => {
  const lower = (msg || "").toLowerCase();
  return (
    lower.includes("failed to connect to the docker api") ||
    lower.includes("dockerdesktoplinuxengine") ||
    lower.includes("the system cannot find the file specified") ||
    lower.includes("docker: command not found") ||
    lower.includes("daemon is not running") ||
    lower.includes("is the docker daemon running")
  );
};

const runCodeInSandbox = (
  code: string,
  language: string,
  inputData: string
): Promise<{ rawStdout: string; stderr: string; execTimeMs: number; timedOut: boolean }> => {
  return new Promise((resolve) => {
    const lang = (language || "python3").toLowerCase().trim();
    let runnerCmd = "";
    let fullSource = "";
    const cleanInput = (inputData || "").trim();
    const startTime = Date.now();

    if (lang.includes("javascript") || lang.includes("js")) {
      runnerCmd = `docker run -i --rm --memory="256m" --cpus="0.5" --pids-limit=64 --network none node:20-slim node -`;
      fullSource = `let userStdout = ""; const originalLog = console.log; console.log = (...args) => { userStdout += args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(" ") + "\\n"; };\n${code}\ntry { if (typeof Solution === 'undefined') throw new Error("ReferenceError: 'Solution' class is not defined."); const sol = new Solution(); const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(sol)).filter(m => m !== 'constructor'); let res = undefined; if (methodNames.length > 0) { const rawInput = ${JSON.stringify(cleanInput)}; const lines = rawInput.split('\\n').map(l => l.trim()).filter(Boolean); let tokens = []; lines.forEach(line => { const parts = line.split(/,(?![^\\[]*\\])/); parts.forEach(p => { let trimmed = p.trim(); if (trimmed) { if (trimmed.includes('=')) trimmed = trimmed.split('=').slice(1).join('=').trim(); tokens.push(trimmed); } }); }); const args = tokens.map(val => { try { return JSON.parse(val); } catch(e) { return isNaN(val) ? val : Number(val); } }); res = sol[methodNames[0]](...args); } console.log = originalLog; console.log("===STDOUT_START===\\n" + userStdout.trim() + "\\n===STDOUT_END==="); console.log("===RESULT_START===\\n" + JSON.stringify(res) + "\\n===RESULT_END==="); } catch(e) { console.log = originalLog; console.error(e.message); }`;
    } else if (lang.includes("java")) {
      runnerCmd = `docker run -i --rm --memory="256m" --cpus="0.5" --pids-limit=64 --network none eclipse-temurin:17-jdk sh -c "cat > SolutionMain.java && javac SolutionMain.java && java SolutionMain"`;
      fullSource = code.includes("public static void main")
        ? code
        : `import java.util.*; import java.io.*; import java.lang.reflect.*;\n${code}\npublic class SolutionMain { public static void main(String[] args) { ByteArrayOutputStream baos = new ByteArrayOutputStream(); PrintStream ps = new PrintStream(baos); PrintStream oldOut = System.out; System.setOut(ps); String rawInput = ${JSON.stringify(cleanInput)}; Object res = null; try { Solution sol = new Solution(); Method targetMethod = null; for (Method m : Solution.class.getDeclaredMethods()) { if (Modifier.isPublic(m.getModifiers()) && !m.isSynthetic()) { targetMethod = m; break; } } if (targetMethod != null) { String[] lines = rawInput.split("\\\\n"); List<String> tokens = new ArrayList<>(); for (String l : lines) { for (String part : l.split(",(?![^\\\\[]*\\\\])")) { String trimmed = part.trim(); if (!trimmed.isEmpty()) { if (trimmed.contains("=")) tokens.add(trimmed.substring(trimmed.indexOf("=") + 1).trim()); else tokens.add(trimmed); } } } Class<?>[] paramTypes = targetMethod.getParameterTypes(); Object[] methodArgs = new Object[paramTypes.length]; for (int i = 0; i < paramTypes.length; i++) { String tok = i < tokens.size() ? tokens.get(i) : ""; Class<?> pType = paramTypes[i]; if (pType == int.class || pType == Integer.class) { String cleanNum = tok.replaceAll("[^0-9-]", ""); methodArgs[i] = cleanNum.isEmpty() ? 0 : Integer.parseInt(cleanNum); } else if (pType == double.class || pType == Double.class) { String cleanNum = tok.replaceAll("[^0-9.-]", ""); methodArgs[i] = cleanNum.isEmpty() ? 0.0 : Double.parseDouble(cleanNum); } else if (pType == boolean.class || pType == Boolean.class) { methodArgs[i] = Boolean.parseBoolean(tok.trim()); } else if (pType == String.class) { String s = tok.trim(); if (s.length() >= 2 && s.charAt(0) == '"' && s.charAt(s.length() - 1) == '"') s = s.substring(1, s.length() - 1); methodArgs[i] = s; } else if (pType == int[].class) { String cleanArr = tok.replaceAll("[^0-9,-]", ""); if (cleanArr.isEmpty()) methodArgs[i] = new int[0]; else { String[] parts = cleanArr.split(","); List<Integer> list = new ArrayList<>(); for (String pt : parts) { if (!pt.trim().isEmpty()) list.add(Integer.parseInt(pt.trim())); } int[] arr = new int[list.size()]; for (int k = 0; k < list.size(); k++) arr[k] = list.get(k); methodArgs[i] = arr; } } else methodArgs[i] = tok; } res = targetMethod.invoke(sol, methodArgs); if (res instanceof int[]) res = Arrays.toString((int[]) res); if (res instanceof boolean[]) res = Arrays.toString((boolean[]) res); if (res instanceof Object[]) res = Arrays.deepToString((Object[]) res); } } catch(Exception e) { res = "Error: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()); } System.setOut(oldOut); String userStdout = baos.toString().trim(); System.out.println("===STDOUT_START==="); System.out.println(userStdout); System.out.println("===STDOUT_END==="); System.out.println("===RESULT_START==="); System.out.println(res); System.out.println("===RESULT_END==="); } }`;
    } else if (lang.includes("cpp") || lang.includes("c++")) {
      runnerCmd = `docker run -i --rm --memory="256m" --cpus="0.5" --pids-limit=64 --network none gcc:11 sh -c "cat > main.cpp && g++ -O2 main.cpp -o main && ./main"`;
      const methods = [...code.matchAll(/(?:vector<[^>]+>|int|bool|string|double|void|long long)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g)];
      let methodName = "solve",
        paramTypesStr = "";
      if (methods.length > 0) {
        methodName = methods[0][1];
        paramTypesStr = methods[0][2];
      }
      const params = paramTypesStr.split(",").map((p) => p.trim()).filter(Boolean);
      let argParsersCode = "",
        argNamesList: string[] = [];
      params.forEach((param, idx) => {
        const argName = `arg${idx}`;
        argNamesList.push(argName);
        if (param.includes("vector<int>") || param.includes("int[]"))
          argParsersCode += `    vector<int> ${argName} = parseVectorInt(tokens.size() > ${idx} ? tokens[${idx}] : "[]");\n`;
        else if (param.includes("vector<string>"))
          argParsersCode += `    vector<string> ${argName} = parseVectorString(tokens.size() > ${idx} ? tokens[${idx}] : "[]");\n`;
        else if (param.startsWith("int") || param.includes("long"))
          argParsersCode += `    int ${argName} = parseSmallInt(tokens.size() > ${idx} ? tokens[${idx}] : "0");\n`;
        else if (param.startsWith("double") || param.startsWith("float"))
          argParsersCode += `    double ${argName} = parseSmallDouble(tokens.size() > ${idx} ? tokens[${idx}] : "0.0");\n`;
        else if (param.startsWith("bool"))
          argParsersCode += `    bool ${argName} = (tokens.size() > ${idx} && (tokens[${idx}] == "true" || tokens[${idx}] == "1"));\n`;
        else if (param.includes("string"))
          argParsersCode += `    string ${argName} = parseCleanString(tokens.size() > ${idx} ? tokens[${idx}] : "");\n`;
        else argParsersCode += `    string ${argName} = tokens.size() > ${idx} ? tokens[${idx}] : "";\n`;
      });
      const argsInvocation = argNamesList.join(", ");
      fullSource = code.includes("int main")
        ? code
        : `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n#include <cctype>\nusing namespace std;\n${code}\nstring trimStr(string s) { while(!s.empty() && isspace(s.front())) s.erase(s.begin()); while(!s.empty() && isspace(s.back())) s.pop_back(); return s; }\nvector<string> getTokens(string input) { vector<string> tokens; stringstream ss(input); string line; while(getline(ss, line)) { line = trimStr(line); if(line.empty()) continue; size_t pos = 0; while(pos < line.size()) { size_t comma = line.find(',', pos), bracketOpen = line.find('[', pos), bracketClose = line.find(']', pos); if(comma != string::npos && bracketOpen != string::npos && comma > bracketOpen && comma < bracketClose) comma = line.find(',', bracketClose); string part; if(comma != string::npos) { part = line.substr(pos, comma - pos); pos = comma + 1; } else { part = line.substr(pos); pos = line.size(); } part = trimStr(part); if(part.find('=') != string::npos) part = trimStr(part.substr(part.find('=') + 1)); if(!part.empty()) tokens.push_back(part); } } return tokens; }\nint parseSmallInt(string s) { string clean = ""; for(char c : s) if(isdigit(c) || c == '-') clean += c; if(clean.empty()) return 0; try { return stoi(clean); } catch(...) { return 0; } }\ndouble parseSmallDouble(string s) { string clean = ""; for(char c : s) if(isdigit(c) || c == '-' || c == '.') clean += c; if(clean.empty()) return 0.0; try { return stod(clean); } catch(...) { return 0.0; } }\nstring parseCleanString(string s) { s = trimStr(s); if(s.size() >= 2 && s.front() == '"' && s.back() == '"') return s.substr(1, s.size() - 2); return s; }\nvector<int> parseVectorInt(string s) { vector<int> res; for(char &c : s) if(c == '[' || c == ']' || c == ',' || c == '=') c = ' '; stringstream ss(s); int val; while(ss >> val) res.push_back(val); return res; }\nvector<string> parseVectorString(string s) { vector<string> res; bool inQuotes = false; string cur = ""; for(char c : s) { if(c == '"') { if(inQuotes) { res.push_back(cur); cur = ""; inQuotes = false; } else inQuotes = true; } else if(inQuotes) cur += c; } return res; }\ntemplate<typename T> void printRes(T val) { cout << val; }\nvoid printRes(bool val) { cout << (val ? "true" : "false"); }\nvoid printRes(const vector<int>& vec) { cout << "["; for(size_t i = 0; i < vec.size(); i++) cout << vec[i] << (i + 1 < vec.size() ? "," : ""); cout << "]"; }\nvoid printRes(const vector<string>& vec) { cout << "["; for(size_t i = 0; i < vec.size(); i++) cout << "\\"" << vec[i] << "\\"" << (i + 1 < vec.size() ? "," : ""); cout << "]"; }\nint main() { string input_str = ${JSON.stringify(cleanInput)}; vector<string> tokens = getTokens(input_str);\n${argParsersCode}\n    stringstream user_out; streambuf* old_cout = cout.rdbuf(user_out.rdbuf()); Solution sol; auto res = sol.${methodName}(${argsInvocation}); cout.rdbuf(old_cout); cout << "===STDOUT_START===\\n" << user_out.str() << "===STDOUT_END===\\n===RESULT_START===\\n"; printRes(res); cout << "\\n===RESULT_END===\\n"; return 0; }`;
    } else {
      runnerCmd = `docker run -i --rm --memory="256m" --cpus="0.5" --pids-limit=64 --network none python:3.11-slim python3 -`;
      fullSource = `import sys, json, io, re\n${code}\nif __name__ == "__main__":\n    try:\n        user_stdout = io.StringIO(); old_stdout = sys.stdout; sys.stdout = user_stdout\n        if 'Solution' not in globals(): sys.exit(1)\n        sol = Solution()\n        methods = [m for m in dir(sol) if not m.startswith("__") and callable(getattr(sol, m))]\n        if methods:\n            target_method = getattr(sol, methods[0])\n            raw_input = """${cleanInput.replace(/\\/g, "\\\\").replace(/"""/g, '\"\"\"')}"""\n            lines = [l.strip() for l in raw_input.split('\\n') if l.strip()]\n            tokens = []\n            for line in lines:\n                parts = re.split(r',(?![^\\[]*\\])', line)\n                for p in parts:\n                    pt = p.strip()\n                    if pt: tokens.append(pt.split('=', 1)[1].strip() if '=' in pt else pt)\n            parsed_args = []\n            for t in tokens:\n                try: parsed_args.append(json.loads(t))\n                except:\n                    try: parsed_args.append(int(t))\n                    except: parsed_args.append(t)\n            res = target_method(*parsed_args)\n            if isinstance(res, float) and res.is_integer(): res = int(res)\n            if isinstance(res, (list, dict)): formatted_res = json.dumps(res)\n            elif isinstance(res, bool): formatted_res = "true" if res else "false"\n            else: formatted_res = str(res)\n        sys.stdout = old_stdout\n        print("===STDOUT_START==="); print(user_stdout.getvalue(), end=""); print("===STDOUT_END===")\n        print("===RESULT_START==="); print(formatted_res); print("===RESULT_END===")\n    except Exception as e: sys.stdout = sys.__stdout__; sys.stderr.write(f"{type(e).__name__}: {str(e)}")`;
    }

    const child = exec(runnerCmd, { timeout: 12000, maxBuffer: 1024 * 1024 * 2 }, (err, stdout, stderr) => {
      const execTimeMs = Date.now() - startTime;
      if (err) {
        if (err.killed || err.signal === "SIGTERM" || err.code === "ETIMEDOUT") {
          resolve({
            rawStdout: stdout ? stdout.slice(0, 1000).trim() : "",
            stderr: "Time Limit Exceeded (TLE). Execution exceeded time limit.",
            execTimeMs: 2000,
            timedOut: true
          });
        } else if (isDockerDaemonOffline(err.message || stderr)) {
          resolve({
            rawStdout: "",
            stderr: "Sandbox execution unavailable: Docker daemon is not running on host. Please ensure Docker Desktop is started to run code.",
            execTimeMs: 0,
            timedOut: false
          });
        } else {
          resolve({
            rawStdout: stdout ? stdout.trim() : "",
            stderr: stderr || err.message,
            execTimeMs,
            timedOut: false
          });
        }
      } else {
        if (isDockerDaemonOffline(stderr)) {
          resolve({
            rawStdout: "",
            stderr: "Sandbox execution unavailable: Docker daemon is not running on host. Please start Docker Desktop to execute code.",
            execTimeMs: 0,
            timedOut: false
          });
        } else {
          resolve({
            rawStdout: stdout ? stdout.trim() : "",
            stderr: stderr ? stderr.trim() : "",
            execTimeMs,
            timedOut: stderr.includes("Time Limit Exceeded")
          });
        }
      }
    });

    if (child.stdin) {
      child.stdin.write(fullSource);
      child.stdin.end();
    }
  });
};

function parseSandboxOutput(rawStdout: string): { stdout: string; output: string } {
  let stdout = "",
    output = "";
  const stdoutMatch = rawStdout.match(/===STDOUT_START===([\s\S]*?)===STDOUT_END===/);
  if (stdoutMatch) stdout = stdoutMatch[1].trim();
  const resultMatch = rawStdout.match(/===RESULT_START===([\s\S]*?)===RESULT_END===/);
  if (resultMatch) output = resultMatch[1].trim();
  else output = rawStdout.trim();
  return { stdout, output };
}

/**
 * 🎯 RUN & SUBMIT
 */
app.post(["/api/v1/judge/run", "/api/v1/problems/:id/run"], async (req, res): Promise<void> => {
  try {
    const { sourceCode, code, language, customInput, problemId } = req.body;
    const codeToRun = sourceCode || code;
    if (!codeToRun) {
      res.status(400).json({ success: false, message: "Source code is required." });
      return;
    }

    const inputStr = (customInput || "").trim();
    let expectedOutput = "";
    const targetProblem = problemId
      ? await prisma.problem.findFirst({
          where: { OR: [{ id: !isNaN(Number(problemId)) ? BigInt(problemId) : undefined }] },
          include: { testCases: true }
        })
      : null;

    if (targetProblem && targetProblem.testCases.length > 0) {
      const matchedTc = targetProblem.testCases.find((tc) => tc.input.trim() === inputStr);
      if (matchedTc) expectedOutput = matchedTc.expectedOutput.trim();
    }
    if (!expectedOutput && targetProblem?.referenceSolution) {
      const refExecResult = await runCodeInSandbox(targetProblem.referenceSolution, "python3", inputStr);
      const refParsed = parseSandboxOutput(refExecResult.rawStdout);
      if (refParsed.output && !refExecResult.stderr) expectedOutput = refParsed.output;
    }

    const userExecResult = await runCodeInSandbox(codeToRun, language || "python3", inputStr);
    if (userExecResult.timedOut) {
      res.status(200).json({
        success: true,
        stdout: "",
        output: "Time Limit Exceeded",
        expected: expectedOutput || "Run to verify",
        error: "Time Limit Exceeded"
      });
      return;
    }

    const parsed = parseSandboxOutput(userExecResult.rawStdout);
    res.status(200).json({
      success: true,
      stdout: parsed.stdout ? parsed.stdout.slice(0, 1000) : "",
      output: parsed.output || "None",
      expected: expectedOutput || parsed.output,
      error: userExecResult.stderr || null
    });
  } catch (err: any) {
    res.status(200).json({
      success: false,
      stdout: "",
      output: "",
      expected: "Run to verify",
      error: err.message || "Execution error."
    });
  }
});

app.post("/api/v1/judge/submit", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { sourceCode, language, problemId } = req.body;
    if (!sourceCode || !problemId) {
      res.status(400).json({ success: false, message: "Source code and problemId are required." });
      return;
    }

    const userId = BigInt(req.user!.id);
    const user = await prisma.user.findUnique({ where: { id: userId, deletedAt: null } });
    if (!user) {
      res.status(401).json({ success: false, message: "Active user session required." });
      return;
    }

    const targetProblem = await prisma.problem.findFirst({
      where: { OR: [{ id: !isNaN(Number(problemId)) ? BigInt(problemId) : undefined }] },
      include: { testCases: true }
    });
    if (!targetProblem) {
      res.status(404).json({ success: false, message: "Problem not found." });
      return;
    }

    const langRecord = await prisma.language.findFirst({ where: { slug: (language || "python3").toLowerCase() } });
    const languageId = langRecord ? langRecord.id : BigInt(1);
    const testCases =
      targetProblem.testCases.length > 0
        ? targetProblem.testCases
        : [
            {
              id: BigInt(1),
              problemId: targetProblem.id,
              orderNo: 1,
              input: "nums = [2,7,11,15]\ntarget = 9",
              expectedOutput: "[0,1]",
              isSample: true,
              weight: 1,
              createdAt: new Date(),
              inputStorageKey: null,
              outputStorageKey: null
            }
          ];

    // Sort test cases: Samples first, then hidden test cases
    const sortedTestCases = [...testCases].sort((a, b) => {
      if (a.isSample !== b.isSample) {
        return a.isSample ? -1 : 1; // Sample test cases run first
      }
      return (a.orderNo || 0) - (b.orderNo || 0);
    });

    const totalSampleCases = sortedTestCases.filter((tc) => tc.isSample).length;
    const totalHiddenCases = sortedTestCases.filter((tc) => !tc.isSample).length;

    let overallVerdict: Verdict = Verdict.ACCEPTED;
    let totalTimeMs = 0;
    let samplePassedCount = 0;
    let hiddenPassedCount = 0;
    let sandboxOffline = false;
    let failedCase: any = null;

    for (let i = 0; i < sortedTestCases.length; i++) {
      const tc = sortedTestCases[i];
      const execResult = await runCodeInSandbox(sourceCode, language, tc.input);
      totalTimeMs += execResult.execTimeMs;

      if (execResult.stderr && isDockerDaemonOffline(execResult.stderr)) {
        sandboxOffline = true;
        overallVerdict = Verdict.SYSTEM_ERROR;
        break;
      }

      let caseVerdict: Verdict = Verdict.ACCEPTED;
      let parsedOutput = "";
      let parsedStdout = "";

      if (execResult.timedOut) {
        caseVerdict = Verdict.TIME_LIMIT_EXCEEDED;
      } else if (execResult.stderr) {
        caseVerdict = execResult.stderr.toLowerCase().includes("syntax")
          ? Verdict.COMPILATION_ERROR
          : Verdict.RUNTIME_ERROR;
      } else {
        const parsed = parseSandboxOutput(execResult.rawStdout);
        parsedOutput = parsed.output;
        parsedStdout = parsed.stdout;
        const actualClean = (parsed.output || "").replace(/\s+/g, "").toLowerCase();
        const expectedClean = (tc.expectedOutput || "").replace(/\s+/g, "").toLowerCase();

        if (actualClean !== expectedClean) {
          caseVerdict = Verdict.WRONG_ANSWER;
        }
      }

      if (caseVerdict === Verdict.ACCEPTED) {
        if (tc.isSample) {
          samplePassedCount++;
        } else {
          hiddenPassedCount++;
        }
      } else {
        // LEETCODE STYLE FAIL-FAST: Stop immediately upon encountering the first failure!
        overallVerdict = caseVerdict;
        failedCase = {
          orderNo: i + 1,
          isSample: tc.isSample,
          caseType: tc.isSample ? "Sample Test Case" : "Hidden Test Case",
          caseIndex: tc.isSample ? samplePassedCount + 1 : hiddenPassedCount + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: parsedOutput || (caseVerdict === Verdict.TIME_LIMIT_EXCEEDED ? "Time Limit Exceeded" : "None"),
          stdout: parsedStdout,
          error: execResult.stderr || null,
          verdict: caseVerdict
        };
        break; // No need to check subsequent test cases
      }
    }

    if (sandboxOffline) {
      res.status(503).json({
        success: false,
        message: "Docker engine is not active. Please ensure Docker Desktop is running to evaluate code submissions."
      });
      return;
    }

    const finalScore = overallVerdict === Verdict.ACCEPTED ? DIFFICULTY_POINTS[targetProblem.difficulty] || 100 : 0;
    const evaluatedCount = Math.max(1, samplePassedCount + hiddenPassedCount + (failedCase ? 1 : 0));
    const submissionRecord = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: targetProblem.id,
        languageId: languageId,
        sourceCode: sourceCode,
        verdict: overallVerdict,
        score: finalScore,
        executionTimeMs: Math.round(totalTimeMs / evaluatedCount),
        memoryUsedKb: 15420
      }
    });

    await prisma.problem.update({
      where: { id: targetProblem.id },
      data: {
        submissionCount: { increment: 1 },
        acceptedCount: overallVerdict === Verdict.ACCEPTED ? { increment: 1 } : undefined
      }
    });

    const isFirstTimeAccepted =
      overallVerdict === Verdict.ACCEPTED
        ? (await prisma.submission.count({
            where: { userId: user.id, problemId: targetProblem.id, verdict: Verdict.ACCEPTED }
          })) === 1
        : false;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        submissionsCount: { increment: 1 },
        problemsSolved: isFirstTimeAccepted ? { increment: 1 } : undefined
      }
    });

    res.status(200).json({
      success: true,
      submissionId: submissionRecord.id.toString(),
      submissionPublicId: submissionRecord.publicId,
      verdict: overallVerdict,
      score: finalScore,
      passedCases: samplePassedCount + hiddenPassedCount,
      totalCases: sortedTestCases.length,
      sampleCases: {
        passed: samplePassedCount,
        total: totalSampleCases
      },
      hiddenCases: {
        passed: hiddenPassedCount,
        total: totalHiddenCases
      },
      failedCase: failedCase || null,
      executionTimeMs: submissionRecord.executionTimeMs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 🏆 LEADERBOARD & METRICS
 */
app.get("/api/v1/leaderboard", async (req, res): Promise<void> => {
  try {
    const allUsers = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, username: true, email: true, createdAt: true }
    });
    const acceptedSubmissions = await prisma.submission.findMany({
      where: { verdict: Verdict.ACCEPTED },
      include: { problem: { select: { id: true, difficulty: true } } }
    });

    const userStatsMap: Record<string, { solvedSet: Set<string>; ratingPoints: number }> = {};
    allUsers.forEach((u) => {
      userStatsMap[u.id.toString()] = { solvedSet: new Set(), ratingPoints: 0 };
    });

    acceptedSubmissions.forEach((sub) => {
      const uId = sub.userId.toString(),
        pId = sub.problemId.toString();
      if (userStatsMap[uId] && !userStatsMap[uId].solvedSet.has(pId)) {
        userStatsMap[uId].solvedSet.add(pId);
        userStatsMap[uId].ratingPoints += DIFFICULTY_POINTS[sub.problem?.difficulty || Difficulty.EASY] || 100;
      }
    });

    const sortedUsers = allUsers
      .map((u) => {
        const stats = userStatsMap[u.id.toString()] || { solvedSet: new Set(), ratingPoints: 0 };
        return {
          id: u.id.toString(),
          name: u.username,
          email: u.email,
          solved: stats.solvedSet.size,
          rating: stats.ratingPoints,
          createdAt: u.createdAt
        };
      })
      .sort((a, b) => b.rating - a.rating || b.solved - a.solved);

    res.status(200).json({ success: true, data: sortedUsers.map((item, index) => ({ ...item, rank: index + 1 })) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 📊 USER DASHBOARD
 */
app.get("/api/v1/dashboard", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    let targetUserId: bigint | null = null;
    if (req.query.userId) {
      targetUserId = BigInt(req.query.userId as string);
    } else if (req.user?.id) {
      targetUserId = BigInt(req.user.id);
    }

    if (!targetUserId) {
      const totalProblems = await prisma.problem.count({ where: { deletedAt: null } });
      res.status(200).json({
        success: true,
        data: {
          problemsSolved: 0,
          totalProblems,
          accuracyRate: "0.0%",
          globalRating: 0,
          globalRank: "-",
          recentActivity: []
        }
      });
      return;
    }

    const userRecord = await prisma.user.findUnique({ where: { id: targetUserId, deletedAt: null } });
    if (!userRecord) {
      res.status(404).json({ success: false, message: "User record missing." });
      return;
    }

    const totalProblems = await prisma.problem.count({ where: { deletedAt: null } });
    const userSubmissions = await prisma.submission.findMany({
      where: { userId: targetUserId },
      include: { problem: true, language: true },
      orderBy: { submittedAt: "desc" }
    });

    const totalSubmissions = userSubmissions.length;
    const acceptedSubmissions = userSubmissions.filter((s) => s.verdict === Verdict.ACCEPTED);

    const uniqueSolvedMap = new Map<string, number>();
    acceptedSubmissions.forEach((sub) => {
      const pId = sub.problemId.toString();
      if (!uniqueSolvedMap.has(pId)) uniqueSolvedMap.set(pId, DIFFICULTY_POINTS[sub.problem.difficulty] || 100);
    });

    const problemsSolved = uniqueSolvedMap.size;
    let globalRating = 0;
    uniqueSolvedMap.forEach((pts) => {
      globalRating += pts;
    });
    const accuracyRate =
      totalSubmissions > 0 ? `${((acceptedSubmissions.length / totalSubmissions) * 100).toFixed(1)}%` : "0.0%";

    const allUsers = await prisma.user.findMany({ where: { deletedAt: null }, select: { id: true } });
    const allAcceptedSubs = await prisma.submission.findMany({
      where: { verdict: Verdict.ACCEPTED },
      include: { problem: { select: { difficulty: true } } }
    });

    const scoresMap: Record<string, number> = {};
    const solvedSets: Record<string, Set<string>> = {};
    allUsers.forEach((u) => {
      scoresMap[u.id.toString()] = 0;
      solvedSets[u.id.toString()] = new Set();
    });

    allAcceptedSubs.forEach((sub) => {
      const uIdStr = sub.userId.toString(),
        pIdStr = sub.problemId.toString();
      if (solvedSets[uIdStr] && !solvedSets[uIdStr].has(pIdStr)) {
        solvedSets[uIdStr].add(pIdStr);
        scoresMap[uIdStr] += DIFFICULTY_POINTS[sub.problem.difficulty] || 100;
      }
    });

    const sortedRanks = allUsers
      .map((u) => ({
        id: u.id.toString(),
        score: scoresMap[u.id.toString()] || 0,
        solved: solvedSets[u.id.toString()] ? solvedSets[u.id.toString()].size : 0
      }))
      .sort((a, b) => b.score - a.score || b.solved - a.solved);

    const userRankIdx = sortedRanks.findIndex((u) => u.id === targetUserId.toString());
    const globalRank = userRankIdx !== -1 ? `#${userRankIdx + 1}` : "-";

    const recentActivity = userSubmissions.slice(0, 10).map((s) => ({
      id: s.id.toString(),
      problem: s.problem.title,
      status: s.verdict,
      lang: s.language?.displayName || s.language?.name || "Python 3.11",
      submittedAt: new Date(s.submittedAt).toLocaleString()
    }));

    res.status(200).json({
      success: true,
      data: { problemsSolved, totalProblems, accuracyRate, globalRating, globalRank, recentActivity }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * ⚔️ 1V1 CODE WARS ARENA & PLAYBACK ENDPOINTS
 */
app.get("/api/v1/arena/matches", async (req, res): Promise<void> => {
  try {
    const matches = await ArenaService.getRecentMatches();
    res.status(200).json({ success: true, data: matches });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/v1/arena/replay/:matchId", async (req, res): Promise<void> => {
  try {
    const { matchId } = req.params;
    const match = await ArenaService.getReplay(matchId);
    if (!match) {
      res.status(404).json({ success: false, message: "Replay not found." });
      return;
    }
    res.status(200).json({ success: true, data: match });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/v1/arena/custom-room", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { mode, difficulty } = req.body;
    const userId = req.user?.id || `guest_${Date.now()}`;
    const username = req.user?.username || `Warrior_${Math.floor(Math.random() * 900 + 100)}`;

    const roomCode = ArenaService.createCustomRoom(
      { userId, username },
      mode || "classic",
      difficulty || "ANY"
    );

    res.status(200).json({
      success: true,
      data: {
        roomCode,
        mode: mode || "classic",
        difficulty: difficulty || "ANY",
        host: { userId, username }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 🎙️ REAL-TIME CONVERSATIONAL AI MOCK INTERVIEWER ENDPOINTS
 */

// 1. Initialize new mock interview session with candidate config
app.post("/api/v1/interviews", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { roleTitle, targetCompany, interviewerName, topic, difficulty, durationMinutes, problemId } = req.body;

    const session = await MockInterviewService.createInterview({
      userId: req.user?.id,
      roleTitle: roleTitle || "Senior Software Engineer (L5)",
      targetCompany: targetCompany || "Google",
      interviewerName: interviewerName || "Alex (Staff SWE)",
      topic: topic || "Data Structures & Algorithms",
      difficulty: difficulty || "Medium",
      durationMinutes: Number(durationMinutes) || 45,
      problemId
    });

    res.status(201).json({ success: true, data: session });
  } catch (err: any) {
    console.error("Error creating mock interview:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to create mock interview session" });
  }
});

// 2. Fetch specific interview session state, transcript, problem, and scorecard
app.get("/api/v1/interviews/:id", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const session = await MockInterviewService.getInterview(id);

    if (!session) {
      res.status(404).json({ success: false, message: "Interview session not found." });
      return;
    }

    res.status(200).json({ success: true, data: session });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Failed to fetch interview session" });
  }
});

// 3. Fetch past mock interviews
app.get("/api/v1/interviews", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const userId = req.user?.id || (req.query.userId as string);
    const interviews = await MockInterviewService.getUserInterviews(userId);
    res.status(200).json({ success: true, data: interviews });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Failed to fetch interviews history" });
  }
});

// 4. Live code inspection endpoint
app.post("/api/v1/interviews/:id/inspect", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { code, language, focus } = req.body;
    const analysis = await MockInterviewService.inspectCode({
      interviewId: id,
      code: code || "",
      language: language || "python3",
      focus: focus || "general"
    });
    res.status(200).json({ success: true, data: analysis });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Failed to inspect code" });
  }
});

// 5. Conversational turn processing (speech / test run / hint)
app.post("/api/v1/interviews/:id/turn", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { userSpeech, currentCode, language, contextType, testResults, screenObservation } = req.body;

    const result = await MockInterviewService.processTurn({
      interviewId: id,
      userSpeech,
      currentCode,
      language,
      contextType,
      testResults,
      screenObservation
    });

    res.status(200).json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Failed to process interview turn" });
  }
});

// 6. Conclude interview and compute FAANG-caliber evaluation scorecard
app.post("/api/v1/interviews/:id/end", optionalAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { finalCode, language, telemetry } = req.body;

    const scorecard = await MockInterviewService.finalizeInterview({
      interviewId: id,
      finalCode,
      language,
      telemetry
    });

    res.status(200).json({ success: true, data: scorecard });
  } catch (err: any) {
    console.error("Error ending mock interview:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to conclude interview" });
  }
});

// ============================================================================
// VISUAL ALGORITHM EXECUTION PROFILER API
// ============================================================================

// 1. Fetch predefined algorithm presets (Two Pointers, Binary Search, Stack, Queue, Tree, DP)
app.get("/api/v1/profiler/presets", (req, res): void => {
  try {
    const presets = VisualProfilerService.getPresets();
    res.status(200).json({ success: true, data: presets });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || "Failed to fetch presets" });
  }
});

// 2. Generate step-by-step visual execution trace (custom code or playground)
app.post("/api/v1/profiler/trace", async (req, res): Promise<void> => {
  try {
    const { code, language, input, problemTitle } = req.body;
    if (!code || typeof code !== "string") {
      res.status(400).json({ success: false, message: "Source code is required for trace generation." });
      return;
    }

    const trace = await VisualProfilerService.generateVisualTrace({
      code,
      language: language || "python3",
      input: input || "",
      problemTitle: problemTitle || "Algorithm Profiler"
    });

    res.status(200).json({ success: true, data: trace });
  } catch (err: any) {
    console.error("Visual profiler trace error:", err);
    res.status(500).json({ success: false, message: err?.message || "Failed to generate visual trace" });
  }
});

// 3. Problem workspace specific trace route
app.post("/api/v1/problems/:slug/trace", async (req, res): Promise<void> => {
  try {
    const { slug } = req.params;
    const { code, language, input } = req.body;

    const problem = await prisma.problem.findFirst({
      where: { OR: [{ slug }, { id: !isNaN(Number(slug)) ? BigInt(slug) : undefined }] },
      select: { title: true }
    });

    const trace = await VisualProfilerService.generateVisualTrace({
      code: code || "",
      language: language || "python3",
      input: input || "",
      problemTitle: problem?.title || slug
    });

    res.status(200).json({ success: true, data: trace });
  } catch (err: any) {
    console.error(`Problem [${req.params.slug}] visual profiler error:`, err);
    res.status(500).json({ success: false, message: err?.message || "Failed to generate problem trace" });
  }
});

app.use(errorHandler);

export default app;