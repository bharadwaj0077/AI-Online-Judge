"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Editor from "@monaco-editor/react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Send, Loader2, Code2, Sparkles, CheckCircle2, AlertTriangle, Clock, ArrowLeft, X, Plus } from "lucide-react";

interface TestCaseMetrics {
  id: number; label: string; inputs: { name: string; value: string }[]; expected: string; stdout: string; actualOutput: string; error: string | null; status: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "ERROR"; isCustom?: boolean;
}

interface SubmissionResult {
  verdict: string; score: number; executionTimeMs: number; 
  passedCases: number; totalCases: number; 
}

function getEditorLanguageType(langSlug: string): string {
  const norm = langSlug.toLowerCase().trim();
  if (norm.includes("python")) return "python";
  if (norm.includes("javascript") || norm.includes("js")) return "javascript";
  if (norm.includes("java")) return "java";
  return "cpp";
}

export default function ContestArena() {
  const { id } = useParams();
  const router = useRouter();

  const [contest, setContest] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [selectedLang, setSelectedLanguage] = useState("python3");
  const [codeMap, setCodeMap] = useState<Record<string, string>>({}); 
  const [testCases, setTestCases] = useState<TestCaseMetrics[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [executing, setExecuting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [solvedSet, setSolvedSet] = useState<Set<string>>(new Set());

  const [leftWidth, setLeftWidth] = useState(45);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadContest = async () => {
      try {
        const res = await api.get(`/contests/${id}`);
        if (res.data?.success) {
          const c = res.data.data;
          setContest(c);
          setProblems(c.problems);
          
          const newCodeMap: Record<string, string> = {};
          c.problems.forEach((p: any) => {
            let tMap = {};
            try { tMap = typeof p.inputTemplate === "string" ? JSON.parse(p.inputTemplate) : p.inputTemplate; } catch {}
            newCodeMap[p.id] = (tMap as any)["python3"] || "";
          });
          setCodeMap(newCodeMap);
          if (c.problems.length > 0) loadProblemData(c.problems[0]);
        }
      } catch (err) { alert("Failed to load contest."); } finally { setLoading(false); }
    };
    if (id) loadContest();
  }, [id]);

  useEffect(() => {
    if (!contest) return;
    const interval = setInterval(() => {
      const remaining = new Date(contest.endTime).getTime() - Date.now();
      setTimeLeft(remaining > 0 ? remaining : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const loadProblemData = (prob: any) => {
    if (!prob) return;
    const parsedCases: TestCaseMetrics[] = (prob.testCases || []).map((tc: any, index: number) => ({
      id: index + 1, label: `Case ${index + 1}`, inputs: [{ name: "input", value: tc.input }], expected: tc.expectedOutput, stdout: "", actualOutput: "", error: null, status: "PENDING"
    }));
    setTestCases(parsedCases);
    setActiveCaseIdx(0);
    setConsoleTab("testcase");
    setSubmissionResult(null);
  };

  const handleProblemSwitch = (idx: number) => {
    setActiveProblemIdx(idx);
    loadProblemData(problems[idx]);
  };

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    const p = problems[activeProblemIdx];
    let tMap = {};
    try { tMap = typeof p.inputTemplate === "string" ? JSON.parse(p.inputTemplate) : p.inputTemplate; } catch {}
    setCodeMap(prev => ({ ...prev, [p.id]: (tMap as any)[newLang] || "" }));
  };

  const handleRunCodeAction = async () => {
    if (timeLeft === 0) return alert("Contest is over!");
    setExecuting(true); setConsoleTab("result"); setSubmissionResult(null);
    setTestCases(prev => prev.map(tc => ({ ...tc, status: "PENDING", actualOutput: "Evaluating...", stdout: "", error: null })));
    
    const p = problems[activeProblemIdx];
    const editorCode = codeMap[p.id];

    const evaluatedOutputsList = await Promise.all(testCases.map(async (tc) => {
      const argumentToken = tc.inputs.map(i => i.value).join("\n");
      try {
        const payload = { sourceCode: editorCode, language: selectedLang, customInput: argumentToken, problemId: p.id };
        const res = await api.post("/judge/run", payload);
        const parsedStdout = (res.data?.stdout || "").trim(), parsedOutput = (res.data?.output || "").trim(), parsedExpected = (res.data?.expected || "").trim(), parsedError = res.data?.error || null;
        let calculatedStatus: "ACCEPTED" | "WRONG_ANSWER" | "ERROR" = "ACCEPTED";
        if (parsedError) calculatedStatus = "ERROR"; else if (!parsedOutput || parsedOutput.toLowerCase().replace(/\s+/g, "") !== parsedExpected.toLowerCase().replace(/\s+/g, "")) calculatedStatus = "WRONG_ANSWER";
        return { ...tc, stdout: parsedStdout, actualOutput: parsedOutput || "None", expected: parsedExpected || tc.expected, error: parsedError, status: calculatedStatus };
      } catch { return { ...tc, error: "Sandbox error.", status: "ERROR" as const }; }
    }));
    setTestCases(evaluatedOutputsList); setExecuting(false);
  };

  const handleSubmitCodeAction = async () => {
    if (timeLeft === 0) return alert("Contest is over!");
    const p = problems[activeProblemIdx];
    setExecuting(true); setConsoleTab("result");
    try {
      const res = await api.post("/judge/submit", { sourceCode: codeMap[p.id], language: selectedLang, problemId: p.id });
      if (res.data?.success) {
        setSubmissionResult({ 
          verdict: res.data.verdict, 
          score: res.data.score, 
          executionTimeMs: res.data.executionTimeMs,
          passedCases: res.data.passedCases, 
          totalCases: res.data.totalCases
        });
        if (res.data.verdict === "ACCEPTED") {
            const newSet = new Set(solvedSet); newSet.add(p.id); setSolvedSet(newSet);
        }
      }
    } catch { alert("Submission error."); } finally { setExecuting(false); }
  };

  const handleCreateCustomTestCase = () => {
    if (testCases.length >= 5) return;
    const blueprint = testCases[0]; const nextId = testCases.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    setTestCases([...testCases, { id: nextId, label: `Case ${nextId}`, inputs: blueprint ? blueprint.inputs.map(i => ({ ...i })) : [{ name: "input", value: "" }], expected: "Run to verify", stdout: "", actualOutput: "", error: null, status: "PENDING", isCustom: true }]);
    setActiveCaseIdx(testCases.length);
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs font-mono text-zinc-400">Entering Arena...</div>;
  if (!contest || problems.length === 0) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-rose-400 font-bold">Contest details not found or no problems assigned.</div>;

  const activeProb = problems[activeProblemIdx];
  const currentCase = testCases[activeCaseIdx];

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      
      <div className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push("/contests")} className="text-zinc-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="font-bold text-lg tracking-tight">{contest?.title}</h1>
        </div>
        <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-lg ${timeLeft === 0 ? "text-rose-500 bg-rose-500/10 border border-rose-500/20" : "text-amber-400 bg-amber-400/10 border border-amber-400/20"}`}>
            <Clock className="h-5 w-5" />
            {timeLeft !== null ? (timeLeft === 0 ? "CONTEST OVER" : formatTime(timeLeft)) : "--:--:--"}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        
        <div className="w-64 border-r border-zinc-800 bg-zinc-950 shrink-0 flex flex-col">
            <div className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">Problems ({solvedSet.size}/{problems.length} Solved)</div>
            <div className="p-2 space-y-1 flex-1 overflow-y-auto">
                {problems.map((p, idx) => (
                    <button key={p.id} onClick={() => handleProblemSwitch(idx)} className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${activeProblemIdx === idx ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300" : "hover:bg-zinc-900 text-zinc-400"}`}>
                        <span className="font-semibold text-sm truncate pr-2">{p.title}</span>
                        {solvedSet.has(p.id) && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            <div style={{ width: `${leftWidth}%` }} className="p-6 overflow-y-auto border-r border-zinc-800 bg-[#1e1e1e]">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border bg-indigo-500/5 border-indigo-500/20 text-indigo-400 self-start">{activeProb?.difficulty}</span>
                <h2 className="text-2xl font-bold tracking-tight text-white mt-2 mb-6">{activeProb?.title}</h2>
                <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <div className="mb-4" {...props}/>,
                      code({node, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (match || String(children).includes('\n')) return <pre className="bg-[#252526] p-4 rounded-xl overflow-x-auto text-[13px] font-mono border border-zinc-800 mb-4 shadow-inner"><code className={className} {...props}>{children}</code></pre>;
                        return <code className="bg-zinc-800 text-indigo-300 px-1.5 py-0.5 mx-0.5 rounded text-[12px] font-mono border border-zinc-700" {...props}>{children}</code>;
                      }
                    }}
                  >
                    {activeProb?.statement}
                  </ReactMarkdown>
                </div>
            </div>

            <div onMouseDown={() => {}} className="w-1 h-full bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ew-resize relative z-50 shrink-0" />

            <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-full bg-[#1e1e1e]">
                <div className="h-12 border-b border-zinc-800 bg-[#2d2d2d] px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-zinc-500" />
                        <select value={selectedLang} onChange={(e) => handleLanguageChange(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded text-xs font-mono font-bold py-1 px-2 text-zinc-300 outline-none cursor-pointer">
                            <option value="python3">Python 3.11</option><option value="cpp17">C++ 17 (GCC)</option><option value="java17">Java 17 (OpenJDK)</option><option value="javascript">JavaScript (Node20)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRunCodeAction} disabled={executing || timeLeft === 0} className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold py-1.5 px-3 text-zinc-300 cursor-pointer">
                            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />} Run
                        </button>
                        <button onClick={handleSubmitCodeAction} disabled={executing || timeLeft === 0} className="inline-flex items-center gap-1.5 rounded border border-indigo-500/30 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold py-1.5 px-3.5 text-white cursor-pointer shadow-lg shadow-indigo-600/20">
                            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Submit
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <Editor height="100%" theme="vs-dark" language={getEditorLanguageType(selectedLang)} value={codeMap[activeProb?.id] || ""} onChange={(val) => setCodeMap(prev => ({ ...prev, [activeProb?.id]: val || "" }))} options={{ fontSize: 13, minimap: { enabled: false } }} />
                </div>

                <div className="h-64 flex flex-col font-mono text-xs border-t border-zinc-800 bg-[#252526]">
                  <div className="flex border-b border-zinc-800 h-9 px-4 text-[10px] uppercase font-bold text-zinc-500 bg-[#2d2d2d]">
                    <button onClick={() => setConsoleTab("testcase")} className={`h-full border-b-2 px-3 ${consoleTab === "testcase" ? "border-indigo-400 text-white" : "border-transparent"}`}>TestCase</button>
                    <button onClick={() => setConsoleTab("result")} className={`h-full border-b-2 px-3 ${consoleTab === "result" ? "border-indigo-400 text-white" : "border-transparent"}`}>Result</button>
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
                    
                    <div className="flex items-center gap-2 border-b border-zinc-700/50 pb-2.5 mb-4 select-none">
                      {testCases.map((tc, idx) => (
                        <button key={tc.id} onClick={() => setActiveCaseIdx(idx)} className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 ${activeCaseIdx === idx ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
                          {tc.status === "ACCEPTED" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                          {tc.status === "WRONG_ANSWER" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                          {tc.status === "ERROR" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                          {tc.label}
                          {testCases.length > 1 && ( <X onClick={(e) => { e.stopPropagation(); setTestCases(testCases.filter(t => t.id !== tc.id).map((t, i) => ({ ...t, label: `Case ${i + 1}` }))); setActiveCaseIdx(0); }} className="h-3 w-3 ml-1 hover:text-rose-400 cursor-pointer" /> )}
                        </button>
                      ))}
                      <button onClick={handleCreateCustomTestCase} className="p-1 rounded-md border border-zinc-800 bg-zinc-900/20 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 cursor-pointer"><Plus className="h-3 w-3" /></button>
                    </div>

                    {consoleTab === "testcase" ? (
                      <div className="space-y-3">
                        {currentCase?.inputs.map((inp, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wider text-zinc-500`}>{inp.name} =</span>
                            <textarea rows={2} value={inp.value} onChange={(e) => { const newVal = e.target.value; setTestCases(prev => prev.map((tc, cIdx) => cIdx === activeCaseIdx ? { ...tc, inputs: tc.inputs.map((i, iIdx) => iIdx === idx ? { ...i, value: newVal } : i), status: "PENDING", actualOutput: "", stdout: "" } : tc)); }} className="w-full bg-[#3c3c3c] border border-zinc-600 rounded-lg px-2.5 py-1 text-white text-xs outline-none font-mono" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {currentCase?.status === "PENDING" && !submissionResult ? <p className="text-zinc-500 italic">Run code to see output.</p> : (
                          <div className="space-y-3 text-[11px]">
                            {currentCase?.error ? <pre className="text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{currentCase.error}</pre> : (
                              <div className="space-y-2.5">
                                {currentCase?.stdout && ( <div><span className="text-[10px] text-zinc-500 font-bold block mb-0.5">Stdout</span><pre className="bg-zinc-900/40 p-2 rounded-lg border border-zinc-800 text-emerald-400">{currentCase.stdout}</pre></div> )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div><span className="text-[10px] text-zinc-500 font-bold block mb-0.5">Output</span><pre className="bg-[#1e1e1e] p-2 rounded-lg border border-zinc-800 text-white min-h-[40px]">{currentCase?.actualOutput}</pre></div>
                                  <div><span className="text-[10px] text-zinc-500 font-bold block mb-0.5">Expected</span><pre className="bg-[#1e1e1e] p-2 rounded-lg border border-zinc-800 text-zinc-400 min-h-[40px]">{currentCase?.expected}</pre></div>
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
      </div>
    </div>
  );
}