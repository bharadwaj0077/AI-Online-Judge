import { prisma } from "../backend/src/config/db";
import fs from "fs/promises";
import path from "path";

// Support BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function exportData() {
  console.log("📦 Starting local database export...");

  // 1. Languages
  const languages = await prisma.language.findMany();
  console.log(`✓ Fetched ${languages.length} languages`);

  // 2. Users
  const users = await prisma.user.findMany();
  console.log(`✓ Fetched ${users.length} users`);

  // 3. Problems with TestCases
  const problems = await prisma.problem.findMany({
    include: {
      testCases: true,
      problemTags: {
        include: {
          tag: true,
        },
      },
    },
  });
  const totalTestCases = problems.reduce((acc, p) => acc + p.testCases.length, 0);
  console.log(`✓ Fetched ${problems.length} problems with ${totalTestCases} test cases`);

  // 4. Tags
  const tags = await prisma.tag.findMany();
  console.log(`✓ Fetched ${tags.length} tags`);

  // 5. Mock Interviews
  const mockInterviews = await prisma.mockInterview.findMany();
  console.log(`✓ Fetched ${mockInterviews.length} mock interviews`);

  // 6. Arena Matches
  const arenaMatches = await prisma.arenaMatchRecord.findMany();
  console.log(`✓ Fetched ${arenaMatches.length} arena matches`);

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    stats: {
      languages: languages.length,
      users: users.length,
      problems: problems.length,
      testCases: totalTestCases,
      tags: tags.length,
      mockInterviews: mockInterviews.length,
      arenaMatches: arenaMatches.length,
    },
    languages,
    users,
    problems,
    tags,
    mockInterviews,
    arenaMatches,
  };

  const outputPath = path.join(__dirname, "full_database_dump.json");
  await fs.writeFile(outputPath, JSON.stringify(exportPayload, null, 2), "utf-8");

  console.log(`\n🎉 Export complete! Data written to: ${outputPath}`);
  console.log(`Summary:`);
  console.table(exportPayload.stats);

  process.exit(0);
}

exportData().catch((err) => {
  console.error("❌ Export error:", err);
  process.exit(1);
});
