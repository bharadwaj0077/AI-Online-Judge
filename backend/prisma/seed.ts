import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { nativeTemplates, nativeDrivers } from "./seed-native-langs";
import { extraProblems } from "./seed-extra-problems";
import { hiddenTests } from "./seed-hidden-tests";

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
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "submissions", "contest_problems", "test_cases", "problem_tags", "tags", "problems", "languages" RESTART IDENTITY CASCADE;');

  const baseLanguages = [
    { name: "C++", displayName: "C++17", slug: "cpp17", languageBase: "cpp", version: "17", fileExtension: ".cpp", dockerImage: "gcc:11", compileCommand: "g++ -O3 -std=c++17 solution.cpp -o solution", runCommand: "./solution", isCompiled: true, executionOrder: 1 },
    { name: "Python", displayName: "Python 3.11", slug: "python3", languageBase: "python", version: "3.11", fileExtension: ".py", dockerImage: "python:3.11-slim", compileCommand: null, runCommand: "python3 solution.py", isCompiled: false, executionOrder: 2 },
    { name: "C", displayName: "C (GCC 11)", slug: "c11", languageBase: "c", version: "11", fileExtension: ".c", dockerImage: "gcc:11", compileCommand: "gcc -O3 solution.c -o solution", runCommand: "./solution", isCompiled: true, executionOrder: 3 },
    { name: "Java", displayName: "Java 17", slug: "java17", languageBase: "java", version: "17", fileExtension: ".java", dockerImage: "openjdk:17-slim", compileCommand: "javac Main.java", runCommand: "java Main", isCompiled: true, executionOrder: 4 }
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
      tags: ["Array", "Hash Table"],
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
      tags: ["Math"],
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
      tags: ["String", "Two Pointers"],
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
        cpp17: `#include <iostream>\n#include <string>\n#include <algorithm>\n#include <sstream>\n\n{{USER_CODE}}\nbool ref(std::string s) {\n    std::string c = "";\n    for(char i:s) if(isalnum(i)) c+=tolower(i);\n    std::string r = c; std::reverse(r.begin(), r.end());\n    return c == r;\n}\nint main() {\n    std::string val = R"OJIN({{INPUT}})OJIN";\n    val.erase(std::remove(val.begin(), val.end(), '"'), val.end());\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        bool u = solver.isPalindrome(val);\n        bool r = ref(val);\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << (u?"true":"false") << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << (r?"true":"false") << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: '"raceacar"', expectedOutput: "false", isSample: true, orderNo: 1 }, { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Reverse String",
      slug: "reverse-string",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      tags: ["String", "Two Pointers"],
      statement: `Given a string \`s\`, return the string reversed.\n\n### Example 1:\n**Input:** s = "hello"  \n**Output:** "olleh"\n\n### Example 2:\n**Input:** s = "SynapseJudge"  \n**Output:** "egduJespanyS"\n\n### Constraints:\n* \`1 <= s.length <= 10^5\`\n* \`s\` consists of printable ASCII characters.`,
      inputFormat: 's = "hello"',
      outputFormat: '"olleh"',
      constraintsText: "1 <= s.length <= 10^5",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def reverseString(self, s: str) -> str:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    string reverseString(string s) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\nimport sys, io, json\ntry:\n    val = str({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().reverseString(val)\n    sys.stdout = old\n    r = val[::-1]\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{u}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{r}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <string>\n#include <algorithm>\n#include <sstream>\n\n{{USER_CODE}}\nint main() {\n    std::string val = R"OJIN({{INPUT}})OJIN";\n    val.erase(std::remove(val.begin(), val.end(), '"'), val.end());\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        std::string u = solver.reverseString(val);\n        std::string r = val; std::reverse(r.begin(), r.end());\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << u << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << r << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: '"hello"', expectedOutput: '"olleh"', isSample: true, orderNo: 1 }, { input: '"SynapseJudge"', expectedOutput: '"egduJespanyS"', isSample: true, orderNo: 2 }] }
    },
    {
      title: "Fibonacci Number",
      slug: "fibonacci-number",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      tags: ["Math", "Dynamic Programming"],
      statement: `The **Fibonacci numbers**, commonly denoted \`F(n)\`, form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1. That is:\n\n* \`F(0) = 0, F(1) = 1\`\n* \`F(n) = F(n - 1) + F(n - 2)\` for \`n > 1\`\n\nGiven \`n\`, calculate \`F(n)\`.\n\n### Example 1:\n**Input:** n = 10  \n**Output:** 55\n\n### Example 2:\n**Input:** n = 4  \n**Output:** 3\n\n### Constraints:\n* \`0 <= n <= 45\``,
      inputFormat: "n = 10",
      outputFormat: "55",
      constraintsText: "0 <= n <= 45",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def fib(self, n: int) -> int:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    long long fib(int n) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\nimport sys, io, json\ntry:\n    val = int({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().fib(val)\n    sys.stdout = old\n    a, b = 0, 1\n    for _ in range(val): a, b = b, a + b\n    r = a\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{u}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{r}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <sstream>\n\n{{USER_CODE}}\nint main() {\n    int val = {{INPUT}};\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        long long u = solver.fib(val);\n        long long a = 0, b = 1;\n        for(int i = 0; i < val; i++) { long long t = a + b; a = b; b = t; }\n        long long r = a;\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << u << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << r << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: "10", expectedOutput: "55", isSample: true, orderNo: 1 }, { input: "4", expectedOutput: "3", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      tags: ["String", "Stack"],
      statement: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\n### Example 1:\n**Input:** s = "()[]{}"  \n**Output:** true\n\n### Example 2:\n**Input:** s = "(]"  \n**Output:** false\n\n### Constraints:\n* \`1 <= s.length <= 10^4\``,
      inputFormat: 's = "()[]{}"',
      outputFormat: "true",
      constraintsText: "1 <= s.length <= 10^4",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\ndef ref(s):\n    st = []\n    pairs = {")": "(", "]": "[", "}": "{"}\n    for ch in s:\n        if ch in "([{": st.append(ch)\n        elif ch in pairs:\n            if not st or st.pop() != pairs[ch]: return False\n    return not st\nimport sys, io, json\ntry:\n    val = str({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().isValid(val)\n    sys.stdout = old\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{str(u).lower()}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{str(ref(val)).lower()}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <string>\n#include <stack>\n#include <algorithm>\n#include <sstream>\n\n{{USER_CODE}}\nbool ref(std::string s) {\n    std::stack<char> st;\n    for(char c : s) {\n        if(c=='('||c=='['||c=='{') st.push(c);\n        else if(c==')'||c==']'||c=='}') {\n            char need = (c==')') ? '(' : (c==']') ? '[' : '{';\n            if(st.empty() || st.top() != need) return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}\nint main() {\n    std::string val = R"OJIN({{INPUT}})OJIN";\n    val.erase(std::remove(val.begin(), val.end(), '"'), val.end());\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        bool u = solver.isValid(val);\n        bool r = ref(val);\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << (u?"true":"false") << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << (r?"true":"false") << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: '"()[]{}"', expectedOutput: "true", isSample: true, orderNo: 1 }, { input: '"(]"', expectedOutput: "false", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Binary Search",
      slug: "binary-search",
      difficulty: "EASY" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 1000,
      memoryLimitMb: 256,
      tags: ["Array", "Binary Search"],
      statement: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.\n\nYou must write an algorithm with \`O(log n)\` runtime complexity.\n\n### Example 1:\n**Input:** nums = [-1,0,3,5,9,12], target = 9  \n**Output:** 4  \n**Explanation:** 9 exists in nums and its index is 4.\n\n### Example 2:\n**Input:** nums = [-1,0,3,5,9,12], target = 2  \n**Output:** -1\n\n### Constraints:\n* \`1 <= nums.length <= 10^4\`\n* All the integers in \`nums\` are **unique**.`,
      inputFormat: "nums = [-1,0,3,5,9,12], target = 9",
      outputFormat: "4",
      constraintsText: "1 <= nums.length <= 10^4",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\nimport sys, io, json\ntry:\n    raw_input = ({{INPUT}})\n    nums_arr, target_val = list(raw_input[0]), raw_input[1]\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().search(nums_arr, target_val)\n    sys.stdout = old\n    r = nums_arr.index(target_val) if target_val in nums_arr else -1\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{u}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{r}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\n\n{{USER_CODE}}\nint main() {\n    std::string raw = R"OJIN({{INPUT}})OJIN";\n    auto start = raw.find('['); auto end = raw.find(']');\n    std::vector<int> nums;\n    if(start != std::string::npos && end != std::string::npos) {\n        std::string list_str = raw.substr(start + 1, end - start - 1);\n        std::stringstream ss(list_str);\n        std::string item;\n        while(std::getline(ss, item, ',')) { if(!item.empty()) nums.push_back(std::stoi(item)); }\n    }\n    auto comma = raw.find(',', end);\n    int target = (comma != std::string::npos) ? std::stoi(raw.substr(comma + 1)) : 0;\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        int u = solver.search(nums, target);\n        int r = -1;\n        for(size_t i = 0; i < nums.size(); i++) if(nums[i] == target) { r = (int)i; break; }\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << u << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << r << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: "[-1,0,3,5,9,12], 9", expectedOutput: "4", isSample: true, orderNo: 1 }, { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Maximum Subarray",
      slug: "maximum-subarray",
      difficulty: "MEDIUM" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
      statement: `Given an integer array \`nums\`, find the subarray with the largest sum, and return *its sum*.\n\n### Example 1:\n**Input:** nums = [-2,1,-3,4,-1,2,1,-5,4]  \n**Output:** 6  \n**Explanation:** The subarray [4,-1,2,1] has the largest sum 6.\n\n### Example 2:\n**Input:** nums = [5,4,-1,7,8]  \n**Output:** 23\n\n### Constraints:\n* \`1 <= nums.length <= 10^5\`\n* \`-10^4 <= nums[i] <= 10^4\``,
      inputFormat: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
      outputFormat: "6",
      constraintsText: "1 <= nums.length <= 10^5",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\nimport sys, io, json\ntry:\n    nums_arr = list({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().maxSubArray(nums_arr)\n    sys.stdout = old\n    best = cur = nums_arr[0]\n    for x in nums_arr[1:]:\n        cur = max(x, cur + x)\n        best = max(best, cur)\n    r = best\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{u}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{r}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <vector>\n#include <sstream>\n#include <algorithm>\n\n{{USER_CODE}}\nint main() {\n    std::string raw = R"OJIN({{INPUT}})OJIN";\n    auto start = raw.find('['); auto end = raw.find(']');\n    std::vector<int> nums;\n    if(start != std::string::npos && end != std::string::npos) {\n        std::string list_str = raw.substr(start + 1, end - start - 1);\n        std::stringstream ss(list_str);\n        std::string item;\n        while(std::getline(ss, item, ',')) { if(!item.empty()) nums.push_back(std::stoi(item)); }\n    }\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        int u = solver.maxSubArray(nums);\n        int best = nums[0], cur = nums[0];\n        for(size_t i = 1; i < nums.size(); i++) {\n            cur = std::max(nums[i], cur + nums[i]);\n            best = std::max(best, cur);\n        }\n        int r = best;\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << u << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << r << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isSample: true, orderNo: 1 }, { input: "[5,4,-1,7,8]", expectedOutput: "23", isSample: true, orderNo: 2 }] }
    },
    {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeating-characters",
      difficulty: "MEDIUM" as const,
      visibility: "PUBLIC" as const,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      tags: ["String", "Hash Table", "Sliding Window"],
      statement: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.\n\n### Example 1:\n**Input:** s = "abcabcbb"  \n**Output:** 3  \n**Explanation:** The answer is "abc", with the length of 3.\n\n### Example 2:\n**Input:** s = "bbbbb"  \n**Output:** 1\n\n### Constraints:\n* \`0 <= s.length <= 5 * 10^4\`\n* \`s\` consists of English letters, digits, symbols and spaces.`,
      inputFormat: 's = "abcabcbb"',
      outputFormat: "3",
      constraintsText: "0 <= s.length <= 5 * 10^4",
      inputTemplate: JSON.stringify({
        python3: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your optimal solution here\n        pass",
        cpp17: "#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your optimal solution here\n        \n    }\n};"
      }),
      driverScript: JSON.stringify({
        python3: `{{USER_CODE}}\ndef ref(s):\n    seen = {}\n    left = best = 0\n    for i, ch in enumerate(s):\n        if ch in seen and seen[ch] >= left: left = seen[ch] + 1\n        seen[ch] = i\n        best = max(best, i - left + 1)\n    return best\nimport sys, io, json\ntry:\n    val = str({{INPUT}})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().lengthOfLongestSubstring(val)\n    sys.stdout = old\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n{u}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n{ref(val)}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`,
        cpp17: `#include <iostream>\n#include <string>\n#include <algorithm>\n#include <sstream>\n#include <unordered_map>\n\n{{USER_CODE}}\nint ref(std::string s) {\n    std::unordered_map<char,int> seen;\n    int left = 0, best = 0;\n    for(int i = 0; i < (int)s.size(); i++) {\n        char ch = s[(size_t)i];\n        if(seen.count(ch) && seen[ch] >= left) left = seen[ch] + 1;\n        seen[ch] = i;\n        best = std::max(best, i - left + 1);\n    }\n    return best;\n}\nint main() {\n    std::string val = R"OJIN({{INPUT}})OJIN";\n    val.erase(std::remove(val.begin(), val.end(), '"'), val.end());\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        int u = solver.lengthOfLongestSubstring(val);\n        int r = ref(val);\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << u << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << r << "\\n===EXPECTED_END===\\n";\n    } catch(const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;}`
      }),
      testCases: { create: [{ input: '"abcabcbb"', expectedOutput: "3", isSample: true, orderNo: 1 }, { input: '"bbbbb"', expectedOutput: "1", isSample: true, orderNo: 2 }] }
    }
  ];

  for (const challenge of [...challengeRegistry, ...extraProblems]) {
    const { tags, ...problemData } = challenge;
    // Merge in the C and Java starter templates + drivers for this problem
    problemData.inputTemplate = JSON.stringify({
      ...JSON.parse(problemData.inputTemplate),
      ...(nativeTemplates[problemData.slug] || {}),
    });
    problemData.driverScript = JSON.stringify({
      ...JSON.parse(problemData.driverScript),
      ...(nativeDrivers[problemData.slug] || {}),
    });
    // Append hidden (non-sample) judge cases after the visible samples
    const sampleCases = problemData.testCases.create;
    const hiddenCases = (hiddenTests[problemData.slug] || []).map((t, i) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
      isSample: false,
      orderNo: sampleCases.length + i + 1,
    }));
    problemData.testCases = { create: [...sampleCases, ...hiddenCases] };
    await prisma.problem.create({
      data: {
        ...problemData,
        problemTags: {
          create: (tags || []).map((name: string) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
  }
  console.log(`✅ Seeding successfully completed! (${challengeRegistry.length + extraProblems.length} problems)`);
}

main().catch(e => console.error(e)).finally(async () => { await prisma.$disconnect(); pool.end(); });
