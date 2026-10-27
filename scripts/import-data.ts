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
    const existing = await prisma.user.findFirst({
      where: { email: user.email, deletedAt: null },
    });

    let userId: bigint;
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          ...userData,
          role: role as any,
        },
      });
      userId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          ...userData,
          role: role as any,
        },
      });
      userId = created.id;
    }
    userMap.set(id.toString(), userId);
  }
  console.log(`✓ Seeded ${dump.users.length} users.`);

  // 3. Import Problems and their TestCases
  console.log("\n[3/5] Importing 105 Problems & 917 TestCases...");
  let importedCasesCount = 0;

  for (const prob of dump.problems) {
    const { id, testCases, problemTags, createdAt, updatedAt, authorId, difficulty, visibility, ...probData } = prob;
    const newAuthorId = authorId ? userMap.get(authorId.toString()) || null : null;

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
          authorId: newAuthorId,
        },
      });
      problemId = existing.id;
    } else {
      const created = await prisma.problem.create({
        data: {
          ...probData,
          difficulty: difficulty as any,
          visibility: visibility as any,
          authorId: newAuthorId,
        },
      });
      problemId = created.id;
    }

    // Delete existing test cases for this problem to prevent duplicate piling
    await prisma.testCase.deleteMany({
      where: { problemId },
    });

    // Bulk insert all test cases for this problem
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

      const existingInterview = await prisma.mockInterview.findUnique({
        where: { id },
      });

      if (existingInterview) {
        await prisma.mockInterview.update({
          where: { id },
          data: {
            ...interviewData,
            userId: targetUserId,
            problemId: targetProblemId,
          },
        });
      } else {
        await prisma.mockInterview.create({
          data: {
            id,
            ...interviewData,
            userId: targetUserId,
            problemId: targetProblemId,
          },
        });
      }
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

      const existingMatch = await prisma.arenaMatchRecord.findUnique({
        where: { id },
      });

      if (existingMatch) {
        await prisma.arenaMatchRecord.update({
          where: { id },
          data: {
            ...matchData,
            problemId: targetProblemId,
          },
        });
      } else {
        await prisma.arenaMatchRecord.create({
          data: {
            id,
            ...matchData,
            problemId: targetProblemId,
          },
        });
      }
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
