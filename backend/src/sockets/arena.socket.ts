import { Server, Socket } from "socket.io";
import { ArenaService, ArenaMatch } from "../services/arena.service";
import { prisma } from "../config/db";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export function registerArenaSocketHandlers(io: Server, socket: Socket) {
  // 1. JOIN MATCHMAKING QUEUE
  socket.on(
    "arena:join_queue",
    async (payload: { userId: string; username: string; mode: "classic" | "blitz" | "coop"; difficulty: string }) => {
      console.log(`[ARENA] Player ${payload.username} (${payload.userId}) joined queue for [${payload.mode}] [${payload.difficulty}]`);

      const result = ArenaService.enqueuePlayer({
        userId: payload.userId,
        username: payload.username,
        socketId: socket.id,
        mode: payload.mode || "classic",
        difficulty: payload.difficulty || "ANY"
      });

      if (result.matched && result.match) {
        const match = result.match;
        console.log(`[ARENA] Match formed! Room: ${match.id} (${match.player1.username} vs ${match.player2.username})`);

        // Put both players in match room
        const s1 = io.sockets.sockets.get(match.player1.socketId);
        const s2 = io.sockets.sockets.get(match.player2.socketId);
        if (s1) s1.join(match.id);
        if (s2) s2.join(match.id);

        io.to(match.id).emit("arena:match_start", {
          matchId: match.id,
          mode: match.mode,
          difficulty: match.difficulty,
          problem: match.problem,
          durationSec: match.durationSec,
          startTime: match.startTime,
          player1: { userId: match.player1.userId, username: match.player1.username },
          player2: { userId: match.player2.userId, username: match.player2.username }
        });

        // Start match timer and hint ticker
        startMatchTicker(io, match.id);
      } else {
        socket.emit("arena:queue_waiting", {
          waitingCount: result.waitingCount,
          message: "Searching for worthy opponent in the Arena..."
        });
      }
    }
  );

  // 2. SPAWN AI PRACTICE BOT OPPONENT
  socket.on(
    "arena:spawn_ai_match",
    async (payload: { userId: string; username: string; mode: "classic" | "blitz" | "coop"; difficulty: string }) => {
      console.log(`[ARENA] Spawning AI practice opponent for ${payload.username}`);
      const match = await ArenaService.spawnAiMatch({
        userId: payload.userId,
        username: payload.username,
        socketId: socket.id,
        mode: payload.mode || "classic",
        difficulty: payload.difficulty || "ANY"
      });

      socket.join(match.id);

      socket.emit("arena:match_start", {
        matchId: match.id,
        mode: match.mode,
        difficulty: match.difficulty,
        problem: match.problem,
        durationSec: match.durationSec,
        startTime: match.startTime,
        player1: { userId: match.player1.userId, username: match.player1.username },
        player2: { userId: match.player2.userId, username: match.player2.username, isAiBot: true }
      });

      startMatchTicker(io, match.id);
      startAiBotSimulation(io, match.id);
    }
  );

  // 3. LEAVE MATCHMAKING QUEUE
  socket.on("arena:leave_queue", () => {
    ArenaService.dequeuePlayer(socket.id);
    socket.emit("arena:queue_left");
  });

  // 3B. CREATE CUSTOM PRIVATE ROOM
  socket.on(
    "arena:create_custom_room",
    (payload: { userId: string; username: string; mode: "classic" | "blitz" | "coop"; difficulty: string }) => {
      const roomCode = ArenaService.createCustomRoom(
        { userId: payload.userId, username: payload.username, socketId: socket.id },
        payload.mode || "classic",
        payload.difficulty || "ANY"
      );
      socket.join(roomCode);
      socket.emit("arena:custom_room_created", {
        roomCode,
        mode: payload.mode || "classic",
        difficulty: payload.difficulty || "ANY"
      });
      console.log(`[ARENA] Custom private room created: ${roomCode} by ${payload.username}`);
    }
  );

  // 3C. JOIN CUSTOM PRIVATE ROOM
  socket.on(
    "arena:join_custom_room",
    async (payload: { roomCode: string; userId: string; username: string }) => {
      const room = ArenaService.getCustomRoom(payload.roomCode);
      if (!room) {
        socket.emit("arena:join_room_failed", { message: "Invalid or expired room code." });
        return;
      }

      const match = await ArenaService.joinCustomRoom(payload.roomCode, {
        userId: payload.userId,
        username: payload.username,
        socketId: socket.id
      });

      if (match) {
        const s1 = io.sockets.sockets.get(match.player1.socketId);
        const s2 = socket;
        if (s1) s1.join(match.id);
        s2.join(match.id);

        io.to(match.id).emit("arena:match_start", {
          matchId: match.id,
          mode: match.mode,
          difficulty: match.difficulty,
          problem: match.problem,
          durationSec: match.durationSec,
          startTime: match.startTime,
          player1: { userId: match.player1.userId, username: match.player1.username },
          player2: { userId: match.player2.userId, username: match.player2.username }
        });

        startMatchTicker(io, match.id);
      } else {
        socket.emit("arena:join_room_failed", { message: "Failed to join private room." });
      }
    }
  );

  // 3D. JOIN MATCH ROOM (for reconnects)
  socket.on("arena:join_match_room", (payload: { matchId: string; userId: string }) => {
    const match = ArenaService.getActiveMatch(payload.matchId);
    if (match) {
      socket.join(payload.matchId);
      // Update socket id if user reconnected
      if (match.player1.userId === payload.userId) match.player1.socketId = socket.id;
      if (match.player2.userId === payload.userId) match.player2.socketId = socket.id;

      socket.emit("arena:match_state", {
        matchId: match.id,
        mode: match.mode,
        difficulty: match.difficulty,
        problem: match.problem,
        durationSec: match.durationSec,
        startTime: match.startTime,
        status: match.status,
        player1: {
          userId: match.player1.userId,
          username: match.player1.username,
          code: match.player1.code,
          verdict: match.player1.verdict,
          passedCases: match.player1.passedCases,
          totalCases: match.player1.totalCases,
          warnings: match.player1.antiCheatWarnings
        },
        player2: {
          userId: match.player2.userId,
          username: match.player2.username,
          code: match.mode === "coop" ? match.player2.code : undefined, // hidden in 1v1
          verdict: match.player2.verdict,
          passedCases: match.player2.passedCases,
          totalCases: match.player2.totalCases,
          warnings: match.player2.antiCheatWarnings,
          isAiBot: match.player2.isAiBot
        },
        unlockedHints: match.hints.filter((h) => match.unlockedHintTiers.includes(h.tier))
      });
    }
  });

  // 4. CODE KEYSTROKE & ANTI-CHEAT MONITORING
  socket.on(
    "arena:code_keystroke",
    (payload: {
      matchId: string;
      userId: string;
      code: string;
      cursor?: { lineNumber: number; column: number };
      isPaste?: boolean;
      pastedLength?: number;
    }) => {
      const match = ArenaService.getActiveMatch(payload.matchId);
      if (!match || match.status !== "IN_PROGRESS") return;

      // Anti-Cheat check: massive clipboard dump detection (>150 characters in one event)
      if (payload.isPaste && (payload.pastedLength || 0) > 150) {
        const warnings = ArenaService.recordAntiCheatWarning(
          payload.matchId,
          payload.userId,
          `Massive clipboard paste detected (${payload.pastedLength} characters). Malpractice penalty logged.`
        );

        io.to(payload.matchId).emit("arena:anti_cheat_alert", {
          userId: payload.userId,
          warnings,
          message: `⚠️ Malpractice Flag: Player pasted ${payload.pastedLength} characters in a single stroke. Warning ${warnings}/2 applied.`
        });
      }

      // Update in memory and record timeline event
      ArenaService.updatePlayerCode(payload.matchId, payload.userId, payload.code, payload.cursor);

      if (match.mode === "coop") {
        // In Co-Op mode, sync the exact code document to the partner in real-time
        socket.to(payload.matchId).emit("arena:coop_code_sync", {
          userId: payload.userId,
          code: payload.code,
          cursor: payload.cursor
        });
      } else {
        // In 1v1 Battle Mode: don't reveal full code, but broadcast typing activity telemetry
        socket.to(payload.matchId).emit("arena:opponent_progress", {
          userId: payload.userId,
          charCount: payload.code.length,
          lineCount: payload.code.split("\n").length,
          cursor: payload.cursor
        });
      }
    }
  );

  // 5. RUN CODE (SAMPLE TESTS)
  socket.on(
    "arena:run_tests",
    async (payload: { matchId: string; userId: string; code: string; language: string }) => {
      const match = ArenaService.getActiveMatch(payload.matchId);
      if (!match) return;

      ArenaService.recordEvent(payload.matchId, {
        type: "run_tests",
        userId: payload.userId,
        data: { language: payload.language }
      });

      // Notify opponent of run attempt
      socket.to(payload.matchId).emit("arena:opponent_ran_tests", {
        userId: payload.userId,
        message: "Opponent is running test cases..."
      });
    }
  );

  // 6. SUBMIT SOLUTION
  socket.on(
    "arena:submit_solution",
    async (payload: {
      matchId: string;
      userId: string;
      code: string;
      language: string;
      passedCases: number;
      totalCases: number;
      verdict: string;
      executionTimeMs: number;
    }) => {
      const match = ArenaService.getActiveMatch(payload.matchId);
      if (!match || match.status !== "IN_PROGRESS") return;

      const player = match.player1.userId === payload.userId ? match.player1 : match.player2.userId === payload.userId ? match.player2 : null;
      if (player) {
        player.code = payload.code;
        player.language = payload.language;
        player.passedCases = payload.passedCases;
        player.totalCases = payload.totalCases;
        player.verdict = payload.verdict;
        player.executionTimeMs = payload.executionTimeMs;
      }

      ArenaService.recordEvent(payload.matchId, {
        type: "submit_attempt",
        userId: payload.userId,
        data: {
          verdict: payload.verdict,
          passedCases: payload.passedCases,
          totalCases: payload.totalCases,
          executionTimeMs: payload.executionTimeMs
        }
      });

      io.to(payload.matchId).emit("arena:opponent_submitted", {
        userId: payload.userId,
        passedCases: payload.passedCases,
        totalCases: payload.totalCases,
        verdict: payload.verdict
      });

      // In BLITZ mode: First accepted submission wins immediately!
      if (match.mode === "blitz" && payload.verdict === "ACCEPTED" && payload.passedCases === payload.totalCases) {
        console.log(`[ARENA] Blitz immediate victory by ${payload.userId}!`);
        const concluded = await ArenaService.concludeMatch(payload.matchId, "First Blood Accepted Submission in Blitz Mode");
        if (concluded && concluded.decision) {
          io.to(payload.matchId).emit("arena:match_concluded", {
            match: concluded,
            decision: concluded.decision
          });
        }
        return;
      }

      // In CLASSIC mode: If both players have submitted, trigger immediate referee evaluation
      if (match.player1.verdict !== "PENDING" && match.player2.verdict !== "PENDING") {
        console.log(`[ARENA] Both players submitted. Triggering Grandmaster AI Referee evaluation for ${payload.matchId}`);
        const concluded = await ArenaService.concludeMatch(payload.matchId, "Both Players Submitted");
        if (concluded && concluded.decision) {
          io.to(payload.matchId).emit("arena:match_concluded", {
            match: concluded,
            decision: concluded.decision
          });
        }
      }
    }
  );

  // 7. SURRENDER / FORFEIT
  socket.on("arena:surrender", async (payload: { matchId: string; userId: string }) => {
    const match = ArenaService.getActiveMatch(payload.matchId);
    if (!match || match.status !== "IN_PROGRESS") return;

    const winnerId = match.player1.userId === payload.userId ? match.player2.userId : match.player1.userId;
    const winnerName = match.player1.userId === payload.userId ? match.player2.username : match.player1.username;

    const concluded = await ArenaService.concludeMatch(payload.matchId, `Player Forfeit`);
    if (concluded) {
      if (concluded.decision) {
        concluded.decision.winnerId = winnerId;
        concluded.decision.winnerName = winnerName;
        concluded.decision.reason = `${winnerName} won by opponent forfeit.`;
      }
      io.to(payload.matchId).emit("arena:match_concluded", {
        match: concluded,
        decision: concluded.decision
      });
    }
  });

  // 8. DISCONNECT HANDLING
  socket.on("disconnect", () => {
    ArenaService.dequeuePlayer(socket.id);
  });
}

/**
 * Monitors match countdown and progressive AI hints release
 */
function startMatchTicker(io: Server, matchId: string) {
  const match = ArenaService.getActiveMatch(matchId);
  if (!match) return;

  const totalSec = match.durationSec;
  const interval = setInterval(async () => {
    const currentMatch = ArenaService.getActiveMatch(matchId);
    if (!currentMatch || currentMatch.status !== "IN_PROGRESS") {
      clearInterval(interval);
      return;
    }

    const elapsedSec = Math.floor((Date.now() - currentMatch.startTime) / 1000);
    const remainingSec = Math.max(0, totalSec - elapsedSec);
    const progressPercent = Math.floor((elapsedSec / totalSec) * 100);

    // Check progressive hints release
    for (const hint of currentMatch.hints) {
      if (progressPercent >= hint.triggerPercent && !currentMatch.unlockedHintTiers.includes(hint.tier)) {
        currentMatch.unlockedHintTiers.push(hint.tier);
        ArenaService.recordEvent(matchId, {
          type: "hint_unlocked",
          userId: "AI_ORCHESTRATOR",
          data: hint
        });

        io.to(matchId).emit("arena:hint_unlocked", {
          tier: hint.tier,
          title: hint.title,
          content: hint.content,
          keyTakeaway: hint.keyTakeaway
        });
      }
    }

    // Time expired: Conclude match
    if (remainingSec <= 0) {
      clearInterval(interval);
      console.log(`[ARENA] Match ${matchId} time expired. Concluding via AI Referee.`);
      const concluded = await ArenaService.concludeMatch(matchId, "Timer Expired");
      if (concluded && concluded.decision) {
        io.to(matchId).emit("arena:match_concluded", {
          match: concluded,
          decision: concluded.decision
        });
      }
    }
  }, 2000);
}

/**
 * Simulates a realistic AI competitor coding in the arena
 */
function startAiBotSimulation(io: Server, matchId: string) {
  const match = ArenaService.getActiveMatch(matchId);
  if (!match) return;

  const codeSnippets = [
    "class Solution:\n    def solve(self, nums, target):\n        # Hash map two-pass\n        seen = {}\n",
    "class Solution:\n    def solve(self, nums, target):\n        # Hash map two-pass\n        seen = {}\n        for i, n in enumerate(nums):\n            comp = target - n\n",
    "class Solution:\n    def solve(self, nums, target):\n        seen = {}\n        for i, n in enumerate(nums):\n            comp = target - n\n            if comp in seen:\n                return [seen[comp], i]\n            seen[n] = i\n        return []"
  ];

  let step = 0;
  const interval = setInterval(async () => {
    const currentMatch = ArenaService.getActiveMatch(matchId);
    if (!currentMatch || currentMatch.status !== "IN_PROGRESS") {
      clearInterval(interval);
      return;
    }

    if (step < codeSnippets.length) {
      const code = codeSnippets[step];
      currentMatch.player2.code = code;
      ArenaService.updatePlayerCode(matchId, currentMatch.player2.userId, code);
      io.to(matchId).emit("arena:opponent_progress", {
        userId: currentMatch.player2.userId,
        charCount: code.length,
        lineCount: code.split("\n").length
      });
      step++;
    } else if (step === codeSnippets.length) {
      // Simulate submission after ~20 seconds
      currentMatch.player2.passedCases = 8;
      currentMatch.player2.totalCases = 8;
      currentMatch.player2.verdict = "ACCEPTED";
      currentMatch.player2.executionTimeMs = 42;

      ArenaService.recordEvent(matchId, {
        type: "submit_attempt",
        userId: currentMatch.player2.userId,
        data: { verdict: "ACCEPTED", passedCases: 8, totalCases: 8 }
      });

      io.to(matchId).emit("arena:opponent_submitted", {
        userId: currentMatch.player2.userId,
        passedCases: 8,
        totalCases: 8,
        verdict: "ACCEPTED"
      });

      clearInterval(interval);
    }
  }, 5000);
}
