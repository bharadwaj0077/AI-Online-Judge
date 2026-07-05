"use client";

import React, { useEffect, useState, use } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api";
import { Timer, Radio, Award, Loader2, Star, CheckCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ publicId: string }>;
}

interface ScoreboardRow {
  username: string;
  points: number;
  solvedProblemsCount: number;
  lastSolvedAt: string;
}

export default function ContestArenaRoomPage({ params }: PageProps) {
  const { publicId } = use(params);

  const [contestDetails, setContestDetails] = useState<any>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("00:00:00");

  useEffect(() => {
    let socketInstance: Socket;

    const initializeArena = async () => {
      try {
        // 1. Load details from standard REST API parameters
        const response = await api.get(`/contests`);
        const target = response.data.data?.find((c: any) => c.publicId === publicId);
        setContestDetails(target);

        // 2. Attach WebSocket listener loop using the same backend port gateway URL
        socketInstance = io("http://localhost:5000", { withCredentials: true });

        // Enter the contest room lane
        socketInstance.emit("join_contest", publicId);

        // Listen for live scoreboard changes sent by the backend
        socketInstance.on("scoreboard_update", (updatedRankings: ScoreboardRow[]) => {
          setScoreboard(updatedRankings);
        });

      } catch (error) {
        console.error("WebSocket room connection failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeArena();

    // Cleanup: Leave room and detach socket pipeline when navigating away
    return () => {
      if (socketInstance) {
        socketInstance.emit("leave_contest", publicId);
        socketInstance.disconnect();
      }
    };
  }, [publicId]);

  // Clock Countdown Ticker Hook Loop
  useEffect(() => {
    if (!contestDetails) return;

    const tickerInterval = setInterval(() => {
      const now = new Date().getTime();
      const targetTime = new Date(contestDetails.endTime).getTime();
      const distance = targetTime - now;

      if (distance < 0) {
        setTimeRemaining("CONTEST COMPLETED");
        clearInterval(tickerInterval);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const format = (num: number) => num.toString().padStart(2, "0");
      setTimeRemaining(`${format(hours)}:${format(minutes)}:${format(seconds)}`);
    }, 1000);

    return () => clearInterval(tickerInterval);
  }, [contestDetails]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Entering Live Arena Stream...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)] bg-zinc-950 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/60">
      
      {/* LEFT AREA: Contest metadata and quick problem parameters (4 Columns) */}
      <div className="lg:col-span-4 p-6 space-y-6 overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Broadcast Active
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">{contestDetails?.title}</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{contestDetails?.description}</p>
        </div>

        {/* Real-time Ticking Countdown Window Widget */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex items-center gap-4 shadow-inner">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">Time Remaining Until Lock</span>
            <span className="text-lg font-mono font-black text-zinc-200 tracking-wide mt-0.5 block">
              {timeRemaining}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT AREA: The Real-Time Scoreboard Matrix Table (8 Columns) */}
      <div className="lg:col-span-8 p-6 space-y-4 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Award className="h-4 w-4" /> Real-Time Live Standings
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/10 flex-grow shadow-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="border-b border-zinc-800/80 bg-zinc-900/40 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">Rank</th>
                <th className="px-5 py-3.5">Contestant Identity</th>
                <th className="px-5 py-3.5 text-center">Milestones</th>
                <th className="px-5 py-3.5 text-right">Score Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30 font-medium font-mono text-zinc-300">
              {scoreboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-zinc-600 italic">
                    Scoreboard metrics will populate live upon solution code ingestion routines.
                  </td>
                </tr>
              ) : (
                scoreboard.map((row, index) => (
                  <tr key={row.username} className="transition-colors hover:bg-zinc-900/20">
                    <td className="px-5 py-3 text-center font-bold text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-5 py-3 font-bold text-zinc-200 flex items-center gap-2">
                      {index === 0 && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />}
                      {row.username}
                    </td>
                    <td className="px-5 py-3 text-center text-zinc-400 flex items-center justify-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-indigo-500/80" /> {row.solvedProblemsCount}
                    </td>
                    <td className="px-5 py-3 text-right text-amber-400 font-bold">
                      {row.points} <span className="text-[10px] font-normal text-zinc-600">PTS</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}