"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Problem } from "@/types";
import { Terminal, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { clsx } from "clsx";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const fetchProblems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/problems");
      if (response.data?.success) {
        // Clear list array data nodes directly out of incoming payload tracks
        const sourceData = response.data.data || [];
        setProblems(Array.isArray(sourceData) ? sourceData : []);
      } else {
        setProblems(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
      // 🚀 GRACEFUL REDIRECT GATEWAY:
      // If the backend returns 401 Unauthorized, seamlessly bounce the session to login channels
      if (err.response?.status === 401) {
        router.push("/login");
        return;
      }
      setError("Failed to fetch coding challenges from the platform registry matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Synchronizing Problem Matrix...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 bg-zinc-950 min-h-screen">
      
      {/* Upper Context Header Panel Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Problem Workstation</h1>
          <p className="text-sm text-zinc-400 mt-1.5">Select an active challenge parameter to verify sandbox compile execution tracks</p>
        </div>
        <button
          onClick={fetchProblems}
          className="flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-800 hover:text-zinc-200 active:scale-[0.98]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Registry
        </button>
      </div>

      {/* Conditionally Render Content Layout States */}
      {error ? (
        <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-center">
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/10 p-12 text-center">
          <Terminal className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No Problems Seeded</h3>
          <p className="text-xs text-zinc-500 mt-1">Initialize rows inside your database tables to populate the interactive challenge terminal grids.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-xl shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-zinc-800/80 bg-zinc-900/50 text-xs font-semibold tracking-wider text-zinc-400 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4 font-mono w-16 text-center">ID</th>
                  <th scope="col" className="px-6 py-4">Title</th>
                  <th scope="col" className="px-6 py-4 w-32">Difficulty</th>
                  <th scope="col" className="px-6 py-4 w-28 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 bg-transparent">
                {problems.map((problem) => {
                  const difficultyToken = problem.difficulty?.toUpperCase();
                  const isEasy = difficultyToken === "EASY";
                  const isMedium = difficultyToken === "MEDIUM";
                  
                  // 🚀 FIXED KEY RESOLUTION LAYER:
                  // Explicitly maps database key identifiers to clean strings to prevent rendering breaks or crashes
                  const problemDbId = problem.id?.toString() || "";
                  const rowKey = problemDbId || problem.publicId || `problem-row-${problem.slug}`;
                  
                  return (
                    <tr key={rowKey} className="group transition-colors hover:bg-zinc-900/30">
                      <td className="px-6 py-4 text-center font-mono font-bold text-zinc-600 group-hover:text-zinc-500">
                        {problemDbId}
                      </td>
                      <td className="px-6 py-4 font-sans text-sm font-semibold text-zinc-200 hover:text-indigo-400 transition-colors">
                        <Link href={`/problems/${problem.slug}`} className="block">
                          {problem.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border font-mono",
                          isEasy && "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
                          isMedium && "bg-amber-500/5 border-amber-500/20 text-amber-400",
                          !isEasy && !isMedium && "bg-rose-500/5 border-rose-500/20 text-rose-400"
                        )}>
                          {problem.difficulty?.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/problems/${problem.slug}`} 
                          className="inline-flex items-center gap-1 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500"
                        >
                          Solve <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}