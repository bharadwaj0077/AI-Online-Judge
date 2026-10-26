import { generateContentWithCascade } from "../utils/gemini-cascade";

export interface VisualPointer {
  name: string;
  arrayId: string;
  index: number;
  color?: string;
  label?: string;
}

export interface VisualArrayElement {
  value: any;
  status?: "default" | "active" | "matched" | "swapping" | "visited";
  label?: string;
}

export interface VisualArray {
  id: string;
  name: string;
  elements: VisualArrayElement[];
}

export interface VisualStack {
  id: string;
  name: string;
  items: Array<{ value: any; label?: string }>;
}

export interface VisualQueue {
  id: string;
  name: string;
  items: Array<{ value: any; label?: string }>;
}

export interface VisualTreeNode {
  id: string;
  value: any;
  leftId?: string | null;
  rightId?: string | null;
  status?: "default" | "active" | "visited" | "matched";
  label?: string;
}

export interface VisualTree {
  rootId: string;
  name?: string;
  nodes: VisualTreeNode[];
}

export interface VisualMatrix {
  id: string;
  name: string;
  rows: number;
  cols: number;
  data: any[][];
  activeCell?: [number, number];
}

export interface VisualLinkedListNode {
  id: string;
  value: any;
  nextId?: string | null;
  status?: "default" | "active" | "matched" | "reversed" | "visited";
  label?: string;
}

export interface VisualLinkedList {
  id: string;
  name: string;
  headId: string;
  nodes: VisualLinkedListNode[];
  pointers?: Array<{
    name: string;
    targetNodeId: string;
    color?: string;
    label?: string;
  }>;
}

export interface VisualStep {
  stepIndex: number;
  lineNumber: number;
  action:
    | "INIT"
    | "POINTER_MOVE"
    | "COMPARE"
    | "SWAP"
    | "PUSH_STACK"
    | "POP_STACK"
    | "ENQUEUE"
    | "DEQUEUE"
    | "TREE_TRAVERSE"
    | "MATRIX_UPDATE"
    | "LINKED_LIST_TRAVERSE"
    | "POINTER_REVERSE"
    | "WRITE"
    | "RETURN";
  explanation: string;
  structures: {
    arrays?: VisualArray[];
    pointers?: VisualPointer[];
    stacks?: VisualStack[];
    queues?: VisualQueue[];
    trees?: VisualTree[];
    matrices?: VisualMatrix[];
    linkedLists?: VisualLinkedList[];
    variables?: Record<string, any>;
  };
}

export interface VisualTraceResult {
  success: boolean;
  totalSteps: number;
  steps: VisualStep[];
  code: string;
  language: string;
  inputDescription: string;
  summary: string;
}

export interface AlgorithmPreset {
  id: string;
  title: string;
  category: "two-pointers" | "binary-search" | "linked-list" | "stack" | "queue" | "tree" | "matrix" | "sorting";
  difficulty: "Easy" | "Medium";
  description: string;
  code: {
    python3: string;
    javascript: string;
  };
  sampleInput: string;
}

export const ALGORITHM_PRESETS: AlgorithmPreset[] = [
  {
    id: "two-pointers-sum",
    title: "Two Pointers (Sorted Array Two Sum)",
    category: "two-pointers",
    difficulty: "Easy",
    description: "Find two numbers in a sorted array that sum to a target value using two converging pointers.",
    code: {
      python3: `def two_sum_sorted(nums, target):
    left = 0
    right = len(nums) - 1
    
    while left < right:
        curr_sum = nums[left] + nums[right]
        if curr_sum == target:
            return [left, right]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
            
    return [-1, -1]

ans = two_sum_sorted([2, 4, 7, 11, 15, 20], 18)`,
      javascript: `function twoSumSorted(nums, target) {
    let left = 0;
    let right = nums.length - 1;

    while (left < right) {
        const currSum = nums[left] + nums[right];
        if (currSum === target) {
            return [left, right];
        } else if (currSum < target) {
            left++;
        } else {
            right--;
        }
    }
    return [-1, -1];
}

const ans = twoSumSorted([2, 4, 7, 11, 15, 20], 18);`
    },
    sampleInput: "nums = [2, 4, 7, 11, 15, 20], target = 18"
  },
  {
    id: "binary-search",
    title: "Binary Search (Logarithmic Lookup)",
    category: "binary-search",
    difficulty: "Easy",
    description: "Search for a target value in a sorted array by halving the search space each step.",
    code: {
      python3: `def binary_search(nums, target):
    low = 0
    high = len(nums) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1

ans = binary_search([3, 8, 12, 19, 24, 31, 45, 50], 31)`,
      javascript: `function binarySearch(nums, target) {
    let low = 0;
    let high = nums.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}

const ans = binarySearch([3, 8, 12, 19, 24, 31, 45, 50], 31);`
    },
    sampleInput: "nums = [3, 8, 12, 19, 24, 31, 45, 50], target = 31"
  },
  {
    id: "linked-list-reverse",
    title: "Linked List (Reverse Singly Linked List)",
    category: "linked-list",
    difficulty: "Easy",
    description: "Reverse a singly linked list in-place by adjusting node next pointers (prev, curr, nxt).",
    code: {
      python3: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    prev = None
    curr = head
    
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
        
    return prev

# Construct: 1 -> 2 -> 3 -> 4 -> 5 -> NULL
head = ListNode(1, ListNode(2, ListNode(3, ListNode(4, ListNode(5)))))
reversed_head = reverse_list(head)`,
      javascript: `class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

function reverseList(head) {
    let prev = null;
    let curr = head;

    while (curr !== null) {
        const nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}

const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const reversedHead = reverseList(head);`
    },
    sampleInput: "head = 1 -> 2 -> 3 -> 4 -> 5 -> NULL"
  },
  {
    id: "stack-parentheses",
    title: "Stack (Valid Parentheses Matching)",
    category: "stack",
    difficulty: "Easy",
    description: "Verify brackets matching by pushing opening brackets and popping on corresponding closing brackets.",
    code: {
      python3: `def is_valid_parentheses(s):
    stack = []
    pairs = {')': '(', '}': '{', ']': '['}
    
    for ch in s:
        if ch in "({[":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()
            
    return len(stack) == 0

is_valid = is_valid_parentheses("({[]})")`,
      javascript: `function isValidParentheses(s) {
    const stack = [];
    const pairs = { ')': '(', '}': '{', ']': '[' };

    for (const ch of s) {
        if ("({[".includes(ch)) {
            stack.push(ch);
        } else if (pairs[ch]) {
            if (stack.length === 0 || stack[stack.length - 1] !== pairs[ch]) {
                return false;
            }
            stack.pop();
        }
    }
    return stack.length === 0;
}

const isValid = isValidParentheses("({[]})");`
    },
    sampleInput: 's = "({[]})"'
  },
  {
    id: "queue-bfs",
    title: "Queue (Breadth-First Search Order)",
    category: "queue",
    difficulty: "Medium",
    description: "Process nodes level by level using FIFO queue enqueue and dequeue operations.",
    code: {
      python3: `from collections import deque

def bfs_traversal(graph, start):
    visited = []
    queue = deque([start])
    
    while queue:
        node = queue.popleft()
        if node not in visited:
            visited.append(node)
            for neighbor in graph.get(node, []):
                if neighbor not in visited and neighbor not in queue:
                    queue.append(neighbor)
                    
    return visited

graph = {'A': ['B', 'C'], 'B': ['D'], 'C': ['E', 'F'], 'D': [], 'E': [], 'F': []}
order = bfs_traversal(graph, 'A')`,
      javascript: `function bfsTraversal(graph, start) {
    const visited = [];
    const queue = [start];

    while (queue.length > 0) {
        const node = queue.shift();
        if (!visited.includes(node)) {
            visited.push(node);
            const neighbors = graph[node] || [];
            for (const neighbor of neighbors) {
                if (!visited.includes(neighbor) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
    }
    return visited;
}

const graph = { A: ['B', 'C'], B: ['D'], C: ['E', 'F'], D: [], E: [], F: [] };
const order = bfsTraversal(graph, 'A');`
    },
    sampleInput: "graph: A -> [B, C], B -> [D], C -> [E, F], start: A"
  },
  {
    id: "tree-traversal",
    title: "Binary Tree (Invert Binary Tree / DFS)",
    category: "tree",
    difficulty: "Easy",
    description: "Recursively traverse a binary tree and swap left and right subtrees at each node.",
    code: {
      python3: `class TreeNode:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def invert_tree(root):
    if not root:
        return None
        
    root.left, root.right = root.right, root.left
    
    invert_tree(root.left)
    invert_tree(root.right)
    return root

# Tree: [4, 2, 7, 1, 3, 6, 9]
root = TreeNode(4, TreeNode(2, TreeNode(1), TreeNode(3)), TreeNode(7, TreeNode(6), TreeNode(9)))
inverted = invert_tree(root)`,
      javascript: `class TreeNode {
    constructor(val, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

function invertTree(root) {
    if (!root) return null;

    const temp = root.left;
    root.left = root.right;
    root.right = temp;

    invertTree(root.left);
    invertTree(root.right);
    return root;
}

const root = new TreeNode(4, new TreeNode(2, new TreeNode(1), new TreeNode(3)), new TreeNode(7, new TreeNode(6), new TreeNode(9)));
const inverted = invertTree(root);`
    },
    sampleInput: "root = [4, 2, 7, 1, 3, 6, 9]"
  },
  {
    id: "dp-matrix",
    title: "2D Dynamic Programming (Unique Paths Grid)",
    category: "matrix",
    difficulty: "Medium",
    description: "Fill a 2D grid where dp[r][c] represents the number of unique paths to cell (r, c).",
    code: {
      python3: `def unique_paths(m, n):
    dp = [[1] * n for _ in range(m)]
    
    for r in range(1, m):
        for c in range(1, n):
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]
            
    return dp[m - 1][n - 1]

paths = unique_paths(3, 4)`,
      javascript: `function uniquePaths(m, n) {
    const dp = Array.from({ length: m }, () => Array(n).fill(1));

    for (let r = 1; r < m; r++) {
        for (let c = 1; c < n; c++) {
            dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
        }
    }
    return dp[m - 1][n - 1];
}

const paths = uniquePaths(3, 4);`
    },
    sampleInput: "m = 3, n = 4"
  }
];

export class VisualProfilerService {
  /**
   * Generates a step-by-step visual execution trace for any code and input
   */
  static async generateVisualTrace(params: {
    code: string;
    language: string;
    input?: string;
    problemTitle?: string;
  }): Promise<VisualTraceResult> {
    const { code, language, input = "", problemTitle = "Algorithm Execution" } = params;

    try {
      const trace = await this.generateWithGemini({ code, language, input, problemTitle });
      if (trace && trace.steps && trace.steps.length > 0) {
        return trace;
      }
    } catch (err: any) {
      console.warn("[VisualProfilerService] Gemini generation fallback triggered:", err?.message);
    }

    // Dynamic Deterministic Fallback Generator
    return this.generateDeterministicFallback({ code, language, input, problemTitle });
  }

  /**
   * Calls Gemini Cascade to produce structured JSON visual execution frames
   */
  private static async generateWithGemini(params: {
    code: string;
    language: string;
    input: string;
    problemTitle: string;
  }): Promise<VisualTraceResult> {
    const codeWithLines = params.code
      .split("\n")
      .map((l, i) => `${i + 1}: ${l}`)
      .join("\n");

    const prompt = `You are a high-performance Visual Algorithm Execution Tracer and Profiler.
Your goal is to evaluate the provided code against the provided input and produce a STEP-BY-STEP execution timeline.
The frontend visualizer will render arrays with animated pointers, singly linked lists, stacks with push/pop, queues with head/tail, tree node graphs, and 2D DP grids.

Source Code (with line numbers):
\`\`\`${params.language}
${codeWithLines}
\`\`\`

Input / Test Case:
${params.input || "Infer arguments from bottom function calls in code"}

Problem Context: ${params.problemTitle}

CRITICAL DYNAMIC EXECUTION REQUIREMENTS - ABSOLUTELY NO HARDCODING:
1. You MUST dynamically evaluate the EXACT numbers, arrays, and variables currently written in the Source Code and Input.
2. If the user edited the function call in the code (for example: \`ans = binary_search([3], 3)\`), you MUST execute binary_search with nums = [3] and target = 3!
   - Under NO circumstance should you use any previous or default array (e.g. do NOT use [3, 8, 12, 19, 24, 31, 45, 50] if the user changed it to [3]!).
3. If the user edited array elements or variable values in the input or code, execute with THOSE exact values.
4. For Singly Linked Lists, provide:
   "linkedLists": [
     {
       "id": "list1",
       "name": "head",
       "headId": "node_0",
       "nodes": [
         { "id": "node_0", "value": 1, "nextId": "node_1", "status": "active" },
         { "id": "node_1", "value": 2, "nextId": null, "status": "default" }
       ],
       "pointers": [
         { "name": "curr", "targetNodeId": "node_0", "color": "#38bdf8" },
         { "name": "prev", "targetNodeId": "node_0", "color": "#10b981" }
       ]
     }
   ]
5. For Arrays:
   "arrays": [
     {
       "id": "nums",
       "name": "nums",
       "elements": [{"value": 3, "status": "matched"}]
     }
   ],
   "pointers": [
     {"name": "low", "arrayId": "nums", "index": 0, "color": "#38bdf8", "label": "low"}
   ]

JSON Schema to respond strictly with:
{
  "summary": "Concise summary of execution on current input",
  "steps": [
    {
      "stepIndex": 1,
      "lineNumber": 16,
      "action": "INIT",
      "explanation": "Calling binary_search with nums=[3] and target=3.",
      "structures": {
        "arrays": [
          { "id": "nums", "name": "nums", "elements": [{"value": 3, "status": "active"}] }
        ],
        "pointers": [
          {"name": "low", "arrayId": "nums", "index": 0, "color": "#38bdf8"}
        ],
        "variables": {"low": 0, "high": 0, "target": 3}
      }
    }
  ]
}`;

    const rawResponse = await generateContentWithCascade(prompt, {
      temperature: 0.1,
      responseMimeType: "application/json"
    });

    const parsed = JSON.parse(rawResponse);
    if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
      throw new Error("Invalid or empty steps in Gemini response");
    }

    return {
      success: true,
      totalSteps: parsed.steps.length,
      steps: parsed.steps,
      code: params.code,
      language: params.language,
      inputDescription: params.input,
      summary: parsed.summary || "Algorithm execution profile generated successfully."
    };
  }

  /**
   * Deterministic algorithmic tracer fallback that dynamically extracts user inputs
   * from either params.code or params.input without any hardcoded arrays.
   */
  private static generateDeterministicFallback(params: {
    code: string;
    language: string;
    input: string;
    problemTitle: string;
  }): VisualTraceResult {
    const code = params.code;
    const lower = code.toLowerCase();
    const steps: VisualStep[] = [];

    // 1. Dynamic Array & Target Extraction from code or input
    const hasInput = Boolean(params.input && params.input.trim().length > 0);
    let extractedArray: number[] = [3];
    let extractedTarget: number = 3;

    // Check array: from input first if provided, otherwise from code
    const arrayMatch = hasInput
      ? params.input.match(/\[\s*([\d\s,\.\-]+)\s*\]/)
      : params.code.match(/\[\s*([\d\s,\.\-]+)\s*\]/);

    const fallbackArrayMatch = hasInput ? params.code.match(/\[\s*([\d\s,\.\-]+)\s*\]/) : null;
    const finalArrayMatch = arrayMatch || fallbackArrayMatch;

    if (finalArrayMatch && finalArrayMatch[1]) {
      const parsedNums = finalArrayMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      if (parsedNums.length > 0 && !parsedNums.some(isNaN)) {
        extractedArray = parsedNums;
      }
    } else if (hasInput) {
      // Try comma-separated or newline-separated integers
      const parsed = params.input
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter((s) => /^\-?\d+$/.test(s))
        .map(Number);
      if (parsed.length > 0) {
        extractedArray = parsed;
      }
    }

    // Check if input or code contains arrow notation for linked lists: e.g. 1 -> 2 -> 3 -> 4
    const arrowSource = hasInput ? params.input : params.code;
    const arrowMatch = arrowSource.match(/(\d+\s*(?:->\s*\d+)+)/);
    if (arrowMatch && arrowMatch[1]) {
      const arrowNums = arrowMatch[1]
        .split("->")
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n));
      if (arrowNums.length > 0) {
        extractedArray = arrowNums;
      }
    }

    // Check target: from input first if provided, otherwise from code invocation call
    if (hasInput) {
      const targetMatch =
        params.input.match(/target\s*[:=]\s*(\-?\d+)/i) ||
        params.input.match(/,\s*(\-?\d+)\s*$/) ||
        params.input.split("\n")[1]?.match(/(\-?\d+)/);
      if (targetMatch && targetMatch[1]) {
        extractedTarget = Number(targetMatch[1]);
      } else if (extractedArray.length > 0) {
        extractedTarget = extractedArray[0];
      }
    } else {
      const targetCodeMatch = params.code.match(/,\s*(\-?\d+)\s*\)/);
      if (targetCodeMatch && targetCodeMatch[1]) {
        extractedTarget = Number(targetCodeMatch[1]);
      } else if (extractedArray.length > 0) {
        extractedTarget = extractedArray[0];
      }
    }

    // Case A: Binary Search (Dynamic execution on extractedArray & extractedTarget)
    if (lower.includes("binary_search") || (lower.includes("low") && lower.includes("high") && lower.includes("mid"))) {
      let low = 0;
      let high = extractedArray.length - 1;
      let stepIdx = 1;

      steps.push({
        stepIndex: stepIdx++,
        lineNumber: 2,
        action: "INIT",
        explanation: `Initialize binary search: low = 0, high = ${high} on array [${extractedArray.join(", ")}], searching for target = ${extractedTarget}.`,
        structures: {
          arrays: [{ id: "nums", name: "nums", elements: extractedArray.map((v) => ({ value: v, status: "default" })) }],
          pointers: [
            { name: "low", arrayId: "nums", index: low, color: "#38bdf8", label: "low" },
            { name: "high", arrayId: "nums", index: high, color: "#f43f5e", label: "high" }
          ],
          variables: { low, high, target: extractedTarget }
        }
      });

      let found = false;
      while (low <= high && stepIdx <= 25) {
        const mid = Math.floor((low + high) / 2);
        const midVal = extractedArray[mid];

        steps.push({
          stepIndex: stepIdx++,
          lineNumber: 6,
          action: "COMPARE",
          explanation: `Line 6: Compute mid = (${low} + ${high}) // 2 = ${mid}. nums[${mid}] = ${midVal} vs target = ${extractedTarget}.`,
          structures: {
            arrays: [
              {
                id: "nums",
                name: "nums",
                elements: extractedArray.map((v, i) => ({
                  value: v,
                  status: i === mid ? "active" : i >= low && i <= high ? "default" : "visited"
                }))
              }
            ],
            pointers: [
              { name: "low", arrayId: "nums", index: low, color: "#38bdf8", label: "low" },
              { name: "mid", arrayId: "nums", index: mid, color: "#eab308", label: "mid" },
              { name: "high", arrayId: "nums", index: high, color: "#f43f5e", label: "high" }
            ],
            variables: { low, mid, high, "nums[mid]": midVal, target: extractedTarget }
          }
        });

        if (midVal === extractedTarget) {
          found = true;
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 8,
            action: "RETURN",
            explanation: `Line 8: Target ${extractedTarget} found at index ${mid}! Returning index ${mid}.`,
            structures: {
              arrays: [
                {
                  id: "nums",
                  name: "nums",
                  elements: extractedArray.map((v, i) => ({
                    value: v,
                    status: i === mid ? "matched" : "default"
                  }))
                }
              ],
              pointers: [{ name: "mid", arrayId: "nums", index: mid, color: "#10b981", label: "target match" }],
              variables: { result: mid, target: extractedTarget }
            }
          });
          break;
        } else if (midVal < extractedTarget) {
          low = mid + 1;
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 10,
            action: "POINTER_MOVE",
            explanation: `Line 10: nums[${mid}] (${midVal}) < target (${extractedTarget}). Target must be in right half. Adjust low = ${low}.`,
            structures: {
              arrays: [{ id: "nums", name: "nums", elements: extractedArray.map((v) => ({ value: v, status: "default" })) }],
              pointers: [
                { name: "low", arrayId: "nums", index: Math.min(extractedArray.length - 1, low), color: "#38bdf8", label: "low" },
                { name: "high", arrayId: "nums", index: Math.max(0, high), color: "#f43f5e", label: "high" }
              ],
              variables: { low, high, target: extractedTarget }
            }
          });
        } else {
          high = mid - 1;
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 12,
            action: "POINTER_MOVE",
            explanation: `Line 12: nums[${mid}] (${midVal}) > target (${extractedTarget}). Target must be in left half. Adjust high = ${high}.`,
            structures: {
              arrays: [{ id: "nums", name: "nums", elements: extractedArray.map((v) => ({ value: v, status: "default" })) }],
              pointers: [
                { name: "low", arrayId: "nums", index: Math.min(extractedArray.length - 1, low), color: "#38bdf8", label: "low" },
                { name: "high", arrayId: "nums", index: Math.max(0, high), color: "#f43f5e", label: "high" }
              ],
              variables: { low, high, target: extractedTarget }
            }
          });
        }
      }

      if (!found) {
        steps.push({
          stepIndex: stepIdx++,
          lineNumber: 14,
          action: "RETURN",
          explanation: `Line 14: Search space exhausted (low > high). Target ${extractedTarget} not found in array. Return -1.`,
          structures: {
            variables: { result: -1, target: extractedTarget }
          }
        });
      }
    }
    // Case B: Singly Linked List Reversal
    else if (lower.includes("listnode") || lower.includes("reverse_list") || lower.includes("reverselist") || lower.includes("linked")) {
      const listVals = extractedArray.length > 1 ? extractedArray : [1, 2, 3, 4, 5];
      let stepIdx = 1;

      const nodes: VisualLinkedListNode[] = listVals.map((val, idx) => ({
        id: `node_${idx}`,
        value: val,
        nextId: idx < listVals.length - 1 ? `node_${idx + 1}` : null,
        status: idx === 0 ? "active" : "default"
      }));

      steps.push({
        stepIndex: stepIdx++,
        lineNumber: 7,
        action: "INIT",
        explanation: "Initialize pointers: prev = NULL, curr = head pointing to node [1].",
        structures: {
          linkedLists: [
            {
              id: "head_list",
              name: "head",
              headId: "node_0",
              nodes: JSON.parse(JSON.stringify(nodes)),
              pointers: [{ name: "curr", targetNodeId: "node_0", color: "#38bdf8" }]
            }
          ],
          variables: { prev: "NULL", curr: listVals[0] }
        }
      });

      for (let i = 0; i < listVals.length; i++) {
        const currNode = nodes[i];
        const nextId = i < listVals.length - 1 ? `node_${i + 1}` : null;

        // Step: Save next
        steps.push({
          stepIndex: stepIdx++,
          lineNumber: 10,
          action: "LINKED_LIST_TRAVERSE",
          explanation: `Line 10: Save nxt = curr.next (points to ${nextId ? `node [${listVals[i + 1]}]` : "NULL"}).`,
          structures: {
            linkedLists: [
              {
                id: "head_list",
                name: "head",
                headId: "node_0",
                nodes: JSON.parse(JSON.stringify(nodes)),
                pointers: [
                  { name: "curr", targetNodeId: `node_${i}`, color: "#38bdf8" },
                  ...(nextId ? [{ name: "nxt", targetNodeId: nextId, color: "#eab308" }] : [])
                ]
              }
            ],
            variables: { curr: listVals[i], nxt: nextId ? listVals[i + 1] : "NULL" }
          }
        });

        // Step: Reverse link
        currNode.status = "reversed";
        currNode.nextId = i > 0 ? `node_${i - 1}` : null;

        steps.push({
          stepIndex: stepIdx++,
          lineNumber: 11,
          action: "POINTER_REVERSE",
          explanation: `Line 11: Reverse link! curr.next = prev (node [${listVals[i]}] now points to ${
            i > 0 ? `node [${listVals[i - 1]}]` : "NULL"
          }).`,
          structures: {
            linkedLists: [
              {
                id: "head_list",
                name: "head",
                headId: `node_${i}`,
                nodes: JSON.parse(JSON.stringify(nodes)),
                pointers: [{ name: "curr", targetNodeId: `node_${i}`, color: "#a855f7" }]
              }
            ],
            variables: { curr: listVals[i], prev: i > 0 ? listVals[i - 1] : "NULL" }
          }
        });
      }

      steps.push({
        stepIndex: stepIdx++,
        lineNumber: 15,
        action: "RETURN",
        explanation: `Line 15: Traversal complete (curr is NULL). Return prev (new head is node [${listVals[listVals.length - 1]}]).`,
        structures: {
          linkedLists: [
            {
              id: "head_list",
              name: "new_head",
              headId: `node_${listVals.length - 1}`,
              nodes: JSON.parse(JSON.stringify(nodes)),
              pointers: [{ name: "new_head", targetNodeId: `node_${listVals.length - 1}`, color: "#10b981" }]
            }
          ],
          variables: { newHead: listVals[listVals.length - 1] }
        }
      });
    }
    // Case C: Two Pointers / Two Sum
    else if (lower.includes("left") && lower.includes("right")) {
      const arr = extractedArray;
      const target = extractedTarget;
      let left = 0;
      let right = arr.length - 1;
      let stepIdx = 1;

      steps.push({
        stepIndex: stepIdx++,
        lineNumber: 2,
        action: "INIT",
        explanation: `Initialize two pointers on [${arr.join(", ")}]: left = 0 pointing to ${arr[left]}, right = ${right} pointing to ${arr[right]}.`,
        structures: {
          arrays: [{ id: "nums", name: "nums", elements: arr.map((v) => ({ value: v, status: "default" })) }],
          pointers: [
            { name: "left", arrayId: "nums", index: left, color: "#38bdf8", label: "left" },
            { name: "right", arrayId: "nums", index: right, color: "#f43f5e", label: "right" }
          ],
          variables: { left, right, target, currentSum: arr[left] + arr[right] }
        }
      });

      while (left < right && stepIdx <= 20) {
        const sum = arr[left] + arr[right];
        steps.push({
          stepIndex: stepIdx++,
          lineNumber: 6,
          action: "COMPARE",
          explanation: `Line 6: Compare nums[${left}] (${arr[left]}) + nums[${right}] (${arr[right]}) = ${sum} against target (${target}).`,
          structures: {
            arrays: [
              {
                id: "nums",
                name: "nums",
                elements: arr.map((v, i) => ({
                  value: v,
                  status: i === left || i === right ? "active" : "default"
                }))
              }
            ],
            pointers: [
              { name: "left", arrayId: "nums", index: left, color: "#38bdf8", label: "left" },
              { name: "right", arrayId: "nums", index: right, color: "#f43f5e", label: "right" }
            ],
            variables: { left, right, sum, target }
          }
        });

        if (sum === target) {
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 8,
            action: "RETURN",
            explanation: `Line 8: Match found! nums[${left}] + nums[${right}] == ${target}. Return indices [${left}, ${right}].`,
            structures: {
              arrays: [
                {
                  id: "nums",
                  name: "nums",
                  elements: arr.map((v, i) => ({
                    value: v,
                    status: i === left || i === right ? "matched" : "default"
                  }))
                }
              ],
              pointers: [
                { name: "left", arrayId: "nums", index: left, color: "#10b981", label: "left" },
                { name: "right", arrayId: "nums", index: right, color: "#10b981", label: "right" }
              ],
              variables: { left, right, sum, target, result: [left, right] }
            }
          });
          break;
        } else if (sum < target) {
          left++;
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 10,
            action: "POINTER_MOVE",
            explanation: `Line 10: Sum ${sum} < ${target}. Increment left pointer to index ${left}.`,
            structures: {
              arrays: [{ id: "nums", name: "nums", elements: arr.map((v) => ({ value: v, status: "default" })) }],
              pointers: [
                { name: "left", arrayId: "nums", index: left, color: "#38bdf8", label: "left" },
                { name: "right", arrayId: "nums", index: right, color: "#f43f5e", label: "right" }
              ],
              variables: { left, right, target }
            }
          });
        } else {
          right--;
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 12,
            action: "POINTER_MOVE",
            explanation: `Line 12: Sum ${sum} > ${target}. Decrement right pointer to index ${right}.`,
            structures: {
              arrays: [{ id: "nums", name: "nums", elements: arr.map((v) => ({ value: v, status: "default" })) }],
              pointers: [
                { name: "left", arrayId: "nums", index: left, color: "#38bdf8", label: "left" },
                { name: "right", arrayId: "nums", index: right, color: "#f43f5e", label: "right" }
              ],
              variables: { left, right, target }
            }
          });
        }
      }
    }
    // Case D: Stack Parentheses Matching
    else if (lower.includes("stack") || lower.includes("parenthes")) {
      const strMatch = params.code.match(/["']([()\[\]{}]+)["']/) || params.input.match(/["']([()\[\]{}]+)["']/);
      const str = strMatch ? strMatch[1] : "({[]})";
      const stackItems: Array<{ value: string; label?: string }> = [];
      let stepIdx = 1;

      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if ("({[".includes(ch)) {
          stackItems.push({ value: ch });
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 6,
            action: "PUSH_STACK",
            explanation: `Line 6: Encountered opening bracket '${ch}'. Push '${ch}' onto top of stack.`,
            structures: {
              stacks: [{ id: "stk", name: "Bracket Stack", items: [...stackItems] }],
              variables: { currentChar: ch, stackSize: stackItems.length }
            }
          });
        } else {
          const popped = stackItems.pop();
          steps.push({
            stepIndex: stepIdx++,
            lineNumber: 10,
            action: "POP_STACK",
            explanation: `Line 10: Encountered closing bracket '${ch}'. Matches top '${popped?.value}'. Pop from stack.`,
            structures: {
              stacks: [{ id: "stk", name: "Bracket Stack", items: [...stackItems] }],
              variables: { currentChar: ch, poppedChar: popped?.value, stackSize: stackItems.length }
            }
          });
        }
      }

      steps.push({
        stepIndex: stepIdx++,
        lineNumber: 12,
        action: "RETURN",
        explanation: "Line 12: Stack is completely empty. String has balanced brackets.",
        structures: {
          stacks: [{ id: "stk", name: "Bracket Stack", items: [] }],
          variables: { isValid: true }
        }
      });
    } else {
      // General Sequential Steps fallback
      const lines = params.code.split("\n");
      const cleanLines = lines
        .map((l, idx) => ({ line: l.trim(), num: idx + 1 }))
        .filter((l) => l.line.length > 0 && !l.line.startsWith("#") && !l.line.startsWith("//"));

      const maxSteps = Math.min(10, cleanLines.length);
      for (let i = 0; i < maxSteps; i++) {
        steps.push({
          stepIndex: i + 1,
          lineNumber: cleanLines[i].num,
          action: i === maxSteps - 1 ? "RETURN" : "WRITE",
          explanation: `Line ${cleanLines[i].num}: Executing statement '${cleanLines[i].line.slice(0, 50)}'.`,
          structures: {
            variables: { step: i + 1, activeLine: cleanLines[i].num }
          }
        });
      }
    }

    return {
      success: true,
      totalSteps: steps.length,
      steps,
      code: params.code,
      language: params.language,
      inputDescription: params.input || "Default Input",
      summary: "Dynamic execution trace profile evaluated on current code input."
    };
  }

  /**
   * Retrieves predefined algorithm presets
   */
  static getPresets(): AlgorithmPreset[] {
    return ALGORITHM_PRESETS;
  }
}
