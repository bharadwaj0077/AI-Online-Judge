import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch9() {
  console.log("Seeding Batch 9 (Problems 81 to 90)...");

  const batch9Problems = [
    {
      title: "Linked List Cycle",
      slug: "linked-list-cycle",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given `head`, the head of a linked list represented as an array, and a `pos` integer representing the index where the tail connects to, determine if the linked list has a cycle in it.",
      inputFormat: "head = [3,2,0,-4], pos = 1",
      outputFormat: "true",
      constraintsText: "The number of nodes in the list is in the range [0, 10^4].\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index in the linked-list.",
      sampleInput: "head = [3,2,0,-4]\npos = 1",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def hasCycle(self, head: list[int], pos: int) -> bool:
        return pos != -1`,
      templates: {
        python3: "class Solution:\n    def hasCycle(self, head: list[int], pos: int) -> bool:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    bool hasCycle(vector<int>& head, int pos) {\n        return false;\n    }\n};",
        java17: "class Solution {\n    public boolean hasCycle(int[] head, int pos) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    hasCycle(head, pos) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Linked List Cycle II",
      slug: "linked-list-cycle-ii",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the head of a linked list represented as an array `head` and an integer `pos`, return the index of the node where the cycle begins. If there is no cycle, return -1.",
      inputFormat: "head = [3,2,0,-4], pos = 1",
      outputFormat: "1",
      constraintsText: "0 <= head.length <= 10^4\npos is -1 or a valid index.",
      sampleInput: "head = [3,2,0,-4]\npos = 1",
      sampleOutput: "1",
      referenceSolution: `class Solution:
    def detectCycle(self, head: list[int], pos: int) -> int:
        return pos`,
      templates: {
        python3: "class Solution:\n    def detectCycle(self, head: list[int], pos: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int detectCycle(vector<int>& head, int pos) {\n        return -1;\n    }\n};",
        java17: "class Solution {\n    public int detectCycle(int[] head, int pos) {\n        return -1;\n    }\n}",
        javascript: "class Solution {\n    detectCycle(head, pos) {\n        return -1;\n    }\n}"
      }
    },
    {
      title: "Lowest Common Ancestor of a Binary Search Tree",
      slug: "lowest-common-ancestor-of-a-binary-search-tree",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a binary search tree (BST) represented as an array `nodes`, find the lowest common ancestor (LCA) node of two given nodes `p` and `q`.",
      inputFormat: "nodes = [6,2,8,0,4,7,9,None,None,3,5], p = 2, q = 8",
      outputFormat: "6",
      constraintsText: "All node values are unique.\np and q exist in the BST.",
      sampleInput: "nodes = [6,2,8,0,4,7,9,None,None,3,5]\np = 2\nq = 8",
      sampleOutput: "6",
      referenceSolution: `class Solution:
    def lowestCommonAncestor(self, nodes: list[int], p: int, q: int) -> int:
        curr = 0
        while curr < len(nodes) and nodes[curr] is not None:
            val = nodes[curr]
            if p > val and q > val:
                curr = 2 * curr + 2
            elif p < val and q < val:
                curr = 2 * curr + 1
            else:
                return val
        return nodes[0]`,
      templates: {
        python3: "class Solution:\n    def lowestCommonAncestor(self, nodes: list[int], p: int, q: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int lowestCommonAncestor(vector<int>& nodes, int p, int q) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int lowestCommonAncestor(int[] nodes, int p, int q) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    lowestCommonAncestor(nodes, p, q) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Kth Smallest Element in a Sorted Matrix",
      slug: "kth-smallest-element-in-a-sorted-matrix",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an `n x n` `matrix` where each of the rows and columns is sorted in ascending order, return the `k`-th smallest element in the matrix.",
      inputFormat: "matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8",
      outputFormat: "13",
      constraintsText: "n == matrix.length == matrix[i].length\n1 <= n <= 300\n1 <= k <= n^2",
      sampleInput: "matrix = [[1,5,9],[10,11,13],[12,13,15]]\nk = 8",
      sampleOutput: "13",
      referenceSolution: `class Solution:
    def kthSmallest(self, matrix: list[list[int]], k: int) -> int:
        elements = []
        for row in matrix:
            elements.extend(row)
        elements.sort()
        return elements[k - 1]`,
      templates: {
        python3: "class Solution:\n    def kthSmallest(self, matrix: list[list[int]], k: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int kthSmallest(vector<vector<int>>& matrix, int k) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int kthSmallest(int[][] matrix, int k) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    kthSmallest(matrix, k) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Find Median from Data Stream",
      slug: "find-median-from-data-stream",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of numbers `nums` added sequentially, return the median value after processing all elements.",
      inputFormat: "nums = [1,2,3]",
      outputFormat: "2.0",
      constraintsText: "1 <= nums.length <= 5 * 10^4",
      sampleInput: "nums = [1,2,3]",
      sampleOutput: "2.0",
      referenceSolution: `class Solution:
    def findMedian(self, nums: list[int]) -> float:
        s = sorted(nums)
        n = len(s)
        if n % 2 == 1:
            return float(s[n // 2])
        return (s[n // 2 - 1] + s[n // 2]) / 2.0`,
      templates: {
        python3: "class Solution:\n    def findMedian(self, nums: list[int]) -> float:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    double findMedian(vector<int>& nums) {\n        return 0.0;\n    }\n};",
        java17: "class Solution {\n    public double findMedian(int[] nums) {\n        return 0.0;\n    }\n}",
        javascript: "class Solution {\n    findMedian(nums) {\n        return 0.0;\n    }\n}"
      }
    },
    {
      title: "Reconstruct Itinerary",
      slug: "reconstruct-itinerary",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given a list of airline `tickets` where `tickets[i] = [from_i, to_i]` represent the departure and arrival airports of a flight. Reconstruct the itinerary in order and return it starting from \"JFK\".",
      inputFormat: "tickets = [[\"MUC\",\"LHR\"],[\"JFK\",\"MUC\"],[\"SFO\",\"SJC\"],[\"LHR\",\"SFO\"]]",
      outputFormat: "[\"JFK\",\"MUC\",\"LHR\",\"SFO\",\"SJC\"]",
      constraintsText: "1 <= tickets.length <= 300\ntickets[i].length == 2",
      sampleInput: "tickets = [[\"MUC\",\"LHR\"],[\"JFK\",\"MUC\"],[\"SFO\",\"SJC\"],[\"LHR\",\"SFO\"]]",
      sampleOutput: "[\"JFK\",\"MUC\",\"LHR\",\"SFO\",\"SJC\"]",
      referenceSolution: `from collections import defaultdict
class Solution:
    def findItinerary(self, tickets: list[list[str]]) -> list[str]:
        adj = defaultdict(list)
        tickets.sort(key=lambda x: x[1], reverse=True)
        for src, dst in tickets:
            adj[src].append(dst)
        res = []
        def dfs(src):
            while adj[src]:
                dfs(adj[src].pop())
            res.append(src)
        dfs("JFK")
        return res[::-1]`,
      templates: {
        python3: "class Solution:\n    def findItinerary(self, tickets: list[list[str]]) -> list[str]:\n        pass",
        cpp17: "#include <vector>\n#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    vector<string> findItinerary(vector<vector<string>>& tickets) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<String> findItinerary(List<List<String>> tickets) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    findItinerary(tickets) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Longest Repeating Character Replacement",
      slug: "longest-repeating-character-replacement",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given a string `s` and an integer `k`. You can choose any character of the string and change it to any other uppercase English character at most `k` times. Return the length of the longest substring containing the same letter you can get after performing the operations.",
      inputFormat: "s = \"ABAB\", k = 2",
      outputFormat: "4",
      constraintsText: "1 <= s.length <= 10^5\n0 <= k <= s.length",
      sampleInput: "s = \"ABAB\"\nk = 2",
      sampleOutput: "4",
      referenceSolution: `class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        count = {}
        res = 0
        l = 0
        max_f = 0
        for r in range(len(s)):
            count[s[r]] = 1 + count.get(s[r], 0)
            max_f = max(max_f, count[s[r]])
            while (r - l + 1) - max_f > k:
                count[s[l]] -= 1
                l += 1
            res = max(res, r - l + 1)
        return res`,
      templates: {
        python3: "class Solution:\n    def characterReplacement(self, s: str, k: int) -> int:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int characterReplacement(String s, int k) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    characterReplacement(s, k) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Non-overlapping Intervals",
      slug: "non-overlapping-intervals",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of intervals `intervals` where `intervals[i] = [start_i, end_i]`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.",
      inputFormat: "intervals = [[1,2],[2,3],[3,4],[1,3]]",
      outputFormat: "1",
      constraintsText: "1 <= intervals.length <= 10^5\nintervals[i].length == 2",
      sampleInput: "intervals = [[1,2],[2,3],[3,4],[1,3]]",
      sampleOutput: "1",
      referenceSolution: `class Solution:
    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[1])
        res = 0
        prev_end = float('-inf')
        for start, end in intervals:
            if start >= prev_end:
                prev_end = end
            else:
                res += 1
        return res`,
      templates: {
        python3: "class Solution:\n    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int eraseOverlapIntervals(vector<vector<int>>& intervals) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int eraseOverlapIntervals(int[][] intervals) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    eraseOverlapIntervals(intervals) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Minimum Window Substring",
      slug: "minimum-window-substring",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given two strings `s` and `t` of lengths `m` and `n` respectively, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If there is no such substring, return the empty string \"\".",
      inputFormat: "s = \"ADOBECODEBANC\", t = \"ABC\"",
      outputFormat: "\"BANC\"",
      constraintsText: "1 <= s.length, t.length <= 10^5",
      sampleInput: "s = \"ADOBECODEBANC\"\nt = \"ABC\"",
      sampleOutput: "\"BANC\"",
      referenceSolution: `from collections import Counter
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        if not t or not s:
            return ""
        dict_t = Counter(t)
        required = len(dict_t)
        l, r = 0, 0
        formed = 0
        window_counts = {}
        ans = float("inf"), None, None
        while r < len(s):
            character = s[r]
            window_counts[character] = window_counts.get(character, 0) + 1
            if character in dict_t and window_counts[character] == dict_t[character]:
                formed += 1
            while l <= r and formed == required:
                character = s[l]
                if r - l + 1 < ans[0]:
                    ans = (r - l + 1, l, r)
                window_counts[character] -= 1
                if character in dict_t and window_counts[character] < dict_t[character]:
                    formed -= 1
                l += 1
            r += 1
        return "" if ans[0] == float("inf") else s[ans[1] : ans[2] + 1]`,
      templates: {
        python3: "class Solution:\n    def minWindow(self, s: str, t: str) -> str:\n        pass",
        cpp17: "#include <string>\nusing namespace std;\nclass Solution {\npublic:\n    string minWindow(string s, string t) {\n        return \"\";\n    }\n};",
        java17: "class Solution {\n    public String minWindow(String s, String t) {\n        return \"\";\n    }\n}",
        javascript: "class Solution {\n    minWindow(s, t) {\n        return \"\";\n    }\n}"
      }
    },
    {
      title: "Binary Tree Zigzag Level Order Traversal",
      slug: "binary-tree-zigzag-level-order-traversal",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given the root of a binary tree represented as an array `nodes`, return the zigzag level order traversal of its nodes' values (i.e., from left to right, then right to left for the next level and alternate between).",
      inputFormat: "nodes = [3,9,20,None,None,15,7]",
      outputFormat: "[[3],[20,9],[15,7]]",
      constraintsText: "0 <= nodes.length <= 2000",
      sampleInput: "nodes = [3,9,20,None,None,15,7]",
      sampleOutput: "[[3],[20,9],[15,7]]",
      referenceSolution: `class Solution:
    def zigzagLevelOrder(self, nodes: list[int]) -> list[list[int]]:
        if not nodes or nodes[0] is None:
            return []
        res = []
        q = [0]
        left_to_right = True
        while q:
            level = []
            next_q = []
            for idx in q:
                if idx < len(nodes) and nodes[idx] is not None:
                    level.append(nodes[idx])
                    next_q.append(2 * idx + 1)
                    next_q.append(2 * idx + 2)
            if level:
                res.append(level if left_to_right else level[::-1])
                left_to_right = not left_to_right
            q = next_q
        return res`,
      templates: {
        python3: "class Solution:\n    def zigzagLevelOrder(self, nodes: list[int]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> zigzagLevelOrder(vector<int>& nodes) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> zigzagLevelOrder(int[] nodes) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    zigzagLevelOrder(nodes) {\n        return [];\n    }\n}"
      }
    }
  ];

  for (const prob of batch9Problems) {
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
      console.log(`[Batch 9] Added: ${prob.title}`);
    }
  }

  console.log("Batch 9 seeding finished!");
}

seedBatch9()
  .catch((e) => {
    console.error("Batch 9 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });