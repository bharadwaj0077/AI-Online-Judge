import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "./env";

const isRemoteDb =
  env.DATABASE_URL.includes("rds.amazonaws.com") ||
  env.DATABASE_URL.includes("sslmode=") ||
  (env.NODE_ENV === "production" && !env.DATABASE_URL.includes("localhost") && !env.DATABASE_URL.includes("127.0.0.1"));

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const disconnectDB = async () => {
  await prisma.$disconnect();
  await pool.end();
};