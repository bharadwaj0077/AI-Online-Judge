import { prisma } from "../backend/src/config/db";
import fs from "fs/promises";
import path from "path";

async function importData() {
  console.log("🚀 Starting database import to RDS...");

  const dumpPath = path.join(__dirname, "full_database_dump.json");
  const rawData = await fs.readFile(dumpPath, "utf-8");
  const dump = JSON.parse(rawData);

  console.log(`Loaded dump file generated at: ${dump.exportedAt}`);
  console.log("Stats to import:", dump.stats);

  // 1. Import Languages
  console.log("\n[1/5] Importing Execution Languages...");
  for (const lang of dump.languages) {
    const { id, createdAt, updatedAt, ...langData } = lang;
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: langData,
      create: langData,
    });
  }
  console.log(`✓ Seeded ${dump.languages.length} languages.`);

  // 2. Import Users (so problem author references & mock interviews stay valid)
  console.log("\n[2/5] Importing Users...");
  const userMap = new Map<string, bigint>(); // oldId -> newId

  for (const user of dump.users) {
    const { id, createdAt, updatedAt, role, ...userData } = user;
    const upserted = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        ...userData,
        role: role as any,
      },
      create: {
        ...userData,
        role: role as any,
      },
    });
    userMap.set(id.toString(), upserted.id);
  }
  console.log(`✓ Seeded ${dump.users.length} users.`);

  // 3. Import Problems and their TestCases
  console.log("\n[3/5] Importing 105 Problems & 917 TestCases...");
  let importedCasesCount = 0;

  for (const prob of dump.problems) {
    const { id, testCases, problemTags, createdAt, updatedAt, authorId, difficulty, visibility, ...probData } = prob;
    const newAuthorId = authorId ? userMap.get(authorId.toString()) || null : null;

    const upsertedProblem = await prisma.problem.upsert({
      where: { slug: prob.slug },
      update: {
        ...probData,
        difficulty: difficulty as any,
        visibility: visibility as any,
        authorId: newAuthorId,
      },
      create: {
        ...probData,
        difficulty: difficulty as any,
        visibility: visibility as any,
        authorId: newAuthorId,
      },
    });

    // Delete existing test cases for this problem to prevent duplicate piling
    await prisma.testCase.deleteMany({
      where: { problemId: upsertedProblem.id },
    });

    // Bulk insert all test cases for this problem
    if (testCases && testCases.length > 0) {
      const testCasesToInsert = testCases.map((tc: any) => ({
        problemId: upsertedProblem.id,
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
  console.log(`✓ Successfully imported ${dump.problems.length} problems and ${importedCasesCount} test cases!`);

  // 4. Import Mock Interviews (if present)
  if (dump.mockInterviews && dump.mockInterviews.length > 0) {
    console.log(`\n[4/5] Importing ${dump.mockInterviews.length} Mock Interviews...`);
    for (const interview of dump.mockInterviews) {
      const { id, createdAt, updatedAt, userId, problemId, ...interviewData } = interview;
      const targetUserId = userId ? userMap.get(userId.toString()) || null : null;

      // Find problem id in new db if problemId existed
      let targetProblemId: bigint | null = null;
      if (interview.problemTitle) {
        const foundProb = await prisma.problem.findFirst({
          where: { title: interview.problemTitle },
          select: { id: true },
        });
        if (foundProb) targetProblemId = foundProb.id;
      }

      await prisma.mockInterview.upsert({
        where: { id },
        update: {
          ...interviewData,
          userId: targetUserId,
          problemId: targetProblemId,
        },
        create: {
          id,
          ...interviewData,
          userId: targetUserId,
          problemId: targetProblemId,
        },
      });
    }
    console.log(`✓ Imported mock interview records.`);
  }

  // 5. Import Arena Matches (if present)
  if (dump.arenaMatches && dump.arenaMatches.length > 0) {
    console.log(`\n[5/5] Importing ${dump.arenaMatches.length} Arena Match Records...`);
    for (const match of dump.arenaMatches) {
      const { id, createdAt, problemId, ...matchData } = match;

      // Link to problem in new db
      let targetProblemId: bigint = BigInt(1);
      const foundProb = await prisma.problem.findFirst({
        where: { title: match.problemTitle },
        select: { id: true },
      });
      if (foundProb) targetProblemId = foundProb.id;

      await prisma.arenaMatchRecord.upsert({
        where: { id },
        update: {
          ...matchData,
          problemId: targetProblemId,
        },
        create: {
          id,
          ...matchData,
          problemId: targetProblemId,
        },
      });
    }
    console.log(`✓ Imported arena match records.`);
  }

  console.log("\n==================================================================");
  console.log("🎉 ALL PROBLEMS, TEST CASES & APP DATA TRANSFERRED SUCCESSFULLY!");
  console.log("==================================================================");
  process.exit(0);
}

importData().catch((err) => {
  console.error("❌ Import error:", err);
  process.exit(1);
});
