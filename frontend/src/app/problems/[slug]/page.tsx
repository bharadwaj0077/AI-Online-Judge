"use client";

import React, { useState, useEffect, use } from "react";
import Editor from "@monaco-editor/react";
import { api } from "@/lib/api";
import { Problem, AiFeedback } from "@/types";
import { Terminal, Play, ShieldAlert, Cpu, Sparkles, CheckCircle2, XCircle, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ProblemWorkspacePage({ params }: PageProps) {
  // Safe unwrap for dynamic parameter contexts in modern Next.js environments
  const { slug } = use(params);

  // Core Functional Parameters State Management
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [sourceCode, setSourceCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  // Code Sandbox Custom Execution States
  const [customInput, setCustomInput] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [runningCode, setRunningCode] = useState(false);

  // Formal Submission Evaluation States
  const [verdict, setVerdict] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [submissionPublicId, setSubmissionPublicId] = useState<string | null>(null);

  // Intelligence Core Feedback Metrics States
  const [aiFeedback, setAiFeedback] = useState<AiFeedback | null>(null);
  const [generatingAiInsight, setGeneratingAiInsight] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    const fetchProblemData = async () => {
      try {
        const response = await api.get(`/problems/${slug}`);
        if (response.data?.success) {
          setProblem(response.data.data);
          // Set intelligent boilerplate defaults based on selected engine tracks
          setSourceCode(
            selectedLanguage === "python" 
              ? "# Write your optimal solution here\n\ndef solve():\n    pass\n" 
              : "// Write your optimal solution here\n#include <iostream>\nint main() {\n    return 0;\n}\n"
          );
        }
      } catch (error) {
        console.error("Failed to load problem specs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProblemData();
  }, [slug, selectedLanguage]);

  // Handle ad-hoc test case running inside isolated sandboxes
  const handleRunAdHocCode = async () => {
    setRunningCode(true);
    setSandboxOutput("");
    try {
      const response = await api.post("/judge/run", {
        sourceCode,
        language: selectedLanguage,
        customInput
      });
      setSandboxOutput(response.data?.output || "Execution completed with blank logs.");
    } catch (err: any) {
      // 🟩 Fix: Print precise error strings instead of a static generic message
      setSandboxOutput(err.response?.data?.message || err.message || "An exception occurred inside the pipeline container loop.");
    } finally {
      setRunningCode(false);
    }
  };

  // Handle formal evaluation submission testing routines
  const handleSubmitSolution = async () => {
    setEvaluating(true);
    setVerdict(null);
    setAiFeedback(null);
    setSubmissionPublicId(null);
    try {
      const response = await api.post("/submissions", {
        problemId: problem?.id,
        sourceCode,
        language: selectedLanguage
      });
      
      const payload = response.data?.data || response.data;
      setVerdict(payload.verdict);
      setSubmissionPublicId(payload.publicId);
    } catch (err: any) {
      // 🟩 Fix: Expose the actual server exception string cleanly
      setVerdict(err.response?.data?.message || "SERVER_DATABASE_ERROR");
    } finally {
      setEvaluating(false);
    }
  };

  // Triggers the on-demand Gemini analysis service
  const handleTriggerAiReview = async () => {
    if (!submissionPublicId) return;
    setGeneratingAiInsight(true);
    setAiError("");
    try {
      const response = await api.post(`/ai/review/${submissionPublicId}`);
      if (response.data?.success) {
        setAiFeedback(response.data.data);
      }
    } catch (err: any) {
      setAiError(err.response?.data?.message || "AI core channels currently congested.");
    } finally {
      setGeneratingAiInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Compiling Workspace Components...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-4rem)] bg-zinc-950 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/60">
      
      {/* LEFT MODULE PANELS: Problem Statement Specs & AI Feedback Layout Drawer (4 Columns) */}
      <div className="lg:col-span-5 flex flex-col h-[calc(100vh-4rem)] overflow-y-auto p-6 space-y-6">
        <div>
          <span className={clsx(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border mb-3",
            problem?.difficulty === "EASY" && "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
            problem?.difficulty === "MEDIUM" && "bg-amber-500/5 border-amber-500/20 text-amber-400",
            problem?.difficulty === "HARD" && "bg-rose-500/5 border-rose-500/20 text-rose-400"
          )}>
            {problem?.difficulty}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{problem?.title}</h1>
        </div>

        {/* Core Markdown Statement Block */}
        <div className="text-sm text-zinc-300 leading-relaxed font-normal border-b border-zinc-800/60 pb-6 whitespace-pre-line">
          {problem?.statement}
        </div>

        {/* INTERACTIVE JUDGE RESULTS GATEWAY */}
        {verdict && (
          <div className={clsx(
            "rounded-xl border p-4 shadow-lg backdrop-blur-md",
            verdict === "ACCEPTED" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"
          )}>
            <div className="flex items-center gap-3">
              {verdict === "ACCEPTED" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide">Judge Verdict: {verdict}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Sandbox container teardown completed safely.</p>
              </div>
            </div>

            {/* AI Assistant Call-To-Action Activation Box */}
            <div className="mt-4 border-t border-zinc-800/60 pt-3 flex flex-col gap-3">
              <p className="text-xs text-zinc-400">Want a deep review of your code's time/space complexity or why it failed?</p>
              <button
                onClick={handleTriggerAiReview}
                disabled={generatingAiInsight}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white py-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-40"
              >
                {generatingAiInsight ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Consult Gemini AI Mentor
              </button>
            </div>
          </div>
        )}

        {/* DYNAMIC INTEGRATED AI CRITIQUE SCREEN */}
        {(aiFeedback || aiError) && (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-5 space-y-4 shadow-inner">
            <div className="flex items-center gap-2 text-indigo-400 border-b border-zinc-800/60 pb-2.5">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase">Gemini Mentorship Node Active</h3>
            </div>
            
            {aiError ? (
              <p className="text-xs text-rose-400">{aiError}</p>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1">Structural Analysis</h5>
                  <p className="text-xs text-zinc-400 leading-relaxed">{aiFeedback?.analysis}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/40 font-mono text-[11px]">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Runtime Complexity</span>
                    <span className="text-indigo-400 font-bold">{aiFeedback?.timeComplexity}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase">Space Allocation</span>
                    <span className="text-violet-400 font-bold">{aiFeedback?.spaceComplexity}</span>
                  </div>
                </div>
                <div>
                  <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">Algorithmic Hints (Click to Reveal)</h5>
                  <div className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800 whitespace-pre-line font-mono leading-relaxed">
                    {aiFeedback?.hints}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT MODULE PANELS: Live IDE Monaco Code Editor & Custom Terminal Console IO (7 Columns) */}
      <div className="lg:col-span-7 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* IDE Control System Toolbar Header */}
        <div className="flex items-center justify-between px-6 h-14 border-b border-zinc-800/60 bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <Terminal className="h-4 w-4 text-zinc-500" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-xs font-mono font-semibold text-zinc-300 rounded-lg px-3 py-1 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="python">Python 3.11</option>
              <option value="cpp">C++ 17 (GCC)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAdHocCode}
              disabled={runningCode || evaluating}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:bg-zinc-800 disabled:opacity-40"
            >
              {runningCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 text-zinc-400" />}
              Run Code
            </button>
            <button
              onClick={handleSubmitSolution}
              disabled={runningCode || evaluating}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-indigo-500 shadow-md active:scale-[0.97] disabled:opacity-40"
            >
              {evaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Cpu className="h-3.5 w-3.5" />}
              Submit Instance
            </button>
          </div>
        </div>

        {/* Embedded Monaco Workspace Canvas Panel */}
        <div className="flex-grow border-b border-zinc-800/60">
          <Editor
            height="100%"
            theme="vs-dark"
            language={selectedLanguage === "cpp" ? "cpp" : "python"}
            value={sourceCode}
            onChange={(val) => setSourceCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "var(--font-font-mono)",
              lineHeight: 20,
              padding: { top: 16 },
              smoothScrolling: true,
              cursorBlinking: "smooth"
            }}
          />
        </div>

        {/* COLLAPSIBLE RUNTIME IO TERMINAL TRACK */}
        <div className="h-56 bg-zinc-950 grid grid-cols-2 divide-x divide-zinc-800/60 font-mono text-xs">
          
          {/* Input Argument Parameter Ingestion Frame */}
          <div className="flex flex-col h-full">
            <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-900/10 text-zinc-500 font-bold tracking-wide uppercase text-[10px]">
              Custom Console Input arguments
            </div>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Provide clean execution args here..."
              className="flex-grow w-full bg-transparent p-4 outline-none resize-none text-zinc-300 placeholder-zinc-700"
            />
          </div>

          {/* Real-time Execution Output Stream Capture Frame */}
          <div className="flex flex-col h-full bg-zinc-950/40">
            <div className="px-4 py-2 border-b border-zinc-800/40 bg-zinc-900/10 text-zinc-500 font-bold tracking-wide uppercase text-[10px]">
              Sandbox Output Stream
            </div>
            <div className="flex-grow p-4 overflow-y-auto text-zinc-400 whitespace-pre-wrap select-text selection:bg-zinc-800">
              {runningCode ? (
                <span className="text-zinc-600 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" /> Mapping sandbox buffers...</span>
              ) : (
                sandboxOutput || <span className="text-zinc-700 italic">No console logs recorded. Execute "Run Code" to inspect output buffers.</span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}