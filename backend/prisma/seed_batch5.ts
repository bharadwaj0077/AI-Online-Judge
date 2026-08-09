import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch5() {
  console.log("Seeding Batch 5 (Problems 41 to 50)...");

  const batch5Problems = [
    {
      title: "Move Zeroes",
      slug: "move-zeroes",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, move all 0's to the end of it while maintaining the relative order of the non-zero elements in-place.",
      inputFormat: "nums = [0,1,0,3,12]",
      outputFormat: "[1,3,12,0,0]",
      constraintsText: "1 <= nums.length <= 10^4\n-2^31 <= nums[i] <= 2^31 - 1",
      sampleInput: "nums = [0,1,0,3,12]",
      sampleOutput: "[1,3,12,0,0]",
      referenceSolution: `class Solution:
    def moveZeroes(self, nums: list[int]) -> list[int]:
        l = 0
        for r in range(len(nums)):
            if nums[r] != 0:
                nums[l], nums[r] = nums[r], nums[l]
                l += 1
        return nums`,
      templates: {
        python3: "class Solution:\n    def moveZeroes(self, nums: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> moveZeroes(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "class Solution {\n    public int[] moveZeroes(int[] nums) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    moveZeroes(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Missing Number",
      slug: "missing-number",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array.",
      inputFormat: "nums = [3,0,1]",
      outputFormat: "2",
      constraintsText: "n == nums.length\n1 <= n <= 10^4\n0 <= nums[i] <= n",
      sampleInput: "nums = [3,0,1]",
      sampleOutput: "2",
      referenceSolution: `class Solution:
    def missingNumber(self, nums: list[int]) -> int:
        n = len(nums)
        return (n * (n + 1)) // 2 - sum(nums)`,
      templates: {
        python3: "class Solution:\n    def missingNumber(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int missingNumber(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int missingNumber(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    missingNumber(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Find All Anagrams in a String",
      slug: "find-all-anagrams-in-a-string",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two strings `s` and `p`, return an array of all the start indices of `p`'s anagrams in `s`.",
      inputFormat: "s = \"cbaebabacd\", p = \"abc\"",
      outputFormat: "[0,6]",
      constraintsText: "1 <= s.length, p.length <= 3 * 10^4",
      sampleInput: "s = \"cbaebabacd\"\np = \"abc\"",
      sampleOutput: "[0,6]",
      referenceSolution: `from collections import Counter
class Solution:
    def findAnagrams(self, s: str, p: str) -> list[int]:
        p_count = Counter(p)
        s_count = Counter(s[:len(p)-1])
        res = []
        for i in range(len(p)-1, len(s)):
            s_count[s[i]] += 1
            if s_count == p_count:
                res.append(i - len(p) + 1)
            s_count[s[i - len(p) + 1]] -= 1
            if s_count[s[i - len(p) + 1]] == 0:
                del s_count[s[i - len(p) + 1]]
        return res`,
      templates: {
        python3: "class Solution:\n    def findAnagrams(self, s: str, p: str) -> list[int]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> findAnagrams(string s, string p) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<Integer> findAnagrams(String s, String p) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    findAnagrams(s, p) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Daily Temperatures",
      slug: "daily-temperatures",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i`-th day to get a warmer temperature.",
      inputFormat: "temperatures = [73,74,75,71,69,72,76,73]",
      outputFormat: "[1,1,4,2,1,1,0,0]",
      constraintsText: "1 <= temperatures.length <= 10^5\n30 <= temperatures[i] <= 100",
      sampleInput: "temperatures = [73,74,75,71,69,72,76,73]",
      sampleOutput: "[1,1,4,2,1,1,0,0]",
      referenceSolution: `class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        res = [0] * len(temperatures)
        stack = []
        for i, t in enumerate(temperatures):
            while stack and t > temperatures[stack[-1]]:
                prev_i = stack.pop()
                res[prev_i] = i - prev_i
            stack.append(i)
        return res`,
      templates: {
        python3: "class Solution:\n    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\n#include <stack>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    dailyTemperatures(temperatures) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Top K Frequent Elements",
      slug: "top-k-frequent-elements",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums` and an integer `k`, return the `k` most frequent elements.",
      inputFormat: "nums = [1,1,1,2,2,3], k = 2",
      outputFormat: "[1,2]",
      constraintsText: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
      sampleInput: "nums = [1,1,1,2,2,3]\nk = 2",
      sampleOutput: "[1,2]",
      referenceSolution: `from collections import Counter
class Solution:
    def topKFrequent(self, nums: list[int], k: int) -> list[int]:
        count = Counter(nums)
        return [item[0] for item in count.most_common(k)]`,
      templates: {
        python3: "class Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    topKFrequent(nums, k) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Longest Consecutive Sequence",
      slug: "longest-consecutive-sequence",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an unsorted array of integers `nums`, return the length of the longest consecutive elements sequence.",
      inputFormat: "nums = [100,4,200,1,3,2]",
      outputFormat: "4",
      constraintsText: "0 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
      sampleInput: "nums = [100,4,200,1,3,2]",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def longestConsecutive(self, nums: list[int]) -> int:
        num_set = set(nums)
        longest = 0
        for n in num_set:
            if (n - 1) not in num_set:
                length = 1
                while (n + length) in num_set:
                    length += 1
                longest = max(longest, length)
        return longest`,
      templates: {
        python3: "class Solution:\n    def longestConsecutive(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\n#include <unordered_set>\nusing namespace std;\nclass Solution {\npublic:\n    int longestConsecutive(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int longestConsecutive(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    longestConsecutive(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Sort Colors",
      slug: "sort-colors",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array `nums` with `n` objects colored red, white, or blue, sort them in-place so that objects of the same color are adjacent, with the colors in the order red, white, and blue (represented as 0, 1, and 2).",
      inputFormat: "nums = [2,0,2,1,1,0]",
      outputFormat: "[0,0,1,1,2,2]",
      constraintsText: "n == nums.length\n1 <= n <= 300\nnums[i] is 0, 1, or 2.",
      sampleInput: "nums = [2,0,2,1,1,0]",
      sampleOutput: "[0,0,1,1,2,2]",
      referenceSolution: `class Solution:
    def sortColors(self, nums: list[int]) -> list[int]:
        l, m, h = 0, 0, len(nums) - 1
        while m <= h:
            if nums[m] == 0:
                nums[l], nums[m] = nums[m], nums[l]
                l += 1
                m += 1
            elif nums[m] == 1:
                m += 1
            else:
                nums[m], nums[h] = nums[h], nums[m]
                h -= 1
        return nums`,
      templates: {
        python3: "class Solution:\n    def sortColors(self, nums: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> sortColors(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "class Solution {\n    public int[] sortColors(int[] nums) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    sortColors(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Subsets",
      slug: "subsets",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums` of unique elements, return all possible subsets (the power set).",
      inputFormat: "nums = [1,2,3]",
      outputFormat: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
      constraintsText: "1 <= nums.length <= 10\n-10 <= nums[i] <= 10",
      sampleInput: "nums = [1,2,3]",
      sampleOutput: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]",
      referenceSolution: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        res = []
        subset = []
        def dfs(i):
            if i >= len(nums):
                res.append(subset.copy())
                return
            subset.append(nums[i])
            dfs(i + 1)
            subset.pop()
            dfs(i + 1)
        dfs(0)
        return res`,
      templates: {
        python3: "class Solution:\n    def subsets(self, nums: list[int]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    subsets(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Combination Sum",
      slug: "combination-sum",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of distinct integers `candidates` and a `target` integer, return a list of all unique combinations of `candidates` where the chosen numbers sum to `target`.",
      inputFormat: "candidates = [2,3,6,7], target = 7",
      outputFormat: "[[2,2,3],[7]]",
      constraintsText: "1 <= candidates.length <= 30\n2 <= candidates[i] <= 40\n1 <= target <= 40",
      sampleInput: "candidates = [2,3,6,7]\ntarget = 7",
      sampleOutput: "[[2,2,3],[7]]",
      referenceSolution: `class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        res = []
        def dfs(i, cur, total):
            if total == target:
                res.append(cur.copy())
                return
            if i >= len(candidates) or total > target:
                return
            cur.append(candidates[i])
            dfs(i, cur, total + candidates[i])
            cur.pop()
            dfs(i + 1, cur, total)
        dfs(0, [], 0)
        return res`,
      templates: {
        python3: "class Solution:\n    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> combinationSum(int[] candidates, int target) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    combinationSum(candidates, target) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Sliding Window Maximum",
      slug: "sliding-window-maximum",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an array of integers `nums`, there is a sliding window of size `k` which is moving from the very left of the array to the very right. Return the max sliding window.",
      inputFormat: "nums = [1,3,-1,-3,5,3,6,7], k = 3",
      outputFormat: "[3,3,5,5,6,7]",
      constraintsText: "1 <= nums.length <= 10^5\n1 <= k <= nums.length",
      sampleInput: "nums = [1,3,-1,-3,5,3,6,7]\nk = 3",
      sampleOutput: "[3,3,5,5,6,7]",
      referenceSolution: `from collections import deque
class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:
        output = []
        q = deque()
        for i, n in enumerate(nums):
            while q and nums[q[-1]] < n:
                q.pop()
            q.append(i)
            if q[0] == i - k:
                q.popleft()
            if i >= k - 1:
                output.append(nums[q[0]])
        return output`,
      templates: {
        python3: "class Solution:\n    def maxSlidingWindow(self, nums: list[int], k: int) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> maxSlidingWindow(vector<int>& nums, int k) {\n        return {};\n    }\n};",
        java17: "class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    maxSlidingWindow(nums, k) {\n        return [];\n    }\n}"
      }
    }
  ];

  for (const prob of batch5Problems) {
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
      console.log(`[Batch 5] Added: ${prob.title}`);
    }
  }

  console.log("Batch 5 seeding finished!");
}

seedBatch5()
  .catch((e) => {
    console.error("Batch 5 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });