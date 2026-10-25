"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Eye,
  Lock,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Edit3,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Code,
  FileText,
  Sliders,
  ChevronRight
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("problems");

  // --- USERS STATE ---
  const [users, setUsers] = useState<any[]>([]);

  // --- CONTEST STATE ---
  const [contests, setContests] = useState<any[]>([]);
  const [contestForm, setContestForm] = useState<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    problemIds: string[];
  }>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    problemIds: []
  });

  // --- PROBLEM STATE ---
  const [probTab, setProbTab] = useState<"create" | "manage">("manage");
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(false);
  const [isSavingProblem, setIsSavingProblem] = useState(false);
  const [isGeneratingAiCases, setIsGeneratingAiCases] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Filters & Tabs
  const [statementTab, setStatementTab] = useState<"edit" | "preview">("edit");
  const [templateLang, setTemplateLang] = useState<"python3" | "cpp17" | "java17" | "javascript">("python3");
  const [probSearch, setProbSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  const [probForm, setProbForm] = useState({
    title: "",
    difficulty: "EASY",
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    statement: "",
    constraintsText: "",
    referenceSolution: "class Solution:\n    def solve(self, *args):\n        pass",
    templates: {
      python3: "class Solution:\n    def solve(self, *args):\n        pass",
      cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    void solve() {\n    }\n};",
      java17: "import java.util.*;\nclass Solution {\n    public void solve() {\n    }\n}",
      javascript: "class Solution {\n    solve(...args) {\n    }\n}"
    }
  });

  const [testCases, setTestCases] = useState<Array<{ input: string; expectedOutput: string; isSample: boolean }>>([
    { input: "nums = [2, 7, 11, 15]\ntarget = 9", expectedOutput: "[0, 1]", isSample: true },
    { input: "nums = [3, 2, 4]\ntarget = 6", expectedOutput: "[1, 2]", isSample: true },
    { input: "nums = [3, 3]\ntarget = 6", expectedOutput: "[0, 1]", isSample: false },
    { input: "nums = [-1, -2, -3, -4, -5]\ntarget = -8", expectedOutput: "[2, 4]", isSample: false },
    { input: "nums = [0, 4, 3, 0]\ntarget = 0", expectedOutput: "[0, 3]", isSample: false }
  ]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "contests") {
      loadContests();
      loadProblems();
    }
    if (activeTab === "problems") loadProblems();
  }, [activeTab]);

  const showNotice = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.data);
    } catch {}
  };

  const promoteUser = async (id: string) => {
    if (!confirm("Are you sure you want to promote this user to Admin?")) return;
    try {
      await api.patch(`/admin/users/${id}/promote`);
      showNotice("success", "User promoted to Administrator!");
      loadUsers();
    } catch {
      showNotice("error", "Failed to promote user.");
    }
  };

  const loadContests = async () => {
    try {
      const res = await api.get("/contests");
      setContests(res.data.data);
    } catch {}
  };

  const loadProblems = async () => {
    try {
      const res = await api.get("/problems");
      setProblemsList(res.data.data);
    } catch {}
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/contests", contestForm);
      showNotice("success", "Contest Scheduled Successfully!");
      setContestForm({ title: "", description: "", start_time: "", end_time: "", problemIds: [] });
      loadContests();
    } catch {
      showNotice("error", "Failed to schedule contest.");
    }
  };

  const handleDeleteContest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contest?")) return;
    try {
      await api.delete(`/contests/${id}`);
      showNotice("success", "Contest deleted.");
      loadContests();
    } catch {
      showNotice("error", "Failed to delete contest.");
    }
  };

  // --- PROBLEM CRUD OPERATIONS ---

  const handleStartEditProblem = async (problemId: string) => {
    setIsLoadingProblem(true);
    try {
      const res = await api.get(`/admin/problems/${problemId}`);
      const data = res.data.data;
      setProbForm({
        title: data.title || "",
        difficulty: data.difficulty || "EASY",
        timeLimitMs: data.timeLimitMs || 2000,
        memoryLimitMb: data.memoryLimitMb || 256,
        statement: data.statement || "",
        constraintsText: data.constraintsText || "",
        referenceSolution: data.referenceSolution || "class Solution:\n    def solve(self, *args):\n        pass",
        templates: {
          python3: data.templates?.python3 || "class Solution:\n    def solve(self, *args):\n        pass",
          cpp17: data.templates?.cpp17 || "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    void solve() {\n    }\n};",
          java17: data.templates?.java17 || "import java.util.*;\nclass Solution {\n    public void solve() {\n    }\n}",
          javascript: data.templates?.javascript || "class Solution {\n    solve(...args) {\n    }\n}"
        }
      });
      setTestCases(
        (data.testCases || []).map((tc: any) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: tc.isSample === true
        }))
      );
      setEditingProblemId(problemId);
      setProbTab("create");
      window.scrollTo({ top: 0, behavior: "smooth" });
      showNotice("success", `Editing "${data.title}" (ID: ${problemId})`);
    } catch (err: any) {
      showNotice("error", "Failed to load problem details for editing.");
    } finally {
      setIsLoadingProblem(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProblemId(null);
    setProbForm({
      title: "",
      difficulty: "EASY",
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      statement: "",
      constraintsText: "",
      referenceSolution: "class Solution:\n    def solve(self, *args):\n        pass",
      templates: {
        python3: "class Solution:\n    def solve(self, *args):\n        pass",
        cpp17: "#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    void solve() {\n    }\n};",
        java17: "import java.util.*;\nclass Solution {\n    public void solve() {\n    }\n}",
        javascript: "class Solution {\n    solve(...args) {\n    }\n}"
      }
    });
    setTestCases([
      { input: "", expectedOutput: "", isSample: true },
      { input: "", expectedOutput: "", isSample: true },
      { input: "", expectedOutput: "", isSample: false }
    ]);
  };

  const handleSaveProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probForm.title.trim()) {
      showNotice("error", "Problem title is required.");
      return;
    }
    if (!probForm.statement.trim()) {
      showNotice("error", "Problem statement is required.");
      return;
    }

    const sampleCount = testCases.filter((t) => t.isSample).length;
    if (sampleCount === 0) {
      if (!confirm("Warning: You have 0 sample test cases. Students will not see any visible test cases in the workspace tabs. Proceed anyway?")) {
        return;
      }
    }

    setIsSavingProblem(true);
    try {
      if (editingProblemId) {
        // UPDATE
        await api.put(`/problems/${editingProblemId}`, {
          ...probForm,
          testCases
        });
        showNotice("success", `Problem "${probForm.title}" updated successfully with ${testCases.length} test cases!`);
        handleCancelEdit();
        loadProblems();
        setProbTab("manage");
      } else {
        // CREATE
        await api.post("/problems", {
          ...probForm,
          testCases
        });
        showNotice("success", `Problem "${probForm.title}" created successfully with ${testCases.length} test cases!`);
        handleCancelEdit();
        loadProblems();
        setProbTab("manage");
      }
    } catch (err: any) {
      showNotice("error", err.response?.data?.message || "Failed to save problem.");
    } finally {
      setIsSavingProblem(false);
    }
  };

  const handleDeleteProblem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete problem "${title}"? This will archive the problem.`)) return;
    try {
      await api.delete(`/problems/${id}`);
      showNotice("success", `Problem "${title}" deleted successfully.`);
      loadProblems();
    } catch {
      showNotice("error", "Failed to delete problem.");
    }
  };

  // --- AI TEST CASE GENERATION ---

  const handleGenerateAiTestCases = async () => {
    if (!probForm.title.trim() || !probForm.statement.trim()) {
      alert("Please provide at least a Problem Title and Problem Statement first so AI can generate accurate test cases.");
      return;
    }

    setIsGeneratingAiCases(true);
    try {
      const res = await api.post("/admin/problems/generate-testcases", {
        title: probForm.title,
        statement: probForm.statement,
        difficulty: probForm.difficulty
      });
      const generated = res.data?.data?.testCases;
      if (Array.isArray(generated) && generated.length > 0) {
        setTestCases(generated);
        const sampleCount = generated.filter((c: any) => c.isSample).length;
        const hiddenCount = generated.filter((c: any) => !c.isSample).length;
        showNotice("success", `✨ AI successfully generated ${generated.length} test cases (${sampleCount} sample, ${hiddenCount} hidden)!`);
      } else {
        showNotice("error", "AI testcase generation returned empty results.");
      }
    } catch (err: any) {
      showNotice("error", "AI testcase generation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsGeneratingAiCases(false);
    }
  };

  // --- TESTCASE BUILDER HELPERS ---

  const addTestCase = (isSample: boolean) => {
    setTestCases((prev) => [...prev, { input: "", expectedOutput: "", isSample }]);
  };

  const cloneTestCase = (index: number) => {
    setTestCases((prev) => {
      const copy = [...prev];
      const target = copy[index];
      copy.splice(index + 1, 0, { ...target });
      return copy;
    });
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, idx) => idx !== index));
  };

  const moveTestCase = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === testCases.length - 1) return;
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    setTestCases((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  const toggleTestCaseType = (index: number) => {
    setTestCases((prev) =>
      prev.map((tc, idx) => (idx === index ? { ...tc, isSample: !tc.isSample } : tc))
    );
  };

  const updateTestCaseField = (index: number, field: "input" | "expectedOutput", val: string) => {
    setTestCases((prev) =>
      prev.map((tc, idx) => (idx === index ? { ...tc, [field]: val } : tc))
    );
  };

  const updateTemplate = (lang: string, value: string) => {
    setProbForm((prev) => ({
      ...prev,
      templates: { ...prev.templates, [lang]: value }
    }));
  };

  const toggleProblemSelection = (pId: string) => {
    setContestForm((prev) => {
      const exists = prev.problemIds.includes(pId);
      if (exists) return { ...prev, problemIds: prev.problemIds.filter((id) => id !== pId) };
      return { ...prev, problemIds: [...prev.problemIds, pId] };
    });
  };

  const getContestStatus = (start: string, end: string) => {
    const now = new Date();
    const s = new Date(start);
    const e = new Date(end);
    if (now < s) return { label: "Upcoming", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
    if (now >= s && now <= e) return { label: "Active", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
    return { label: "Expired", color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
  };

  // Filter problems for manage list
  const filteredProblems = problemsList.filter((p) => {
    const matchesSearch =
      probSearch === "" ||
      p.title.toLowerCase().includes(probSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(probSearch.toLowerCase()) ||
      p.id.toString().includes(probSearch);
    const matchesDiff = difficultyFilter === "ALL" || p.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const sampleCount = testCases.filter((t) => t.isSample).length;
  const hiddenCount = testCases.filter((t) => !t.isSample).length;

  return (
    <div className="p-6 md:p-10 bg-zinc-950 min-h-screen text-white font-sans antialiased">
      {/* HEADER NOTIFICATION TOAST */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/80 border-rose-500/40 text-rose-200"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span className="text-sm font-semibold">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Admin Portal
            </span>
            <span className="text-xs text-zinc-500 font-mono">v2.5 Production</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 text-white">
            Control Center <span className="text-indigo-400">&amp; Problem Studio</span>
          </h1>
        </div>

        {/* TOP LEVEL NAVIGATION TABS */}
        <div className="flex bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800 shadow-inner">
          {[
            { id: "problems", label: "Problems Studio", count: problemsList.length },
            { id: "contests", label: "Contests", count: contests.length },
            { id: "users", label: "Users", count: users.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PROBLEMS STUDIO TAB                                                       */}
      {/* ========================================================================= */}
      {activeTab === "problems" && (
        <div className="space-y-6 max-w-6xl">
          {/* PROBLEM SUB-NAV: CREATE/EDIT VS MANAGE */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-2 rounded-2xl border border-zinc-800/80">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setProbTab("create");
                  if (!editingProblemId) handleCancelEdit();
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  probTab === "create"
                    ? editingProblemId
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                {editingProblemId ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Editing Problem #{editingProblemId}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Problem</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setProbTab("manage")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  probTab === "manage"
                    ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Browse &amp; Manage</span>
                <span className="bg-zinc-950 px-2 py-0.5 rounded-full text-[10px] text-zinc-400 font-mono">
                  {problemsList.length}
                </span>
              </button>
            </div>

            {editingProblemId && probTab === "create" && (
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700 transition-colors w-fit"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Editing &amp; New Problem</span>
              </button>
            )}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* TAB CONTENT: CREATE / EDIT FORM                               */}
          {/* ------------------------------------------------------------- */}
          {probTab === "create" && (
            <form onSubmit={handleSaveProblem} className="space-y-6">
              {/* EDITING ALERT BANNER */}
              {editingProblemId && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Edit3 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-300">
                        Editing Existing Problem: <span className="text-white">{probForm.title || `#${editingProblemId}`}</span>
                      </p>
                      <p className="text-xs text-amber-400/80 mt-0.5">
                        Saving will update problem metadata and synchronize all sample and hidden test cases in the database.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                  >
                    Discard &amp; Switch to New
                  </button>
                </div>
              )}

              {/* CARD 1: GENERAL METADATA & DIFFICULTY */}
              <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-5">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                    1. Problem Overview &amp; Execution Limits
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* TITLE */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-zinc-400 block mb-1.5">
                      Problem Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      placeholder="e.g. Trapping Rain Water, Two Sum II"
                      value={probForm.title}
                      onChange={(e) => setProbForm({ ...probForm, title: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none px-4 py-3 text-sm focus:border-indigo-500 transition-colors font-medium text-white placeholder-zinc-600"
                    />
                    {probForm.title && (
                      <p className="text-[11px] text-zinc-500 font-mono mt-1.5">
                        Slug: /problems/
                        <span className="text-indigo-400">
                          {probForm.title
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/(^-|-$)/g, "")}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* DIFFICULTY */}
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1.5">Difficulty Tier</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "EASY", color: "hover:border-emerald-500 active:bg-emerald-500/10", active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" },
                        { label: "MEDIUM", color: "hover:border-amber-500 active:bg-amber-500/10", active: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
                        { label: "HARD", color: "hover:border-rose-500 active:bg-rose-500/10", active: "bg-rose-500/20 text-rose-300 border-rose-500/50" }
                      ].map((d) => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => setProbForm({ ...probForm, difficulty: d.label })}
                          className={`py-2.5 rounded-xl text-xs font-extrabold border transition-all ${
                            probForm.difficulty === d.label
                              ? d.active
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 " + d.color
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LIMITS & CONSTRAINTS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1.5">
                      Execution Time Limit (ms)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={15000}
                      step={100}
                      value={probForm.timeLimitMs}
                      onChange={(e) => setProbForm({ ...probForm, timeLimitMs: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none px-4 py-2.5 text-sm font-mono focus:border-indigo-500"
                    />
                    <div className="flex gap-2 mt-2">
                      {[1000, 2000, 5000].map((ms) => (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => setProbForm({ ...probForm, timeLimitMs: ms })}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                            probForm.timeLimitMs === ms
                              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {ms}ms
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1.5">
                      Memory Limit (MB)
                    </label>
                    <input
                      type="number"
                      min={32}
                      max={1024}
                      step={32}
                      value={probForm.memoryLimitMb}
                      onChange={(e) => setProbForm({ ...probForm, memoryLimitMb: Number(e.target.value) })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none px-4 py-2.5 text-sm font-mono focus:border-indigo-500"
                    />
                    <div className="flex gap-2 mt-2">
                      {[128, 256, 512].map((mb) => (
                        <button
                          key={mb}
                          type="button"
                          onClick={() => setProbForm({ ...probForm, memoryLimitMb: mb })}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono border ${
                            probForm.memoryLimitMb === mb
                              ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                              : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {mb}MB
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1.5">
                      Algorithmic Constraints
                    </label>
                    <input
                      placeholder="1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4"
                      value={probForm.constraintsText}
                      onChange={(e) => setProbForm({ ...probForm, constraintsText: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none px-4 py-2.5 text-xs font-mono focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-zinc-500 mt-2">Shown below the problem statement for asymptotic boundaries.</p>
                  </div>
                </div>
              </div>

              {/* CARD 2: STATEMENT WITH LIVE MARKDOWN PREVIEW */}
              <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                      2. Problem Statement (Markdown Supported)
                    </h3>
                  </div>

                  {/* EDIT VS PREVIEW TOGGLE */}
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setStatementTab("edit")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
                        statementTab === "edit" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Write Markdown</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatementTab("preview")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-colors ${
                        statementTab === "preview" ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                </div>

                {statementTab === "edit" ? (
                  <div>
                    <textarea
                      required
                      rows={8}
                      placeholder="Enter the problem statement using Markdown:&#10;&#10;Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.&#10;&#10;### Example 1:&#10;- **Input:** nums = [2,7,11,15], target = 9&#10;- **Output:** [0,1]"
                      value={probForm.statement}
                      onChange={(e) => setProbForm({ ...probForm, statement: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none p-4 text-xs font-mono leading-relaxed focus:border-indigo-500 text-zinc-200"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">Supports Markdown headings, code blocks (`inline code`), lists, and bold text.</p>
                  </div>
                ) : (
                  <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/80 min-h-[200px] max-h-[350px] overflow-y-auto">
                    {probForm.statement.trim() ? (
                      <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed space-y-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{probForm.statement}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-xs italic">No statement entered yet. Switch to "Write Markdown" to add content.</p>
                    )}
                  </div>
                )}
              </div>

              {/* CARD 3: REFERENCE SOLUTION & STARTER TEMPLATES */}
              <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                    3. Reference Solution &amp; Multi-Language Starter Templates
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-emerald-400 block mb-1">
                    Python 3 Reference Solution (Ground Truth for Execution &amp; Verification)
                  </label>
                  <textarea
                    rows={6}
                    value={probForm.referenceSolution}
                    onChange={(e) => setProbForm({ ...probForm, referenceSolution: e.target.value })}
                    className="w-full bg-[#121214] border border-emerald-500/30 rounded-xl outline-none p-3.5 text-xs font-mono text-emerald-300 focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-zinc-400 block">
                      Editor Starter Templates (What students see when they open the problem)
                    </label>
                    <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      {(["python3", "cpp17", "java17", "javascript"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setTemplateLang(lang)}
                          className={`px-3 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                            templateLang === lang ? "bg-indigo-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {lang === "python3" ? "Python 3" : lang === "cpp17" ? "C++ 17" : lang === "java17" ? "Java 17" : "JavaScript"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={5}
                    value={probForm.templates[templateLang]}
                    onChange={(e) => updateTemplate(templateLang, e.target.value)}
                    placeholder={`Starter code for ${templateLang}...`}
                    className="w-full bg-[#121214] border border-zinc-800 rounded-xl outline-none p-3.5 text-xs font-mono text-zinc-300 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* CARD 4: INTERACTIVE TEST CASE BUILDER */}
              <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                        4. Interactive Test Case Suite
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      Configure exactly 2 visible sample cases for the workspace tabs, plus difficulty-scaled secret hidden cases for judging.
                    </p>
                  </div>

                  {/* SUMMARY BADGES */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-bold bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono">
                      Total: {testCases.length}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
                        sampleCount === 2
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                          : "bg-amber-500/10 border-amber-500/40 text-amber-300"
                      }`}
                    >
                      👁️ Sample: {sampleCount} / 2
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-bold font-mono bg-purple-500/10 border border-purple-500/40 text-purple-300">
                      🔒 Hidden: {hiddenCount}
                    </span>
                  </div>
                </div>

                {/* ACTION TOOLBAR: AI GENERATOR + ADD BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={handleGenerateAiTestCases}
                    disabled={isGeneratingAiCases}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingAiCases ? "animate-spin" : ""}`} />
                    <span>{isGeneratingAiCases ? "Generating Test Cases with AI..." : "✨ Auto-Generate Test Cases with AI"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => addTestCase(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Sample Case</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addTestCase(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Hidden Case</span>
                    </button>
                  </div>
                </div>

                {/* TEST CASES LIST */}
                <div className="space-y-4">
                  {testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border transition-all ${
                        tc.isSample
                          ? "bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-500/50"
                          : "bg-purple-950/10 border-purple-500/30 hover:border-purple-500/50"
                      } p-4`}
                    >
                      {/* CARD HEADER */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/60">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-bold text-zinc-400">#{idx + 1}</span>

                          {/* TOGGLE PILL */}
                          <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                            <button
                              type="button"
                              onClick={() => {
                                if (!tc.isSample) toggleTestCaseType(idx);
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                                tc.isSample
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>Sample (Visible in UI)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (tc.isSample) toggleTestCaseType(idx);
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                                !tc.isSample
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              <span>Hidden (Judge on Submit)</span>
                            </button>
                          </div>
                        </div>

                        {/* CARD ACTIONS */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title="Move Up"
                            onClick={() => moveTestCase(idx, "up")}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            onClick={() => moveTestCase(idx, "down")}
                            disabled={idx === testCases.length - 1}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Clone Test Case"
                            onClick={() => cloneTestCase(idx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {testCases.length > 1 && (
                            <button
                              type="button"
                              title="Delete Test Case"
                              onClick={() => removeTestCase(idx)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* INPUT & EXPECTED OUTPUT FIELDS */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            Input Arguments <span className="text-zinc-600 font-mono">(stdin / arguments)</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="nums = [2, 7, 11, 15]&#10;target = 9"
                            value={tc.input}
                            onChange={(e) => updateTestCaseField(idx, "input", e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl outline-none p-3 text-xs font-mono text-zinc-200 focus:border-indigo-500 leading-relaxed"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                            Expected Output <span className="text-zinc-600 font-mono">(exact return value)</span>
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder="[0, 1]"
                            value={tc.expectedOutput}
                            onChange={(e) => updateTestCaseField(idx, "expectedOutput", e.target.value)}
                            className="w-full bg-[#0a0a0c] border border-zinc-800 rounded-xl outline-none p-3 text-xs font-mono text-zinc-200 focus:border-indigo-500 leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {testCases.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-sm text-zinc-500">No test cases configured yet.</p>
                      <button
                        type="button"
                        onClick={() => addTestCase(true)}
                        className="mt-3 text-xs font-bold text-indigo-400 hover:underline"
                      >
                        + Add your first sample test case
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* STICKY BOTTOM SAVE ACTION BAR */}
              <div className="sticky bottom-6 z-30 bg-zinc-900/90 backdrop-blur-xl p-4 rounded-2xl border border-zinc-800 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 font-medium">
                    {editingProblemId ? (
                      <>Ready to apply changes to problem <b className="text-white">#{editingProblemId}</b></>
                    ) : (
                      <>Ready to publish new problem to catalog</>
                    )}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs font-mono text-zinc-400">
                    {sampleCount} sample / {hiddenCount} hidden test cases
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {editingProblemId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingProblem}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-xl transition-all ${
                      editingProblemId
                        ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                        : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                    } disabled:opacity-50 cursor-pointer`}
                  >
                    {isSavingProblem ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Problem...</span>
                      </>
                    ) : editingProblemId ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Update Problem</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Publish Problem to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB CONTENT: BROWSE & MANAGE PROBLEMS                         */}
          {/* ------------------------------------------------------------- */}
          {probTab === "manage" && (
            <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-6">
              {/* SEARCH & DIFFICULTY FILTER BAR */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                {/* SEARCH INPUT */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    placeholder="Search by title, slug, or ID..."
                    value={probSearch}
                    onChange={(e) => setProbSearch(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
                  />
                  {probSearch && (
                    <button
                      onClick={() => setProbSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* DIFFICULTY FILTER PILLS */}
                <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  {["ALL", "EASY", "MEDIUM", "HARD"].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setDifficultyFilter(tier)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        difficultyFilter === tier
                          ? tier === "EASY"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : tier === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : tier === "HARD"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-zinc-800 text-white"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                {/* REFRESH BUTTON */}
                <button
                  onClick={loadProblems}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* PROBLEMS LIST */}
              <div className="space-y-3">
                {filteredProblems.map((p) => {
                  const sampleCount = p.sampleCasesCount ?? 2;
                  const hiddenCount = p.hiddenCasesCount ?? 0;
                  const totalCount = p.testCasesCount ?? sampleCount + hiddenCount;

                  return (
                    <div
                      key={p.id}
                      className="bg-zinc-950/80 hover:bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-zinc-500">#{p.id}</span>
                          <h4 className="font-bold text-zinc-100 text-sm hover:text-indigo-300 transition-colors truncate">
                            {p.title}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                              p.difficulty === "EASY"
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : p.difficulty === "MEDIUM"
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            {p.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-zinc-500">
                          <span className="font-mono text-[11px] text-zinc-400">slug: {p.slug}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-zinc-400">{p.timeLimitMs}ms / {p.memoryLimitMb}MB</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[11px] text-indigo-400">
                            <Layers className="w-3 h-3" />
                            {sampleCount} Sample • {hiddenCount} Hidden ({totalCount} Total Cases)
                          </span>
                        </div>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleStartEditProblem(p.id)}
                          disabled={isLoadingProblem}
                          className="flex items-center gap-1.5 bg-indigo-600/15 text-indigo-300 hover:bg-indigo-600 hover:text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-indigo-500/30 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Problem</span>
                        </button>

                        <a
                          href={`/problems/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border border-zinc-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </a>

                        <button
                          onClick={() => handleDeleteProblem(p.id, p.title)}
                          className="flex items-center gap-1 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredProblems.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
                    <p className="text-sm text-zinc-500">No problems found matching your search.</p>
                    {probSearch && (
                      <button
                        onClick={() => {
                          setProbSearch("");
                          setDifficultyFilter("ALL");
                        }}
                        className="mt-2 text-xs font-bold text-indigo-400 hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTESTS TAB                                                              */}
      {/* ========================================================================= */}
      {activeTab === "contests" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
          <form onSubmit={handleCreateContest} className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h2 className="text-lg font-bold text-zinc-200 mb-2">Host New Contest</h2>
            <input
              required
              placeholder="Contest Title (e.g. Weekly Contest 42)"
              value={contestForm.title}
              onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none p-3 text-sm focus:border-indigo-500"
            />
            <textarea
              placeholder="Contest Description & Rules..."
              rows={3}
              value={contestForm.description}
              onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none p-3 text-sm focus:border-indigo-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">Start Time</label>
                <input
                  required
                  type="datetime-local"
                  value={contestForm.start_time}
                  onChange={(e) => setContestForm({ ...contestForm, start_time: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none p-3 text-sm focus:border-indigo-500 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 mb-1 block uppercase">End Time</label>
                <input
                  required
                  type="datetime-local"
                  value={contestForm.end_time}
                  onChange={(e) => setContestForm({ ...contestForm, end_time: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl outline-none p-3 text-sm focus:border-indigo-500 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold text-zinc-400 mb-2 block uppercase">Select Problems for Contest</label>
              <div className="max-h-56 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-950 p-2 space-y-1">
                {problemsList.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={contestForm.problemIds.includes(p.id)}
                      onChange={() => toggleProblemSelection(p.id)}
                      className="accent-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm font-semibold">{p.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{p.difficulty}</span>
                  </label>
                ))}
                {problemsList.length === 0 && <p className="text-xs text-zinc-500 p-2">No problems available.</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold mt-4 shadow-lg shadow-indigo-600/20 text-white cursor-pointer"
            >
              Schedule Contest
            </button>
          </form>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-200">Scheduled Contests</h2>
            {contests.map((c) => {
              const status = getContestStatus(c.startTime, c.endTime);
              return (
                <div key={c.id} className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-zinc-200">{c.title}</h4>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      {new Date(c.startTime).toLocaleString()} - {new Date(c.endTime).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {c.publicId}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteContest(c.id)}
                    className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Delete Contest
                  </button>
                </div>
              );
            })}
            {contests.length === 0 && <p className="text-sm text-zinc-500">No scheduled contests.</p>}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USERS TAB                                                                 */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4 max-w-5xl">
          <h2 className="text-lg font-bold text-zinc-200">Registered Users &amp; Roles</h2>
          <div className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/40">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Solved</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="bg-zinc-950 hover:bg-zinc-900/50">
                    <td className="p-4 font-bold">{u.username}</td>
                    <td className="p-4 text-zinc-400 font-mono text-xs">{u.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] rounded-md font-bold ${
                          u.role === "ADMIN" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-emerald-400 font-bold font-mono">{u.problemsSolved}</td>
                    <td className="p-4">
                      {u.role !== "ADMIN" && (
                        <button
                          onClick={() => promoteUser(u.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-xs px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Promote to Admin
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}