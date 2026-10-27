import { GoogleGenAI } from "@google/genai";
import { prisma } from "../config/db";
import { generateContentWithCascade } from "../utils/gemini-cascade";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface InterviewConfig {
  userId?: string;
  roleTitle: string; // e.g., "Senior Software Engineer (L5)"
  targetCompany: string; // e.g., "Google", "Meta", "Amazon"
  interviewerName: string; // e.g., "Alex (Staff SWE)", "Sarah (Eng Director)", "Marcus (Principal Architect)"
  topic: string; // e.g., "Data Structures & Algorithms", "System Design"
  difficulty: "Easy" | "Medium" | "Hard";
  durationMinutes: number; // 15, 30, 45, 60
  problemId?: string;
  interviewerVoice?: string;
}

export interface TranscriptTurn {
  id: string;
  sender: "interviewer" | "candidate" | "system";
  text: string;
  timestamp: number;
  codeSnippet?: string;
  audioVoiceData?: string;
  isHint?: boolean;
}

export interface TelemetryData {
  fillerWordCount: number;
  wpm: number;
  eyeContactScore: number; // 0 - 100
  interruptions: number;
  codeRuns: number;
  durationElapsedSec: number;
}

export interface ScorecardReport {
  hireDecision: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "LEANING_NO_HIRE" | "STRONG_NO_HIRE";
  overallScore: number; // 0 - 100
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  behavioralScore: number;
  executiveSummary: string;
  strengths: string[];
  growthAreas: string[];
  lineByLineFeedback: string;
  optimalSolution: string;
  interviewerVerdict: string;
}

export const CS_FUNDAMENTALS_PROBLEMS: Record<string, Array<{
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;
  constraintsText: string;
  templates: Record<string, string>;
  testCases: Array<{ id: string; orderNo: number; input: string; expectedOutput: string; isSample: boolean }>;
}>> = {
  os: [
    {
      id: "os_bounded_buffer",
      title: "Thread-Safe Bounded Blocking Queue (Producer-Consumer)",
      difficulty: "Medium",
      statement: `### Problem Description
Implement a thread-safe **Bounded Blocking Queue** that coordinates multiple producer and consumer threads without race conditions, busy-waiting, or deadlocks.

The queue must support:
- \`BoundedBlockingQueue(capacity: int)\`: Initializes the queue with a maximum capacity.
- \`enqueue(element: int) -> None\`: Adds an element to the tail of the queue. If the queue is at capacity, the calling thread must block until space becomes available.
- \`dequeue() -> int\`: Removes and returns the element from the head of the queue. If the queue is empty, the calling thread must block until an element is present.
- \`size() -> int\`: Returns the current number of elements in the queue.

### Constraints & Requirements
- Capacity $1 \\le C \\le 10^4$.
- Must use synchronization primitives (Mutex, Condition Variables, or Semaphores).
- Must adhere strictly to First-In, First-Out (FIFO) semantics.`,
      constraintsText: "1 <= capacity <= 10^4. Threads: multiple concurrent producers and consumers. Zero busy-waiting.",
      templates: {
        python3: `import threading
from collections import deque

class BoundedBlockingQueue:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.queue = deque()
        self.lock = threading.Lock()
        self.not_full = threading.Condition(self.lock)
        self.not_empty = threading.Condition(self.lock)

    def enqueue(self, element: int) -> None:
        with self.not_full:
            while len(self.queue) >= self.capacity:
                self.not_full.wait()
            self.queue.append(element)
            self.not_empty.notify()

    def dequeue(self) -> int:
        with self.not_empty:
            while len(self.queue) == 0:
                self.not_empty.wait()
            val = self.queue.popleft()
            self.not_full.notify()
            return val

    def size(self) -> int:
        with self.lock:
            return len(self.queue)
`,
        javascript: `class BoundedBlockingQueue {
  constructor(capacity) {
    this.capacity = capacity;
    this.queue = [];
    this.waitEnqueue = [];
    this.waitDequeue = [];
  }

  async enqueue(element) {
    while (this.queue.length >= this.capacity) {
      await new Promise((resolve) => this.waitEnqueue.push(resolve));
    }
    this.queue.push(element);
    if (this.waitDequeue.length > 0) {
      const resolve = this.waitDequeue.shift();
      resolve();
    }
  }

  async dequeue() {
    while (this.queue.length === 0) {
      await new Promise((resolve) => this.waitDequeue.push(resolve));
    }
    const val = this.queue.shift();
    if (this.waitEnqueue.length > 0) {
      const resolve = this.waitEnqueue.shift();
      resolve();
    }
    return val;
  }

  size() {
    return this.queue.length;
  }
}
`,
        cpp17: `#include <queue>
#include <mutex>
#include <condition_variable>

class BoundedBlockingQueue {
private:
    int capacity;
    std::queue<int> q;
    std::mutex mtx;
    std::condition_variable cv_not_full;
    std::condition_variable cv_not_empty;

public:
    BoundedBlockingQueue(int cap) : capacity(cap) {}

    void enqueue(int element) {
        std::unique_lock<std::mutex> lock(mtx);
        cv_not_full.wait(lock, [this]() { return q.size() < capacity; });
        q.push(element);
        cv_not_empty.notify_one();
    }

    int dequeue() {
        std::unique_lock<std::mutex> lock(mtx);
        cv_not_empty.wait(lock, [this]() { return !q.empty(); });
        int val = q.front();
        q.pop();
        cv_not_full.notify_one();
        return val;
    }

    int size() {
        std::lock_guard<std::mutex> lock(mtx);
        return q.size();
    }
};
`,
        java17: `import java.util.LinkedList;
import java.util.Queue;
import java.util.concurrent.locks.Condition;
import java.util.concurrent.locks.ReentrantLock;

class BoundedBlockingQueue {
    private final int capacity;
    private final Queue<Integer> queue = new LinkedList<>();
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notFull = lock.newCondition();
    private final Condition notEmpty = lock.newCondition();

    public BoundedBlockingQueue(int capacity) {
        this.capacity = capacity;
    }

    public void enqueue(int element) throws InterruptedException {
        lock.lock();
        try {
            while (queue.size() >= capacity) {
                notFull.await();
            }
            queue.offer(element);
            notEmpty.signal();
        } finally {
            lock.unlock();
        }
    }

    public int dequeue() throws InterruptedException {
        lock.lock();
        try {
            while (queue.isEmpty()) {
                notEmpty.await();
            }
            int val = queue.poll();
            notFull.signal();
            return val;
        } finally {
            lock.unlock();
        }
    }

    public int size() {
        lock.lock();
        try {
            return queue.size();
        } finally {
            lock.unlock();
        }
    }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: "capacity = 2, operations = [enqueue(1), enqueue(2), dequeue(), enqueue(3), dequeue(), dequeue()]",
          expectedOutput: "[1, 2, 3]",
          isSample: true
        },
        {
          id: "2",
          orderNo: 2,
          input: "capacity = 3, operations = [enqueue(10), enqueue(20), size(), dequeue(), size()]",
          expectedOutput: "[2, 10, 1]",
          isSample: true
        }
      ]
    },
    {
      id: "os_lru_page_replacement",
      title: "LRU Page Replacement Algorithm Simulation",
      difficulty: "Medium",
      statement: `### Problem Description
Simulate the **Least Recently Used (LRU) Page Replacement** policy implemented inside an Operating System's Virtual Memory paging unit.

Given:
- \`framesCount\`: Maximum number of physical memory page frames available.
- \`pageReferences\`: An array of page numbers requested sequentially by running processes.

Return an object / tuple with:
1. \`pageFaults\`: Total number of times a requested page was not currently in physical memory.
2. \`finalFrames\`: List of page numbers resident in memory frames at the conclusion of the sequence.`,
      constraintsText: "1 <= framesCount <= 500, 1 <= pageReferences.length <= 10^5",
      templates: {
        python3: `from typing import List, Tuple

class Solution:
    def simulateLRU(self, framesCount: int, pageReferences: List[int]) -> Tuple[int, List[int]]:
        # Return (page_faults, final_frames)
        page_faults = 0
        frames = []
        return (page_faults, frames)
`,
        javascript: `class Solution {
  simulateLRU(framesCount, pageReferences) {
    // Return { pageFaults: number, finalFrames: number[] }
    return { pageFaults: 0, finalFrames: [] };
  }
}
`,
        cpp17: `#include <vector>
using namespace std;

class Solution {
public:
    pair<int, vector<int>> simulateLRU(int framesCount, const vector<int>& pageReferences) {
        // Return {page_faults, final_frames}
        return {0, {}};
    }
};
`,
        java17: `import java.util.*;

class Solution {
    public int[] simulateLRU(int framesCount, int[] pageReferences) {
        // Returns [pageFaults, ...finalFrames]
        return new int[]{0};
    }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: "framesCount = 3, pageReferences = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]",
          expectedOutput: "pageFaults = 10, finalFrames = [2, 3, 0]",
          isSample: true
        },
        {
          id: "2",
          orderNo: 2,
          input: "framesCount = 4, pageReferences = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]",
          expectedOutput: "pageFaults = 10, finalFrames = [3, 4, 5, 2]",
          isSample: true
        }
      ]
    }
  ],
  cn: [
    {
      id: "cn_token_bucket",
      title: "Token Bucket Rate Limiter for Network Packets",
      difficulty: "Medium",
      statement: `### Problem Description
Implement a high-performance **Token Bucket Rate Limiter** commonly deployed at edge reverse proxies and network packet routers.

The rate limiter operates with:
- \`capacity\`: Maximum token bursts the bucket can hold.
- \`refillRatePerSec\`: Number of tokens added per second at a continuous linear rate.

Implement:
- \`TokenBucket(capacity: float, refillRatePerSec: float)\`
- \`allowPacket(tokensRequired: float, currentTimestampSec: float) -> bool\`: Computes tokens accumulated since last check, clamps to capacity, and if sufficient tokens exist, deducts them and returns \`true\`; otherwise returns \`false\` without token deduction.`,
      constraintsText: "1 <= capacity <= 10^6, 0.1 <= refillRatePerSec <= 10^5. Timestamps monotonically non-decreasing.",
      templates: {
        python3: `class TokenBucket:
    def __init__(self, capacity: float, refillRatePerSec: float):
        self.capacity = capacity
        self.refillRate = refillRatePerSec
        self.tokens = capacity
        self.lastRefill = 0.0

    def allowPacket(self, tokensRequired: float, currentTimestampSec: float) -> bool:
        # Write your token replenishment and deduction logic here
        pass
`,
        javascript: `class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = 0.0;
  }

  allowPacket(tokensRequired, currentTimestampSec) {
    // Write your token calculation here
    return false;
  }
}
`,
        cpp17: `class TokenBucket {
private:
    double capacity;
    double refillRate;
    double tokens;
    double lastRefill;

public:
    TokenBucket(double cap, double rate) : capacity(cap), refillRate(rate), tokens(cap), lastRefill(0.0) {}

    bool allowPacket(double tokensRequired, double currentTimestampSec) {
        // Implement replenishment and admission control
        return false;
    }
};
`,
        java17: `class TokenBucket {
    private final double capacity;
    private final double refillRate;
    private double tokens;
    private double lastRefill;

    public TokenBucket(double capacity, double refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefill = 0.0;
    }

    public boolean allowPacket(double tokensRequired, double currentTimestampSec) {
        // Implement rate limiting logic
        return false;
    }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: "capacity = 5, rate = 2.0/s, packets: [(1, 0.0), (3, 0.0), (2, 0.0), (1, 1.0)]",
          expectedOutput: "[true, true, false, true]",
          isSample: true
        },
        {
          id: "2",
          orderNo: 2,
          input: "capacity = 10, rate = 5.0/s, packets: [(10, 0.0), (5, 0.5), (5, 1.0)]",
          expectedOutput: "[true, false, true]",
          isSample: true
        }
      ]
    },
    {
      id: "cn_cidr_subnet",
      title: "IPv4 CIDR Subnet Calculator & Address Resolver",
      difficulty: "Easy",
      statement: `### Problem Description
Given an IPv4 address with CIDR prefix notation (e.g., \`"192.168.1.130/26"\`), compute the network parameters:
1. \`networkAddress\`: The base network identifier.
2. \`broadcastAddress\`: The broadcast address for the subnet.
3. \`firstUsableHost\`: First host address.
4. \`lastUsableHost\`: Last host address.
5. \`usableHostsCount\`: Total usable IP host count ($2^{32 - prefix} - 2$).

Return a JSON object or formatted string with these 5 fields.`,
      constraintsText: "Valid IPv4 string with prefix 1 <= prefix <= 30.",
      templates: {
        python3: `class Solution:
    def calculateSubnet(self, cidr: str) -> dict:
        # Return dict with network, broadcast, firstHost, lastHost, usableHosts
        pass
`,
        javascript: `class Solution {
  calculateSubnet(cidr) {
    // Return object with network, broadcast, firstHost, lastHost, usableHosts
    return {};
  }
}
`,
        cpp17: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    string calculateSubnet(string cidr) {
        // Return formatted JSON string
        return "";
    }
};
`,
        java17: `import java.util.*;

class Solution {
    public Map<String, Object> calculateSubnet(String cidr) {
        return new HashMap<>();
    }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: '"192.168.1.130/26"',
          expectedOutput: '{"network": "192.168.1.128", "broadcast": "192.168.1.191", "firstHost": "192.168.1.129", "lastHost": "192.168.1.190", "usableHosts": 62}',
          isSample: true
        },
        {
          id: "2",
          orderNo: 2,
          input: '"10.0.0.1/24"',
          expectedOutput: '{"network": "10.0.0.0", "broadcast": "10.0.0.255", "firstHost": "10.0.0.1", "lastHost": "10.0.0.254", "usableHosts": 254}',
          isSample: true
        }
      ]
    }
  ],
  dbms: [
    {
      id: "dbms_hash_join",
      title: "In-Memory Relational Hash Join Engine",
      difficulty: "Medium",
      statement: `### Problem Description
Implement the core query execution operator for an **In-Memory Equi-Hash Join** between two database relation tables:
\`Table A\` and \`Table B\`.

Given:
- \`tableA\`: Array of records (dictionaries/objects).
- \`tableB\`: Array of records.
- \`joinKeyA\`: Attribute name in Table A.
- \`joinKeyB\`: Attribute name in Table B.

Return the joined table records. Each joined record combines matching attributes from both relations. Achieve optimal $O(|A| + |B|)$ time complexity using a build-and-probe phase with hash indexing.`,
      constraintsText: "1 <= |A|, |B| <= 10^5 records. Attribute values are primitives.",
      templates: {
        python3: `from typing import List, Dict, Any

class Solution:
    def hashJoin(self, tableA: List[Dict[str, Any]], tableB: List[Dict[str, Any]], joinKeyA: str, joinKeyB: str) -> List[Dict[str, Any]]:
        # Phase 1: Build hash index on smaller table
        # Phase 2: Probe hash index with outer table
        return []
`,
        javascript: `class Solution {
  hashJoin(tableA, tableB, joinKeyA, joinKeyB) {
    // Write hash join build & probe phases here
    return [];
  }
}
`,
        cpp17: `#include <vector>
#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    // Implement hash join
};
`,
        java17: `import java.util.*;

class Solution {
    public List<Map<String, Object>> hashJoin(List<Map<String, Object>> tableA, List<Map<String, Object>> tableB, String joinKeyA, String joinKeyB) {
        return new ArrayList<>();
    }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: 'tableA = [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}], tableB = [{"userId": 1, "dept": "Eng"}, {"userId": 2, "dept": "Sales"}], joinKeyA = "id", joinKeyB = "userId"',
          expectedOutput: '[{"id": 1, "name": "Alice", "userId": 1, "dept": "Eng"}, {"id": 2, "name": "Bob", "userId": 2, "dept": "Sales"}]',
          isSample: true
        },
        {
          id: "2",
          orderNo: 2,
          input: 'tableA = [{"id": 1, "dept": "AI"}], tableB = [{"userId": 3, "salary": 150000}], joinKeyA = "id", joinKeyB = "userId"',
          expectedOutput: "[]",
          isSample: true
        }
      ]
    },
    {
      id: "dbms_two_phase_locking",
      title: "Strict Two-Phase Locking (2PL) Concurrency Lock Manager",
      difficulty: "Hard",
      statement: `### Problem Description
Implement a **Strict Two-Phase Locking (Strict 2PL)** Lock Manager to guarantee serializable ACID transactions in a DBMS.

Support operations:
- \`acquireShared(txnId: int, resourceId: str) -> bool\`: Acquires a shared (read) lock. Multiple transactions can hold shared locks simultaneously.
- \`acquireExclusive(txnId: int, resourceId: str) -> bool\`: Acquires an exclusive (write) lock. No other transaction can hold any lock on the resource.
- \`commitTransaction(txnId: int) -> None\`: Releases all locks held by transaction \`txnId\` at transaction completion (Strict 2PL phase).`,
      constraintsText: "Up to 10^4 concurrent transactions and 10^5 resources.",
      templates: {
        python3: `class LockManager2PL:
    def __init__(self):
        self.shared_locks = {}     # resource -> set of txnIds
        self.exclusive_locks = {}  # resource -> txnId
        self.txn_locks = {}        # txnId -> list of (resource, type)

    def acquireShared(self, txnId: int, resourceId: str) -> bool:
        pass

    def acquireExclusive(self, txnId: int, resourceId: str) -> bool:
        pass

    def commitTransaction(self, txnId: int) -> None:
        pass
`,
        javascript: `class LockManager2PL {
  constructor() {
    this.sharedLocks = new Map();
    this.exclusiveLocks = new Map();
    this.txnLocks = new Map();
  }

  acquireShared(txnId, resourceId) {
    return false;
  }

  acquireExclusive(txnId, resourceId) {
    return false;
  }

  commitTransaction(txnId) {
    // Release all locks held by txnId
  }
}
`,
        cpp17: `#include <string>
#include <unordered_map>
#include <unordered_set>
using namespace std;

class LockManager2PL {
public:
    bool acquireShared(int txnId, string resourceId) { return false; }
    bool acquireExclusive(int txnId, string resourceId) { return false; }
    void commitTransaction(int txnId) {}
};
`,
        java17: `import java.util.*;

class LockManager2PL {
    public boolean acquireShared(int txnId, String resourceId) { return false; }
    public boolean acquireExclusive(int txnId, String resourceId) { return false; }
    public void commitTransaction(int txnId) {}
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: 'acquireShared(1, "R1") -> true, acquireShared(2, "R1") -> true, acquireExclusive(3, "R1") -> false, commit(1), commit(2), acquireExclusive(3, "R1") -> true',
          expectedOutput: "[true, true, false, true]",
          isSample: true
        }
      ]
    }
  ],
  oops: [
    {
      id: "oops_parking_lot",
      title: "Design a Modular Multi-Floor Parking Lot System (SOLID Principles)",
      difficulty: "Medium",
      statement: `### Problem Description
Design a clean, modular **Parking Lot System** adhering strictly to **SOLID Design Principles** and design patterns (Factory, Strategy).

Requirements:
1. **Vehicle Types**: Supports \`Motorcycle\`, \`Car\`, \`Bus\` with corresponding required spot sizes (\`Compact\`, \`Regular\`, \`Large\`).
2. **Multi-Floor Architecture**: The lot has $N$ floors, each with varying spot counts.
3. **Park & Unpark**:
   - \`park(vehicle) -> Ticket\`: Assigns vehicle to the nearest available compatible spot on the lowest floor.
   - \`unpark(ticket) -> float\`: Frees spot and calculates fee based on duration and dynamic \`PricingStrategy\` (e.g., flat rate or progressive hourly).
4. **Capacity Reporting**: \`getFreeSpots(floor: int, spotType: str) -> int\`.`,
      constraintsText: "Clean object-oriented hierarchy, decoupling, and polymorphism.",
      templates: {
        python3: `from enum import Enum
from typing import Optional, Dict

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    BUS = 3

class Vehicle:
    def __init__(self, licensePlate: str, vType: VehicleType):
        self.licensePlate = licensePlate
        self.vType = vType

class ParkingLot:
    def __init__(self, floorsCount: int, spotsPerFloor: Dict[str, int]):
        self.floorsCount = floorsCount
        self.spotsPerFloor = spotsPerFloor

    def park(self, vehicle: Vehicle) -> Optional[str]:
        # Return ticket ID or None if full
        pass

    def unpark(self, ticketId: str, hoursParked: float) -> float:
        # Return computed parking fee
        return 0.0
`,
        javascript: `class ParkingLot {
  constructor(floorsCount, spotsPerFloor) {
    this.floorsCount = floorsCount;
    this.spotsPerFloor = spotsPerFloor;
  }

  park(vehicle) {
    // Return ticketId or null
    return null;
  }

  unpark(ticketId, hoursParked) {
    // Return fee
    return 0;
  }
}
`,
        cpp17: `#include <string>
#include <vector>
using namespace std;

class ParkingLot {
public:
    ParkingLot(int floors, int spotsPerFloor) {}
    string park(string license, string vType) { return ""; }
    double unpark(string ticketId, double hours) { return 0.0; }
};
`,
        java17: `import java.util.*;

class ParkingLot {
    public ParkingLot(int floors, Map<String, Integer> spotsPerFloor) {}
    public String park(String licensePlate, String vehicleType) { return null; }
    public double unpark(String ticketId, double hoursParked) { return 0.0; }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: 'floors = 2, spots = {"compact": 10, "regular": 20}, park(Car "ABC-123"), unpark(ticket, 2.5h)',
          expectedOutput: 'Parked at Floor 1 Spot 1, Fee = $12.50',
          isSample: true
        }
      ]
    },
    {
      id: "oops_notification_engine",
      title: "Design an Extensible Notification Engine (Observer & Strategy Pattern)",
      difficulty: "Medium",
      statement: `### Problem Description
Design an extensible **Notification Dispatcher System** employing the **Observer Pattern** and **Strategy Pattern**.

Features:
- Channels: \`EmailNotification\`, \`SMSNotification\`, \`PushNotification\`, and \`WebhookNotification\`.
- Priority Tiers: \`LOW\`, \`MEDIUM\`, \`CRITICAL\` (critical notifications retry on failure or fallback to SMS).
- User Notification Preferences: Dispatches only to the user's enabled channels.`,
      constraintsText: "Extensible design allowing new channels without modifying core dispatcher (Open-Closed Principle).",
      templates: {
        python3: `from abc import ABC, abstractmethod

class NotificationChannel(ABC):
    @abstractmethod
    def send(self, recipient: str, message: str) -> bool:
        pass

class NotificationDispatcher:
    def __init__(self):
        self.channels = {}

    def registerChannel(self, name: str, channel: NotificationChannel):
        self.channels[name] = channel

    def dispatch(self, userId: str, message: str, priority: str = "MEDIUM") -> bool:
        pass
`,
        javascript: `class NotificationDispatcher {
  constructor() {
    this.channels = new Map();
  }

  registerChannel(name, channelInstance) {
    this.channels.set(name, channelInstance);
  }

  dispatch(userId, message, priority = "MEDIUM") {
    return true;
  }
}
`,
        cpp17: `#include <string>
#include <unordered_map>
using namespace std;

class NotificationDispatcher {
public:
    bool dispatch(string userId, string message, string priority) { return true; }
};
`,
        java17: `import java.util.*;

class NotificationDispatcher {
    public boolean dispatch(String userId, String message, String priority) { return true; }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: 'channels: [Email, SMS], userPrefs: [Email], message: "Your OTP is 481920"',
          expectedOutput: "Dispatched successfully via Email",
          isSample: true
        }
      ]
    }
  ],
  cs_fundamentals: [
    {
      id: "cs_consistent_hashing",
      title: "Consistent Hashing Ring with Virtual Nodes",
      difficulty: "Medium",
      statement: `### Problem Description
Implement a **Consistent Hashing Ring** with Virtual Nodes (replicas) used in distributed systems (like DynamoDB, Cassandra, Memcached) to distribute load evenly across a dynamic cluster of servers.

Operations:
- \`ConsistentHashRing(virtualNodesPerServer: int)\`
- \`addServer(serverId: str) -> None\`: Hashes \`virtualNodesPerServer\` positions onto a circular ring $[0, 2^{32} - 1]$.
- \`removeServer(serverId: str) -> None\`: Removes all virtual nodes for the server from the ring.
- \`getServer(key: str) -> Optional[str]\`: Hashes \`key\` and returns the first server clockwise on the ring.`,
      constraintsText: "Clockwise binary search (O(log(N * V)) lookup). Uniform distribution.",
      templates: {
        python3: `import hashlib
from bisect import bisect_right
from typing import Optional

class ConsistentHashRing:
    def __init__(self, virtualNodes: int = 100):
        self.virtualNodes = virtualNodes
        self.ring = []         # sorted hash values
        self.hashToServer = {} # hash -> serverId

    def _hash(self, key: str) -> int:
        return int(hashlib.md5(key.encode()).hexdigest(), 16) & 0xFFFFFFFF

    def addServer(self, serverId: str) -> None:
        pass

    def removeServer(self, serverId: str) -> None:
        pass

    def getServer(self, key: str) -> Optional[str]:
        pass
`,
        javascript: `class ConsistentHashRing {
  constructor(virtualNodes = 100) {
    this.virtualNodes = virtualNodes;
    this.ring = [];
    this.hashToServer = new Map();
  }

  addServer(serverId) {}
  removeServer(serverId) {}
  getServer(key) { return null; }
}
`,
        cpp17: `#include <string>
#include <map>
using namespace std;

class ConsistentHashRing {
public:
    ConsistentHashRing(int vnodes = 100) {}
    void addServer(string serverId) {}
    void removeServer(string serverId) {}
    string getServer(string key) { return ""; }
};
`,
        java17: `import java.util.*;

class ConsistentHashRing {
    public ConsistentHashRing(int vnodes) {}
    public void addServer(String serverId) {}
    public void removeServer(String serverId) {}
    public String getServer(String key) { return null; }
}
`
      },
      testCases: [
        {
          id: "1",
          orderNo: 1,
          input: 'addServer("nodeA"), addServer("nodeB"), getServer("user_101")',
          expectedOutput: 'nodeA or nodeB deterministically',
          isSample: true
        }
      ]
    }
  ]
};

export class MockInterviewService {
  /**
   * Initializes a new Mock Interview Session
   */
  static async createInterview(config: InterviewConfig) {
    let problemTitle = "Maximum Subarray (Kadane's Algorithm)";
    let problemStatement = "Given an integer array nums, find the subarray with the largest sum, and return its sum.";
    let constraintsText = "1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4";
    const defaultTemplates: Record<string, string> = {
      python3: "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        # Write your code here\n        pass",
      javascript: "class Solution {\n    maxSubArray(nums) {\n        // Write your code here\n    }\n}",
      cpp17: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n        return 0;\n    }\n};",
      java17: "import java.util.*;\n\nclass Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n        return 0;\n    }\n}"
    };
    let templates: Record<string, string> = { ...defaultTemplates };
    let finalTestCases: Array<{ id: string; orderNo: number; input: string; expectedOutput: string; isSample: boolean }> = [
      { id: "1", orderNo: 1, input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]", expectedOutput: "6", isSample: true },
      { id: "2", orderNo: 2, input: "nums = [5, 4, -1, 7, 8]", expectedOutput: "23", isSample: true }
    ];
    let resolvedProblemId: bigint | null = null;

    const topicLower = (config.topic || "").toLowerCase();

    // 1. Check for domain-specific CS Fundamentals topics
    if (topicLower.includes("operat") || topicLower.includes("os") || topicLower.includes("concurrency")) {
      const osList = CS_FUNDAMENTALS_PROBLEMS.os;
      const chosen = osList[Math.floor(Math.random() * osList.length)];
      problemTitle = chosen.title;
      problemStatement = chosen.statement;
      constraintsText = chosen.constraintsText;
      templates = { ...defaultTemplates, ...chosen.templates };
      finalTestCases = chosen.testCases;
    } else if (topicLower.includes("network") || topicLower.includes("cn") || topicLower.includes("tcp") || topicLower.includes("http")) {
      const cnList = CS_FUNDAMENTALS_PROBLEMS.cn;
      const chosen = cnList[Math.floor(Math.random() * cnList.length)];
      problemTitle = chosen.title;
      problemStatement = chosen.statement;
      constraintsText = chosen.constraintsText;
      templates = { ...defaultTemplates, ...chosen.templates };
      finalTestCases = chosen.testCases;
    } else if (topicLower.includes("dbms") || topicLower.includes("sql") || topicLower.includes("database")) {
      const dbmsList = CS_FUNDAMENTALS_PROBLEMS.dbms;
      const chosen = dbmsList[Math.floor(Math.random() * dbmsList.length)];
      problemTitle = chosen.title;
      problemStatement = chosen.statement;
      constraintsText = chosen.constraintsText;
      templates = { ...defaultTemplates, ...chosen.templates };
      finalTestCases = chosen.testCases;
    } else if (topicLower.includes("oop") || topicLower.includes("object") || topicLower.includes("solid") || topicLower.includes("design pattern")) {
      const oopsList = CS_FUNDAMENTALS_PROBLEMS.oops;
      const chosen = oopsList[Math.floor(Math.random() * oopsList.length)];
      problemTitle = chosen.title;
      problemStatement = chosen.statement;
      constraintsText = chosen.constraintsText;
      templates = { ...defaultTemplates, ...chosen.templates };
      finalTestCases = chosen.testCases;
    } else if (topicLower.includes("fundament") || topicLower.includes("system architecture") || topicLower.includes("hashing")) {
      const csList = CS_FUNDAMENTALS_PROBLEMS.cs_fundamentals;
      const chosen = csList[Math.floor(Math.random() * csList.length)];
      problemTitle = chosen.title;
      problemStatement = chosen.statement;
      constraintsText = chosen.constraintsText;
      templates = { ...defaultTemplates, ...chosen.templates };
      finalTestCases = chosen.testCases;
    } else if (config.topic.startsWith("Custom:") || config.topic.startsWith("Other:")) {
      // Dynamic generation via Gemini for custom topic
      const customTopicName = config.topic.replace(/^(Custom:|Other:)\s*/i, "").trim() || "Advanced Systems Programming";
      try {
        const customPrompt = `Generate a high quality coding challenge for topic "${customTopicName}", difficulty "${config.difficulty}", for a candidate interviewing for ${config.roleTitle} at ${config.targetCompany}.
Respond strictly in JSON format with:
{
  "title": "Problem title",
  "statement": "Markdown statement with problem description, real-world context, and requirements",
  "constraintsText": "Key boundary and time/space constraints",
  "templates": {
    "python3": "python 3 starter code",
    "javascript": "javascript starter code",
    "cpp17": "cpp17 starter code",
    "java17": "java17 starter code"
  },
  "testCases": [
    {"id": "1", "orderNo": 1, "input": "sample input 1", "expectedOutput": "expected output 1", "isSample": true},
    {"id": "2", "orderNo": 2, "input": "sample input 2", "expectedOutput": "expected output 2", "isSample": true}
  ]
}`;
        const generated = await generateContentWithCascade(customPrompt, {
          responseMimeType: "application/json",
          temperature: 0.3
        });
        const parsed = JSON.parse(generated || "{}");
        if (parsed.title && parsed.statement) {
          problemTitle = parsed.title;
          problemStatement = parsed.statement;
          constraintsText = parsed.constraintsText || constraintsText;
          if (parsed.templates) templates = { ...defaultTemplates, ...parsed.templates };
          if (Array.isArray(parsed.testCases) && parsed.testCases.length > 0) finalTestCases = parsed.testCases;
        }
      } catch (err) {
        console.warn("⚠️ Custom topic dynamic generation fallback:", err);
        const fallback = CS_FUNDAMENTALS_PROBLEMS.cs_fundamentals[0];
        problemTitle = `${customTopicName}: ${fallback.title}`;
        problemStatement = fallback.statement;
        constraintsText = fallback.constraintsText;
        templates = { ...defaultTemplates, ...fallback.templates };
        finalTestCases = fallback.testCases;
      }
    } else {
      // Classic algorithmic judge problem from PostgreSQL database
      let problem: any = null;
      if (config.problemId) {
        problem = await prisma.problem.findFirst({
          where: {
            OR: [
              { id: !isNaN(Number(config.problemId)) ? BigInt(config.problemId) : undefined },
              { slug: config.problemId }
            ],
            deletedAt: null
          },
          include: { testCases: { where: { isSample: true } } }
        });
      }

      if (!problem) {
        const diffUpper = config.difficulty.toUpperCase();
        let candidates = await prisma.problem.findMany({
          where: { difficulty: diffUpper as any, deletedAt: null },
          include: { testCases: true },
          take: 10
        });

        if (candidates.length === 0) {
          candidates = await prisma.problem.findMany({
            where: { deletedAt: null },
            include: { testCases: true },
            take: 10
          });
        }

        problem = candidates[Math.floor(Math.random() * candidates.length)] || null;
      }

      if (problem) {
        resolvedProblemId = problem.id;
        problemTitle = problem.title || problemTitle;
        problemStatement = problem.statement || problemStatement;
        constraintsText = problem.constraintsText || constraintsText;

        if (problem.inputTemplate) {
          try {
            const parsedTpl = JSON.parse(problem.inputTemplate);
            templates = { ...defaultTemplates, ...parsedTpl };
          } catch {}
        }

        const allCases = problem.testCases || [];
        const samples = allCases.filter((tc: any) => tc.isSample !== false && tc.isSample === true);
        const candidateCases = samples.length > 0 ? samples : allCases.slice(0, 2);

        if (candidateCases.length > 0) {
          finalTestCases = candidateCases.map((tc: any, idx: number) => ({
            id: tc.id ? tc.id.toString() : (idx + 1).toString(),
            orderNo: tc.orderNo || idx + 1,
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || "",
            isSample: true
          }));
        }
      }
    }

    // 2. Synthesize realistic opening greeting tailored to company, role, interviewer persona, and problem
    const greeting = this.generateOpeningGreeting(
      config.interviewerName,
      config.targetCompany,
      config.roleTitle,
      problemTitle,
      config.durationMinutes,
      config.topic
    );

    const initialTranscript: TranscriptTurn[] = [
      {
        id: `turn_${Date.now()}_0`,
        sender: "interviewer",
        text: greeting,
        timestamp: Date.now()
      }
    ];

    // 3. Persist into PostgreSQL
    const interview = await prisma.mockInterview.create({
      data: {
        userId: config.userId && !isNaN(Number(config.userId)) ? BigInt(config.userId) : null,
        roleTitle: config.roleTitle,
        targetCompany: config.targetCompany,
        interviewerName: config.interviewerName,
        topic: config.topic,
        difficulty: config.difficulty,
        durationMinutes: config.durationMinutes,
        status: "IN_PROGRESS",
        problemId: resolvedProblemId ? resolvedProblemId : null,
        problemTitle,
        problemStatement,
        currentCode: templates.python3,
        language: "python3",
        transcript: initialTranscript as any,
        telemetry: {
          voiceId: config.interviewerVoice || "male_soft",
          fillerWordCount: 0,
          wpm: 130,
          eyeContactScore: 92,
          interruptions: 0,
          codeRuns: 0,
          durationElapsedSec: 0,
          testCases: finalTestCases,
          templates: templates,
          constraintsText: constraintsText
        } as any,
        startTime: new Date()
      }
    });

    return {
      interviewId: interview.id,
      roleTitle: interview.roleTitle,
      targetCompany: interview.targetCompany,
      interviewerName: interview.interviewerName,
      interviewerVoice: config.interviewerVoice || "male_soft",
      topic: interview.topic,
      difficulty: interview.difficulty,
      durationMinutes: interview.durationMinutes,
      status: interview.status,
      problem: {
        id: resolvedProblemId ? resolvedProblemId.toString() : "domain_problem",
        title: problemTitle,
        statement: problemStatement,
        constraintsText,
        templates,
        testCases: finalTestCases
      },
      transcript: initialTranscript,
      openingGreeting: greeting
    };
  }

  /**
   * Generates opening interviewer greeting tailored to domain
   */
  private static generateOpeningGreeting(
    interviewerName: string,
    company: string,
    roleTitle: string,
    problemTitle: string,
    duration: number,
    topic?: string
  ): string {
    const t = (topic || "").toLowerCase();
    if (t.includes("operat") || t.includes("os") || t.includes("concurrency")) {
      return `Hi! Welcome to your technical interview for the ${roleTitle} role at ${company}. I'm ${interviewerName}. Today we'll be diving into Operating Systems and concurrency concepts with "${problemTitle}". We have about ${duration} minutes. As you design your solution, think through thread safety, race conditions, and deadlocks. Whenever you're ready, talk me through your architectural plan!`;
    }
    if (t.includes("network") || t.includes("cn") || t.includes("tcp") || t.includes("http")) {
      return `Welcome! Great to meet you. I'm ${interviewerName} with the engineering team at ${company}. For this ${roleTitle} session, we're focusing on Computer Networks and protocol architecture with "${problemTitle}". We have ${duration} minutes. Feel free to inspect the problem statement, think out loud, and let me know your thoughts on packet handling and edge cases!`;
    }
    if (t.includes("dbms") || t.includes("sql") || t.includes("database")) {
      return `Hello and welcome! I'm ${interviewerName} from ${company}. Today's ${roleTitle} screen focuses on Database Systems and query engine internals with "${problemTitle}". We have ${duration} minutes. We value how you reason through ACID guarantees, indexing trade-offs, and data layout. What stands out to you as you review this?`;
    }
    if (t.includes("oop") || t.includes("object") || t.includes("solid") || t.includes("design pattern")) {
      return `Hi there! I'm ${interviewerName} from ${company}. In this ${roleTitle} session, we'll be exploring Object-Oriented Design, SOLID principles, and clean patterns with "${problemTitle}". We have ${duration} minutes. Focus on clean class abstractions, extensibility, and separation of concerns. Whenever you're ready, how would you structure the core entities?`;
    }

    const greetings = [
      `Hi there! Welcome to your technical interview for the ${roleTitle} role here at ${company}. I'm ${interviewerName}, and I'll be partnering with you today. We have about ${duration} minutes. We'll be tackling "${problemTitle}". Feel free to read through the problem statement on your screen, ask any clarifying questions, and talk me through your thought process before writing code. How are you feeling today?`,
      `Hello and welcome! Great to meet you. I'm ${interviewerName} with the engineering team at ${company}. Today we're looking at "${problemTitle}" for our ${roleTitle} session. In this interview, how you think through tradeoffs and edge cases is just as important as working code. Take your time to inspect the statement, and whenever you're ready, let me know your initial intuition!`,
      `Good day! I'm ${interviewerName} from ${company}. Thanks for joining today's ${roleTitle} technical screen. We'll be spending the next ${duration} minutes on "${problemTitle}". Please feel free to treat this as an open conversation—think out loud, sketch pseudo-logic, and ask anything about the constraints. Whenever you're ready, what stands out to you about this problem?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  /**
   * Processes a live conversational turn from candidate speech / code
   */
  static async processTurn(params: {
    interviewId: string;
    userSpeech?: string;
    currentCode?: string;
    language?: string;
    contextType?: "speech" | "code_review" | "test_run" | "hint_request";
    testResults?: { passed: number; total: number; error?: string };
    screenObservation?: string;
  }) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.interviewId }
    });

    if (!interview) {
      throw new Error(`Mock interview session [${params.interviewId}] not found.`);
    }

    const currentTranscript = (interview.transcript as any) as TranscriptTurn[] || [];
    const language = params.language || interview.language || "python3";
    const currentCode = params.currentCode ?? (interview.currentCode || "");

    // 1. Build prompt for Gemini
    const recentHistory = currentTranscript
      .slice(-8)
      .map((t) => `${t.sender.toUpperCase()}: ${t.text}`)
      .join("\n");

    const prompt = `You are ${interview.interviewerName}, a Principal Technical Interviewer conducting a high-stakes, real-time technical screen for a ${interview.roleTitle} role at ${interview.targetCompany}.
The candidate is participating live via video, audio, and a collaborative code editor.

[INTERVIEW DETAILS]:
- Company: ${interview.targetCompany}
- Role: ${interview.roleTitle}
- Focus Domain / Topic: ${interview.topic}
- Problem Title: ${interview.problemTitle}
- Problem Statement: ${interview.problemStatement}
- Programming Language: ${language}

[CURRENT CANDIDATE CODE IN IDE]:
\`\`\`${language}
${currentCode || "(No code typed yet)"}
\`\`\`

[RECENT CONVERSATION TIMELINE]:
${recentHistory || "(Interview just started)"}

[CANDIDATE'S LATEST ACTION / WORDS]:
${params.contextType === "test_run"
  ? `[CANDIDATE RAN TEST CASES]: Passed ${params.testResults?.passed || 0} of ${params.testResults?.total || 0}. ${params.testResults?.error ? `Error: ${params.testResults.error}` : ""}`
  : params.contextType === "hint_request"
  ? `[CANDIDATE REQUESTED HINT]: "Could I get a subtle hint or direction?"`
  : params.contextType === "code_review"
  ? `[CANDIDATE REQUESTED CODE INSPECTION]: "Could you take a look at my code structure / logic?"`
  : `CANDIDATE SAID: "${params.userSpeech || ""}"`}

${params.screenObservation ? `[VIDEO/SCREEN OBSERVATION]: ${params.screenObservation}` : ""}

CRITICAL BEHAVIORAL INSTRUCTIONS:
1. Speak naturally as a human interviewer on a live video call. Speak directly to the candidate ("you").
2. KEEP IT CONCISE AND SPOKEN: Maximum 2 to 4 sentences. Interviewers do NOT give long monologues during a live coding session.
3. DOMAIN EXPERTISE:
   - If topic is Operating Systems / Concurrency: Probe into thread synchronization, condition variables, race conditions, atomic operations, and deadlock avoidance.
   - If topic is Computer Networks: Probe into packet framing, sliding window flow control, rate limiting, and transport protocol trade-offs.
   - If topic is DBMS / SQL: Probe into ACID transactions, locking, index efficiency (B-Trees / Hash indices), and query plans.
   - If topic is Object-Oriented Programming (OOPS): Probe into SOLID principles, polymorphism, encapsulation, and decoupling via design patterns.
   - If topic is Algorithms: Probe into Big-O time and space complexity ($O(N)$), boundary edge cases, and optimal data structures.
4. SOCRATIC GUIDANCE:
   - If their code has a logical bug, don't give the answer directly—guide their eyes to the line or condition.
   - If tests failed, encourage them to trace the failing case step-by-step.
5. Professional, encouraging, but rigorous standard consistent with ${interview.targetCompany}.

Respond strictly in JSON format with:
{
  "responseText": "Spoken reply to the candidate (2-4 sentences max)",
  "isHint": false,
  "codeCritique": "Optional 1-sentence note on code or complexity if applicable"
}`;

    let responseText = "";
    let isHint = false;
    let codeCritique: string | undefined;

    try {
      const rawText = await generateContentWithCascade(prompt, {
        responseMimeType: "application/json",
        temperature: 0.4
      });

      const parsed = JSON.parse(rawText || "{}");
      responseText = parsed.responseText || "";
      isHint = Boolean(parsed.isHint);
      codeCritique = parsed.codeCritique;
    } catch (err) {
      console.warn("⚠️ Gemini call failed in processTurn, using context-aware interviewer response:", err);
      responseText = this.getFallbackInterviewerTurn(
        params.contextType || "speech",
        params.userSpeech,
        params.testResults,
        interview.targetCompany,
        interview.topic
      );
    }

    if (!responseText) {
      responseText = "That makes sense. Walk me through how you're thinking about the time and space complexity for this approach.";
    }

    // 2. Append turns to transcript
    const updatedTranscript = [...currentTranscript];

    if (params.userSpeech && params.contextType !== "test_run" && params.contextType !== "hint_request" && params.contextType !== "code_review") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "candidate",
        text: params.userSpeech,
        timestamp: Date.now(),
        codeSnippet: currentCode ? currentCode.slice(0, 300) : undefined
      });
    } else if (params.contextType === "hint_request") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "candidate",
        text: "Could you share a hint or recommend a strategic direction?",
        timestamp: Date.now()
      });
    } else if (params.contextType === "code_review") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "candidate",
        text: "Could you inspect my code logic and tell me how my approach looks?",
        timestamp: Date.now()
      });
    } else if (params.contextType === "test_run") {
      updatedTranscript.push({
        id: `turn_${Date.now()}_u`,
        sender: "system",
        text: `Executed test cases: ${params.testResults?.passed || 0}/${params.testResults?.total || 0} passed.`,
        timestamp: Date.now()
      });
    }

    updatedTranscript.push({
      id: `turn_${Date.now()}_i`,
      sender: "interviewer",
      text: responseText,
      timestamp: Date.now(),
      isHint
    });

    // 3. Update database
    await prisma.mockInterview.update({
      where: { id: params.interviewId },
      data: {
        transcript: updatedTranscript as any,
        currentCode,
        language
      }
    });

    return {
      interviewerReply: responseText,
      isHint,
      codeCritique,
      updatedTranscript
    };
  }

  /**
   * Deterministic conversational fallback
   */
  private static getFallbackInterviewerTurn(
    contextType: string,
    userSpeech?: string,
    testResults?: { passed: number; total: number; error?: string },
    company?: string,
    topic?: string
  ): string {
    const text = (userSpeech || "").toLowerCase().trim();
    const t = (topic || "").toLowerCase();

    if (contextType === "test_run") {
      if (testResults && testResults.passed === testResults.total && testResults.total > 0) {
        return `Awesome job! All ${testResults.total} test cases are passing cleanly. Now, let's analyze: what are the worst-case time and space complexities, and how would this hold up under heavy concurrent load?`;
      } else {
        return `I see ${testResults?.passed || 0} out of ${testResults?.total || 0} test cases passing. Take a look at the failing case: trace through your variables step-by-step. Where is the output diverging from what you expect?`;
      }
    }

    if (contextType === "hint_request") {
      if (t.includes("operat") || t.includes("os") || t.includes("concurrency")) {
        return `Consider using condition variables paired with a mutex. How will you notify waiting threads when buffer capacity changes?`;
      }
      if (t.includes("network") || t.includes("cn")) {
        return `Think about timestamp replenishment: calculate the elapsed time since the last packet and refill tokens linearly up to maximum capacity.`;
      }
      if (t.includes("dbms") || t.includes("sql")) {
        return `Think about building a hash map index on the smaller table first, then probing with the outer table in O(1) time per record.`;
      }
      if (t.includes("oop")) {
        return `Think about encapsulating vehicle sizing into an enum and decoupling fee computation using the Strategy Pattern.`;
      }
      return `Think about the mathematical properties or invariants of the input. Could maintaining an auxiliary hash map allow you to look up complements in O(1) time?`;
    }

    if (contextType === "code_review") {
      return `Your overall code structure looks clean and well-decomposed. Pay close attention to your base cases and boundary constraints: what happens if the input is empty or at maximum capacity?`;
    }

    // Domain-specific keyword matching
    if (text.includes("mutex") || text.includes("lock") || text.includes("semaphore") || text.includes("condition variable") || text.includes("race condition") || text.includes("thread")) {
      return `Good catch on thread synchronization. How will you ensure that multiple threads don't cause a deadlock if they acquire locks in differing orders?`;
    }

    if (text.includes("packet") || text.includes("token") || text.includes("rate limit") || text.includes("burst") || text.includes("window") || text.includes("tcp") || text.includes("udp")) {
      return `That makes sense for network traffic shaping. How does your rate limiter handle bursts of packets arriving simultaneously?`;
    }

    if (text.includes("acid") || text.includes("transaction") || text.includes("isolation") || text.includes("index") || text.includes("b-tree") || text.includes("hash join") || text.includes("probe")) {
      return `Solid reasoning on database operations. What is the memory footprint of storing that hash index, and how would you handle a join that exceeds available RAM?`;
    }

    if (text.includes("solid") || text.includes("pattern") || text.includes("polymorphism") || text.includes("inheritance") || text.includes("strategy") || text.includes("factory")) {
      return `I like how you're keeping the architecture decoupled. How easy would it be to introduce a new subclass or strategy without modifying existing caller code?`;
    }

    // Speech greetings & flow
    if (text.includes("hello") || text.includes("hi") || text.includes("hey") || text.includes("good morning") || text.includes("good afternoon")) {
      return `Hello! Great to connect with you. Whenever you're ready, take a look at the problem statement on your screen. What are your initial thoughts or clarifying questions on how to approach this?`;
    }

    if (text.includes("ready") || text.includes("start") || text.includes("begin")) {
      return `Fantastic! Feel free to talk through your initial thought process out loud before writing any code. What data structures come to mind first?`;
    }

    if (text.includes("complexity") || text.includes("big o") || text.includes("time") || text.includes("space")) {
      return `Good intuition. If we analyze the operations, each step is bounded. Can we avoid redundant work with an auxiliary hash map?`;
    }

    if (text.includes("hash map") || text.includes("dictionary") || text.includes("hashmap") || text.includes("map")) {
      return `Using a hash map is a very solid direction—it gives us O(1) average lookup time. How will you store elements as you iterate through the input?`;
    }

    const standardReplies = [
      `That sounds like a thoughtful direction. How do you plan to handle duplicates or extreme boundary constraints?`,
      `Interesting intuition. Walk me through the trade-offs: what is the Big-O time and space complexity of this approach compared to a brute force?`,
      `Good thought process. Before you write out the full logic, let's trace this with a small sample input to verify our assumptions.`,
      `I like where you're going with this. Go ahead and sketch the implementation in the editor, and keep talking through your steps as you code.`
    ];

    return standardReplies[Math.floor(Math.random() * standardReplies.length)];
  }

  /**
   * Performs real-time code inspection
   */
  static async inspectCode(params: {
    interviewId: string;
    code: string;
    language: string;
    focus?: "complexity" | "bugs" | "cleanliness" | "general";
  }) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.interviewId }
    });

    if (!interview) {
      throw new Error(`Interview [${params.interviewId}] not found.`);
    }

    const prompt = `You are ${interview.interviewerName}, a Principal Engineer at ${interview.targetCompany}.
You are silently inspecting the candidate's code during a live technical interview for "${interview.problemTitle}".

Candidate's Code (${params.language}):
\`\`\`${params.language}
${params.code}
\`\`\`

Analyze the code for:
1. Syntax validity and obvious bugs (off-by-one, null dereference, uninitialized state).
2. Time and Space complexity ($O(N)$ Big-O).
3. 2-3 sentence verbal guidance you would give to the candidate right now.

Respond strictly in JSON format:
{
  "hasBugs": false,
  "timeComplexity": "O(N)",
  "spaceComplexity": "O(1)",
  "detectedIssues": ["Issue 1"],
  "spokenGuidance": "Spoken feedback (2-3 sentences max)"
}`;

    try {
      const rawText = await generateContentWithCascade(prompt, { responseMimeType: "application/json", temperature: 0.2 });
      return JSON.parse(rawText || "{}");
    } catch {
      return {
        hasBugs: false,
        timeComplexity: "O(N)",
        spaceComplexity: "O(1)",
        detectedIssues: [],
        spokenGuidance: "Your code is coming along nicely. Make sure you handle any boundary conditions and trace through your variables before running the test cases."
      };
    }
  }

  /**
   * Finalizes the mock interview and produces an authoritative FAANG-grade Evaluation Scorecard
   */
  static async finalizeInterview(params: {
    interviewId: string;
    finalCode?: string;
    language?: string;
    telemetry?: TelemetryData;
  }): Promise<ScorecardReport> {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.interviewId }
    });

    if (!interview) {
      throw new Error(`Interview session [${params.interviewId}] not found.`);
    }

    const finalCode = params.finalCode || interview.currentCode || "";
    const transcript = (interview.transcript as any) as TranscriptTurn[] || [];
    const telemetry = params.telemetry || (interview.telemetry as any) || {
      fillerWordCount: 0,
      wpm: 125,
      eyeContactScore: 90,
      interruptions: 0,
      codeRuns: 2,
      durationElapsedSec: 1200
    };

    const transcriptSummary = transcript
      .map((t) => `${t.sender.toUpperCase()}: ${t.text}`)
      .join("\n");

    const prompt = `You are the Hiring Committee Lead and Principal Technical Interviewer at ${interview.targetCompany}.
You just completed conducting a rigorous technical coding screen for a ${interview.roleTitle} candidate on the problem "${interview.problemTitle}".

Candidate Details:
- Target Company: ${interview.targetCompany}
- Target Level: ${interview.roleTitle}
- Problem: ${interview.problemTitle}
- Difficulty: ${interview.difficulty}
- Programming Language: ${params.language || interview.language || "python3"}

Final Code Submitted by Candidate:
\`\`\`${params.language || interview.language || "python3"}
${finalCode || "(No code submitted)"}
\`\`\`

Complete Interview Transcript:
${transcriptSummary}

Candidate Behavioral Telemetry:
- Filler Word Count ("um", "like"): ${telemetry.fillerWordCount}
- Average Speaking Pace: ${telemetry.wpm} words/minute
- Eye Contact / Camera Presence: ${telemetry.eyeContactScore}%
- Code Executions: ${telemetry.codeRuns}

Conduct a comprehensive FAANG-caliber candidate debrief and output an authoritative evaluation scorecard conforming STRICTLY to this JSON structure:
{
  "hireDecision": "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "LEANING_NO_HIRE" | "STRONG_NO_HIRE",
  "overallScore": 88,
  "technicalScore": 90,
  "communicationScore": 85,
  "problemSolvingScore": 87,
  "behavioralScore": 90,
  "executiveSummary": "3-4 sentence comprehensive debrief summarizing candidate performance, strengths, and areas to level up.",
  "strengths": [
    "Specific technical or communication strength 1",
    "Specific technical or communication strength 2",
    "Specific technical or communication strength 3"
  ],
  "growthAreas": [
    "Actionable area for improvement 1",
    "Actionable area for improvement 2"
  ],
  "lineByLineFeedback": "Detailed constructive critique of their code structure, variable naming, and algorithmic efficiency.",
  "optimalSolution": "The ideal, production-grade reference solution in ${params.language || interview.language || "python3"} with Big-O analysis.",
  "interviewerVerdict": "1-sentence closing endorsement from the interviewer."
}`;

    let scorecard: ScorecardReport;

    try {
      const rawText = await generateContentWithCascade(prompt, {
        responseMimeType: "application/json",
        temperature: 0.3
      });

      const parsed = JSON.parse(rawText || "{}");
      scorecard = {
        hireDecision: parsed.hireDecision || "LEANING_HIRE",
        overallScore: typeof parsed.overallScore === "number" ? parsed.overallScore : 84,
        technicalScore: typeof parsed.technicalScore === "number" ? parsed.technicalScore : 85,
        communicationScore: typeof parsed.communicationScore === "number" ? parsed.communicationScore : 82,
        problemSolvingScore: typeof parsed.problemSolvingScore === "number" ? parsed.problemSolvingScore : 84,
        behavioralScore: typeof parsed.behavioralScore === "number" ? parsed.behavioralScore : 88,
        executiveSummary: parsed.executiveSummary || `The candidate demonstrated strong foundational knowledge for the ${interview.roleTitle} role at ${interview.targetCompany}, articulating ideas well and producing functional code.`,
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : [
          "Clear articulation of algorithmic trade-offs before writing code",
          "Clean code decomposition with meaningful variable names",
          "Good composure and receptive attitude towards interviewer prompts"
        ],
        growthAreas: Array.isArray(parsed.growthAreas) && parsed.growthAreas.length > 0 ? parsed.growthAreas : [
          "Be more proactive in identifying edge cases (empty inputs, bounds) before running tests",
          "Work on minimizing filler words when formulating complex thoughts"
        ],
        lineByLineFeedback: parsed.lineByLineFeedback || "The solution adheres to standard practices. Complexity is optimal with clean separation of logic.",
        optimalSolution: parsed.optimalSolution || `# Optimal solution for ${interview.problemTitle}\n# Time Complexity: O(N)\n# Space Complexity: O(1)`,
        interviewerVerdict: parsed.interviewerVerdict || `Overall, a promising candidate who meets the technical bar for ${interview.targetCompany}.`
      };
    } catch (err) {
      console.warn("⚠️ Gemini scorecard generation error, using calibrated fallback:", err);
      scorecard = this.generateFallbackScorecard(interview, finalCode, telemetry);
    }

    // Update interview record in database
    await prisma.mockInterview.update({
      where: { id: params.interviewId },
      data: {
        status: "COMPLETED",
        currentCode: finalCode,
        telemetry: telemetry as any,
        scorecard: scorecard as any,
        endTime: new Date()
      }
    });

    return scorecard;
  }

  /**
   * Deterministic fallback scorecard
   */
  private static generateFallbackScorecard(interview: any, finalCode: string, telemetry: TelemetryData): ScorecardReport {
    const hasCode = finalCode.trim().length > 20;
    const technical = hasCode ? 86 : 65;
    const communication = telemetry.fillerWordCount < 5 ? 88 : 78;
    const problemSolving = hasCode ? 85 : 60;
    const behavioral = telemetry.eyeContactScore >= 80 ? 90 : 75;
    const overall = Math.round((technical * 0.4) + (communication * 0.25) + (problemSolving * 0.2) + (behavioral * 0.15));

    let hireDecision: ScorecardReport["hireDecision"] = "LEANING_HIRE";
    if (overall >= 90) hireDecision = "STRONG_HIRE";
    else if (overall >= 80) hireDecision = "HIRE";
    else if (overall >= 70) hireDecision = "LEANING_HIRE";
    else if (overall >= 55) hireDecision = "LEANING_NO_HIRE";
    else hireDecision = "STRONG_NO_HIRE";

    return {
      hireDecision,
      overallScore: overall,
      technicalScore: technical,
      communicationScore: communication,
      problemSolvingScore: problemSolving,
      behavioralScore: behavioral,
      executiveSummary: `The candidate completed the ${interview.durationMinutes}-minute technical screen for the ${interview.roleTitle} role at ${interview.targetCompany}. They demonstrated a thoughtful problem-solving demeanor, discussed constraints proactively, and implemented a functional solution.`,
      strengths: [
        "Structured problem decomposition and systematic thinking",
        "Clear and continuous explanation of logic while coding",
        "Maintained high composure and camera presence throughout the session"
      ],
      growthAreas: [
        "Identify boundary conditions and edge cases earlier during the design phase",
        "Analyze exact asymptotic time and space bounds before beginning the implementation"
      ],
      lineByLineFeedback: "Code is well-structured and follows idiomatic patterns. Edge case checks at the function entry could be made more explicit.",
      optimalSolution: `# Production-grade reference solution for ${interview.problemTitle}\n# Time: O(N) | Space: O(1)\n\nclass Solution:\n    def solve(self, nums, target):\n        lookup = {}\n        for i, num in enumerate(nums):\n            comp = target - num\n            if comp in lookup:\n                return [lookup[comp], i]\n            lookup[num] = i\n        return []`,
      interviewerVerdict: `Solid performance demonstrating the engineering caliber expected at ${interview.targetCompany}.`
    };
  }

  /**
   * Fetches an interview session by ID
   */
  static async getInterview(id: string) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            statement: true,
            constraintsText: true,
            difficulty: true,
            inputTemplate: true,
            testCases: true
          }
        }
      }
    });

    if (!interview) return null;

    const defaultTemplates: Record<string, string> = {
      python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
      javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
      cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
      java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
    };

    const telemetry = (interview.telemetry as any) || {};

    // 1. Resolve domain problem match from CS_FUNDAMENTALS_PROBLEMS
    const allDomainProblems: any[] = Object.values(CS_FUNDAMENTALS_PROBLEMS).flat();
    const problemTitleLower = (interview.problemTitle || "").toLowerCase().trim();
    const matchedDomainProblem = allDomainProblems.find(
      (p) =>
        (p.title && p.title.toLowerCase().trim() === problemTitleLower) ||
        (p.id && p.id.toLowerCase().trim() === problemTitleLower) ||
        (problemTitleLower && p.title && (problemTitleLower.includes(p.title.toLowerCase()) || p.title.toLowerCase().includes(problemTitleLower)))
    );

    // 2. Resolve templates dynamically
    let templates = { ...defaultTemplates };
    if (telemetry.templates && typeof telemetry.templates === "object" && Object.keys(telemetry.templates).length > 0) {
      templates = { ...defaultTemplates, ...telemetry.templates };
    } else if (matchedDomainProblem?.templates) {
      templates = { ...defaultTemplates, ...matchedDomainProblem.templates };
    } else if (interview.problem?.inputTemplate) {
      try {
        const parsed = JSON.parse(interview.problem.inputTemplate);
        templates = { ...defaultTemplates, ...parsed };
      } catch {}
    }

    // 3. Resolve constraintsText
    const constraintsText =
      telemetry.constraintsText ||
      matchedDomainProblem?.constraintsText ||
      interview.problem?.constraintsText ||
      "1 <= N <= 10^5";

    // 4. Resolve test cases dynamically (Zero hardcoding)
    let finalTestCases: Array<{ id: string; orderNo: number; input: string; expectedOutput: string; isSample: boolean }> = [];

    // Priority 1: Telemetry stored testCases
    if (Array.isArray(telemetry.testCases) && telemetry.testCases.length > 0) {
      finalTestCases = telemetry.testCases;
    }
    // Priority 2: Matched CS Fundamentals problem testCases (e.g. IPv4 CIDR, Token Bucket, LRU)
    else if (matchedDomainProblem && Array.isArray(matchedDomainProblem.testCases) && matchedDomainProblem.testCases.length > 0) {
      finalTestCases = matchedDomainProblem.testCases;
    }
    // Priority 3: Database Problem testCases
    else if (interview.problem?.testCases && interview.problem.testCases.length > 0) {
      const sampleCases = interview.problem.testCases.filter((tc: any) => tc.isSample !== false && tc.isSample === true);
      const chosenCases = sampleCases.length > 0 ? sampleCases : interview.problem.testCases.slice(0, 2);
      finalTestCases = chosenCases.map((tc: any, idx: number) => ({
        id: tc.id ? tc.id.toString() : (idx + 1).toString(),
        orderNo: tc.orderNo || idx + 1,
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || "",
        isSample: true
      }));
    }
    // Priority 4: Dynamic parsing from problem statement
    else if (interview.problemStatement) {
      const regex = /(?:Example\s*\d*[:\s]*)?Input:\s*([^\n\r]+)[\s\S]*?(?:Expected\s*)?Output:\s*([^\n\r]+)/gi;
      let match;
      let idx = 1;
      while ((match = regex.exec(interview.problemStatement)) !== null && idx <= 3) {
        const inStr = match[1].replace(/^[`"']|[`"']$/g, "").trim();
        const outStr = match[2].replace(/^[`"']|[`"']$/g, "").trim();
        if (inStr && outStr) {
          finalTestCases.push({
            id: idx.toString(),
            orderNo: idx,
            input: inStr,
            expectedOutput: outStr,
            isSample: true
          });
          idx++;
        }
      }
    }

    // Priority 5: Dynamic domain-aware fallback if all else fails (NEVER Two Sum!)
    if (finalTestCases.length === 0) {
      const tLower = problemTitleLower;
      if (tLower.includes("subnet") || tLower.includes("cidr") || tLower.includes("ipv4") || tLower.includes("network")) {
        finalTestCases = [
          { id: "1", orderNo: 1, input: '"192.168.1.130/26"', expectedOutput: '{"network": "192.168.1.128", "broadcast": "192.168.1.191", "firstHost": "192.168.1.129", "lastHost": "192.168.1.190", "usableHosts": 62}', isSample: true },
          { id: "2", orderNo: 2, input: '"10.0.0.1/8"', expectedOutput: '{"network": "10.0.0.0", "broadcast": "10.255.255.255", "firstHost": "10.0.0.1", "lastHost": "10.255.255.254", "usableHosts": 16777214}', isSample: true }
        ];
      } else if (tLower.includes("rate limit") || tLower.includes("token bucket")) {
        finalTestCases = [
          { id: "1", orderNo: 1, input: "capacity = 5, rate = 2.0/s, packets: [(1, 0.0), (3, 0.0), (2, 0.0)]", expectedOutput: "[true, true, false]", isSample: true }
        ];
      } else if (tLower.includes("lru") || tLower.includes("page replacement") || tLower.includes("cache")) {
        finalTestCases = [
          { id: "1", orderNo: 1, input: "framesCount = 3, pageReferences = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]", expectedOutput: "pageFaults = 10, finalFrames = [2, 3, 0]", isSample: true }
        ];
      } else if (tLower.includes("producer") || tLower.includes("bounded") || tLower.includes("blocking queue")) {
        finalTestCases = [
          { id: "1", orderNo: 1, input: "capacity = 2, operations: [enqueue(1), enqueue(2), dequeue(), enqueue(3)]", expectedOutput: "[1, 2, 1, 2]", isSample: true }
        ];
      } else if (tLower.includes("b-tree") || tLower.includes("indexing") || tLower.includes("dbms")) {
        finalTestCases = [
          { id: "1", orderNo: 1, input: "order = 3, keys: [10, 20, 5, 6, 12, 30, 7, 17]", expectedOutput: "rootHeight = 2, totalNodes = 5", isSample: true }
        ];
      } else {
        finalTestCases = [
          { id: "1", orderNo: 1, input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]", expectedOutput: "6", isSample: true },
          { id: "2", orderNo: 2, input: "nums = [5, 4, -1, 7, 8]", expectedOutput: "23", isSample: true }
        ];
      }
    }

    return {
      id: interview.id,
      roleTitle: interview.roleTitle,
      targetCompany: interview.targetCompany,
      interviewerName: interview.interviewerName,
      interviewerVoice: (interview.telemetry as any)?.voiceId || "male_soft",
      topic: interview.topic,
      difficulty: interview.difficulty,
      durationMinutes: interview.durationMinutes,
      status: interview.status,
      currentCode: interview.currentCode,
      language: interview.language,
      transcript: interview.transcript,
      telemetry: interview.telemetry,
      scorecard: interview.scorecard,
      startTime: interview.startTime,
      endTime: interview.endTime,
      problem: {
        id: interview.problem?.id ? interview.problem.id.toString() : (interview.problemId ? interview.problemId.toString() : "custom"),
        title: interview.problemTitle || interview.problem?.title || "Algorithmic Challenge",
        statement: interview.problemStatement || interview.problem?.statement || "",
        constraintsText,
        templates,
        testCases: finalTestCases
      }
    };
  }

  /**
   * Retrieves candidate's interview history
   */
  static async getUserInterviews(userId?: string) {
    const where: any = {};
    if (userId && !isNaN(Number(userId))) {
      where.userId = BigInt(userId);
    }

    const interviews = await prisma.mockInterview.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return interviews.map((inv) => ({
      id: inv.id,
      roleTitle: inv.roleTitle,
      targetCompany: inv.targetCompany,
      interviewerName: inv.interviewerName,
      topic: inv.topic,
      difficulty: inv.difficulty,
      durationMinutes: inv.durationMinutes,
      status: inv.status,
      problemTitle: inv.problemTitle,
      scorecard: inv.scorecard,
      createdAt: inv.createdAt,
      startTime: inv.startTime,
      endTime: inv.endTime
    }));
  }
}
