import express, { Response } from "express";
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
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import submissionRoutes from "./routes/submission.routes";

const app = express();
app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === "development") app.use(morgan("dev"));

app.use("/api/v1/problems", problemRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/submissions", submissionRoutes);

const dockerLanguageMap: Record<string, { image: string; file: string; cmd: string }> = {
  python3: { image: "python:3.11-slim", file: "solution.py", cmd: "python3 solution.py" },
  cpp17: { image: "gcc:11", file: "solution.cpp", cmd: "g++ -O3 -std=c++17 solution.cpp -o solution && ./solution" },
  c11: { image: "gcc:11", file: "solution.c", cmd: "gcc -O3 solution.c -o solution && ./solution" },
  java17: { image: "openjdk:17-slim", file: "Main.java", cmd: "javac Main.java && java Main" },
  javascript: { image: "node:20-slim", file: "solution.js", cmd: "node solution.js" }
};

// ☁️ CLOUD FALLBACK MATRIX: When Docker is not installed on the host machine,
// route execution through the free Wandbox compile API so every language still works.
const wandboxCompilerMap: Record<string, string> = {
  python3: "cpython-3.13.8",
  cpp17: "gcc-13.2.0",
  c11: "gcc-13.2.0-c",
  java17: "openjdk-jdk-21+35",
};

let dockerAvailable: boolean | null = null;
const isDockerAvailable = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (dockerAvailable !== null) return resolve(dockerAvailable);
    exec("docker info", { timeout: 5000 }, (err) => {
      dockerAvailable = !err;
      if (!dockerAvailable) console.warn("🐳 Docker unavailable — judge/run will fall back to the Wandbox cloud API.");
      resolve(dockerAvailable as boolean);
    });
  });

const respondFromRawOutput = (res: Response, rawConsoleOutput: string): void => {
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

    const useDocker = await isDockerAvailable();

    if (!useDocker) {
      // ☁️ Wandbox cloud execution path (no Docker required)
      if (fs.existsSync(hostDir)) fs.rmSync(hostDir, { recursive: true, force: true });
      const wandboxCompiler = wandboxCompilerMap[targetLang];
      if (!wandboxCompiler) {
        res.status(400).json({ success: false, message: `Cloud fallback not configured for: ${targetLang}. Install Docker to run this language.` });
        return;
      }

      const wbResponse = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler: wandboxCompiler, code: comprehensiveDriver }),
      });
      if (!wbResponse.ok) {
        res.status(502).json({ success: false, message: `Cloud execution service returned ${wbResponse.status}. Try again shortly.` });
        return;
      }
      const wbData: any = await wbResponse.json();

      if (wbData.compiler_error) {
        res.status(200).json({ success: true, stdout: "", output: null, expected: "Error", error: wbData.compiler_error });
        return;
      }

      respondFromRawOutput(res, (wbData.program_output || "") + (wbData.program_error || ""));
      return;
    }

    fs.writeFileSync(path.join(hostDir, runtimeEnv.file), comprehensiveDriver);

    const dockerExecutionCommand = `docker run --rm -v "${hostDir}:/app" -w /app --memory="256m" --cpus="1.0" --network none ${runtimeEnv.image} sh -c "${runtimeEnv.cmd} 2>&1"`;

    exec(dockerExecutionCommand, { timeout: 6000 }, (runError, stdout, stderr) => {
      if (fs.existsSync(hostDir)) fs.rmSync(hostDir, { recursive: true, force: true });
      respondFromRawOutput(res, stdout || stderr || "");
    });
  } catch (error: any) {
    if (fs.existsSync(hostDir)) fs.rmSync(hostDir, { recursive: true, force: true });
    res.status(500).json({ success: false, message: error.message });
  }
});

app.use(errorHandler);
export default app;