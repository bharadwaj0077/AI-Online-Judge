import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch8() {
  console.log("Seeding Batch 8 (Problems 71 to 80)...");

  const batch8Problems = [
    {
      title: "Find Peak Element",
      slug: "find-peak-element",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "A peak element is an element that is strictly greater than its neighbors. Given a 0-indexed integer array `nums`, find a peak element, and return its index.",
      inputFormat: "nums = [1,2,3,1]",
      outputFormat: "2",
      constraintsText: "1 <= nums.length <= 1000\n-2^31 <= nums[i] <= 2^31 - 1",
      sampleInput: "nums = [1,2,3,1]",
      sampleOutput: "2",
      referenceSolution: `class Solution:
    def findPeakElement(self, nums: list[int]) -> int:
        l, r = 0, len(nums) - 1
        while l < r:
            mid = (l + r) // 2
            if nums[mid] > nums[mid + 1]:
                r = mid
            else:
                l = mid + 1
        return l`,
      templates: {
        python3: "class Solution:\n    def findPeakElement(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int findPeakElement(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int findPeakElement(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    findPeakElement(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Search a 2D Matrix",
      slug: "search-a-2d-matrix",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an `m x n` integer matrix `matrix` with two properties: Each row is sorted in non-decreasing order, and the first integer of each row is greater than the last integer of the previous row. Given an integer `target`, return `true` if `target` is in `matrix` or `false` otherwise.",
      inputFormat: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3",
      outputFormat: "true",
      constraintsText: "1 <= m, n <= 100\n-10^4 <= matrix[i][j], target <= 10^4",
      sampleInput: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]]\ntarget = 3",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        if not matrix or not matrix[0]:
            return False
        m, n = len(matrix), len(matrix[0])
        l, r = 0, m * n - 1
        while l <= r:
            mid = (l + r) // 2
            val = matrix[mid // n][mid % n]
            if val == target:
                return True
            elif val < target:
                l = mid + 1
            else:
                r = mid - 1
        return False`,
      templates: {
        python3: "class Solution:\n    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool searchMatrix(vector<vector<int>>& matrix, int target) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean searchMatrix(int[][] matrix, int target) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    searchMatrix(matrix, target) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Search a 2D Matrix II",
      slug: "search-a-2d-matrix-ii",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Write an efficient algorithm that searches for a value `target` in an `m x n` integer matrix `matrix`. Integers in each row are sorted in ascending from left to right, and integers in each column are sorted in ascending from top to bottom.",
      inputFormat: "matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]], target = 5",
      outputFormat: "true",
      constraintsText: "1 <= m, n <= 300\n-10^9 <= matrix[i][j], target <= 10^9",
      sampleInput: "matrix = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]\ntarget = 5",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:
        if not matrix or not matrix[0]:
            return False
        r, c = 0, len(matrix[0]) - 1
        while r < len(matrix) and c >= 0:
            if matrix[r][c] == target:
                return True
            elif matrix[r][c] > target:
                c -= 1
            else:
                r += 1
        return False`,
      templates: {
        python3: "class Solution:\n    def searchMatrix(self, matrix: list[list[int]], target: int) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool searchMatrix(vector<vector<int>>& matrix, int target) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean searchMatrix(int[][] matrix, int target) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    searchMatrix(matrix, target) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Task Scheduler",
      slug: "task-scheduler",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a characters array `tasks`, representing the tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could have done one task or be idle. Given an integer `n` cooldown period, return the least number of units of time that the CPU will take to finish all the given tasks.",
      inputFormat: "tasks = [\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"], n = 2",
      outputFormat: "8",
      constraintsText: "1 <= tasks.length <= 10^4\n0 <= n <= 100",
      sampleInput: "tasks = [\"A\",\"A\",\"A\",\"B\",\"B\",\"B\"]\nn = 2",
      sampleOutput: "8",
      referenceSolution: `from collections import Counter
class Solution:
    def leastInterval(self, tasks: list[str], n: int) -> int:
        counts = Counter(tasks)
        max_freq = max(counts.values())
        max_freq_count = list(counts.values()).count(max_freq)
        part_count = max_freq - 1
        part_length = n - (max_freq_count - 1)
        empty_slots = part_count * part_length
        available_tasks = len(tasks) - max_freq * max_freq_count
        idles = max(0, empty_slots - available_tasks)
        return len(tasks) + idles`,
      templates: {
        python3: "class Solution:\n    def leastInterval(self, tasks: list[str], n: int) -> int:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int leastInterval(vector<char>& tasks, int n) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int leastInterval(char[] tasks, int n) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    leastInterval(tasks, n) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Gas Station",
      slug: "gas-station",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "There are `n` gas stations along a circular route, where the amount of gas at the `i`-th station is `gas[i]`. You have a car with an unlimited gas tank and it costs `cost[i]` of gas to travel from the `i`-th station to its next `(i + 1)`-th station. Return the starting gas station's index if you can travel around the circuit once in the clockwise direction, otherwise return -1.",
      inputFormat: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]",
      outputFormat: "3",
      constraintsText: "n == gas.length == cost.length\n1 <= n <= 10^5\n0 <= gas[i], cost[i] <= 10^4",
      sampleInput: "gas = [1,2,3,4,5]\ncost = [3,4,5,1,2]",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:
        if sum(gas) < sum(cost):
            return -1
        total, start = 0, 0
        for i in range(len(gas)):
            total += (gas[i] - cost[i])
            if total < 0:
                total = 0
                start = i + 1
        return start`,
      templates: {
        python3: "class Solution:\n    def canCompleteCircuit(self, gas: list[int], cost: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {\n        return -1;\n    }\n};",
        java17: "class Solution {\n    public int canCompleteCircuit(int[] gas, int[] cost) {\n        return -1;\n    }\n}",
        javascript: "class Solution {\n    canCompleteCircuit(gas, cost) {\n        return -1;\n    }\n}"
      }
    },
    {
      title: "Palindrome Partitioning",
      slug: "palindrome-partitioning",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string `s`, partition `s` such that every substring of the partition is a palindrome. Return all possible palindrome partitioning of `s`.",
      inputFormat: "s = \"aab\"",
      outputFormat: "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]",
      constraintsText: "1 <= s.length <= 16\ns contains only lowercase English letters.",
      sampleInput: "s = \"aab\"",
      sampleOutput: "[[\"a\",\"a\",\"b\"],[\"aa\",\"b\"]]",
      referenceSolution: `class Solution:
    def partition(self, s: str) -> list[list[str]]:
        res = []
        part = []
        def dfs(i):
            if i >= len(s):
                res.append(part.copy())
                return
            for j in range(i, len(s)):
                sub = s[i:j+1]
                if sub == sub[::-1]:
                    part.append(sub)
                    dfs(j + 1)
                    part.pop()
        dfs(0)
        return res`,
      templates: {
        python3: "class Solution:\n    def partition(self, s: str) -> list[list[str]]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<string>> partition(string s) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<String>> partition(String s) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    partition(s) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Word Ladder",
      slug: "word-ladder",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "A transformation sequence from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence of words `beginWord -> s_1 -> s_2 -> ... -> s_k` such that every adjacent pair of words differs by a single letter. Return the number of words in the shortest transformation sequence from `beginWord` to `endWord`, or 0 if no such sequence exists.",
      inputFormat: "beginWord = \"hit\", endWord = \"cog\", wordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
      outputFormat: "5",
      constraintsText: "1 <= beginWord.length <= 10\n1 <= wordList.length <= 5000",
      sampleInput: "beginWord = \"hit\"\nendWord = \"cog\"\nwordList = [\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]",
      sampleOutput: "5",
      referenceSolution: `from collections import deque, defaultdict
class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:
        if endWord not in wordList:
            return 0
        neighbors = defaultdict(list)
        wordList.append(beginWord)
        for word in wordList:
            for j in range(len(word)):
                pattern = word[:j] + "*" + word[j+1:]
                neighbors[pattern].append(word)
        visit = set([beginWord])
        q = deque([beginWord])
        res = 1
        while q:
            for _ in range(len(q)):
                word = q.popleft()
                if word == endWord:
                    return res
                for j in range(len(word)):
                    pattern = word[:j] + "*" + word[j+1:]
                    for nei in neighbors[pattern]:
                        if nei not in visit:
                            visit.add(nei)
                            q.append(nei)
            res += 1
        return 0`,
      templates: {
        python3: "class Solution:\n    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int ladderLength(string beginWord, string endWord, vector<string>& wordList) {\n        return 0;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int ladderLength(String beginWord, String endWord, List<String> wordList) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    ladderLength(beginWord, endWord, wordList) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Longest Valid Parentheses",
      slug: "longest-valid-parentheses",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string containing just the characters '(' and ')', return the length of the longest valid (well-formed) parentheses substring.",
      inputFormat: "s = \"(()\"",
      outputFormat: "2",
      constraintsText: "0 <= s.length <= 3 * 10^4",
      sampleInput: "s = \"(()\"",
      sampleOutput: "2",
      referenceSolution: `class Solution:
    def longestValidParentheses(self, s: str) -> int:
        stack = [-1]
        max_len = 0
        for i, char in enumerate(s):
            if char == '(':
                stack.append(i)
            else:
                stack.pop()
                if not stack:
                    stack.append(i)
                else:
                    max_len = max(max_len, i - stack[-1])
        return max_len`,
      templates: {
        python3: "class Solution:\n    def longestValidParentheses(self, s: str) -> int:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int longestValidParentheses(string s) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int longestValidParentheses(String s) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    longestValidParentheses(s) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "First Missing Positive",
      slug: "first-missing-positive",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an unsorted integer array `nums`, return the smallest missing positive integer. You must implement an algorithm that runs in `O(n)` time and uses `O(1)` auxiliary space.",
      inputFormat: "nums = [1,2,0]",
      outputFormat: "3",
      constraintsText: "1 <= nums.length <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1",
      sampleInput: "nums = [1,2,0]",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def firstMissingPositive(self, nums: list[int]) -> int:
        n = len(nums)
        for i in range(n):
            while 1 <= nums[i] <= n and nums[nums[i] - 1] != nums[i]:
                correct_idx = nums[i] - 1
                nums[i], nums[correct_idx] = nums[correct_idx], nums[i]
        for i in range(n):
            if nums[i] != i + 1:
                return i + 1
        return n + 1`,
      templates: {
        python3: "class Solution:\n    def firstMissingPositive(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int firstMissingPositive(vector<int>& nums) {\n        return 1;\n    }\n};",
        java17: "class Solution {\n    public int firstMissingPositive(int[] nums) {\n        return 1;\n    }\n}",
        javascript: "class Solution {\n    firstMissingPositive(nums) {\n        return 1;\n    }\n}"
      }
    },
    {
      title: "Median of Two Sorted Arrays",
      slug: "median-of-two-sorted-arrays",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the median of the two sorted arrays. The overall run time complexity should be `O(log (m+n))`.",
      inputFormat: "nums1 = [1,3], nums2 = [2]",
      outputFormat: "2.0",
      constraintsText: "nums1.length == m\nnums2.length == n\n0 <= m, n <= 1000",
      sampleInput: "nums1 = [1,3]\nnums2 = [2]",
      sampleOutput: "2.0",
      referenceSolution: `class Solution:
    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:
        merged = sorted(nums1 + nums2)
        n = len(merged)
        if n % 2 == 1:
            return float(merged[n // 2])
        else:
            return (merged[n // 2 - 1] + merged[n // 2]) / 2.0`,
      templates: {
        python3: "class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        return 0.0;\n    }\n};",
        java17: "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        return 0.0;\n    }\n}",
        javascript: "class Solution {\n    findMedianSortedArrays(nums1, nums2) {\n        return 0.0;\n    }\n}"
      }
    }
  ];

  for (const prob of batch8Problems) {
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
      console.log(`[Batch 8] Added: ${prob.title}`);
    }
  }

  console.log("Batch 8 seeding finished!");
}

seedBatch8()
  .catch((e) => {
    console.error("Batch 8 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });