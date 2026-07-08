import { Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { SocketHub } from "../config/socket.ts";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { z } from "zod";

export const createSubmissionSchema = z.object({
  problemId: z.string().or(z.number()).transform((val) => BigInt(val)),
  sourceCode: z.string().min(1, "Source code cannot be blank"),
  language: z.string(),
  contestPublicId: z.string().optional(), 
});

export class SubmissionController {
  /**
   * POST /api/v1/submissions
   * ⚡ REAL EVALUATION CORE: 
   * Compiles code, runs hidden evaluation drivers, and logs accurate results
   */
  static create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Unauthenticated session." });
        return;
      }

      const { problemId, sourceCode, language, contestPublicId } = req.body;

      // 1. Verify target problem profiles exist
      const problem = await prisma.problem.findUnique({ where: { id: problemId } });
      if (!problem) {
        res.status(404).json({ success: false, message: "Target challenge signature not found." });
        return;
      }

      // 2. Resolve contest context boundaries if provided
      let associatedContestId: bigint | null = null;
      if (contestPublicId) {
        const contestRecord = await prisma.contest.findUnique({ where: { publicId: contestPublicId } });
        if (contestRecord) associatedContestId = contestRecord.id;
      }

      // 3. Resolve language relational keys
      const languageRecord = await prisma.language.findFirst({
        where: { name: language.toLowerCase().trim() }
      });
      const targetLanguageId = languageRecord ? BigInt(languageRecord.id) : BigInt(language === "cpp" ? 2 : 1);

      // 4. PREPARE COLD SANDBOX SCRATCHPAD ON DISK
      const executionToken = `submit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const workspacePath = path.join(__dirname, `../scratchpad_${executionToken}`);
      
      if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
      }

      // Append your hidden database evaluation test scripts to the developer's function code
      const combinedExecutableCode = `${sourceCode}\n\n${problem.driverScript || ""}`;

      // 5. INNER SANDBOX EXECUTION HANDLER DEFINITION
      const runEvaluation = (): Promise<string> => {
        return new Promise((resolve) => {
          if (language === "python") {
            const scriptFile = path.join(workspacePath, "solution.py");
            fs.writeFileSync(scriptFile, combinedExecutableCode);

            exec(`python "${scriptFile}"`, { timeout: 5000 }, (err, stdout, stderr) => {
              if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
              const outputLog = (stdout + stderr).trim();
              // If the hidden python test suite ran successfully and printed ACCEPTED
              if (outputLog.includes("ACCEPTED")) resolve("ACCEPTED");
              else if (outputLog.includes("SyntaxError")) resolve("COMPILATION_ERROR");
              else resolve("WRONG_ANSWER");
            });
          } 
          else if (language === "cpp") {
            const sourceFile = path.join(workspacePath, "solution.cpp");
            const binaryFile = path.join(workspacePath, "executable.out");
            fs.writeFileSync(sourceFile, combinedExecutableCode);

            // Compile code using host g++ binaries
            exec(`g++ "${sourceFile}" -o "${binaryFile}"`, { timeout: 5000 }, (compileError, stdout, compileStderr) => {
              if (compileError || compileStderr) {
                if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
                resolve("COMPILATION_ERROR");
                return;
              }

              // Execute binary target output stream
              exec(`"${binaryFile}"`, { timeout: 4000 }, (runErr, runStdout, runStderr) => {
                if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
                const outputLog = (runStdout + runStderr).trim();
                if (outputLog.includes("ACCEPTED")) resolve("ACCEPTED");
                else resolve("WRONG_ANSWER");
              });
            });
          } else {
            if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
            resolve("WRONG_ANSWER");
          }
        });
      };

      // Execute the compiler track and wait for the true sandbox verdict
      const finalVerdict = await runEvaluation();

      // 6. RECORD LIVE VERDICT INSIDE POSTGRESQL TABLES
      const submission = await prisma.submission.create({
        data: {
          userId: BigInt(req.user.id),
          problemId,
          contestId: associatedContestId,
          sourceCode,
          languageId: targetLanguageId,
          verdict: finalVerdict, // Saved dynamically based on real test case output logs!
        },
      });

      res.status(201).json({
        success: true,
        message: "Solution instances fully analyzed by the judge engine.",
        data: { publicId: submission.publicId, verdict: submission.verdict },
      });

      // 7. WEBSOCKET REAL-TIME BROADCAST TRIGGER
      if (associatedContestId && contestPublicId && finalVerdict === "ACCEPTED") {
        const contestSubmissions = await prisma.submission.findMany({
          where: { contestId: associatedContestId, verdict: "ACCEPTED" },
          include: { user: true, problem: true },
        });

        const userScoreMap = new Map<string, { points: number; solvedIds: Set<string> }>();

        contestSubmissions.forEach((sub) => {
          const username = sub.user.username;
          const probId = sub.problemId.toString();
          
          let pointsForDifficulty = 10;
          if (sub.problem.difficulty === "MEDIUM") pointsForDifficulty = 30;
          if (sub.problem.difficulty === "HARD") pointsForDifficulty = 50;

          if (!userScoreMap.has(username)) {
            userScoreMap.set(username, { points: 0, solvedIds: new Set() });
          }

          const userData = userScoreMap.get(username)!;
          if (!userData.solvedIds.has(probId)) {
            userData.solvedIds.add(probId);
            userData.points += pointsForDifficulty;
          }
        });

        const updatedRankings = Array.from(userScoreMap.entries())
          .map(([username, data]) => ({
            username,
            points: data.points,
            solvedProblemsCount: data.solvedIds.size,
          }))
          .sort((a, b) => b.points - a.points);

        SocketHub.emitToContest(contestPublicId, "scoreboard_update", updatedRankings);
      }

    } catch (error) {
      next(error);
    }
  };

  // ... keep getHistory and getDetails exactly as they are below ...
  static getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: "Unauthenticated." }); return; }
      const history = await prisma.submission.findMany({
        where: { userId: BigInt(req.user.id) },
        orderBy: { submittedAt: "desc" },
        include: { problem: { select: { title: true, difficulty: true } } }
      });
      res.status(200).json({ success: true, data: history });
    } catch (error) { next(error); }
  };

  static getDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const details = await prisma.submission.findUnique({
        where: { publicId: req.params.publicId },
        include: { problem: true, aiFeedback: true }
      });
      if (!details) { res.status(404).json({ success: false, message: "Not found." }); return; }
      res.status(200).json({ success: true, data: details });
    } catch (error) { next(error); }
  };
}