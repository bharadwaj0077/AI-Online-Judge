import { Difficulty, ProblemVisibility } from "@prisma/client";
import { prisma, disconnectDB } from "../src/config/db";

async function seedBatch1() {
  console.log("Seeding Batch 1 (Problems 1 to 10)...");

  const batch1Problems = [
    {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      inputFormat: "nums = [2,7,11,15], target = 9",
      outputFormat: "[0,1]",
      constraintsText: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9",
      sampleInput: "nums = [2,7,11,15]\ntarget = 9",
      sampleOutput: "[0,1]",
      referenceSolution: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, v in enumerate(nums):
            diff = target - v
            if diff in seen:
                return [seen[diff], i]
            seen[v] = i
        return []`,
      templates: {
        python3: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    twoSum(nums, target) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Valid Parentheses",
      slug: "valid-parentheses",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      inputFormat: "s = \"()[]{}\"",
      outputFormat: "true",
      constraintsText: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
      sampleInput: "s = \"()[]{}\"",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {")": "(", "}": "{", "]": "["}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack`,
      templates: {
        python3: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass",
        cpp17: "#include <string>\n#include <stack>\nusing namespace std;\nclass Solution {\npublic:\n    bool isValid(string s) {\n        return true;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public boolean isValid(String s) {\n        return true;\n    }\n}",
        javascript: "class Solution {\n    isValid(s) {\n        return true;\n    }\n}"
      }
    },
    {
      title: "Best Time to Buy and Sell Stock",
      slug: "best-time-to-buy-and-sell-stock",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "You are given an array `prices` where `prices[i]` is the price of a given stock on the i-th day. Return the maximum profit you can achieve from a single transaction.",
      inputFormat: "prices = [7,1,5,3,6,4]",
      outputFormat: "5",
      constraintsText: "1 <= prices.length <= 10^5\n0 <= prices[i] <= 10^4",
      sampleInput: "prices = [7,1,5,3,6,4]",
      sampleOutput: "5",
      referenceSolution: `class Solution:
    def maxProfit(self, prices: list[int]) -> int:
        min_price = float('inf')
        max_profit = 0
        for price in prices:
            if price < min_price:
                min_price = price
            elif price - min_price > max_profit:
                max_profit = price - min_price
        return max_profit`,
      templates: {
        python3: "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int maxProfit(int[] prices) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    maxProfit(prices) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Contains Duplicate",
      slug: "contains-duplicate",
      difficulty: Difficulty.EASY,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.",
      inputFormat: "nums = [1,2,3,1]",
      outputFormat: "true",
      constraintsText: "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
      sampleInput: "nums = [1,2,3,1]",
      sampleOutput: "true",
      referenceSolution: `class Solution:
    def containsDuplicate(self, nums: list[int]) -> bool:
        return len(nums) != len(set(nums))`,
      templates: {
        python3: "class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        pass",
        cpp17: "#include <vector>\n#include <unordered_set>\nusing namespace std;\nclass Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        return false;\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public boolean containsDuplicate(int[] nums) {\n        return false;\n    }\n}",
        javascript: "class Solution {\n    containsDuplicate(nums) {\n        return false;\n    }\n}"
      }
    },
    {
      title: "Maximum Subarray",
      slug: "maximum-subarray",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.",
      inputFormat: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
      outputFormat: "6",
      constraintsText: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4",
      sampleInput: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
      sampleOutput: "6",
      referenceSolution: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        max_sum = nums[0]
        current_sum = nums[0]
        for num in nums[1:]:
            current_sum = max(num, current_sum + num)
            max_sum = max(max_sum, current_sum)
        return max_sum`,
      templates: {
        python3: "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int maxSubArray(int[] nums) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    maxSubArray(nums) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Product of Array Except Self",
      slug: "product-of-array-except-self",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]` without using division.",
      inputFormat: "nums = [1,2,3,4]",
      outputFormat: "[24,12,8,6]",
      constraintsText: "2 <= nums.length <= 10^5\n-30 <= nums[i] <= 30",
      sampleInput: "nums = [1,2,3,4]",
      sampleOutput: "[24,12,8,6]",
      referenceSolution: `class Solution:
    def productExceptSelf(self, nums: list[int]) -> list[int]:
        length = len(nums)
        answer = [1] * length
        prefix = 1
        for i in range(length):
            answer[i] = prefix
            prefix *= nums[i]
        suffix = 1
        for i in range(length - 1, -1, -1):
            answer[i] *= suffix
            suffix *= nums[i]
        return answer`,
      templates: {
        python3: "class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        return new int[]{};\n    }\n}",
        javascript: "class Solution {\n    productExceptSelf(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "3Sum",
      slug: "3sum",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.",
      inputFormat: "nums = [-1,0,1,2,-1,-4]",
      outputFormat: "[[-1,-1,2],[-1,0,1]]",
      constraintsText: "3 <= nums.length <= 3000\n-10^5 <= nums[i] <= 10^5",
      sampleInput: "nums = [-1,0,1,2,-1,-4]",
      sampleOutput: "[[-1,-1,2],[-1,0,1]]",
      referenceSolution: `class Solution:
    def threeSum(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        for i in range(len(nums)-2):
            if i > 0 and nums[i] == nums[i-1]:
                continue
            l, r = i + 1, len(nums) - 1
            while l < r:
                s = nums[i] + nums[l] + nums[r]
                if s < 0:
                    l += 1
                elif s > 0:
                    r -= 1
                else:
                    res.append([nums[i], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l+1]:
                        l += 1
                    while l < r and nums[r] == nums[r-1]:
                        r -= 1
                    l += 1
                    r -= 1
        return res`,
      templates: {
        python3: "class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        return {};\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        return new ArrayList<>();\n    }\n}",
        javascript: "class Solution {\n    threeSum(nums) {\n        return [];\n    }\n}"
      }
    },
    {
      title: "Container With Most Water",
      slug: "container-with-most-water",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `height` of length `n`. Find two lines that together with the x-axis form a container that holds the most water.",
      inputFormat: "height = [1,8,6,2,5,4,8,3,7]",
      outputFormat: "49",
      constraintsText: "2 <= height.length <= 10^5\n0 <= height[i] <= 10^4",
      sampleInput: "height = [1,8,6,2,5,4,8,3,7]",
      sampleOutput: "49",
      referenceSolution: `class Solution:
    def maxArea(self, height: list[int]) -> int:
        l, r = 0, len(height) - 1
        max_area = 0
        while l < r:
            h = min(height[l], height[r])
            max_area = max(max_area, h * (r - l))
            if height[l] < height[r]:
                l += 1
            else:
                r -= 1
        return max_area`,
      templates: {
        python3: "class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int maxArea(int[] height) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    maxArea(height) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Coin Change",
      slug: "coin-change",
      difficulty: Difficulty.MEDIUM,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given an integer array `coins` representing coins of different denominations and an integer `amount`, return the fewest number of coins that you need to make up that amount. If impossible, return -1.",
      inputFormat: "coins = [1,2,5], amount = 11",
      outputFormat: "3",
      constraintsText: "1 <= coins.length <= 12\n0 <= amount <= 10^4",
      sampleInput: "coins = [1,2,5]\namount = 11",
      sampleOutput: "3",
      referenceSolution: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        dp = [float('inf')] * (amount + 1)
        dp[0] = 0
        for coin in coins:
            for x in range(coin, amount + 1):
                dp[x] = min(dp[x], dp[x - coin] + 1)
        return dp[amount] if dp[amount] != float('inf') else -1`,
      templates: {
        python3: "class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    coinChange(coins, amount) {\n        return 0;\n    }\n}"
      }
    },
    {
      title: "Trapping Rain Water",
      slug: "trapping-rain-water",
      difficulty: Difficulty.HARD,
      visibility: ProblemVisibility.PUBLIC,
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
      inputFormat: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
      outputFormat: "6",
      constraintsText: "1 <= height.length <= 2 * 10^4\n0 <= height[i] <= 10^5",
      sampleInput: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
      sampleOutput: "6",
      referenceSolution: `class Solution:
    def trap(self, height: list[int]) -> int:
        if not height:
            return 0
        l, r = 0, len(height) - 1
        left_max, right_max = height[l], height[r]
        water = 0
        while l < r:
            if left_max < right_max:
                l += 1
                left_max = max(left_max, height[l])
                water += left_max - height[l]
            else:
                r -= 1
                right_max = max(right_max, height[r])
                water += right_max - height[r]
        return water`,
      templates: {
        python3: "class Solution:\n    def trap(self, height: list[int]) -> int:\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    int trap(vector<int>& height) {\n        return 0;\n    }\n};",
        java17: "class Solution {\n    public int trap(int[] height) {\n        return 0;\n    }\n}",
        javascript: "class Solution {\n    trap(height) {\n        return 0;\n    }\n}"
      }
    }
  ];

  for (const prob of batch1Problems) {
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
      console.log(`[Batch 1] Added: ${prob.title}`);
    }
  }

  console.log("Batch 1 seeding finished!");
}

seedBatch1()
  .catch((e) => {
    console.error("Batch 1 Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });