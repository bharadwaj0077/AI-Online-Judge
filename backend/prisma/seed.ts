import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function main() {
  console.log("Seeding execution languages and algorithm problems...");

  // 1. Seed Execution Languages
  const languagesData = [
    {
      name: "python3",
      displayName: "Python 3.11",
      slug: "python3",
      languageBase: "python",
      version: "3.11",
      fileExtension: "py",
      dockerImage: "python:3.11-slim",
      runCommand: "python3 -",
      isCompiled: false,
      executionOrder: 1
    },
    {
      name: "cpp17",
      displayName: "C++ 17 (GCC)",
      slug: "cpp17",
      languageBase: "cpp",
      version: "17",
      fileExtension: "cpp",
      dockerImage: "gcc:11",
      compileCommand: "g++ -O2 main.cpp -o main",
      runCommand: "./main",
      isCompiled: true,
      executionOrder: 2
    },
    {
      name: "java17",
      displayName: "Java 17 (OpenJDK)",
      slug: "java17",
      languageBase: "java",
      version: "17",
      fileExtension: "java",
      dockerImage: "eclipse-temurin:17-jdk",
      compileCommand: "javac SolutionMain.java",
      runCommand: "java SolutionMain",
      isCompiled: true,
      executionOrder: 3
    },
    {
      name: "javascript",
      displayName: "JavaScript (Node20)",
      slug: "javascript",
      languageBase: "javascript",
      version: "20",
      fileExtension: "js",
      dockerImage: "node:20-slim",
      runCommand: "node -",
      isCompiled: false,
      executionOrder: 4
    }
  ];

  for (const lang of languagesData) {
    await prisma.language.upsert({
      where: { slug: lang.slug },
      update: lang,
      create: lang
    });
  }

  // 2. Seed Core Problems
  const coreProblems = [
    {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      inputFormat: "nums = [2,7,11,15], target = 9",
      outputFormat: "[0,1]",
      constraintsText: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9",
      referenceSolution: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, v in enumerate(nums):
            diff = target - v
            if diff in seen:
                return [seen[diff], i]
            seen[v] = i
        return []`,
      templates: {
        python3: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    twoSum(nums, target) {\n        return [];\n    }\n}"
      },
      sampleInput: "nums = [2,7,11,15]\ntarget = 9",
      sampleOutput: "[0,1]"
    },
    {
      title: "Sum of N Numbers",
      slug: "sum-of-n-numbers",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer `n`, return the cumulative sum of all integers from 1 up to `n`.",
      inputFormat: "n = 5",
      outputFormat: "15",
      constraintsText: "1 <= n <= 10^5",
      referenceSolution: `class Solution:
    def sumOfNNumbers(self, n: int) -> int:
        return (n * (n + 1)) // 2`,
      templates: {
        python3: "class Solution:\n    def sumOfNNumbers(self, n: int) -> int:\n        pass",
        cpp17: "class Solution {\npublic:\n    int sumOfNNumbers(int n) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int sumOfNNumbers(int n) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    sumOfNNumbers(n) {\n        return 0;\n    }\n}"
      },
      sampleInput: "n = 5",
      sampleOutput: "15"
    },
    {
      title: "Palindrome Number",
      slug: "palindrome-number",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.",
      inputFormat: "x = 121",
      outputFormat: "true",
      constraintsText: "-2^31 <= x <= 2^31 - 1",
      referenceSolution: `class Solution:
    def isPalindrome(self, x: int) -> bool:
        if x < 0:
            return False
        s = str(x)
        return s == s[::-1]`,
      templates: {
        python3: "class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass",
        cpp17: "class Solution {\npublic:\n    bool isPalindrome(int x) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean isPalindrome(int x) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isPalindrome(x) {\n        return false;\n    }\n}"
      },
      sampleInput: "x = 121",
      sampleOutput: "true"
    },
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      inputFormat: "s = \"()[]{}\"",
      outputFormat: "true",
      constraintsText: "1 <= s.length <= 10^4",
      referenceSolution: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {")": "(", "}": "{", "]": "["}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack`,
      templates: {
        python3: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
        cpp17: "#include <string>\n#include <stack>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValid(string s) {\n        return true;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public boolean isValid(String s) {\n        return true;\n    }\n}",
        javascript: "class Solution {\n    isValid(s) {\n        return true;\n    }\n}"
      },
      sampleInput: "s = \"()[]{}\"",
      sampleOutput: "true"
    }
  ];

  for (const prob of coreProblems) {
    const existing = await prisma.problem.findFirst({ where: { slug: prob.slug } });
    if (!existing) {
      await prisma.problem.create({
        data: {
          title: prob.title,
          slug: prob.slug,
          difficulty: prob.difficulty,
          visibility: prob.visibility,
          statement: prob.statement,
          inputFormat: prob.inputFormat,
          outputFormat: prob.outputFormat,
          constraintsText: prob.constraintsText,
          timeLimitMs: prob.timeLimitMs,
          memoryLimitMb: prob.memoryLimitMb,
          inputTemplate: JSON.stringify(prob.templates),
          driverScript: JSON.stringify({ python3: "{{USER_CODE}}" }),
          referenceSolution: prob.referenceSolution,
          testCases: {
            create: [{ orderNo: 1, input: prob.sampleInput, expectedOutput: prob.sampleOutput, isSample: true }]
          }
        }
      });
      console.log(`Created problem: ${prob.title}`);
    }
  }

  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });