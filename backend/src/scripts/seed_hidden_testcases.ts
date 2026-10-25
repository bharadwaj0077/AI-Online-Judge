import { prisma } from "../config/db";

async function main() {
  console.log("Seeding hidden test cases for core problems...");

  const testCasesData: Record<string, Array<{ input: string; expectedOutput: string; weight?: number }>> = {
    "two-sum": [
      { input: "[3,3], 6", expectedOutput: "[0,1]" },
      { input: "[2,5,5,11], 10", expectedOutput: "[1,2]" },
      { input: "[0,4,3,0], 0", expectedOutput: "[0,3]" },
      { input: "[-1,-2,-3,-4,-5], -8", expectedOutput: "[2,4]" },
      { input: "[-3,4,3,90], 0", expectedOutput: "[0,2]" },
      { input: "[1,5,3,7,9,2], 12", expectedOutput: "[1,3]" },
      { input: "[10,20,30,40,50], 90", expectedOutput: "[3,4]" },
      { input: "[1,2,3,4,5,6,7,8,9,10], 19", expectedOutput: "[8,9]" }
    ],
    "palindrome-number": [
      { input: "x = -121", expectedOutput: "false" },
      { input: "x = 10", expectedOutput: "false" },
      { input: "x = 0", expectedOutput: "true" },
      { input: "x = 1221", expectedOutput: "true" },
      { input: "x = 1234321", expectedOutput: "true" },
      { input: "x = 1000021", expectedOutput: "false" }
    ],
    "valid-parentheses": [
      { input: "s = \"(]\"", expectedOutput: "false" },
      { input: "s = \"([)]\"", expectedOutput: "false" },
      { input: "s = \"{[]}\"", expectedOutput: "true" },
      { input: "s = \"(((\"", expectedOutput: "false" },
      { input: "s = \")\"", expectedOutput: "false" },
      { input: "s = \"\"", expectedOutput: "true" }
    ],
    "contains-duplicate": [
      { input: "nums = [1,2,3,4]", expectedOutput: "false" },
      { input: "nums = [1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true" },
      { input: "nums = [99]", expectedOutput: "false" },
      { input: "nums = [0,0]", expectedOutput: "true" },
      { input: "nums = [-1,-2,-3,-1]", expectedOutput: "true" }
    ],
    "best-time-to-buy-and-sell-stock": [
      { input: "prices = [7,6,4,3,1]", expectedOutput: "0" },
      { input: "prices = [1,2]", expectedOutput: "1" },
      { input: "prices = [2,4,1]", expectedOutput: "2" },
      { input: "prices = [3,2,6,5,0,3]", expectedOutput: "4" },
      { input: "prices = [2,1,2,1,0,1,2]", expectedOutput: "2" }
    ],
    "maximum-subarray": [
      { input: "nums = [1]", expectedOutput: "1" },
      { input: "nums = [5,4,-1,7,8]", expectedOutput: "23" },
      { input: "nums = [-1]", expectedOutput: "-1" },
      { input: "nums = [-2,-1]", expectedOutput: "-1" },
      { input: "nums = [-1,0,-2]", expectedOutput: "0" }
    ]
  };

  for (const [slug, cases] of Object.entries(testCasesData)) {
    const problem = await prisma.problem.findFirst({ where: { slug } });
    if (!problem) {
      console.log(`Problem ${slug} not found, skipping.`);
      continue;
    }

    // Remove existing hidden test cases for idempotency
    await prisma.testCase.deleteMany({
      where: { problemId: problem.id, isSample: false }
    });

    let order = 10;
    for (const tc of cases) {
      await prisma.testCase.create({
        data: {
          problemId: problem.id,
          orderNo: order++,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: false, // HIDDEN TEST CASE
          weight: tc.weight || 1
        }
      });
    }

    const total = await prisma.testCase.count({ where: { problemId: problem.id } });
    const samples = await prisma.testCase.count({ where: { problemId: problem.id, isSample: true } });
    const hidden = await prisma.testCase.count({ where: { problemId: problem.id, isSample: false } });
    console.log(`[DONE] ${problem.title}: ${total} total (${samples} sample, ${hidden} hidden)`);
  }

  console.log("Seeding completed successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
