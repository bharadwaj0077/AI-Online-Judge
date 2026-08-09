import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch6() {
  console.log("Seeding Batch 6 (Problems 51 to 60)...");

  const batch6Problems = [
    {
      title: "Intersection of Two Arrays II",
      slug: "intersection-of-two-arrays-ii",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two integer arrays `nums1` and `nums2`, return an array of their intersection. Each element in the result must appear as many times as it shows in both arrays.",
      inputFormat: "nums1 = [1,2,2,1], nums2 = [2,2]",
      outputFormat: "[2,2]",
      constraintsText: "1 <= nums1.length, nums2.length <= 1000\n0 <= nums1[i], nums2[i] <= 1000",
      sampleInput: "nums1 = [1,2,2,1]\nnums2 = [2,2]",
      sampleOutput: "[2,2]",
      referenceSolution: `from collections import Counter
class Solution:
    def intersect(self, nums1: list[int], nums2: list[int]) -> list[int]:
        c1, c2 = Counter(nums1), Counter(nums2)
        res = []
        for k in c1:
            if k in c2:
                res.extend([k] * min(c1[k], c2[k]))
        return res`,
      templates: {
        python3: "class Solution:\n    def intersect(self, nums1: list[int], nums2: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> intersect(vector<int>& nums1, vector<int>& nums2) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] intersect(int[] nums1, int[] nums2) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    intersect(nums1, nums2) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Kth Smallest Element in a BST",
      slug: "kth-smallest-element-in-a-bst",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary search tree represented as an array `nodes` and an integer `k`, return the `k`-th smallest value (1-indexed) of all the values of the nodes in the tree.",
      inputFormat: "nodes = [3,1,4,None,2], k = 1",
      outputFormat: "1",
      constraintsText: "1 <= k <= n <= 10^4",
      sampleInput: "nodes = [3,1,4,None,2]\nk = 1",
      sampleOutput: "1",
      referenceSolution: `class Solution:
    def kthSmallest(self, nodes: list[int], k: int) -> int:
        valid_vals = sorted([x for x in nodes if x is not None])
        return valid_vals[k - 1]`,
      templates: {
        python3: "class Solution:\n    def kthSmallest(self, nodes: list[int], k: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int kthSmallest(vector<int>& nodes, int k) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int kthSmallest(int[] nodes, int k) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    kthSmallest(nodes, k) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Construct Binary Tree from Preorder and Inorder Traversal",
      slug: "construct-binary-tree-from-preorder-and-inorder-traversal",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two integer arrays `preorder` and `inorder` where `preorder` is the preorder traversal of a binary tree and `inorder` is the inorder traversal, return the level-order array representation of the tree.",
      inputFormat: "preorder = [3,9,20,15,7], inorder = [9,3,15,20,7]",
      outputFormat: "[3,9,20,15,7]",
      constraintsText: "1 <= preorder.length <= 3000\ninorder.length == preorder.length",
      sampleInput: "preorder = [3,9,20,15,7]\ninorder = [9,3,15,20,7]",
      sampleOutput: "[3,9,20,15,7]",
      referenceSolution: `class Solution:
    def buildTree(self, preorder: list[int], inorder: list[int]) -> list[int]:
        if not preorder or not inorder:
            return []
        root_val = preorder[0]
        mid = inorder.index(root_val)
        left = self.buildTree(preorder[1:mid+1], inorder[:mid])
        right = self.buildTree(preorder[mid+1:], inorder[mid+1:])
        return [root_val] + left + right`,
      templates: {
        python3: "class Solution:\n    def buildTree(self, preorder: list[int], inorder: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> buildTree(vector<int>& preorder, vector<int>& inorder) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] buildTree(int[] preorder, int[] inorder) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    buildTree(preorder, inorder) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Flatten Binary Tree to Linked List",
      slug: "flatten-binary-tree-to-linked-list",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as `nodes`, flatten the tree into a pre-order traversal sequence.",
      inputFormat: "nodes = [1,2,5,3,4,None,6]",
      outputFormat: "[1,2,3,4,5,6]",
      constraintsText: "0 <= nodes.length <= 2000",
      sampleInput: "nodes = [1,2,5,3,4,None,6]",
      sampleOutput: "[1,2,3,4,5,6]",
      referenceSolution: `class Solution:
    def flatten(self, nodes: list[int]) -> list[int]:
        return [x for x in nodes if x is not None]`,
      templates: {
        python3: "class Solution:\n    def flatten(self, nodes: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> flatten(vector<int>& nodes) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] flatten(int[] nodes) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    flatten(nodes) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Target Sum",
      slug: "target-sum",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an integer array `nums` and an integer `target`. You want to build an expression out of nums by adding one of the symbols '+' and '-' before each integer in nums. Return the number of different expressions that evaluate to target.",
      inputFormat: "nums = [1,1,1,1,1], target = 3",
      outputFormat: "5",
      constraintsText: "1 <= nums.length <= 20\n0 <= sum(nums) <= 1000",
      sampleInput: "nums = [1,1,1,1,1]\ntarget = 3",
      sampleOutput: "5",
      referenceSolution: `class Solution:
    def findTargetSumWays(self, nums: list[int], target: int) -> int:
        dp = {0: 1}
        for num in nums:
            next_dp = {}
            for s, count in dp.items():
                next_dp[s + num] = next_dp.get(s + num, 0) + count
                next_dp[s - num] = next_dp.get(s - num, 0) + count
            dp = next_dp
        return dp.get(target, 0)`,
      templates: {
        python3: "class Solution:\n    def findTargetSumWays(self, nums: list[int], target: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int findTargetSumWays(vector<int>& nums, int target) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int findTargetSumWays(int[] nums, int target) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    findTargetSumWays(nums, target) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Partition Equal Subset Sum",
      slug: "partition-equal-subset-sum",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, return `true` if you can partition the array into two subsets such that the sum of the elements in both subsets is equal, or `false` otherwise.",
      inputFormat: "nums = [1,5,11,5]",
      outputFormat: "true",
      constraintsText: "1 <= nums.length <= 200\n1 <= nums[i] <= 100",
      sampleInput: "nums = [1,5,11,5]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def canPartition(self, nums: list[int]) -> bool:
        total = sum(nums)
        if total % 2 != 0:
            return False
        target = total // 2
        dp = set([0])
        for num in nums:
            next_dp = set()
            for t in dp:
                if t + num == target:
                    return True
                next_dp.add(t + num)
                next_dp.add(t)
            dp = next_dp
        return target in dp`,
      templates: {
        python3: "class Solution:\n    def canPartition(self, nums: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool canPartition(vector<int>& nums) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean canPartition(int[] nums) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    canPartition(nums) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Implement Trie (Prefix Tree)",
      slug: "implement-trie-prefix-tree",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "A trie (pronounced as \"try\") or prefix tree is a tree data structure used to efficiently store and search keys. Given a sequence of operations `ops` and values `vals`, return the output array.",
      inputFormat: "words = [\"apple\", \"app\"], target = \"app\"",
      outputFormat: "true",
      constraintsText: "1 <= words.length <= 30000",
      sampleInput: "words = [\"apple\", \"app\"]\ntarget = \"app\"",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def searchTrie(self, words: list[str], target: str) -> bool:
        return target in words`,
      templates: {
        python3: "class Solution:\n    def searchTrie(self, words: list[str], target: str) -> bool:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    bool searchTrie(vector<string>& words, string target) {\n        return false;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public boolean searchTrie(String[] words, String target) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    searchTrie(words, target) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Min Stack",
      slug: "min-stack",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time. Given an array of integers `elements`, return the minimum element.",
      inputFormat: "elements = [-2,0,-3]",
      outputFormat: "-3",
      constraintsText: "1 <= elements.length <= 3 * 10^4",
      sampleInput: "elements = [-2,0,-3]",
      sampleOutput: "-3",
      referenceSolution: `class Solution:
    def getMin(self, elements: list[int]) -> int:
        return min(elements)`,
      templates: {
        python3: "class Solution:\n    def getMin(self, elements: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\n#include <algorithm>\nusing namespace std;\nclass Solution {\npublic:\n    int getMin(vector<int>& elements) {\n        return 0;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int getMin(int[] elements) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    getMin(elements) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Letter Combinations of a Phone Number",
      slug: "letter-combinations-of-a-phone-number",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string containing digits from 2-9 inclusive, return all possible letter combinations that the number could represent.",
      inputFormat: "digits = \"23\"",
      outputFormat: "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]",
      constraintsText: "0 <= digits.length <= 4",
      sampleInput: "digits = \"23\"",
      sampleOutput: "[\"ad\",\"ae\",\"af\",\"bd\",\"be\",\"bf\",\"cd\",\"ce\",\"cf\"]",
      referenceSolution: `class Solution:
    def letterCombinations(self, digits: str) -> list[str]:
        if not digits:
            return []
        phone = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
        res = []
        def backtrack(i, cur):
            if i == len(digits):
                res.append(cur)
                return
            for char in phone[digits[i]]:
                backtrack(i + 1, cur + char)
        backtrack(0, "")
        return res`,
      templates: {
        python3: "class Solution:\n    def letterCombinations(self, digits: str) -> list[str]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<string> letterCombinations(string digits) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<String> letterCombinations(String digits) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    letterCombinations(digits) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "N-Queens",
      slug: "n-queens",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "The n-queens puzzle is the problem of placing `n` queens on an `n x n` chessboard such that no two queens attack each other. Return all distinct solutions to the n-queens puzzle.",
      inputFormat: "n = 4",
      outputFormat: "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]",
      constraintsText: "1 <= n <= 9",
      sampleInput: "n = 4",
      sampleOutput: "[[\".Q..\",\"...Q\",\"Q...\",\"..Q.\"],[\"..Q.\",\"Q...\",\"...Q\",\".Q..\"]]",
      referenceSolution: `class Solution:
    def solveNQueens(self, n: int) -> list[list[str]]:
        col = set()
        posDiag = set()
        negDiag = set()
        res = []
        board = [["."] * n for _ in range(n)]
        def backtrack(r):
            if r == n:
                res.append(["".join(row) for row in board])
                return
            for c in range(n):
                if c in col or (r + c) in posDiag or (r - c) in negDiag:
                    continue
                col.add(c)
                posDiag.add(r + c)
                negDiag.add(r - c)
                board[r][c] = "Q"
                backtrack(r + 1)
                col.remove(c)
                posDiag.remove(r + c)
                negDiag.remove(r - c)
                board[r][c] = "."
        backtrack(0)
        return res`,
      templates: {
        python3: "class Solution:\n    def solveNQueens(self, n: int) -> list[list[str]]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<string>> solveNQueens(int n) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<String>> solveNQueens(int n) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    solveNQueens(n) {\n        return [];\n    }\n}"
      }
    }
  ];

  for (const prob of batch6Problems) {
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
      console.log(`[Batch 6] Added: ${prob.title}`);
    }
  }

  console.log("Batch 6 seeding finished!");
}

seedBatch6()
  .catch((e) => {
    console.error("Batch 6 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });