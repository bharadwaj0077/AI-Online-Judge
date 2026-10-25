"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Swords,
  Zap,
  Users,
  ShieldAlert,
  Bot,
  Play,
  Copy,
  Check,
  RotateCw,
  Clock,
  Award,
  ChevronRight,
  Flame,
  Radio,
  Search,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { getArenaSocket } from "@/lib/socket";

interface ArenaMatchSummary {
  id: string;
  mode: "classic" | "blitz" | "coop";
  difficulty: string;
  problemTitle: string;
  player1: { username: string; score: number };
  player2: { username: string; score: number };
  winnerName: string;
  startTime: number;
  durationSec: number;
}

export default function ArenaLobbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [selectedMode, setSelectedMode] = useState<"classic" | "blitz" | "coop">("classic");
  const [difficulty, setDifficulty] = useState<string>("ANY");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [queueTime, setQueueTime] = useState<number>(0);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [recentMatches, setRecentMatches] = useState<ArenaMatchSummary[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);

  // Private room state
  const [privateRoomCode, setPrivateRoomCode] = useState<string>("");
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check logged in user or generate guest ID
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser({ id: u.id?.toString() || `u_${Date.now()}`, username: u.username || u.name || "Warrior" });
      } catch {
        setUser({ id: `guest_${Date.now()}`, username: `Guest_${Math.floor(Math.random() * 900 + 100)}` });
      }
    } else {
      setUser({ id: `guest_${Date.now()}`, username: `Gladiator_${Math.floor(Math.random() * 900 + 100)}` });
    }

    loadRecentMatches();

    const socket = getArenaSocket();

    socket.on("arena:queue_waiting", (data: { waitingCount: number; message: string }) => {
      setWaitingCount(data.waitingCount);
    });

    socket.on("arena:match_start", (data: { matchId: string }) => {
      setIsSearching(false);
      if (timerRef.current) clearInterval(timerRef.current);
      router.push(`/arena/${data.matchId}`);
    });

    socket.on("arena:custom_room_created", (data: { roomCode: string }) => {
      setPrivateRoomCode(data.roomCode);
    });

    socket.on("arena:join_room_failed", (data: { message: string }) => {
      setErrorMessage(data.message);
      setTimeout(() => setErrorMessage(null), 4000);
    });

    return () => {
      socket.off("arena:queue_waiting");
      socket.off("arena:match_start");
      socket.off("arena:custom_room_created");
      socket.off("arena:join_room_failed");
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [router]);

  const loadRecentMatches = async () => {
    setLoadingMatches(true);
    try {
      const res = await api.get("/arena/matches");
      if (res.data?.success) {
        setRecentMatches(res.data.data || []);
      }
    } catch {
      // Fallback empty
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleStartQueue = () => {
    if (!user) return;
    setIsSearching(true);
    setQueueTime(0);
    setErrorMessage(null);

    const socket = getArenaSocket();
    socket.emit("arena:join_queue", {
      userId: user.id,
      username: user.username,
      mode: selectedMode,
      difficulty,
    });

    timerRef.current = setInterval(() => {
      setQueueTime((prev) => prev + 1);
    }, 1000);
  };

  const handleCancelQueue = () => {
    setIsSearching(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const socket = getArenaSocket();
    socket.emit("arena:leave_queue");
  };

  const handlePlayVsAi = () => {
    if (!user) return;
    setIsSearching(false);
    const socket = getArenaSocket();
    socket.emit("arena:spawn_ai_match", {
      userId: user.id,
      username: user.username,
      mode: selectedMode,
      difficulty,
    });
  };

  const handleCreatePrivateRoom = () => {
    if (!user) return;
    const socket = getArenaSocket();
    socket.emit("arena:create_custom_room", {
      userId: user.id,
      username: user.username,
      mode: selectedMode,
      difficulty,
    });
  };

  const handleJoinPrivateRoom = () => {
    if (!user || !joinCodeInput.trim()) return;
    const socket = getArenaSocket();
    socket.emit("arena:join_custom_room", {
      roomCode: joinCodeInput.trim().toUpperCase(),
      userId: user.id,
      username: user.username,
    });
  };

  const handleCopyCode = () => {
    if (!privateRoomCode) return;
    navigator.clipboard.writeText(privateRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans pb-16 selection:bg-rose-500 selection:text-white">
      {/* Background Neon Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-zinc-800/80 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5 animate-bounce" /> Real-time Synchronized Showdown
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              1v1 Code Wars <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500">Arena</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Challenge developers worldwide or test your mettle against the CyberGrandmaster AI.
              Featuring progressive hints, anti-cheat telemetry monitoring, and impartial AI refereeing.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl backdrop-blur-md">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-sm">
              {user?.username?.charAt(0).toUpperCase() || "W"}
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-mono">PILOT IDENTITY</div>
              <div className="text-sm font-bold text-white font-mono">{user?.username || "Warrior"}</div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Grid: Modes + Radar Matchmaking */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column: Battle Modes Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> 1. Select Battle Mode
              </h2>

              <div className="grid grid-cols-1 gap-3.5">
                {/* Mode 1: Classic */}
                <div
                  onClick={() => !isSearching && setSelectedMode("classic")}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    selectedMode === "classic"
                      ? "bg-rose-950/20 border-rose-500/80 shadow-lg shadow-rose-950/30"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${selectedMode === "classic" ? "bg-rose-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                        <Swords className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          Classic 1v1 Battle
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                            POPULAR
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          10-minute battle on identical problems. Synchronized AI hints unlock at 25%, 50%, and 75%. Impartial AI Grandmaster Referee evaluates code cleanliness, efficiency, and test cases.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mode 2: Speed Blitz */}
                <div
                  onClick={() => !isSearching && setSelectedMode("blitz")}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    selectedMode === "blitz"
                      ? "bg-amber-950/20 border-amber-500/80 shadow-lg shadow-amber-950/30"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${selectedMode === "blitz" ? "bg-amber-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          Speed Blitz Duel
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">
                            HIGH ADRENALINE
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          5-minute rapid sprint. First developer to achieve an ACCEPTED submission across all test cases claims instant sudden death victory!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mode 3: Co-Op Duo */}
                <div
                  onClick={() => !isSearching && setSelectedMode("coop")}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    selectedMode === "coop"
                      ? "bg-emerald-950/20 border-emerald-500/80 shadow-lg shadow-emerald-950/30"
                      : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${selectedMode === "coop" ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          Co-Op Duo Collaborative
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                            TEAMWORK
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          Live pair programming on the same document with synchronized multi-cursor editing. Work together against the clock to solve complex problems!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 2. Target Difficulty
              </h2>
              <div className="grid grid-cols-4 gap-2.5">
                {["ANY", "EASY", "MEDIUM", "HARD"].map((diff) => (
                  <button
                    key={diff}
                    disabled={isSearching}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all border ${
                      difficulty === diff
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                        : "bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Anti-Cheat Telemetry Notice */}
            <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-400 leading-relaxed">
                <strong className="text-zinc-200">AI Anti-Cheat Telemetry Active:</strong> Sudden clipboard dumps (&gt;150 characters) or automated script injection are monitored in real-time. Unsportsmanlike conduct results in score deductions or forfeiture by the Grandmaster Referee.
              </div>
            </div>
          </div>

          {/* Right Column: Matchmaking Radar & Private Code (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Matchmaking Control Center */}
            <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4 flex items-center justify-between">
                <span>RADAR MATCHMAKING</span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" /> ONLINE
                </span>
              </div>

              {!isSearching ? (
                <div className="space-y-4">
                  <button
                    onClick={handleStartQueue}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Enter Matchmaking Radar
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-800"></div>
                    <span className="flex-shrink mx-3 text-zinc-500 text-[10px] font-mono uppercase">Instant Practice</span>
                    <div className="flex-grow border-t border-zinc-800"></div>
                  </div>

                  <button
                    onClick={handlePlayVsAi}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/90 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    <Bot className="w-4 h-4 text-indigo-400" />
                    Duel CyberGrandmaster AI (Instant)
                  </button>
                </div>
              ) : (
                /* Searching Radar View */
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  {/* Radar Animation */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-rose-500/20 animate-ping"></div>
                    <div className="absolute inset-2 rounded-full border border-rose-500/40 animate-pulse"></div>
                    <div className="absolute inset-6 rounded-full border border-indigo-500/40"></div>
                    <div className="h-10 w-10 rounded-full bg-rose-600/20 border border-rose-500 flex items-center justify-center text-rose-400">
                      <Radio className="w-5 h-5 animate-spin" />
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-white font-mono">
                      Searching for Opponent... ({formatTimer(queueTime)})
                    </div>
                    <div className="text-xs text-zinc-400 mt-1 font-mono">
                      Mode: <span className="text-rose-400 uppercase font-bold">{selectedMode}</span> | Difficulty: <span className="text-indigo-400 font-bold">{difficulty}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-2 pt-2">
                    <button
                      onClick={handleCancelQueue}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 text-zinc-400 border border-zinc-700 text-xs font-mono transition-all cursor-pointer"
                    >
                      Cancel Search
                    </button>
                    <button
                      onClick={handlePlayVsAi}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" /> Skip wait: Duel AI Bot
                    </button>
                  </div>
                </div>
              )}

              {/* Private Custom Match Section */}
              <div className="mt-6 pt-5 border-t border-zinc-800">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                  <span>PRIVATE FRIEND MATCH</span>
                  <span className="text-[10px] text-zinc-500 font-mono">DIRECT INVITE</span>
                </div>

                {!privateRoomCode ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ENTER ROOM CODE (e.g. ARENA-1234)"
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={handleJoinPrivateRoom}
                        disabled={!joinCodeInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                      >
                        Join
                      </button>
                    </div>

                    <button
                      onClick={handleCreatePrivateRoom}
                      className="w-full py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-zinc-400" /> Generate Private Room Code
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-indigo-500/40 space-y-2">
                    <div className="text-[11px] text-zinc-400 font-mono">Share this Room Code with your friend:</div>
                    <div className="flex items-center justify-between bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                      <span className="font-mono text-base font-bold text-indigo-400 tracking-wider">
                        {privateRoomCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="text-xs text-zinc-300 hover:text-white flex items-center gap-1 font-mono px-2 py-1 rounded bg-zinc-800"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCode ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono text-center animate-pulse">
                      Waiting for opponent to connect with code...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Matches & Replay Theatre Highlights */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" /> Recent Arena Battles & Replays
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Watch timeline scrubbable replays with side-by-side code evolution and referee scorecards.
              </p>
            </div>
            <button
              onClick={loadRecentMatches}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <RotateCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
            {loadingMatches ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">
                Loading arena battle history...
              </div>
            ) : recentMatches.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-zinc-500">
                No arena matches recorded yet. Launch a match above to make history!
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {recentMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-rose-400 font-mono text-xs">
                        {m.mode === "blitz" ? <Zap className="w-4 h-4 text-amber-400" /> : m.mode === "coop" ? <Users className="w-4 h-4 text-emerald-400" /> : <Swords className="w-4 h-4 text-rose-400" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          {m.problemTitle}
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                            {m.difficulty}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2 font-mono">
                          <span className="text-zinc-200 font-semibold">{m.player1.username}</span>
                          <span className="text-zinc-500">vs</span>
                          <span className="text-zinc-200 font-semibold">{m.player2.username}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-emerald-400 font-semibold">Winner: {m.winnerName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/arena/replay/${m.id}`)}
                        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                        Watch Replay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
