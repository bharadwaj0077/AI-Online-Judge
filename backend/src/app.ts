import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path"; // 🟩 FIXED: Added missing path utility import
import fs from "fs"; // 🟩 FIXED: Added missing file system stream utility import
import { exec } from "child_process"; // 🟩 FIXED: Added missing execution process utility import

import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import problemRoutes from "./routes/problem.routes"; 
import judgeRoutes from "./routes/judge.routes"; 
import submissionRoutes from "./routes/submission.routes";
import aiRoutes from "./routes/ai.routes";
import userRoutes from "./routes/user.routes";
import contestRoutes from "./routes/contest.routes";
import { prisma } from "./config/db";

const app = express();

// 1. Core Security Boundary & Global Middleware Configurations (Mounted at Top)
app.use(helmet());
app.use(
  cors({ 
    origin: "http://localhost:3000", // 🟩 FIXED: Moved unified origin control to the head of the file
    credentials: true 
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 2. Register Functional Application Endpoint Hierarchies
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problems", problemRoutes); 
app.use("/api/v1/judge", judgeRoutes); 
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/contests", contestRoutes);

// Global API Version Base Entry Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Online Judge Engine Gateway Live." });
});

/**
 * POST /api/v1/judge/run
 * ⚡ REAL RUNTIME EXECUTION COCKPIT:
 * Compiles and runs actual C++ or Python code using local system binaries
 */
/**
 * POST /api/v1/judge/run
 * ⚡ LEETCODE-STYLE AUTOMATED RUNTIME EXECUTION COCKPIT:
 * Appends problem-specific driver test cases to the user's solution functions
 */
app.post("/api/v1/judge/run", async (req, res): Promise<void> => {
  // 🚀 Added problemId to the incoming body destructuring array
  const { sourceCode, language, customInput, problemId } = req.body;

  if (!sourceCode) {
    res.status(400).json({ success: false, message: "Code payload cannot be blank." });
    return;
  }

  const executionToken = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const workspacePath = path.join(__dirname, `../scratchpad_${executionToken}`);
  
  try {
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    // 🟩 LEETCODE INJECTION PIECE:
    // Look up the database to see if this problem has a hidden driver script test runner
    let combinedExecutableCode = sourceCode;
    if (problemId) {
      const problemSpecs = await prisma.problem.findUnique({
        where: { id: BigInt(problemId) },
        select: { driverScript: true }
      });
      if (problemSpecs?.driverScript) {
        // Automatically inject the hidden driver sequence separated by clean newlines
        combinedExecutableCode = `${sourceCode}\n\n${problemSpecs.driverScript}`;
      }
    }

    // 🐍 TRACK A: PYTHON INTERPRETER LOOP
    if (language === "python") {
      const scriptFile = path.join(workspacePath, "solution.py");
      // 🚀 Crucial Fix: Write the COMBINED code block onto disk, not just the user raw string input
      fs.writeFileSync(scriptFile, combinedExecutableCode);

      exec(`python "${scriptFile}"`, { timeout: 4000 }, (runError, stdout, stderr) => {
        if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
        const combinedOutput = (stdout + stderr).trim();
        res.status(200).json({
          success: true,
          output: combinedOutput || "Execution completed with 0 errors, but returned no console outputs."
        });
      });
    } 
    // 🛠️ TRACK B: C++ NATIVE COMPILER LOOP
    else if (language === "cpp") {
      const sourceFile = path.join(workspacePath, "solution.cpp");
      const binaryFile = path.join(workspacePath, "executable.out");
      // 🚀 Crucial Fix: Write the COMBINED code block here as well
      fs.writeFileSync(sourceFile, combinedExecutableCode);

      exec(`g++ "${sourceFile}" -o "${binaryFile}"`, { timeout: 5000 }, (compileError, stdout, compileStderr) => {
        if (compileError || compileStderr) {
          if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
          res.status(200).json({ success: true, output: `Compilation Syntax Error:\n${compileStderr || compileError?.message}` });
          return;
        }

        exec(`"${binaryFile}"`, { timeout: 4000 }, (runError, runStdout, runStderr) => {
          if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
          const combinedOutput = (runStdout + runStderr).trim();
          res.status(200).json({
            success: true,
            output: combinedOutput || "Execution completed successfully with exit code 0."
          });
        });
      });
    } else {
      if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
      res.status(400).json({ success: false, message: "Selected programming track parameters unsupported." });
    }

  } catch (error: any) {
    if (fs.existsSync(workspacePath)) fs.rmSync(workspacePath, { recursive: true, force: true });
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Fallback Catch-All Central Error Middleware Handler (Must be Registered Last)
app.use(errorHandler);

export default app;