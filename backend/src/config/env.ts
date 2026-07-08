import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { z } from "zod";

// 🚀 ROBUST DISCOVERY MATRIX: Scans every single possible path configuration across your project layout
const potentialEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend", ".env"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "../..", ".env"),
  path.resolve(__dirname, "../../..", ".env"),
  path.resolve(__dirname, "../types/.env"), // 🟩 Backstop path matching your types directory
];

console.log("🔍 Running Synapse Environment Matrix Check...");

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    // Attempt loading the configuration values directly into Node process scope memory layers
    dotenv.config({ path: envPath });

    // Instantly verify if the variables successfully populated without relying on fragile text string inclusion scans
    if (process.env.DATABASE_URL && process.env.JWT_SECRET) {
      console.log(`◇ 🟩 Success! Active environment variables loaded from: ${envPath}`);
      break;
    }
  }
}

// Enforce strict type-safe schemas using Zod structures
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform((val) => parseInt(val, 10)).default("5000"),
  DATABASE_URL: z.string({ required_error: "DATABASE_URL parameter target is missing or undefined inside process scope." }),
  JWT_SECRET: z.string({ required_error: "JWT_SECRET parameter target is missing or undefined inside process scope." }),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment configurations:", JSON.stringify(parsedEnv.error.format(), null, 2));
  console.log("\n💡 Debug Tip: Ensure your .env file contains precisely named parameters:");
  console.log('DATABASE_URL="postgresql://username:password@localhost:5432/db_name"');
  console.log('JWT_SECRET="your_secure_hash_string"\n');
  process.exit(1);
}

export const env = parsedEnv.data;