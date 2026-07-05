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
app.post("/api/v1/judge/run", async (req, res): Promise<void> => {
  const { sourceCode, language, customInput } = req.body;

  if (!sourceCode) {
    res.status(400).json({ success: false, message: "Code payload cannot be blank." });
    return;
  }

  // Define a unique scratchpad workspace folder name to prevent multi-tenant file overrides
  const executionToken = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const workspacePath = path.join(__dirname, `../scratchpad_${executionToken}`);
  
  try {
    // Ensure the temporary workspace folder exists on disk
    if (!fs.existsSync(workspacePath)) {
      fs.mkdirSync(workspacePath, { recursive: true });
    }

    // 🐍 TRACK A: PYTHON INTERPRETER COMPILATION LOOP
    if (language === "python") {
      const scriptFile = path.join(workspacePath, "solution.py");
      fs.writeFileSync(scriptFile, sourceCode);

      // Pass input parameters into the execution terminal layer smoothly
      const executionProcess = exec(`python "${scriptFile}"`, { timeout: 4000 });
      
      if (customInput && executionProcess.stdin) {
        executionProcess.stdin.write(customInput);
        executionProcess.stdin.end();
      }

      let consoleOutput = "";
      let runtimeErrors = "";

      executionProcess.stdout?.on("data", (chunk) => consoleOutput += chunk);
      executionProcess.stderr?.on("data", (chunk) => runtimeErrors += chunk);

      executionProcess.on("close", (exitCode) => {
        // Safe file system cleanup
        fs.rmSync(workspacePath, { recursive: true, force: true });

        if (exitCode !== 0 || runtimeErrors) {
          res.status(200).json({ success: true, output: `Runtime Exception Encountered:\n${runtimeErrors}` });
        } else {
          res.status(200).json({ success: true, output: consoleOutput || "Execution completed successfully with blank logs." });
        }
      });
    } 
    // 🛠️ TRACK B: C++ NATIVE COMPILER LOOP
    else if (language === "cpp") {
      const sourceFile = path.join(workspacePath, "solution.cpp");
      const binaryFile = path.join(workspacePath, "executable.out");
      fs.writeFileSync(sourceFile, sourceCode);

      // Compile the raw code file via g++ binaries
      exec(`g++ "${sourceFile}" -o "${binaryFile}"`, { timeout: 5000 }, (compileError, stdout, compileStderr) => {
        if (compileError || compileStderr) {
          fs.rmSync(workspacePath, { recursive: true, force: true });
          res.status(200).json({ success: true, output: `Compilation Syntax Error:\n${compileStderr || compileError?.message}` });
          return;
        }

        // Execute compiled binaries safely
        const binaryProcess = exec(`"${binaryFile}"`, { timeout: 4000 });

        if (customInput && binaryProcess.stdin) {
          binaryProcess.stdin.write(customInput);
          binaryProcess.stdin.end();
        }

        let runOutput = "";
        let runStderr = "";

        binaryProcess.stdout?.on("data", (chunk) => runOutput += chunk);
        binaryProcess.stderr?.on("data", (chunk) => runStderr += chunk);

        binaryProcess.on("close", (exitCode) => {
          fs.rmSync(workspacePath, { recursive: true, force: true });
          if (exitCode !== 0 || runStderr) {
            res.status(200).json({ success: true, output: `Runtime Exception:\n${runStderr}` });
          } else {
            res.status(200).json({ success: true, output: runOutput || "Execution completed successfully with blank logs." });
          }
        });
      });
    } else {
      fs.rmSync(workspacePath, { recursive: true, force: true });
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