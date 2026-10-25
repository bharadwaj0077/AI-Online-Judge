"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Swords,
  Zap,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Play,
  Send,
  Flag,
  Loader2,
  Trophy,
  Award,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Activity,
  Bot,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Plus,
  X,
  FileCode,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { getArenaSocket } from "@/lib/socket";

interface HintItem {
  tier: number;
  title: string;
  content: string;
  keyTakeaway: string;
}

interface OpponentProgress {
  userId: string;
  charCount: number;
  lineCount: number;
  passedCases?: number;
  totalCases?: number;
  verdict?: string;
  isAiBot?: boolean;
}

interface RefereeDecision {
  matchId: string;
  mode: string;
  problemTitle: string;
  winnerId: string;
  winnerName: string;
  reason: string;
  scores: {
    player1: {
      userId: string;
      username: string;
      correctness: number;
      efficiency: number;
      cleanliness: number;
      speedAndConduct: number;
      totalScore: number;
      critique: string;
    };
    player2: {
      userId: string;
      username: string;
      correctness: number;
      efficiency: number;
      cleanliness: number;
      speedAndConduct: number;
      totalScore: number;
      critique: string;
    };
  };
  overallVerdict: string;
  timestamp: number;
}

interface ArenaTestCaseItem {
  id: number;
  label: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  stdout: string;
  error: string | null;
  status: "PENDING" | "ACCEPTED" | "WRONG_ANSWER" | "ERROR";
  isCustom?: boolean;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
  javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
  cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
  java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
};

export default function ArenaLiveBattlePage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [matchData, setMatchData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Multi-Language Code Management
  const [selectedLang, setSelectedLang] = useState<string>("python3");
  const [editorCode, setEditorCode] = useState<string>(DEFAULT_TEMPLATES.python3);
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});

  // Match State
  const [remainingSec, setRemainingSec] = useState<number>(600);
  const [isConcluded, setIsConcluded] = useState<boolean>(false);
  const [refereeDecision, setRefereeDecision] = useState<RefereeDecision | null>(null);

  // Anti-Cheat & Malpractice State
  const [antiCheatWarnings, setAntiCheatWarnings] = useState<number>(0);
  const [antiCheatAlertBanner, setAntiCheatAlertBanner] = useState<string | null>(null);

  // Progressive Hints
  const [unlockedHints, setUnlockedHints] = useState<HintItem[]>([]);
  const [hintNotification, setHintNotification] = useState<HintItem | null>(null);

  // Opponent Real-time Telemetry
  const [opponentProgress, setOpponentProgress] = useState<OpponentProgress>({
    userId: "",
    charCount: 0,
    lineCount: 1,
    passedCases: 0,
    totalCases: 0,
    verdict: "PENDING",
  });
  const [opponentActionToast, setOpponentActionToast] = useState<string | null>(null);

  // Navigation & Tabs
  const [leftTab, setLeftTab] = useState<"problem" | "hints" | "anticheat">("problem");
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result" | "submission">("testcase");

  // Test Cases Management
  const [testCases, setTestCases] = useState<ArenaTestCaseItem[]>([
    { id: 1, label: "Case 1", input: "[2,7,11,15], 9", expectedOutput: "[0,1]", actualOutput: "", stdout: "", error: null, status: "PENDING" },
    { id: 2, label: "Case 2", input: "[3,2,4], 6", expectedOutput: "[1,2]", actualOutput: "", stdout: "", error: null, status: "PENDING" }
  ]);
  const [activeCaseIdx, setActiveCaseIdx] = useState<number>(0);

  // Code Execution & AI Diagnosis
  const [executing, setExecuting] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [diagnosing, setDiagnosing] = useState<boolean>(false);
  const [diagnosis, setDiagnosis] = useState<any | null>(null);

  const [myVerdict, setMyVerdict] = useState<{
    verdict: string;
    passedCases: number;
    totalCases: number;
    executionTimeMs: number;
    failedCase?: any;
  } | null>(null);

  const keystrokeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to initialize problem templates & test cases
  const applyProblemData = (prob: any, initialCodeOverride?: string) => {
    if (!prob) return;

    let parsedTmpl: Record<string, string> = { ...DEFAULT_TEMPLATES };
    if (prob.templates) {
      parsedTmpl = { ...DEFAULT_TEMPLATES, ...prob.templates };
    }
    setTemplatesMap(parsedTmpl);

    if (initialCodeOverride) {
      setEditorCode(initialCodeOverride);
    } else {
      const codeForLang = parsedTmpl[selectedLang] || prob.starterCode || DEFAULT_TEMPLATES[selectedLang];
      setEditorCode(codeForLang);
    }

    if (prob.testCases && Array.isArray(prob.testCases) && prob.testCases.length > 0) {
      const parsed: ArenaTestCaseItem[] = prob.testCases.map((tc: any, idx: number) => ({
        id: idx + 1,
        label: `Case ${idx + 1}`,
        input: tc.input || "",
        expectedOutput: tc.expectedOutput || "",
        actualOutput: "",
        stdout: "",
        error: null,
        status: "PENDING"
      }));
      setTestCases(parsed);
      setActiveCaseIdx(0);
    }
  };

  useEffect(() => {
    let tabId = sessionStorage.getItem("arena_pilot_id");
    let tabName = sessionStorage.getItem("arena_pilot_name");

    if (!tabId) {
      tabId = `pilot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      sessionStorage.setItem("arena_pilot_id", tabId);
    }

    if (!tabName) {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          tabName = u.username || u.name || "Warrior";
        } catch {}
      }
      tabName = tabName || `Gladiator_${Math.floor(Math.random() * 900 + 100)}`;
      sessionStorage.setItem("arena_pilot_name", tabName);
    }

    const currentUser = { id: tabId, username: tabName };
    setUser(currentUser);

    const socket = getArenaSocket();

    // Reconnect or join room
    socket.emit("arena:join_match_room", { matchId, userId: currentUser.id });

    // Listen for match state initialization
    socket.on("arena:match_start", (data: any) => {
      setMatchData(data);
      applyProblemData(data.problem, data.problem?.starterCode);
      setRemainingSec(data.durationSec || 600);
      setLoading(false);
    });

    socket.on("arena:match_state", (data: any) => {
      setMatchData(data);
      const isP1 = data.player1.userId === currentUser.id;
      const myPlayer = isP1 ? data.player1 : data.player2;
      const opPlayer = isP1 ? data.player2 : data.player1;

      applyProblemData(data.problem, myPlayer?.code);

      if (myPlayer?.warnings) setAntiCheatWarnings(myPlayer.warnings);

      if (opPlayer) {
        setOpponentProgress({
          userId: opPlayer.userId,
          charCount: opPlayer.code ? opPlayer.code.length : 0,
          lineCount: opPlayer.code ? opPlayer.code.split("\n").length : 1,
          passedCases: opPlayer.passedCases || 0,
          totalCases: opPlayer.totalCases || 0,
          verdict: opPlayer.verdict || "PENDING",
          isAiBot: opPlayer.isAiBot,
        });
      }

      if (data.unlockedHints) setUnlockedHints(data.unlockedHints);

      const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
      setRemainingSec(Math.max(0, (data.durationSec || 600) - elapsed));
      setLoading(false);
    });

    // Opponent Telemetry
    socket.on("arena:opponent_progress", (data: any) => {
      setOpponentProgress((prev) => ({
        ...prev,
        charCount: data.charCount,
        lineCount: data.lineCount,
      }));
    });

    socket.on("arena:opponent_ran_tests", () => {
      setOpponentActionToast("Opponent executed test cases...");
      setTimeout(() => setOpponentActionToast(null), 3500);
    });

    socket.on("arena:opponent_submitted", (data: any) => {
      setOpponentProgress((prev) => ({
        ...prev,
        passedCases: data.passedCases,
        totalCases: data.totalCases,
        verdict: data.verdict,
      }));
      setOpponentActionToast(`Opponent submitted solution (${data.passedCases}/${data.totalCases} passed)!`);
      setTimeout(() => setOpponentActionToast(null), 4000);
    });

    // Progressive Hints
    socket.on("arena:hint_unlocked", (hint: HintItem) => {
      setUnlockedHints((prev) => {
        if (prev.some((h) => h.tier === hint.tier)) return prev;
        return [...prev, hint];
      });
      setHintNotification(hint);
      setTimeout(() => setHintNotification(null), 6000);
    });

    // Anti-Cheat Alert
    socket.on("arena:anti_cheat_alert", (alert: { userId: string; warnings: number; message: string }) => {
      if (alert.userId === currentUser.id) {
        setAntiCheatWarnings(alert.warnings);
        setAntiCheatAlertBanner(alert.message);
        setTimeout(() => setAntiCheatAlertBanner(null), 6000);
      }
    });

    // Co-Op Document Sync
    socket.on("arena:coop_code_sync", (sync: { userId: string; code: string }) => {
      if (sync.userId !== currentUser.id) {
        setEditorCode(sync.code);
      }
    });

    // Match Concluded
    socket.on("arena:match_concluded", (concluded: { match: any; decision: RefereeDecision }) => {
      setIsConcluded(true);
      setRefereeDecision(concluded.decision);
    });

    // Match Countdown ticker
    const timer = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      socket.off("arena:match_start");
      socket.off("arena:match_state");
      socket.off("arena:opponent_progress");
      socket.off("arena:opponent_ran_tests");
      socket.off("arena:opponent_submitted");
      socket.off("arena:hint_unlocked");
      socket.off("arena:anti_cheat_alert");
      socket.off("arena:coop_code_sync");
      socket.off("arena:match_concluded");
    };
  }, [matchId]);

  // Language Change Handler (Preserves code and loads corresponding language template)
  const getEditorLanguageType = (lang: string) => {
    if (lang === "cpp17" || lang.includes("cpp")) return "cpp";
    if (lang === "javascript" || lang.includes("js")) return "javascript";
    if (lang === "java17" || lang.includes("java")) return "java";
    return "python";
  };

  const handleLanguageChange = (newLang: string) => {
    // Save current code for current language
    setCodeByLang((prev) => ({ ...prev, [selectedLang]: editorCode }));
    setSelectedLang(newLang);

    // Retrieve previous code or template for new language
    const nextCode = codeByLang[newLang] || templatesMap[newLang] || DEFAULT_TEMPLATES[newLang] || "";
    setEditorCode(nextCode);

    if (user) {
      const socket = getArenaSocket();
      socket.emit("arena:code_keystroke", {
        matchId,
        userId: user.id,
        code: nextCode,
      });
    }
  };

  // Handle Keystrokes & Live Telemetry
  const handleEditorChange = (value: string | undefined) => {
    const code = value || "";
    setEditorCode(code);

    if (keystrokeDebounceRef.current) clearTimeout(keystrokeDebounceRef.current);
    keystrokeDebounceRef.current = setTimeout(() => {
      if (!user) return;
      const socket = getArenaSocket();
      socket.emit("arena:code_keystroke", {
        matchId,
        userId: user.id,
        code,
      });
    }, 300);
  };

  // Anti-Cheat Paste Listener on Monaco
  const handleEditorDidMount = (editor: any) => {
    editor.onDidPaste((e: any) => {
      const range = e.range;
      const model = editor.getModel();
      const pastedText = model ? model.getValueInRange(range) : "";
      if (pastedText.length > 150 && user) {
        const socket = getArenaSocket();
        socket.emit("arena:code_keystroke", {
          matchId,
          userId: user.id,
          code: editor.getValue(),
          isPaste: true,
          pastedLength: pastedText.length,
        });
      }
    });
  };

  // Test Case Management: Add Custom Case
  const handleAddCustomTestCase = () => {
    if (testCases.length >= 5) return;
    const nextId = testCases.reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const blueprint = testCases[0];
    const newCase: ArenaTestCaseItem = {
      id: nextId,
      label: `Case ${nextId}`,
      input: blueprint ? blueprint.input : "",
      expectedOutput: blueprint ? blueprint.expectedOutput : "Run to verify",
      actualOutput: "",
      stdout: "",
      error: null,
      status: "PENDING",
      isCustom: true
    };
    setTestCases([...testCases, newCase]);
    setActiveCaseIdx(testCases.length);
  };

  // Test Case Management: Remove Case
  const handleRemoveTestCase = (id: number) => {
    if (testCases.length <= 1) return;
    const filtered = testCases.filter((tc) => tc.id !== id).map((tc, idx) => ({
      ...tc,
      label: `Case ${idx + 1}`
    }));
    setTestCases(filtered);
    setActiveCaseIdx(0);
  };

  // Test Case Management: Edit Active Case Input
  const handleInputDataChange = (value: string) => {
    setTestCases((prev) =>
      prev.map((tc, idx) =>
        idx === activeCaseIdx
          ? { ...tc, input: value, status: "PENDING", actualOutput: "", stdout: "", error: null }
          : tc
      )
    );
  };

  // Run Code Against All Test Cases
  const handleRunCode = async () => {
    if (!matchData?.problem?.id || executing) return;
    setExecuting(true);
    setConsoleTab("result");
    setDiagnosis(null);

    // Mark test cases as evaluating
    setTestCases((prev) =>
      prev.map((tc) => ({ ...tc, status: "PENDING", actualOutput: "Evaluating...", stdout: "", error: null }))
    );

    const socket = getArenaSocket();
    if (user) {
      socket.emit("arena:run_tests", {
        matchId,
        userId: user.id,
        code: editorCode,
        language: selectedLang,
      });
    }

    let firstFailedIndex = -1;
    const evaluatedList = await Promise.all(
      testCases.map(async (tc, index) => {
        try {
          const res = await api.post("/judge/run", {
            sourceCode: editorCode,
            language: selectedLang,
            customInput: tc.input,
            problemId: matchData.problem.id
          });

          const stdout = (res.data?.stdout || "").trim();
          const actualOutput = (res.data?.output || "").trim();
          const expected = (res.data?.expected || tc.expectedOutput || "").trim();
          const error = res.data?.error || null;

          let status: "ACCEPTED" | "WRONG_ANSWER" | "ERROR" = "ACCEPTED";
          if (error) {
            status = "ERROR";
          } else if (!actualOutput || actualOutput.toLowerCase().replace(/\s+/g, "") !== expected.toLowerCase().replace(/\s+/g, "")) {
            status = "WRONG_ANSWER";
          }

          if (status !== "ACCEPTED" && firstFailedIndex === -1) {
            firstFailedIndex = index;
          }

          return {
            ...tc,
            stdout,
            actualOutput: actualOutput || "None",
            expectedOutput: expected,
            error,
            status
          };
        } catch (err: any) {
          if (firstFailedIndex === -1) firstFailedIndex = index;
          return {
            ...tc,
            error: err.message || "Sandbox execution error",
            status: "ERROR" as const,
            actualOutput: "Error",
            stdout: ""
          };
        }
      })
    );

    setTestCases(evaluatedList);
    if (firstFailedIndex !== -1) {
      setActiveCaseIdx(firstFailedIndex);
    }
    setExecuting(false);
  };

  // Submit Solution
  const handleSubmitCode = async () => {
    if (!matchData?.problem?.id || submitting || isConcluded) return;
    setSubmitting(true);
    setConsoleTab("submission");
    setDiagnosis(null);

    try {
      const res = await api.post("/judge/submit", {
        sourceCode: editorCode,
        language: selectedLang,
        problemId: matchData.problem.id,
      });

      if (res.data?.success) {
        const verdictData = {
          verdict: res.data.verdict,
          passedCases: res.data.passedCases,
          totalCases: res.data.totalCases,
          executionTimeMs: res.data.executionTimeMs || 0,
          failedCase: res.data.failedCase,
        };
        setMyVerdict(verdictData);

        // Notify socket
        if (user) {
          const socket = getArenaSocket();
          socket.emit("arena:submit_solution", {
            matchId,
            userId: user.id,
            code: editorCode,
            language: selectedLang,
            ...verdictData,
          });
        }
      }
    } catch {
      alert("Submission error. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Ask AI Diagnosis for failing test case
  const handleDiagnoseFailure = async () => {
    if (!matchData?.problem?.id || diagnosing) return;
    setDiagnosing(true);
    const tc = testCases[activeCaseIdx] || testCases[0];
    try {
      const res = await api.post(`/problems/${matchData.problem.id}/diagnose-failure`, {
        sourceCode: editorCode,
        language: selectedLang,
        failureContext: {
          orderNo: activeCaseIdx + 1,
          caseType: tc.isCustom ? "Custom" : "Sample",
          caseIndex: activeCaseIdx + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: tc.actualOutput,
          verdict: tc.status,
          error: tc.error || undefined
        }
      });
      if (res.data?.diagnosis) {
        setDiagnosis(res.data.diagnosis);
      }
    } catch {
      //
    } finally {
      setDiagnosing(false);
    }
  };

  // Surrender / Forfeit
  const handleSurrender = () => {
    if (window.confirm("Are you sure you want to forfeit this battle? The AI Referee will award victory to your opponent.")) {
      if (user) {
        const socket = getArenaSocket();
        socket.emit("arena:surrender", { matchId, userId: user.id });
      }
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 font-mono gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <div className="text-sm">Connecting to Arena Battle Arena...</div>
      </div>
    );
  }

  const isBlitz = matchData?.mode === "blitz";
  const isCoop = matchData?.mode === "coop";
  const currentCase = testCases[activeCaseIdx] || testCases[0];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans flex flex-col">
      {/* ========================================================================= */}
      {/* 1. TOP STATUS & SYNCHRONIZATION HEADER                                     */}
      {/* ========================================================================= */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Mode & Problem Title */}
        <div className="flex items-center gap-3">
          <div
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isBlitz
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : isCoop
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}
          >
            {isBlitz ? <Zap className="w-3.5 h-3.5" /> : isCoop ? <Users className="w-3.5 h-3.5" /> : <Swords className="w-3.5 h-3.5" />}
            {isBlitz ? "Blitz Duel" : isCoop ? "Co-Op Duo" : "Classic 1v1"}
          </div>

          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>{matchData?.problem?.title || "Arena Problem"}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
              {matchData?.difficulty || "EASY"}
            </span>
          </div>
        </div>

        {/* Center: Countdown Timer & Anti-Cheat Shield */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border font-mono font-bold text-sm ${
              remainingSec < 60
                ? "bg-rose-600/20 text-rose-400 border-rose-500 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-200"
            }`}
          >
            <Clock className="w-4 h-4 text-rose-500" />
            <span>{formatTimer(remainingSec)}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono ${
              antiCheatWarnings > 0
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            }`}
            title="AI Anti-Cheat Telemetry Sentinel"
          >
            {antiCheatWarnings > 0 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{antiCheatWarnings > 0 ? `Warnings: ${antiCheatWarnings}/2` : "Anti-Cheat Clean"}</span>
          </div>
        </div>

        {/* Right: Opponent Progress & Forfeit */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg flex items-center gap-2 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-zinc-400">Opponent:</span>
            <span className="text-zinc-200 font-semibold">{opponentProgress.lineCount} lines</span>
            {opponentProgress.verdict !== "PENDING" && (
              <span className={`px-1 rounded text-[10px] font-bold ${opponentProgress.verdict === "ACCEPTED" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                {opponentProgress.verdict}
              </span>
            )}
          </div>

          {!isConcluded && (
            <button
              onClick={handleSurrender}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-600/20 border border-zinc-800 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            >
              <Flag className="w-3 h-3" /> Forfeit
            </button>
          )}
        </div>
      </header>

      {/* Opponent Activity Toast */}
      {opponentActionToast && (
        <div className="bg-indigo-600/90 text-white text-xs font-mono py-1 px-4 text-center border-b border-indigo-400/30 animate-pulse flex items-center justify-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          <span>{opponentActionToast}</span>
        </div>
      )}

      {/* Anti-Cheat Alert Banner */}
      {antiCheatAlertBanner && (
        <div className="bg-rose-600/95 text-white text-xs font-mono py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <ShieldAlert className="w-4 h-4" />
          <span>{antiCheatAlertBanner}</span>
        </div>
      )}

      {/* Hint Unlocked Notification */}
      {hintNotification && (
        <div className="bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-mono py-1.5 px-4 text-center font-bold flex items-center justify-center gap-2 shadow-lg">
          <Lightbulb className="w-4 h-4 animate-spin" />
          <span>💡 Progressive AI Hint Tier {hintNotification.tier} Unlocked: {hintNotification.title}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN BATTLE SPLIT WORKSPACE                                            */}
      {/* ========================================================================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Pane (5 cols): Problem Description & Progressive Hints */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-zinc-800/80 bg-zinc-900/40 shrink-0">
            <button
              onClick={() => setLeftTab("problem")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                leftTab === "problem"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Problem
            </button>
            <button
              onClick={() => setLeftTab("hints")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer relative ${
                leftTab === "hints"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Hints ({unlockedHints.length}/3)</span>
              {unlockedHints.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-amber-400 absolute top-1 right-1"></span>
              )}
            </button>
            <button
              onClick={() => setLeftTab("anticheat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                leftTab === "anticheat"
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Anti-Cheat Log</span>
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {leftTab === "problem" && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-xl font-extrabold text-white">{matchData?.problem?.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                      {matchData?.difficulty || "EASY"}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs font-mono text-zinc-400">Match ID: {matchId.slice(-6)}</span>
                  </div>
                </div>

                <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line border-t border-zinc-800/80 pt-3">
                  {matchData?.problem?.statement}
                </div>

                {matchData?.problem?.constraintsText && (
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <div className="text-xs font-mono uppercase text-zinc-400 font-bold mb-1">Constraints:</div>
                    <div className="text-xs font-mono text-zinc-300 whitespace-pre-line">
                      {matchData.problem.constraintsText}
                    </div>
                  </div>
                )}
              </div>
            )}

            {leftTab === "hints" && (
              <div className="space-y-4">
                <div className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Synchronized Progressive Hints drop automatically for both players at 25%, 50%, and 75% of the battle duration.
                </div>

                {unlockedHints.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-xs font-mono text-zinc-500">
                    <Lightbulb className="w-8 h-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                    Tier 1 Hint will unlock at 25% match duration.
                  </div>
                ) : (
                  unlockedHints.map((h) => (
                    <div
                      key={h.tier}
                      className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5" /> Tier {h.tier}: {h.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          UNLOCKED
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{h.content}</p>
                      <div className="pt-2 border-t border-amber-500/10 text-[11px] font-mono text-amber-300">
                        ⚡ Key Invariant: {h.keyTakeaway}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {leftTab === "anticheat" && (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="font-bold text-zinc-200 mb-1">Sentinel Telemetry Active</div>
                  <div className="text-zinc-400 text-[11px] leading-relaxed">
                    Monitors keystroke velocity, clipboard size, and external paste events. Pastes &gt;150 characters trigger warnings and score deductions during AI Grandmaster Referee evaluation.
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] uppercase tracking-wider text-zinc-500">Telemetry History:</div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] space-y-1 text-zinc-400">
                    <div>• Anti-cheat sentinel initialized.</div>
                    {antiCheatWarnings > 0 ? (
                      <div className="text-rose-400">
                        • ⚠️ Malpractice Warning 1: Massive paste detected. Deductions logged.
                      </div>
                    ) : (
                      <div className="text-emerald-400">• Zero malpractice flags recorded. Clean standing.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Pane (7 cols): Monaco Code Editor & Full Testcase Console */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0c0c0e]">
          {/* Editor Header Bar with Multi-Language Switcher */}
          <div className="h-10 border-b border-zinc-800/80 bg-zinc-900/50 px-4 flex items-center justify-between shrink-0 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                Language:
              </span>
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="python3">Python 3.11</option>
                <option value="javascript">JavaScript (Node 20)</option>
                <option value="cpp17">C++ 17 (GCC)</option>
                <option value="java17">Java 17 (OpenJDK)</option>
              </select>
            </div>

            <div className="text-zinc-500 text-[11px]">
              {isCoop ? "🤝 Co-Op Sync Active (Live Pairing)" : "🔒 Full Code Hidden From Opponent"}
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={getEditorLanguageType(selectedLang)}
              value={editorCode}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "Fira Code, Consolas, monospace",
                automaticLayout: true,
                tabSize: 4,
                scrollBeyondLastLine: false,
                padding: { top: 12 },
              }}
            />
          </div>

          {/* ========================================================================= */}
          {/* FULL TESTCASE CONSOLE & EXECUTION BAR                                      */}
          {/* ========================================================================= */}
          <div className="h-64 border-t border-zinc-800/80 bg-zinc-950 flex flex-col shrink-0">
            {/* Console Tab Header */}
            <div className="h-9 border-b border-zinc-800/80 bg-zinc-900/40 px-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setConsoleTab("testcase")}
                  className={`px-3 py-1.5 font-bold transition-colors border-b-2 ${
                    consoleTab === "testcase"
                      ? "border-indigo-500 text-white bg-zinc-800/60"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  TestCase
                </button>
                <button
                  onClick={() => setConsoleTab("result")}
                  className={`px-3 py-1.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    consoleTab === "result"
                      ? "border-indigo-500 text-white bg-zinc-800/60"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Test Results</span>
                  {testCases.some((t) => t.status !== "PENDING") && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        testCases.every((t) => t.status === "ACCEPTED") ? "bg-emerald-400" : "bg-rose-500"
                      }`}
                    />
                  )}
                </button>
                <button
                  onClick={() => setConsoleTab("submission")}
                  className={`px-3 py-1.5 font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                    consoleTab === "submission"
                      ? "border-indigo-500 text-white bg-zinc-800/60"
                      : "border-transparent text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Submission Status</span>
                  {myVerdict && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        myVerdict.verdict === "ACCEPTED" ? "bg-emerald-400" : "bg-rose-500"
                      }`}
                    />
                  )}
                </button>
              </div>

              {/* Action Buttons: Run Tests & Submit Solution */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={executing || isConcluded}
                  className="px-3.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700"
                >
                  {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />}
                  <span>Run Tests</span>
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={submitting || isConcluded}
                  className="px-4 py-1 bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                  <span>Submit Solution</span>
                </button>
              </div>
            </div>

            {/* Test Case Selector Bar (Pills + Add / Remove) */}
            <div className="px-3 py-1.5 border-b border-zinc-800/60 bg-zinc-950/40 flex items-center gap-2 select-none overflow-x-auto shrink-0 font-mono text-xs">
              {testCases.map((tc, idx) => (
                <button
                  key={tc.id}
                  onClick={() => setActiveCaseIdx(idx)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeCaseIdx === idx
                      ? "bg-zinc-800 border-zinc-600 text-white shadow-sm"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  {tc.status === "ACCEPTED" && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                  {tc.status === "WRONG_ANSWER" && <X className="w-3 h-3 text-rose-500 stroke-[3]" />}
                  {tc.status === "ERROR" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                  <span>{tc.label}</span>
                  {testCases.length > 1 && (
                    <X
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTestCase(tc.id);
                      }}
                      className="w-3 h-3 text-zinc-500 hover:text-rose-400 transition-colors ml-0.5 cursor-pointer"
                    />
                  )}
                </button>
              ))}

              {testCases.length < 5 && (
                <button
                  onClick={handleAddCustomTestCase}
                  className="px-2 py-1 rounded-md border border-dashed border-zinc-700 hover:border-indigo-400 text-zinc-400 hover:text-indigo-300 text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  title="Add custom test case"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Case</span>
                </button>
              )}
            </div>

            {/* Console Content Area */}
            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300 space-y-3">
              {/* TAB 1: TESTCASE INPUT DISPLAY & EDITING */}
              {consoleTab === "testcase" && (
                <div className="space-y-2.5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Input ({currentCase.label}):
                    </span>
                    <textarea
                      rows={2}
                      value={currentCase.input}
                      onChange={(e) => handleInputDataChange(e.target.value)}
                      placeholder="Enter test case arguments..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {currentCase.expectedOutput && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Expected Output:
                      </span>
                      <pre className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs whitespace-pre-wrap">
                        {currentCase.expectedOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: TEST RESULTS */}
              {consoleTab === "result" && (
                currentCase.status === "PENDING" && !currentCase.actualOutput ? (
                  <div className="text-zinc-500 text-center py-6">
                    Click &quot;Run Tests&quot; to execute your solution against test cases.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Execution Error */}
                    {currentCase.error && (
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-rose-400 block">
                          Execution Exception:
                        </span>
                        <pre className="bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl p-3 whitespace-pre-wrap leading-relaxed font-mono">
                          {currentCase.error}
                        </pre>
                      </div>
                    )}

                    {/* Stdout Output */}
                    {currentCase.stdout && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                          Standard Output (Stdout):
                        </span>
                        <pre className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2 text-emerald-400 whitespace-pre-wrap">
                          {currentCase.stdout}
                        </pre>
                      </div>
                    )}

                    {/* Output vs Expected Side-by-Side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Your Output:
                        </span>
                        <pre
                          className={`rounded-lg p-2 font-bold whitespace-pre-wrap border ${
                            currentCase.status === "ACCEPTED"
                              ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                              : "bg-rose-950/20 border-rose-900/40 text-rose-300"
                          }`}
                        >
                          {currentCase.actualOutput || "None"}
                        </pre>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                          Expected Output:
                        </span>
                        <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 font-bold whitespace-pre-wrap">
                          {currentCase.expectedOutput || "None"}
                        </pre>
                      </div>
                    </div>

                    {/* ✨ Universal Ask AI Failure Diagnosis Button */}
                    {(currentCase.status === "WRONG_ANSWER" || currentCase.status === "ERROR") && (
                      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 to-indigo-950/40 border border-purple-500/30 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            Need guidance on this test case divergence?
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5">
                            AI will inspect your code logic and explain the root cause.
                          </div>
                        </div>

                        <button
                          onClick={handleDiagnoseFailure}
                          disabled={diagnosing}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
                        >
                          {diagnosing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          <span>Ask AI Why It Failed</span>
                        </button>
                      </div>
                    )}

                    {/* Diagnosis Result Card */}
                    {diagnosis && (
                      <div className="p-3.5 rounded-xl bg-zinc-900 border border-purple-500/40 space-y-2 text-xs">
                        <div className="font-bold text-purple-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> AI Diagnosis: {diagnosis.rootCause}
                        </div>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">{diagnosis.explanation}</p>
                        {diagnosis.suggestedFixConcept && (
                          <div className="text-indigo-300 text-[11px]">
                            💡 Strategic Fix: {diagnosis.suggestedFixConcept}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* TAB 3: SUBMISSION STATUS */}
              {consoleTab === "submission" && (
                !myVerdict ? (
                  <div className="text-zinc-500 text-center py-6">
                    No submissions recorded yet. Click &quot;Submit Solution&quot; to test against all cases.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <div className="flex items-center gap-2.5">
                        {myVerdict.verdict === "ACCEPTED" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                        <div>
                          <div className={`font-bold ${myVerdict.verdict === "ACCEPTED" ? "text-emerald-400" : "text-rose-400"}`}>
                            {myVerdict.verdict}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">
                            Passed: {myVerdict.passedCases} / {myVerdict.totalCases} Total Test Cases
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-zinc-400 font-mono">
                        {myVerdict.executionTimeMs}ms
                      </div>
                    </div>

                    {/* LeetCode Failing Test Case Inspector */}
                    {myVerdict.failedCase && (
                      <div className="p-3 rounded-xl bg-zinc-900 border border-rose-500/30 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                          Failed on: {myVerdict.failedCase.caseType} #{myVerdict.failedCase.caseIndex}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500">Input:</span>
                          <pre className="p-2 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs">
                            {myVerdict.failedCase.input}
                          </pre>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[10px] text-rose-400">Your Output:</span>
                            <pre className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-rose-300 text-xs font-bold">
                              {myVerdict.failedCase.actualOutput}
                            </pre>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-400">Expected:</span>
                            <pre className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs font-bold">
                              {myVerdict.failedCase.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {isBlitz && myVerdict.verdict === "ACCEPTED" && (
                      <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold text-center">
                        ⚡ Blitz First Blood Victory achieved! AI Referee evaluating results...
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MATCH CONCLUDED MODAL & GRANDMASTER AI REFEREE SCORECARD               */}
      {/* ========================================================================= */}
      {isConcluded && refereeDecision && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[#121217] border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            {/* Header / Winner Announcement */}
            <div className="text-center pb-6 border-b border-zinc-800">
              <div className="inline-flex p-3 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xl shadow-amber-500/20 mb-3">
                <Trophy className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                VICTORY: <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400">{refereeDecision.winnerName}</span>
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1 max-w-md mx-auto">
                {refereeDecision.reason}
              </p>
            </div>

            {/* Impartial AI Referee Scorecard Table */}
            <div className="mt-6 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-400 uppercase tracking-wider text-[11px]">
                <span>GRANDMASTER REFEREE EVALUATION</span>
                <span className="text-indigo-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> IMPARTIAL AI
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Player 1 Card */}
                <div className={`p-4 rounded-xl border ${refereeDecision.winnerId === refereeDecision.scores.player1.userId ? "bg-amber-500/10 border-amber-500/40" : "bg-zinc-900/60 border-zinc-800"}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="font-bold text-white text-sm">{refereeDecision.scores.player1.username}</span>
                    <span className="text-base font-black text-amber-400">{refereeDecision.scores.player1.totalScore} pts</span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11px] text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Correctness (0-40):</span>
                      <span>{refereeDecision.scores.player1.correctness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Efficiency (0-25):</span>
                      <span>{refereeDecision.scores.player1.efficiency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Cleanliness (0-20):</span>
                      <span>{refereeDecision.scores.player1.cleanliness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Conduct (0-15):</span>
                      <span>{refereeDecision.scores.player1.speedAndConduct}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 italic">
                    &quot;{refereeDecision.scores.player1.critique}&quot;
                  </div>
                </div>

                {/* Player 2 Card */}
                <div className={`p-4 rounded-xl border ${refereeDecision.winnerId === refereeDecision.scores.player2.userId ? "bg-amber-500/10 border-amber-500/40" : "bg-zinc-900/60 border-zinc-800"}`}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <span className="font-bold text-white text-sm">{refereeDecision.scores.player2.username}</span>
                    <span className="text-base font-black text-amber-400">{refereeDecision.scores.player2.totalScore} pts</span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11px] text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Correctness (0-40):</span>
                      <span>{refereeDecision.scores.player2.correctness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Efficiency (0-25):</span>
                      <span>{refereeDecision.scores.player2.efficiency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Cleanliness (0-20):</span>
                      <span>{refereeDecision.scores.player2.cleanliness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Conduct (0-15):</span>
                      <span>{refereeDecision.scores.player2.speedAndConduct}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 italic">
                    &quot;{refereeDecision.scores.player2.critique}&quot;
                  </div>
                </div>
              </div>

              {/* Overall AI Grandmaster Verdict Summary */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs leading-relaxed">
                <span className="text-amber-400 font-bold">Grandmaster Verdict:</span> {refereeDecision.overallVerdict}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-end gap-3 font-mono text-xs">
              <button
                onClick={() => router.push(`/arena`)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold transition-all cursor-pointer"
              >
                Return to Lobby
              </button>
              <button
                onClick={() => router.push(`/arena/replay/${matchId}`)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Launch Replay Theatre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
