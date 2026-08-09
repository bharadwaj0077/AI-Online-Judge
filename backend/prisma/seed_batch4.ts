import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch4() {
  console.log("Seeding Batch 4 (Problems 31 to 40)...");

  const batch4Problems = [
    {
      title: "Majority Element",
      slug: "majority-element",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array `nums` of size `n`, return the majority element. The majority element is the element that appears more than `⌊n / 2⌋` times.",
      inputFormat: "nums = [3,2,3]",
      outputFormat: "3",
      constraintsText: "1 <= nums.length <= 5 * 10^4\n-10^9 <= nums[i] <= 10^9",
      sampleInput: "nums = [3,2,3]",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def majorityElement(self, nums: list[int]) -> int:
        count = 0
        candidate = None
        for num in nums:
            if count == 0:
                candidate = num
            count += (1 if num == candidate else -1)
        return candidate`,
      templates: {
        python3: "class Solution:\n    def majorityElement(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int majorityElement(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    majorityElement(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Single Number",
      slug: "single-number",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one. You must implement a solution with a linear runtime complexity and use only constant extra space.",
      inputFormat: "nums = [4,1,2,1,2]",
      outputFormat: "4",
      constraintsText: "1 <= nums.length <= 3 * 10^4\n-3 * 10^4 <= nums[i] <= 3 * 10^4",
      sampleInput: "nums = [4,1,2,1,2]",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def singleNumber(self, nums: list[int]) -> int:
        res = 0
        for num in nums:
            res ^= num
        return res`,
      templates: {
        python3: "class Solution:\n    def singleNumber(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int singleNumber(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    singleNumber(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Rotate Image",
      slug: "rotate-image",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an `n x n` 2D `matrix` representing an image, rotate the image by 90 degrees (clockwise) in-place.",
      inputFormat: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
      outputFormat: "[[7,4,1],[8,5,2],[9,6,3]]",
      constraintsText: "1 <= matrix.length == matrix[i].length <= 20\n-1000 <= matrix[i][j] <= 1000",
      sampleInput: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
      sampleOutput: "[[7,4,1],[8,5,2],[9,6,3]]",
      referenceSolution: `class Solution:
    def rotate(self, matrix: list[list[int]]) -> list[list[int]]:
        n = len(matrix)
        for i in range(n):
            for j in range(i + 1, n):
                matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
        for i in range(n):
            matrix[i].reverse()
        return matrix`,
      templates: {
        python3: "class Solution:\n    def rotate(self, matrix: list[list[int]]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> rotate(vector<vector<int>>& matrix) {\n        return {};\n    }\n};",
        java17: "class Solution {\n    public int[][] rotate(int[][] matrix) {\n        return new int[][]{};\n    }\n}",
        javascript: "class Solution {\n    rotate(matrix) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Spiral Matrix",
      slug: "spiral-matrix",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an `m x n` `matrix`, return all elements of the `matrix` in spiral order.",
      inputFormat: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
      outputFormat: "[1,2,3,6,9,8,7,4,5]",
      constraintsText: "1 <= matrix.length, matrix[i].length <= 10\n-100 <= matrix[i][j] <= 100",
      sampleInput: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
      sampleOutput: "[1,2,3,6,9,8,7,4,5]",
      referenceSolution: `class Solution:
    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:
        res = []
        if not matrix:
            return res
        top, bottom = 0, len(matrix) - 1
        left, right = 0, len(matrix[0]) - 1
        while top <= bottom and left <= right:
            for i in range(left, right + 1):
                res.append(matrix[top][i])
            top += 1
            for i in range(top, bottom + 1):
                res.append(matrix[i][right])
            right -= 1
            if top <= bottom:
                for i in range(right, left - 1, -1):
                    res.append(matrix[bottom][i])
                bottom -= 1
            if left <= right:
                for i in range(bottom, top - 1, -1):
                    res.append(matrix[i][left])
                left += 1
        return res`,
      templates: {
        python3: "class Solution:\n    def spiralOrder(self, matrix: list[list[int]]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> spiralOrder(vector<vector<int>>& matrix) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    spiralOrder(matrix) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Word Search",
      slug: "word-search",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid.",
      inputFormat: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]], word = \"ABCCED\"",
      outputFormat: "true",
      constraintsText: "1 <= board.length, board[i].length <= 6\n1 <= word.length <= 15",
      sampleInput: "board = [[\"A\",\"B\",\"C\",\"E\"],[\"S\",\"F\",\"C\",\"S\"],[\"A\",\"D\",\"E\",\"E\"]]\nword = \"ABCCED\"",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def exist(self, board: list[list[str]], word: str) -> bool:
        rows, cols = len(board), len(board[0])
        def dfs(r, c, i):
            if i == len(word):
                return True
            if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[i]:
                return False
            temp = board[r][c]
            board[r][c] = '#'
            found = dfs(r+1, c, i+1) or dfs(r-1, c, i+1) or dfs(r, c+1, i+1) or dfs(r, c-1, i+1)
            board[r][c] = temp
            return found
        for r in range(rows):
            for c in range(cols):
                if board[r][c] == word[0] and dfs(r, c, 0):
                    return True
        return False`,
      templates: {
        python3: "class Solution:\n    def exist(self, board: list[list[str]], word: str) -> bool:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool exist(vector<vector<char>>& board, string word) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean exist(char[][] board, String word) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    exist(board, word) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "House Robber",
      slug: "house-robber",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected. Return the maximum amount of money you can rob tonight without alerting the police.",
      inputFormat: "nums = [1,2,3,1]",
      outputFormat: "4",
      constraintsText: "1 <= nums.length <= 100\n0 <= nums[i] <= 400",
      sampleInput: "nums = [1,2,3,1]",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def rob(self, nums: list[int]) -> int:
        rob1, rob2 = 0, 0
        for n in nums:
            temp = max(n + rob1, rob2)
            rob1 = rob2
            rob2 = temp
        return rob2`,
      templates: {
        python3: "class Solution:\n    def rob(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    rob(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Decode Ways",
      slug: "decode-ways",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "A message containing letters from A-Z can be encoded into numbers using the mapping 'A' -> \"1\", 'B' -> \"2\", ..., 'Z' -> \"26\". Given a string `s` containing only digits, return the number of ways to decode it.",
      inputFormat: "s = \"12\"",
      outputFormat: "2",
      constraintsText: "1 <= s.length <= 100\ns consists of digits and may contain leading zeros.",
      sampleInput: "s = \"12\"",
      sampleOutput: "2",
      referenceSolution: `class Solution:
    def numDecodings(self, s: str) -> int:
        if not s or s[0] == '0':
            return 0
        dp = [0] * (len(s) + 1)
        dp[0] = 1
        dp[1] = 1
        for i in range(2, len(s) + 1):
            if s[i - 1] != '0':
                dp[i] += dp[i - 1]
            if 10 <= int(s[i - 2:i]) <= 26:
                dp[i] += dp[i - 2]
        return dp[len(s)]`,
      templates: {
        python3: "class Solution:\n    def numDecodings(self, s: str) -> int:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int numDecodings(string s) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int numDecodings(String s) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    numDecodings(s) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Validate Binary Search Tree",
      slug: "validate-binary-search-tree",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, determine if it is a valid binary search tree (BST).",
      inputFormat: "nodes = [2,1,3]",
      outputFormat: "true",
      constraintsText: "1 <= nodes.length <= 10^4",
      sampleInput: "nodes = [2,1,3]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isValidBST(self, nodes: list[int]) -> bool:
        def valid(idx, left, right):
            if idx >= len(nodes) or nodes[idx] is None:
                return True
            val = nodes[idx]
            if not (left < val < right):
                return False
            return valid(2 * idx + 1, left, val) and valid(2 * idx + 2, val, right)
        return valid(0, float('-inf'), float('inf'))`,
      templates: {
        python3: "class Solution:\n    def isValidBST(self, nodes: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValidBST(vector<int>& nodes) {\n        return true;\n    }\n};",
        java17: "class Solution {\n    public boolean isValidBST(int[] nodes) {\n        return true;\n    }\n}",
        javascript: "class Solution {\n    isValidBST(nodes) {\n        return true;\n    }\n}"
      }
    },
    {
      title: "Lowest Common Ancestor of a Binary Tree",
      slug: "lowest-common-ancestor-of-a-binary-tree",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a binary tree represented as an array `nodes` and two node values `p` and `q`, find their lowest common ancestor (LCA).",
      inputFormat: "nodes = [3,5,1,6,2,0,8], p = 5, q = 1",
      outputFormat: "3",
      constraintsText: "2 <= nodes.length <= 10^4\nAll node values are unique.",
      sampleInput: "nodes = [3,5,1,6,2,0,8]\np = 5\nq = 1",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def lowestCommonAncestor(self, nodes: list[int], p: int, q: int) -> int:
        def find_path(idx, target, path):
            if idx >= len(nodes) or nodes[idx] is None:
                return False
            path.append(nodes[idx])
            if nodes[idx] == target:
                return True
            if find_path(2 * idx + 1, target, path) or find_path(2 * idx + 2, target, path):
                return True
            path.pop()
            return False
        p1, p2 = [], []
        find_path(0, p, p1)
        find_path(0, q, p2)
        ans = p1[0]
        for a, b in zip(p1, p2):
            if a == b:
                ans = a
            else:
                break
        return ans`,
      templates: {
        python3: "class Solution:\n    def lowestCommonAncestor(self, nodes: list[int], p: int, q: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int lowestCommonAncestor(vector<int>& nodes, int p, int q) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int lowestCommonAncestor(int[] nodes, int p, int q) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    lowestCommonAncestor(nodes, p, q) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Binary Tree Maximum Path Sum",
      slug: "binary-tree-maximum-path-sum",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. Return the maximum path sum of any non-empty path.",
      inputFormat: "nodes = [-10,9,20,15,7]",
      outputFormat: "42",
      constraintsText: "1 <= nodes.length <= 3 * 10^4",
      sampleInput: "nodes = [-10,9,20,15,7]",
      sampleOutput: "42",
      referenceSolution: `class Solution:
    def maxPathSum(self, nodes: list[int]) -> int:
        max_sum = [float('-inf')]
        def dfs(idx):
            if idx >= len(nodes) or nodes[idx] is None:
                return 0
            left = max(0, dfs(2 * idx + 1))
            right = max(0, dfs(2 * idx + 2))
            max_sum[0] = max(max_sum[0], nodes[idx] + left + right)
            return nodes[idx] + max(left, right)
        dfs(0)
        return max_sum[0]`,
      templates: {
        python3: "class Solution:\n    def maxPathSum(self, nodes: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxPathSum(vector<int>& nodes) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int maxPathSum(int[] nodes) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    maxPathSum(nodes) {\n        return 0;\n    }\n}"
      }
    }
  ];

  for (const prob of batch4Problems) {
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
      console.log(`[Batch 4] Added: ${prob.title}`);
    }
  }

  console.log("Batch 4 seeding finished!");
}

seedBatch4()
  .catch((e) => {
    console.error("Batch 4 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });