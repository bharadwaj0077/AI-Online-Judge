"use client";

import React, { useEffect, useState, useRef, use } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Bot,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  FileCode,
  ShieldCheck,
  Award,
  ChevronRight,
  Plus,
  X,
  Loader2,
  Building2,
  Briefcase
} from "lucide-react";
import { api } from "@/lib/api";
import { getArenaSocket } from "@/lib/socket";

interface TranscriptTurn {
  id: string;
  sender: "interviewer" | "candidate" | "system";
  text: string;
  timestamp: number;
  codeSnippet?: string;
  isHint?: boolean;
}

interface TestCaseItem {
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

interface ScorecardData {
  hireDecision: string;
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  behavioralScore: number;
  executiveSummary: string;
  strengths: string[];
  growthAreas: string[];
  lineByLineFeedback: string;
  optimalSolution: string;
  interviewerVerdict: string;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  python3: "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass",
  javascript: "class Solution {\n    solve(...args) {\n        // Write your code here\n    }\n}",
  cpp17: "#include <vector>\n#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    void solve() {\n        // Write your code here\n    }\n};",
  java17: "import java.util.*;\n\nclass Solution {\n    public void solve() {\n        // Write your code here\n    }\n}"
};

export default function MockInterviewArenaPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  // Session state
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Time & Status
  const [timeLeftSec, setTimeLeftSec] = useState(2700); // 45 min default
  const [interviewStatus, setInterviewStatus] = useState<"IN_PROGRESS" | "EVALUATING" | "COMPLETED">("IN_PROGRESS");
  const [interviewerState, setInterviewerState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");

  // Media Controls
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [aiVoiceMuted, setAiVoiceMuted] = useState(false);

  // Speech Recognition & Captions
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);

  // Behavioral Telemetry
  const [fillerCount, setFillerCount] = useState(0);
  const [wordsSpoken, setWordsSpoken] = useState(0);
  const [codeRunsCount, setCodeRunsCount] = useState(0);

  // Monaco Editor State
  const [selectedLang, setSelectedLang] = useState("python3");
  const [editorCode, setEditorCode] = useState("");
  const [codeByLang, setCodeByLang] = useState<Record<string, string>>({});
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});

  // Test Case Management
  const [testCases, setTestCases] = useState<TestCaseItem[]>([]);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "result">("testcase");
  const [executingTests, setExecutingTests] = useState(false);

  // Final Scorecard Modal
  const [scorecard, setScorecard] = useState<ScorecardData | null>(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  // DOM Refs
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const keystrokeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Initial Interview Session State
  useEffect(() => {
    if (!interviewId) return;

    const fetchSession = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/interviews/${interviewId}`);
        if (!res.data.success || !res.data.data) {
          throw new Error("Interview session not found.");
        }

        const data = res.data.data;
        setSessionData(data);

        // Compute remaining time
        const durationSec = (data.durationMinutes || 45) * 60;
        if (data.startTime) {
          const elapsedSec = Math.floor((Date.now() - new Date(data.startTime).getTime()) / 1000);
          setTimeLeftSec(Math.max(0, durationSec - elapsedSec));
        } else {
          setTimeLeftSec(durationSec);
        }

        // Setup templates & initial code
        const probTemplates = data.problem?.templates || DEFAULT_TEMPLATES;
        setTemplatesMap(probTemplates);
        const initialLang = data.language || "python3";
        setSelectedLang(initialLang);
        const initialCode = data.currentCode || probTemplates[initialLang] || DEFAULT_TEMPLATES[initialLang] || "";
        setEditorCode(initialCode);
        setCodeByLang({ [initialLang]: initialCode });

        // Initialize test cases
        const sampleCases = data.problem?.testCases || [];
        if (sampleCases.length > 0) {
          setTestCases(
            sampleCases.map((tc: any, idx: number) => ({
              id: idx + 1,
              label: `Case ${idx + 1}`,
              input: tc.input || "",
              expectedOutput: tc.expectedOutput || "",
              actualOutput: "",
              stdout: "",
              error: null,
              status: "PENDING"
            }))
          );
        } else {
          setTestCases([
            { id: 1, label: "Case 1", input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", actualOutput: "", stdout: "", error: null, status: "PENDING" },
            { id: 2, label: "Case 2", input: "[3, 2, 4], 6", expectedOutput: "[1, 2]", actualOutput: "", stdout: "", error: null, status: "PENDING" }
          ]);
        }

        // Initialize transcript
        const initialTranscript = Array.isArray(data.transcript) ? data.transcript : [];
        setTranscript(initialTranscript);

        if (data.scorecard) {
          setScorecard(data.scorecard);
          setShowScorecardModal(true);
          setInterviewStatus("COMPLETED");
        }

        // Speak opening greeting if voice is enabled and interview is active
        if (initialTranscript.length > 0 && !data.scorecard) {
          const opening = initialTranscript[0]?.text;
          if (opening) {
            speakInterviewerVoice(opening);
          }
        }
      } catch (err: any) {
        console.error("Failed to load interview:", err);
        setErrorMsg(err.message || "Could not load interview session.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [interviewId]);

  // 2. Setup WebSockets Pipeline
  useEffect(() => {
    if (!interviewId) return;

    const socket = getArenaSocket();

    socket.emit("interview:join", { interviewId });

    socket.on("interview:interviewer_status", (payload: { status: "idle" | "thinking" | "speaking" }) => {
      setInterviewerState(payload.status);
    });

    socket.on("interview:interviewer_message", (payload: { text: string; isHint?: boolean; codeCritique?: string; updatedTranscript?: TranscriptTurn[] }) => {
      setInterviewerState("speaking");

      if (payload.updatedTranscript) {
        setTranscript(payload.updatedTranscript);
      } else {
        setTranscript((prev) => [
          ...prev,
          {
            id: `turn_${Date.now()}_i`,
            sender: "interviewer",
            text: payload.text,
            timestamp: Date.now(),
            isHint: payload.isHint
          }
        ]);
      }

      speakInterviewerVoice(payload.text);
    });

    socket.on("interview:completed", (payload: { success: boolean; scorecard: ScorecardData }) => {
      setScorecard(payload.scorecard);
      setShowScorecardModal(true);
      setInterviewStatus("COMPLETED");
      setInterviewerState("idle");
    });

    socket.on("interview:error", (payload: { message: string }) => {
      console.warn("Interview socket error:", payload.message);
    });

    return () => {
      socket.off("interview:interviewer_status");
      socket.off("interview:interviewer_message");
      socket.off("interview:completed");
      socket.off("interview:error");
    };
  }, [interviewId]);

  // 3. Countdown Timer
  useEffect(() => {
    if (interviewStatus !== "IN_PROGRESS" || timeLeftSec <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleConcludeInterview();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interviewStatus, timeLeftSec]);

  // 4. Initialize Webcam Feed
  useEffect(() => {
    let active = true;

    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        webcamStreamRef.current = stream;
        if (candidateVideoRef.current && !screenSharing) {
          candidateVideoRef.current.srcObject = stream;
          candidateVideoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn("Webcam access denied or unavailable in this context:", err);
        setCameraEnabled(false);
      }
    };

    if (cameraEnabled) {
      initWebcam();
    }

    return () => {
      active = false;
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
        webcamStreamRef.current = null;
      }
    };
  }, [cameraEnabled]);

  // 5. Initialize Continuous Speech Recognition (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API not supported in this browser. Fallback to manual text input available.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalUtterance = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalUtterance += text;
          } else {
            interim += text;
          }
        }

        setInterimSpeech(interim);

        if (finalUtterance.trim().length > 0) {
          setInterimSpeech("");
          handleCandidateSpeech(finalUtterance.trim());
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          console.warn("Speech recognition error:", e.error);
        }
      };

      recognition.onend = () => {
        if (micEnabled && interviewStatus === "IN_PROGRESS") {
          try {
            recognition.start();
          } catch {}
        } else {
          setIsListening(false);
        }
      };

      speechRecognitionRef.current = recognition;
      if (micEnabled) {
        recognition.start();
      }
    } catch (err) {
      console.warn("Failed to instantiate SpeechRecognition:", err);
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
    };
  }, [micEnabled, interviewStatus]);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop = transcriptScrollRef.current.scrollHeight;
    }
  }, [transcript, interimSpeech]);

  // Voice synthesis for Interviewer
  const speakInterviewerVoice = (text: string) => {
    if (aiVoiceMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Alex") || v.name.includes("Samantha")));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onend = () => {
      setInterviewerState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  // Screen Sharing Toggle
  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Revert back to webcam
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenSharing(false);
      if (candidateVideoRef.current && webcamStreamRef.current) {
        candidateVideoRef.current.srcObject = webcamStreamRef.current;
        candidateVideoRef.current.play().catch(() => {});
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setScreenSharing(true);

        if (candidateVideoRef.current) {
          candidateVideoRef.current.srcObject = stream;
          candidateVideoRef.current.play().catch(() => {});
        }

        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };

        // Notify interviewer
        const socket = getArenaSocket();
        socket.emit("interview:candidate_message", {
          interviewId,
          text: "I have shared my screen to walk you through my thought process and code architecture.",
          code: editorCode,
          language: selectedLang,
          screenObservation: "Candidate enabled live screen sharing showing code editor."
        });
      } catch (err) {
        console.warn("Screen share cancelled or not allowed:", err);
      }
    }
  };

  // Handle Candidate Speech / Chat turn
  const handleCandidateSpeech = (spokenText: string) => {
    if (!spokenText.trim()) return;

    // Behavioral telemetry updates: filler words & words count
    const words = spokenText.toLowerCase().split(/\s+/);
    setWordsSpoken((prev) => prev + words.length);

    const fillers = ["um", "uh", "like", "actually", "basically", "you know", "sort of"];
    const detectedFillers = words.filter((w) => fillers.includes(w.replace(/[^a-z]/g, ""))).length;
    if (detectedFillers > 0) {
      setFillerCount((prev) => prev + detectedFillers);
    }

    // Add candidate turn to local transcript immediately for instant responsiveness
    const candidateTurn: TranscriptTurn = {
      id: `turn_${Date.now()}_u`,
      sender: "candidate",
      text: spokenText,
      timestamp: Date.now(),
      codeSnippet: editorCode ? editorCode.slice(0, 150) : undefined
    };
    setTranscript((prev) => [...prev, candidateTurn]);

    // Send to WebSocket backend
    const socket = getArenaSocket();
    socket.emit("interview:candidate_message", {
      interviewId,
      text: spokenText,
      code: editorCode,
      language: selectedLang
    });
  };

  const handleSendManualMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const text = manualInput;
    setManualInput("");
    handleCandidateSpeech(text);
  };

  // Language Change Handling
  const handleLanguageChange = (newLang: string) => {
    setCodeByLang((prev) => ({ ...prev, [selectedLang]: editorCode }));
    setSelectedLang(newLang);
    const nextCode = codeByLang[newLang] || templatesMap[newLang] || DEFAULT_TEMPLATES[newLang] || "";
    setEditorCode(nextCode);

    const socket = getArenaSocket();
    socket.emit("interview:code_update", {
      interviewId,
      code: nextCode,
      language: newLang
    });
  };

  // Debounced Code Keystroke Sync
  const handleEditorChange = (value: string | undefined) => {
    const code = value || "";
    setEditorCode(code);

    if (keystrokeDebounceRef.current) clearTimeout(keystrokeDebounceRef.current);
    keystrokeDebounceRef.current = setTimeout(() => {
      const socket = getArenaSocket();
      socket.emit("interview:code_update", {
        interviewId,
        code,
        language: selectedLang
      });
    }, 500);
  };

  // Quick Action: Ask for Code Review
  const handleRequestCodeReview = () => {
    const socket = getArenaSocket();
    socket.emit("interview:request_code_review", {
      interviewId,
      code: editorCode,
      language: selectedLang
    });
  };

  // Quick Action: Ask for Hint
  const handleRequestHint = () => {
    const socket = getArenaSocket();
    socket.emit("interview:request_hint", {
      interviewId,
      code: editorCode,
      language: selectedLang
    });
  };

  // Run Test Cases via Judge API
  const handleRunTestCases = async () => {
    if (!sessionData?.problem?.id || executingTests) return;
    setExecutingTests(true);
    setConsoleTab("result");
    setCodeRunsCount((prev) => prev + 1);

    setTestCases((prev) =>
      prev.map((tc) => ({ ...tc, status: "PENDING", actualOutput: "Evaluating...", stdout: "", error: null }))
    );

    let passedCount = 0;
    let firstError: string | undefined;

    const evaluatedList = await Promise.all(
      testCases.map(async (tc) => {
        try {
          const res = await api.post("/judge/run", {
            sourceCode: editorCode,
            language: selectedLang,
            customInput: tc.input,
            problemId: sessionData.problem.id
          });

          const stdout = (res.data?.stdout || "").trim();
          const actualOutput = (res.data?.output || "").trim();
          const expected = (res.data?.expected || tc.expectedOutput || "").trim();
          const error = res.data?.error || null;

          let status: "ACCEPTED" | "WRONG_ANSWER" | "ERROR" = "ACCEPTED";
          if (error) {
            status = "ERROR";
            if (!firstError) firstError = error;
          } else if (!actualOutput || actualOutput.toLowerCase().replace(/\s+/g, "") !== expected.toLowerCase().replace(/\s+/g, "")) {
            status = "WRONG_ANSWER";
          } else {
            passedCount++;
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
          if (!firstError) firstError = err.message;
          return {
            ...tc,
            error: err.message || "Execution error",
            status: "ERROR" as const,
            actualOutput: "Error",
            expectedOutput: tc.expectedOutput,
            stdout: ""
          };
        }
      })
    );

    setTestCases(evaluatedList);
    setExecutingTests(false);

    // Notify Interviewer via WebSocket
    const socket = getArenaSocket();
    socket.emit("interview:test_run_result", {
      interviewId,
      passed: passedCount,
      total: testCases.length,
      error: firstError,
      code: editorCode,
      language: selectedLang
    });
  };

  // Conclude Interview & Generate Scorecard
  const handleConcludeInterview = async () => {
    if (interviewStatus === "COMPLETED" && scorecard) {
      setShowScorecardModal(true);
      return;
    }

    setInterviewStatus("EVALUATING");
    const socket = getArenaSocket();

    const telemetry = {
      fillerWordCount: fillerCount,
      wpm: wordsSpoken > 0 ? Math.min(180, Math.max(90, Math.round((wordsSpoken / Math.max(1, (2700 - timeLeftSec) / 60))))) : 125,
      eyeContactScore: cameraEnabled ? 92 : 70,
      interruptions: 0,
      codeRuns: codeRunsCount,
      durationElapsedSec: 2700 - timeLeftSec
    };

    socket.emit("interview:end_session", {
      interviewId,
      finalCode: editorCode,
      language: selectedLang,
      telemetry
    });
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-sm font-semibold">Connecting to AI Interview Arena...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !sessionData) {
    return (
      <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-6">
        <div className="max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Interview Session Error</h2>
          <p className="text-xs text-zinc-400">{errorMsg}</p>
          <button
            onClick={() => router.push("/interview")}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Back to Interview Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-xs text-white tracking-wide flex items-center gap-2">
                <span>{sessionData?.targetCompany || "Google"}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-cyan-400 font-mono text-[11px]">{sessionData?.roleTitle || "Senior SWE"}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE SCREEN
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
          <Clock className={`w-4 h-4 ${timeLeftSec < 300 ? "text-rose-500 animate-pulse" : "text-cyan-400"}`} />
          <span className={`font-mono font-bold text-sm ${timeLeftSec < 300 ? "text-rose-400" : "text-white"}`}>
            {formatTimer(timeLeftSec)}
          </span>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mute AI Voice */}
          <button
            type="button"
            onClick={() => {
              if (!aiVoiceMuted) window.speechSynthesis?.cancel();
              setAiVoiceMuted(!aiVoiceMuted);
            }}
            title={aiVoiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              aiVoiceMuted ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {aiVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Toggle Mic */}
          <button
            type="button"
            onClick={() => setMicEnabled(!micEnabled)}
            title={micEnabled ? "Mute Microphone" : "Unmute Microphone"}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              !micEnabled ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-zinc-800 bg-zinc-900 text-emerald-400"
            }`}
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Toggle Camera */}
          <button
            type="button"
            onClick={() => setCameraEnabled(!cameraEnabled)}
            title={cameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              !cameraEnabled ? "border-rose-500/40 bg-rose-500/10 text-rose-400" : "border-zinc-800 bg-zinc-900 text-cyan-400"
            }`}
          >
            {cameraEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          {/* Toggle Screen Share */}
          <button
            type="button"
            onClick={toggleScreenShare}
            title={screenSharing ? "Stop Sharing Screen" : "Share Screen with Interviewer"}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              screenSharing ? "border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/30" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white"
            }`}
          >
            {screenSharing ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{screenSharing ? "Stop Sharing" : "Share Screen"}</span>
          </button>

          {/* End Interview Button */}
          <button
            type="button"
            onClick={handleConcludeInterview}
            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>End & Evaluate</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left Communication Desk, Right Coding Arena */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Multimodal Communication Suite (Cols 1-5) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 border-r border-zinc-800/80 bg-zinc-950/60 flex flex-col h-full overflow-hidden">
          {/* Dual Video Call Feed: Interviewer Video + Candidate/Screen Video */}
          <div className="p-4 grid grid-cols-2 gap-3 border-b border-zinc-800/80 bg-zinc-950/40">
            {/* 1. AI Interviewer Video Tile */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-cyan-950/30 flex flex-col items-center justify-center p-3 shadow-inner">
              {/* Animated Speaking Waves Avatar */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`w-16 h-16 rounded-full border-2 border-cyan-400/50 flex items-center justify-center bg-zinc-900 transition-all duration-300 ${
                    interviewerState === "speaking"
                      ? "ring-4 ring-cyan-400/30 scale-110 shadow-lg shadow-cyan-500/40"
                      : interviewerState === "thinking"
                      ? "ring-4 ring-amber-400/30 animate-pulse"
                      : ""
                  }`}
                >
                  <Bot className={`w-8 h-8 ${interviewerState === "speaking" ? "text-cyan-300 animate-bounce" : "text-cyan-400"}`} />
                </div>
                {/* Voice ripple aura */}
                {interviewerState === "speaking" && (
                  <span className="absolute -inset-2 rounded-full border-2 border-cyan-400/30 animate-ping pointer-events-none" />
                )}
              </div>

              {/* Status Indicator */}
              <div className="mt-3 text-center">
                <div className="font-bold text-xs text-white">{sessionData?.interviewerName || "Alex (Staff SWE)"}</div>
                <div className="text-[10px] text-cyan-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      interviewerState === "speaking"
                        ? "bg-cyan-400 animate-pulse"
                        : interviewerState === "thinking"
                        ? "bg-amber-400 animate-ping"
                        : "bg-emerald-400"
                    }`}
                  />
                  {interviewerState === "speaking"
                    ? "Speaking..."
                    : interviewerState === "thinking"
                    ? "Analyzing Approach..."
                    : "Listening..."}
                </div>
              </div>

              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-cyan-300 border border-cyan-500/20">
                INTERVIEWER
              </div>
            </div>

            {/* 2. Candidate / Screen Share Tile */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-800 bg-black flex items-center justify-center">
              <video
                ref={candidateVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraEnabled || screenSharing ? "block" : "hidden"}`}
              />
              {!cameraEnabled && !screenSharing && (
                <div className="text-center p-2 space-y-1">
                  <VideoOff className="w-6 h-6 text-zinc-600 mx-auto" />
                  <p className="text-[10px] text-zinc-500">Camera Off</p>
                </div>
              )}

              {/* Badges Overlay */}
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {screenSharing ? "SCREEN SHARE" : "YOU (CANDIDATE)"}
              </div>

              {/* Telemetry Micro-HUD */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[9px] font-mono border border-zinc-800">
                <span className="text-zinc-400">Eye Contact: <strong className="text-emerald-400">92%</strong></span>
                <span className="text-zinc-400">Fillers: <strong className={fillerCount > 5 ? "text-amber-400" : "text-cyan-400"}>{fillerCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Interactive Pills */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/40 flex items-center gap-2 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={handleRequestHint}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 text-cyan-300 text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask for Gentle Hint</span>
            </button>
            <button
              type="button"
              onClick={handleRequestCodeReview}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <FileCode className="w-3 h-3 text-cyan-400" />
              <span>Inspect My Code</span>
            </button>
            <button
              type="button"
              onClick={() => handleCandidateSpeech("What are your thoughts on my proposed time and space complexity?")}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-[11px] font-semibold transition-all"
            >
              ⏱️ Discuss Big-O
            </button>
          </div>

          {/* Real-Time Live Transcript Stream */}
          <div
            ref={transcriptScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs scrollbar-thin scrollbar-thumb-zinc-800"
          >
            {transcript.map((turn) => {
              const isInterviewer = turn.sender === "interviewer";
              const isSystem = turn.sender === "system";

              if (isSystem) {
                return (
                  <div key={turn.id} className="text-center py-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 text-[10px] font-mono">
                      {turn.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={turn.id}
                  className={`flex flex-col ${isInterviewer ? "items-start" : "items-end"} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 px-1">
                    <span>{isInterviewer ? sessionData?.interviewerName || "Interviewer" : "You"}</span>
                    <span>·</span>
                    <span>{new Date(turn.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    {turn.isHint && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        HINT
                      </span>
                    )}
                  </div>
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed text-xs ${
                      isInterviewer
                        ? "bg-cyan-950/30 border border-cyan-800/40 text-cyan-100 rounded-tl-sm shadow-sm"
                        : "bg-indigo-950/40 border border-indigo-800/40 text-white rounded-tr-sm shadow-sm"
                    }`}
                  >
                    {turn.text}
                    {turn.codeSnippet && (
                      <pre className="mt-2 p-2 rounded bg-black/60 border border-zinc-800 font-mono text-[10px] text-zinc-300 overflow-x-auto">
                        {turn.codeSnippet}
                      </pre>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Interim live speech preview */}
            {interimSpeech && (
              <div className="flex flex-col items-end space-y-1 animate-pulse">
                <span className="text-[10px] font-mono text-zinc-400">Listening to you...</span>
                <div className="max-w-[85%] p-3 rounded-2xl bg-indigo-950/20 border border-dashed border-indigo-600/50 text-indigo-300 text-xs italic">
                  &ldquo;{interimSpeech}...&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Candidate Voice & Text Input Console */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950">
            <form onSubmit={handleSendManualMessage} className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={
                    isListening
                      ? "Speak into your mic or type response here..."
                      : "Type message or answer for the interviewer..."
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
                {isListening && (
                  <span className="absolute right-2.5 top-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-zinc-400">
              <span className="flex items-center gap-1">
                <Mic className={`w-3 h-3 ${isListening ? "text-emerald-400 animate-pulse" : "text-zinc-600"}`} />
                {isListening ? "Microphone actively listening" : "Microphone paused"}
              </span>
              <span>Press Enter to send speech/message</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Live Technical IDE & Problem Desk (Cols 6-12) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden bg-[#0d1117]">
          {/* Top IDE Toolbar */}
          <div className="h-11 border-b border-zinc-800/80 bg-zinc-950 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs text-white">Problem:</span>
              <span className="font-semibold text-xs text-cyan-300">
                {sessionData?.problem?.title || "Algorithmic Challenge"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                {sessionData?.difficulty || "Medium"}
              </span>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-zinc-400">Language:</label>
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="python3">Python 3</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp17">C++ 17</option>
                <option value="java17">Java 17</option>
              </select>
            </div>
          </div>

          {/* Problem Statement Collapsible Box */}
          <div className="max-h-40 overflow-y-auto p-4 border-b border-zinc-800 bg-zinc-950/40 text-xs text-zinc-300 space-y-2 font-sans scrollbar-thin">
            <p className="leading-relaxed">{sessionData?.problem?.statement}</p>
            {sessionData?.problem?.constraintsText && (
              <div className="text-[11px] text-zinc-400 font-mono">
                <strong>Constraints:</strong> {sessionData?.problem?.constraintsText}
              </div>
            )}
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 min-h-[300px] relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLang === "python3" ? "python" : selectedLang === "javascript" ? "javascript" : selectedLang === "cpp17" ? "cpp" : "java"}
              value={editorCode}
              onChange={handleEditorChange}
              options={{
                fontSize: 13,
                fontFamily: "Fira Code, Menlo, Monaco, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 4
              }}
            />
          </div>

          {/* Live Test Case Console & Execution Drawer */}
          <div className="h-64 border-t border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
            {/* Console Tabs */}
            <div className="h-9 border-b border-zinc-800/80 bg-zinc-900/60 px-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setConsoleTab("testcase")}
                  className={`text-xs font-semibold pb-2 pt-2 border-b-2 transition-colors ${
                    consoleTab === "testcase"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Test Cases
                </button>
                <button
                  type="button"
                  onClick={() => setConsoleTab("result")}
                  className={`text-xs font-semibold pb-2 pt-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                    consoleTab === "result"
                      ? "border-cyan-400 text-cyan-300"
                      : "border-transparent text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>Test Results</span>
                  {executingTests && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
                </button>
              </div>

              {/* Run Code Action */}
              <button
                type="button"
                onClick={handleRunTestCases}
                disabled={executingTests}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
              >
                {executingTests ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Console Content */}
            <div className="flex-1 p-4 overflow-y-auto font-sans text-xs">
              {consoleTab === "testcase" ? (
                <div className="space-y-3">
                  {/* Case Pill Selector */}
                  <div className="flex items-center gap-2">
                    {testCases.map((tc, idx) => (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => setActiveCaseIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          activeCaseIdx === idx
                            ? "bg-zinc-800 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {tc.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Case Editor */}
                  {testCases[activeCaseIdx] && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 uppercase">Input:</label>
                        <textarea
                          rows={2}
                          value={testCases[activeCaseIdx].input}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestCases((prev) =>
                              prev.map((c, i) => (i === activeCaseIdx ? { ...c, input: val } : c))
                            );
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-zinc-400 uppercase">Expected Output:</label>
                        <input
                          type="text"
                          value={testCases[activeCaseIdx].expectedOutput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestCases((prev) =>
                              prev.map((c, i) => (i === activeCaseIdx ? { ...c, expectedOutput: val } : c))
                            );
                          }}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 font-mono text-xs text-white focus:outline-none focus:border-cyan-500 mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Test Results Tab */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {testCases.map((tc, idx) => (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => setActiveCaseIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                          activeCaseIdx === idx ? "ring-1 ring-cyan-500" : ""
                        } ${
                          tc.status === "ACCEPTED"
                            ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300"
                            : tc.status === "WRONG_ANSWER"
                            ? "bg-rose-950/30 border-rose-500/50 text-rose-300"
                            : tc.status === "ERROR"
                            ? "bg-amber-950/30 border-amber-500/50 text-amber-300"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400"
                        }`}
                      >
                        {tc.status === "ACCEPTED" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {tc.status === "WRONG_ANSWER" && <XCircle className="w-3 h-3 text-rose-400" />}
                        {tc.status === "ERROR" && <AlertCircle className="w-3 h-3 text-amber-400" />}
                        <span>{tc.label}</span>
                      </button>
                    ))}
                  </div>

                  {testCases[activeCaseIdx] && (
                    <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase">Your Output:</div>
                          <div className="p-2 rounded bg-black/60 border border-zinc-800 text-white mt-1">
                            {testCases[activeCaseIdx].actualOutput || "Not evaluated yet"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 uppercase">Expected:</div>
                          <div className="p-2 rounded bg-black/60 border border-zinc-800 text-zinc-300 mt-1">
                            {testCases[activeCaseIdx].expectedOutput}
                          </div>
                        </div>
                      </div>
                      {testCases[activeCaseIdx].error && (
                        <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300 font-mono text-[11px]">
                          {testCases[activeCaseIdx].error}
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

      {/* ========================================================= */}
      {/* FINAL FAANG EVALUATION SCORECARD MODAL */}
      {/* ========================================================= */}
      {showScorecardModal && scorecard && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-4xl w-full bg-zinc-950 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            {/* Header Verdict */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  Official FAANG Hiring Committee Debrief
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Evaluation Scorecard: <span className="text-cyan-400">{sessionData?.problem?.title}</span>
                </h2>
                <div className="text-xs text-zinc-400">
                  Candidate for {sessionData?.roleTitle} at {sessionData?.targetCompany}
                </div>
              </div>

              {/* Decision Badge */}
              <div className="text-right flex flex-col items-end">
                <div
                  className={`px-4 py-1.5 rounded-xl font-black text-sm uppercase tracking-wider border shadow-lg ${
                    scorecard.hireDecision === "STRONG_HIRE" || scorecard.hireDecision === "HIRE"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-950/50"
                  }`}
                >
                  {scorecard.hireDecision.replace("_", " ")}
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  Overall: {scorecard.overallScore}/100
                </div>
              </div>
            </div>

            {/* Score Breakdown Radar Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Technical Depth</div>
                <div className="text-2xl font-black text-white mt-1">{scorecard.technicalScore}%</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Communication</div>
                <div className="text-2xl font-black text-cyan-300 mt-1">{scorecard.communicationScore}%</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Problem Solving</div>
                <div className="text-2xl font-black text-indigo-300 mt-1">{scorecard.problemSolvingScore}%</div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <div className="text-[10px] uppercase font-mono text-zinc-400">Behavioral Delivery</div>
                <div className="text-2xl font-black text-emerald-300 mt-1">{scorecard.behavioralScore}%</div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Bot className="w-4 h-4" /> Executive Debrief Summary
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{scorecard.executiveSummary}</p>
            </div>

            {/* Strengths & Growth Areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Key Strengths
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-300">
                  {scorecard.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Areas for Growth
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-xs text-zinc-300">
                  {scorecard.growthAreas.map((gr, i) => (
                    <li key={i}>{gr}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Line-by-Line Critique */}
            {scorecard.lineByLineFeedback && (
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                  Code Review & Cleanliness Critique
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-mono">{scorecard.lineByLineFeedback}</p>
              </div>
            )}

            {/* Optimal Reference Code */}
            {scorecard.optimalSolution && (
              <div className="p-5 rounded-2xl bg-black border border-zinc-800 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                  Optimal Reference Solution:
                </div>
                <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-cyan-200 overflow-x-auto">
                  {scorecard.optimalSolution}
                </pre>
              </div>
            )}

            {/* Closing Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowScorecardModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
              >
                Review IDE Workspace
              </button>

              <button
                type="button"
                onClick={() => router.push("/interview")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                Back to Interview Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
