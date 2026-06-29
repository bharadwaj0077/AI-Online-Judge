import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// Set up the local database connection pool driver
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the driver adapter directly to the Prisma 7 client constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting baseline compiler runtime seeding...");

  const baseLanguages = [
    {
      name: "C++",
      displayName: "C++17",
      slug: "cpp17",
      languageBase: "cpp",
      version: "17",
      fileExtension: ".cpp",
      dockerImage: "gcc:11",
      compileCommand: "g++ -O3 -std=c++17 solution.cpp -o solution",
      runCommand: "./solution",
      isCompiled: true,
      timeMultiplier: 1.0,
      executionOrder: 1,
    },
    {
      name: "C++",
      displayName: "C++20",
      slug: "cpp20",
      languageBase: "cpp",
      version: "20",
      fileExtension: ".cpp",
      dockerImage: "gcc:13",
      compileCommand: "g++ -O3 -std=c++20 solution.cpp -o solution",
      runCommand: "./solution",
      isCompiled: true,
      timeMultiplier: 1.0,
      executionOrder: 2,
    },
    {
      name: "Python",
      displayName: "Python 3.11",
      slug: "python3",
      languageBase: "python",
      version: "3.11",
      fileExtension: ".py",
      dockerImage: "python:3.11-slim",
      compileCommand: null,
      runCommand: "python3 solution.py",
      isCompiled: false,
      timeMultiplier: 2.0,
      executionOrder: 3,
    },
    {
      name: "Java",
      displayName: "Java 17",
      slug: "java17",
      languageBase: "java",
      version: "17",
      fileExtension: ".java",
      dockerImage: "openjdk:17-slim",
      compileCommand: "javac Solution.java",
      runCommand: "java Solution",
      isCompiled: true,
      timeMultiplier: 1.5,
      executionOrder: 4,
    },
    {
      name: "JavaScript",
      displayName: "Node.js 20",
      slug: "javascript",
      languageBase: "javascript",
      version: "20",
      fileExtension: ".js",
      dockerImage: "node:20-slim",
      compileCommand: null,
      runCommand: "node solution.js",
      isCompiled: false,
      timeMultiplier: 1.2,
      executionOrder: 5,
    },
    {
      name: "Go",
      displayName: "Go 1.21",
      slug: "go",
      languageBase: "go",
      version: "1.21",
      fileExtension: ".go",
      dockerImage: "golang:1.21-alpine",
      compileCommand: "go build -o solution solution.go",
      runCommand: "./solution",
      isCompiled: true,
      timeMultiplier: 1.0,
      executionOrder: 6,
    },
  ];

  for (const lang of baseLanguages) {
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: lang,
      create: lang,
    });
  }

  console.log("✅ Baseline compilation runtime profiles successfully seeded!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding execution failure:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Safely shut down the database driver pool
  });