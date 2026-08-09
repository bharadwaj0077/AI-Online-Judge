"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, BookOpen, Trophy } from "lucide-react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

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
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-100 font-sans p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 flex items-center justify-between">
            <div className="space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-amber-500/20 text-amber-400">UPCOMING ARENA</span>
              <h2 className="text-lg font-bold">Synapse Global Algorithm Challenge: Weekly Contest 104</h2>
              <p className="text-xs text-zinc-400 max-w-lg">Compete live against global engineers, scale optimization rankings, and earn computational score credits.</p>
            </div>
            <Link href="/contests" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition-all">
              Enter Arena <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase font-bold text-zinc-500 tracking-wider">Community Dashboard Stream</h3>
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400">Interview Prep</span>
              <h4 className="text-sm font-bold text-zinc-200">System Design Frameworks: Navigating Distributed Real-Time Clusters</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">An evaluation of partition metrics, sharding strategies, and memory boundaries inside sandboxed networks.</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">Platform Update</span>
              <h4 className="text-sm font-bold text-zinc-200">Introducing Synapse Runtime v2.5 Core Compiler Upgrades</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">We have updated our multi-tenant sandboxed execution engine pools to support advanced compilation diagnostics and optimization feedback parameters.</p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-bold">Algorithmic Interview Masterclass</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">Master data structures, graph architectures, and time complexity profiling utilizing real-time engine sandboxes.</p>
            <Link href="/problems" className="block w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-center font-bold text-xs rounded-xl transition-all">Start Learning</Link>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold">Global Leaderboard</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">View top ranking programmers and compare accepted submission statistics across algorithmic categories.</p>
            <Link href="/leaderboard" className="block w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-center font-bold text-xs rounded-xl transition-all">View Rankings</Link>
          </div>
        </div>
      </div>

    </div>
  );
}