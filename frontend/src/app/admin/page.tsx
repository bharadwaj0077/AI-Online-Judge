"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  
  // --- USERS STATE ---
  const [users, setUsers] = useState<any[]>([]);

  // --- CONTEST STATE ---
  const [contests, setContests] = useState<any[]>([]);
  const [contestForm, setContestForm] = useState<{ title: string; description: string; start_time: string; end_time: string; problemIds: string[] }>({ 
    title: "", description: "", start_time: "", end_time: "", problemIds: [] 
  });

  // --- PROBLEM STATE ---
  const [probTab, setProbTab] = useState("create");
  const [problemsList, setProblemsList] = useState<any[]>([]);
  const [probForm, setProbForm] = useState({
    title: "", difficulty: "EASY", timeLimitMs: 2000, memoryLimitMb: 256,
    statement: "", constraintsText: "", referenceSolution: "class Solution:\n    def solve(self, *args):\n        pass",
    templates: { python3: "", cpp17: "", java17: "", javascript: "" }
  });
  
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isSample: true }]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "contests") { loadContests(); loadProblems(); }
    if (activeTab === "problems" && probTab === "manage") loadProblems();
  }, [activeTab, probTab]);

  const loadUsers = async () => {
    try { const res = await api.get("/admin/users"); setUsers(res.data.data); } catch (err) {}
  };

  const promoteUser = async (id: string) => {
    if(!confirm("Are you sure you want to promote this user to Admin?")) return;
    try {
      await api.patch(`/admin/users/${id}/promote`);
      alert("User promoted to Admin!");
      loadUsers();
    } catch (err) { alert("Failed to promote user."); }
  };

  const loadContests = async () => {
    try { const res = await api.get("/contests"); setContests(res.data.data); } catch (err) {}
  };

  const loadProblems = async () => {
    try { const res = await api.get("/problems"); setProblemsList(res.data.data); } catch (err) {}
  };

  const handleCreateContest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/contests", contestForm);
      alert("Contest Created Successfully!");
      setContestForm({ title: "", description: "", start_time: "", end_time: "", problemIds: [] });
      loadContests();
    } catch (err) { alert("Failed to create contest."); }
  };

  const handleDeleteContest = async (id: string) => {
    if(!confirm("Are you sure you want to delete this contest?")) return;
    try {
      await api.delete(`/contests/${id}`);
      alert("Contest deleted.");
      loadContests();
    } catch (err) { alert("Failed to delete contest."); }
  };

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/problems", { ...probForm, testCases });
      alert("Problem Created Successfully!");
      setProbForm({...probForm, title: "", statement: "", referenceSolution: ""});
      setTestCases([{ input: "", expectedOutput: "", isSample: true }]);
    } catch (err) { alert("Failed to create problem."); }
  };

  const handleDeleteProblem = async (id: string) => {
    if(!confirm("Are you sure you want to delete this problem?")) return;
    try {
      await api.delete(`/problems/${id}`);
      alert("Problem deleted.");
      loadProblems();
    } catch (err) { alert("Failed to delete."); }
  };

  const updateTemplate = (lang: string, value: string) => {
    setProbForm(prev => ({ ...prev, templates: { ...prev.templates, [lang]: value } }));
  };

  const toggleProblemSelection = (pId: string) => {
    setContestForm(prev => {
      const exists = prev.problemIds.includes(pId);
      if (exists) return { ...prev, problemIds: prev.problemIds.filter(id => id !== pId) };
      return { ...prev, problemIds: [...prev.problemIds, pId] };
    });
  };

  const getContestStatus = (start: string, end: string) => {
      const now = new Date(); const s = new Date(start); const e = new Date(end);
      if (now < s) return { label: "Upcoming", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
      if (now >= s && now <= e) return { label: "Active", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
      return { label: "Expired", color: "text-zinc-400 bg-zinc-800 border-zinc-700" };
  };

  return (
    <div className="p-8 bg-zinc-950 min-h-screen text-white font-sans">
      <h1 className="text-3xl font-bold mb-6 text-indigo-400">Admin Control Panel</h1>
      
      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-2">
        {["users", "problems", "contests"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`uppercase font-bold text-sm pb-2 ${activeTab === tab ? "text-indigo-400 border-b-2 border-indigo-400" : "text-zinc-500 hover:text-zinc-300"}`}>
            {tab} Management
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="space-y-4 max-w-5xl">
          <h2 className="text-xl font-semibold">Registered Users</h2>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
                <tr><th className="p-4">Username</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Solved</th><th className="p-4">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map(u => (
                  <tr key={u.id} className="bg-zinc-950 hover:bg-zinc-900/50">
                    <td className="p-4 font-bold">{u.username}</td><td className="p-4 text-zinc-400">{u.email}</td>
                    <td className="p-4"><span className={`px-2 py-1 text-[10px] rounded font-bold ${u.role === "ADMIN" ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>{u.role}</span></td>
                    <td className="p-4 text-emerald-400 font-bold">{u.problemsSolved}</td>
                    <td className="p-4">
                      {u.role !== "ADMIN" && (
                        <button onClick={() => promoteUser(u.id)} className="bg-indigo-600 hover:bg-indigo-500 text-xs px-3 py-1.5 rounded font-bold transition-colors">Promote to Admin</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTESTS TAB */}
      {activeTab === "contests" && (
        <div className="grid grid-cols-2 gap-8">
          <form onSubmit={handleCreateContest} className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Host New Contest</h2>
            <input required placeholder="Contest Title" value={contestForm.title} onChange={e => setContestForm({...contestForm, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm focus:border-indigo-500" />
            <textarea placeholder="Description" rows={3} value={contestForm.description} onChange={e => setContestForm({...contestForm, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm focus:border-indigo-500" />
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Start Time</label><input required type="datetime-local" value={contestForm.start_time} onChange={e => setContestForm({...contestForm, start_time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm focus:border-indigo-500 [color-scheme:dark]" /></div>
              <div className="flex-1"><label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">End Time</label><input required type="datetime-local" value={contestForm.end_time} onChange={e => setContestForm({...contestForm, end_time: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm focus:border-indigo-500 [color-scheme:dark]" /></div>
            </div>

            <div className="pt-2">
                <label className="text-xs font-bold text-zinc-400 mb-2 block uppercase">Select Problems for Contest</label>
                <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-950 p-2 space-y-1">
                    {problemsList.map(p => (
                        <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-zinc-900 rounded cursor-pointer transition-colors">
                            <input type="checkbox" checked={contestForm.problemIds.includes(p.id)} onChange={() => toggleProblemSelection(p.id)} className="accent-indigo-500 w-4 h-4 cursor-pointer" />
                            <span className="text-sm font-semibold">{p.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{p.difficulty}</span>
                        </label>
                    ))}
                    {problemsList.length === 0 && <p className="text-xs text-zinc-500 p-2">No problems available. Create some first.</p>}
                </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded font-bold mt-4 shadow-lg shadow-indigo-600/20">Schedule Contest</button>
          </form>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Manage Contests</h2>
            {contests.map(c => {
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
                    className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-sm"
                  >
                    Delete Contest
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROBLEMS TAB */}
      {activeTab === "problems" && (
        <div className="space-y-6 max-w-4xl pb-20">
          <div className="flex bg-zinc-900/50 w-fit p-1 rounded-lg border border-zinc-800">
            <button onClick={() => setProbTab("create")} className={`px-4 py-1.5 text-sm font-bold rounded-md ${probTab === "create" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Create Problem</button>
            <button onClick={() => setProbTab("manage")} className={`px-4 py-1.5 text-sm font-bold rounded-md ${probTab === "manage" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Manage Existing</button>
          </div>

          {probTab === "create" ? (
             <form onSubmit={handleCreateProblem} className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-zinc-500 block mb-1">Problem Title</label>
                      <input required placeholder="e.g. Find Max Value" value={probForm.title} onChange={e => setProbForm({...probForm, title: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm focus:border-indigo-500" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-zinc-500 block mb-1">Difficulty</label>
                      <select value={probForm.difficulty} onChange={e => setProbForm({...probForm, difficulty: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm focus:border-indigo-500">
                          <option value="EASY">EASY</option><option value="MEDIUM">MEDIUM</option><option value="HARD">HARD</option>
                      </select>
                  </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Problem Statement (Markdown Supported)</label>
                    <textarea required rows={5} placeholder="Use **bold**, `code`, and headers..." value={probForm.statement} onChange={e => setProbForm({...probForm, statement: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm font-mono focus:border-indigo-500" />
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1">Constraints</label>
                    <input value={probForm.constraintsText} onChange={e => setProbForm({...probForm, constraintsText: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded outline-none p-3 text-sm font-mono focus:border-indigo-500" placeholder="1 <= nums.length <= 10^5" />
                </div>

                <div className="border border-indigo-500/30 p-4 rounded-xl bg-indigo-500/5">
                    <label className="text-xs font-bold text-indigo-400 block mb-1">Reference Solution (Python 3) - Ground Truth for execution</label>
                    <textarea required rows={5} value={probForm.referenceSolution} onChange={e => setProbForm({...probForm, referenceSolution: e.target.value})} className="w-full bg-[#1e1e1e] border border-zinc-700 rounded outline-none p-3 text-sm font-mono text-emerald-400" />
                    
                    <label className="text-xs font-bold text-zinc-400 block mb-1 mt-4">Editor Templates (Optional - Defaults will be applied if empty)</label>
                    <div className="grid grid-cols-2 gap-4">
                        <textarea placeholder="Python 3 Default Template..." rows={3} value={probForm.templates.python3} onChange={e => updateTemplate("python3", e.target.value)} className="w-full bg-[#1e1e1e] border border-zinc-800 rounded p-2 text-xs font-mono outline-none text-zinc-300" />
                        <textarea placeholder="C++ 17 Default Template..." rows={3} value={probForm.templates.cpp17} onChange={e => updateTemplate("cpp17", e.target.value)} className="w-full bg-[#1e1e1e] border border-zinc-800 rounded p-2 text-xs font-mono outline-none text-zinc-300" />
                        <textarea placeholder="Java 17 Default Template..." rows={3} value={probForm.templates.java17} onChange={e => updateTemplate("java17", e.target.value)} className="w-full bg-[#1e1e1e] border border-zinc-800 rounded p-2 text-xs font-mono outline-none text-zinc-300" />
                        <textarea placeholder="JS Default Template..." rows={3} value={probForm.templates.javascript} onChange={e => updateTemplate("javascript", e.target.value)} className="w-full bg-[#1e1e1e] border border-zinc-800 rounded p-2 text-xs font-mono outline-none text-zinc-300" />
                    </div>
                </div>
                
                <div className="border border-zinc-800 p-5 rounded-xl bg-zinc-950">
                  <div className="flex justify-between mb-4">
                      <h3 className="font-bold text-zinc-300">Test Cases</h3>
                      <button type="button" onClick={() => setTestCases([...testCases, {input:"", expectedOutput:"", isSample:true}])} className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition-colors">+ Add Case</button>
                  </div>
                  
                  {testCases.map((tc, i) => (
                      <div key={i} className="flex flex-col gap-2 mb-3 bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80">
                        <div className="flex gap-3">
                          <textarea placeholder="Input arguments (newline separated)" value={tc.input} onChange={e => {const t=[...testCases]; t[i].input=e.target.value; setTestCases(t)}} className="flex-1 bg-zinc-950 border border-zinc-800 rounded outline-none p-2 text-xs font-mono focus:border-indigo-500" rows={2}/>
                          <textarea placeholder="Expected Output" value={tc.expectedOutput} onChange={e => {const t=[...testCases]; t[i].expectedOutput=e.target.value; setTestCases(t)}} className="flex-1 bg-zinc-950 border border-zinc-800 rounded outline-none p-2 text-xs font-mono focus:border-indigo-500" rows={2}/>
                          {testCases.length > 1 && (
                            <button type="button" onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))} className="text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 px-3 rounded-lg font-bold">✖</button>
                          )}
                        </div>
                        
                        <label className="flex items-center gap-2 cursor-pointer w-fit mt-1">
                          <input 
                            type="checkbox" 
                            checked={!tc.isSample} 
                            onChange={e => {
                              const updated = testCases.map((item, idx) => 
                                idx === i ? { ...item, isSample: !e.target.checked } : item
                              );
                              setTestCases(updated);
                            }} 
                            className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer" 
                          />
                          <span className={`text-[11px] font-bold ${!tc.isSample ? "text-rose-400" : "text-zinc-500"}`}>
                            {!tc.isSample ? "🔒 Hidden Test Case (Evaluated on Submit)" : "👁️ Visible Sample Case"}
                          </span>
                        </label>
                      </div>
                  ))}
                </div>
                
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded font-bold shadow-lg shadow-orange-600/20 transition-all">
                  Deploy Problem to Database
                </button>
             </form>
          ) : (
             <div className="bg-zinc-900/40 p-6 rounded-xl border border-zinc-800">
                <h2 className="text-xl font-semibold mb-4">Manage Active Problems</h2>
                <div className="space-y-2">
                  {problemsList.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                      <div>
                        <h4 className="font-bold text-zinc-200">{p.title}</h4>
                        <p className="text-xs text-zinc-500 mt-1">Difficulty: {p.difficulty} | Slug: {p.slug}</p>
                      </div>
                      <button onClick={() => handleDeleteProblem(p.id)} className="bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white px-4 py-2 rounded text-xs font-bold transition-all">
                        Delete Problem
                      </button>
                    </div>
                  ))}
                  {problemsList.length === 0 && <p className="text-sm text-zinc-500">No active problems found.</p>}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}