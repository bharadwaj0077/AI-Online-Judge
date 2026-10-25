import fs from "fs";
import path from "path";
import { prisma } from "../config/db";
import { AiService } from "./ai.service";
import { AiRefereeService, PlayerMatchSummary, RefereeDecision } from "./ai-referee.service";

export interface ReplayEvent {
  t: number; // millisecond timestamp from match start
  type: "match_start" | "code_update" | "paste_warning" | "hint_unlocked" | "run_tests" | "submit_attempt" | "match_end" | "coop_cursor";
  userId: string;
  data: any;
}

export interface ArenaPlayer {
  userId: string;
  username: string;
  socketId: string;
  code: string;
  language: string;
  cursorPosition: { lineNumber: number; column: number };
  passedCases: number;
  totalCases: number;
  verdict: string;
  executionTimeMs: number;
  antiCheatWarnings: number;
  isAiBot?: boolean;
}

export interface ArenaMatch {
  id: string;
  mode: "classic" | "blitz" | "coop";
  difficulty: string;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    statement: string;
    constraintsText: string;
    starterCode: string;
    templates: Record<string, string>;
    testCases: Array<{ id: string; orderNo: number; input: string; expectedOutput: string; isSample: boolean }>;
  };
  player1: ArenaPlayer;
  player2: ArenaPlayer;
  startTime: number;
  durationSec: number;
  status: "IN_PROGRESS" | "CONCLUDED" | "DISQUALIFIED";
  hints: Array<{ tier: number; title: string; content: string; keyTakeaway: string; triggerPercent: number }>;
  unlockedHintTiers: number[];
  replayTimeline: ReplayEvent[];
  decision?: RefereeDecision;
}

const DATA_DIR = path.join(process.cwd(), "data");
const MATCHES_FILE = path.join(DATA_DIR, "arena_matches.json");

export class ArenaService {
  private static activeMatches = new Map<string, ArenaMatch>();
  private static matchmakingQueue: Array<{
    userId: string;
    username: string;
    socketId: string;
    mode: "classic" | "blitz" | "coop";
    difficulty: string;
    queuedAt: number;
  }> = [];

  private static customRooms = new Map<string, {
    roomCode: string;
    host: { userId: string; username: string; socketId?: string };
    mode: "classic" | "blitz" | "coop";
    difficulty: string;
    createdAt: number;
  }>();

  static createCustomRoom(
    host: { userId: string; username: string; socketId?: string },
    mode: "classic" | "blitz" | "coop",
    difficulty: string
  ): string {
    const roomCode = `ARENA-${Math.floor(1000 + Math.random() * 9000)}`;
    this.customRooms.set(roomCode, {
      roomCode,
      host,
      mode: mode || "classic",
      difficulty: difficulty || "ANY",
      createdAt: Date.now()
    });
    return roomCode;
  }

  static getCustomRoom(roomCode: string) {
    return this.customRooms.get(roomCode.toUpperCase().trim());
  }

  static async joinCustomRoom(
    roomCode: string,
    guest: { userId: string; username: string; socketId: string }
  ): Promise<ArenaMatch | null> {
    const cleanCode = roomCode.toUpperCase().trim();
    const room = this.customRooms.get(cleanCode);
    if (!room) return null;

    // Remove custom room once matched
    this.customRooms.delete(cleanCode);

    return await this.createMatchAsync(
      { userId: room.host.userId, username: room.host.username, socketId: room.host.socketId || "" },
      guest,
      room.mode,
      room.difficulty
    );
  }

  static initPersistence() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(MATCHES_FILE)) {
      fs.writeFileSync(MATCHES_FILE, JSON.stringify([]));
    }
  }

  // --- MATCHMAKING QUEUE ---

  static async enqueuePlayer(player: {
    userId: string;
    username: string;
    socketId: string;
    mode: "classic" | "blitz" | "coop";
    difficulty: string;
  }): Promise<{ matched: boolean; match?: ArenaMatch; waitingCount: number }> {
    // Remove if already in queue
    this.matchmakingQueue = this.matchmakingQueue.filter((p) => p.userId !== player.userId);

    // Look for compatible opponent in the queue
    const opponentIdx = this.matchmakingQueue.findIndex(
      (p) => p.mode === player.mode && (p.difficulty === player.difficulty || player.difficulty === "ANY" || p.difficulty === "ANY")
    );

    if (opponentIdx !== -1) {
      const opponent = this.matchmakingQueue.splice(opponentIdx, 1)[0];
      const match = await this.createMatchAsync(player, opponent, player.mode, player.difficulty);
      return { matched: true, match, waitingCount: this.matchmakingQueue.length };
    }

    this.matchmakingQueue.push({ ...player, queuedAt: Date.now() });
    return { matched: false, waitingCount: this.matchmakingQueue.length };
  }

  static dequeuePlayer(socketId: string) {
    this.matchmakingQueue = this.matchmakingQueue.filter((p) => p.socketId !== socketId);
  }

  /**
   * Spawns an instant match with an AI simulated developer
   */
  static async spawnAiMatch(player: {
    userId: string;
    username: string;
    socketId: string;
    mode: "classic" | "blitz" | "coop";
    difficulty: string;
  }): Promise<ArenaMatch> {
    const aiOpponent = {
      userId: "ai_bot_" + Date.now(),
      username: "CyberGrandmaster_AI",
      socketId: "socket_ai_bot",
      mode: player.mode,
      difficulty: player.difficulty,
      isAiBot: true
    };
    return await this.createMatchAsync(player, aiOpponent, player.mode, player.difficulty);
  }

  /**
   * Creates a live match and registers it
   */
  static async createMatchAsync(
    p1: { userId: string; username: string; socketId: string },
    p2: { userId: string; username: string; socketId: string; isAiBot?: boolean },
    mode: "classic" | "blitz" | "coop",
    difficulty: string
  ): Promise<ArenaMatch> {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Pick a problem from the database
    const diffWhere = difficulty === "ANY" ? {} : { difficulty: difficulty as any };
    let problems = await prisma.problem.findMany({
      where: { deletedAt: null, ...diffWhere },
      include: { testCases: { where: { isSample: true } } },
      take: 10
    });

    if (problems.length === 0) {
      problems = await prisma.problem.findMany({
        where: { deletedAt: null },
        include: { testCases: { where: { isSample: true } } },
        take: 5
      });
    }

    const selectedProb = problems[Math.floor(Math.random() * problems.length)] || {
      id: BigInt(1),
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "EASY",
      statement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      constraintsText: "2 <= nums.length <= 10^4",
      inputTemplate: '{"python3": "class Solution:\\n    def twoSum(self, nums, target):\\n        pass"}',
      testCases: []
    };

    const defaultTemplates = {
      python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
      javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
      cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
      java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
    };

    let templates: Record<string, string> = { ...defaultTemplates };
    try {
      const parsed = JSON.parse(selectedProb.inputTemplate || "{}");
      templates = { ...defaultTemplates, ...parsed };
    } catch {}

    const starterCode = templates.python3 || defaultTemplates.python3;

    const sampleTestCases = (selectedProb.testCases || []).map((tc: any, idx: number) => ({
      id: tc.id ? tc.id.toString() : (idx + 1).toString(),
      orderNo: tc.orderNo || idx + 1,
      input: tc.input || "",
      expectedOutput: tc.expectedOutput || "",
      isSample: tc.isSample !== false
    }));

    const finalTestCases = sampleTestCases.length > 0 ? sampleTestCases : [
      { id: "1", orderNo: 1, input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isSample: true },
      { id: "2", orderNo: 2, input: "[3,2,4], 6", expectedOutput: "[1,2]", isSample: true }
    ];

    const durationSec = mode === "blitz" ? 300 : 600; // 5 mins for blitz, 10 mins for classic/coop

    const match: ArenaMatch = {
      id: matchId,
      mode,
      difficulty: selectedProb.difficulty,
      problem: {
        id: selectedProb.id.toString(),
        title: selectedProb.title,
        slug: selectedProb.slug,
        difficulty: selectedProb.difficulty,
        statement: selectedProb.statement,
        constraintsText: selectedProb.constraintsText,
        starterCode,
        templates,
        testCases: finalTestCases
      },
      player1: {
        userId: p1.userId,
        username: p1.username,
        socketId: p1.socketId,
        code: starterCode,
        language: "python3",
        cursorPosition: { lineNumber: 1, column: 1 },
        passedCases: 0,
        totalCases: 0,
        verdict: "PENDING",
        executionTimeMs: 0,
        antiCheatWarnings: 0
      },
      player2: {
        userId: p2.userId,
        username: p2.username,
        socketId: p2.socketId,
        code: starterCode,
        language: "python3",
        cursorPosition: { lineNumber: 1, column: 1 },
        passedCases: 0,
        totalCases: 0,
        verdict: "PENDING",
        executionTimeMs: 0,
        antiCheatWarnings: 0,
        isAiBot: p2.isAiBot || false
      },
      startTime: Date.now(),
      durationSec,
      status: "IN_PROGRESS",
      hints: [
        {
          tier: 1,
          title: "Observation & Invariants",
          content: `Observe the input constraints of "${selectedProb.title}". Analyze whether scanning all combinations exceeds time bounds.`,
          keyTakeaway: "Trade space for linear lookup time.",
          triggerPercent: 25 // at 25% of match duration
        },
        {
          tier: 2,
          title: "Optimal Data Structure",
          content: "Consider using a Hash Map or Two-Pointer approach to eliminate repeated inner loops.",
          keyTakeaway: "Look up previously encountered complements in O(1) time.",
          triggerPercent: 50 // at 50% of match duration
        },
        {
          tier: 3,
          title: "Edge Cases & Boundaries",
          content: "Watch out for duplicate values, negative numbers, and boundary indexing.",
          keyTakeaway: "Test against identical values summing to target.",
          triggerPercent: 75 // at 75% of match duration
        }
      ],
      unlockedHintTiers: [],
      replayTimeline: [
        {
          t: 0,
          type: "match_start",
          userId: "SYSTEM",
          data: { matchId, mode, problemTitle: selectedProb.title }
        }
      ]
    };

    this.activeMatches.set(matchId, match);
    return match;
  }

  // Synchronous wrapper
  static createMatch(
    p1: { userId: string; username: string; socketId: string },
    p2: { userId: string; username: string; socketId: string },
    mode: "classic" | "blitz" | "coop",
    difficulty: string
  ): ArenaMatch {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const defaultTemplates = {
      python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
      javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
      cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
      java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
    };
    const starterCode = defaultTemplates.python3;
    const durationSec = mode === "blitz" ? 300 : 600;

    const match: ArenaMatch = {
      id: matchId,
      mode,
      difficulty,
      problem: {
        id: "1",
        title: "Two Sum",
        slug: "two-sum",
        difficulty: "EASY",
        statement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        constraintsText: "2 <= nums.length <= 10^4",
        starterCode,
        templates: defaultTemplates,
        testCases: [
          { id: "1", orderNo: 1, input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isSample: true },
          { id: "2", orderNo: 2, input: "[3,2,4], 6", expectedOutput: "[1,2]", isSample: true }
        ]
      },
      player1: {
        userId: p1.userId,
        username: p1.username,
        socketId: p1.socketId,
        code: starterCode,
        language: "python3",
        cursorPosition: { lineNumber: 1, column: 1 },
        passedCases: 0,
        totalCases: 0,
        verdict: "PENDING",
        executionTimeMs: 0,
        antiCheatWarnings: 0
      },
      player2: {
        userId: p2.userId,
        username: p2.username,
        socketId: p2.socketId,
        code: starterCode,
        language: "python3",
        cursorPosition: { lineNumber: 1, column: 1 },
        passedCases: 0,
        totalCases: 0,
        verdict: "PENDING",
        executionTimeMs: 0,
        antiCheatWarnings: 0
      },
      startTime: Date.now(),
      durationSec,
      status: "IN_PROGRESS",
      hints: [
        {
          tier: 1,
          title: "Observation & Invariants",
          content: "Observe the input constraints. Analyze whether checking all combinations exceeds time limits.",
          keyTakeaway: "Trade space for fast lookup time.",
          triggerPercent: 25
        },
        {
          tier: 2,
          title: "Optimal Data Structure",
          content: "Use a Hash Map to store elements as you iterate, checking if the complement exists.",
          keyTakeaway: "O(N) single-pass hash map pattern.",
          triggerPercent: 50
        },
        {
          tier: 3,
          title: "Edge Cases & Boundaries",
          content: "Beware of using the exact same element twice or handling negative values.",
          keyTakeaway: "Store seen items after complement checking.",
          triggerPercent: 75
        }
      ],
      unlockedHintTiers: [],
      replayTimeline: [
        {
          t: 0,
          type: "match_start",
          userId: "SYSTEM",
          data: { matchId, mode, problemTitle: "Two Sum" }
        }
      ]
    };

    this.activeMatches.set(matchId, match);
    return match;
  }

  static getActiveMatch(matchId: string): ArenaMatch | undefined {
    return this.activeMatches.get(matchId);
  }

  static findMatchBySocket(socketId: string): ArenaMatch | undefined {
    for (const match of this.activeMatches.values()) {
      if (match.player1.socketId === socketId || match.player2.socketId === socketId) {
        return match;
      }
    }
    return undefined;
  }

  // --- REPLAY & TIMELINE RECORDING ---

  static recordEvent(matchId: string, event: Omit<ReplayEvent, "t">): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;
    const elapsed = Date.now() - match.startTime;
    match.replayTimeline.push({ ...event, t: elapsed });
  }

  static updatePlayerCode(
    matchId: string,
    userId: string,
    code: string,
    cursor?: { lineNumber: number; column: number }
  ): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    const player = match.player1.userId === userId ? match.player1 : match.player2.userId === userId ? match.player2 : null;
    if (player) {
      player.code = code;
      if (cursor) player.cursorPosition = cursor;
      this.recordEvent(matchId, {
        type: "code_update",
        userId,
        data: {
          code,
          charCount: code.length,
          lineCount: code.split("\n").length,
          cursor
        }
      });
    }
  }

  static recordAntiCheatWarning(matchId: string, userId: string, reason: string): number {
    const match = this.activeMatches.get(matchId);
    if (!match) return 0;

    const player = match.player1.userId === userId ? match.player1 : match.player2.userId === userId ? match.player2 : null;
    if (player) {
      player.antiCheatWarnings++;
      this.recordEvent(matchId, {
        type: "paste_warning",
        userId,
        data: { reason, totalWarnings: player.antiCheatWarnings }
      });
      return player.antiCheatWarnings;
    }
    return 0;
  }

  // --- MATCH CONCLUSION & REFEREE EVALUATION ---

  static async concludeMatch(matchId: string, reason = "Time Expired"): Promise<ArenaMatch | null> {
    const match = this.activeMatches.get(matchId);
    if (!match || match.status === "CONCLUDED") return match || null;

    match.status = "CONCLUDED";

    const p1Summary: PlayerMatchSummary = {
      userId: match.player1.userId,
      username: match.player1.username,
      code: match.player1.code,
      language: match.player1.language,
      passedCases: match.player1.passedCases,
      totalCases: match.player1.totalCases,
      verdict: match.player1.verdict,
      executionTimeMs: match.player1.executionTimeMs,
      antiCheatWarnings: match.player1.antiCheatWarnings,
      submittedAtMs: Date.now() - match.startTime
    };

    const p2Summary: PlayerMatchSummary = {
      userId: match.player2.userId,
      username: match.player2.username,
      code: match.player2.code,
      language: match.player2.language,
      passedCases: match.player2.passedCases,
      totalCases: match.player2.totalCases,
      verdict: match.player2.verdict,
      executionTimeMs: match.player2.executionTimeMs,
      antiCheatWarnings: match.player2.antiCheatWarnings,
      submittedAtMs: Date.now() - match.startTime
    };

    const decision = await AiRefereeService.evaluateBattle(
      match.problem.title,
      match.problem.statement,
      p1Summary,
      p2Summary,
      match.mode
    );

    match.decision = decision;

    this.recordEvent(matchId, {
      type: "match_end",
      userId: "REFEREE",
      data: {
        winnerId: decision.winnerId,
        winnerName: decision.winnerName,
        reason: decision.reason
      }
    });

    // Save to persistent file
    this.persistMatch(match);

    return match;
  }

  private static async persistMatch(match: ArenaMatch) {
    // 1. PostgreSQL Database (Permanent storage in online_judge_db)
    try {
      await prisma.arenaMatchRecord.upsert({
        where: { id: match.id },
        create: {
          id: match.id,
          mode: match.mode,
          difficulty: match.difficulty,
          problemId: BigInt(match.problem.id || "1"),
          problemTitle: match.problem.title,
          player1Data: match.player1 as any,
          player2Data: match.player2 as any,
          winnerName: match.decision?.winnerName || "Pending",
          durationSec: match.durationSec,
          startTime: new Date(match.startTime),
          replayTimeline: match.replayTimeline as any,
          refereeDecision: match.decision as any
        },
        update: {
          player1Data: match.player1 as any,
          player2Data: match.player2 as any,
          winnerName: match.decision?.winnerName || "Pending",
          replayTimeline: match.replayTimeline as any,
          refereeDecision: match.decision as any
        }
      });
    } catch (err) {
      console.error("Failed to persist arena match to PostgreSQL database:", err);
    }

    // 2. Also keep local disk file cache
    try {
      this.initPersistence();
      let matches: any[] = [];
      if (fs.existsSync(MATCHES_FILE)) {
        try {
          matches = JSON.parse(fs.readFileSync(MATCHES_FILE, "utf-8"));
        } catch {
          matches = [];
        }
      }
      matches.unshift(match);
      if (matches.length > 100) matches = matches.slice(0, 100);
      fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 2));
    } catch (err) {
      console.error("Failed to persist arena match to JSON file:", err);
    }
  }

  static async getReplay(matchId: string): Promise<ArenaMatch | null> {
    // 1. Check in-memory first
    if (this.activeMatches.has(matchId)) {
      return this.activeMatches.get(matchId)!;
    }

    // 2. Check PostgreSQL Database (Permanent Storage)
    try {
      const dbRecord = await prisma.arenaMatchRecord.findUnique({ where: { id: matchId } });
      if (dbRecord) {
        return {
          id: dbRecord.id,
          mode: dbRecord.mode as any,
          difficulty: dbRecord.difficulty,
          problem: {
            id: dbRecord.problemId.toString(),
            title: dbRecord.problemTitle,
            slug: "",
            difficulty: dbRecord.difficulty,
            statement: "",
            constraintsText: "",
            starterCode: "",
            templates: {},
            testCases: []
          },
          player1: dbRecord.player1Data as any,
          player2: dbRecord.player2Data as any,
          startTime: dbRecord.startTime.getTime(),
          durationSec: dbRecord.durationSec,
          status: "CONCLUDED",
          hints: [],
          unlockedHintTiers: [],
          replayTimeline: dbRecord.replayTimeline as any,
          decision: dbRecord.refereeDecision as any
        };
      }
    } catch (err) {
      console.error("Error reading replay from database:", err);
    }

    // 3. Check persistent file fallback
    try {
      if (fs.existsSync(MATCHES_FILE)) {
        const matches: ArenaMatch[] = JSON.parse(fs.readFileSync(MATCHES_FILE, "utf-8"));
        return matches.find((m) => m.id === matchId) || null;
      }
    } catch {}
    return null;
  }

  static async getRecentMatches(): Promise<any[]> {
    // 1. Query PostgreSQL Database (Permanent)
    try {
      const dbMatches = await prisma.arenaMatchRecord.findMany({
        orderBy: { createdAt: "desc" },
        take: 50
      });
      if (dbMatches.length > 0) {
        return dbMatches.map((m) => {
          const p1 = m.player1Data as any;
          const p2 = m.player2Data as any;
          const dec = m.refereeDecision as any;
          return {
            id: m.id,
            mode: m.mode,
            difficulty: m.difficulty,
            problemTitle: m.problemTitle,
            player1: { username: p1?.username || "Player 1", score: dec?.scores?.player1?.totalScore || 0 },
            player2: { username: p2?.username || "Player 2", score: dec?.scores?.player2?.totalScore || 0 },
            winnerName: m.winnerName,
            startTime: m.startTime.getTime(),
            durationSec: m.durationSec
          };
        });
      }
    } catch (err) {
      console.error("Error querying recent matches from database:", err);
    }

    // 2. Query file fallback
    try {
      if (fs.existsSync(MATCHES_FILE)) {
        const matches: ArenaMatch[] = JSON.parse(fs.readFileSync(MATCHES_FILE, "utf-8"));
        return matches.map((m) => ({
          id: m.id,
          mode: m.mode,
          difficulty: m.difficulty,
          problemTitle: m.problem.title,
          player1: { username: m.player1.username, score: m.decision?.scores.player1.totalScore || 0 },
          player2: { username: m.player2.username, score: m.decision?.scores.player2.totalScore || 0 },
          winnerName: m.decision?.winnerName || "Pending",
          startTime: m.startTime,
          durationSec: m.durationSec
        }));
      }
    } catch {}
    return [];
  }
}
