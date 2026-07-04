"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Calendar, Flame, MessageSquare, BookOpen, Terminal, ArrowRight, Compass } from "lucide-react";

export default function HomeDashboard() {
  const announcements = [
    {
      id: "1",
      tag: "Interview Prep",
      title: "System Design Frameworks: Navigating Distributed Real-Time Clusters",
      description: "An evaluation of partition metrics, sharding strategies, and memory boundaries inside sandboxed networks. Access is open for all compiled profiles.",
      time: "2 hours ago"
    },
    {
      id: "2",
      tag: "Platform Update",
      title: "Introducing Synapse Runtime v2.5 Core Compiler Upgrades",
      description: "We have updated our multi-tenant sandboxed execution engine pools to support advanced compilation diagnostics and optimization feedback parameters.",
      time: "3 days ago"
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Three-Column Grid Master Framework */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Core Content Stream (Spans 2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* LeetCode-Style Premium Timed Contest Announcement Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-600/10 p-6 backdrop-blur-md shadow-lg shadow-orange-950/10">
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 h-24 w-24 rounded-full bg-amber-500/5 blur-2xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">Upcoming Arena</span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium"><Calendar className="h-3 w-3" /> In 9 Hours</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-100 mt-1">Synapse Global Algorithm Challenge: Weekly Contest 104</h3>
                  <p className="text-sm text-zinc-400 mt-1 max-w-xl">Compete live against global engineers, scale optimization rankings, and earn computational score credits.</p>
                </div>
              </div>
              <Link href="/leaderboard" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-zinc-950 shadow-md shadow-amber-500/10 transition-all hover:bg-amber-400 active:scale-[0.98]">
                Enter Arena <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Platform Activity Feed Stream */}
          <div className="space-y-4">
            <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase font-bold">Community Dashboard Stream</h2>
            {announcements.map((feed) => (
              <div key={feed.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-6 backdrop-blur-xl transition-all hover:border-zinc-700/60 shadow-md">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-lg bg-zinc-800/60 px-2.5 py-1 text-[11px] font-semibold text-indigo-400 border border-zinc-700/40">
                    {feed.tag}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">{feed.time}</span>
                </div>
                <h4 className="text-base font-bold text-zinc-100 mt-3 hover:text-indigo-400 transition-colors cursor-pointer">
                  {feed.title}
                </h4>
                <p className="text-sm text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                  {feed.description}
                </p>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Educational Widgets & Utilities (Spans 1 Column) */}
        <div className="space-y-6">
          
          {/* Visual Interactive Prep Course Dashboard Card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-indigo-900/20 to-zinc-900/40 p-6 backdrop-blur-xl shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Algorithmic Interview Masterclass</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Master data structures, graph architectures, and time complexity profiling utilizing real-time engine sandboxes.</p>
            <Link href="/problems" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700 border border-zinc-700/50">
              Start Learning
            </Link>
          </div>

          {/* Quick Hub Navigation Panels */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-4 space-y-2">
            <Link href="/problems" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-900/60 hover:text-zinc-200 group">
              <span className="flex items-center gap-3"><Terminal className="h-4 w-4 text-indigo-400" /> Coding Workstation</span>
              <Compass className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-zinc-500" />
            </Link>
            <Link href="/leaderboard" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-zinc-900/60 hover:text-zinc-200 group">
              <span className="flex items-center gap-3"><Flame className="h-4 w-4 text-orange-400" /> Global Leaderboard</span>
              <Compass className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100 text-zinc-500" />
            </Link>
            <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 cursor-not-allowed group">
              <span className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-emerald-500" /> Discussion Boards</span>
              <span className="text-[10px] font-mono font-bold tracking-wide uppercase bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">Soon</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}