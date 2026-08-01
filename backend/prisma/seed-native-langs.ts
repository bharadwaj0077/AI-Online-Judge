// C (c11) and Java (java17) starter templates + judge driver scripts for every seeded problem.
// Java drivers use a non-public `class Main` so the same file works under both
// `javac Main.java && java Main` (Docker) and Wandbox's prog.java fallback.

export const nativeTemplates: Record<string, { c11: string; java17: string }> = {
  "two-sum": {
    c11: "#include <stdio.h>\n#include <stdlib.h>\n\n/* Return a malloc'd array of exactly 2 indices */\nint* twoSum(int* nums, int numsSize, int target) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "sum-of-n-numbers": {
    c11: "#include <stdio.h>\n\nint sumOfNNumbers(int n) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public int sumOfNNumbers(int n) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "valid-palindrome": {
    c11: "#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n#include <ctype.h>\n\nbool isPalindrome(char* s) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public boolean isPalindrome(String s) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "reverse-string": {
    c11: "#include <stdio.h>\n#include <string.h>\n\n/* Reverse in place and return s */\nchar* reverseString(char* s) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public String reverseString(String s) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "fibonacci-number": {
    c11: "#include <stdio.h>\n\nlong long fib(int n) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public long fib(int n) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "valid-parentheses": {
    c11: "#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\nbool isValid(char* s) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public boolean isValid(String s) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "binary-search": {
    c11: "#include <stdio.h>\n\nint search(int* nums, int numsSize, int target) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public int search(int[] nums, int target) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "maximum-subarray": {
    c11: "#include <stdio.h>\n\nint maxSubArray(int* nums, int numsSize) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
  "longest-substring-without-repeating-characters": {
    c11: "#include <stdio.h>\n#include <string.h>\n\nint lengthOfLongestSubstring(char* s) {\n    // Write your optimal solution here\n    \n}",
    java17: "import java.util.*;\n\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your optimal solution here\n        \n    }\n}",
  },
};

// ---- shared Java driver scaffolding -------------------------------------
// raw input arrives inside a text block so embedded quotes are harmless.
const javaHead = `import java.util.*;\nimport java.io.*;\n\n{{USER_CODE}}\n\nclass Main {\n    static int[] parseIntArray(String raw) {\n        int lb = raw.indexOf('['), rb = raw.indexOf(']');\n        String inner = raw.substring(lb + 1, rb).trim();\n        if (inner.isEmpty()) return new int[0];\n        String[] parts = inner.split(",");\n        int[] out = new int[parts.length];\n        for (int i = 0; i < parts.length; i++) out[i] = Integer.parseInt(parts[i].trim());\n        return out;\n    }\n    static int parseTrailingInt(String raw) {\n        int rb = raw.indexOf(']');\n        return Integer.parseInt(raw.substring(raw.indexOf(',', rb) + 1).trim());\n    }\n    public static void main(String[] args) {\n        String raw = """\n{{INPUT}}\n""";\n        raw = raw.trim();\n        try {\n`;

const javaTail = `            System.out.println("\\n===STD_OUT_START===\\n" + captured + "===STD_OUT_END===");\n            System.out.println("===RESULT_START===\\n" + resStr + "\\n===RESULT_END===");\n            System.out.println("===EXPECTED_START===\\n" + expStr + "\\n===EXPECTED_END===");\n        } catch (Exception e) {\n            System.out.println("===ERROR_START===\\n" + e + "\\n===ERROR_END===");\n        }\n    }\n}`;

const javaCapture = (call: string) => `            PrintStream oldOut = System.out;\n            ByteArrayOutputStream buf = new ByteArrayOutputStream();\n            System.setOut(new PrintStream(buf));\n            ${call}\n            System.setOut(oldOut);\n            String captured = buf.toString();\n`;

export const nativeDrivers: Record<string, { c11: string; java17: string }> = {
  "two-sum": {
    c11: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char raw[] = "{{INPUT}}";\n    int nums[10005]; int n = 0; long target = 0;\n    char *p = strchr(raw, '[') + 1;\n    while (*p && *p != ']') {\n        if (*p == ',' || *p == ' ') { p++; continue; }\n        nums[n++] = (int)strtol(p, &p, 10);\n    }\n    char *c2 = strchr(p, ',');\n    if (c2) target = strtol(c2 + 1, NULL, 10);\n    int* u = twoSum(nums, n, (int)target);\n    int safe = u && u[0] != u[1] && u[0] >= 0 && u[0] < n && u[1] >= 0 && u[1] < n && (long)nums[u[0]] + nums[u[1]] == target;\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    if (u) printf("===RESULT_START===\\n[%d,%d]\\n===RESULT_END===\\n", u[0], u[1]);\n    else printf("===RESULT_START===\\nnull\\n===RESULT_END===\\n");\n    printf("===EXPECTED_START===\\n[%d,%d]\\n===EXPECTED_END===\\n", safe ? u[0] : 0, safe ? u[1] : 1);\n    return 0;\n}`,
    java17: javaHead
      + `            int[] nums = parseIntArray(raw);\n            int target = parseTrailingInt(raw);\n`
      + javaCapture("int[] u = new Solution().twoSum(nums, target);")
      + `            boolean safe = u != null && u.length == 2 && u[0] != u[1] && (long)nums[u[0]] + nums[u[1]] == target;\n            String resStr = (u != null && u.length == 2) ? "[" + u[0] + "," + u[1] + "]" : "null";\n            String expStr = safe ? resStr : "[0,1]";\n`
      + javaTail,
  },
  "sum-of-n-numbers": {
    c11: `#include <stdio.h>\n\n{{USER_CODE}}\n\nint main() {\n    int val = {{INPUT}};\n    int u = sumOfNNumbers(val);\n    long long r = (long long)val * (val + 1) / 2;\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%d\\n===RESULT_END===\\n", u);\n    printf("===EXPECTED_START===\\n%lld\\n===EXPECTED_END===\\n", r);\n    return 0;\n}`,
    java17: javaHead
      + `            int val = Integer.parseInt(raw);\n`
      + javaCapture("int u = new Solution().sumOfNNumbers(val);")
      + `            long r = (long)val * (val + 1) / 2;\n            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(r);\n`
      + javaTail,
  },
  "valid-palindrome": {
    c11: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n#include <ctype.h>\n\n{{USER_CODE}}\n\nstatic bool refCheck(const char* s) {\n    char c[200005]; int m = 0;\n    for (int i = 0; s[i]; i++) if (isalnum((unsigned char)s[i])) c[m++] = (char)tolower((unsigned char)s[i]);\n    for (int i = 0; i < m / 2; i++) if (c[i] != c[m - 1 - i]) return false;\n    return true;\n}\n\nint main() {\n    char raw[] = {{INPUT}};\n    bool r = refCheck(raw);\n    bool u = isPalindrome(raw);\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%s\\n===RESULT_END===\\n", u ? "true" : "false");\n    printf("===EXPECTED_START===\\n%s\\n===EXPECTED_END===\\n", r ? "true" : "false");\n    return 0;\n}`,
    java17: javaHead
      + `            String s = raw.replace("\\"", "");\n            StringBuilder sb = new StringBuilder();\n            for (char ch : s.toCharArray()) if (Character.isLetterOrDigit(ch)) sb.append(Character.toLowerCase(ch));\n            boolean r = sb.toString().equals(sb.reverse().toString());\n`
      + javaCapture("boolean u = new Solution().isPalindrome(s);")
      + `            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(r);\n`
      + javaTail,
  },
  "reverse-string": {
    c11: `#include <stdio.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char raw[] = {{INPUT}};\n    int len = (int)strlen(raw);\n    char expected[100005];\n    for (int i = 0; i < len; i++) expected[i] = raw[len - 1 - i];\n    expected[len] = 0;\n    char* u = reverseString(raw);\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%s\\n===RESULT_END===\\n", u ? u : "null");\n    printf("===EXPECTED_START===\\n%s\\n===EXPECTED_END===\\n", expected);\n    return 0;\n}`,
    java17: javaHead
      + `            String s = raw.replace("\\"", "");\n            String r = new StringBuilder(s).reverse().toString();\n`
      + javaCapture("String u = new Solution().reverseString(s);")
      + `            String resStr = u;\n            String expStr = r;\n`
      + javaTail,
  },
  "fibonacci-number": {
    c11: `#include <stdio.h>\n\n{{USER_CODE}}\n\nint main() {\n    int val = {{INPUT}};\n    long long u = fib(val);\n    long long a = 0, b = 1;\n    for (int i = 0; i < val; i++) { long long t = a + b; a = b; b = t; }\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%lld\\n===RESULT_END===\\n", u);\n    printf("===EXPECTED_START===\\n%lld\\n===EXPECTED_END===\\n", a);\n    return 0;\n}`,
    java17: javaHead
      + `            int val = Integer.parseInt(raw);\n            long a = 0, b = 1;\n            for (int i = 0; i < val; i++) { long t = a + b; a = b; b = t; }\n`
      + javaCapture("long u = new Solution().fib(val);")
      + `            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(a);\n`
      + javaTail,
  },
  "valid-parentheses": {
    c11: `#include <stdio.h>\n#include <stdbool.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nstatic bool refCheck(const char* s) {\n    char st[10005]; int top = 0;\n    for (int i = 0; s[i]; i++) {\n        char c = s[i];\n        if (c == '(' || c == '[' || c == '{') st[top++] = c;\n        else if (c == ')' || c == ']' || c == '}') {\n            char need = (c == ')') ? '(' : (c == ']') ? '[' : '{';\n            if (top == 0 || st[--top] != need) return false;\n        }\n    }\n    return top == 0;\n}\n\nint main() {\n    char raw[] = {{INPUT}};\n    bool r = refCheck(raw);\n    bool u = isValid(raw);\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%s\\n===RESULT_END===\\n", u ? "true" : "false");\n    printf("===EXPECTED_START===\\n%s\\n===EXPECTED_END===\\n", r ? "true" : "false");\n    return 0;\n}`,
    java17: javaHead
      + `            String s = raw.replace("\\"", "");\n            Deque<Character> st = new ArrayDeque<>();\n            boolean r = true;\n            for (char ch : s.toCharArray()) {\n                if (ch == '(' || ch == '[' || ch == '{') st.push(ch);\n                else if (ch == ')' || ch == ']' || ch == '}') {\n                    char need = (ch == ')') ? '(' : (ch == ']') ? '[' : '{';\n                    if (st.isEmpty() || st.pop() != need) { r = false; break; }\n                }\n            }\n            if (!st.isEmpty()) r = false;\n`
      + javaCapture("boolean u = new Solution().isValid(s);")
      + `            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(r);\n`
      + javaTail,
  },
  "binary-search": {
    c11: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char raw[] = "{{INPUT}}";\n    int nums[10005]; int n = 0; long target = 0;\n    char *p = strchr(raw, '[') + 1;\n    while (*p && *p != ']') {\n        if (*p == ',' || *p == ' ') { p++; continue; }\n        nums[n++] = (int)strtol(p, &p, 10);\n    }\n    char *c2 = strchr(p, ',');\n    if (c2) target = strtol(c2 + 1, NULL, 10);\n    int r = -1;\n    for (int i = 0; i < n; i++) if (nums[i] == (int)target) { r = i; break; }\n    int u = search(nums, n, (int)target);\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%d\\n===RESULT_END===\\n", u);\n    printf("===EXPECTED_START===\\n%d\\n===EXPECTED_END===\\n", r);\n    return 0;\n}`,
    java17: javaHead
      + `            int[] nums = parseIntArray(raw);\n            int target = parseTrailingInt(raw);\n            int r = -1;\n            for (int i = 0; i < nums.length; i++) if (nums[i] == target) { r = i; break; }\n`
      + javaCapture("int u = new Solution().search(nums, target);")
      + `            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(r);\n`
      + javaTail,
  },
  "maximum-subarray": {
    c11: `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nint main() {\n    char raw[] = "{{INPUT}}";\n    int nums[100005]; int n = 0;\n    char *p = strchr(raw, '[') + 1;\n    while (*p && *p != ']') {\n        if (*p == ',' || *p == ' ') { p++; continue; }\n        nums[n++] = (int)strtol(p, &p, 10);\n    }\n    int best = nums[0], cur = nums[0];\n    for (int i = 1; i < n; i++) {\n        cur = (nums[i] > cur + nums[i]) ? nums[i] : cur + nums[i];\n        if (cur > best) best = cur;\n    }\n    int u = maxSubArray(nums, n);\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%d\\n===RESULT_END===\\n", u);\n    printf("===EXPECTED_START===\\n%d\\n===EXPECTED_END===\\n", best);\n    return 0;\n}`,
    java17: javaHead
      + `            int[] nums = parseIntArray(raw);\n            int best = nums[0], cur = nums[0];\n            for (int i = 1; i < nums.length; i++) {\n                cur = Math.max(nums[i], cur + nums[i]);\n                best = Math.max(best, cur);\n            }\n`
      + javaCapture("int u = new Solution().maxSubArray(nums);")
      + `            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(best);\n`
      + javaTail,
  },
  "longest-substring-without-repeating-characters": {
    c11: `#include <stdio.h>\n#include <string.h>\n\n{{USER_CODE}}\n\nstatic int refCheck(const char* s) {\n    int last[256]; for (int i = 0; i < 256; i++) last[i] = -1;\n    int left = 0, best = 0;\n    for (int i = 0; s[i]; i++) {\n        unsigned char ch = (unsigned char)s[i];\n        if (last[ch] >= left) left = last[ch] + 1;\n        last[ch] = i;\n        if (i - left + 1 > best) best = i - left + 1;\n    }\n    return best;\n}\n\nint main() {\n    char raw[] = {{INPUT}};\n    int r = refCheck(raw);\n    int u = lengthOfLongestSubstring(raw);\n    printf("\\n===STD_OUT_START===\\n===STD_OUT_END===\\n");\n    printf("===RESULT_START===\\n%d\\n===RESULT_END===\\n", u);\n    printf("===EXPECTED_START===\\n%d\\n===EXPECTED_END===\\n", r);\n    return 0;\n}`,
    java17: javaHead
      + `            String s = raw.replace("\\"", "");\n            int[] last = new int[256];\n            Arrays.fill(last, -1);\n            int left = 0, r = 0;\n            for (int i = 0; i < s.length(); i++) {\n                char ch = s.charAt(i);\n                if (last[ch] >= left) left = last[ch] + 1;\n                last[ch] = i;\n                r = Math.max(r, i - left + 1);\n            }\n`
      + javaCapture("int u = new Solution().lengthOfLongestSubstring(s);")
      + `            String resStr = String.valueOf(u);\n            String expStr = String.valueOf(r);\n`
      + javaTail,
  },
};
