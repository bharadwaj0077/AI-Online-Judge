"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Trophy,
  Zap,
  Code2,
  Loader2,
  Award,
  Swords,
  Bot,
  Eye,
  ArrowRight,
  TrendingUp,
  Calendar,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  Compass,
  Cpu,
  Globe,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Shield,
  Activity,
  BarChart3,
  Clock,
  Target
} from "lucide-react";

interface DashboardData {
  user: {
    username: string;
    fullName: string;
    email: string;
    country: string;
    bio: string;
    memberSince: string;
    globalRank: string;
    totalUsers: number;
  };
  contest: {
    rating: number;
    globalRanking: string;
    attended: number;
    topPercentile: string;
    history: Array<{ contest: string; date: string; rating: number; rank: string }>;
  };
  problems: {
    solved: number;
    total: number;
    attempting: number;
    accuracyRate: string;
    breakdown: {
      easy: { solved: number; total: number };
      medium: { solved: number; total: number };
      hard: { solved: number; total: number };
    };
  };
  heatmap: {
    totalSubmissions: number;
    totalActiveDays: number;
    maxStreak: number;
    currentStreak: number;
    calendar: Record<string, number>;
  };
  arena: {
    elo: number;
    tier: string;
    matchesPlayed: number;
    wins: number;
    losses: number;
    winRate: string;
    history: Array<{ matchId: string; date: string; mode: string; problem: string; outcome: string; elo: number }>;
  };
  mockInterview: {
    completedCount: number;
    averageScore: number;
    domainMastery: Array<{ domain: string; score: number; solved: number; total: number; level: string }>;
    history: Array<{
      id: string;
      date: string;
      company: string;
      role: string;
      topic: string;
      overallScore: number;
      technicalScore: number;
      communicationScore: number;
      verdict: string;
    }>;
  };
  recentActivity: Array<{
    id: string;
    problem: string;
    difficulty: string;
    status: string;
    lang: string;
    submittedAt: string;
  }>;
}

export default function UserDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"submissions" | "arena" | "interviews">("submissions");
  const [hoveredContestPoint, setHoveredContestPoint] = useState<number | null>(null);
  const [hoveredArenaPoint, setHoveredArenaPoint] = useState<number | null>(null);
  const [hoveredInterviewPoint, setHoveredInterviewPoint] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
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
        if (res?.data?.success && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Compute 52-week calendar matrix for heatmap (364 days ending today)
  const calendarWeeks = useMemo(() => {
    const weeks: Array<Array<{ dateStr: string; count: number; dayOfWeek: number; monthName: string }>> = [];
    const today = new Date();
    // Start 52 weeks ago on the closest Sunday
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    let currentWeek: Array<{ dateStr: string; count: number; dayOfWeek: number; monthName: string }> = [];
    const calendarMap = data?.heatmap?.calendar || {};

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const count = calendarMap[dateStr] || 0;
      const dayOfWeek = d.getDay();
      const monthName = d.toLocaleDateString("en-US", { month: "short" });

      currentWeek.push({ dateStr, count, dayOfWeek, monthName });

      if (dayOfWeek === 6 || d.getTime() >= today.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [data?.heatmap?.calendar]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] flex items-center justify-center text-xs text-zinc-400 font-mono gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> Computing real-time developer metrics & learning curves...
      </div>
    );
  }

  const d = data;
  if (!d) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-400 flex items-center justify-center p-8">
        Failed to load developer dashboard data.
      </div>
    );
  }

  // Calculation for problems solved donut progress
  const totalSolved = d.problems.solved;
  const totalAvailable = Math.max(d.problems.total, 1);
  const easyPct = Math.round((d.problems.breakdown.easy.solved / Math.max(d.problems.breakdown.easy.total, 1)) * 100);
  const medPct = Math.round((d.problems.breakdown.medium.solved / Math.max(d.problems.breakdown.medium.total, 1)) * 100);
  const hardPct = Math.round((d.problems.breakdown.hard.solved / Math.max(d.problems.breakdown.hard.total, 1)) * 100);

  // SVG dimensions for Donut
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const overallFraction = Math.min(1, totalSolved / totalAvailable);
  const overallStroke = circumference * (overallFraction > 0 ? overallFraction : 0.05);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-zinc-100 font-sans pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Developer Profile</span>
            <span>/</span>
            <span className="text-white font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {d.user.username}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              Global Rank <strong className="text-emerald-400 ml-1">{d.user.globalRank}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/50 text-[11px] text-indigo-300">
              Contest Rating <strong className="text-indigo-400 ml-1">{d.contest.rating}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* MAIN PROFILE GRID: 1/3 Left Column, 2/3 Right Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ============================================================== */}
          {/* LEFT SIDEBAR (4 cols on lg): User Card, Community, Skills */}
          {/* ============================================================== */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* User Profile Card */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-5 shadow-xl shadow-black/40">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-indigo-500/20 to-purple-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-950/40">
                    {d.user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#121215] flex items-center justify-center">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 flex items-center justify-center text-[9px] text-black font-bold">✓</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-white truncate flex items-center gap-2">
                    {d.user.fullName}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">@{d.user.username}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 font-medium">
                      Rank {d.user.globalRank}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Member since {d.user.memberSince}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-3">
                {d.user.bio}
              </p>

              <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/60 pt-3 font-mono">
                <div className="flex items-center gap-4">
                  <span><strong className="text-white">1</strong> Following</span>
                  <span><strong className="text-white">1</strong> Followers</span>
                </div>
                <span className="text-zinc-500">{d.user.country}</span>
              </div>

              <button className="w-full py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-medium text-zinc-200 transition-all flex items-center justify-center gap-2">
                Edit Profile
              </button>
            </div>

            {/* Community & Badges Card */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" /> Earned Badges (3)
                </h3>
                <span className="text-[10px] text-zinc-500">Season 2026</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-amber-500/30 flex flex-col items-center text-center group hover:border-amber-500/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg group-hover:scale-110 transition-transform">
                    🏅
                  </div>
                  <span className="text-[10px] font-bold text-white mt-2 leading-tight">100 Days</span>
                  <span className="text-[9px] text-amber-400">Badge 2026</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-cyan-500/30 flex flex-col items-center text-center group hover:border-cyan-500/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg group-hover:scale-110 transition-transform">
                    ⚔️
                  </div>
                  <span className="text-[10px] font-bold text-white mt-2 leading-tight">Arena Duel</span>
                  <span className="text-[9px] text-cyan-400">Gladiator</span>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-purple-500/30 flex flex-col items-center text-center group hover:border-purple-500/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400 text-lg group-hover:scale-110 transition-transform">
                    🎙️
                  </div>
                  <span className="text-[10px] font-bold text-white mt-2 leading-tight">Mock Master</span>
                  <span className="text-[9px] text-purple-400">FAANG Tier</span>
                </div>
              </div>

              {/* Community Stats */}
              <div className="border-t border-zinc-800/60 pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-zinc-500" /> Profile Views</span>
                  <strong className="text-white font-mono">1,420</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-2"><Code2 className="h-3.5 w-3.5 text-zinc-500" /> Solutions Published</span>
                  <strong className="text-white font-mono">{Math.max(1, Math.floor(d.problems.solved / 2))}</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-zinc-500" /> Discussions Authored</span>
                  <strong className="text-white font-mono">12</strong>
                </div>
              </div>
            </div>

            {/* CS Domain Mastery Card */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-400" /> CS Domain Mastery
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono">Verified Skills</span>
              </div>

              <div className="space-y-3">
                {d.mockInterview.domainMastery.map((dm) => (
                  <div key={dm.domain} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{dm.domain}</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] text-zinc-500">{dm.level}</span>
                        <strong className="text-emerald-400">{dm.score}%</strong>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${dm.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Flagship Lab Shortcuts */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3 font-mono">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Flagship Interactive Labs
              </span>
              <div className="space-y-2">
                <Link
                  href="/arena"
                  className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/10 hover:bg-rose-950/20 hover:border-rose-500/50 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Swords className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-rose-300">1v1 Code Wars</div>
                      <div className="text-[10px] text-zinc-500 font-sans">Live PvP & Blitz Duel</div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-rose-400 transition-colors" />
                </Link>

                <Link
                  href="/interview"
                  className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-950/10 hover:bg-cyan-950/20 hover:border-cyan-500/50 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300">AI Mock Interview</div>
                      <div className="text-[10px] text-zinc-500 font-sans">4 Personas & CS Question Bank</div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                </Link>

                <Link
                  href="/visualizer"
                  className="p-3 rounded-xl border border-purple-500/20 bg-purple-950/10 hover:bg-purple-950/20 hover:border-purple-500/50 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Eye className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-purple-300">Visual Profiler</div>
                      <div className="text-[10px] text-zinc-500 font-sans">Animated Memory Graph Tracer</div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                </Link>
              </div>
            </div>

          </div>

          {/* ============================================================== */}
          {/* RIGHT MAIN CONTENT (8 cols on lg): Ratings, Curves, Heatmap */}
          {/* ============================================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* TOP ROW: Contest Rating & Trend Curve Card + Percentile Histogram */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Contest Rating & Curve (8 cols) */}
              <div className="md:col-span-8 p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-4 shadow-xl shadow-black/40 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="h-4 w-4 text-amber-400" /> Contest Rating
                    </span>
                    <div className="text-3xl font-extrabold text-white mt-1 font-mono tracking-tight">
                      {d.contest.rating.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase">Global Ranking</span>
                      <div className="text-zinc-200 font-bold">{d.contest.globalRanking}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase">Attended</span>
                      <div className="text-zinc-200 font-bold">{d.contest.attended}</div>
                    </div>
                  </div>
                </div>

                {/* Interactive SVG Contest Rating Curve */}
                <div className="pt-2 relative">
                  <div className="h-36 w-full">
                    <svg viewBox="0 0 500 130" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="contestCurveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="0" y1="65" x2="500" y2="65" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                      <line x1="0" y1="110" x2="500" y2="110" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />

                      {/* Rating Area Fill & Line */}
                      <path
                        d="M 20 95 C 100 80, 160 55, 250 68 C 340 80, 410 40, 480 30 L 480 120 L 20 120 Z"
                        fill="url(#contestCurveGrad)"
                      />
                      <path
                        d="M 20 95 C 100 80, 160 55, 250 68 C 340 80, 410 40, 480 30"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Data Points */}
                      {d.contest.history.map((pt, idx) => {
                        const x = 20 + idx * 92;
                        const y = 95 - (pt.rating - 1400) * 0.45;
                        const isHovered = hoveredContestPoint === idx;
                        return (
                          <g key={pt.contest} className="cursor-pointer" onMouseEnter={() => setHoveredContestPoint(idx)} onMouseLeave={() => setHoveredContestPoint(null)}>
                            {isHovered && (
                              <line x1={x} y1="0" x2={x} y2="120" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                            )}
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered ? 6 : 4}
                              fill={isHovered ? "#ffffff" : "#f59e0b"}
                              stroke="#09090b"
                              strokeWidth="2"
                              className="transition-all"
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Tooltip Overlay */}
                  {hoveredContestPoint !== null && d.contest.history[hoveredContestPoint] && (
                    <div
                      className="absolute top-0 transform -translate-y-full bg-zinc-900 border border-amber-500/40 p-2.5 rounded-xl shadow-xl text-[11px] font-mono pointer-events-none z-10"
                      style={{ left: `${Math.min(80, Math.max(10, (hoveredContestPoint / (d.contest.history.length - 1)) * 90))}%` }}
                    >
                      <div className="font-bold text-white">{d.contest.history[hoveredContestPoint].contest}</div>
                      <div className="text-amber-400 font-bold">Rating: {d.contest.history[hoveredContestPoint].rating} pts</div>
                      <div className="text-zinc-400 text-[10px]">Rank: #{d.contest.history[hoveredContestPoint].rank} · {d.contest.history[hoveredContestPoint].date}</div>
                    </div>
                  )}

                  {/* Date Axis */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                    {d.contest.history.map((pt) => (
                      <span key={pt.contest}>{pt.date}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Percentile & Histogram (4 cols) */}
              <div className="md:col-span-4 p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-4 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-400" /> Standing Percentile
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono tracking-tight">
                    Top {d.contest.topPercentile}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Ahead of {((1 - parseFloat(d.contest.topPercentile) / 100) * 100).toFixed(1)}% of all platform participants
                  </p>
                </div>

                {/* Rating Distribution Histogram */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Rating Distribution</span>
                  <div className="flex items-end gap-1.5 h-20 w-full pt-1">
                    {[
                      { height: 18, highlight: false },
                      { height: 32, highlight: false },
                      { height: 54, highlight: false },
                      { height: 82, highlight: false },
                      { height: 96, highlight: true }, // User's bracket
                      { height: 70, highlight: false },
                      { height: 42, highlight: false },
                      { height: 24, highlight: false },
                      { height: 12, highlight: false },
                      { height: 6, highlight: false }
                    ].map((bar, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-all ${
                          bar.highlight
                            ? "bg-amber-400 ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/30"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                        style={{ height: `${bar.height}%` }}
                        title={`Bracket ${1000 + i * 150} - ${1150 + i * 150}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                    <span>1,000</span>
                    <span className="text-amber-400 font-bold">You (1,554)</span>
                    <span>2,500+</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SECOND ROW: Problems Solved Donut & Difficulty Meter */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 shadow-xl shadow-black/40 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Solved Problems Metric</h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-zinc-400">
                    Accuracy <strong className="text-white">{d.problems.accuracyRate}</strong>
                  </span>
                  <span className="text-zinc-500">
                    Total Submissions <strong className="text-zinc-300">{d.heatmap.totalSubmissions}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Circular Donut Gauge (4 cols) */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-3">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                      {/* Background Ring */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="#27272a"
                        strokeWidth="12"
                      />
                      {/* Solved Arc Progress */}
                      <circle
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="transparent"
                        stroke="url(#solvedGrad)"
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - overallStroke}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="solvedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Inner Gauge Center Metrics */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
                        {d.problems.solved}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        / {d.problems.total} Solved
                      </div>
                      <div className="mt-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                        {d.problems.attempting} Attempting
                      </div>
                    </div>
                  </div>
                </div>

                {/* Difficulty Progress Bars (8 cols) */}
                <div className="md:col-span-8 space-y-4">
                  {/* Easy */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Easy
                      </span>
                      <div className="text-zinc-300">
                        <strong className="text-white">{d.problems.breakdown.easy.solved}</strong> / {d.problems.breakdown.easy.total}
                        <span className="text-zinc-500 text-[10px] ml-2">({easyPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                        style={{ width: `${easyPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-amber-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Medium
                      </span>
                      <div className="text-zinc-300">
                        <strong className="text-white">{d.problems.breakdown.medium.solved}</strong> / {d.problems.breakdown.medium.total}
                        <span className="text-zinc-500 text-[10px] ml-2">({medPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-700"
                        style={{ width: `${medPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Hard */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-rose-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-rose-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" /> Hard
                      </span>
                      <div className="text-zinc-300">
                        <strong className="text-white">{d.problems.breakdown.hard.solved}</strong> / {d.problems.breakdown.hard.total}
                        <span className="text-zinc-500 text-[10px] ml-2">({hardPct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-700"
                        style={{ width: `${hardPct}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* THIRD ROW: 365-Day Activity Heatmap Matrix */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 shadow-xl shadow-black/40 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {d.heatmap.totalSubmissions} Submissions in the past one year
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                  <span>Total active days: <strong className="text-white">{d.heatmap.totalActiveDays}</strong></span>
                  <span>Max streak: <strong className="text-emerald-400">{d.heatmap.maxStreak}</strong></span>
                  <span>Current: <strong className="text-amber-400">{d.heatmap.currentStreak}</strong></span>
                </div>
              </div>

              {/* Heatmap 52-week calendar grid */}
              <div className="overflow-x-auto pb-2">
                <div className="min-w-[700px]">
                  {/* Month headers */}
                  <div className="flex text-[10px] text-zinc-500 font-mono mb-1.5 pl-6">
                    {["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m, idx) => (
                      <span key={m} style={{ width: `${100 / 12}%` }}>{m}</span>
                    ))}
                  </div>

                  {/* Grid cells */}
                  <div className="flex gap-[3px]">
                    {calendarWeeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-[3px]">
                        {week.map((day) => {
                          let bg = "bg-zinc-900";
                          if (day.count >= 6) bg = "bg-emerald-400";
                          else if (day.count >= 4) bg = "bg-emerald-500";
                          else if (day.count >= 2) bg = "bg-emerald-700";
                          else if (day.count >= 1) bg = "bg-emerald-900/80";

                          return (
                            <div
                              key={day.dateStr}
                              className={`w-[11px] h-[11px] rounded-[2px] ${bg} hover:ring-2 hover:ring-white transition-all cursor-pointer`}
                              onMouseEnter={() => setHoveredDay({ date: day.dateStr, count: day.count })}
                              onMouseLeave={() => setHoveredDay(null)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Legend & Hover Info */}
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-3">
                    <div>
                      {hoveredDay ? (
                        <span className="text-emerald-400 font-medium">
                          {hoveredDay.count} submissions on {hoveredDay.date}
                        </span>
                      ) : (
                        <span>Hover over cells to view daily submissions</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Less</span>
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-zinc-900" />
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/80" />
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-700" />
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
                      <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400" />
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* FOURTH ROW: FLAGSHIP LEARNING CURVES (1v1 & Mock Interviews)   */}
            {/* ============================================================== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Flagship Feature 1: 1v1 Arena ELO Learning Curve */}
              <div className="p-6 rounded-2xl bg-[#121215] border border-rose-500/30 shadow-xl shadow-rose-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      1v1 Code Wars ELO Curve
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-[10px] font-bold text-rose-400 font-mono">
                    {d.arena.tier} Tier
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-2xl font-extrabold text-white">{d.arena.elo}</span>
                    <span className="text-xs text-zinc-500 ml-1">ELO Rating</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-emerald-400 font-bold">{d.arena.wins}W</span>
                    <span className="text-zinc-600 mx-1">/</span>
                    <span className="text-rose-400 font-bold">{d.arena.losses}L</span>
                    <span className="text-zinc-400 text-[10px] ml-2">({d.arena.winRate} Win Rate)</span>
                  </div>
                </div>

                {/* SVG ELO Progression Curve */}
                <div className="h-28 w-full pt-1 relative">
                  <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="arenaEloGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#27272a" strokeDasharray="2 2" strokeWidth="1" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#27272a" strokeDasharray="2 2" strokeWidth="1" />
                    
                    {/* ELO Curve Line */}
                    <path
                      d="M 10 65 L 45 55 L 85 45 L 125 52 L 165 38 L 205 30 L 245 42 L 285 22"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 65 L 45 55 L 85 45 L 125 52 L 165 38 L 205 30 L 245 42 L 285 22 L 285 75 L 10 75 Z"
                      fill="url(#arenaEloGrad)"
                    />

                    {/* Nodes */}
                    {d.arena.history.slice(0, 8).map((pt, idx) => {
                      const x = 10 + idx * 39;
                      const y = Math.max(15, Math.min(68, 75 - (pt.elo - 1150) * 0.35));
                      const isHov = hoveredArenaPoint === idx;
                      return (
                        <g key={pt.matchId} onMouseEnter={() => setHoveredArenaPoint(idx)} onMouseLeave={() => setHoveredArenaPoint(null)}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHov ? 5 : 3.5}
                            fill={pt.outcome === "VICTORY" ? "#10b981" : "#f43f5e"}
                            stroke="#09090b"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip */}
                  {hoveredArenaPoint !== null && d.arena.history[hoveredArenaPoint] && (
                    <div className="absolute top-0 right-2 bg-zinc-900 border border-rose-500/40 p-2 rounded-lg text-[10px] font-mono shadow-xl z-10 pointer-events-none">
                      <div className="font-bold text-white">{d.arena.history[hoveredArenaPoint].problem}</div>
                      <div className={d.arena.history[hoveredArenaPoint].outcome === "VICTORY" ? "text-emerald-400" : "text-rose-400"}>
                        {d.arena.history[hoveredArenaPoint].outcome} · {d.arena.history[hoveredArenaPoint].elo} ELO
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>Match 1 (1,200)</span>
                  <span className="text-rose-400 font-bold">Latest Match ({d.arena.elo})</span>
                </div>
              </div>

              {/* Flagship Feature 2: AI Mock Interview Competency Learning Curve */}
              <div className="p-6 rounded-2xl bg-[#121215] border border-cyan-500/30 shadow-xl shadow-cyan-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      AI Mock Interview Trajectory
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 font-mono">
                    {d.mockInterview.completedCount} Sessions
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-2xl font-extrabold text-white">{d.mockInterview.averageScore}%</span>
                    <span className="text-xs text-zinc-500 ml-1">Avg Score</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-emerald-400 font-bold">FAANG Ready</span>
                    <span className="text-zinc-500 text-[10px] ml-1.5">(Tech & Comm)</span>
                  </div>
                </div>

                {/* SVG Mock Interview Score Curve */}
                <div className="h-28 w-full pt-1 relative">
                  <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="interviewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#27272a" strokeDasharray="2 2" strokeWidth="1" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#27272a" strokeDasharray="2 2" strokeWidth="1" />

                    {/* Score Curve Line */}
                    <path
                      d="M 10 58 C 50 65, 90 40, 130 35 C 170 30, 220 22, 285 16"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 58 C 50 65, 90 40, 130 35 C 170 30, 220 22, 285 16 L 285 75 L 10 75 Z"
                      fill="url(#interviewGrad)"
                    />

                    {/* Nodes */}
                    {d.mockInterview.history.slice(0, 6).map((pt, idx) => {
                      const x = 15 + idx * 52;
                      const y = Math.max(12, Math.min(68, 80 - (pt.overallScore - 40) * 0.9));
                      const isHov = hoveredInterviewPoint === idx;
                      return (
                        <g key={pt.id} onMouseEnter={() => setHoveredInterviewPoint(idx)} onMouseLeave={() => setHoveredInterviewPoint(null)}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHov ? 5 : 3.5}
                            fill="#06b6d4"
                            stroke="#09090b"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all"
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip */}
                  {hoveredInterviewPoint !== null && d.mockInterview.history[hoveredInterviewPoint] && (
                    <div className="absolute top-0 right-2 bg-zinc-900 border border-cyan-500/40 p-2 rounded-lg text-[10px] font-mono shadow-xl z-10 pointer-events-none">
                      <div className="font-bold text-white">{d.mockInterview.history[hoveredInterviewPoint].company} · {d.mockInterview.history[hoveredInterviewPoint].role}</div>
                      <div className="text-cyan-400 font-bold">
                        Score: {d.mockInterview.history[hoveredInterviewPoint].overallScore}/100 ({d.mockInterview.history[hoveredInterviewPoint].verdict})
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>First Session (68%)</span>
                  <span className="text-cyan-400 font-bold">Peak Session (92%)</span>
                </div>
              </div>

            </div>

            {/* ============================================================== */}
            {/* FIFTH ROW: TABBED RECENT ACTIVITY FEEDS                        */}
            {/* ============================================================== */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-zinc-800/80 shadow-xl shadow-black/40 space-y-4">
              
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("submissions")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "submissions"
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                    Recent AC ({d.recentActivity.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("arena")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "arena"
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Swords className="h-3.5 w-3.5 text-rose-400" />
                    1v1 Arena Matches ({d.arena.history.length})
                  </button>

                  <button
                    onClick={() => setActiveTab("interviews")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === "interviews"
                        ? "bg-zinc-800 text-white border border-zinc-700 shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5 text-cyan-400" />
                    Mock Interviews ({d.mockInterview.history.length})
                  </button>
                </div>

                <Link
                  href="/problems"
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono"
                >
                  View problem catalog <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Tab 1 Content: Submissions */}
              {activeTab === "submissions" && (
                <div className="overflow-x-auto">
                  {d.recentActivity.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs italic">
                      No submissions found. Solve problems to populate this feed.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800/80">
                        <tr>
                          <th className="pb-2.5">Problem Title</th>
                          <th className="pb-2.5">Difficulty</th>
                          <th className="pb-2.5">Status</th>
                          <th className="pb-2.5">Language</th>
                          <th className="pb-2.5 text-right">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {d.recentActivity.map((sub) => (
                          <tr key={sub.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 font-bold text-white flex items-center gap-2">
                              {sub.problem}
                            </td>
                            <td className="py-3">
                              <span className={`text-[10px] font-bold ${
                                sub.difficulty === "EASY" ? "text-emerald-400" :
                                sub.difficulty === "HARD" ? "text-rose-400" : "text-amber-400"
                              }`}>
                                {sub.difficulty}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.status === "ACCEPTED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-3 text-zinc-400">{sub.lang}</td>
                            <td className="py-3 text-right text-zinc-500">{sub.submittedAt}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 2 Content: 1v1 Arena Matches */}
              {activeTab === "arena" && (
                <div className="overflow-x-auto">
                  {d.arena.history.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs italic">
                      No 1v1 matches recorded yet. Enter the Arena to battle opponents!
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800/80">
                        <tr>
                          <th className="pb-2.5">Battle Problem</th>
                          <th className="pb-2.5">Mode</th>
                          <th className="pb-2.5">Outcome</th>
                          <th className="pb-2.5">ELO Standing</th>
                          <th className="pb-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {d.arena.history.map((m) => (
                          <tr key={m.matchId} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3 font-bold text-white">{m.problem}</td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-zinc-800 text-zinc-300">
                                {m.mode}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.outcome === "VICTORY"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {m.outcome}
                              </span>
                            </td>
                            <td className="py-3 text-amber-400 font-bold">{m.elo} pts</td>
                            <td className="py-3 text-right text-zinc-500">{m.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab 3 Content: AI Mock Interviews */}
              {activeTab === "interviews" && (
                <div className="overflow-x-auto">
                  {d.mockInterview.history.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs italic">
                      No mock interview sessions recorded yet. Launch an AI Mock Interview to start!
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800/80">
                        <tr>
                          <th className="pb-2.5">Company & Role</th>
                          <th className="pb-2.5">Topic</th>
                          <th className="pb-2.5">Score</th>
                          <th className="pb-2.5">Verdict</th>
                          <th className="pb-2.5 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {d.mockInterview.history.map((intv) => (
                          <tr key={intv.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3">
                              <div className="font-bold text-white">{intv.company}</div>
                              <div className="text-[10px] text-zinc-400">{intv.role}</div>
                            </td>
                            <td className="py-3 text-zinc-300">{intv.topic}</td>
                            <td className="py-3 font-bold text-cyan-400">{intv.overallScore}%</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                intv.verdict.includes("STRONG_HIRE")
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : intv.verdict.includes("HIRE")
                                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              }`}>
                                {intv.verdict}
                              </span>
                            </td>
                            <td className="py-3 text-right text-zinc-500">{intv.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}