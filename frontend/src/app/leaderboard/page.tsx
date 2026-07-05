"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Medal, Target, Award, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface LeaderboardProfile {
  userId: string;
  username: string;
  totalPoints: number;
  uniqueSolvedCount: number;
  totalSubmissionsCount: number;
  acceptanceRate: number;
}

export default function LeaderboardPage() {
  const [profiles, setProfiles] = useState<LeaderboardProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get("/users/leaderboard");
        if (response.data?.success) {
          setProfiles(response.data.data?.profiles || []);
        }
      } catch (error) {
        console.error("Failed to compile leaderboard rankings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Evaluating Global Rankings...</p>
      </div>
    );
  }

  // Separate the elite top three profiles to display a visual podium framework
  const podiumWinners = profiles.slice(0, 3);
  const runningRankings = profiles.slice(3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-center max-w-xl mx-auto mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-2">
          <Trophy className="h-7 w-7 text-amber-400" /> Global Standings
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Rankings are dynamically calculated based on problem difficulty points, unique milestones, and submission accuracy profiles.
        </p>
      </div>

      {/* THE COMPETITIVE HIGH-END PODIUM EMBLEM ARRAY */}
      {podiumWinners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end mb-12 max-w-3xl mx-auto">
          
          {/* 2nd Place Silver Medal Pod */}
          {podiumWinners[1] && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-center backdrop-blur-md order-2 md:order-1 md:h-44 flex flex-col justify-center relative overflow-hidden">
              <Medal className="h-7 w-7 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-zinc-200 truncate">{podiumWinners[1].username}</h3>
              <p className="text-xl font-mono font-black text-zinc-300 mt-1">{podiumWinners[1].totalPoints} <span className="text-[10px] font-normal text-zinc-500">PTS</span></p>
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">{podiumWinners[1].acceptanceRate}% Acc</span>
              <div className="absolute top-2 left-3 font-mono text-xs font-black text-zinc-700">#2</div>
            </div>
          )}

          {/* 1st Place Gold Trophy Pod */}
          {podiumWinners[0] && (
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-zinc-900/40 p-8 text-center backdrop-blur-md order-1 md:order-2 md:h-52 flex flex-col justify-center relative overflow-hidden shadow-xl shadow-amber-950/5">
              <Trophy className="h-9 w-9 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h3 className="text-base font-black text-zinc-100 truncate">{podiumWinners[0].username}</h3>
              <p className="text-2xl font-mono font-black text-amber-400 mt-1">{podiumWinners[0].totalPoints} <span className="text-xs font-normal text-zinc-500">PTS</span></p>
              <span className="text-xs text-amber-400/70 font-mono mt-1 block">{podiumWinners[0].acceptanceRate}% Acc</span>
              <div className="absolute top-2 left-3 font-mono text-sm font-black text-amber-500/40">#1</div>
            </div>
          )}

          {/* 3rd Place Bronze Medal Pod */}
          {podiumWinners[2] && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 text-center backdrop-blur-md order-3 md:h-40 flex flex-col justify-center relative overflow-hidden">
              <Award className="h-7 w-7 text-orange-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-zinc-200 truncate">{podiumWinners[2].username}</h3>
              <p className="text-xl font-mono font-black text-orange-500 mt-1">{podiumWinners[2].totalPoints} <span className="text-[10px] font-normal text-zinc-500">PTS</span></p>
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">{podiumWinners[2].acceptanceRate}% Acc</span>
              <div className="absolute top-2 left-3 font-mono text-xs font-black text-zinc-700">#3</div>
            </div>
          )}
        </div>
      )}

      {/* CONTINUOUS RANKINGS LIST TRACK ROW DATA TABLE */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/10 backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-zinc-800/80 bg-zinc-900/50 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-20 text-center font-mono">Rank</th>
                <th className="px-6 py-4">User Handle</th>
                <th className="px-6 py-4 text-center">Score Points</th>
                <th className="px-6 py-4 text-center">Solved Challenges</th>
                <th className="px-6 py-4 text-right">Accuracy Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 font-medium">
              {profiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-zinc-600 italic">No historical submission records indexed yet.</td>
                </tr>
              ) : (
                profiles.map((profile, index) => (
                  <tr key={profile.userId} className="group transition-colors hover:bg-zinc-900/20">
                    <td className="px-6 py-4 text-center font-mono font-bold text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-zinc-200 font-bold">
                      {profile.username}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-indigo-400 font-bold">
                      {profile.totalPoints}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-zinc-400">
                      {profile.uniqueSolvedCount}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-emerald-400">
                      {profile.acceptanceRate}%
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