import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL_CASCADE = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-2.5-flash"
];

/**
 * Executes a Gemini prompt with automatic model fallback across tier limits
 */
export async function generateContentWithCascade(contents: string, config?: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of GEMINI_MODEL_CASCADE) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: config || { temperature: 0.3 }
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[GeminiCascade] Model ${model} failed (${err.status || err.message}), trying next model...`);
    }
  }

  throw lastError || new Error("All Gemini models in cascade failed.");
}
