"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bot,
  Video,
  Mic,
  Monitor,
  Sparkles,
  Clock,
  Briefcase,
  Building2,
  ChevronRight,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Volume2
} from "lucide-react";
import { api } from "@/lib/api";

interface PastInterview {
  id: string;
  roleTitle: string;
  targetCompany: string;
  interviewerName: string;
  topic: string;
  difficulty: string;
  durationMinutes: number;
  status: string;
  problemTitle: string;
  scorecard?: {
    hireDecision: string;
    overallScore: number;
    technicalScore: number;
    communicationScore: number;
    problemSolvingScore: number;
  };
  createdAt: string;
}

export default function InterviewHubPage() {
  const router = useRouter();

  // Configuration state
  const [targetCompany, setTargetCompany] = useState("Google");
  const [roleTitle, setRoleTitle] = useState("Senior Software Engineer (L5)");
  const [topic, setTopic] = useState("Data Structures & Algorithms");
  const [difficulty, setDifficulty] = useState("Medium");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [interviewerPersona, setInterviewerPersona] = useState("Alex (Staff SWE)");

  // Hardware pre-flight state
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Past interviews
  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      stopMediaTracks();
    };
  }, []);

  const stopMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.get("/interviews");
      if (res.data.success && Array.isArray(res.data.data)) {
        setPastInterviews(res.data.data);
      }
    } catch (err) {
      console.warn("Could not load past interviews:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Hardware pre-flight test
  const testHardware = async () => {
    try {
      setErrorMsg(null);
      stopMediaTracks();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360 },
        audio: true
      });

      mediaStreamRef.current = stream;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      setCameraActive(true);
      setMicActive(true);

      // Setup audio analyzer for volume meter
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err: any) {
      console.error("Hardware test failed:", err);
      setErrorMsg("Camera or microphone permission was denied. You can still proceed, but interactive video/voice will be simulated.");
      setCameraActive(false);
      setMicActive(false);
    }
  };

  const startInterview = async () => {
    setIsLaunching(true);
    setErrorMsg(null);
    stopMediaTracks();

    try {
      const res = await api.post("/interviews", {
        targetCompany,
        roleTitle,
        topic,
        difficulty,
        durationMinutes,
        interviewerName: interviewerPersona
      });

      if (res.data.success && res.data.data?.interviewId) {
        router.push(`/interview/${res.data.data.interviewId}`);
      } else {
        throw new Error(res.data.message || "Failed to initialize interview");
      }
    } catch (err: any) {
      console.error("Launch error:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed to launch interview session.");
      setIsLaunching(false);
    }
  };

  const companies = [
    { name: "Google", color: "from-blue-600 to-emerald-500", style: "Algorithmic & Rigorous" },
    { name: "Meta", color: "from-blue-500 to-indigo-600", style: "Speed & Scale" },
    { name: "Amazon", color: "from-amber-500 to-orange-600", style: "LP & Systems" },
    { name: "Microsoft", color: "from-cyan-500 to-blue-600", style: "Clean Architecture" },
    { name: "Apple", color: "from-zinc-400 to-zinc-600", style: "Efficiency & Precision" },
    { name: "AI Unicorn", color: "from-purple-500 to-pink-600", style: "Modern & Pragmatic" }
  ];

  const roles = [
    "Junior Software Engineer (L3)",
    "Software Engineer (L4)",
    "Senior Software Engineer (L5)",
    "Staff Software Engineer (L6)",
    "Frontend Specialist",
    "Systems & Distributed Architect"
  ];

  const personas = [
    {
      name: "Alex (Staff SWE)",
      company: "Google",
      focus: "Algorithmic correctness, Big-O trade-offs, and boundary edge cases.",
      badge: "Analytical & Socratic"
    },
    {
      name: "Sarah (Engineering Lead)",
      company: "Meta",
      focus: "Communication clarity, modular abstractions, and systematic decomposition.",
      badge: "Encouraging & Structured"
    },
    {
      name: "Marcus (Principal Architect)",
      company: "Amazon",
      focus: "Production scalability, fault tolerance, and clean error handling.",
      badge: "High-Bar & Rigorous"
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-zinc-100 py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/30 via-zinc-950 to-indigo-950/30 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                Next-Gen FAANG Interview Prep Arena
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
                Conversational <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">AI Mock Interviewer</span>
              </h1>
              <p className="text-sm md:text-base text-zinc-400 max-w-2xl leading-relaxed">
                Step into a high-stakes, real-time technical screen with live voice conversation, webcam behavioral telemetry, screen sharing, and continuous code inspection powered by Gemini.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Live Multimodal AI Ready
              </div>
              <div className="text-[11px] text-zinc-400">Gemini 2.5 Flash Voice Engine</div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Configuration Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Setup Options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Target Company */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" /> Target Company
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {companies.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setTargetCompany(c.name)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      targetCompany === c.name
                        ? "border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40"
                        : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-bold text-sm text-white">{c.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-1">{c.style}</div>
                    {targetCompany === c.name && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role & Level */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" /> Target Role & Seniority
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRoleTitle(r)}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                      roleTitle === r
                        ? "border-cyan-500 bg-cyan-950/20 text-cyan-300 font-semibold"
                        : "border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic, Difficulty & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Topic */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Topic Domain</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Data Structures & Algorithms">Data Structures & Algo</option>
                  <option value="Dynamic Programming & Optimization">Dynamic Programming</option>
                  <option value="Tree & Graph Traversals">Trees & Graphs</option>
                  <option value="System Design & Architecture">System Design</option>
                  <option value="Concurrency & Thread Safety">Concurrency</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Difficulty</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["Easy", "Medium", "Hard"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        difficulty === d
                          ? d === "Easy"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : d === "Medium"
                            ? "bg-amber-500/20 border-amber-500 text-amber-300"
                            : "bg-rose-500/20 border-rose-500 text-rose-300"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Duration
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[15, 30, 45, 60].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(m)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        durationMinutes === m
                          ? "border-cyan-500 bg-cyan-950/20 text-cyan-300"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400"
                      }`}
                    >
                      {m} Min
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interviewer Persona Selection */}
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" /> Interviewer Persona
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {personas.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setInterviewerPersona(p.name)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      interviewerPersona === p.name
                        ? "border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/40"
                        : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{p.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                        {p.company}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2">{p.focus}</p>
                    <div className="text-[10px] text-cyan-400 font-medium mt-2 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {p.badge}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Hardware Check & Launch Terminal */}
          <div className="space-y-6">
            {/* Hardware Pre-flight Check */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-cyan-400" /> Hardware Pre-flight Check
                </h3>
                <button
                  type="button"
                  onClick={testHardware}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 border border-zinc-700 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Test Hardware
                </button>
              </div>

              {/* Video Preview Box */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />
                {!cameraActive && (
                  <div className="text-center p-4 space-y-2">
                    <Video className="w-8 h-8 mx-auto text-zinc-600" />
                    <p className="text-xs text-zinc-500">Camera preview inactive</p>
                    <button
                      type="button"
                      onClick={testHardware}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-600/30 transition-colors"
                    >
                      Enable Camera & Mic
                    </button>
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Camera Active
                  </div>
                )}
              </div>

              {/* Microphone Volume Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-cyan-400" /> Mic Input Level:
                  </span>
                  <span className="font-mono text-cyan-300 font-bold">{micVolume}%</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-400 transition-all duration-75"
                    style={{ width: `${micVolume}%` }}
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${cameraActive ? "text-emerald-400" : "text-zinc-600"}`} />
                  <span>Webcam live feed ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${micActive ? "text-emerald-400" : "text-zinc-600"}`} />
                  <span>Microphone speech recognition active</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Screen sharing ready for code inspection</span>
                </div>
              </div>

              {/* Launch Action */}
              <button
                type="button"
                onClick={startInterview}
                disabled={isLaunching}
                className="w-full py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-950/50 border border-cyan-400/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isLaunching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initializing Interview Arena...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
                    Enter Live Interview Arena ({durationMinutes}m)
                  </>
                )}
              </button>
            </div>

            {/* Quick Tips */}
            <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-2xl p-5 space-y-2 text-xs text-cyan-200/80">
              <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Interviewer Tips
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-400">
                <li>Think out loud before typing—the AI evaluates your communication clarity.</li>
                <li>State your time and space complexity ($O(N)$ Big-O) early.</li>
                <li>You can ask the AI interviewer for hints or code reviews anytime.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Past Mock Interviews Dashboard */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" /> Past Mock Interviews & Scorecards
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Review past sessions, interviewer evaluations, and track your hire decision progression.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchHistory}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="text-center py-12 text-xs text-zinc-500">Loading interview records...</div>
          ) : pastInterviews.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl space-y-2">
              <Bot className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-semibold text-zinc-400">No mock interviews completed yet</p>
              <p className="text-xs text-zinc-500">Configure your parameters above to take your first FAANG mock screen!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase font-mono text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Company & Role</th>
                    <th className="py-3 px-4">Problem</th>
                    <th className="py-3 px-4">Interviewer</th>
                    <th className="py-3 px-4">Score & Verdict</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {pastInterviews.map((inv) => {
                    const sc = inv.scorecard;
                    const isHire = sc?.hireDecision === "STRONG_HIRE" || sc?.hireDecision === "HIRE";
                    return (
                      <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{inv.targetCompany}</div>
                          <div className="text-[11px] text-zinc-400">{inv.roleTitle}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-cyan-300">{inv.problemTitle || "Algorithmic Screen"}</span>
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {inv.difficulty}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300 font-mono text-[11px]">
                          {inv.interviewerName}
                        </td>
                        <td className="py-3.5 px-4">
                          {sc ? (
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase border ${
                                  isHire
                                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                }`}
                              >
                                {sc.hireDecision.replace("_", " ")}
                              </span>
                              <span className="font-bold font-mono text-white text-xs">{sc.overallScore}/100</span>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-[11px]">In Progress</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={sc ? `/interview/scorecard/${inv.id}` : `/interview/${inv.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-600/30 text-cyan-300 border border-zinc-700 hover:border-cyan-500 text-xs font-semibold transition-all"
                          >
                            {sc ? "View Scorecard" : "Resume"} <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
