"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowRight,
  BookOpen,
  Trophy,
  Swords,
  Bot,
  Eye,
  Sparkles,
  Zap,
  Mic,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Volume2
} from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"arena" | "interview" | "visualizer">("arena");

  useEffect(() => {
    const token = localStorage.getItem("token") || document.cookie.includes("token=");
    if (!token) {
      window.location.href = "/login";
    } else {
      setAuthenticated(true);
      setLoading(false);
    }
  }, []);

  if (loading || !authenticated) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 font-mono text-xs gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span>Loading workspace dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-100 font-sans p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      
      {/* 🚀 FLAGSHIP AI & REAL-TIME PLATFORMS SHOWCASE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Flagship Innovation Suite
              </span>
              <span className="text-zinc-500 text-xs font-mono">Next-Gen Developer Training</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Real-Time Battle Arenas & AI Engineering Labs
            </h1>
          </div>
          <p className="text-xs text-zinc-400 font-mono max-w-sm sm:text-right">
            Head-to-head live battles, conversational audio interviews, and step-by-step algorithm memory execution.
          </p>
        </div>

        {/* 3 PREMIER FLAGSHIP FEATURE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* CARD 1: 1V1 REAL-TIME CODE WARS ARENA */}
          <div className="relative group rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-950/20 via-zinc-900/90 to-zinc-950 p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:border-rose-500/60 hover:shadow-xl hover:shadow-rose-950/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Swords className="h-5 w-5 animate-pulse" />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full font-bold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" /> LIVE PVP
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                  1v1 Code Wars Arena
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Real-time multiplayer coding duels with live keystroke streaming, Sentinel anti-cheat, Grandmaster AI bots, and AI referee scoring.
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">⚡ WebSockets</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🛡️ Anti-Cheat</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🤖 AI Referee</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">📼 Replay Theater</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/arena"
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all font-mono"
              >
                <Swords className="h-4 w-4" /> Enter 1v1 Arena <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>Ranked & Blitz</span>
                <span className="text-rose-400 font-semibold">100-pt Rubric</span>
              </div>
            </div>
          </div>

          {/* CARD 2: CONVERSATIONAL AI MOCK INTERVIEWER */}
          <div className="relative group rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 via-zinc-900/90 to-zinc-950 p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-bold flex items-center gap-1">
                  <Volume2 className="h-3 w-3" /> 4 VOICES
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                  AI Mock Interviewer
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Real-time voice-driven technical interview simulation with 4 distinct personas, push-to-talk speech streaming, CS fundamentals, and FAANG scorecards.
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🎙️ Tap to Speak</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🎭 4 Personas</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">💻 OS & Concurrency</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">📊 FAANG Rubric</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/interview"
                className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all font-mono"
              >
                <Mic className="h-4 w-4" /> Launch AI Interview <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>Alex, Marcus, Sarah, Elena</span>
                <span className="text-cyan-400 font-semibold">Live Speech</span>
              </div>
            </div>
          </div>

          {/* CARD 3: VISUAL ALGORITHM EXECUTION PROFILER */}
          <div className="relative group rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/20 via-zinc-900/90 to-zinc-950 p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:border-purple-500/60 hover:shadow-xl hover:shadow-purple-950/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Eye className="h-5 w-5 animate-pulse" />
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded-full font-bold flex items-center gap-1">
                  <Layers className="h-3 w-3" /> STEP TRACER
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                  Visual Algorithm Profiler
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Interactive step-by-step algorithm memory execution canvas with animated pointers, linked list node reversal, stack canisters, trees, and DP grids.
                </p>
              </div>

              <div className="pt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🎬 Step Scrubber</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🔀 Two Pointers</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🔗 Linked List</span>
                <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60">🥞 Stacks & DP</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                href="/visualizer"
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all font-mono"
              >
                <Eye className="h-4 w-4" /> Open Visualizer <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                <span>Dynamic Evaluation</span>
                <span className="text-purple-400 font-semibold">Zero Hardcode</span>
              </div>
            </div>
          </div>

        </div>

        {/* 🎮 INTERACTIVE FEATURE PREVIEW SIMULATOR */}
        <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-mono font-bold uppercase text-zinc-300 tracking-wider">
                Live Interactive System Simulator
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                onClick={() => setActiveTab("arena")}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeTab === "arena"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm"
                    : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-white"
                }`}
              >
                ⚔️ 1v1 Battle Telemetry
              </button>
              <button
                onClick={() => setActiveTab("interview")}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeTab === "interview"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                    : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-white"
                }`}
              >
                🎙️ AI Audio & Voice
              </button>
              <button
                onClick={() => setActiveTab("visualizer")}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  activeTab === "visualizer"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm"
                    : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60 hover:text-white"
                }`}
              >
                🎬 Algorithm Stepper
              </button>
            </div>
          </div>

          {/* TAB 1: ARENA SIMULATION */}
          {activeTab === "arena" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center font-mono">
              <div className="md:col-span-2 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Match: <strong className="text-white">Valid Anagram (Blitz Duel)</strong></span>
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Referee Judged
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                      <span>Player 1 (You): 10/10 Cases Passed · 45ms</span>
                      <span className="text-emerald-400 font-bold">Score: 93/100</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full w-[93%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                      <span>Player 2 (Opponent): 10/10 Cases Passed · 180ms</span>
                      <span className="text-amber-400 font-bold">Score: 81/100</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full w-[81%]" />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2">
                  <span className="text-rose-400 font-bold">AI Referee Verdict:</span> Player 1 demonstrated superior O(N) hash frequency optimization vs brute-force sorting. Winner: Player 1.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">Instant Battle Matchmaking</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">Challenge coders worldwide or duel the CyberGrandmaster AI bot in private sandbox rooms.</p>
                </div>
                <Link
                  href="/arena"
                  className="py-2 px-3 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs rounded-lg text-center transition-all"
                >
                  Enter Matchmaking Queue ⚔️
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEW SIMULATION */}
          {activeTab === "interview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center font-mono">
              <div className="md:col-span-2 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Interviewer: <strong className="text-cyan-300">Alex (Staff Systems Engineer)</strong></span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px]">
                    Topic: OS & Concurrency
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-[11px] font-bold">
                    <Volume2 className="h-3.5 w-3.5 animate-pulse" /> Interviewer Speech Stream:
                  </div>
                  <p className="text-zinc-300 text-xs italic">
                    &quot;Great start using condition variables for the bounded blocking queue! How would you prevent spurious wakeups and ensure fair producer-consumer scheduling?&quot;
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400">✓ Push-to-Talk Speech Engine</span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-cyan-400">✓ Auto Silence Detection</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">4 Voice Personas Available</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">Experience lifelike interviewers across Alex, Marcus, Sarah, and Elena with tailored rubrics.</p>
                </div>
                <Link
                  href="/interview"
                  className="py-2 px-3 bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-black border border-cyan-500/40 font-bold text-xs rounded-lg text-center transition-all"
                >
                  Configure Audio Interview 🎙️
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: VISUALIZER SIMULATION */}
          {activeTab === "visualizer" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center font-mono">
              <div className="md:col-span-2 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Algorithm: <strong className="text-purple-300">Two Pointers · Target: 18</strong></span>
                  <span className="text-purple-400 font-bold text-[10px]">Step 5 of 27 · Line 6</span>
                </div>
                <div className="flex items-center gap-2 py-2 overflow-x-auto">
                  {[2, 4, 7, 11, 15, 20].map((val, idx) => (
                    <div
                      key={idx}
                      className={`h-10 w-10 rounded-lg flex flex-col items-center justify-center font-bold text-xs border ${
                        idx === 0
                          ? "bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm shadow-sky-500/20"
                          : idx === 4
                          ? "bg-rose-500/20 border-rose-400 text-rose-300 shadow-sm shadow-rose-500/20"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <span>{val}</span>
                      <span className="text-[8px] font-normal text-zinc-500">
                        {idx === 0 ? "left" : idx === 4 ? "right" : idx}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2">
                  <span className="text-purple-400 font-bold">Execution Insight:</span> nums[0] (2) + nums[4] (15) = 17 &lt; target 18. Moving left pointer forward.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">7 Interactive Presets</h4>
                  <p className="text-[11px] text-zinc-400 mt-1">Two Pointers, Binary Search, Linked List Reversal, Stacks, Queues, Binary Trees & 2D DP Grids.</p>
                </div>
                <Link
                  href="/visualizer"
                  className="py-2 px-3 bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 font-bold text-xs rounded-lg text-center transition-all"
                >
                  Open Visual Execution Canvas 🎬
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 📊 MAIN DASHBOARD FEED & COMMUNITY STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 flex items-center justify-between">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-amber-500/20 text-amber-400">
                UPCOMING ARENA
              </span>
              <h2 className="text-lg font-bold">Synapse Global Algorithm Challenge: Weekly Contest 104</h2>
              <p className="text-xs text-zinc-400 max-w-lg">
                Compete live against global engineers, scale optimization rankings, and earn computational score credits.
              </p>
            </div>
            <Link
              href="/contests"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all font-mono"
            >
              Enter Contest <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase font-bold text-zinc-500 tracking-wider">
              Community Dashboard Stream
            </h3>
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400">
                Interview Prep
              </span>
              <h4 className="text-sm font-bold text-zinc-200">
                System Design Frameworks: Navigating Distributed Real-Time Clusters
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                An evaluation of partition metrics, sharding strategies, and memory boundaries inside sandboxed networks.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">
                Platform Update
              </span>
              <h4 className="text-sm font-bold text-zinc-200">
                Introducing Synapse Runtime v2.5 Core Compiler Upgrades
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We have updated our multi-tenant sandboxed execution engine pools to support advanced compilation diagnostics and optimization feedback parameters.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold">Algorithmic Interview Masterclass</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Master data structures, graph architectures, and time complexity profiling utilizing real-time engine sandboxes.
            </p>
            <Link
              href="/problems"
              className="block w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-center font-bold text-xs rounded-xl transition-all font-mono"
            >
              Start Learning
            </Link>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold">Global Leaderboard</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              View top ranking programmers and compare accepted submission statistics across algorithmic categories.
            </p>
            <Link
              href="/leaderboard"
              className="block w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-center font-bold text-xs rounded-xl transition-all font-mono"
            >
              View Rankings
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}