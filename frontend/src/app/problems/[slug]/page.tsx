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
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Lock,
  Unlock,
  RefreshCw,
  FileText,
  Cpu,
  ArrowRight,
  Eye
} from "lucide-react";
import { TieredHintItem, FailedTestCaseDetail, FailureDiagnosis } from "@/types";
import ProfilerCanvas, { VisualStepData } from "@/components/visualizer/ProfilerCanvas";

interface ProblemDetail {
  id: string;
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraintsText: string;
  difficulty: string;
  inputTemplate: string;
  testCases: { input: string; expectedOutput: string }[];
}

interface TestCaseMetrics {
  id: number;
  label: string;
  inputs: { name: string; value: string }[];
  expected: string;
  stdout: string;
  actualOutput: string;
  error: string | null;
  status: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "ERROR";
  isCustom?: boolean;
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
  "vs-dark": {
    bg: "bg-[#1e1e1e] text-[#d4d4d4]",
    panel: "bg-[#252526]",
    border: "border-[#3c3c3c]",
    headerBg: "bg-[#2d2d2d]",
    textMain: "text-[#ffffff]",
    textMuted: "text-[#a9a9a9]",
    inputBg: "bg-[#3c3c3c] border-[#6b6b6b] text-white focus:border-[#007acc]",
    tabActive: "border-[#007acc] text-white bg-[#1e1e1e]",
    editorTheme: "vs-dark"
  }
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

  // Left Pane Navigation Tab: 'statement' | 'hints' | 'complexity'
  const [leftPaneTab, setLeftPaneTab] = useState<"statement" | "hints" | "complexity">("statement");

  // Tiered Hints State
  const [hintLoading, setHintLoading] = useState(false);
  const [tieredHints, setTieredHints] = useState<TieredHintItem[] | null>(null);
  const [unlockedTier, setUnlockedTier] = useState<number>(1);

  // Complexity Analysis (Ask AI) State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<{ time: string; space: string; summary: string } | null>(null);

  // Failure Diagnosis State
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<FailureDiagnosis | null>(null);

  const activeTheme = "vs-dark";
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result" | "visualizer">("testcase");
  const [visualizing, setVisualizing] = useState(false);
  const [traceSteps, setTraceSteps] = useState<VisualStepData[]>([]);
  const [traceSummary, setTraceSummary] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCaseMetrics[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [leftWidth, setLeftWidth] = useState(42);
  const [consoleHeight, setConsoleHeight] = useState(270);
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
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
          try {
            parsedMap = typeof probData.inputTemplate === "string" ? JSON.parse(probData.inputTemplate) : probData.inputTemplate;
          } catch {
            parsedMap = { python3: probData.inputTemplate };
          }
          setTemplatesMap(parsedMap);
          setEditorCode(parsedMap[selectedLang] || parsedMap["python3"] || "");
          const parsedCases: TestCaseMetrics[] = (probData.testCases || []).map((tc: any, index: number) => ({
            id: index + 1,
            label: `Case ${index + 1}`,
            inputs: [{ name: "input", value: tc.input }],
            expected: tc.expectedOutput,
            stdout: "",
            actualOutput: "",
            error: null,
            status: "PENDING"
          }));
          setTestCases(parsedCases);
        }
      } catch (err) {
        console.error("Failed to load problem:", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchInitialProblemSchema();
  }, [slug]);

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    setEditorCode(templatesMap[newLang] || templatesMap["python3"] || "");
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingWidthRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        if (pct > 20 && pct < 80) setLeftWidth(pct);
      }
      if (isResizingHeightRef.current && rightPaneRef.current) {
        const rect = rightPaneRef.current.getBoundingClientRect();
        const h = rect.bottom - e.clientY;
        if (h > 100 && h < rect.height - 100) setConsoleHeight(h);
      }
    };
    const handleMouseUp = () => {
      isResizingWidthRef.current = false;
      isResizingHeightRef.current = false;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // --- AI ACTIONS ---

  const getTieredHints = async (forceRefresh = false) => {
    if (!problem || hintLoading) return;
    setHintLoading(true);
    setLeftPaneTab("hints");
    try {
      const res = await api.post(`/problems/${problem.id}/tiered-hints`, {
        sourceCode: editorCode,
        language: selectedLang
      });
      if (res.data?.tiers && Array.isArray(res.data.tiers)) {
        setTieredHints(res.data.tiers);
        if (forceRefresh) {
          setUnlockedTier((prev) => Math.max(prev, 1));
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
    setLeftPaneTab("complexity");
    try {
      const res = await api.post(`/problems/${problem.id}/verdict`, {
        sourceCode: editorCode,
        language: selectedLang
      });
      if (res.data) {
        setAiVerdict({
          time: res.data.timeComplexity || "O(N)",
          space: res.data.spaceComplexity || "O(1)",
          summary: res.data.analysis || "Algorithmic complexity estimate completed."
        });
      }
    } catch {
      setAiVerdict({ time: "O(N)", space: "O(1)", summary: "Linear scan analyzing input elements." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunCodeAction = async () => {
    setExecuting(true);
    setConsoleTab("result");
    setSubmissionResult(null);
    setDiagnosis(null);
    setTestCases((prev) =>
      prev.map((tc) => ({ ...tc, status: "PENDING", actualOutput: "Evaluating...", stdout: "", error: null }))
    );

    let firstFailedIndex = -1;
    const evaluatedOutputsList = await Promise.all(
      testCases.map(async (tc, index) => {
        const argumentToken = tc.inputs.map((i) => i.value).join("\n");
        try {
          const payload = { sourceCode: editorCode, language: selectedLang, customInput: argumentToken, problemId: problem?.id };
          const res = await api.post("/judge/run", payload);
          const parsedStdout = (res.data?.stdout || "").trim();
          const parsedOutput = (res.data?.output || "").trim();
          const parsedExpected = (res.data?.expected || "").trim();
          const parsedError = res.data?.error || null;
          let calculatedStatus: "ACCEPTED" | "WRONG_ANSWER" | "ERROR" = "ACCEPTED";
          if (parsedError) {
            calculatedStatus = "ERROR";
          } else if (!parsedOutput || parsedOutput.toLowerCase().replace(/\s+/g, "") !== parsedExpected.toLowerCase().replace(/\s+/g, "")) {
            calculatedStatus = "WRONG_ANSWER";
          }
          if (calculatedStatus !== "ACCEPTED" && firstFailedIndex === -1) {
            firstFailedIndex = index;
          }
          return {
            ...tc,
            stdout: parsedStdout,
            actualOutput: parsedOutput || "None",
            expected: parsedExpected || tc.expected,
            error: parsedError,
            status: calculatedStatus
          };
        } catch {
          if (firstFailedIndex === -1) firstFailedIndex = index;
          return { ...tc, error: "Sandbox execution error.", status: "ERROR" as const };
        }
      })
    );

    setTestCases(evaluatedOutputsList);
    if (firstFailedIndex !== -1) {
      setActiveCaseIdx(firstFailedIndex);
    }
    setExecuting(false);
  };

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

  const handleDiagnoseFailure = async (customContext?: FailedTestCaseDetail) => {
    if (!problem || diagnosing) return;
    setDiagnosing(true);

    let failureContextToUse: FailedTestCaseDetail | null = customContext || null;
    if (!failureContextToUse) {
      if (submissionResult?.failedCase) {
        failureContextToUse = submissionResult.failedCase;
      } else if (currentCase && (currentCase.status === "WRONG_ANSWER" || currentCase.status === "ERROR")) {
        failureContextToUse = {
          orderNo: currentCase.id,
          caseType: currentCase.isCustom ? "Custom" : "Sample",
          caseIndex: currentCase.id,
          isSample: currentCase.isCustom ? false : true,
          input: currentCase.inputs.map((i) => i.value).join("\n"),
          expectedOutput: currentCase.expected,
          actualOutput: currentCase.actualOutput || "None",
          verdict: currentCase.status,
          error: currentCase.error || undefined
        };
      } else {
        failureContextToUse = {
          orderNo: 1,
          caseType: "Sample",
          caseIndex: 1,
          isSample: true,
          input: testCases[0]?.inputs.map((i) => i.value).join("\n") || "",
          expectedOutput: testCases[0]?.expected || "",
          actualOutput: "Incorrect return value / execution divergence",
          verdict: "WRONG_ANSWER"
        };
      }
    }

    try {
      const res = await api.post(`/problems/${problem.id}/diagnose-failure`, {
        sourceCode: editorCode,
        language: selectedLang,
        failureContext: failureContextToUse
      });
      if (res.data?.diagnosis) {
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
    const blueprint = testCases[0];
    const nextId = testCases.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    setTestCases([
      ...testCases,
      {
        id: nextId,
        label: `Case ${nextId}`,
        inputs: blueprint ? blueprint.inputs.map((i) => ({ ...i })) : [{ name: "input", value: "" }],
        expected: "Run to verify",
        stdout: "",
        actualOutput: "",
        error: null,
        status: "PENDING",
        isCustom: true
      }
    ]);
    setActiveCaseIdx(testCases.length);
  };

  // --- VISUAL ALGORITHM EXECUTION PROFILER ACTIONS ---

  const handleVisualizerLineChange = (lineNumber: number) => {
    if (!editorRef.current || !monacoRef.current || !lineNumber) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: "bg-cyan-500/20 border-l-4 border-cyan-400 shadow-sm",
          glyphMarginClassName: "text-cyan-400 font-bold"
        }
      }
    ]);

    editor.revealLineInCenterIfOutsideViewport(lineNumber);
  };

  const handleVisualizeExecution = async () => {
    if (!problem || visualizing) return;
    setVisualizing(true);
    setConsoleTab("visualizer");
    if (consoleHeight < 360) {
      setConsoleHeight(380);
    }

    try {
      const activeTc = testCases[activeCaseIdx];
      const inputStr = activeTc ? activeTc.inputs.map((i) => i.value).join("\n") : "";

      const res = await api.post(`/problems/${problem.id}/trace`, {
        code: editorCode,
        language: selectedLang,
        input: inputStr
      });

      if (res.data?.success && res.data.data) {
        setTraceSteps(res.data.data.steps || []);
        setTraceSummary(res.data.data.summary || "");
      }
    } catch (err) {
      console.error("Visualizer execution error:", err);
    } finally {
      setVisualizing(false);
    }
  };

  const currentCase = testCases[activeCaseIdx];
  const styling = themesRegistry[activeTheme];

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-400 font-mono">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-400" />
        Loading problem workspace...
      </div>
    );

  return (
    <div ref={containerRef} className={`flex min-h-[calc(100vh-3.5rem)] w-full font-sans relative overflow-hidden ${styling.bg}`}>
      {/* ========================================================================= */}
      {/* LEFT PANE: DESCRIPTION / TIERED HINTS / COMPLEXITY PROFILE                */}
      {/* ========================================================================= */}
      <div
        style={{ width: `${leftWidth}%` }}
        className={`p-5 overflow-y-auto border-r flex flex-col gap-4 h-[calc(100vh-3.5rem)] ${styling.border} ${styling.panel}`}
      >
        {/* LEFT PANE TAB BAR */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setLeftPaneTab("statement")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              leftPaneTab === "statement"
                ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Problem</span>
          </button>

          <button
            onClick={() => {
              setLeftPaneTab("hints");
              if (!tieredHints && !hintLoading) getTieredHints();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              leftPaneTab === "hints"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Hints</span>
            {tieredHints && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/30 text-amber-200">
                {unlockedTier}/3
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setLeftPaneTab("complexity");
              if (!aiVerdict && !aiLoading) askAI();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              leftPaneTab === "complexity"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm"
                : "text-zinc-400 hover:text-purple-300 hover:bg-purple-500/10"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Complexity</span>
            {aiVerdict && (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-purple-500/30 text-purple-200">
                {aiVerdict.time}
              </span>
            )}
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: PROBLEM STATEMENT                                      */}
        {/* ------------------------------------------------------------- */}
        {leftPaneTab === "statement" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border uppercase ${
                  problem?.difficulty === "EASY"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : problem?.difficulty === "MEDIUM"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}
              >
                {problem?.difficulty}
              </span>
              <span className="text-xs text-zinc-500 font-mono">ID: #{problem?.id}</span>
            </div>

            <h1 className={`text-xl font-extrabold tracking-tight ${styling.textMain}`}>{problem?.title}</h1>

            <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mt-3 mb-1.5" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-3 mb-1" {...props} />,
                  p: ({ node, ...props }) => <div className="mb-3.5" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isMultiline = String(children).includes("\n");
                    if (match || isMultiline)
                      return (
                        <pre className="bg-[#18181b] p-3.5 rounded-xl overflow-x-auto text-[12px] font-mono border border-zinc-800 mb-3 shadow-inner text-zinc-200">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    return (
                      <code className="bg-zinc-800/80 text-indigo-300 px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-mono border border-zinc-700/50" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {problem?.statement}
              </ReactMarkdown>
            </div>

            {problem?.constraintsText && (
              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Constraints</h4>
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-300">
                  {problem.constraintsText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PROGRESSIVE TIERED HINTS                               */}
        {/* ------------------------------------------------------------- */}
        {leftPaneTab === "hints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-200 text-sm tracking-wide">Progressive AI Scaffolding</h3>
                  <p className="text-[11px] text-zinc-400">Step-by-step Socratic hints without giving direct code spoilers</p>
                </div>
              </div>

              <button
                onClick={() => getTieredHints(true)}
                disabled={hintLoading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${hintLoading ? "animate-spin" : ""}`} />
                <span>Re-Analyze Code</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Progress: Tier {unlockedTier} of 3 Unlocked</span>
                <span>{Math.round((unlockedTier / 3) * 100)}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 via-sky-500 to-purple-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(unlockedTier / 3) * 100}%` }}
                />
              </div>
            </div>

            {hintLoading && !tieredHints && (
              <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">Analyzing your code against problem invariants...</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Evaluating optimal asymptotic strategies and boundary edge cases.</p>
                </div>
              </div>
            )}

            {tieredHints && (
              <div className="space-y-3.5">
                {/* TIER 1 */}
                {tieredHints[0] && (
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-zinc-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Tier 1: {tieredHints[0].badge}
                        </span>
                        <span className="font-bold text-xs text-white">{tieredHints[0].title}</span>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-zinc-400 italic">{tieredHints[0].focus}</p>
                    <div className="prose prose-invert prose-xs text-zinc-200 max-w-none leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{tieredHints[0].content}</ReactMarkdown>
                    </div>
                    {tieredHints[0].keyTakeaway && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-amber-200">
                        <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-snug">
                          <strong className="text-amber-300">Observation Rule:</strong> {tieredHints[0].keyTakeaway}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TIER 2 */}
                {tieredHints[1] &&
                  (unlockedTier >= 2 ? (
                    <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 text-zinc-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            Tier 2: {tieredHints[1].badge}
                          </span>
                          <span className="font-bold text-xs text-white">{tieredHints[1].title}</span>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-zinc-400 italic">{tieredHints[1].focus}</p>
                      <div className="prose prose-invert prose-xs text-zinc-200 max-w-none leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{tieredHints[1].content}</ReactMarkdown>
                      </div>
                      {tieredHints[1].keyTakeaway && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-start gap-2 text-sky-200">
                          <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-snug">
                            <strong className="text-sky-300">Optimal Strategy:</strong> {tieredHints[1].keyTakeaway}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-300">Tier 2: Algorithmic Strategy</h4>
                          <p className="text-[10px] text-zinc-500">Optimal data structures &amp; complexity trade-offs</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUnlockedTier(2)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-all cursor-pointer"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Unlock Tier 2</span>
                      </button>
                    </div>
                  ))}

                {/* TIER 3 */}
                {tieredHints[2] &&
                  (unlockedTier >= 3 ? (
                    <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-zinc-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Tier 3: {tieredHints[2].badge}
                          </span>
                          <span className="font-bold text-xs text-white">{tieredHints[2].title}</span>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      </div>
                      <p className="text-[11px] text-zinc-400 italic">{tieredHints[2].focus}</p>
                      <div className="prose prose-invert prose-xs text-zinc-200 max-w-none leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{tieredHints[2].content}</ReactMarkdown>
                      </div>
                      {tieredHints[2].keyTakeaway && (
                        <div className="mt-2.5 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-2 text-purple-200">
                          <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-snug">
                            <strong className="text-purple-300">Edge Case Checklist:</strong> {tieredHints[2].keyTakeaway}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-300">Tier 3: Edge Cases &amp; Structural Logic</h4>
                          <p className="text-[10px] text-zinc-500">Corner cases, boundaries &amp; pseudo-steps</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setUnlockedTier(3)}
                        disabled={unlockedTier < 2}
                        className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                          unlockedTier < 2
                            ? "bg-zinc-800/80 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer"
                        }`}
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        <span>{unlockedTier < 2 ? "Unlock Tier 2 First" : "Unlock Tier 3 (Final)"}</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {!hintLoading && !tieredHints && (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl p-6">
                <Lightbulb className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-zinc-200">No Hints Generated Yet</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Click below to let Gemini analyze your current code implementation and provide 3 progressive scaffolding tiers.
                </p>
                <button
                  onClick={() => getTieredHints(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Progressive Hints</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: BIG-O COMPLEXITY ANALYSIS (ASK AI)                     */}
        {/* ------------------------------------------------------------- */}
        {leftPaneTab === "complexity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-200 text-sm tracking-wide">Big-O Complexity Profile</h3>
                  <p className="text-[11px] text-zinc-400">Instant AI architectural verdict on time and space scaling</p>
                </div>
              </div>

              <button
                onClick={askAI}
                disabled={aiLoading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-semibold cursor-pointer transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                <span>Re-Analyze</span>
              </button>
            </div>

            {aiLoading && (
              <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-950/20 text-xs text-purple-200 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400 shrink-0" />
                <div>
                  <p className="font-bold">Evaluating loop structures and memory allocation...</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Calculating worst-case asymptotic bounds.</p>
                </div>
              </div>
            )}

            {aiVerdict && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-purple-500/30 bg-zinc-950">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold font-mono">Time Complexity</span>
                    <strong className="text-purple-300 font-mono font-extrabold text-2xl mt-1 block">{aiVerdict.time}</strong>
                    <span className="text-[10px] text-zinc-400 mt-1 block">Worst-case runtime growth</span>
                  </div>

                  <div className="p-4 rounded-xl border border-purple-500/30 bg-zinc-950">
                    <span className="text-zinc-500 block text-[10px] uppercase font-bold font-mono">Space Complexity</span>
                    <strong className="text-purple-300 font-mono font-extrabold text-2xl mt-1 block">{aiVerdict.space}</strong>
                    <span className="text-[10px] text-zinc-400 mt-1 block">Auxiliary heap/stack memory</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold font-mono">Architectural Critique</span>
                  <p className="text-zinc-200 text-xs leading-relaxed">{aiVerdict.summary}</p>
                </div>
              </div>
            )}

            {!aiLoading && !aiVerdict && (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl p-6">
                <Cpu className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-zinc-200">No Complexity Profile Evaluated</h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Click below to let AI compute the Big-O Time and Space complexity of your current code.
                </p>
                <button
                  onClick={askAI}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Complexity Profile</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HORIZONTAL RESIZER */}
      <div
        onMouseDown={() => {
          isResizingWidthRef.current = true;
        }}
        className="w-1 h-[calc(100vh-3.5rem)] bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ew-resize relative z-50 transition-colors"
      />

      {/* ========================================================================= */}
      {/* RIGHT PANE: CODE EDITOR & CONSOLE                                         */}
      {/* ========================================================================= */}
      <div ref={rightPaneRef} style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* EDITOR TOP TOOLBAR */}
        <div className={`h-12 border-b px-4 flex items-center justify-between ${styling.headerBg} ${styling.border}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-zinc-500" />
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono font-bold py-1 px-2.5 text-zinc-300 outline-none cursor-pointer"
              >
                <option value="python3">Python 3.11</option>
                <option value="cpp17">C++ 17 (GCC)</option>
                <option value="java17">Java 17 (OpenJDK)</option>
                <option value="javascript">JavaScript (Node20)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TIERED HINTS BUTTON */}
            <button
              onClick={() => {
                if (leftPaneTab === "hints" && tieredHints) {
                  setLeftPaneTab("statement");
                } else {
                  getTieredHints();
                }
              }}
              disabled={hintLoading}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-lg font-bold cursor-pointer transition-colors ${
                leftPaneTab === "hints"
                  ? "border-amber-500 bg-amber-500/20 text-amber-200"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              {hintLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              ) : (
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>{tieredHints ? `Hints (${unlockedTier}/3)` : "Tiered Hints"}</span>
            </button>

            {/* ASK AI (COMPLEXITY) BUTTON */}
            <button
              onClick={() => {
                if (leftPaneTab === "complexity" && aiVerdict) {
                  setLeftPaneTab("statement");
                } else {
                  askAI();
                }
              }}
              disabled={aiLoading}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-lg font-bold cursor-pointer transition-colors ${
                leftPaneTab === "complexity"
                  ? "border-purple-500 bg-purple-500/20 text-purple-200"
                  : "border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
              }`}
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              )}
              <span>Ask AI</span>
            </button>

            {/* VISUALIZE EXECUTION BUTTON */}
            <button
              onClick={handleVisualizeExecution}
              disabled={visualizing || executing || submitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-950/70 to-indigo-950/70 hover:from-cyan-900/70 hover:to-indigo-900/70 text-xs font-bold py-1.5 px-3 text-cyan-300 shadow-md shadow-cyan-950/50 hover:shadow-cyan-500/20 cursor-pointer transition-all disabled:opacity-50"
              title="Visualize step-by-step algorithm execution and pointer animations"
            >
              {visualizing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              )}
              <span>Visualize</span>
            </button>

            {/* RUN CODE BUTTON */}
            <button
              onClick={handleRunCodeAction}
              disabled={executing || submitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-xs font-bold py-1.5 px-3 text-zinc-200 cursor-pointer transition-colors"
            >
              {executing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
              )}
              <span>Run Code</span>
            </button>

            {/* SUBMIT BUTTON */}
            <button
              onClick={handleSubmitCodeAction}
              disabled={executing || submitting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold py-1.5 px-3.5 text-white cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <Send className="h-3.5 w-3.5 text-white" />
              )}
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* MONACO CODE EDITOR */}
        <div className="flex-1 min-h-0 bg-[#1e1e1e]">
          <Editor
            height="100%"
            theme={styling.editorTheme}
            language={getEditorLanguageType(selectedLang)}
            value={editorCode}
            onChange={(val) => setEditorCode(val || "")}
            onMount={(editor, monaco) => {
              editorRef.current = editor;
              monacoRef.current = monaco;
            }}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 4,
              glyphMargin: true
            }}
          />
        </div>

        {/* VERTICAL RESIZER */}
        <div
          onMouseDown={() => {
            isResizingHeightRef.current = true;
          }}
          className="h-1 w-full bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ns-resize relative z-50 transition-colors"
        />

        {/* ========================================================================= */}
        {/* BOTTOM CONSOLE: TESTCASE / TEST RESULT & AI FAILURE DIAGNOSIS             */}
        {/* ========================================================================= */}
        <div style={{ height: `${consoleHeight}px` }} className={`flex flex-col font-mono text-xs border-t ${styling.border} ${styling.panel}`}>
          {/* CONSOLE TABS */}
          <div className={`flex items-center justify-between border-b h-9 px-4 text-[10px] uppercase font-bold tracking-wider text-zinc-500 ${styling.border} ${styling.headerBg}`}>
            <div className="flex h-full">
              <button
                onClick={() => setConsoleTab("testcase")}
                className={`h-full border-b-2 px-3.5 cursor-pointer flex items-center gap-1.5 ${
                  consoleTab === "testcase" ? styling.tabActive : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span>TestCase</span>
              </button>

              <button
                onClick={() => setConsoleTab("result")}
                className={`h-full border-b-2 px-3.5 cursor-pointer flex items-center gap-1.5 ${
                  consoleTab === "result" ? styling.tabActive : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span>Test Result</span>
                {submissionResult && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      submissionResult.verdict === "ACCEPTED" ? "bg-emerald-400" : "bg-rose-500"
                    }`}
                  />
                )}
              </button>

              <button
                onClick={() => setConsoleTab("visualizer")}
                className={`h-full border-b-2 px-3.5 cursor-pointer flex items-center gap-1.5 ${
                  consoleTab === "visualizer"
                    ? "border-cyan-400 text-cyan-300 font-bold"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visualizer</span>
                {traceSteps.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {traceSteps.length}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Status Pill */}
            {submissionResult && consoleTab === "result" && (
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                  submissionResult.verdict === "ACCEPTED"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                }`}
              >
                {submissionResult.verdict.replace(/_/g, " ")}
              </span>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {/* ------------------------------------------------------------- */}
            {/* SUBMISSION VERDICT SUMMARY (IF SUBMISSION RESULT EXISTS)       */}
            {/* ------------------------------------------------------------- */}
            {submissionResult && consoleTab === "result" && (
              <div
                className={`p-4 rounded-xl border mb-4 font-sans ${
                  submissionResult.verdict === "ACCEPTED"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {submissionResult.verdict === "ACCEPTED" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
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
                        ({submissionResult.sampleCases.passed}/{submissionResult.sampleCases.total} Sample,{" "}
                        {submissionResult.hiddenCases?.passed || 0}/{submissionResult.hiddenCases?.total || 0} Hidden)
                      </span>
                    )}
                  </div>
                  {submissionResult.failedCase && (
                    <div className="text-rose-400 font-semibold text-xs flex items-center gap-1.5 mt-1">
                      <span>Failed on:</span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-[11px] font-mono">
                        {submissionResult.failedCase.caseType} #{submissionResult.failedCase.caseIndex} (Test Case{" "}
                        {submissionResult.failedCase.orderNo} of {submissionResult.totalCases})
                      </span>
                    </div>
                  )}
                </div>

                {/* LEETCODE STYLE FAILING TEST CASE INSPECTOR ON SUBMIT */}
                {submissionResult.failedCase && (
                  <div className="mt-3.5 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 font-mono text-xs space-y-2.5">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 border-b border-zinc-850 pb-1 flex items-center justify-between">
                      <span>Failed Test Case Details</span>
                      <span className="text-rose-400">{submissionResult.failedCase.verdict}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Input:</span>
                      <pre className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs whitespace-pre-wrap">
                        {submissionResult.failedCase.input}
                      </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">Your Output:</span>
                        <pre className="p-2 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 font-bold text-xs whitespace-pre-wrap">
                          {submissionResult.failedCase.actualOutput}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Expected Output:</span>
                        <pre className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-300 font-bold text-xs whitespace-pre-wrap">
                          {submissionResult.failedCase.expectedOutput}
                        </pre>
                      </div>
                    </div>

                    {submissionResult.failedCase.error && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">Error Message:</span>
                        <pre className="p-2 rounded-lg bg-amber-950/30 border border-amber-900/50 text-amber-300 text-xs whitespace-pre-wrap">
                          {submissionResult.failedCase.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TEST CASE SELECTOR PILLS */}
            <div className="flex items-center gap-2 border-b border-zinc-500/10 pb-2.5 mb-4 select-none">
              {testCases.map((tc, idx) => (
                <button
                  key={tc.id}
                  onClick={() => {
                    setActiveCaseIdx(idx);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 relative group cursor-pointer ${
                    activeCaseIdx === idx ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-zinc-900/30 border-zinc-900/80 text-zinc-400"
                  }`}
                >
                  {tc.status === "ACCEPTED" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  {tc.status === "WRONG_ANSWER" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  {tc.status === "ERROR" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  {tc.label}
                  {testCases.length > 1 && (
                    <X
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestCases(testCases.filter((t) => t.id !== tc.id).map((t, i) => ({ ...t, label: `Case ${i + 1}` })));
                        setActiveCaseIdx(0);
                      }}
                      className="h-3 w-3 ml-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                    />
                  )}
                </button>
              ))}
              <button
                onClick={handleCreateCustomTestCase}
                className="p-1 rounded-md border border-zinc-800 bg-zinc-900/20 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CONSOLE VIEW: TEST CASE INPUTS                                */}
            {/* ------------------------------------------------------------- */}
            {consoleTab === "testcase" ? (
              <div className="space-y-3">
                {currentCase?.inputs.map((inp, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${styling.textMuted}`}>{inp.name} =</span>
                    <textarea
                      rows={2}
                      value={inp.value}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setTestCases((prev) =>
                          prev.map((tc, cIdx) =>
                            cIdx === activeCaseIdx
                              ? {
                                  ...tc,
                                  inputs: tc.inputs.map((i, iIdx) => (iIdx === idx ? { ...i, value: newVal } : i)),
                                  status: "PENDING",
                                  actualOutput: "",
                                  stdout: ""
                                }
                              : tc
                          )
                        );
                      }}
                      className={`w-full border rounded-lg px-2.5 py-1 text-xs outline-none font-mono ${styling.inputBg}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* ------------------------------------------------------------- */
              /* CONSOLE VIEW: TEST RESULT (RUN CODE OR SUBMIT)               */
              /* ------------------------------------------------------------- */
              <div className="space-y-3 text-[11px]">
                {currentCase?.status === "PENDING" && currentCase.actualOutput === "" && !submissionResult ? (
                  <p className={`italic ${styling.textMuted}`}>Click "Run Code" or "Submit" to evaluate output.</p>
                ) : (
                  <div className="space-y-3">
                    {/* RUN CODE RESULT CARD */}
                    {currentCase?.error ? (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-rose-400 block font-sans">
                          Execution Error / Exception:
                        </span>
                        <pre className="bg-red-500/10 border border-red-500/20 text-rose-300 rounded-xl p-3 whitespace-pre-wrap leading-relaxed font-mono">
                          {currentCase.error}
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {currentCase?.stdout && (
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>
                              Stdout
                            </span>
                            <pre className="bg-zinc-900/40 border border-zinc-900 rounded-lg px-2 py-1 text-emerald-400 font-medium inline-block min-w-xs">
                              {currentCase.stdout}
                            </pre>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>
                              Output
                            </span>
                            <pre
                              className={`rounded-lg p-2 font-bold ${
                                currentCase?.status === "ACCEPTED"
                                  ? "bg-emerald-950/20 border border-emerald-900/40 text-emerald-300"
                                  : "bg-rose-950/20 border border-rose-900/40 text-rose-300"
                              }`}
                            >
                              {currentCase?.actualOutput}
                            </pre>
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>
                              Expected
                            </span>
                            <pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-zinc-400 font-bold">
                              {currentCase?.expected}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 💡 UNIVERSAL "ASK AI: WHY DID MY CODE FAIL?" ON ANY WRONG ANSWER OR ERROR */}
            {/* ========================================================================= */}
            {consoleTab === "result" &&
              (currentCase?.status === "WRONG_ANSWER" ||
                currentCase?.status === "ERROR" ||
                (submissionResult && submissionResult.verdict !== "ACCEPTED")) && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-zinc-950 border border-purple-500/40 space-y-3 font-sans shadow-xl shadow-purple-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-purple-200">
                          {currentCase?.status === "ERROR" || submissionResult?.verdict.includes("ERROR")
                            ? "Runtime Execution Exception Encountered"
                            : "Wrong Answer: Output Diverged on Test Case"}
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          AI will analyze what is wrong in the code, trace the execution, and show how to fix it without giving direct copy-paste code.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDiagnoseFailure()}
                      disabled={diagnosing}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/40 cursor-pointer transition-all disabled:opacity-50 shrink-0"
                    >
                      {diagnosing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                          <span>Diagnosing Failure...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                          <span>✨ Ask AI: Why Did My Code Fail?</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* FAILURE DIAGNOSIS REPORT */}
                  {diagnosis && (
                    <div className="p-4 rounded-xl border border-purple-500/40 bg-zinc-950 text-xs font-sans space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
                        <span className="font-bold text-purple-300 flex items-center gap-2 text-xs">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                          AI Failure Diagnosis &amp; Pedagogical Fix
                        </span>
                        <button
                          onClick={() => setDiagnosis(null)}
                          className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl">
                        <span className="text-[10px] uppercase font-mono font-bold text-rose-300 block mb-1">
                          1. What is Wrong (Root Cause):
                        </span>
                        <p className="text-zinc-200 text-xs leading-relaxed">{diagnosis.rootCause}</p>
                      </div>

                      <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-300 block mb-1">
                          2. Why It Failed (Trace Walkthrough on this Input):
                        </span>
                        <div className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosis.traceExplanation}</ReactMarkdown>
                        </div>
                      </div>

                      <div className="bg-sky-950/20 border border-sky-500/30 p-3 rounded-xl">
                        <span className="text-[10px] uppercase font-mono font-bold text-sky-300 block mb-1">
                          3. How to Approach the Correct Solution:
                        </span>
                        <div className="text-zinc-200 text-xs leading-relaxed whitespace-pre-wrap">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosis.howToFix}</ReactMarkdown>
                        </div>
                      </div>

                      {diagnosis.suggestedInvariant && (
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-2 text-purple-200">
                          <Lightbulb className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                          <p className="text-xs leading-snug">
                            <strong className="text-purple-300">Guiding Invariant:</strong> {diagnosis.suggestedInvariant}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* ========================================================================= */}
            {/* 🎬 VISUAL ALGORITHM EXECUTION PROFILER PANEL                              */}
            {/* ========================================================================= */}
            {consoleTab === "visualizer" && (
              <div className="space-y-4 font-sans">
                {visualizing ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-zinc-200">Evaluating Visual Trace...</h4>
                      <p className="text-xs text-zinc-500">
                        Analyzing line-by-line pointer trajectories, stack frames, and memory bounds.
                      </p>
                    </div>
                  </div>
                ) : traceSteps.length > 0 ? (
                  <ProfilerCanvas
                    steps={traceSteps}
                    summary={traceSummary}
                    onActiveLineChange={handleVisualizerLineChange}
                  />
                ) : (
                  <div className="py-10 text-center border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/40">
                    <Eye className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                    <h4 className="text-sm font-bold text-zinc-200">Execution Profiler Inactive</h4>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Click the glowing <strong className="text-cyan-300">Visualize</strong> button in the top toolbar to trace your code against the active test case.
                    </p>
                    <button
                      onClick={handleVisualizeExecution}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950/50 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Trace &amp; Visualize Now</span>
                    </button>
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