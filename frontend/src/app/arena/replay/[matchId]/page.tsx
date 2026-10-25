"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Trophy,
  Swords,
  Zap,
  Users,
  Lightbulb,
  ShieldAlert,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  FileCode,
} from "lucide-react";
import { api } from "@/lib/api";

interface ReplayEvent {
  t: number; // millisecond timestamp from match start
  type: "match_start" | "code_update" | "paste_warning" | "hint_unlocked" | "run_tests" | "submit_attempt" | "match_end" | "coop_cursor";
  userId: string;
  data: any;
}

export default function ArenaReplayTheatrePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [matchData, setMatchData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Playback Control State
  const [currentMs, setCurrentMs] = useState<number>(0);
  const [totalMs, setTotalMs] = useState<number>(600000);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showScorecard, setShowScorecard] = useState<boolean>(true);

  // Rendered Code at Current Timeline Scrub
  const [p1Code, setP1Code] = useState<string>("");
  const [p2Code, setP2Code] = useState<string>("");

  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadReplayData();
  }, [matchId]);

  const loadReplayData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/arena/replay/${matchId}`);
      if (res.data?.success && res.data.data) {
        const m = res.data.data;
        setMatchData(m);

        // Calculate max match duration from replay events or durationSec
        const lastEvent = m.replayTimeline?.[m.replayTimeline.length - 1];
        const calculatedTotalMs = Math.max((m.durationSec || 600) * 1000, lastEvent?.t || 600000);
        setTotalMs(calculatedTotalMs);

        // Initial code
        setP1Code(m.problem?.starterCode || "");
        setP2Code(m.problem?.starterCode || "");
      }
    } catch {
      // Replay not found
    } finally {
      setLoading(false);
    }
  };

  // Reconstruct code for both players at timestamp `targetMs`
  const reconstructCodeAt = (targetMs: number) => {
    if (!matchData?.replayTimeline) return;

    let p1CurrentCode = matchData.problem?.starterCode || "";
    let p2CurrentCode = matchData.problem?.starterCode || "";

    const p1Id = matchData.player1?.userId;
    const p2Id = matchData.player2?.userId;

    for (const evt of matchData.replayTimeline) {
      if (evt.t > targetMs) break;
      if (evt.type === "code_update" && evt.data?.code !== undefined) {
        if (evt.userId === p1Id) p1CurrentCode = evt.data.code;
        else if (evt.userId === p2Id) p2CurrentCode = evt.data.code;
      }
    }

    setP1Code(p1CurrentCode);
    setP2Code(p2CurrentCode);
  };

  // Handle Scrubbing Slider
  const handleScrub = (newMs: number) => {
    setCurrentMs(newMs);
    reconstructCodeAt(newMs);
  };

  // Play / Pause loop
  useEffect(() => {
    if (isPlaying) {
      const stepMs = 250;
      playbackTimerRef.current = setInterval(() => {
        setCurrentMs((prev) => {
          const next = prev + stepMs * playbackSpeed;
          if (next >= totalMs) {
            setIsPlaying(false);
            reconstructCodeAt(totalMs);
            return totalMs;
          }
          reconstructCodeAt(next);
          return next;
        });
      }, stepMs);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalMs, matchData]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 font-mono gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <div className="text-sm">Loading Replay Theatre Telemetry...</div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 font-mono gap-4">
        <div className="text-base text-zinc-200">Replay session not found or expired.</div>
        <button
          onClick={() => router.push("/arena")}
          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono"
        >
          Return to Arena Lobby
        </button>
      </div>
    );
  }

  const p1 = matchData.player1;
  const p2 = matchData.player2;
  const decision = matchData.decision;
  const events: ReplayEvent[] = matchData.replayTimeline || [];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col selection:bg-rose-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP THEATRE HEADER                                                     */}
      {/* ========================================================================= */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20 font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/arena")}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 uppercase font-bold">
              REPLAY THEATRE
            </span>
            <span className="text-sm font-bold text-white font-sans">{matchData.problem?.title}</span>
          </div>
        </div>

        {/* Center: Winner Banner */}
        {decision && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">Victor:</span>
            <span className="font-bold text-amber-300 font-mono">{decision.winnerName}</span>
          </div>
        )}

        {/* Right: Toggle Scorecard */}
        <button
          onClick={() => setShowScorecard((prev) => !prev)}
          className="text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Scorecard</span>
          {showScorecard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* 2. COLLAPSIBLE GRANDMASTER REFEREE SCORECARD BANNER                       */}
      {/* ========================================================================= */}
      {showScorecard && decision && (
        <div className="bg-[#121217] border-b border-zinc-800 px-6 py-4 animate-fadeIn">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> WINNER: {decision.winnerName}
              </div>
              <p className="text-xs text-zinc-300 font-mono mt-1 leading-relaxed">
                {decision.reason}
              </p>
            </div>

            <div className="md:col-span-8 grid grid-cols-2 gap-3 font-mono text-xs">
              {/* P1 Score */}
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between items-center text-zinc-200 font-bold mb-1">
                  <span>{decision.scores.player1.username}</span>
                  <span className="text-amber-400 font-black">{decision.scores.player1.totalScore} pts</span>
                </div>
                <div className="text-[10px] text-zinc-400 space-y-0.5">
                  <div>Correctness: {decision.scores.player1.correctness}/40 | Efficiency: {decision.scores.player1.efficiency}/25</div>
                  <div>Cleanliness: {decision.scores.player1.cleanliness}/20 | Conduct: {decision.scores.player1.speedAndConduct}/15</div>
                </div>
              </div>

              {/* P2 Score */}
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex justify-between items-center text-zinc-200 font-bold mb-1">
                  <span>{decision.scores.player2.username}</span>
                  <span className="text-amber-400 font-black">{decision.scores.player2.totalScore} pts</span>
                </div>
                <div className="text-[10px] text-zinc-400 space-y-0.5">
                  <div>Correctness: {decision.scores.player2.correctness}/40 | Efficiency: {decision.scores.player2.efficiency}/25</div>
                  <div>Cleanliness: {decision.scores.player2.cleanliness}/20 | Conduct: {decision.scores.player2.speedAndConduct}/15</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SIDE-BY-SIDE REPLAY CODE EDITORS                                        */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800/80 overflow-hidden">
        {/* Left Side: Player 1 */}
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-[#0d0d11]">
          <div className="h-9 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              {p1?.username} (P1)
            </span>
            <span className="text-zinc-500 text-[11px]">{p1Code.split("\n").length} lines</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language="python"
              value={p1Code}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "Fira Code, Consolas, monospace",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 8 },
              }}
            />
          </div>
        </div>

        {/* Right Side: Player 2 */}
        <div className="flex flex-col h-[calc(100vh-12rem)] bg-[#0d0d11]">
          <div className="h-9 border-b border-zinc-800 bg-zinc-900/60 px-4 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-white flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              {p2?.username} (P2)
            </span>
            <span className="text-zinc-500 text-[11px]">{p2Code.split("\n").length} lines</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language="python"
              value={p2Code}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "Fira Code, Consolas, monospace",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 8 },
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE TIMELINE SCRUBBER & PLAYBACK CONTROLS                      */}
      {/* ========================================================================= */}
      <div className="h-24 border-t border-zinc-800/80 bg-zinc-950 px-6 py-3 flex flex-col justify-between shrink-0 font-mono z-20">
        {/* Timeline Slider with Event Pins */}
        <div className="relative w-full flex items-center">
          {/* Pins */}
          {events.map((evt, idx) => {
            const leftPct = (evt.t / totalMs) * 100;
            if (evt.type === "code_update") return null; // skip high frequency keystrokes
            return (
              <button
                key={idx}
                onClick={() => handleScrub(evt.t)}
                title={`${evt.type} at ${formatTime(evt.t)}`}
                style={{ left: `${leftPct}%` }}
                className="absolute -top-3 -translate-x-1/2 z-10 p-1 rounded-full bg-zinc-900 hover:scale-125 transition-transform"
              >
                {evt.type === "hint_unlocked" ? (
                  <Lightbulb className="w-3 h-3 text-amber-400" />
                ) : evt.type === "paste_warning" ? (
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                ) : evt.type === "submit_attempt" ? (
                  <Trophy className="w-3 h-3 text-indigo-400" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 block" />
                )}
              </button>
            );
          })}

          <input
            type="range"
            min={0}
            max={totalMs}
            step={100}
            value={currentMs}
            onChange={(e) => handleScrub(Number(e.target.value))}
            className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Playback Transport Buttons */}
        <div className="flex items-center justify-between pt-2">
          {/* Left: Time indicator */}
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-white font-bold">{formatTime(currentMs)}</span>
            <span className="text-zinc-600">/</span>
            <span>{formatTime(totalMs)}</span>
          </div>

          {/* Center: Play/Pause/Reset */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleScrub(0)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Reset to 00:00"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying((prev) => !prev)}
              className="p-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
          </div>

          {/* Right: Playback Speed Multipliers */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 text-[10px] uppercase">Speed:</span>
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  playbackSpeed === spd
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
