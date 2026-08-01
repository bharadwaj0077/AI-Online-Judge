"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Code2, CheckCircle2, XCircle, Plus, Palette } from "lucide-react";

interface ProblemDetail {
  id: string;
  slug: string;
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
}

const themesRegistry = {
  "vs-dark": { name: "VS Code Dark", bg: "bg-[#1e1e1e] text-[#d4d4d4]", panel: "bg-[#252526]", border: "border-[#3c3c3c]", headerBg: "bg-[#2d2d2d]", textMain: "text-[#ffffff]", textMuted: "text-[#a9a9a9]", inputBg: "bg-[#3c3c3c] border-[#6b6b6b] text-white focus:border-[#007acc]", tabActive: "border-[#007acc] text-white bg-[#1e1e1e]", editorTheme: "vs-dark" },
  "vs-light": { name: "VS Code Light", bg: "bg-[#ffffff] text-[#000000]", panel: "bg-[#f3f3f3]", border: "border-[#e4e4e4]", headerBg: "bg-[#dddddd]", textMain: "text-[#000000]", textMuted: "text-[#6b6b6b]", inputBg: "bg-[#ffffff] border-[#cecece] text-black focus:border-[#007acc]", tabActive: "border-[#007acc] text-black bg-white", editorTheme: "light" },
  "monokai": { name: "Monokai Pro", bg: "bg-[#272822] text-[#f8f8f2]", panel: "bg-[#1e1e1e]", border: "border-[#3e3d32]", headerBg: "bg-[#1a1a1a]", textMain: "text-[#f8f8f2]", textMuted: "text-[#75715e]", inputBg: "bg-[#272822] border-[#49483e] text-[#a6e22e] focus:border-[#f92672]", tabActive: "border-[#f92672] text-[#f92672] bg-[#272822]", editorTheme: "vs-dark" },
  "abyss": { name: "Abyss Deep Blue", bg: "bg-[#000c18] text-[#6688cc]", panel: "bg-[#001224]", border: "border-[#002244]", headerBg: "bg-[#001c38]", textMain: "text-[#00ffff]", textMuted: "text-[#4466aa]", inputBg: "bg-[#000c18] border-[#003366] text-[#ffe000] focus:border-[#00ffff]", tabActive: "border-[#ffe000] text-[#ffe000] bg-[#001224]", editorTheme: "vs-dark" }
};

function getEditorLanguageType(langSlug: string): string {
  const slug = langSlug.toLowerCase().trim();
  if (slug.includes("python")) return "python";
  if (slug.includes("java") && !slug.includes("javascript")) return "java";
  if (slug.startsWith("c1") || slug === "c") return "c";
  return "cpp";
}

function renderSanitizedMarkdown(text: string, textMainClass: string, textMutedClass: string) {
  if (!text) return null;
  return text.split("\n").map((line, idx) => {
    if (line.startsWith("### ")) return <h3 key={idx} className={`text-xs font-bold mt-4 mb-1 font-mono uppercase tracking-wider ${textMainClass}`}>{line.replace("### ", "")}</h3>;
    if (line.startsWith("* ")) return <li key={idx} className={`text-xs ml-4 list-disc my-0.5 font-mono ${textMutedClass}`}>{line.replace("* ", "")}</li>;
    let renderedLine: React.ReactNode = line;
    if (line.includes("**")) {
      const segments = line.split("**");
      renderedLine = segments.map((seg, sIdx) => sIdx % 2 === 1 ? <strong key={sIdx} className={`${textMainClass} font-bold`}>{seg}</strong> : seg);
    }
    return <p key={idx} className={`text-xs leading-relaxed my-0.5 ${textMutedClass}`}>{renderedLine}</p>;
  });
}

export default function ProblemWorkspaceCanvas() {
  const { slug } = useParams();
  const [problem, setProblem] = useState<ProblemDetail | null>(null);
  const [selectedLang, setSelectedLanguage] = useState("python3");
  const [editorCode, setEditorCode] = useState("");
  const [executing, setExecuting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTheme, setActiveTheme] = useState<keyof typeof themesRegistry>("vs-dark");
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [testCases, setTestCases] = useState<TestCaseMetrics[]>([]);

  const [leftWidth, setLeftWidth] = useState(40);
  const [consoleHeight, setConsoleHeight] = useState(250);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const isResizingWidthRef = useRef(false);
  const isResizingHeightRef = useRef(false);

  useEffect(() => {
    const synchronizeWorkspace = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/problems/${slug}?lang=${selectedLang}`);
        if (response.data?.success) {
          const probData = response.data.data;
          setProblem(probData);
          setEditorCode(probData.inputTemplate);

          const parsedCases: TestCaseMetrics[] = (probData.testCases || []).map((tc: any, index: number) => {
            const lastBracket = tc.input.lastIndexOf("]");
            const inputs = lastBracket !== -1 
              ? [
                  { name: "nums", value: tc.input.substring(0, lastBracket + 1) },
                  { name: "target", value: tc.input.substring(lastBracket + 1).replace(/[^0-9-]/g, "") }
                ]
              : [{ name: "input", value: tc.input }];

            return {
              id: index + 1,
              label: `Case ${index + 1}`,
              inputs,
              expected: tc.expectedOutput,
              stdout: "", actualOutput: "", error: null, status: "PENDING"
            };
          });

          setTestCases(parsedCases.length > 0 ? parsedCases : [
            { id: 1, label: "Case 1", inputs: [{ name: "input", value: "5" }], expected: "15", stdout: "", actualOutput: "", error: null, status: "PENDING" }
          ]);
          setActiveCaseIdx(0);
          setConsoleTab("testcase");
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (slug) synchronizeWorkspace();
  }, [slug, selectedLang]);

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
    const handleMouseUp = () => { isResizingWidthRef.current = false; isResizingHeightRef.current = false; };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleRunCodeAction = async () => {
    setExecuting(true);
    setConsoleTab("result");
    setTestCases(prev => prev.map(tc => ({ ...tc, status: "PENDING", actualOutput: "Evaluating...", stdout: "", error: null })));

    const evaluatedOutputsList = await Promise.all(testCases.map(async (tc) => {
      const argumentToken = tc.inputs.map(i => i.value).join(", ");
      try {
        const payload = { sourceCode: editorCode, language: selectedLang, customInput: argumentToken, problemId: problem?.id };
        const res = await api.post("/judge/run", payload);

        const parsedStdout = res.data?.stdout || "";
        const parsedOutput = (res.data?.output || "").trim();
        const parsedExpected = (res.data?.expected || "").trim();
        const parsedError = res.data?.error || null;

        let calculatedStatus: "ACCEPTED" | "WRONG_ANSWER" | "ERROR" = "ACCEPTED";
        if (parsedError) calculatedStatus = "ERROR";
        else if (!parsedOutput || parsedOutput.toLowerCase().replace(/\s+/g, "") !== parsedExpected.toLowerCase().replace(/\s+/g, "")) {
          calculatedStatus = "WRONG_ANSWER";
        }

        return { ...tc, stdout: parsedStdout, actualOutput: parsedOutput || "None", expected: parsedExpected || tc.expected, error: parsedError, status: calculatedStatus };
      } catch { return { ...tc, error: "Sandbox error.", status: "ERROR" as const }; }
    }));

    setTestCases(evaluatedOutputsList);
    setExecuting(false);
  };

  const handleCreateCustomTestCase = () => {
    if (testCases.length >= 5) return;
    const nextId = testCases.length + 1;
    const seedVal = problem?.slug === "two-sum" ? [{ name: "nums", value: "[3,4,5,6]" }, { name: "target", value: "9" }] : [{ name: "input", value: '"raceacar"' }];
    setTestCases([...testCases, {
      id: nextId, label: `Case ${nextId}`, inputs: seedVal, expected: "Run to verify", stdout: "", actualOutput: "", error: null, status: "PENDING"
    }]);
    setActiveCaseIdx(testCases.length);
    setConsoleTab("testcase");
  };

  const currentCase = testCases[activeCaseIdx];
  const styling = themesRegistry[activeTheme];

  return (
    <div ref={containerRef} className={`flex min-h-[calc(100vh-4rem)] w-full font-sans relative overflow-hidden transition-colors duration-150 ${styling.bg}`}>
      
      <div style={{ width: `${leftWidth}%` }} className={`p-6 overflow-y-auto border-r flex flex-col gap-4 h-[calc(100vh-4rem)] ${styling.border} ${styling.panel} transition-colors duration-150 select-text`}>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider uppercase border bg-indigo-500/5 border-indigo-500/20 text-indigo-400 self-start">{problem?.difficulty}</span>
        <h1 className={`text-xl font-bold tracking-tight ${styling.textMain}`}>{problem?.title}</h1>
        <div className="space-y-2 select-text">{renderSanitizedMarkdown(problem?.statement || "", styling.textMain, styling.textMuted)}</div>
      </div>

      <div onMouseDown={() => { isResizingWidthRef.current = true; }} className="w-1 h-[calc(100vh-4rem)] bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ew-resize transition-colors relative z-50" />

      <div ref={rightPaneRef} style={{ width: `${100 - leftWidth}%` }} className="flex flex-col h-[calc(100vh-4rem)]">
        
        <div className={`h-12 border-b px-4 flex items-center justify-between transition-colors duration-150 ${styling.headerBg} ${styling.border}`}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-zinc-500" />
              <select value={selectedLang} onChange={(e) => setSelectedLanguage(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono font-bold py-1 px-2.5 text-zinc-300 outline-none cursor-pointer">
                <option value="python3">Python 3.11</option>
                <option value="cpp17">C++ 17 (GCC)</option>
                <option value="c11">C (GCC 11)</option>
                <option value="java17">Java 17</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1.5 border-l border-zinc-700/40 pl-4 text-zinc-400 text-xs font-mono font-bold">
              <Palette className="h-3.5 w-3.5 text-zinc-500" />
              <select value={activeTheme} onChange={(e) => setActiveTheme(e.target.value as any)} className="bg-transparent border-none text-zinc-400 text-xs font-mono outline-none cursor-pointer font-bold">
                {Object.entries(themesRegistry).map(([key, val]) => (
                  <option key={key} value={key} className="bg-zinc-950 text-zinc-300">{val.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleRunCodeAction} disabled={executing} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold py-1.5 px-3 text-zinc-300 cursor-pointer disabled:opacity-40">
              {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" /> : <Play className="h-3.5 w-3.5 fill-current text-zinc-400" />} Run Code
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg text-xs font-bold py-1.5 px-3 text-white cursor-pointer shadow-md bg-indigo-600 hover:bg-indigo-500">Send Instance</button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-[#1e1e1e]">
          <Editor height="100%" theme={styling.editorTheme} language={getEditorLanguageType(selectedLang)} value={editorCode} onChange={(val) => setEditorCode(val || "")} options={{ fontSize: 13, minimap: { enabled: false }, automaticLayout: true }} />
        </div>

        <div onMouseDown={() => { isResizingHeightRef.current = true; }} className="h-1 w-full bg-zinc-900/40 hover:bg-indigo-500/40 cursor-ns-resize transition-colors relative z-50" />

        <div style={{ height: `${consoleHeight}px` }} className={`flex flex-col font-mono text-xs border-t transition-colors duration-150 ${styling.border} ${styling.panel}`}>
          <div className={`flex border-b h-9 px-4 text-[10px] uppercase font-bold tracking-wider text-zinc-500 ${styling.border} ${styling.headerBg}`}>
            <button onClick={() => setConsoleTab("testcase")} className={`h-full border-b-2 px-3 cursor-pointer ${consoleTab === "testcase" ? styling.tabActive : "border-transparent"}`}>TestCase</button>
            <button onClick={() => setConsoleTab("result")} className={`h-full border-b-2 px-3 cursor-pointer ${consoleTab === "result" ? styling.tabActive : "border-transparent"}`}>Test Result</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-zinc-500/10 pb-2.5 mb-4 select-none">
              {testCases.map((tc, idx) => (
                // 🚀 FIXED: Toggles layout metrics smoothly without redirect locks
                <button key={tc.id} onClick={() => { setActiveCaseIdx(idx); }} className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer ${activeCaseIdx === idx ? "bg-zinc-800 border-zinc-700 text-zinc-100" : "bg-zinc-900/30 border-zinc-900/80 text-zinc-400"}`}>
                  {tc.status === "ACCEPTED" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                  {tc.status === "WRONG_ANSWER" && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
                  {tc.status === "ERROR" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                  {tc.label}
                </button>
              ))}
              <button onClick={handleCreateCustomTestCase} className="p-1 rounded-md border border-zinc-800 bg-zinc-900/20 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all cursor-pointer"><Plus className="h-3 w-3" /></button>
            </div>

            {consoleTab === "testcase" ? (
              <div className="space-y-3">
                {currentCase?.inputs.map((inp, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${styling.textMuted}`}>{inp.name} =</span>
                    <input 
                      type="text" value={inp.value}
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setTestCases(prev => prev.map((tc, cIdx) => cIdx === activeCaseIdx ? {
                          ...tc, inputs: tc.inputs.map((i, iIdx) => iIdx === idx ? { ...i, value: newVal } : i), status: "PENDING", actualOutput: "", stdout: ""
                        } : tc));
                      }}
                      className={`w-full max-w-xs border rounded-lg px-2.5 py-1 text-xs outline-none font-mono ${styling.inputBg}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {currentCase?.status === "PENDING" && currentCase.actualOutput === "" ? (
                  <p className={`italic ${styling.textMuted}`}>No active evaluation logs found.</p>
                ) : (
                  <div className="space-y-3 text-[11px]">
                    <div className="font-bold text-xs select-none">
                      {currentCase.status === "ACCEPTED" ? <span className="text-emerald-400">✓ Passed</span> : currentCase.status === "WRONG_ANSWER" ? <span className="text-rose-400">✗ Failed</span> : <span className="text-amber-500 animate-pulse">Running Sandbox...</span>}
                    </div>
                    {currentCase.error ? (
                      <pre className="bg-red-500/5 border border-red-500/10 text-rose-400 rounded-xl p-3 whitespace-pre-wrap leading-relaxed max-w-xl font-mono">{currentCase.error}</pre>
                    ) : currentCase.actualOutput !== "Evaluating..." ? (
                      <div className="space-y-2.5">
                        {currentCase.stdout && (
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>Stdout</span>
                            <pre className="bg-zinc-900/40 border border-zinc-900 rounded-lg px-2 py-1 text-emerald-400 font-medium inline-block min-w-xs">{currentCase.stdout}</pre>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>Output</span>
                            <pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-zinc-100 font-bold">{currentCase.actualOutput}</pre>
                          </div>
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-0.5 ${styling.textMuted}`}>Expected</span>
                            <pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 text-zinc-400 font-bold">{currentCase.expected}</pre>
                          </div>
                        </div>
                      </div>
                    ) : null}
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