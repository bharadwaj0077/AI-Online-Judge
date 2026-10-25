"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  Bot,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Loader2,
  ShieldCheck,
  FileCode,
  Calendar
} from "lucide-react";
import { api } from "@/lib/api";

export default function StandaloneScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!interviewId) return;

    const fetchScorecard = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/interviews/${interviewId}`);
        if (!res.data.success || !res.data.data) {
          throw new Error("Scorecard record not found.");
        }
        setSessionData(res.data.data);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to load evaluation scorecard.");
      } finally {
        setLoading(false);
      }
    };

    fetchScorecard();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold">Retrieving FAANG Evaluation Scorecard...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !sessionData?.scorecard) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6 text-zinc-100">
        <div className="max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">No Scorecard Available</h2>
          <p className="text-xs text-zinc-400">
            {errorMsg || "This interview has not been evaluated or completed yet."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push(`/interview/${interviewId}`)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white"
            >
              Resume Interview
            </button>
            <Link
              href="/interview"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
            >
              Back to Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sc = sessionData.scorecard;
  const isHire = sc.hireDecision === "STRONG_HIRE" || sc.hireDecision === "HIRE";

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 py-10 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/interview"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Interview Hub</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{new Date(sessionData.startTime || sessionData.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Main Scorecard Card */}
        <div className="bg-zinc-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Verdict Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                Hiring Committee Evaluation Report
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white">
                {sessionData.problemTitle || sessionData.problem?.title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1 text-white font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" /> {sessionData.targetCompany}
                </span>
                <span>·</span>
                <span className="text-cyan-400 font-mono">{sessionData.roleTitle}</span>
                <span>·</span>
                <span>{sessionData.durationMinutes} Minutes Screen</span>
              </div>
            </div>

            {/* Decision Status */}
            <div className="text-right flex flex-col items-end">
              <div
                className={`px-5 py-2 rounded-2xl font-black text-base uppercase tracking-wider border shadow-xl ${
                  isHire
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/50"
                }`}
              >
                {sc.hireDecision.replace("_", " ")}
              </div>
              <div className="text-2xl font-black font-mono text-white mt-2">
                Overall: {sc.overallScore}/100
              </div>
            </div>
          </div>

          {/* Metric Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-[10px] uppercase font-mono text-zinc-400">Technical Depth</div>
              <div className="text-2xl font-black text-white mt-1">{sc.technicalScore}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-[10px] uppercase font-mono text-zinc-400">Communication</div>
              <div className="text-2xl font-black text-cyan-300 mt-1">{sc.communicationScore}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-[10px] uppercase font-mono text-zinc-400">Problem Solving</div>
              <div className="text-2xl font-black text-indigo-300 mt-1">{sc.problemSolvingScore}%</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
              <div className="text-[10px] uppercase font-mono text-zinc-400">Behavioral Delivery</div>
              <div className="text-2xl font-black text-emerald-300 mt-1">{sc.behavioralScore}%</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Bot className="w-4 h-4" /> Executive Debrief
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{sc.executiveSummary}</p>
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Core Strengths
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-300">
                {sc.strengths?.map((str: string, i: number) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Focus Areas for Leveling Up
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-300">
                {sc.growthAreas?.map((gr: string, i: number) => (
                  <li key={i}>{gr}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Code Review & Line by Line Feedback */}
          {sc.lineByLineFeedback && (
            <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                Code Review & Architecture Critique
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono">{sc.lineByLineFeedback}</p>
            </div>
          )}

          {/* Candidate Code vs Reference Solution */}
          <div className="space-y-4">
            {sessionData.currentCode && (
              <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" /> Candidate Final Code:
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto">
                  {sessionData.currentCode}
                </pre>
              </div>
            )}

            {sc.optimalSolution && (
              <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> Optimal Reference Solution:
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-emerald-200 overflow-x-auto">
                  {sc.optimalSolution}
                </pre>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
            <Link
              href={`/interview/${interviewId}`}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
            >
              Revisit Workspace & Transcript
            </Link>

            <button
              onClick={() => router.push("/interview")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
            >
              Start New Mock Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
