// 11 additional problems (IDs 10-20) with starter templates and judge drivers
// for all four runtimes. Drivers are assembled from shared per-language
// scaffolds; each problem contributes its parse shape, reference solution and
// method signature. Reference results are computed BEFORE invoking user code
// so in-place mutations cannot corrupt the expected value.

type ParseKind = "int" | "list" | "listInt";
type OutKind = "int" | "bool";

interface ProblemDef {
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  tags: string[];
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraintsText: string;
  method: string;
  parse: ParseKind;
  out: OutKind;
  sigs: { py: string; cpp: string; c: string; java: string };
  refs: { py: string; cpp: string; c: string; java: string };
  tests: { input: string; expected: string }[];
}

/* ---------------- python scaffold ---------------- */
const PY_PARSE: Record<ParseKind, { lines: string; args: string }> = {
  int: { lines: "    val = int({{INPUT}})", args: "val" },
  list: { lines: "    val = list({{INPUT}})", args: "val" },
  listInt: { lines: "    raw_in = ({{INPUT}})\n    val = list(raw_in[0])\n    k = raw_in[1]", args: "val, k" },
};

function pyDriver(d: ProblemDef): string {
  const p = PY_PARSE[d.parse];
  const fmtU = d.out === "bool" ? "{str(u).lower()}" : "{u}";
  const fmtR = d.out === "bool" ? "{str(r).lower()}" : "{r}";
  return `{{USER_CODE}}\n${d.refs.py}\nimport sys, io\ntry:\n${p.lines}\n    r = __ref(${p.args})\n    buf = io.StringIO(); old = sys.stdout; sys.stdout = buf\n    u = Solution().${d.method}(${p.args})\n    sys.stdout = old\n    print(f"===STD_OUT_START===\\n{buf.getvalue()}===STD_OUT_END===")\n    print(f"===RESULT_START===\\n${fmtU}===RESULT_END===")\n    print(f"===EXPECTED_START===\\n${fmtR}===EXPECTED_END===")\nexcept Exception as e:\n    print(f"===ERROR_START===\\n{str(e)}===ERROR_END===")`;
}

/* ---------------- c++ scaffold ---------------- */
const CPP_LIST_PARSE = `    std::string raw = R"OJIN({{INPUT}})OJIN";\n    auto lb = raw.find('['); auto rb = raw.find(']');\n    std::vector<int> val;\n    { std::string inner = raw.substr(lb + 1, rb - lb - 1); std::stringstream ss(inner); std::string item;\n      while (std::getline(ss, item, ',')) { if (item.find_first_not_of(' ') != std::string::npos) val.push_back(std::stoi(item)); } }`;

const CPP_PARSE: Record<ParseKind, { lines: string; args: string }> = {
  int: { lines: "    int val = {{INPUT}};", args: "val" },
  list: { lines: CPP_LIST_PARSE, args: "val" },
  listInt: { lines: CPP_LIST_PARSE + `\n    int k = std::stoi(raw.substr(raw.find(',', rb) + 1));`, args: "val, k" },
};

function cppDriver(d: ProblemDef): string {
  const p = CPP_PARSE[d.parse];
  const fmt = (v: string) => (d.out === "bool" ? `(${v} ? "true" : "false")` : v);
  return `#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n#include <unordered_set>\n#include <unordered_map>\n\n{{USER_CODE}}\n\n${d.refs.cpp}\n\nint main() {\n${p.lines}\n    auto r = refCheck(${p.args});\n    std::stringstream buf; std::streambuf* old = std::cout.rdbuf(buf.rdbuf());\n    try {\n        Solution solver;\n        auto u = solver.${d.method}(${p.args});\n        std::cout.rdbuf(old);\n        std::cout << "\\n===STD_OUT_START===\\n" << buf.str() << "\\n===STD_OUT_END===\\n";\n        std::cout << "===RESULT_START===\\n" << ${fmt("u")} << "\\n===RESULT_END===\\n";\n        std::cout << "===EXPECTED_START===\\n" << ${fmt("r")} << "\\n===EXPECTED_END===\\n";\n    } catch (const std::exception& e) {\n        std::cout.rdbuf(old); std::cout << "===ERROR_START===\\n" << e.what() << "\\n===ERROR_END===\\n";\n    }\n    return 0;\n}`;
}

/* ---------------- c scaffold ---------------- */
const C_LIST_PARSE = `    char raw[] = "{{INPUT}}";\n    static int val[100005]; int n = 0;\n    { char *p = strchr(raw, '[') + 1;\n      while (*p && *p != ']') {\n          if (*p == ',' || *p == ' ') { p++; continue; }\n          val[n++] = (int)strtol(p, &p, 10);\n      } }`;

const C_PARSE: Record<ParseKind, { lines: string; args: string }> = {
  int: { lines: "    int val = {{INPUT}};", args: "val" },
  list: { lines: C_LIST_PARSE, args: "val, n" },
  listInt: { lines: C_LIST_PARSE + `\n    int k = 0; { char *c2 = strchr(raw, ']'); char *c3 = c2 ? strchr(c2, ',') : NULL; if (c3) k = (int)strtol(c3 + 1, NULL, 10); }`, args: "val, n, k" },
};

function cDriver(d: ProblemDef): string {
  const p = C_PARSE[d.parse];
  const outType = d.out === "bool" ? "bool" : "int";
  const spec = d.out === "bool" ? "%s" : "%d";
  const arg = (v: string) => (d.out === "bool" ? `${v} ? "true" : "false"` : v);
  return `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <stdbool.h>\n\n{{USER_CODE}}\n\n${d.refs.c}\n\nint main() {\n${p.lines}\n    ${outType} r = refCheck(${p.args});\n    ${outType} u = ${d.method}(${p.args});\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n${spec}\\n===RESULT_END===\\n", ${arg("u")});\n    printf("===EXPECTED_START===\\n${spec}\\n===EXPECTED_END===\\n", ${arg("r")});\n    return 0;\n}`;
}

/* ---------------- java scaffold ---------------- */
const JAVA_HEAD = `import java.util.*;\nimport java.io.*;\n\n{{USER_CODE}}\n\nclass Main {\n    static int[] parseIntArray(String raw) {\n        int lb = raw.indexOf('['), rb = raw.indexOf(']');\n        String inner = raw.substring(lb + 1, rb).trim();\n        if (inner.isEmpty()) return new int[0];\n        String[] parts = inner.split(",");\n        int[] out = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) out[i] = Integer.parseInt(parts[i].trim());\n        return out;\n    }\n    static int parseTrailingInt(String raw) {\n        int rb = raw.indexOf(']');\n        return Integer.parseInt(raw.substring(raw.indexOf(',', rb) + 1).trim());\n    }\n    public static void main(String[] args) {\n        String raw = """\n{{INPUT}}\n""";\n        raw = raw.trim();\n        try {\n`;

const JAVA_TAIL = `            System.out.println("\\n===STD_OUT_START===\\n" + captured + "===STD_OUT_END===");\n            System.out.println("===RESULT_START===\\n" + resStr + "\\n===RESULT_END===");\n            System.out.println("===EXPECTED_START===\\n" + expStr + "\\n===EXPECTED_END===");\n        } catch (Exception e) {\n            System.out.println("===ERROR_START===\\n" + e + "\\n===ERROR_END===");\n        }\n    }\n}`;

const JAVA_PARSE: Record<ParseKind, { lines: string; args: string }> = {
  int: { lines: "            int val = Integer.parseInt(raw);\n", args: "val" },
  list: { lines: "            int[] val = parseIntArray(raw);\n", args: "val" },
  listInt: { lines: "            int[] val = parseIntArray(raw);\n            int k = parseTrailingInt(raw);\n", args: "val, k" },
};

function javaDriver(d: ProblemDef): string {
  const p = JAVA_PARSE[d.parse];
  const uType = d.out === "bool" ? "boolean" : "int";
  return JAVA_HEAD
    + p.lines
    + d.refs.java
    + `            PrintStream oldOut = System.out;\n            ByteArrayOutputStream buf = new ByteArrayOutputStream();\n            System.setOut(new PrintStream(buf));\n            ${uType} u = new Solution().${d.method}(${p.args});\n            System.setOut(oldOut);\n            String captured = buf.toString();\n            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(r);\n`
    + JAVA_TAIL;
}

/* ---------------- templates ---------------- */
function templates(d: ProblemDef) {
  return {
    python3: `class Solution:\n    ${d.sigs.py}\n        # Write your optimal solution here\n        pass`,
    cpp17: `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    ${d.sigs.cpp} {\n        // Write your optimal solution here\n        \n    }\n};`,
    c11: `#include <stdio.h>\n#include <stdlib.h>\n#include <stdbool.h>\n\n${d.sigs.c} {\n    // Write your optimal solution here\n    \n}`,
    java17: `import java.util.*;\n\nclass Solution {\n    ${d.sigs.java} {\n        // Write your optimal solution here\n        \n    }\n}`,
  };
}

/* ================= problem definitions ================= */
const DEFS: ProblemDef[] = [
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "EASY",
    tags: ["Math", "Dynamic Programming"],
    statement: `You are climbing a staircase. It takes \`n\` steps to reach the top.\n\nEach time you can either climb \`1\` or \`2\` steps. In how many distinct ways can you climb to the top?\n\n### Example 1:\n**Input:** n = 2  \n**Output:** 2  \n**Explanation:** 1+1 or 2.\n\n### Example 2:\n**Input:** n = 5  \n**Output:** 8\n\n### Constraints:\n* \`1 <= n <= 45\``,
    inputFormat: "n = 5",
    outputFormat: "8",
    constraintsText: "1 <= n <= 45",
    method: "climbStairs",
    parse: "int",
    out: "int",
    sigs: {
      py: "def climbStairs(self, n: int) -> int:",
      cpp: "int climbStairs(int n)",
      c: "int climbStairs(int n)",
      java: "public int climbStairs(int n)",
    },
    refs: {
      py: `def __ref(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1): a, b = b, a + b\n    return b`,
      cpp: `static int refCheck(int n) { if (n <= 2) return n; int a = 1, b = 2; for (int i = 3; i <= n; i++) { int t = a + b; a = b; b = t; } return b; }`,
      c: `static int refCheck(int n) { if (n <= 2) return n; int a = 1, b = 2; for (int i = 3; i <= n; i++) { int t = a + b; a = b; b = t; } return b; }`,
      java: `            int r; if (val <= 2) r = val; else { int a = 1, b = 2; for (int i = 3; i <= val; i++) { int t = a + b; a = b; b = t; } r = b; }\n`,
    },
    tests: [{ input: "2", expected: "2" }, { input: "5", expected: "8" }],
  },
  {
    title: "Contains Duplicate",
    slug: "contains-duplicate",
    difficulty: "EASY",
    tags: ["Array", "Hash Table", "Sorting"],
    statement: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.\n\n### Example 1:\n**Input:** nums = [1,2,3,1]  \n**Output:** true\n\n### Example 2:\n**Input:** nums = [1,2,3,4]  \n**Output:** false\n\n### Constraints:\n* \`1 <= nums.length <= 10^5\`\n* \`-10^9 <= nums[i] <= 10^9\``,
    inputFormat: "nums = [1,2,3,1]",
    outputFormat: "true",
    constraintsText: "1 <= nums.length <= 10^5",
    method: "containsDuplicate",
    parse: "list",
    out: "bool",
    sigs: {
      py: "def containsDuplicate(self, nums: list[int]) -> bool:",
      cpp: "bool containsDuplicate(vector<int>& nums)",
      c: "bool containsDuplicate(int* nums, int numsSize)",
      java: "public boolean containsDuplicate(int[] nums)",
    },
    refs: {
      py: `def __ref(v):\n    return len(set(v)) != len(v)`,
      cpp: `static bool refCheck(std::vector<int>& v) { std::unordered_set<int> s(v.begin(), v.end()); return s.size() != v.size(); }`,
      c: `static bool refCheck(int* v, int n) { for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) if (v[i] == v[j]) return true; return false; }`,
      java: `            boolean r = false; HashSet<Integer> hs = new HashSet<>(); for (int x : val) if (!hs.add(x)) { r = true; break; }\n`,
    },
    tests: [{ input: "[1,2,3,1]", expected: "true" }, { input: "[1,2,3,4]", expected: "false" }],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "EASY",
    tags: ["Array", "Dynamic Programming"],
    statement: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve*. If you cannot achieve any profit, return \`0\`.\n\n### Example 1:\n**Input:** prices = [7,1,5,3,6,4]  \n**Output:** 5  \n**Explanation:** Buy on day 2 (price = 1) and sell on day 5 (price = 6).\n\n### Example 2:\n**Input:** prices = [7,6,4,3,1]  \n**Output:** 0\n\n### Constraints:\n* \`1 <= prices.length <= 10^5\`\n* \`0 <= prices[i] <= 10^4\``,
    inputFormat: "prices = [7,1,5,3,6,4]",
    outputFormat: "5",
    constraintsText: "1 <= prices.length <= 10^5",
    method: "maxProfit",
    parse: "list",
    out: "int",
    sigs: {
      py: "def maxProfit(self, prices: list[int]) -> int:",
      cpp: "int maxProfit(vector<int>& prices)",
      c: "int maxProfit(int* prices, int pricesSize)",
      java: "public int maxProfit(int[] prices)",
    },
    refs: {
      py: `def __ref(v):\n    best = 0; mn = v[0]\n    for x in v[1:]:\n        if x - mn > best: best = x - mn\n        if x < mn: mn = x\n    return best`,
      cpp: `static int refCheck(std::vector<int>& v) { int best = 0, mn = v[0]; for (size_t i = 1; i < v.size(); i++) { if (v[i] - mn > best) best = v[i] - mn; if (v[i] < mn) mn = v[i]; } return best; }`,
      c: `static int refCheck(int* v, int n) { int best = 0, mn = v[0]; for (int i = 1; i < n; i++) { if (v[i] - mn > best) best = v[i] - mn; if (v[i] < mn) mn = v[i]; } return best; }`,
      java: `            int r = 0; int mn = val[0]; for (int i = 1; i < val.length; i++) { if (val[i] - mn > r) r = val[i] - mn; if (val[i] < mn) mn = val[i]; }\n`,
    },
    tests: [{ input: "[7,1,5,3,6,4]", expected: "5" }, { input: "[7,6,4,3,1]", expected: "0" }],
  },
  {
    title: "Missing Number",
    slug: "missing-number",
    difficulty: "EASY",
    tags: ["Array", "Math", "Bit Manipulation"],
    statement: `Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return *the only number in the range that is missing from the array*.\n\n### Example 1:\n**Input:** nums = [3,0,1]  \n**Output:** 2\n\n### Example 2:\n**Input:** nums = [9,6,4,2,3,5,7,0,1]  \n**Output:** 8\n\n### Constraints:\n* \`n == nums.length\`\n* \`1 <= n <= 10^4\`\n* All the numbers of \`nums\` are **unique**.`,
    inputFormat: "nums = [3,0,1]",
    outputFormat: "2",
    constraintsText: "1 <= n <= 10^4",
    method: "missingNumber",
    parse: "list",
    out: "int",
    sigs: {
      py: "def missingNumber(self, nums: list[int]) -> int:",
      cpp: "int missingNumber(vector<int>& nums)",
      c: "int missingNumber(int* nums, int numsSize)",
      java: "public int missingNumber(int[] nums)",
    },
    refs: {
      py: `def __ref(v):\n    n = len(v)\n    return n * (n + 1) // 2 - sum(v)`,
      cpp: `static int refCheck(std::vector<int>& v) { long long n = (long long)v.size(); long long s = 0; for (int x : v) s += x; return (int)(n * (n + 1) / 2 - s); }`,
      c: `static int refCheck(int* v, int n) { long long s = 0; for (int i = 0; i < n; i++) s += v[i]; return (int)((long long)n * (n + 1) / 2 - s); }`,
      java: `            long exp = (long) val.length * (val.length + 1) / 2; long sum = 0; for (int x : val) sum += x; int r = (int)(exp - sum);\n`,
    },
    tests: [{ input: "[3,0,1]", expected: "2" }, { input: "[9,6,4,2,3,5,7,0,1]", expected: "8" }],
  },
  {
    title: "Count Primes",
    slug: "count-primes",
    difficulty: "MEDIUM",
    tags: ["Math", "Enumeration"],
    statement: `Given an integer \`n\`, return *the number of prime numbers that are strictly less than* \`n\`.\n\n### Example 1:\n**Input:** n = 10  \n**Output:** 4  \n**Explanation:** There are 4 primes less than 10: 2, 3, 5, 7.\n\n### Example 2:\n**Input:** n = 1  \n**Output:** 0\n\n### Constraints:\n* \`0 <= n <= 10^5\``,
    inputFormat: "n = 10",
    outputFormat: "4",
    constraintsText: "0 <= n <= 10^5",
    method: "countPrimes",
    parse: "int",
    out: "int",
    sigs: {
      py: "def countPrimes(self, n: int) -> int:",
      cpp: "int countPrimes(int n)",
      c: "int countPrimes(int n)",
      java: "public int countPrimes(int n)",
    },
    refs: {
      py: `def __ref(n):\n    if n < 3: return 0\n    sieve = [True] * n\n    sieve[0] = sieve[1] = False\n    i = 2\n    while i * i < n:\n        if sieve[i]:\n            sieve[i*i::i] = [False] * len(sieve[i*i::i])\n        i += 1\n    return sum(sieve)`,
      cpp: `static int refCheck(int n) { if (n < 3) return 0; std::vector<char> comp(n, 0); int cnt = 0; for (long long i = 2; i * i < n; i++) if (!comp[i]) for (long long j = i * i; j < n; j += i) comp[j] = 1; for (int i = 2; i < n; i++) if (!comp[i]) cnt++; return cnt; }`,
      c: `static int refCheck(int n) { if (n < 3) return 0; static char comp[100005]; memset(comp, 0, sizeof(comp)); int cnt = 0; for (long long i = 2; i * i < n; i++) if (!comp[i]) for (long long j = i * i; j < n; j += i) comp[j] = 1; for (int i = 2; i < n; i++) if (!comp[i]) cnt++; return cnt; }`,
      java: `            int r = 0; if (val > 2) { boolean[] comp = new boolean[val]; for (int i = 2; (long) i * i < val; i++) if (!comp[i]) for (int j = i * i; j < val; j += i) comp[j] = true; for (int i = 2; i < val; i++) if (!comp[i]) r++; }\n`,
    },
    tests: [{ input: "10", expected: "4" }, { input: "1", expected: "0" }],
  },
  {
    title: "House Robber",
    slug: "house-robber",
    difficulty: "MEDIUM",
    tags: ["Array", "Dynamic Programming"],
    statement: `You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected — **you cannot rob two adjacent houses**.\n\nGiven an integer array \`nums\` representing the amount of money of each house, return *the maximum amount of money you can rob tonight without alerting the police*.\n\n### Example 1:\n**Input:** nums = [1,2,3,1]  \n**Output:** 4  \n**Explanation:** Rob house 1 (money = 1) and then rob house 3 (money = 3).\n\n### Example 2:\n**Input:** nums = [2,7,9,3,1]  \n**Output:** 12\n\n### Constraints:\n* \`1 <= nums.length <= 100\`\n* \`0 <= nums[i] <= 400\``,
    inputFormat: "nums = [1,2,3,1]",
    outputFormat: "4",
    constraintsText: "1 <= nums.length <= 100",
    method: "rob",
    parse: "list",
    out: "int",
    sigs: {
      py: "def rob(self, nums: list[int]) -> int:",
      cpp: "int rob(vector<int>& nums)",
      c: "int rob(int* nums, int numsSize)",
      java: "public int rob(int[] nums)",
    },
    refs: {
      py: `def __ref(v):\n    take, skip = 0, 0\n    for x in v:\n        take, skip = skip + x, max(skip, take)\n    return max(take, skip)`,
      cpp: `static int refCheck(std::vector<int>& v) { int take = 0, skip = 0; for (int x : v) { int nt = skip + x; skip = std::max(skip, take); take = nt; } return std::max(take, skip); }`,
      c: `static int refCheck(int* v, int n) { int take = 0, skip = 0; for (int i = 0; i < n; i++) { int nt = skip + v[i]; skip = skip > take ? skip : take; take = nt; } return take > skip ? take : skip; }`,
      java: `            int take = 0, skip = 0; for (int x : val) { int nt = skip + x; skip = Math.max(skip, take); take = nt; } int r = Math.max(take, skip);\n`,
    },
    tests: [{ input: "[1,2,3,1]", expected: "4" }, { input: "[2,7,9,3,1]", expected: "12" }],
  },
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    difficulty: "MEDIUM",
    tags: ["Array", "Two Pointers", "Greedy"],
    statement: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the **most** water.\n\nReturn *the maximum amount of water a container can store*.\n\n### Example 1:\n**Input:** height = [1,8,6,2,5,4,8,3,7]  \n**Output:** 49\n\n### Example 2:\n**Input:** height = [1,1]  \n**Output:** 1\n\n### Constraints:\n* \`2 <= n <= 10^5\`\n* \`0 <= height[i] <= 10^4\``,
    inputFormat: "height = [1,8,6,2,5,4,8,3,7]",
    outputFormat: "49",
    constraintsText: "2 <= n <= 10^5",
    method: "maxArea",
    parse: "list",
    out: "int",
    sigs: {
      py: "def maxArea(self, height: list[int]) -> int:",
      cpp: "int maxArea(vector<int>& height)",
      c: "int maxArea(int* height, int heightSize)",
      java: "public int maxArea(int[] height)",
    },
    refs: {
      py: `def __ref(v):\n    best, lo, hi = 0, 0, len(v) - 1\n    while lo < hi:\n        best = max(best, min(v[lo], v[hi]) * (hi - lo))\n        if v[lo] < v[hi]: lo += 1\n        else: hi -= 1\n    return best`,
      cpp: `static int refCheck(std::vector<int>& v) { int best = 0, lo = 0, hi = (int)v.size() - 1; while (lo < hi) { int area = std::min(v[lo], v[hi]) * (hi - lo); if (area > best) best = area; if (v[lo] < v[hi]) lo++; else hi--; } return best; }`,
      c: `static int refCheck(int* v, int n) { int best = 0, lo = 0, hi = n - 1; while (lo < hi) { int m = v[lo] < v[hi] ? v[lo] : v[hi]; int area = m * (hi - lo); if (area > best) best = area; if (v[lo] < v[hi]) lo++; else hi--; } return best; }`,
      java: `            int r = 0, lo = 0, hi = val.length - 1; while (lo < hi) { int area = Math.min(val[lo], val[hi]) * (hi - lo); if (area > r) r = area; if (val[lo] < val[hi]) lo++; else hi--; }\n`,
    },
    tests: [{ input: "[1,8,6,2,5,4,8,3,7]", expected: "49" }, { input: "[1,1]", expected: "1" }],
  },
  {
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "MEDIUM",
    tags: ["Array", "Dynamic Programming", "Breadth-First Search"],
    statement: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.\n\nReturn *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.\n\nYou may assume that you have an infinite number of each kind of coin.\n\n### Example 1:\n**Input:** coins = [1,2,5], amount = 11  \n**Output:** 3  \n**Explanation:** 11 = 5 + 5 + 1\n\n### Example 2:\n**Input:** coins = [2], amount = 3  \n**Output:** -1\n\n### Constraints:\n* \`1 <= coins.length <= 12\`\n* \`0 <= amount <= 10^4\``,
    inputFormat: "coins = [1,2,5], amount = 11",
    outputFormat: "3",
    constraintsText: "0 <= amount <= 10^4",
    method: "coinChange",
    parse: "listInt",
    out: "int",
    sigs: {
      py: "def coinChange(self, coins: list[int], amount: int) -> int:",
      cpp: "int coinChange(vector<int>& coins, int amount)",
      c: "int coinChange(int* coins, int coinsSize, int amount)",
      java: "public int coinChange(int[] coins, int amount)",
    },
    refs: {
      py: `def __ref(coins, amount):\n    INF = float("inf")\n    dp = [0] + [INF] * amount\n    for a in range(1, amount + 1):\n        for c in coins:\n            if c <= a and dp[a - c] + 1 < dp[a]: dp[a] = dp[a - c] + 1\n    return -1 if dp[amount] == INF else dp[amount]`,
      cpp: `static int refCheck(std::vector<int>& coins, int amount) { const int INF = 1000000000; std::vector<int> dp(amount + 1, INF); dp[0] = 0; for (int a = 1; a <= amount; a++) for (int c : coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1; return dp[amount] >= INF ? -1 : dp[amount]; }`,
      c: `static int refCheck(int* coins, int n, int amount) { static int dp[10005]; dp[0] = 0; for (int i = 1; i <= amount; i++) dp[i] = 1000000000; for (int a = 1; a <= amount; a++) for (int i = 0; i < n; i++) if (coins[i] <= a && dp[a - coins[i]] + 1 < dp[a]) dp[a] = dp[a - coins[i]] + 1; return dp[amount] >= 1000000000 ? -1 : dp[amount]; }`,
      java: `            int INF = 1000000000; int[] dp = new int[k + 1]; Arrays.fill(dp, INF); dp[0] = 0; for (int a = 1; a <= k; a++) for (int c : val) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1; int r = dp[k] >= INF ? -1 : dp[k];\n`,
    },
    tests: [{ input: "[1,2,5], 11", expected: "3" }, { input: "[2], 3", expected: "-1" }],
  },
  {
    title: "Jump Game",
    slug: "jump-game",
    difficulty: "MEDIUM",
    tags: ["Array", "Dynamic Programming", "Greedy"],
    statement: `You are given an integer array \`nums\`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.\n\nReturn \`true\` if you can reach the last index, or \`false\` otherwise.\n\n### Example 1:\n**Input:** nums = [2,3,1,1,4]  \n**Output:** true\n\n### Example 2:\n**Input:** nums = [3,2,1,0,4]  \n**Output:** false  \n**Explanation:** You will always arrive at index 3. Its maximum jump length is 0, so you can never reach the last index.\n\n### Constraints:\n* \`1 <= nums.length <= 10^4\`\n* \`0 <= nums[i] <= 10^5\``,
    inputFormat: "nums = [2,3,1,1,4]",
    outputFormat: "true",
    constraintsText: "1 <= nums.length <= 10^4",
    method: "canJump",
    parse: "list",
    out: "bool",
    sigs: {
      py: "def canJump(self, nums: list[int]) -> bool:",
      cpp: "bool canJump(vector<int>& nums)",
      c: "bool canJump(int* nums, int numsSize)",
      java: "public boolean canJump(int[] nums)",
    },
    refs: {
      py: `def __ref(v):\n    reach = 0\n    for i, x in enumerate(v):\n        if i > reach: return False\n        reach = max(reach, i + x)\n    return True`,
      cpp: `static bool refCheck(std::vector<int>& v) { long long reach = 0; for (size_t i = 0; i < v.size(); i++) { if ((long long)i > reach) return false; if ((long long)i + v[i] > reach) reach = (long long)i + v[i]; } return true; }`,
      c: `static bool refCheck(int* v, int n) { long long reach = 0; for (int i = 0; i < n; i++) { if (i > reach) return false; if (i + (long long)v[i] > reach) reach = i + (long long)v[i]; } return true; }`,
      java: `            long reach = 0; boolean r = true; for (int i = 0; i < val.length; i++) { if (i > reach) { r = false; break; } if (i + (long)val[i] > reach) reach = i + (long)val[i]; }\n`,
    },
    tests: [{ input: "[2,3,1,1,4]", expected: "true" }, { input: "[3,2,1,0,4]", expected: "false" }],
  },
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    difficulty: "HARD",
    tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
    statement: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.\n\n### Example 1:\n**Input:** height = [0,1,0,2,1,0,1,3,2,1,2,1]  \n**Output:** 6  \n**Explanation:** The elevation map traps 6 units of rain water.\n\n### Example 2:\n**Input:** height = [4,2,0,3,2,5]  \n**Output:** 9\n\n### Constraints:\n* \`1 <= n <= 2 * 10^4\`\n* \`0 <= height[i] <= 10^5\``,
    inputFormat: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
    outputFormat: "6",
    constraintsText: "1 <= n <= 2 * 10^4",
    method: "trap",
    parse: "list",
    out: "int",
    sigs: {
      py: "def trap(self, height: list[int]) -> int:",
      cpp: "int trap(vector<int>& height)",
      c: "int trap(int* height, int heightSize)",
      java: "public int trap(int[] height)",
    },
    refs: {
      py: `def __ref(v):\n    if not v: return 0\n    lo, hi = 0, len(v) - 1\n    lm = rm = total = 0\n    while lo < hi:\n        if v[lo] < v[hi]:\n            if v[lo] >= lm: lm = v[lo]\n            else: total += lm - v[lo]\n            lo += 1\n        else:\n            if v[hi] >= rm: rm = v[hi]\n            else: total += rm - v[hi]\n            hi -= 1\n    return total`,
      cpp: `static int refCheck(std::vector<int>& v) { int lo = 0, hi = (int)v.size() - 1, lm = 0, rm = 0, total = 0; while (lo < hi) { if (v[lo] < v[hi]) { if (v[lo] >= lm) lm = v[lo]; else total += lm - v[lo]; lo++; } else { if (v[hi] >= rm) rm = v[hi]; else total += rm - v[hi]; hi--; } } return total; }`,
      c: `static int refCheck(int* v, int n) { int lo = 0, hi = n - 1, lm = 0, rm = 0, total = 0; while (lo < hi) { if (v[lo] < v[hi]) { if (v[lo] >= lm) lm = v[lo]; else total += lm - v[lo]; lo++; } else { if (v[hi] >= rm) rm = v[hi]; else total += rm - v[hi]; hi--; } } return total; }`,
      java: `            int r = 0, lo = 0, hi = val.length - 1, lm = 0, rm = 0; while (lo < hi) { if (val[lo] < val[hi]) { if (val[lo] >= lm) lm = val[lo]; else r += lm - val[lo]; lo++; } else { if (val[hi] >= rm) rm = val[hi]; else r += rm - val[hi]; hi--; } }\n`,
    },
    tests: [{ input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expected: "6" }, { input: "[4,2,0,3,2,5]", expected: "9" }],
  },
  {
    title: "First Missing Positive",
    slug: "first-missing-positive",
    difficulty: "HARD",
    tags: ["Array", "Hash Table"],
    statement: `Given an unsorted integer array \`nums\`, return the smallest positive integer that is **not present** in \`nums\`.\n\nYou must implement an algorithm that runs in \`O(n)\` time and uses \`O(1)\` auxiliary space.\n\n### Example 1:\n**Input:** nums = [1,2,0]  \n**Output:** 3\n\n### Example 2:\n**Input:** nums = [3,4,-1,1]  \n**Output:** 2\n\n### Constraints:\n* \`1 <= nums.length <= 10^5\`\n* \`-2^31 <= nums[i] <= 2^31 - 1\``,
    inputFormat: "nums = [3,4,-1,1]",
    outputFormat: "2",
    constraintsText: "1 <= nums.length <= 10^5",
    method: "firstMissingPositive",
    parse: "list",
    out: "int",
    sigs: {
      py: "def firstMissingPositive(self, nums: list[int]) -> int:",
      cpp: "int firstMissingPositive(vector<int>& nums)",
      c: "int firstMissingPositive(int* nums, int numsSize)",
      java: "public int firstMissingPositive(int[] nums)",
    },
    refs: {
      py: `def __ref(v):\n    s = set(v)\n    i = 1\n    while i in s: i += 1\n    return i`,
      cpp: `static int refCheck(std::vector<int>& v) { std::unordered_set<int> s(v.begin(), v.end()); int i = 1; while (s.count(i)) i++; return i; }`,
      c: `static int refCheck(int* v, int n) { static char present[100006]; memset(present, 0, sizeof(present)); for (int i = 0; i < n; i++) if (v[i] >= 1 && v[i] <= n) present[v[i]] = 1; for (int i = 1; i <= n; i++) if (!present[i]) return i; return n + 1; }`,
      java: `            HashSet<Integer> hs = new HashSet<>(); for (int x : val) hs.add(x); int r = 1; while (hs.contains(r)) r++;\n`,
    },
    tests: [{ input: "[1,2,0]", expected: "3" }, { input: "[3,4,-1,1]", expected: "2" }],
  },
];

/* ================= export in Prisma create shape ================= */
export const extraProblems = DEFS.map((d) => ({
  title: d.title,
  slug: d.slug,
  difficulty: d.difficulty as "EASY" | "MEDIUM" | "HARD",
  visibility: "PUBLIC" as const,
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  tags: d.tags,
  statement: d.statement,
  inputFormat: d.inputFormat,
  outputFormat: d.outputFormat,
  constraintsText: d.constraintsText,
  inputTemplate: JSON.stringify(templates(d)),
  driverScript: JSON.stringify({
    python3: pyDriver(d),
    cpp17: cppDriver(d),
    c11: cDriver(d),
    java17: javaDriver(d),
  }),
  testCases: {
    create: d.tests.map((t, i) => ({ input: t.input, expectedOutput: t.expected, isSample: true, orderNo: i + 1 })),
  },
}));
