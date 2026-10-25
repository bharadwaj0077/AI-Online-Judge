"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Editor from "@monaco-editor/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play,
  Send,
  Loader2,
  Code2,
  Plus,
  HelpCircle,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Lock,
  Unlock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { TieredHintItem, FailedTestCaseDetail, FailureDiagnosis } from "@/types";

interface ProblemDetail {
  id: string; title: string; statement: string; inputFormat: string; outputFormat: string; constraintsText: string; difficulty: string; inputTemplate: string;
  testCases: { input: string; expectedOutput: string }[];
}

interface TestCaseMetrics {
  id: number; label: string; inputs: { name: string; value: string }[]; expected: string; stdout: string; actualOutput: string; error: string | null; status: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "ERROR"; isCustom?: boolean;
}

interface SubmissionResult {
  verdict: string;
  score: number;
  executionTimeMs: number; 
  passedCases: number;
  totalCases: number;
  sampleCases?: { passed: number; total: number };
  hiddenCases?: { passed: number; total: number };
  failedCase?: FailedTestCaseDetail | null;
}

const themesRegistry = {
  "vs-dark": { bg: "bg-[#1e1e1e] text-[#d4d4d4]", panel: "bg-[#252526]", border: "border-[#3c3c3c]", headerBg: "bg-[#2d2d2d]", textMain: "text-[#ffffff]", textMuted: "text-[#a9a9a9]", inputBg: "bg-[#3c3c3c] border-[#6b6b6b] text-white focus:border-[#007acc]", tabActive: "border-[#007acc] text-white bg-[#1e1e1e]", editorTheme: "vs-dark" }
};

function getEditorLanguageType(langSlug: string): string {
  const norm = langSlug.toLowerCase().trim();
  if (norm.includes("python")) return "python";
  if (norm.includes("javascript") || norm.includes("js")) return "javascript";
  if (norm.includes("java")) return "java";
  return "cpp";
}

export default function ProblemWorkspaceCanvas() {
  const { slug } = useParams();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [selectedLang, setSelectedLanguage] = useState("python3");
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});
  const [editorCode, setEditorCode] = useState("");
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hintLoading, setHintLoading] = useState(false);
  const [tieredHints, setTieredHints] = useState<TieredHintItem[] | null>(null);
  const [unlockedTier, setUnlockedTier] = useState<number>(1);
  const [showTieredHints, setShowTieredHints] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<{ time: string; space: string; summary: string } | null>(null);
  const activeTheme = "vs-dark";
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [testCases, setTestCases] = useState<TestCaseMetrics[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [leftWidth, setLeftWidth] = useState(40);
  const [consoleHeight, setConsoleHeight] = useState(250);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isResizingWidthRef = useRef(false);
  const isResizingHeightRef = useRef(false);

  useEffect(() => {
    const fetchInitialProblemSchema = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/problems/${slug}`);
        if (response.data?.success) {
          const probData = response.data.data;
          setProblem(probData);
          let parsedMap: Record<string, string> = {};
          try { parsedMap = typeof probData.inputTemplate === "string" ? JSON.parse(probData.inputTemplate) : probData.inputTemplate; } catch { parsedMap = { python3: probData.inputTemplate }; }
          setTemplatesMap(parsedMap);
          setEditorCode(parsedMap[selectedLang] || parsedMap["python3"] || "");
          const parsedCases: TestCaseMetrics[] = (probData.testCases || []).map((tc: any, index: number) => ({ id: index + 1, label: `Case ${index + 1}`, inputs: [{ name: "input", value: tc.input }], expected: tc.expectedOutput, stdout: "", actualOutput: "", error: null, status: "PENDING" }));
          setTestCases(parsedCases);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (slug) fetchInitialProblemSchema();
  }, [slug, selectedLang]);

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    setEditorCode(templatesMap[newLang] || templatesMap["python3"] || "");
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidthRef.current && containerRef.current) { const rect = containerRef.current.getBoundingClientRect(); const pct = ((e.clientX - rect.left) / rect.width) * 100; if (pct > 20 && pct < 80) setLeftWidth(pct); }
      if (isResizingHeightRef.current && rightPaneRef.current) { const rect = rightPaneRef.current.getBoundingClientRect(); const h = rect.bottom - e.clientY; if (h > 100 && h < rect.height - 100) setConsoleHeight(h); }
    };
    const handleMouseUp = () => { isResizingWidthRef.current = false; isResizingHeightRef.current = false; };
    document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp);
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); };
  }, []);

  const getTieredHints = async (forceRefresh = false) => {
    if (!problem || hintLoading) return;
    setHintLoading(true);
    setShowTieredHints(true);
    try {
      const res = await api.post(`/problems/${problem.id}/tiered-hints`, {
        sourceCode: editorCode,
        language: selectedLang
      });
      if (res.data?.success && Array.isArray(res.data.tiers)) {
        setTieredHints(res.data.tiers);
        if (forceRefresh) {
          setUnlockedTier(prev => Math.max(prev, 1));
        } else if (!tieredHints) {
          setUnlockedTier(1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tiered hints:", err);
    } finally {
      setHintLoading(false);
    }
  };

  const askAI = async () => {
    if (!problem || aiLoading) return;
    setAiLoading(true);
    setAiVerdict(null);
    try {
      const res = await api.post(`/problems/${problem.id}/verdict`, { sourceCode: editorCode, language: selectedLang });
      if (res.data?.success) {
        setAiVerdict({ time: res.data.timeComplexity, space: res.data.spaceComplexity, summary: res.data.analysis });
      }
    } catch {
      setAiVerdict({ time: "O(N)", space: "O(N)", summary: "Linear time solution using additional space." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunCodeAction = async () => {
    setExecuting(true); setConsoleTab("result"); setSubmissionResult(null);
    setTestCases(prev => prev.map(tc => ({ ...tc, status: "PENDING", actualOutput: "Evaluating...", stdout: "", error: null })));
    const evaluatedOutputsList = await Promise.all(testCases.map(async (tc) => {
      const argumentToken = tc.inputs.map(i => i.value).join("\n");
      try {
        const payload = { sourceCode: editorCode, language: selectedLang, customInput: argumentToken, problemId: problem?.id };
        const res = await api.post("/judge/run", payload);
        const parsedStdout = (res.data?.stdout || "").trim(), parsedOutput = (res.data?.output || "").trim(), parsedExpected = (res.data?.expected || "").trim(), parsedError = res.data?.error || null;
        let calculatedStatus: "ACCEPTED" | "WRONG_ANSWER" | "ERROR" = "ACCEPTED";
        if (parsedError) calculatedStatus = "ERROR"; else if (!parsedOutput || parsedOutput.toLowerCase().replace(/\s+/g, "") !== parsedExpected.toLowerCase().replace(/\s+/g, "")) calculatedStatus = "WRONG_ANSWER";
        return { ...tc, stdout: parsedStdout, actualOutput: parsedOutput || "None", expected: parsedExpected || tc.expected, error: parsedError, status: calculatedStatus };
      } catch { return { ...tc, error: "Sandbox execution error.", status: "ERROR" as const }; }
    }));
    setTestCases(evaluatedOutputsList); setExecuting(false);
  };

  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<FailureDiagnosis | null>(null);

  const handleSubmitCodeAction = async () => {
    if (!problem) return;
    setSubmitting(true);
    setConsoleTab("result");
    setDiagnosis(null);
    try {
      const res = await api.post("/judge/submit", { sourceCode: editorCode, language: selectedLang, problemId: problem.id });
      if (res.data?.success) {
        setSubmissionResult({ 
          verdict: res.data.verdict, 
          score: res.data.score, 
          executionTimeMs: res.data.executionTimeMs,
          passedCases: res.data.passedCases, 
          totalCases: res.data.totalCases,
          sampleCases: res.data.sampleCases,
          hiddenCases: res.data.hiddenCases,
          failedCase: res.data.failedCase
        });
      }
    } catch {
      alert("Submission error. Verify session credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiagnoseFailure = async () => {
    if (!problem || !submissionResult?.failedCase || diagnosing) return;
    setDiagnosing(true);
    try {
      const res = await api.post(`/problems/${problem.id}/diagnose-failure`, {
        sourceCode: editorCode,
        language: selectedLang,
        failureContext: submissionResult.failedCase
      });
      if (res.data?.success && res.data.diagnosis) {
        setDiagnosis(res.data.diagnosis);
      }
    } catch (err) {
      console.error("Diagnosis error:", err);
    } finally {
      setDiagnosing(false);
    }
  };

  const handleCreateCustomTestCase = () => {
    if (testCases.length >= 5) return;
    const blueprint = testCases[0]; const nextId = testCases.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    setTestCases([...testCases, { id: nextId, label: `Case ${nextId}`, inputs: blueprint ? blueprint.inputs.map(i => ({ ...i })) : [{ name: "input", value: "" }], expected: "Run to verify", stdout: "", actualOutput: "", error: null, status: "PENDING", isCustom: true }]);
    setActiveCaseIdx(testCases.length);
  };

  const currentCase = testCases[activeCaseIdx];
  const styling = themesRegistry[activeTheme];

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-mono">Loading problem workspace...</div>;

  return (
    <div ref={containerRef} className={`flex min-h-[calc(100vh-3.5rem)] w-full font-sans relative overflow-hidden ${styling.bg}`}>
      
      {/* LEFT PANE */}
      <div style={{ width: `${leftWidth}%` }} className={`p-6 overflow-y-auto border-r flex flex-col gap-4 h-[calc(100vh-3.5rem)] ${styling.border} ${styling.panel}`}>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border bg-indigo-500/5 border-indigo-500/20 text-indigo-400 self-start">{problem?.difficulty}</span>
        <h1 className={`text-xl font-bold tracking-tight ${styling.textMain}`}>{problem?.title}</h1>
        
        <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-5 mb-2" {...props}/>,
              h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-4 mb-2" {...props}/>,
              h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mt-4 mb-2" {...props}/>,
              p: ({node, ...props}) => <div className="mb-4" {...props}/>,
              strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props}/>,
              ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props}/>,
              ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props}/>,
              code({node, className, children, ...props}: any) {
                const match = /language-(\w+)/.exec(className || '');
                const isMultiline = String(children).includes('\n');
                if (match || isMultiline) return <pre className="bg-[#1e1e1e] p-4 rounded-xl overflow-x-auto text-[13px] font-mono border border-zinc-800 mb-4 shadow-inner"><code className={className} {...props}>{children}</code></pre>;
                return <code className="bg-zinc-800/80 text-indigo-300 px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-mono border border-zinc-700/50" {...props}>{children}</code>;
              }
            }}
          >
            {problem?.statement}
          </ReactMarkdown>
        </div>

        {/* 💡 AI TIERED HINT PROGRESSIVE SCAFFOLDING */}
        {showTieredHints && tieredHints && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-zinc-900/80 to-zinc-950/90 text-xs font-sans space-y-4 shadow-xl shadow-amber-950/10">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-200 text-xs tracking-wide flex items-center gap-1.5">
                    Progressive AI Scaffolding
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Tier {unlockedTier} of 3 Unlocked
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-400">Socratic step-by-step guidance tailored to your code</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => getTieredHints(true)}
                  disabled={hintLoading}
                  title="Re-analyze based on current editor code"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${hintLoading ? "animate-spin" : ""}`} />
                  Re-evaluate
                </button>
                <button
                  onClick={() => setShowTieredHints(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer rounded hover:bg-zinc-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-sky-500 to-purple-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(unlockedTier / 3) * 100}%` }}
              />
            </div>

            {/* TIER 1: Observation & Invariants */}
            {tieredHints[0] && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Tier 1: {tieredHints[0].badge}
                    </span>
                    <span className="font-semibold text-xs text-white">{tieredHints[0].title}</span>
                  </div>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-zinc-400 italic">{tieredHints[0].focus}</p>
                <div className="prose prose-invert prose-xs text-zinc-200 max-w-none leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{tieredHints[0].content}</ReactMarkdown>
                </div>
                {tieredHints[0].keyTakeaway && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-amber-200">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-snug"><strong className="text-amber-300">Observation Rule:</strong> {tieredHints[0].keyTakeaway}</p>
                  </div>
                )}
              </div>
            )}

            {/* TIER 2: Algorithmic Strategy */}
            {tieredHints[1] && (
              unlockedTier >= 2 ? (
                <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20 text-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Tier 2: {tieredHints[1].badge}
                      </span>
                      <span className="font-semibold text-xs text-white">{tieredHints[1].title}</span>
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400 italic">{tieredHints[1].focus}</p>
                  <div className="prose prose-invert prose-xs text-zinc-200 max-w-none leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{tieredHints[1].content}</ReactMarkdown>
                  </div>
                  {tieredHints[1].keyTakeaway && (
                    <div className="mt-2.5 p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-start gap-2 text-sky-200">
                      <Sparkles className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-snug"><strong className="text-sky-300">Optimal Strategy:</strong> {tieredHints[1].keyTakeaway}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Tier 2: Algorithmic Strategy</h4>
                      <p className="text-[10px] text-zinc-500">Optimal data structures & complexity trade-offs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUnlockedTier(2)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer"
                  >
                    <Unlock className="h-3 w-3" /> Unlock Tier 2
                  </button>
                </div>
              )
            )}

            {/* TIER 3: Edge Cases & Structural Logic */}
            {tieredHints[2] && (
              unlockedTier >= 3 ? (
                <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 text-zinc-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Tier 3: {tieredHints[2].badge}
                      </span>
                      <span className="font-semibold text-xs text-white">{tieredHints[2].title}</span>
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-zinc-400 italic">{tieredHints[2].focus}</p>
                  <div className="prose prose-invert prose-xs text-zinc-200 max-w-none leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{tieredHints[2].content}</ReactMarkdown>
                  </div>
                  {tieredHints[2].keyTakeaway && (
                    <div className="mt-2.5 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-2 text-purple-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-snug"><strong className="text-purple-300">Edge Case Checklist:</strong> {tieredHints[2].keyTakeaway}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Tier 3: Edge Cases & Structural Logic</h4>
                      <p className="text-[10px] text-zinc-500">Corner cases, boundaries & pseudo-steps</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUnlockedTier(3)}
                    disabled={unlockedTier < 2}
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                      unlockedTier < 2
                        ? "bg-zinc-800/80 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer"
                    }`}
                  >
                    <Unlock className="h-3 w-3" /> {unlockedTier < 2 ? "Unlock Tier 2 First" : "Unlock Tier 3 (Final)"}
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* Loading state if hints are currently generating */}
        {hintLoading && !tieredHints && (
          <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span>Analyzing problem constraints and student code with Gemini...</span>
          </div>
        )}

        {aiVerdict && (
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2 text-xs relative font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <span className="font-bold uppercase tracking-wider text-[10px] text-purple-400 flex items-center gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5" /> Complexity Profile
              </span>
              <button onClick={() => setAiVerdict(null)} className="text-purple-400/70 hover:text-purple-200 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex gap-6 border-b border-purple-500/10 pb-2">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold font-mono">Estimated Runtime</span>
                <strong className="text-purple-300 font-mono font-bold text-sm">{aiVerdict.time}</strong>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold font-mono">Memory Space</span>
                <strong className="text-purple-300 font-mono font-bold text-sm">{aiVerdict.space}</strong>
              </div>
            </div>
            <p className="text-zinc-200 text-xs leading-relaxed">{aiVerdict.summary}</p>
          </div>
        )}
      </div>

      <div onMouseDown={() => { isResizingWidthRef.current = true; }} className="w-1 h-[calc(100vh-3.5rem)] bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ew-resize relative z-50" />

      {/* RIGHT PANE */}
      <div ref={rightPaneRef} style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className={`h-12 border-b px-4 flex items-center justify-between ${styling.headerBg} ${styling.border}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-zinc-500" />
              <select value={selectedLang} onChange={(e) => handleLanguageChange(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono font-bold py-1 px-2.5 text-zinc-300 outline-none cursor-pointer">
                <option value="python3">Python 3.11</option>
                <option value="cpp17">C++ 17 (GCC)</option>
                <option value="java17">Java 17 (OpenJDK)</option>
                <option value="javascript">JavaScript (Node20)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!tieredHints) {
                  getTieredHints();
                } else {
                  setShowTieredHints(prev => !prev);
                }
              }}
              disabled={hintLoading}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-lg font-medium cursor-pointer transition-colors ${
                showTieredHints && tieredHints
                  ? "border-amber-500 bg-amber-500/20 text-amber-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              {hintLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              ) : (
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              )}
              {tieredHints ? `Hints (${unlockedTier}/3)` : "Tiered Hints"}
            </button>
            <button
              onClick={askAI}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 rounded-lg font-medium cursor-pointer transition-colors"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" /> : <Sparkles className="h-3.5 w-3.5 text-purple-400" />}
              Ask AI
            </button>
            <button onClick={handleRunCodeAction} disabled={executing || submitting} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold py-1.5 px-3 text-zinc-300 cursor-pointer">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" /> : <Play className="h-3.5 w-3.5 fill-current text-zinc-400" />} Run Code
            </button>
            <button onClick={handleSubmitCodeAction} disabled={executing || submitting} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold py-1.5 px-3.5 text-white cursor-pointer shadow-md shadow-indigo-600/20">
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Send className="h-3.5 w-3.5 text-white" />} Submit
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#1e1e1e]">
          <Editor height="100%" theme={styling.editorTheme} language={getEditorLanguageType(selectedLang)} value={editorCode} onChange={(val) => setEditorCode(val || "")} options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }} />
        </div>

        <div onMouseDown={() => { isResizingHeightRef.current = true; }} className="h-1 w-full bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ns-resize relative z-50" />

        {/* BOTTOM CONSOLE */}
        <div style={{ height: `${consoleHeight}px` }} className={`flex flex-col font-mono text-xs border-t ${styling.border} ${styling.panel}`}>
          <div className={`flex border-b h-9 px-4 text-[10px] uppercase font-bold tracking-wider text-zinc-500 ${styling.border} ${styling.headerBg}`}>
            <button onClick={() => setConsoleTab("testcase")} className={`h-full border-b-2 px-3 cursor-pointer ${consoleTab === "testcase" ? styling.tabActive : "border-transparent"}`}>TestCase</button>
            <button onClick={() => setConsoleTab("result")} className={`h-full border-b-2 px-3 cursor-pointer ${consoleTab === "result" ? styling.tabActive : "border-transparent"}`}>Test Result</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {/* 📊 LEETCODE STYLE RESULT & HIDDEN TEST CASE RENDERER */}
            {submissionResult && consoleTab === "result" && (
              <div className={`p-4 rounded-xl border mb-4 font-sans ${submissionResult.verdict === "ACCEPTED" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {submissionResult.verdict === "ACCEPTED" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    <span>{submissionResult.verdict.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                    {submissionResult.executionTimeMs}ms
                  </span>
                </div>

                <div className="text-xs font-medium text-zinc-300 mt-2 space-y-1">
                  <div>
                    Passed <strong className="text-white">{submissionResult.passedCases}</strong> / {submissionResult.totalCases} Total Test Cases
                    {submissionResult.sampleCases && (
                      <span className="text-zinc-400 ml-2">
                        ({submissionResult.sampleCases.passed}/{submissionResult.sampleCases.total} Sample, {submissionResult.hiddenCases?.passed || 0}/{submissionResult.hiddenCases?.total || 0} Hidden)
                      </span>
                    )}
                  </div>
                  {submissionResult.failedCase && (
                    <div className="text-rose-400 font-semibold text-xs flex items-center gap-1.5 mt-1">
                      <span>Failed on:</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-[11px] font-mono">
                        {submissionResult.failedCase.caseType} #{submissionResult.failedCase.caseIndex} (Test Case {submissionResult.failedCase.orderNo} of {submissionResult.totalCases})
                      </span>
                    </div>
                  )}
                </div>

                {/* 🔍 LEETCODE STYLE FAILING TEST CASE INSPECTOR */}
                {submissionResult.failedCase && (
                  <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 font-mono text-xs space-y-2.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-b border-zinc-850 pb-1 flex items-center justify-between">
                      <span>Failed Test Case Details</span>
                      <span className="text-rose-400">{submissionResult.failedCase.verdict}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Input:</span>
                      <pre className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs whitespace-pre-wrap">{submissionResult.failedCase.input}</pre>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Your Output:</span>
                        <pre className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 font-bold text-xs whitespace-pre-wrap">{submissionResult.failedCase.actualOutput}</pre>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Expected Output:</span>
                        <pre className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 font-bold text-xs whitespace-pre-wrap">{submissionResult.failedCase.expectedOutput}</pre>
                      </div>
                    </div>

                    {submissionResult.failedCase.error && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Error Message:</span>
                        <pre className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs whitespace-pre-wrap">{submissionResult.failedCase.error}</pre>
                      </div>
                    )}

                    {/* 💡 ASK AI: WHY DID MY CODE FAIL? BUTTON */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col gap-2 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">Stuck? Let AI diagnose why your code failed this test case.</span>
                        <button
                          onClick={handleDiagnoseFailure}
                          disabled={diagnosing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-semibold text-xs shadow-md shadow-purple-900/30 cursor-pointer transition-all"
                        >
                          {diagnosing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" /> : <Sparkles className="h-3.5 w-3.5 text-white" />}
                          Ask AI: Why Did It Fail?
                        </button>
                      </div>

                      {diagnosis && (
                        <div className="p-3.5 rounded-xl border border-purple-500/40 bg-zinc-950 text-xs font-sans space-y-2.5 mt-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                            <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                              <Sparkles className="h-4 w-4 text-purple-400" />
                              AI Failure Diagnosis & Approach Fix
                            </span>
                            <button onClick={() => setDiagnosis(null)} className="text-purple-400 hover:text-purple-200 cursor-pointer">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold text-rose-300 block">Root Cause:</span>
                            <p className="text-zinc-200 text-xs leading-relaxed mt-0.5">{diagnosis.rootCause}</p>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold text-amber-300 block">Execution Trace on Failing Input:</span>
                            <div className="text-zinc-300 text-xs leading-relaxed mt-0.5 whitespace-pre-wrap">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosis.traceExplanation}</ReactMarkdown>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold text-sky-300 block">How to Fix (Algorithmic Guidance):</span>
                            <div className="text-zinc-200 text-xs leading-relaxed mt-0.5 whitespace-pre-wrap">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosis.howToFix}</ReactMarkdown>
                            </div>
                          </div>

                          {diagnosis.suggestedInvariant && (
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-2 text-purple-200">
                              <Lightbulb className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                              <p className="text-xs leading-snug"><strong className="text-purple-300">Guiding Invariant:</strong> {diagnosis.suggestedInvariant}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 border-b border-zinc-500/10 pb-2.5 mb-4 select-none">
              {testCases.map((tc, idx) => (
                <button key={tc.id} onClick={() => { setActiveCaseIdx(idx); }} className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 relative group ${activeCaseIdx === idx ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-zinc-900/30 border-zinc-900/80 text-zinc-400"}`}>
                  {tc.status === "ACCEPTED" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  {tc.status === "WRONG_ANSWER" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  {tc.status === "ERROR" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  {tc.label}
                  {testCases.length > 1 && ( <X onClick={(e) => { e.stopPropagation(); setTestCases(testCases.filter(t => t.id !== tc.id).map((t, i) => ({ ...t, label: `Case ${i + 1}` }))); setActiveCaseIdx(0); }} className="h-3 w-3 ml-1 text-zinc-500 hover:text-rose-400 cursor-pointer" /> )}
                </button>
              ))}
              <button onClick={handleCreateCustomTestCase} className="p-1 rounded-md border border-zinc-800 bg-zinc-900/20 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 cursor-pointer"><Plus className="h-3 w-3" /></button>
            </div>

            {consoleTab === "testcase" ? (
              <div className="space-y-3">
                {currentCase?.inputs.map((inp, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${styling.textMuted}`}>{inp.name} =</span>
                    <textarea rows={2} value={inp.value} onChange={(e) => { const newVal = e.target.value; setTestCases(prev => prev.map((tc, cIdx) => cIdx === activeCaseIdx ? { ...tc, inputs: tc.inputs.map((i, iIdx) => iIdx === idx ? { ...i, value: newVal } : i), status: "PENDING", actualOutput: "", stdout: "" } : tc)); }} className={`w-full border rounded-lg px-2.5 py-1 text-xs outline-none font-mono ${styling.inputBg}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {currentCase?.status === "PENDING" && currentCase.actualOutput === "" && !submissionResult ? (
                  <p className={`italic ${styling.textMuted}`}>Click "Run Code" or "Submit" to evaluate output.</p>
                ) : (
                  <div className="space-y-3 text-[11px]">
                    {currentCase?.error ? <pre className="bg-red-500/5 border border-red-500/10 text-rose-400 rounded-xl p-3 whitespace-pre-wrap leading-relaxed font-mono">{currentCase.error}</pre> : (
                      <div className="space-y-2.5">
                        {currentCase?.stdout && ( <div><span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>Stdout</span><pre className="bg-zinc-900/40 border border-zinc-900 rounded-lg px-2 py-1 text-emerald-400 font-medium inline-block min-w-xs">{currentCase.stdout}</pre></div> )}
                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                          <div><span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>Output</span><pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-bold">{currentCase?.actualOutput}</pre></div>
                          <div><span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>Expected</span><pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-zinc-400 font-bold">{currentCase?.expected}</pre></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}