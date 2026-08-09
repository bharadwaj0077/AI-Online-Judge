import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch7() {
  console.log("Seeding Batch 7 (Problems 61 to 70)...");

  const batch7Problems = [
    {
      title: "Binary Tree Level Order Traversal",
      slug: "binary-tree-level-order-traversal",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as a array `nodes`, return the level order traversal of its nodes' values (i.e., from left to right, level by level).",
      inputFormat: "nodes = [3,9,20,None,None,15,7]",
      outputFormat: "[[3],[9,20],[15,7]]",
      constraintsText: "0 <= nodes.length <= 2000",
      sampleInput: "nodes = [3,9,20,None,None,15,7]",
      sampleOutput: "[[3],[9,20],[15,7]]",
      referenceSolution: `class Solution:
    def levelOrder(self, nodes: list[int]) -> list[list[int]]:
        if not nodes or nodes[0] is None:
            return []
        res = []
        q = [0]
        while q:
            level = []
            next_q = []
            for idx in q:
                if idx < len(nodes) and nodes[idx] is not None:
                    level.append(nodes[idx])
                    next_q.append(2 * idx + 1)
                    next_q.append(2 * idx + 2)
            if level:
                res.append(level)
            q = next_q
        return res`,
      templates: {
        python3: "class Solution:\n    def levelOrder(self, nodes: list[int]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> levelOrder(vector<int>& nodes) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> levelOrder(int[] nodes) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    levelOrder(nodes) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Symmetric Tree",
      slug: "symmetric-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, check whether it is a mirror of itself (i.e., symmetric around its center).",
      inputFormat: "nodes = [1,2,2,3,4,4,3]",
      outputFormat: "true",
      constraintsText: "1 <= nodes.length <= 1000",
      sampleInput: "nodes = [1,2,2,3,4,4,3]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isSymmetric(self, nodes: list[int]) -> bool:
        def is_sym(i1, i2):
            if i1 >= len(nodes) and i2 >= len(nodes):
                return True
            if i1 >= len(nodes) or i2 >= len(nodes):
                return False
            if nodes[i1] is None and nodes[i2] is None:
                return True
            if nodes[i1] != nodes[i2]:
                return False
            return is_sym(2 * i1 + 1, 2 * i2 + 2) and is_sym(2 * i1 + 2, 2 * i2 + 1)
        if not nodes:
            return True
        return is_sym(1, 2)`,
      templates: {
        python3: "class Solution:\n    def isSymmetric(self, nodes: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isSymmetric(vector<int>& nodes) {\n        return true;\n    }\n};",
        java17: "class Solution {\n    public boolean isSymmetric(int[] nodes) {\n        return true;\n    }\n}",
        javascript: "class Solution {\n    isSymmetric(nodes) {\n        return true;\n    }\n}"
      }
    },
    {
      title: "Maximum Depth of Binary Tree",
      slug: "maximum-depth-of-binary-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, return its maximum depth.",
      inputFormat: "nodes = [3,9,20,None,None,15,7]",
      outputFormat: "3",
      constraintsText: "0 <= nodes.length <= 10^4",
      sampleInput: "nodes = [3,9,20,None,None,15,7]",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def maxDepth(self, nodes: list[int]) -> int:
        def depth(idx):
            if idx >= len(nodes) or nodes[idx] is None:
                return 0
            return 1 + max(depth(2 * idx + 1), depth(2 * idx + 2))
        return depth(0)`,
      templates: {
        python3: "class Solution:\n    def maxDepth(self, nodes: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxDepth(vector<int>& nodes) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int maxDepth(int[] nodes) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    maxDepth(nodes) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Invert Binary Tree",
      slug: "invert-binary-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, invert the tree, and return its root array.",
      inputFormat: "nodes = [4,2,7,1,3,6,9]",
      outputFormat: "[4,7,2,9,6,3,1]",
      constraintsText: "0 <= nodes.length <= 100",
      sampleInput: "nodes = [4,2,7,1,3,6,9]",
      sampleOutput: "[4,7,2,9,6,3,1]",
      referenceSolution: `class Solution:
    def invertTree(self, nodes: list[int]) -> list[int]:
        if not nodes:
            return []
        tree = list(nodes)
        def invert(idx):
            if idx >= len(tree) or tree[idx] is None:
                return
            left, right = 2 * idx + 1, 2 * idx + 2
            if left < len(tree) and right < len(tree):
                tree[left], tree[right] = tree[right], tree[left]
            invert(left)
            invert(right)
        invert(0)
        return tree`,
      templates: {
        python3: "class Solution:\n    def invertTree(self, nodes: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> invertTree(vector<int>& nodes) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] invertTree(int[] nodes) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    invertTree(nodes) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Path Sum",
      slug: "path-sum",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree `nodes` and an integer `targetSum`, return `true` if the tree has a root-to-leaf path such that adding up all the values along the path equals `targetSum`.",
      inputFormat: "nodes = [5,4,8,11,None,13,4,7,2,None,None,None,1], targetSum = 22",
      outputFormat: "true",
      constraintsText: "0 <= nodes.length <= 5000",
      sampleInput: "nodes = [5,4,8,11,None,13,4,7,2,None,None,None,1]\ntargetSum = 22",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def hasPathSum(self, nodes: list[int], targetSum: int) -> bool:
        def dfs(idx, cur_sum):
            if idx >= len(nodes) or nodes[idx] is None:
                return False
            cur_sum += nodes[idx]
            l, r = 2 * idx + 1, 2 * idx + 2
            is_leaf = (l >= len(nodes) or nodes[l] is None) and (r >= len(nodes) or nodes[r] is None)
            if is_leaf:
                return cur_sum == targetSum
            return dfs(l, cur_sum) or dfs(r, cur_sum)
        return dfs(0, 0)`,
      templates: {
        python3: "class Solution:\n    def hasPathSum(self, nodes: list[int], targetSum: int) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool hasPathSum(vector<int>& nodes, int targetSum) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean hasPathSum(int[] nodes, int targetSum) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    hasPathSum(nodes, targetSum) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Subsets II",
      slug: "subsets-ii",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums` that may contain duplicates, return all possible subsets (the power set). The solution set must not contain duplicate subsets.",
      inputFormat: "nums = [1,2,2]",
      outputFormat: "[[],[1],[1,2],[1,2,2],[2],[2,2]]",
      constraintsText: "1 <= nums.length <= 10\n-10 <= nums[i] <= 10",
      sampleInput: "nums = [1,2,2]",
      sampleOutput: "[[],[1],[1,2],[1,2,2],[2],[2,2]]",
      referenceSolution: `class Solution:
    def subsetsWithDup(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        def backtrack(i, path):
            res.append(path.copy())
            for j in range(i, len(nums)):
                if j > i and nums[j] == nums[j - 1]:
                    continue
                path.append(nums[j])
                backtrack(j + 1, path)
                path.pop()
        backtrack(0, [])
        return res`,
      templates: {
        python3: "class Solution:\n    def subsetsWithDup(self, nums: list[int]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> subsetsWithDup(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> subsetsWithDup(int[] nums) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    subsetsWithDup(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Permutations",
      slug: "permutations",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array `nums` of distinct integers, return all the possible permutations. You can return the answer in any order.",
      inputFormat: "nums = [1,2,3]",
      outputFormat: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
      constraintsText: "1 <= nums.length <= 6\n-10 <= nums[i] <= 10",
      sampleInput: "nums = [1,2,3]",
      sampleOutput: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]",
      referenceSolution: `class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        res = []
        def backtrack(path, used):
            if len(path) == len(nums):
                res.append(path.copy())
                return
            for i in range(len(nums)):
                if not used[i]:
                    used[i] = True
                    path.append(nums[i])
                    backtrack(path, used)
                    path.pop()
                    used[i] = False
        backtrack([], [False] * len(nums))
        return res`,
      templates: {
        python3: "class Solution:\n    def permute(self, nums: list[int]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    permute(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Word Search II",
      slug: "word-search-ii",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an `m x n` `board` of characters and a list of strings `words`, return all words on the board.",
      inputFormat: "board = [[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]], words = [\"oath\",\"pea\",\"eat\",\"rain\"]",
      outputFormat: "[\"eat\",\"oath\"]",
      constraintsText: "1 <= board.length, board[i].length <= 12\n1 <= words.length <= 3 * 10^4",
      sampleInput: "board = [[\"o\",\"a\",\"a\",\"n\"],[\"e\",\"t\",\"a\",\"e\"],[\"i\",\"h\",\"k\",\"r\"],[\"i\",\"f\",\"l\",\"v\"]]\nwords = [\"oath\",\"pea\",\"eat\",\"rain\"]",
      sampleOutput: "[\"eat\",\"oath\"]",
      referenceSolution: `class Solution:
    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:
        res = []
        for w in words:
            if self.exist(board, w):
                res.append(w)
        return sorted(res)
    def exist(self, board, word):
        R, C = len(board), len(board[0])
        def dfs(r, c, i):
            if i == len(word):
                return True
            if r < 0 or r >= R or c < 0 or c >= C or board[r][c] != word[i]:
                return False
            tmp = board[r][c]
            board[r][c] = '#'
            found = dfs(r+1,c,i+1) or dfs(r-1,c,i+1) or dfs(r,c+1,i+1) or dfs(r,c-1,i+1)
            board[r][c] = tmp
            return found
        for r in range(R):
            for c in range(C):
                if dfs(r, c, 0):
                    return True
        return False`,
      templates: {
        python3: "class Solution:\n    def findWords(self, board: list[list[str]], words: list[str]) -> list[str]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<string> findWords(vector<vector<char>>& board, vector<string>& words) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<String> findWords(char[][] board, String[] words) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    findWords(board, words) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Longest Increasing Path in a Matrix",
      slug: "longest-increasing-path-in-a-matrix",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an `m x n` integers `matrix`, return the length of the longest increasing path in matrix.",
      inputFormat: "matrix = [[9,9,4],[6,6,8],[2,1,1]]",
      outputFormat: "4",
      constraintsText: "1 <= matrix.length, matrix[i].length <= 200",
      sampleInput: "matrix = [[9,9,4],[6,6,8],[2,1,1]]",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def longestIncreasingPath(self, matrix: list[list[int]]) -> int:
        if not matrix:
            return 0
        R, C = len(matrix), len(matrix[0])
        dp = {}
        def dfs(r, c):
            if (r, c) in dp:
                return dp[(r, c)]
            val = matrix[r][c]
            res = 1
            for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < R and 0 <= nc < C and matrix[nr][nc] > val:
                    res = max(res, 1 + dfs(nr, nc))
            dp[(r, c)] = res
            return res
        return max(dfs(r, c) for r in range(R) for c in range(C))`,
      templates: {
        python3: "class Solution:\n    def longestIncreasingPath(self, matrix: list[list[int]]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int longestIncreasingPath(vector<vector<int>>& matrix) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int longestIncreasingPath(int[][] matrix) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    longestIncreasingPath(matrix) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Course Schedule II",
      slug: "course-schedule-ii",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. Return the ordering of courses you should take to finish all courses.",
      inputFormat: "numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]",
      outputFormat: "[0,1,2,3]",
      constraintsText: "1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000",
      sampleInput: "numCourses = 4\nprerequisites = [[1,0],[2,0],[3,1],[3,2]]",
      sampleOutput: "[0,1,2,3]",
      referenceSolution: `from collections import defaultdict, deque
class Solution:
    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:
        adj = defaultdict(list)
        indegree = [0] * numCourses
        for dest, src in prerequisites:
            adj[src].append(dest)
            indegree[dest] += 1
        q = deque([i for i in range(numCourses) if indegree[i] == 0])
        res = []
        while q:
            node = q.popleft()
            res.append(node)
            for neighbor in adj[node]:
                indegree[neighbor] -= 1
                if indegree[neighbor] == 0:
                    q.append(neighbor)
        return res if len(res) == numCourses else []`,
      templates: {
        python3: "class Solution:\n    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    findOrder(numCourses, prerequisites) {\n        return [];\n    }\n}"
      }
    }
  ];

  for (const prob of batch7Problems) {
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
      console.log(`[Batch 7] Added: ${prob.title}`);
    }
  }

  console.log("Batch 7 seeding finished!");
}

seedBatch7()
  .catch((e) => {
    console.error("Batch 7 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });