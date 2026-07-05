"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { User, Activity, CheckCircle, Zap, LogOut, Loader2, PlusCircle, LayoutDashboard, Settings } from "lucide-react";

interface ProfileStats {
  totalSubmissions: number;
  acceptanceRate: number;
  solvedBreakdown: {
    totalSolved: number;
    easy: number;
    medium: number;
    hard: number;
  };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Admin-only form states
  const [problemTitle, setProblemTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [problemDifficulty, setProblemDifficulty] = useState("EASY");
  const [adminMessage, setAdminMessage] = useState("");

  useEffect(() => {
    const fetchUserStats = async () => {
      // Admins don't need to load coding submission histories
      if (user?.role === "ADMIN") {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get("/users/profile/stats");
        if (response.data?.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to load account metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchUserStats();
  }, [user]);

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMessage("");
    try {
      const response = await api.post("/problems", {
        title: problemTitle,
        statement: problemStatement,
        difficulty: problemDifficulty,
      });
      if (response.data) {
        setAdminMessage("🚀 New algorithmic challenge successfully seeded into PostgreSQL database!");
        setProblemTitle("");
        setProblemStatement("");
      }
    } catch (error: any) {
      setAdminMessage("❌ Failed to push problem parameters to registry database rows.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Hydrating Profile Workspace...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      
      {/* SHARED ACCOUNT HEADER PANEL */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 border border-indigo-400/20 text-white shadow-lg shadow-indigo-500/10">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{user?.username || "Developer Profile"}</h2>
            <span className={`inline-block text-[10px] font-mono font-bold tracking-wider mt-1 px-2 py-0.5 rounded uppercase border ${
              user?.role === "ADMIN" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}>
              Authority Level: {user?.role || "USER"}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 transition-all active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          Terminate Session Loop
        </button>
      </div>

      {/* 🚀 ADMIN ROLE CONDITIONAL INTERFACE LAYOUT */}
      {user?.role === "ADMIN" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin Problem Seeding Station Form */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/10 p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase mb-2">
              <PlusCircle className="h-4 w-4" /> Challenge Creation Console
            </div>

            {adminMessage && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 text-xs text-zinc-300 font-medium">
                {adminMessage}
              </div>
            )}

            <form onSubmit={handleCreateProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={problemTitle}
                  onChange={(e) => setProblemTitle(e.target.value)}
                  placeholder="e.g., Invert Binary Tree Matrix"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-200 outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Difficulty Tier</label>
                <select
                  value={problemDifficulty}
                  onChange={(e) => setProblemDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-200 outline-none focus:border-rose-500/50 cursor-pointer"
                >
                  <option value="EASY">EASY (10 Points)</option>
                  <option value="MEDIUM">MEDIUM (30 Points)</option>
                  <option value="HARD">HARD (50 Points)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Problem Statement Description</label>
                <textarea
                  required
                  rows={5}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  placeholder="Provide comprehensive runtime target input parameters and structural rules..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-zinc-200 outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-600/10 transition-all active:scale-[0.98]"
              >
                Deploy Problem to Platform Registry
              </button>
            </form>
          </div>

          {/* Admin Sidebar Operations Widget */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-xs font-bold uppercase">
              <Settings className="h-4 w-4" /> System Control Variables
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              As an administrator, you possess dynamic global read/write operational access hooks across the platform repository schema tables.
            </p>
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950 p-4 text-center text-xs text-zinc-600 italic">
              System monitoring analytics gauges coming online soon.
            </div>
          </div>
        </div>
      ) : (
        /* 🟩 STANDARD USER ROLE CONDITIONS INTERFACE LAYOUT */
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 flex items-center gap-4 shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Attempts</span>
                <h3 className="text-2xl font-mono font-black text-zinc-200 mt-0.5">{stats?.totalSubmissions || 0}</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 flex items-center gap-4 shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Accuracy Level</span>
                <h3 className="text-2xl font-mono font-black text-emerald-400 mt-0.5">{stats?.acceptanceRate || "0.00"}%</h3>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 flex items-center gap-4 shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Problems Solved</span>
                <h3 className="text-2xl font-mono font-black text-zinc-200 mt-0.5">{stats?.solvedBreakdown?.totalSolved || 0}</h3>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-6 shadow-xl max-w-2xl">
            <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 font-mono">Algorithmic Resolution Breakdown</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-emerald-400 uppercase tracking-wide">Easy Challenges</span>
                  <span className="font-mono text-zinc-400">{stats?.solvedBreakdown?.easy || 0} Solved</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(((stats?.solvedBreakdown?.easy || 0) / 10) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-amber-400 uppercase tracking-wide">Medium Challenges</span>
                  <span className="font-mono text-zinc-400">{stats?.solvedBreakdown?.medium || 0} Solved</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(((stats?.solvedBreakdown?.medium || 0) / 10) * 100, 100)}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-rose-400 uppercase tracking-wide">Hard Challenges</span>
                  <span className="font-mono text-zinc-400">{stats?.solvedBreakdown?.hard || 0} Solved</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${Math.min(((stats?.solvedBreakdown?.hard || 0) / 10) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}