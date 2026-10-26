"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Trophy, Cpu, LayoutDashboard, LogOut, LogIn, ShieldCheck, Swords, Bot, Eye } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({ name: parsed.username || parsed.name || parsed.email || "Developer", role: parsed.role || "USER" });
      } catch {
        setUser({ name: "Developer", role: "USER" });
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    window.location.href = "/login";
  };

  if (pathname === "/login") return null;

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-[#09090b]/90 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between font-sans">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
          &gt;_
        </div>
        <span className="font-bold text-base tracking-tight text-white">
          Synapse<span className="text-indigo-400">Judge</span>
        </span>
      </Link>

      <nav className="flex items-center gap-5 text-xs font-semibold text-zinc-400">
        <Link href="/problems" className={`hover:text-white flex items-center gap-1.5 transition-colors ${pathname.startsWith("/problems") ? "text-indigo-400 font-bold" : ""}`}>
          <Code2 className="h-4 w-4" /> PROBLEMS
        </Link>
        <Link
          href="/arena"
          className={`hover:text-rose-400 flex items-center gap-1.5 transition-colors ${
            pathname.startsWith("/arena") ? "text-rose-400 font-bold" : "text-zinc-300"
          }`}
        >
          <Swords className="h-4 w-4 text-rose-500 animate-pulse" /> 1V1 ARENA
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full font-bold">
            LIVE
          </span>
        </Link>
        <Link
          href="/interview"
          className={`hover:text-cyan-400 flex items-center gap-1.5 transition-colors ${
            pathname.startsWith("/interview") ? "text-cyan-400 font-bold" : "text-zinc-300"
          }`}
        >
          <Bot className="h-4 w-4 text-cyan-400 animate-pulse" /> AI INTERVIEW
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-bold">
            FAANG
          </span>
        </Link>
        <Link
          href="/visualizer"
          className={`hover:text-purple-400 flex items-center gap-1.5 transition-colors ${
            pathname.startsWith("/visualizer") ? "text-purple-400 font-bold" : "text-zinc-300"
          }`}
        >
          <Eye className="h-4 w-4 text-purple-400 animate-pulse" /> VISUALIZER
        </Link>
        <Link href="/contests" className={`hover:text-white flex items-center gap-1.5 transition-colors ${pathname.startsWith("/contests") ? "text-indigo-400 font-bold" : ""}`}>
          <Trophy className="h-4 w-4" /> CONTESTS
        </Link>
        <Link href="/leaderboard" className={`hover:text-white flex items-center gap-1.5 transition-colors ${pathname === "/leaderboard" ? "text-indigo-400 font-bold" : ""}`}>
          <Cpu className="h-4 w-4" /> LEADERBOARD
        </Link>
        <Link href="/dashboard" className={`hover:text-white flex items-center gap-1.5 transition-colors ${pathname === "/dashboard" ? "text-indigo-400 font-bold" : ""}`}>
          <LayoutDashboard className="h-4 w-4" /> DASHBOARD
        </Link>
        {user?.role === "ADMIN" && (
          <Link href="/admin" className={`hover:text-amber-400 flex items-center gap-1.5 transition-colors text-amber-500 font-bold ${pathname === "/admin" ? "underline" : ""}`}>
            <ShieldCheck className="h-4 w-4" /> ADMIN PANEL
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3">
        {mounted && user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">
              Hi, <strong className="text-white">{user.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="text-xs bg-zinc-900 border border-zinc-800 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 text-zinc-300 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <LogIn className="h-3.5 w-3.5" /> Login
          </Link>
        )}
      </div>
    </header>
  );
}