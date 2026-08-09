import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch3() {
  console.log("Seeding Batch 3 (Problems 21 to 30)...");

  const batch3Problems = [
    {
      title: "Valid Anagram",
      slug: "valid-anagram",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
      inputFormat: "s = \"anagram\", t = \"nagaram\"",
      outputFormat: "true",
      constraintsText: "1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.",
      sampleInput: "s = \"anagram\"\nt = \"nagaram\"",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return sorted(s) == sorted(t)`,
      templates: {
        python3: "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        pass",
        cpp17: "#include <string>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        return false;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public boolean isAnagram(String s, String t) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isAnagram(s, t) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Binary Search",
      slug: "binary-search",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return -1.",
      inputFormat: "nums = [-1,0,3,5,9,12], target = 9",
      outputFormat: "4",
      constraintsText: "1 <= nums.length <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.",
      sampleInput: "nums = [-1,0,3,5,9,12]\ntarget = 9",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                l = mid + 1
            else:
                r = mid - 1
        return -1`,
      templates: {
        python3: "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        return -1;\n    }\n};",
        java17: "class Solution {\n    public int search(int[] nums, int target) {\n        return -1;\n    }\n}",
        javascript: "class Solution {\n    search(nums, target) {\n        return -1;\n    }\n}"
      }
    },
    {
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeating-characters",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string `s`, find the length of the longest substring without repeating characters.",
      inputFormat: "s = \"abcabcbb\"",
      outputFormat: "3",
      constraintsText: "0 <= s.length <= 5 * 10^4",
      sampleInput: "s = \"abcabcbb\"",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        char_map = {}
        left = 0
        max_len = 0
        for right, char in enumerate(s):
            if char in char_map and char_map[char] >= left:
                left = char_map[char] + 1
            char_map[char] = right
            max_len = max(max_len, right - left + 1)
        return max_len`,
      templates: {
        python3: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass",
        cpp17: "#include <string>\n#include <unordered_map>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 0;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    lengthOfLongestSubstring(s) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Longest Palindromic Substring",
      slug: "longest-palindromic-substring",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string `s`, return the longest palindromic substring in `s`.",
      inputFormat: "s = \"babad\"",
      outputFormat: "\"bab\"",
      constraintsText: "1 <= s.length <= 1000",
      sampleInput: "s = \"babad\"",
      sampleOutput: "\"bab\"",
      referenceSolution: `class Solution:
    def longestPalindrome(self, s: str) -> str:
        res = ""
        for i in range(len(s)):
            p1 = self.expand(s, i, i)
            p2 = self.expand(s, i, i + 1)
            res = max(res, p1, p2, key=len)
        return res

    def expand(self, s: str, l: int, r: int) -> str:
        while l >= 0 and r < len(s) and s[l] == s[r]:
            l -= 1
            r += 1
        return s[l + 1:r]`,
      templates: {
        python3: "class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    string longestPalindrome(string s) {\n        return \"\";\n    }\n};",
        java17: "class Solution {\n    public String longestPalindrome(String s) {\n        return \"\";\n    }\n}",
        javascript: "class Solution {\n    longestPalindrome(s) {\n        return \"\";\n    }\n}"
      }
    },
    {
      title: "Subarray Sum Equals K",
      slug: "subarray-sum-equals-k",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals to `k`.",
      inputFormat: "nums = [1,1,1], k = 2",
      outputFormat: "2",
      constraintsText: "1 <= nums.length <= 2 * 10^4\n-1000 <= nums[i] <= 1000",
      sampleInput: "nums = [1,1,1]\nk = 2",
      sampleOutput: "2",
      referenceSolution: `class Solution:
    def subarraySum(self, nums: list[int], k: int) -> int:
        count = 0
        curr_sum = 0
        prefix = {0: 1}
        for n in nums:
            curr_sum += n
            count += prefix.get(curr_sum - k, 0)
            prefix[curr_sum] = prefix.get(curr_sum, 0) + 1
        return count`,
      templates: {
        python3: "class Solution:\n    def subarraySum(self, nums: list[int], k: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int subarraySum(vector<int>& nums, int k) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int subarraySum(int[] nums, int k) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    subarraySum(nums, k) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Valid Palindrome",
      slug: "valid-palindrome",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
      inputFormat: "s = \"A man, a plan, a canal: Panama\"",
      outputFormat: "true",
      constraintsText: "1 <= s.length <= 2 * 10^5",
      sampleInput: "s = \"A man, a plan, a canal: Panama\"",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isPalindrome(self, s: str) -> bool:
        clean = [c.lower() for c in s if c.isalnum()]
        return clean == clean[::-1]`,
      templates: {
        python3: "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool isPalindrome(string s) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isPalindrome(s) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Jump Game",
      slug: "jump-game",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an integer array `nums`. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return `true` if you can reach the last index, or `false` otherwise.",
      inputFormat: "nums = [2,3,1,1,4]",
      outputFormat: "true",
      constraintsText: "1 <= nums.length <= 10^4\n0 <= nums[i] <= 10^5",
      sampleInput: "nums = [2,3,1,1,4]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def canJump(self, nums: list[int]) -> bool:
        max_reach = 0
        for i, n in enumerate(nums):
            if i > max_reach:
                return False
            max_reach = max(max_reach, i + n)
        return True`,
      templates: {
        python3: "class Solution:\n    def canJump(self, nums: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean canJump(int[] nums) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    canJump(nums) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Merge Intervals",
      slug: "merge-intervals",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
      inputFormat: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
      outputFormat: "[[" + "1,6],[8,10],[15,18]]",
      constraintsText: "1 <= intervals.length <= 10^4\nintervals[i].length == 2",
      sampleInput: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
      sampleOutput: "[[1,6],[8,10],[15,18]]",
      referenceSolution: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        intervals.sort(key=lambda x: x[0])
        merged = []
        for interval in intervals:
            if not merged or merged[-1][1] < interval[0]:
                merged.append(interval)
            else:
                merged[-1][1] = max(merged[-1][1], interval[1])
        return merged`,
      templates: {
        python3: "class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[][] merge(int[][] intervals) {\n        return new int[][]{};\n    }\n}",
        javascript: "class Solution {\n    merge(intervals) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Find Minimum in Rotated Sorted Array",
      slug: "find-minimum-in-rotated-sorted-array",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the sorted rotated array `nums` of unique elements, return the minimum element of this array in `O(log n)` time.",
      inputFormat: "nums = [3,4,5,1,2]",
      outputFormat: "1",
      constraintsText: "1 <= nums.length <= 5000\n-5000 <= nums[i] <= 5000",
      sampleInput: "nums = [3,4,5,1,2]",
      sampleOutput: "1",
      referenceSolution: `class Solution:
    def findMin(self, nums: list[int]) -> int:
        l, r = 0, len(nums) - 1
        while l < r:
            mid = (l + r) // 2
            if nums[mid] > nums[r]:
                l = mid + 1
            else:
                r = mid
        return nums[l]`,
      templates: {
        python3: "class Solution:\n    def findMin(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int findMin(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    findMin(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Edit Distance",
      slug: "edit-distance",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2` (insert, delete, or replace a character).",
      inputFormat: "word1 = \"horse\", word2 = \"ros\"",
      outputFormat: "3",
      constraintsText: "0 <= word1.length, word2.length <= 500",
      sampleInput: "word1 = \"horse\"\nword2 = \"ros\"",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        m, n = len(word1), len(word2)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(m + 1):
            dp[i][0] = i
        for j in range(n + 1):
            dp[0][j] = j
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if word1[i - 1] == word2[j - 1]:
                    dp[i][j] = dp[i - 1][j - 1]
                else:
                    dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        return dp[m][n]`,
      templates: {
        python3: "class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int minDistance(String word1, String word2) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    minDistance(word1, word2) {\n        return 0;\n    }\n}"
      }
    }
  ];

  for (const prob of batch3Problems) {
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
      console.log(`[Batch 3] Added: ${prob.title}`);
    }
  }

  console.log("Batch 3 seeding finished!");
}

seedBatch3()
  .catch((e) => {
    console.error("Batch 3 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });