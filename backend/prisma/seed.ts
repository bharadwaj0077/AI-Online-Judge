import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const potentialEnvPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "backend", ".env"),
  path.resolve(__dirname, ".env"),
];

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Flushing table records and resetting identity sequences...");
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "submissions", "contest_problems", "test_cases", "problems", "languages" RESTART IDENTITY CASCADE;');

  const baseLanguages = [
    { name: "C++", displayName: "C++17", slug: "cpp17", languageBase: "cpp", version: "17", fileExtension: ".cpp", dockerImage: "gcc:11", compileCommand: "g++ -O3 -std=c++17 solution.cpp -o solution", runCommand: "./solution", isCompiled: true, executionOrder: 1 },
    { name: "Python", displayName: "Python 3.11", slug: "python3", languageBase: "python", version: "3.11", fileExtension: ".py", dockerImage: "python:3.11-slim", compileCommand: null, runCommand: "python3 solution.py", isCompiled: false, executionOrder: 2 }
  ];

  for (const lang of baseLanguages) { await prisma.language.create({ data: lang }); }

  const challengeRegistry = [
    {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.\n\nYou may assume that each input would have ***exactly* one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n### Example 1:\n**Input:** nums = [2,7,11,15], target = 9  \n**Output:** [0,1]  \n**Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].\n\n### Example 2:\n**Input:** nums = [3,2,4], target = 6  \n**Output:** [1,2]\n\n### Constraints:\n* \`2 <= nums.length <= 10^4\`\n* \`-10^9 <= nums[i] <= 10^9\`\n* \`-10^9 <= target <= 10^9\``,
      inputFormat: "nums = [2,7,11,15], target = 9",
      outputFormat: "[0,1]",
      constraintsText: "2 <= nums.length <= 10^4",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\nimport sys, io, json\ntry:\n    raw_input = ({{INPUT}})\n    nums_arr, target_val = raw_input[0], raw_input[1]\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().twoSum(nums_arr, target_val)\n    sys.stdout = old\n    \n    # 🚀 CUSTOM EVALATOR: Validates math constraints dynamically to accept alternative index matches\n    is_valid = len(u) == 2 and u[0] != u[1] and nums_arr[u[0]] + nums_arr[u[1]] == target_val\n    final_expected = u if is_valid else [0,1]\n    \n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{json.dumps(u)}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{json.dumps(final_expected)}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <vector>\n#include <sstream>\n\n{{USER_CODE}}\nint main() {\n    std::string raw = "{{INPUT}}";\n    auto start = raw.find('['); auto end = raw.find(']');\n    std::vector<int> nums;\n    if(start != std::string::npos && end != std::string::npos) {\n        std::string list_str = raw.substr(start + 1, end - start - 1);\n        std::stringstream ss(list_str);\n        std::string item;\n        while(std::getline(ss, item, ',')) { if(!item.empty()) nums.push_back(std::stoi(item)); }\n    }\n    auto comma = raw.find(',', end);\n    int target = (comma != std::string::npos) ? std::stoi(raw.substr(comma + 1)) : 0;\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        auto u = solver.twoSum(nums, target);\n        std::cout.rdbuf(old);\n        \n        // 🚀 CUSTOM EVALATOR: Asserts index validity to bypass strict string comparisons\n        bool safe = u.size() == 2 && u[0] != u[1] && (nums[u[0]] + nums[u[1]] == target);\n        \n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n[" << u[0] << "," << u[1] << "]\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n[" << (safe ? u[0] : 0) << "," << (safe ? u[1] : 1) << "]\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isSample: true, orderNo: 1 }, { input: "[3,2,4], 6", expectedOutput: "[1,2]", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Sum of N Numbers",
      slug: "sum-of-n-numbers",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      statement: `Given an integer \`n\`, return the cumulative sum of all integers from 1 up to \`n\`.\n\n### Example 1:\n**Input:** n = 5  \n**Output:** 15  \n**Explanation:** 1 + 2 + 3 + 4 + 5 = 15.\n\n### Constraints:\n* \`1 <= n <= 10^5\``,
      inputFormat: "n = 5",
      outputFormat: "15",
      constraintsText: "1 <= n <= 10^5",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def sumOfNNumbers(self, n: int) -> int:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int sumOfNNumbers(int n) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\nimport sys, io, json\ntry:\n    val = int({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().sumOfNNumbers(val)\n    sys.stdout = old; r = (val * (val + 1)) // 2\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{u}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{r}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <sstream>\n\n{{USER_CODE}}\nint main() {\n    int val = {{INPUT}};\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        int u = solver.sumOfNNumbers(val);\n        int r = (val * (val + 1)) / 2;\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << u << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << r << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: "5", expectedOutput: "15", isSample: true, orderNo: 1 }, { input: "10", expectedOutput: "55", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Valid Palindrome",
      slug: "valid-palindrome",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      statement: `Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise. Consider only alphanumeric characters and ignore cases.\n\n### Example 1:\n**Input:** s = "raceacar"  \n**Output:** false  \n\n### Example 2:\n**Input:** s = "A man, a plan, a canal: Panama"  \n**Output:** true`,
      inputFormat: 's = "raceacar"',
      outputFormat: "false",
      constraintsText: "1 <= s.length <= 2 * 10^5",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\ndef ref(s):\n    c = "".join(i.lower() for i in str(s) if i.isalnum())\n    return c == c[::-1]\nimport sys, io, json\ntry:\n    val = str({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().isPalindrome(val)\n    sys.stdout = old\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{str(u).lower()}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{str(ref(val)).lower()}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <string>\n#include <algorithm>\n#include <sstream>\n\n{{USER_CODE}}\nbool ref(string s) {\n    string c = \"\";\n    for(char i:s) if(isalnum(i)) c+=tolower(i);\n    string r = c; reverse(r.begin(), r.end());\n    return c == r;\n}\nint main() {\n    string val = "{{INPUT}}";\n    val.erase(std::remove(val.begin(), val.end(), '"'), val.end());\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        bool u = solver.isPalindrome(val);\n        bool r = ref(val);\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << (u?\"true\":\"false\") << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << (r?\"true\":\"false\") << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: '"raceacar"', expectedOutput: "false", isSample: true, orderNo: 1 }, { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isSample: true, orderNo: 2 }] }
    }
  ];

  for (const challenge of challengeRegistry) { await prisma.problem.create({ data: challenge }); }
  console.log("✅ Seeding successfully completed!");
}

main().catch(e => console.error(e)).finally(async () => { await prisma.$disconnect(); pool.end(); });