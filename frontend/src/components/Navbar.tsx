"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Terminal, Code2, Trophy, User, LogIn, Cpu } from "lucide-react";
import { clsx } from "clsx";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Navigation link configuration matrix arrays
  const navItems = [
    { name: "Problems", href: "/problems", icon: Code2 },
    { name: "Contests", href: "/contests", icon: Trophy }, // 🚀 INSTALLED: Seamless link route attachment
    { name: "Leaderboard", href: "/leaderboard", icon: Cpu },
    { name: "Dashboard", href: "/dashboard", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo Hub Signature Block */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-black text-white shadow-md shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
            <Terminal className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-100">
            Synapse<span className="text-indigo-400 font-medium">Judge</span>
          </span>
        </Link>

        {/* Center Main App Navigation Paths Link Rows */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) || (item.href === "/" && pathname === "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200",
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
                    : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
                )}
              >
                <Icon className={clsx("h-4 w-4", isActive ? "text-indigo-400" : "text-zinc-500")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Authentication User Badge Slot */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-800/60 rounded-xl px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-zinc-300 tracking-wide">{user.username}</span>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all hover:bg-indigo-500 active:scale-[0.98]"
            >
              <LogIn className="h-3.5 w-3.5" /> Entry Gate
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}