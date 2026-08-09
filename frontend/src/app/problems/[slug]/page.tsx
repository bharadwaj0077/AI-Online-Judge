"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Editor from "@monaco-editor/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Send, Loader2, Code2, Plus, HelpCircle, Sparkles, X, CheckCircle2, AlertTriangle } from "lucide-react";

interface ProblemDetail {
  id: string; title: string; statement: string; inputFormat: string; outputFormat: string; constraintsText: string; difficulty: string; inputTemplate: string;
  testCases: { input: string; expectedOutput: string }[];
}

interface TestCaseMetrics {
  id: number; label: string; inputs: { name: string; value: string }[]; expected: string; stdout: string; actualOutput: string; error: string | null; status: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "ERROR"; isCustom?: boolean;
}

interface SubmissionResult {
  verdict: string; score: number; executionTimeMs: number; 
  passedCases: number; totalCases: number; 
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
  const [aiHint, setAiHint] = useState<string | null>(null);
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

  const getHint = async () => {
    if (!problem) return; setAiHint(null);
    try { const res = await api.post(`/problems/${problem.id}/hint`, { sourceCode: editorCode, language: selectedLang }); if (res.data?.success) setAiHint(res.data.hint); } 
    catch { setAiHint("Consider optimizing your loops or using a hash map to achieve better time complexity."); }
  };

  const askAI = async () => {
    if (!problem) return; setAiVerdict(null);
    try { const res = await api.post(`/problems/${problem.id}/verdict`, { sourceCode: editorCode, language: selectedLang }); if (res.data?.success) setAiVerdict({ time: res.data.timeComplexity, space: res.data.spaceComplexity, summary: res.data.analysis }); } 
    catch { setAiVerdict({ time: "O(N)", space: "O(N)", summary: "Linear time solution using additional space." }); }
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

  const handleSubmitCodeAction = async () => {
    if (!problem) return; setSubmitting(true); setConsoleTab("result");
    try {
      const res = await api.post("/judge/submit", { sourceCode: editorCode, language: selectedLang, problemId: problem.id });
      if (res.data?.success) {
        setSubmissionResult({ 
          verdict: res.data.verdict, 
          score: res.data.score, 
          executionTimeMs: res.data.executionTimeMs,
          passedCases: res.data.passedCases, 
          totalCases: res.data.totalCases
        });
      }
    } catch { alert("Submission error. Verify session credentials."); } finally { setSubmitting(false); }
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

        {aiHint && <div className="p-3.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-yellow-500 font-mono leading-relaxed">{aiHint}</div>}
        {aiVerdict && (
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2 font-mono text-xs">
            <div className="flex gap-4 border-b border-purple-500/10 pb-2">
              <div><span className="text-zinc-500 block text-[9px] uppercase font-bold">Runtime</span><strong className="text-purple-400 font-bold">{aiVerdict.time}</strong></div>
              <div><span className="text-zinc-500 block text-[9px] uppercase font-bold">Memory</span><strong className="text-purple-400 font-bold">{aiVerdict.space}</strong></div>
            </div>
            <p className="text-zinc-300 text-xs">{aiVerdict.summary}</p>
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
            <button onClick={getHint} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900/40 text-yellow-500/90 hover:bg-zinc-800 rounded-lg font-medium cursor-pointer"><HelpCircle className="h-3.5 w-3.5" /> Get Hint</button>
            <button onClick={askAI} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 border border-zinc-800 bg-zinc-900/40 text-purple-400 hover:bg-zinc-800 rounded-lg font-medium cursor-pointer"><Sparkles className="h-3.5 w-3.5" /> Ask AI</button>
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
            {/* 📊 CLEANED UP RESULT RENDERER */}
            {submissionResult && consoleTab === "result" && (
              <div className={`p-4 rounded-xl border mb-4 ${submissionResult.verdict === "ACCEPTED" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {submissionResult.verdict === "ACCEPTED" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  {submissionResult.verdict}
                </div>
                <div className="text-xs font-semibold text-zinc-400 mt-2">
                   Passed {submissionResult.passedCases} / {submissionResult.totalCases} Test Cases | Runtime: {submissionResult.executionTimeMs}ms | Score: {submissionResult.score} pts
                </div>
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