"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { User, Activity, CheckCircle, Zap, ShieldAlert, LogOut, Loader2 } from "lucide-react";

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

  useEffect(() => {
    const fetchUserStats = async () => {
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
    fetchUserStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Hydrating Profile Metadata...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      
      {/* ACCOUNT HEADER PANEL FRAMEWORK */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 border border-indigo-400/20 shadow-lg shadow-indigo-500/10 text-white">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{user?.username || "Developer Account"}</h2>
            <p className="text-xs font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">Access Tier: {user?.role || "USER"}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 transition-all active:scale-[0.98] self-start sm:self-center"
        >
          <LogOut className="h-4 w-4" />
          Terminate Session Loop
        </button>
      </div>

      {/* ANALYTICS SCORECARD CONTAINER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Code Submissions Executed */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-md flex items-center gap-4 shadow-md">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Total Attempts</span>
            <h3 className="text-2xl font-mono font-black text-zinc-200 mt-0.5">{stats?.totalSubmissions || 0}</h3>
          </div>
        </div>

        {/* Global Acceptance Accuracy Rate */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-md flex items-center gap-4 shadow-md">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Accuracy Level</span>
            <h3 className="text-2xl font-mono font-black text-emerald-400 mt-0.5">{stats?.acceptanceRate || "0.00"}%</h3>
          </div>
        </div>

        {/* Unique Algorithmic Challenges Solved */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6 backdrop-blur-md flex items-center gap-4 shadow-md">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Problems Solved</span>
            <h3 className="text-2xl font-mono font-black text-zinc-200 mt-0.5">{stats?.solvedBreakdown.totalSolved || 0}</h3>
          </div>
        </div>

      </div>

      {/* CORE ALGORITHMIC METRICS DIFFICULTY MATRIX BLOCK */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-6 backdrop-blur-xl shadow-xl max-w-2xl">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6 font-mono">Algorithmic Resolution Breakdown</h4>
        
        <div className="space-y-4">
          {/* Easy Progress Segment */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-emerald-400 uppercase tracking-wide">Easy Challenges</span>
              <span className="font-mono text-zinc-400">{stats?.solvedBreakdown.easy || 0} Solved</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min(((stats?.solvedBreakdown.easy || 0) / 10) * 100, 100)}%` }} 
              />
            </div>
          </div>

          {/* Medium Progress Segment */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-amber-400 uppercase tracking-wide">Medium Challenges</span>
              <span className="font-mono text-zinc-400">{stats?.solvedBreakdown.medium || 0} Solved</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
              <div 
                className="h-full bg-amber-500 transition-all duration-500" 
                style={{ width: `${Math.min(((stats?.solvedBreakdown.medium || 0) / 10) * 100, 100)}%` }} 
              />
            </div>
          </div>

          {/* Hard Progress Segment */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-rose-400 uppercase tracking-wide">Hard Challenges</span>
              <span className="font-mono text-zinc-400">{stats?.solvedBreakdown.hard || 0} Solved</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/60">
              <div 
                className="h-full bg-rose-500 transition-all duration-500" 
                style={{ width: `${Math.min(((stats?.solvedBreakdown.hard || 0) / 10) * 100, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}