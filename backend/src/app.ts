import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import { prisma } from "./config/db";
import problemRoutes from "./routes/problem.routes"; 

const app = express();
app.use(helmet());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api/v1/problems", problemRoutes); 

const dockerLanguageMap: Record<string, { image: string; file: string; cmd: string }> = {
  python3: { image: "python:3.11-slim", file: "solution.py", cmd: "python3 solution.py" },
  cpp17: { image: "gcc:11", file: "solution.cpp", cmd: "g++ -O3 -std=c++17 solution.cpp -o solution && ./solution" },
  c11: { image: "gcc:11", file: "solution.c", cmd: "gcc -O3 solution.c -o solution && ./solution" },
  java17: { image: "openjdk:17-slim", file: "SolutionMain.java", cmd: "javac SolutionMain.java && java SolutionMain" },
  javascript: { image: "node:20-slim", file: "solution.js", cmd: "node solution.js" }
};

app.post("/api/v1/judge/run", async (req, res): Promise<void> => {
  const { sourceCode, language, customInput, problemId } = req.body;
  if (!sourceCode) { res.status(400).json({ success: false, message: "Code parameter space cannot be blank." }); return; }

  const targetLang = language || "python3";
  const runtimeEnv = dockerLanguageMap[targetLang];
  if (!runtimeEnv) { res.status(400).json({ success: false, message: `Container layout not configured for: ${targetLang}` }); return; }

  const token = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const hostDir = path.resolve(__dirname, `../scratchpad_${token}`);
  
  try {
    fs.mkdirSync(hostDir, { recursive: true });
    
    const problemRecord = await prisma.problem.findUnique({ where: { id: BigInt(problemId) } });
    if (!problemRecord) { res.status(404).json({ success: false, message: "Problem missing from database." }); return; }

    const scriptsMap = JSON.parse(problemRecord.driverScript || "{}");
    let comprehensiveDriver = scriptsMap[targetLang] || "";

    if (!comprehensiveDriver) {
      res.status(400).json({ success: false, message: `No evaluation driver found for language option: ${targetLang}` });
      return;
    }

    // 🚀 UNIFORM TOKENS INJECTION: Bypasses hardcoded system layers completely
    comprehensiveDriver = comprehensiveDriver
      .replace("{{USER_CODE}}", sourceCode)
      .replace(/{{INPUT}}/g, customInput.trim());

    fs.writeFileSync(path.join(hostDir, runtimeEnv.file), comprehensiveDriver);

    const dockerExecutionCommand = `docker run --rm -v "${hostDir}:/app" -w /app --memory="256m" --cpus="1.0" --network none ${runtimeEnv.image} sh -c "${runtimeEnv.cmd} 2>&1"`;

    exec(dockerExecutionCommand, { timeout: 6000 }, (runError, stdout, stderr) => {
      if (fs.existsSync(hostDir)) fs.rmSync(hostDir, { recursive: true, force: true });
      const rawConsoleOutput = stdout || stderr || "";

      const extractTokenBlock = (content: string, startToken: string, endToken: string): string => {
        const s = content.indexOf(startToken); const e = content.indexOf(endToken);
        if (s === -1 || e === -1) return "";
        return content.substring(s + startToken.length, e).trim();
      };

      const extractedError = extractTokenBlock(rawConsoleOutput, "===ERROR_START===", "===ERROR_END===");
      const extractedStdout = extractTokenBlock(rawConsoleOutput, "===STD_OUT_START===", "===STD_OUT_END===");
      const extractedResult = extractTokenBlock(rawConsoleOutput, "===RESULT_START===", "===RESULT_END===");
      const extractedExpected = extractTokenBlock(rawConsoleOutput, "===EXPECTED_START===", "===EXPECTED_END===");

      if (!extractedResult && !extractedError) {
        res.status(200).json({ 
          success: true, stdout: "", output: null, expected: "Error", 
          error: rawConsoleOutput.trim() || "Runtime Exception Error: Verify function return paths and signatures." 
        });
        return;
      }

      res.status(200).json({ success: true, stdout: extractedStdout, output: extractedResult, expected: extractedExpected, error: extractedError || null });
    });
  } catch (error: any) {
    if (fs.existsSync(hostDir)) fs.rmSync(hostDir, { recursive: true, force: true });
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use(errorHandler);
export default app;