"use client";

import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import ProfilerCanvas, { VisualStepData } from "@/components/visualizer/ProfilerCanvas";
import { api } from "@/lib/api";
import {
  Eye,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  GitCommit,
  GitFork,
  Grid,
  Search,
  Code2,
  Loader2,
  Terminal,
  HelpCircle,
  Sliders,
  Link2
} from "lucide-react";

interface PresetItem {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  description: string;
  code: {
    python3: string;
    javascript: string;
  };
  sampleInput: string;
}

export default function StandaloneVisualizerPage() {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>("two-pointers-sum");
  const [selectedLang, setSelectedLang] = useState<"python3" | "javascript">("python3");
  const [editorCode, setEditorCode] = useState<string>("");
  const [customInput, setCustomInput] = useState<string>("");
  const [isCustomInputModified, setIsCustomInputModified] = useState<boolean>(false);
  const [visualizing, setVisualizing] = useState<boolean>(false);
  const [traceSteps, setTraceSteps] = useState<VisualStepData[]>([]);
  const [traceSummary, setTraceSummary] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monaco editor reference for live line glyph highlighting
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // 1. Fetch presets on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await api.get("/profiler/presets");
        if (res.data?.success && Array.isArray(res.data.data)) {
          setPresets(res.data.data);
          const initial = res.data.data[0];
          if (initial) {
            setActivePresetId(initial.id);
            setEditorCode(initial.code.python3);
            setCustomInput(initial.sampleInput);
            setIsCustomInputModified(false);
            // Auto run first preset trace
            runVisualizerTrace(initial.code.python3, "python3", initial.sampleInput, initial.title);
          }
        }
      } catch (err: any) {
        console.warn("Failed to load presets, using fallback:", err);
      }
    };

    fetchPresets();
  }, []);

  // 2. Select preset
  const handleSelectPreset = (preset: PresetItem) => {
    setActivePresetId(preset.id);
    const code = selectedLang === "javascript" ? preset.code.javascript : preset.code.python3;
    setEditorCode(code);
    setCustomInput(preset.sampleInput);
    setIsCustomInputModified(false);
    runVisualizerTrace(code, selectedLang, preset.sampleInput, preset.title);
  };

  // 3. Language change
  const handleLanguageChange = (lang: "python3" | "javascript") => {
    setSelectedLang(lang);
    const currentPreset = presets.find((p) => p.id === activePresetId);
    if (currentPreset) {
      const code = lang === "javascript" ? currentPreset.code.javascript : currentPreset.code.python3;
      setEditorCode(code);
      runVisualizerTrace(code, lang, isCustomInputModified ? customInput : currentPreset.sampleInput, currentPreset.title);
    }
  };

  // 4. Run trace API
  const runVisualizerTrace = async (
    codeToRun: string,
    lang: string,
    inputStr: string,
    title?: string
  ) => {
    if (!codeToRun.trim()) return;

    setVisualizing(true);
    setErrorMsg(null);

    try {
      const res = await api.post("/profiler/trace", {
        code: codeToRun,
        language: lang,
        input: inputStr,
        problemTitle: title || "Visualizer Sandbox"
      });

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setTraceSteps(data.steps || []);
        setTraceSummary(data.summary || "");
      } else {
        throw new Error(res.data?.message || "Trace generation failed");
      }
    } catch (err: any) {
      console.error("Profiler trace error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to generate execution trace");
    } finally {
      setVisualizing(false);
    }
  };

  // User click on Run & Visualize: dynamically checks if code was edited vs input was edited
  const handleRunClick = () => {
    const activePreset = presets.find((p) => p.id === activePresetId);
    const activePresetCode = activePreset
      ? (selectedLang === "javascript" ? activePreset.code.javascript : activePreset.code.python3)
      : "";
    const isCodeModified = editorCode.trim() !== activePresetCode.trim();

    // If code was modified in Monaco and customInput wasn't explicitly typed by user,
    // pass empty input so the profiler prioritizes the code's active arguments.
    // Otherwise, if the user explicitly typed an input, pass that customInput.
    const inputToSend = (!isCustomInputModified && isCodeModified) ? "" : customInput;
    runVisualizerTrace(editorCode, selectedLang, inputToSend);
  };

  // 5. Sync active line highlight in Monaco Editor
  const handleActiveLineChange = (lineNumber: number) => {
    if (!editorRef.current || !monacoRef.current || !lineNumber) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Remove old decorations and add new glowing line highlight
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

    // Smooth scroll to executing line
    editor.revealLineInCenterIfOutsideViewport(lineNumber);
  };

  const getPresetIcon = (category: string) => {
    switch (category) {
      case "two-pointers":
        return <Sliders className="w-3.5 h-3.5 text-cyan-400" />;
      case "binary-search":
        return <Search className="w-3.5 h-3.5 text-sky-400" />;
      case "linked-list":
        return <Link2 className="w-3.5 h-3.5 text-teal-400" />;
      case "stack":
        return <Layers className="w-3.5 h-3.5 text-purple-400" />;
      case "queue":
        return <GitCommit className="w-3.5 h-3.5 text-emerald-400 rotate-90" />;
      case "tree":
        return <GitFork className="w-3.5 h-3.5 text-amber-400 rotate-180" />;
      case "matrix":
        return <Grid className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Code2 className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Header Banner (Note: Global Navbar is already provided by RootLayout) */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Eye className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="font-extrabold text-xl text-white tracking-tight">
                Visual Algorithm <span className="text-cyan-400">Execution Profiler</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                SANDBOX
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Step through code line-by-line with animated arrays, pointers, stacks, queues, trees, and DP grids.
            </p>
          </div>

          {/* Language Selector & Run Button */}
          <div className="flex items-center gap-3">
            <select
              value={selectedLang}
              onChange={(e) => handleLanguageChange(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-300 outline-none cursor-pointer focus:border-cyan-500"
            >
              <option value="python3">Python 3.11</option>
              <option value="javascript">JavaScript (ES6)</option>
            </select>

            <button
              type="button"
              onClick={handleRunClick}
              disabled={visualizing}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {visualizing ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Play className="w-4 h-4 fill-current text-white" />
              )}
              <span>{visualizing ? "Tracing Code..." : "Run & Visualize"}</span>
            </button>
          </div>
        </div>

        {/* Algorithm Presets Scrollable Strip */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-mono text-zinc-500 uppercase shrink-0">Presets:</span>
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`shrink-0 px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/40"
                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                {getPresetIcon(preset.category)}
                <span>{preset.title.split("(")[0].trim()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Layout: Code Editor (Left) & Visual Canvas (Right) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Monaco Editor & Input (5 Cols)               */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-xl flex flex-col h-[520px]">
            {/* Editor Top Bar */}
            <div className="px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-zinc-200">Source Editor</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                {selectedLang === "python3" ? "Python 3.11" : "JavaScript"}
              </span>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0 bg-[#1e1e1e]">
              <Editor
                height="100%"
                theme="vs-dark"
                language={selectedLang === "python3" ? "python" : "javascript"}
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
                  lineNumbers: "on",
                  glyphMargin: true
                }}
              />
            </div>
          </div>

          {/* Custom Input Field */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <label className="font-mono text-xs font-bold text-zinc-300">Execution Input</label>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Custom or preset arguments</span>
            </div>
            <input
              type="text"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                setIsCustomInputModified(true);
              }}
              placeholder="e.g. nums = [2, 7, 11, 15], target = 9"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-mono">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Visualizer Canvas (7 Cols)                  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-xl min-h-[520px]">
            {visualizing ? (
              <div className="h-[460px] flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-zinc-200">Evaluating Algorithm Trace...</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Tracing variables, pointers, stacks, and data structures step-by-step.
                  </p>
                </div>
              </div>
            ) : traceSteps.length > 0 ? (
              <ProfilerCanvas
                steps={traceSteps}
                summary={traceSummary}
                onActiveLineChange={handleActiveLineChange}
              />
            ) : (
              <div className="h-[460px] flex flex-col items-center justify-center gap-3 text-center text-zinc-500">
                <HelpCircle className="w-8 h-8 text-zinc-600" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-zinc-300">Ready to Visualize</h4>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    Pick any algorithm preset above or edit the code, then click &quot;Run &amp; Visualize&quot;.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
