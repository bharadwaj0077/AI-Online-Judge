"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Trophy, Calendar, Clock, ArrowRight, Loader2 } from "lucide-react";

interface ContestEntry {
  publicId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

export default function ContestsDirectoryPage() {
  const [contests, setContests] = useState<ContestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await api.get("/contests");
        if (response.data?.success) {
          setContests(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to read contest metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Syncing Arena Timelines...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-zinc-800/60 pb-6 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
          <Trophy className="h-7 w-7 text-amber-500" /> Competition Hubs
        </h1>
        <p className="text-sm text-zinc-400 mt-1.5">Register signature files and compete across timed sandboxed tracks</p>
      </div>

      {contests.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/10 p-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No Contests Scheduled</h3>
          <p className="text-xs text-zinc-500 mt-1">Check back soon or contact platform admins to initialize an arena line.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contests.map((contest) => {
            const now = new Date();
            const start = new Date(contest.startTime);
            const end = new Date(contest.endTime);
            const isActive = now >= start && now <= end;
            const isUpcoming = now < start;

            return (
              <div 
                key={contest.publicId} 
                className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col justify-between backdrop-blur-xl shadow-lg hover:border-zinc-700/60 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      isActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse" :
                      isUpcoming ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    }`}>
                      {isActive ? "LIVE NOW" : isUpcoming ? "UPCOMING" : "COMPLETED"}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium font-mono">
                      <Clock className="h-3.5 w-3.5" /> 
                      {start.toLocaleDateString()}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                    {contest.title}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                    {contest.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-zinc-500">
                    Duration: {Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))} Hours
                  </div>
                  
                  <Link
                    href={`/contests/${contest.publicId}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-800/80 hover:bg-indigo-600 text-xs font-bold text-zinc-200 hover:white border border-zinc-700/50 hover:border-indigo-500 px-3.5 py-2 transition-all active:scale-[0.98]"
                  >
                    Enter Room <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}