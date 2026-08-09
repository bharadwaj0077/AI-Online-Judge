import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch2() {
  console.log("Seeding Batch 2 (Problems 11 to 20)...");

  const batch2Problems = [
    {
      title: "Climbing Stairs",
      slug: "climbing-stairs",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are climbing a staircase. It takes `n` steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
      inputFormat: "n = 3",
      outputFormat: "3",
      constraintsText: "1 <= n <= 45",
      sampleInput: "n = 3",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b`,
      templates: {
        python3: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass",
        cpp17: "class Solution {\npublic:\n    int climbStairs(int n) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int climbStairs(int n) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    climbStairs(n) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Reverse Linked List",
      slug: "reverse-linked-list",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the array representation of a linked list `head`, reverse the list and return the reversed list.",
      inputFormat: "head = [1,2,3,4,5]",
      outputFormat: "[5,4,3,2,1]",
      constraintsText: "0 <= head.length <= 5000\n-5000 <= head[i] <= 5000",
      sampleInput: "head = [1,2,3,4,5]",
      sampleOutput: "[5,4,3,2,1]",
      referenceSolution: `class Solution:
    def reverseList(self, head: list[int]) -> list[int]:
        return head[::-1]`,
      templates: {
        python3: "class Solution:\n    def reverseList(self, head: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] reverseList(int[] head) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    reverseList(head) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Number of Islands",
      slug: "number-of-islands",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an `m x n` 2D binary grid `grid` which represents a map of '1's (land) and '0's (water), return the number of islands.",
      inputFormat: "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
      outputFormat: "1",
      constraintsText: "1 <= grid.length, grid[i].length <= 300",
      sampleInput: "grid = [[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]]",
      sampleOutput: "1",
      referenceSolution: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0
        rows, cols = len(grid), len(grid[0])
        count = 0
        def dfs(r, c):
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
                return
            grid[r][c] = '0'
            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == '1':
                    count += 1
                    dfs(r, c)
        return count`,
      templates: {
        python3: "class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int numIslands(char[][] grid) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    numIslands(grid) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Group Anagrams",
      slug: "group-anagrams",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.",
      inputFormat: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
      outputFormat: "[[\"eat\",\"tea\",\"ate\"],[\"tan\",\"nat\"],[\"bat\"]]",
      constraintsText: "1 <= strs.length <= 10^4\n0 <= strs[i].length <= 100",
      sampleInput: "strs = [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]",
      sampleOutput: "[[\"eat\",\"tea\",\"ate\"],[\"tan\",\"nat\"],[\"bat\"]]",
      referenceSolution: `from collections import defaultdict
class Solution:
    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:
        ans = defaultdict(list)
        for s in strs:
            ans[tuple(sorted(s))].append(s)
        return list(ans.values())`,
      templates: {
        python3: "class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    groupAnagrams(strs) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Kth Largest Element in an Array",
      slug: "kth-largest-element-in-an-array",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums` and an integer `k`, return the `k`-th largest element in the array.",
      inputFormat: "nums = [3,2,1,5,6,4], k = 2",
      outputFormat: "5",
      constraintsText: "1 <= k <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
      sampleInput: "nums = [3,2,1,5,6,4]\nk = 2",
      sampleOutput: "5",
      referenceSolution: `import heapq
class Solution:
    def findKthLargest(self, nums: list[int], k: int) -> int:
        return heapq.nlargest(k, nums)[-1]`,
      templates: {
        python3: "class Solution:\n    def findKthLargest(self, nums: list[int], k: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int findKthLargest(vector<int>& nums, int k) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int findKthLargest(int[] nums, int k) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    findKthLargest(nums, k) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Search in Rotated Sorted Array",
      slug: "search-in-rotated-sorted-array",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums` sorted in ascending order (with distinct values) that is rotated at an unknown pivot, and an integer `target`, return the index of `target` if it is in `nums`, or -1 if it is not.",
      inputFormat: "nums = [4,5,6,7,0,1,2], target = 0",
      outputFormat: "4",
      constraintsText: "1 <= nums.length <= 5000\n-10^4 <= nums[i], target <= 10^4",
      sampleInput: "nums = [4,5,6,7,0,1,2]\ntarget = 0",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def search(self, nums: list[int], target: int) -> int:
        l, r = 0, len(nums) - 1
        while l <= r:
            mid = (l + r) // 2
            if nums[mid] == target:
                return mid
            if nums[l] <= nums[mid]:
                if nums[l] <= target < nums[mid]:
                    r = mid - 1
                else:
                    l = mid + 1
            else:
                if nums[mid] < target <= nums[r]:
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
      title: "Course Schedule",
      slug: "course-schedule",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "There are a total of `numCourses` courses you have to take. Some courses have prerequisites. Return `true` if you can finish all courses, otherwise `false`.",
      inputFormat: "numCourses = 2, prerequisites = [[1,0]]",
      outputFormat: "true",
      constraintsText: "1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000",
      sampleInput: "numCourses = 2\nprerequisites = [[1,0]]",
      sampleOutput: "true",
      referenceSolution: `from collections import defaultdict, deque
class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        adj = defaultdict(list)
        indegree = [0] * numCourses
        for dest, src in prerequisites:
            adj[src].append(dest)
            indegree[dest] += 1
        q = deque([i for i in range(numCourses) if indegree[i] == 0])
        visited = 0
        while q:
            node = q.popleft()
            visited += 1
            for neighbor in adj[node]:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    q.append(neighbor)
        return visited == numCourses`,
      templates: {
        python3: "class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        return true;\n    }\n};",
        java17: "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        return true;\n    }\n}",
        javascript: "class Solution {\n    canFinish(numCourses, prerequisites) {\n        return true;\n    }\n}"
      }
    },
    {
      title: "Longest Increasing Subsequence",
      slug: "longest-increasing-subsequence",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.",
      inputFormat: "nums = [10,9,2,5,3,7,101,18]",
      outputFormat: "4",
      constraintsText: "1 <= nums.length <= 2500\n-10^4 <= nums[i] <= 10^4",
      sampleInput: "nums = [10,9,2,5,3,7,101,18]",
      sampleOutput: "4",
      referenceSolution: `import bisect
class Solution:
    def lengthOfLIS(self, nums: list[int]) -> int:
        sub = []
        for x in nums:
            i = bisect.bisect_left(sub, x)
            if i == len(sub):
                sub.append(x)
            else:
                sub[i] = x
        return len(sub)`,
      templates: {
        python3: "class Solution:\n    def lengthOfLIS(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    lengthOfLIS(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Word Break",
      slug: "word-break",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.",
      inputFormat: "s = \"leetcode\", wordDict = [\"leet\",\"code\"]",
      outputFormat: "true",
      constraintsText: "1 <= s.length <= 300\n1 <= wordDict.length <= 1000",
      sampleInput: "s = \"leetcode\"\nwordDict = [\"leet\",\"code\"]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def wordBreak(self, s: str, wordDict: list[str]) -> bool:
        words = set(wordDict)
        dp = [False] * (len(s) + 1)
        dp[0] = True
        for i in range(1, len(s) + 1):
            for j in range(i):
                if dp[j] and s[j:i] in words:
                    dp[i] = True
                    break
        return dp[len(s)]`,
      templates: {
        python3: "class Solution:\n    def wordBreak(self, s: str, wordDict: list[str]) -> bool:\n        pass",
        cpp17: "#include <string>\n#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        return true;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        return true;\n    }\n}",
        javascript: "class Solution {\n    wordBreak(s, wordDict) {\n        return true;\n    }\n}"
      }
    },
    {
      title: "Merge k Sorted Lists",
      slug: "merge-k-sorted-lists",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an array of `k` sorted integer lists `lists`. Merge all the sorted lists into one sorted array and return it.",
      inputFormat: "lists = [[1,4,5],[1,3,4],[2,6]]",
      outputFormat: "[1,1,2,3,4,4,5,6]",
      constraintsText: "0 <= lists.length <= 10^4\n0 <= lists[i].length <= 500",
      sampleInput: "lists = [[1,4,5],[1,3,4],[2,6]]",
      sampleOutput: "[1,1,2,3,4,4,5,6]",
      referenceSolution: `class Solution:
    def mergeKLists(self, lists: list[list[int]]) -> list[int]:
        res = []
        for l in lists:
            res.extend(l)
        return sorted(res)`,
      templates: {
        python3: "class Solution:\n    def mergeKLists(self, lists: list[list[int]]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> mergeKLists(vector<vector<int>>& lists) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] mergeKLists(int[][] lists) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    mergeKLists(lists) {\n        return [];\n    }\n}"
      }
    }
  ];

  for (const prob of batch2Problems) {
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
      console.log(`[Batch 2] Added: ${prob.title}`);
    }
  }

  console.log("Batch 2 seeding finished!");
}

seedBatch2()
  .catch((e) => {
    console.error("Batch 2 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });