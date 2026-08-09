import { Router } from "express";
import { ProblemController } from "../controllers/problem.controller";
import { optionalAuth } from "../middlewares/auth.middleware";
import { prisma } from "../config/db";
import testCaseRoutes from "./testcase.routes"; 
import https from "https";

const router = Router();

// REST Problem Operations
router.get("/", optionalAuth, ProblemController.getAll);
router.get("/:slug", optionalAuth, ProblemController.getBySlug);
router.post("/", optionalAuth, ProblemController.create);
router.put("/:publicId", optionalAuth, ProblemController.update);
router.delete("/:publicId", optionalAuth, ProblemController.delete);

/**
 * 🚀 DYNAMIC MULTI-MODEL FALLBACK ENGINE
 * Cycles through available Gemini configurations to find an active model layout
 */
function queryGeminiWithFallback(prompt: string, apiKey: string): Promise<string> {
  const models = ["gemini-1.5-flash", "gemini-2.5-flash"];
  
  return new Promise((resolve, reject) => {
    let currentIndex = 0;
    const errorsLog: string[] = [];

    function runSessionRequest() {
      if (currentIndex >= models.length) {
        return reject(new Error(`All Gemini API models exhausted. Details: [${errorsLog.join(" | ")}]`));
      }

      const activeModel = models[currentIndex];
      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`;
      const payloadString = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

      const requestStream = https.request(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payloadString)
        },
        timeout: 7000
      }, (responseStream) => {
        let rawBuffer = "";
        responseStream.on("data", (chunk) => { rawBuffer += chunk; });
        responseStream.on("end", () => {
          try {
            const dataData = JSON.parse(rawBuffer);
            if (responseStream.statusCode === 200 && dataData?.candidates?.[0]?.content?.parts?.[0]?.text) {
              return resolve(dataData.candidates[0].content.parts[0].text);
            }
            const infoMsg = dataData?.error?.message || `HTTP ${responseStream.statusCode}`;
            errorsLog.push(`${activeModel} Refusal: ${infoMsg}`);
          } catch (e: any) {
            errorsLog.push(`${activeModel} Parse Exception: ${e.message}`);
          }
          currentIndex++;
          runSessionRequest();
        });
      });

      requestStream.on("error", (err) => {
        errorsLog.push(`${activeModel} Socket Error: ${err.message}`);
        currentIndex++;
        runSessionRequest();
      });

      requestStream.on("timeout", () => {
        requestStream.destroy();
        errorsLog.push(`${activeModel} Connection Timeout`);
        currentIndex++;
        runSessionRequest();
      });

      requestStream.write(payloadString);
      requestStream.end();
    }

    runSessionRequest();
  });
}

/**
 * 🤖 DYNAMIC AI ENDPOINT: Conceptual Code Hint Broker
 */
router.post("/:id/hint", async (req, res): Promise<void> => {
  try {
    const { sourceCode, language } = req.body;
    const problem = await prisma.problem.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!problem) { res.status(404).json({ success: false, message: "Problem missing." }); return; }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(200).json({ success: false, message: "Missing GEMINI_API_KEY inside backend .env parameters." });
      return;
    }

    const prompt = `You are an elite coding coach. Review the user's current code implementation for the coding challenge "${problem.title}". Provide a single concise hint (maximum 3 sentences) suggesting how to proceed logically or fix errors without providing any direct source code examples.\n\nProblem Specification Details:\n${problem.statement}\n\nUser Code (${language}):\n${sourceCode}`;
    
    const aiTextOutput = await queryGeminiWithFallback(prompt, apiKey);
    res.status(200).json({ success: true, hint: aiTextOutput.trim() });
  } catch (err: any) {
    res.status(200).json({ success: false, message: err.message });
  }
});

/**
 * 🤖 DYNAMIC AI ENDPOINT: Big O Complexity Verdict Calculator
 */
router.post("/:id/verdict", async (req, res): Promise<void> => {
  try {
    const { sourceCode, language } = req.body;
    const problem = await prisma.problem.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!problem) { res.status(404).json({ success: false, message: "Target challenge record missing." }); return; }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(200).json({ success: false, message: "Missing GEMINI_API_KEY inside backend .env parameters." });
      return;
    }

    const prompt = `Analyze this code submission for the challenge "${problem.title}". Evaluate its logic properties. You must return a strict raw JSON text block matching this structural format specification template exactly: {"time": "O(N)", "space": "O(1)", "critique": "Descriptive optimization breakdown summary feedback"}. Do not wrap the JSON output block inside markdown code text markers.\n\nCode Snippet (${language}):\n${sourceCode}`;
    
    const textRaw = await queryGeminiWithFallback(prompt, apiKey);
    
    try {
      const sanitizedJson = textRaw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(sanitizedJson);
      res.status(200).json({
        success: true,
        timeComplexity: parsed.time || "O(N)",
        spaceComplexity: parsed.space || "O(1)",
        analysis: parsed.critique || "Review completed successfully."
      });
    } catch {
      res.status(200).json({ success: true, timeComplexity: "O(N)", spaceComplexity: "O(1)", analysis: textRaw.trim() });
    }
  } catch (err: any) {
    res.status(200).json({ success: false, message: err.message });
  }
});

const safeTestCaseRouter = typeof testCaseRoutes === "function" || (testCaseRoutes && Object.keys(testCaseRoutes).length > 0)
  ? testCaseRoutes 
  : Router().get("/", (req, res) => res.status(200).json({ success: true, data: [] }));

router.use("/:problemPublicId/test-cases", safeTestCaseRouter);

export default router;