"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, Lock, Mail, User, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function AuthPage() {
  const [mounted, setMounted] = useState(false);
  const [authRole, setAuthRole] = useState<"USER" | "ADMIN">("USER");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  useEffect(() => {
    setMounted(true);
    // If user is already logged in when visiting /login, auto-redirect to homepage
    const token = localStorage.getItem("token") || document.cookie.includes("token=");
    if (token) {
      window.location.href = "/";
    }
  }, []);

  const handleToggleRegister = () => {
    setIsRegister(!isRegister);
    setAuthRole("USER");
    setError(null);
    setFormData({ username: "", email: "", password: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.post("/auth/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });

        if (res.data?.success) {
          const token = res.data.token;
          const user = res.data.user;

          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax;`;

          window.location.href = "/";
        } else {
          setError(res.data?.message || "Registration failed.");
        }
      } else {
        const res = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
          requiredRole: authRole
        });

        if (res.data?.success) {
          const token = res.data.token;
          const user = res.data.user;

          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax;`;

          window.location.href = user.role === "ADMIN" ? "/admin" : "/";
        } else {
          setError(res.data?.message || "Login failed.");
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl">
        
        <div className="flex flex-col items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            &gt;_
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Synapse<span className="text-indigo-400">Judge</span>
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            {isRegister ? "Create a new developer account" : "Select portal to log in"}
          </p>
        </div>

        {!isRegister && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono">
            <button
              type="button"
              onClick={() => { setAuthRole("USER"); setError(null); }}
              className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${authRole === "USER" ? "bg-indigo-600 text-white shadow-md" : "text-zinc-400 hover:text-white"}`}
            >
              <UserCheck className="h-3.5 w-3.5" /> User Portal
            </button>
            <button
              type="button"
              onClick={() => { setAuthRole("ADMIN"); setError(null); }}
              className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${authRole === "ADMIN" ? "bg-amber-600 text-white shadow-md" : "text-zinc-400 hover:text-white"}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Portal
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-zinc-400 uppercase font-bold text-[10px]">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase font-bold text-[10px]">
              {isRegister ? "Email Address" : "Email Address or Username"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                required
                placeholder={isRegister ? "developer@synapse.io" : (authRole === "ADMIN" ? "admin@synapse.io" : "developer@synapse.io")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase font-bold text-[10px]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 ${!isRegister && authRole === "ADMIN" ? "bg-amber-600 hover:bg-amber-500" : "bg-indigo-600 hover:bg-indigo-500"}`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                {isRegister ? "Create User Account" : `Login to ${authRole} Portal`} <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500 pt-2 border-t border-zinc-800/80">
          {isRegister ? "Already registered?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={handleToggleRegister}
            className="text-indigo-400 hover:underline font-bold cursor-pointer"
          >
            {isRegister ? "Log In" : "Register Now"}
          </button>
        </div>

      </div>
    </div>
  );
}