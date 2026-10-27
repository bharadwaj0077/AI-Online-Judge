import { prisma } from "../backend/src/config/db";
import fs from "fs/promises";
import path from "path";

async function importData() {
  console.log("🚀 Starting clean import of ONLY Problems & TestCases to RDS...");

  const dumpPath = path.join(__dirname, "full_database_dump.json");
  const rawData = await fs.readFile(dumpPath, "utf-8");
  const dump = JSON.parse(rawData);

  console.log(`Loaded problem catalog dump generated at: ${dump.exportedAt}`);
  console.log(`Catalog contains: ${dump.problems.length} problems and ${dump.stats.testCases} test cases.`);

  // 1. Ensure Execution Languages exist
  console.log("\n[1/2] Syncing Execution Languages (Python, C++, Java, JS)...");
  for (const lang of dump.languages) {
    const { id, createdAt, updatedAt, ...langData } = lang;
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: langData,
      create: langData,
    });
  }
  console.log(`✓ 5 Compiler execution languages verified.`);

  // 2. Import ONLY Problems and their TestCases
  console.log(`\n[2/2] Importing ${dump.problems.length} Problems & TestCases...`);
  let importedCasesCount = 0;

  for (const prob of dump.problems) {
    const { id, testCases, problemTags, createdAt, updatedAt, authorId, difficulty, visibility, ...probData } = prob;

    // Check if problem already exists
    const existing = await prisma.problem.findFirst({
      where: { slug: prob.slug, deletedAt: null },
    });

    let problemId: bigint;
    if (existing) {
      await prisma.problem.update({
        where: { id: existing.id },
        data: {
          ...probData,
          difficulty: difficulty as any,
          visibility: visibility as any,
          authorId: null, // clean slate: no foreign user attached
        },
      });
      problemId = existing.id;
    } else {
      const created = await prisma.problem.create({
        data: {
          ...probData,
          difficulty: difficulty as any,
          visibility: visibility as any,
          authorId: null, // clean slate: no foreign user attached
        },
      });
      problemId = created.id;
    }

    // Replace test cases for this problem
    await prisma.testCase.deleteMany({
      where: { problemId },
    });

    if (testCases && testCases.length > 0) {
      const testCasesToInsert = testCases.map((tc: any) => ({
        problemId,
        orderNo: tc.orderNo ?? 0,
        input: tc.input ?? "",
        expectedOutput: tc.expectedOutput ?? "",
        inputStorageKey: tc.inputStorageKey || null,
        outputStorageKey: tc.outputStorageKey || null,
        isSample: Boolean(tc.isSample),
        weight: tc.weight ?? 1,
      }));

      await prisma.testCase.createMany({
        data: testCasesToInsert,
      });

      importedCasesCount += testCasesToInsert.length;
    }
  }

  console.log(`✓ Successfully imported all ${dump.problems.length} problems and ${importedCasesCount} test cases!`);
  console.log("\n==================================================================");
  console.log("🎉 CLEAN IMPORT COMPLETE: ONLY PROBLEMS & TESTCASES TRANSFERRED!");
  console.log("==================================================================");
  process.exit(0);
}

importData().catch((err) => {
  console.error("❌ Import error:", err);
  process.exit(1);
});
