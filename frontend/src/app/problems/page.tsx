"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Search, Filter, Code2 } from "lucide-react"; // <-- Added Code2 here!

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id-asc"); // Default requested by user

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get("/problems");
        if (res.data?.success) setProblems(res.data.data);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchProblems();
  }, []);

  // Map difficulty to numeric weights for accurate sorting
  const diffWeight: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };

  // Calculate the filtered and sorted list
  const filteredAndSortedProblems = problems
    .filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "id-asc") return Number(a.id) - Number(b.id);
      if (sortBy === "id-desc") return Number(b.id) - Number(a.id);
      if (sortBy === "diff-asc") return diffWeight[a.difficulty] - diffWeight[b.difficulty] || Number(a.id) - Number(b.id);
      if (sortBy === "diff-desc") return diffWeight[b.difficulty] - diffWeight[a.difficulty] || Number(a.id) - Number(b.id);
      return 0;
    });

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono">Loading Catalog...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Title */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-indigo-400 mb-2">
            <Code2 className="h-8 w-8" /> Coding Challenges
          </h1>
          <p className="text-zinc-400">Master algorithms and data structures</p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search problem title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-10 text-sm font-semibold text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="id-asc">Sort: ID (Ascending)</option>
              <option value="id-desc">Sort: ID (Descending)</option>
              <option value="diff-asc">Sort: Difficulty (Easy first)</option>
              <option value="diff-desc">Sort: Difficulty (Hard first)</option>
            </select>
          </div>
        </div>

        {/* Problems Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-xs font-bold uppercase text-zinc-500">
              <tr>
                <th className="p-4 w-16 text-center">ID</th>
                <th className="p-4">Title</th>
                <th className="p-4 w-32">Difficulty</th>
                <th className="p-4 w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-sm">
              {filteredAndSortedProblems.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900 transition-colors group">
                  <td className="p-4 text-center font-mono text-zinc-500">{p.id}</td>
                  <td className="p-4 font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                    {p.title}
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded border 
                      ${p.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        p.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}
                    >
                      {p.difficulty}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => router.push(`/problems/${p.slug}`)}
                      className="bg-zinc-800 hover:bg-indigo-600 text-white font-bold py-1.5 px-4 rounded transition-colors text-xs inline-flex items-center gap-2"
                    >
                       Solve
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAndSortedProblems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500 font-mono">
                    No problems match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}