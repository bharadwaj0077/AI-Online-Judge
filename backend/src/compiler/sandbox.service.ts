import { exec, execSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";
import { WORKSPACE_DIR, SANDBOX_LIMITS } from "./compiler.config";

// Convert Node's legacy callback-based exec utility into a clean promise wrapper
const execPromise = promisify(exec);

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  verdict: "ACCEPTED" | "TIME_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "SYSTEM_ERROR";
}

export class SandboxService {
  /**
   * Initializes the workspace by ensuring the temporary execution folder exists
   */
  private static async ensureWorkspaceExists(): Promise<void> {
    try {
      await fs.mkdir(WORKSPACE_DIR, { recursive: true });
    } catch (error) {
      console.error("❌ Failed initializing temporary execution workspace directory:", error);
      throw new Error("System filesystem error during initialization.");
    }
  }

  /**
   * Executes a string of untrusted source code safely inside a micro-sandbox container
   * * @param sourceCode The plain-text code submitted by the user
   * @param fileExtension The extension specific to the language (.cpp, .py, etc.)
   * @param dockerImage The target container image tag (e.g., 'python:3.10-slim')
   * @param runCommand The shell execution command required to fire the application binary
   * @param inputData The mock keyboard data parameters fed into the terminal shell input
   * @param timeLimitMs The strict CPU execution limit allocation window before a hard timeout triggers
   */
  static async executeCode(
    sourceCode: string,
    fileExtension: string,
    dockerImage: string,
    runCommand: string,
    inputData: string = "",
    timeLimitMs: number = 2000
  ): Promise<ExecutionResult> {
    await this.ensureWorkspaceExists();

    // 1. Generate unique execution keys to isolate concurrent runs from colliding
    const executionId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sourceFileName = `Solution${fileExtension}`;
    const inputFileName = `input.txt`;

    // Local execution folder: backend/temp_submissions/run_xyz
    const localRunDir = path.join(WORKSPACE_DIR, executionId);
    await fs.mkdir(localRunDir, { recursive: true });

    // Target absolute file paths inside our local operating system
    const localSourcePath = path.join(localRunDir, sourceFileName);
    const localInputPath = path.join(localRunDir, inputFileName);

    // 2. Write code and runtime inputs to the local workspace
    await fs.writeFile(localSourcePath, sourceCode, "utf-8");
    await fs.writeFile(localInputPath, inputData, "utf-8");

    // 3. Define the internal container path workspace mapping boundaries
    // Docker maps directories cleanly using UNIX styling parameters irrespective of host OS
    const containerMountPath = "/sandbox";
    
    // Convert local OS paths into safe structural formats compatible with Docker CLI volume engines
    const formattedVolumePath = localRunDir.replace(/\\/g, "/");

    // 4. Construct the complete, highly isolated sandboxed 'docker run' execution string
    const dockerShellCommand = [
      `docker run`,
      `--rm`,                                                  // Instantly delete container artifacts on thread termination
      `-i`,    
      `--name ${executionId}`,                                // Keep input streams open to feed validation text
      `--memory="${SANDBOX_LIMITS.MEMORY}"`,                  // Enforce strict RAM ceilings
      `--cpus="${SANDBOX_LIMITS.CPUS}"`,                      // Enforce precise CPU consumption constraints
      `--network=${SANDBOX_LIMITS.NETWORK}`,                   // Hard isolation from the open internet
      `-v "${formattedVolumePath}":"${containerMountPath}"`,   // Read/Write Volume binding mount loop
      `-w ${containerMountPath}`,                              // Set working path focus inside the container sandbox
      dockerImage,                                             // Call out the requested compiler tag environment
      `/bin/bash -c "${runCommand} < ${inputFileName}"`        // Feed validation inputs down execution streams
    ].join(" ");

    const startTime = process.hrtime.bigint();

    // 5. Wrap execution routines inside racing timeout engines to catch infinite loop hacks
    let timeoutTimer: NodeJS.Timeout | null = null;
    let containerForceKilled = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutTimer = setTimeout(() => {
        containerForceKilled = true;

        try {
          // 💥 FORCE an immediate, blocking OS-level termination
          execSync(`docker kill ${executionId}`, { stdio: "ignore" });
        } catch (killErr) {
          console.warn(`⚠️ Sandbox cleanup note: Container ${executionId} may have already closed.`);
        }
        
        reject(new Error("TLE"));
      }, timeLimitMs);
    });

    try {
      // Race the shell execution execution pipeline against the maximum time allocation window
      const executionPromise = execPromise(dockerShellCommand);
      const { stdout, stderr } = await Promise.race([executionPromise, timeoutPromise]);

      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6; // Convert high-res nanoseconds to milliseconds

      if (timeoutTimer) clearTimeout(timeoutTimer);

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        executionTimeMs,
        verdict: stderr ? "RUNTIME_ERROR" : "ACCEPTED",
      };
    } catch (error: any) {
      if (timeoutTimer) clearTimeout(timeoutTimer);

      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6;

      // Intercept explicit Time Limit Exceeded triggers
      if (error.message === "TLE" || containerForceKilled) {
        return { stdout: "", stderr: "Time Limit Exceeded.", executionTimeMs, verdict: "TIME_LIMIT_EXCEEDED" };
      }

      return {
        stdout: "",
        stderr: error.stderr?.trim() || error.message || "Runtime Exception",
        executionTimeMs,
        verdict: "RUNTIME_ERROR",
      };
    } finally {
      // 6. Mandatory Cleanup Core: Cleanly erase execution tracking directories to optimize system storage
      try {
        await fs.rm(localRunDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error(`⚠️ Failed clearing temporary runtime execution files at: ${localRunDir}`, cleanupError);
      }
    }
  }
}