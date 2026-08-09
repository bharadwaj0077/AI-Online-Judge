"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Medal, Cpu, Loader2, CheckCircle2 } from "lucide-react";

interface LeaderboardUser {
  id: string;
  name: string;
  // email: string;
  solved: number;
  rating: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get("/leaderboard");
        if (res?.data?.success) {
          setUsers(res.data.data || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] flex items-center justify-center text-xs text-zinc-400 font-mono gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> Calculating real-time rankings...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-100 p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" /> Global Leaderboard
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">Live algorithmic performance standings calculated directly from database metrics</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-zinc-300">
          <Cpu className="h-4 w-4 text-indigo-400" /> Total Registered Users: <strong>{users.length}</strong>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 font-mono text-xs">
          No registered programmers found in the database.
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-6">Rank</th>
                <th className="py-3 px-6">Programmer</th>
                <th className="py-3 px-6 text-center">Problems Solved</th>
                <th className="py-3 px-6 text-right">Rating Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                  <td className="py-4 px-6 font-bold">
                    {user.rank === 1 && <span className="inline-flex items-center gap-1 text-amber-400"><Medal className="h-4 w-4" /> #1</span>}
                    {user.rank === 2 && <span className="inline-flex items-center gap-1 text-zinc-300"><Medal className="h-4 w-4" /> #2</span>}
                    {user.rank === 3 && <span className="inline-flex items-center gap-1 text-amber-600"><Medal className="h-4 w-4" /> #3</span>}
                    {user.rank > 3 && <span className="text-zinc-500">#{user.rank}</span>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-zinc-100 text-xs">{user.name}</div>
                    {/* <div className="text-[10px] text-zinc-500">{user.email}</div> */}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {user.solved}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-indigo-400 text-sm">
                    {user.rating} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}