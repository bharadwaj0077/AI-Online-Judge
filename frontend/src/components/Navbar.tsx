"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, Terminal, Trophy, User2, Lightbulb } from "lucide-react";
import { clsx } from "clsx";

export default function Navbar() {
  const pathname = usePathname();

  const navigationTracks = [
    { name: "Problems", href: "/problems", icon: Terminal },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Dashboard", href: "/dashboard", icon: User2 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Core Identity Frame */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <span className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            Synapse<span className="text-indigo-400 font-medium font-mono text-sm ml-0.5">Judge</span>
          </span>
        </Link>

        {/* Global Trajectory Navigation Vectors */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navigationTracks.map((track) => {
            const Icon = track.icon;
            const isActive = pathname.startsWith(track.href);

            return (
              <Link
                key={track.href}
                href={track.href}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-zinc-800/60 text-indigo-400 border border-zinc-700/50"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                )}
              >
                <Icon className={clsx("h-4 w-4", isActive ? "text-indigo-400" : "text-zinc-400")} />
                {track.name}
              </Link>
            );
          })}
        </nav>

        {/* System Integration Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide text-emerald-400 font-mono uppercase">
              Engine Online
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}