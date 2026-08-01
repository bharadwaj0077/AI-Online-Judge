"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Problem } from "@/types";
import {
  Terminal, ChevronRight, Loader2, RefreshCw, Search, Tag, Layers,
  Flame, Circle, Sparkles, Zap,
} from "lucide-react";
import { clsx } from "clsx";

type DifficultyFilter = "ALL" | "EASY" | "MEDIUM" | "HARD";

/* Animated count-up for stat numbers */
function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    // Backstop: rAF is throttled in background tabs — always settle on the exact value
    const settle = setTimeout(() => setValue(target), durationMs + 150);
    return () => { cancelAnimationFrame(raf.current); clearTimeout(settle); };
  }, [target, durationMs]);
  return value;
}

/* Difficulty distribution donut ring */
function DifficultyRing({ easy, medium, hard }: { easy: number; medium: number; hard: number }) {
  const total = Math.max(easy + medium + hard, 1);
  const R = 52;
  const C = 2 * Math.PI * R;
  const seg = (n: number) => (n / total) * C;
  const shown = useCountUp(easy + medium + hard);
  let offset = 0;
  const segments = [
    { n: easy, color: "#34d399" },
    { n: medium, color: "#fbbf24" },
    { n: hard, color: "#fb7185" },
  ].map((s) => {
    const el = { ...s, dash: seg(s.n), offset };
    offset += seg(s.n);
    return el;
  });

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#27272a" strokeWidth="10" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="64" cy="64" r={R} fill="none"
            stroke={s.color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${Math.max(s.dash - 2, 0)} ${C}`}
            strokeDashoffset={-s.offset}
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-black text-zinc-100">{shown}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Problems</span>
      </div>
    </div>
  );
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const router = useRouter();

  const fetchProblems = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/problems");
      if (response.data?.success) {
        const sourceData = response.data.data || [];
        setProblems(Array.isArray(sourceData) ? sourceData : []);
      } else {
        setProblems(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err: any) {
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

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    problems.forEach((p) => (p.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [problems]);

  const stats = useMemo(() => ({
    easy: problems.filter((p) => p.difficulty === "EASY").length,
    medium: problems.filter((p) => p.difficulty === "MEDIUM").length,
    hard: problems.filter((p) => p.difficulty === "HARD").length,
  }), [problems]);

  /* Deterministic daily challenge — rotates with the calendar date */
  const dailyProblem = useMemo(() => {
    if (!problems.length) return null;
    const dayIndex = Math.floor(Date.now() / 86400000);
    return problems[dayIndex % problems.length];
  }, [problems]);

  const visibleProblems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems.filter((p) => {
      if (difficulty !== "ALL" && p.difficulty !== difficulty) return false;
      if (activeTopic && !(p.tags || []).includes(activeTopic)) return false;
      if (q && !p.title.toLowerCase().includes(q) && !(p.tags || []).some((t) => t.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [problems, query, difficulty, activeTopic]);

  const easyShown = useCountUp(stats.easy);
  const mediumShown = useCountUp(stats.medium);
  const hardShown = useCountUp(stats.hard);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Synchronizing Problem Matrix...</p>
      </div>
    );
  }

  const difficultyBars = [
    { label: "Easy", count: easyShown, raw: stats.easy, bar: "bg-emerald-400", text: "text-emerald-400" },
    { label: "Medium", count: mediumShown, raw: stats.medium, bar: "bg-amber-400", text: "text-amber-400" },
    { label: "Hard", count: hardShown, raw: stats.hard, bar: "bg-rose-400", text: "text-rose-400" },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-950 overflow-hidden">
      {/* keyframes for entrance + gradient motion */}
      <style>{`
        @keyframes ojFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ojGradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .oj-fade-up { animation: ojFadeUp .55s cubic-bezier(.21,.61,.35,1) both; }
        .oj-animated-grad {
          background-size: 220% 220%;
          animation: ojGradientMove 7s ease infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .oj-fade-up, .oj-animated-grad { animation: none; }
        }
      `}</style>

      {/* Ambient background: glow orbs + dot grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[130px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[420px] rounded-full bg-amber-500/[0.06] blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{ backgroundImage: "radial-gradient(circle, #3f3f46 1px, transparent 1px)", backgroundSize: "34px 34px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-950" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ===== Header ===== */}
        <div className="oj-fade-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-8">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-400/90">Synapse Challenge Registry</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-zinc-100">
              Problem{" "}
              <span className="oj-animated-grad bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                Workstation
              </span>
            </h1>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl">
              Curated challenges with sandboxed execution in Python, C++, C and Java — pick a track and start compiling.
            </p>
          </div>
          <button
            onClick={fetchProblems}
            className="flex items-center justify-center gap-2 self-start rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-semibold text-zinc-300 backdrop-blur transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 active:scale-[0.98]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Registry
          </button>
        </div>

        {/* ===== Daily challenge banner ===== */}
        {dailyProblem && (
          <Link
            href={`/problems/${dailyProblem.slug}`}
            className="oj-fade-up group relative mb-8 block overflow-hidden rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-500/[0.08] via-zinc-900/60 to-zinc-900/40 p-[1px] transition-all hover:border-orange-500/50 hover:shadow-[0_0_35px_rgba(249,115,22,0.12)]"
            style={{ animationDelay: "80ms" }}
          >
            <div className="flex flex-col gap-3 rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400 transition-transform group-hover:scale-110">
                  <Flame className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-orange-400/90">Daily Challenge</p>
                  <p className="mt-0.5 text-sm font-bold text-zinc-100">
                    {dailyProblem.title}
                    <span className={clsx(
                      "ml-3 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase",
                      dailyProblem.difficulty === "EASY" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
                      dailyProblem.difficulty === "MEDIUM" && "border-amber-500/25 bg-amber-500/10 text-amber-400",
                      dailyProblem.difficulty === "HARD" && "border-rose-500/25 bg-rose-500/10 text-rose-400",
                    )}>
                      {dailyProblem.difficulty.toLowerCase()}
                    </span>
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-orange-500/90 px-4 py-2 text-xs font-bold text-orange-950 transition-all group-hover:bg-orange-400 sm:self-auto">
                <Zap className="h-3.5 w-3.5" /> Solve Today's Pick
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        )}

        {/* ===== Overview: donut + distribution bars ===== */}
        <div
          className="oj-fade-up mb-8 flex flex-col items-center gap-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 px-6 py-6 backdrop-blur sm:flex-row"
          style={{ animationDelay: "140ms" }}
        >
          <DifficultyRing easy={stats.easy} medium={stats.medium} hard={stats.hard} />
          <div className="w-full flex-1 space-y-4">
            {difficultyBars.map((d) => (
              <div key={d.label}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className={clsx("text-xs font-bold uppercase tracking-widest", d.text)}>{d.label}</span>
                  <span className="font-mono text-sm font-bold text-zinc-200">
                    {d.count}
                    <span className="ml-1 text-[10px] font-semibold text-zinc-500">
                      / {problems.length}
                    </span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={clsx("h-full rounded-full transition-all duration-1000", d.bar)}
                    style={{ width: `${problems.length ? (d.raw / problems.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden shrink-0 flex-col items-center gap-1 border-l border-zinc-800 pl-8 lg:flex">
            <span className="font-mono text-3xl font-black text-zinc-100">4</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Languages</span>
            <div className="mt-2 flex gap-1.5">
              {["PY", "C++", "C", "JV"].map((l) => (
                <span key={l} className="rounded-md border border-zinc-700/60 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-zinc-400">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Search + difficulty rail ===== */}
        <div className="oj-fade-up flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5" style={{ animationDelay: "200ms" }}>
          <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-2.5 backdrop-blur transition-all focus-within:border-indigo-500/70 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems or topics..."
              className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-[11px] font-bold text-zinc-500 hover:text-zinc-300">✕</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(["ALL", "EASY", "MEDIUM", "HARD"] as DifficultyFilter[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={clsx(
                  "rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-all active:scale-95",
                  difficulty === d
                    ? d === "EASY"
                      ? "border-emerald-400 bg-emerald-400 text-emerald-950 shadow-[0_0_18px_rgba(52,211,153,0.35)]"
                      : d === "MEDIUM"
                        ? "border-amber-400 bg-amber-400 text-amber-950 shadow-[0_0_18px_rgba(251,191,36,0.35)]"
                        : d === "HARD"
                          ? "border-rose-400 bg-rose-400 text-rose-950 shadow-[0_0_18px_rgba(251,113,133,0.35)]"
                          : "border-zinc-100 bg-zinc-100 text-zinc-900 shadow-[0_0_18px_rgba(244,244,245,0.25)]"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 backdrop-blur hover:border-zinc-600 hover:text-zinc-200"
                )}
              >
                {d.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Topic rail ===== */}
        {topics.length > 0 && (
          <div className="oj-fade-up mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-4 backdrop-blur" style={{ animationDelay: "260ms" }}>
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Browse by Topic</span>
              {activeTopic && (
                <button
                  onClick={() => setActiveTopic(null)}
                  className="ml-auto rounded-md border border-zinc-700 px-2 py-0.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  Clear ✕
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTopic(null)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
                  activeTopic === null
                    ? "border-indigo-400 bg-indigo-500/20 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.3)]"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                )}
              >
                All Topics
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{problems.length}</span>
              </button>
              {topics.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => setActiveTopic(activeTopic === name ? null : name)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
                    activeTopic === name
                      ? "border-indigo-400 bg-indigo-500/20 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.3)]"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  )}
                >
                  <Tag className="h-3 w-3 opacity-60" />
                  {name}
                  <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== Content ===== */}
        {error ? (
          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 text-center">
            <p className="text-sm font-medium text-red-400">{error}</p>
          </div>
        ) : visibleProblems.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 border-dashed bg-zinc-900/10 p-12 text-center">
            <Terminal className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">No Matching Problems</h3>
            <p className="text-xs text-zinc-500 mt-1">Adjust the search text, difficulty, or topic filters to reveal more challenge tracks.</p>
          </div>
        ) : (
          <div className="oj-fade-up overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30 shadow-2xl shadow-black/40 backdrop-blur-xl" style={{ animationDelay: "320ms" }}>
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-6 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                Showing {visibleProblems.length} of {problems.length} problems
              </span>
              {activeTopic && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400">
                  <Tag className="h-3 w-3" /> {activeTopic}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-zinc-800/80 bg-zinc-900/60 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                  <tr>
                    <th scope="col" className="w-14 px-5 py-4 text-center">Status</th>
                    <th scope="col" className="w-14 px-3 py-4 text-center font-mono">ID</th>
                    <th scope="col" className="px-5 py-4">Title</th>
                    <th scope="col" className="w-28 px-5 py-4">Difficulty</th>
                    <th scope="col" className="w-24 px-5 py-4 text-center">Status Log</th>
                    <th scope="col" className="w-28 px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {visibleProblems.map((problem, idx) => {
                    const difficultyToken = problem.difficulty?.toUpperCase();
                    const isEasy = difficultyToken === "EASY";
                    const isMedium = difficultyToken === "MEDIUM";
                    const problemDbId = problem.id?.toString() || "";
                    const rowKey = problemDbId || problem.publicId || `problem-row-${problem.slug}`;

                    return (
                      <tr
                        key={rowKey}
                        className="group oj-fade-up relative transition-colors hover:bg-indigo-500/[0.04]"
                        style={{ animationDelay: `${360 + idx * 45}ms` }}
                      >
                        <td className="px-5 py-4 text-center">
                          <span title="Not attempted yet">
                            <Circle className="mx-auto h-4 w-4 text-zinc-700 transition-colors group-hover:text-zinc-500" />
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center font-mono text-xs font-bold text-zinc-600 group-hover:text-zinc-400">
                          {problemDbId.padStart(2, "0")}
                        </td>
                        <td className="px-5 py-4">
                          <Link href={`/problems/${problem.slug}`} className="block">
                            <span className="relative font-sans text-sm font-bold text-zinc-200 transition-colors group-hover:text-indigo-300">
                              {problem.title}
                              <span className="absolute -left-5 top-1/2 hidden h-5 w-[3px] -translate-y-1/2 rounded-full bg-indigo-400 group-hover:block" />
                            </span>
                          </Link>
                          {(problem.tags || []).length > 0 && (
                            <span className="mt-1.5 flex flex-wrap gap-1.5">
                              {(problem.tags || []).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setActiveTopic(t)}
                                  className="rounded-md border border-zinc-800 bg-zinc-900/70 px-2 py-0.5 text-[10.5px] font-medium text-zinc-500 transition-all hover:border-indigo-500/60 hover:text-indigo-300"
                                >
                                  {t}
                                </button>
                              ))}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={clsx(
                            "inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wide",
                            isEasy && "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
                            isMedium && "border-amber-500/20 bg-amber-500/5 text-amber-400",
                            !isEasy && !isMedium && "border-rose-500/20 bg-rose-500/5 text-rose-400"
                          )}>
                            {problem.difficulty?.toLowerCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-400/80">
                            New
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/problems/${problem.slug}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-1.5 text-xs font-bold text-zinc-300 transition-all group-hover:border-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                          >
                            Solve <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
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

        <p className="mt-6 text-center text-[11px] font-medium text-zinc-600">
          {problems.length} curated challenges · 4 runtime environments · sandboxed execution
        </p>
      </div>
    </div>
  );
}
