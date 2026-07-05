"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { LogIn, UserCheck, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { checkAuthStatus } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/login", { identifier, password });
      if (response.data?.success) {
        await checkAuthStatus(); 
        router.push("/"); 
      }
    } catch (err: any) {
      // 🚀 EXTRACT PRECISE ERROR METRICS
      const backendData = err.response?.data;
      
      if (backendData?.errors && typeof backendData.errors === "object") {
        const parsedIssues = Object.entries(backendData.errors)
          .map(([field, details]: any) => `${field}: ${details._errors?.join(", ") || details}`)
          .join(" | ");
        setError(parsedIssues || backendData.message);
      } else {
        setError(backendData?.message || err.message || "Network connection refused by upstream backend.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -z-10 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
      
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <LogIn className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome Back</h2>
          <p className="text-sm text-zinc-400 mt-1.5">Deploy your logical instances to the judge</p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5 text-xs font-semibold text-red-400 leading-relaxed whitespace-pre-line">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
              Email or Username
            </label>
            <div className="relative">
              <UserCheck className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
                placeholder="coder_404 or name@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Security Password</label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/10 transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Initialize Session <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          New to the judge?{" "}
          <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-all">
            Create an execution track
          </Link>
        </p>
      </div>
    </div>
  );
}