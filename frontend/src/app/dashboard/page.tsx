"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { LayoutDashboard, CheckCircle2, Trophy, Zap, Code2, Loader2, Award, Swords, Bot, Eye, ArrowRight } from "lucide-react";

interface UserStats {
  problemsSolved: number;
  totalProblems: number;
  accuracyRate: string;
  globalRating: number;
  globalRank: string;
  recentActivity: { id: string; problem: string; status: string; submittedAt: string; lang: string }[];
}

export default function UserDashboardPage() {
  const [stats, setStats] = useState<UserStats>({
    problemsSolved: 0,
    totalProblems: 0,
    accuracyRate: "0.0%",
    globalRating: 0,
    globalRank: "-",
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const storedUserStr = localStorage.getItem("user");
        let queryStr = "";
        if (storedUserStr) {
          try {
            const parsed = JSON.parse(storedUserStr);
            if (parsed?.id) queryStr = `?userId=${parsed.id}`;
          } catch {}
        }

        const res = await api.get(`/dashboard${queryStr}`);
        if (res?.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error("Dashboard calculation error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] flex items-center justify-center text-xs text-zinc-400 font-mono gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> Computing real-time developer metrics...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-100 p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-indigo-400" /> Personal Developer Dashboard
        </h1>
        <p className="text-xs text-zinc-400 font-mono mt-1">Real-time accuracy and score metrics calculated directly from database submissions</p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Problems Solved
          </span>
          <div className="text-2xl font-bold text-white">{stats.problemsSolved} <span className="text-xs text-zinc-500 font-normal">/ {stats.totalProblems}</span></div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-400" /> Global Rating
          </span>
          <div className="text-2xl font-bold text-amber-400">{stats.globalRating} <span className="text-xs text-zinc-500 font-normal">pts</span></div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-indigo-400" /> Accuracy Rate
          </span>
          <div className="text-2xl font-bold text-indigo-400">{stats.accuracyRate}</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <span className="text-zinc-500 text-[10px] uppercase font-bold flex items-center gap-1.5">
            <Award className="h-4 w-4 text-purple-400" /> Global Rank
          </span>
          <div className="text-2xl font-bold text-purple-400">{stats.globalRank}</div>
        </div>
      </div>

      {/* FLAGSHIP PLATFORMS QUICK ACCESS */}
      <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            ⚡ Synapse Advanced Interactive Labs
          </span>
          <span className="text-[10px] text-zinc-500">Real-Time WebSocket & AI Engines</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/arena"
            className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/30 hover:border-rose-500/60 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Swords className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-rose-300">1v1 Code Wars</div>
                <div className="text-[10px] text-zinc-500">Live PvP & AI Duel</div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
          </Link>

          <Link
            href="/interview"
            className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/10 hover:bg-cyan-950/30 hover:border-cyan-500/60 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Bot className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300">AI Mock Interview</div>
                <div className="text-[10px] text-zinc-500">4 Voice Personas & OS</div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
          </Link>

          <Link
            href="/visualizer"
            className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/10 hover:bg-purple-950/30 hover:border-purple-500/60 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <Eye className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">Visual Profiler</div>
                <div className="text-[10px] text-zinc-500">Animated Step Tracer</div>
              </div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
          </Link>
        </div>
      </div>

      {/* RECENT SUBMISSIONS TABLE */}
      <div className="space-y-3 font-mono">
        <h2 className="text-xs uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-2">
          <Code2 className="h-4 w-4 text-zinc-500" /> Personal Submission Logs ({stats.recentActivity.length})
        </h2>

        {stats.recentActivity.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 border border-zinc-800 rounded-2xl text-zinc-500 text-xs italic">
            No submissions recorded in the database for your account yet. Navigate to <strong>Problems</strong> and submit a solution to populate your logs.
          </div>
        ) : (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-zinc-950 text-zinc-500 text-[10px] uppercase border-b border-zinc-800">
                <tr>
                  <th className="p-3.5">Problem</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Language</th>
                  <th className="p-3.5 text-right">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {stats.recentActivity.map((act) => (
                  <tr key={act.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">{act.problem}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${act.status === "ACCEPTED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-400">{act.lang}</td>
                    <td className="p-3.5 text-right text-zinc-500">{act.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}