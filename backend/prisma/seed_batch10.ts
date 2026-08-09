import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch10() {
  console.log("Seeding Batch 10 (Problems 91 to 100)...");

  const batch10Problems = [
    {
      title: "Palindrome Linked List",
      slug: "palindrome-linked-list",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the head of a singly linked list represented as an array `head`, return `true` if it is a palindrome or `false` otherwise.",
      inputFormat: "head = [1,2,2,1]",
      outputFormat: "true",
      constraintsText: "1 <= head.length <= 10^5\n0 <= head[i] <= 9",
      sampleInput: "head = [1,2,2,1]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isPalindrome(self, head: list[int]) -> bool:
        return head == head[::-1]`,
      templates: {
        python3: "class Solution:\n    def isPalindrome(self, head: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isPalindrome(vector<int>& head) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean isPalindrome(int[] head) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isPalindrome(head) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Reverse Nodes in k-Group",
      slug: "reverse-nodes-in-k-group",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the head of a linked list represented as an array `head`, reverse the nodes of the list `k` at a time, and return the modified array.",
      inputFormat: "head = [1,2,3,4,5], k = 2",
      outputFormat: "[2,1,4,3,5]",
      constraintsText: "1 <= k <= head.length <= 5000",
      sampleInput: "head = [1,2,3,4,5]\nk = 2",
      sampleOutput: "[2,1,4,3,5]",
      referenceSolution: `class Solution:
    def reverseKGroup(self, head: list[int], k: int) -> list[int]:
        res = []
        for i in range(0, len(head), k):
            group = head[i:i+k]
            if len(group) == k:
                res.extend(group[::-1])
            else:
                res.extend(group)
        return res`,
      templates: {
        python3: "class Solution:\n    def reverseKGroup(self, head: list[int], k: int) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> reverseKGroup(vector<int>& head, int k) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] reverseKGroup(int[] head, int k) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    reverseKGroup(head, k) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Binary Tree Inorder Traversal",
      slug: "binary-tree-inorder-traversal",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, return the inorder traversal of its nodes' values.",
      inputFormat: "nodes = [1,None,2,3]",
      outputFormat: "[1,3,2]",
      constraintsText: "0 <= nodes.length <= 100",
      sampleInput: "nodes = [1,None,2,3]",
      sampleOutput: "[1,3,2]",
      referenceSolution: `class Solution:
    def inorderTraversal(self, nodes: list[int]) -> list[int]:
        res = []
        def inorder(idx):
            if idx >= len(nodes) or nodes[idx] is None:
                return
            inorder(2 * idx + 1)
            res.append(nodes[idx])
            inorder(2 * idx + 2)
        inorder(0)
        return res`,
      templates: {
        python3: "class Solution:\n    def inorderTraversal(self, nodes: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> inorderTraversal(vector<int>& nodes) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] inorderTraversal(int[] nodes) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    inorderTraversal(nodes) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Same Tree",
      slug: "same-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the roots of two binary trees `p` and `q` represented as arrays, write a function to check if they are the same or not.",
      inputFormat: "p = [1,2,3], q = [1,2,3]",
      outputFormat: "true",
      constraintsText: "0 <= p.length, q.length <= 100",
      sampleInput: "p = [1,2,3]\nq = [1,2,3]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isSameTree(self, p: list[int], q: list[int]) -> bool:
        return p == q`,
      templates: {
        python3: "class Solution:\n    def isSameTree(self, p: list[int], q: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isSameTree(vector<int>& p, vector<int>& q) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean isSameTree(int[] p, int[] q) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isSameTree(p, q) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Subtree of Another Tree",
      slug: "subtree-of-another-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the roots of two binary trees `root` and `subRoot`, return `true` if there is a subtree of `root` with the same structure and node values of `subRoot` and `false` otherwise.",
      inputFormat: "root = [3,4,5,1,2], subRoot = [4,1,2]",
      outputFormat: "true",
      constraintsText: "0 <= root.length, subRoot.length <= 2000",
      sampleInput: "root = [3,4,5,1,2]\nsubRoot = [4,1,2]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isSubtree(self, root: list[int], subRoot: list[int]) -> bool:
        def is_same(i1, i2):
            if i1 >= len(root) and i2 >= len(subRoot):
                return True
            if i1 >= len(root) or i2 >= len(subRoot):
                return False
            if root[i1] is None and subRoot[i2] is None:
                return True
            if root[i1] != subRoot[i2]:
                return False
            return is_same(2 * i1 + 1, 2 * i2 + 1) and is_same(2 * i1 + 2, 2 * i2 + 2)
        for idx in range(len(root)):
            if is_same(idx, 0):
                return True
        return False`,
      templates: {
        python3: "class Solution:\n    def isSubtree(self, root: list[int], subRoot: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isSubtree(vector<int>& root, vector<int>& subRoot) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean isSubtree(int[] root, int[] subRoot) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isSubtree(root, subRoot) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Binary Tree Right Side View",
      slug: "binary-tree-right-side-view",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, imagine yourself standing on the right side of it, return the values of the nodes you can see ordered from top to bottom.",
      inputFormat: "nodes = [1,2,3,None,5,None,4]",
      outputFormat: "[1,3,4]",
      constraintsText: "0 <= nodes.length <= 100",
      sampleInput: "nodes = [1,2,3,None,5,None,4]",
      sampleOutput: "[1,3,4]",
      referenceSolution: `class Solution:
    def rightSideView(self, nodes: list[int]) -> list[int]:
        if not nodes or nodes[0] is None:
            return []
        res = []
        q = [0]
        while q:
            rightmost = None
            next_q = []
            for idx in q:
                if idx < len(nodes) and nodes[idx] is not None:
                    rightmost = nodes[idx]
                    next_q.append(2 * idx + 1)
                    next_q.append(2 * idx + 2)
            if rightmost is not None:
                res.append(rightmost)
            q = next_q
        return res`,
      templates: {
        python3: "class Solution:\n    def rightSideView(self, nodes: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> rightSideView(vector<int>& nodes) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] rightSideView(int[] nodes) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    rightSideView(nodes) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Diameter of Binary Tree",
      slug: "diameter-of-binary-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, return the length of the diameter of the tree. The diameter of a binary tree is the length of the longest path between any two nodes in a tree.",
      inputFormat: "nodes = [1,2,3,4,5]",
      outputFormat: "3",
      constraintsText: "1 <= nodes.length <= 10^4",
      sampleInput: "nodes = [1,2,3,4,5]",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def diameterOfBinaryTree(self, nodes: list[int]) -> int:
        res = [0]
        def depth(idx):
            if idx >= len(nodes) or nodes[idx] is None:
                return 0
            left = depth(2 * idx + 1)
            right = depth(2 * idx + 2)
            res[0] = max(res[0], left + right)
            return 1 + max(left, right)
        depth(0)
        return res[0]`,
      templates: {
        python3: "class Solution:\n    def diameterOfBinaryTree(self, nodes: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int diameterOfBinaryTree(vector<int>& nodes) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int diameterOfBinaryTree(int[] nodes) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    diameterOfBinaryTree(nodes) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Balanced Binary Tree",
      slug: "balanced-binary-tree",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a binary tree represented as an array `nodes`, determine if it is height-balanced (a binary tree in which the depth of the two subtrees of every node never differs by more than one).",
      inputFormat: "nodes = [3,9,20,None,None,15,7]",
      outputFormat: "true",
      constraintsText: "0 <= nodes.length <= 5000",
      sampleInput: "nodes = [3,9,20,None,None,15,7]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isBalanced(self, nodes: list[int]) -> bool:
        def dfs(idx):
            if idx >= len(nodes) or nodes[idx] is None:
                return [True, 0]
            left, right = dfs(2 * idx + 1), dfs(2 * idx + 2)
            balanced = left[0] and right[0] and abs(left[1] - right[1]) <= 1
            return [balanced, 1 + max(left[1], right[1])]
        return dfs(0)[0]`,
      templates: {
        python3: "class Solution:\n    def isBalanced(self, nodes: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool isBalanced(vector<int>& nodes) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean isBalanced(int[] nodes) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    isBalanced(nodes) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "House Robber II",
      slug: "house-robber-ii",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. All houses at this place are arranged in a circle. Return the maximum amount of money you can rob tonight without alerting the police.",
      inputFormat: "nums = [2,3,2]",
      outputFormat: "3",
      constraintsText: "1 <= nums.length <= 100\n0 <= nums[i] <= 1000",
      sampleInput: "nums = [2,3,2]",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def rob(self, nums: list[int]) -> int:
        if len(nums) == 1:
            return nums[0]
        def helper(n_list):
            r1, r2 = 0, 0
            for n in n_list:
                temp = max(n + r1, r2)
                r1 = r2
                r2 = temp
            return r2
        return max(helper(nums[:-1]), helper(nums[1:]))`,
      templates: {
        python3: "class Solution:\n    def rob(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int rob(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int rob(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    rob(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Coin Change II",
      slug: "coin-change-ii",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money. Return the number of combinations that make up that amount.",
      inputFormat: "amount = 5, coins = [1,2,5]",
      outputFormat: "4",
      constraintsText: "1 <= coins.length <= 300\n1 <= coins[i] <= 5000\n0 <= amount <= 5000",
      sampleInput: "amount = 5\ncoins = [1,2,5]",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def change(self, amount: int, coins: list[int]) -> int:
        dp = [0] * (amount + 1)
        dp[0] = 1
        for coin in coins:
            for i in range(coin, amount + 1):
                dp[i] += dp[i - coin]
        return dp[amount]`,
      templates: {
        python3: "class Solution:\n    def change(self, amount: int, coins: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int change(int amount, vector<int>& coins) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int change(int amount, int[] coins) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    change(amount, coins) {\n        return 0;\n    }\n}"
      }
    }
  ];

  for (const prob of batch10Problems) {
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
      console.log(`[Batch 10] Added: ${prob.title}`);
    }
  }

  console.log("Batch 10 seeding finished! All 100 problems have been inserted.");
}

seedBatch10()
  .catch((e) => {
    console.error("Batch 10 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });