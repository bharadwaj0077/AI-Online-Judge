"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Trophy, Calendar, Clock, ChevronRight } from "lucide-react";

export default function ContestsPage() {
  const router = useRouter();
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await api.get("/contests");
        if (res.data?.success) {
          // FILTER: Only keep contests where the End Time is in the future
          const now = new Date().getTime();
          const activeAndUpcoming = res.data.data.filter((c: any) => new Date(c.endTime).getTime() > now);
          setContests(activeAndUpcoming);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 font-mono">Loading Contests...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-8 md:p-12">
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-10">
          <h1 className="text-4xl font-bold flex items-center gap-3 text-yellow-500 mb-2">
            <Trophy className="h-8 w-8" /> Contest Arenas
          </h1>
          <p className="text-zinc-400">Compete live against global engineers and climb rankings</p>
        </div>

        {contests.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center">
            <h3 className="text-xl font-bold text-zinc-300 mb-2">No Active Contests</h3>
            <p className="text-zinc-500">Check back later for upcoming coding challenges!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {contests.map((c) => {
              const isStarted = new Date(c.startTime).getTime() <= new Date().getTime();
              
              return (
                <div key={c.id} className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 transition-all rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-1 rounded-full bg-indigo-500 mb-4" />
                      {isStarted ? (
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded">LIVE NOW</span>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded">UPCOMING</span>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">{c.title}</h2>
                    <p className="text-sm text-zinc-400 mb-6 line-clamp-2">{c.description}</p>
                    
                    <div className="flex flex-col gap-2 text-xs font-mono text-zinc-500 mb-8 border-t border-zinc-800 pt-4">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Starts: {new Date(c.startTime).toLocaleString()}</div>
                      <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Ends: {new Date(c.endTime).toLocaleString()}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push(`/contests/${c.publicId}`)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
                  >
                    Start Contest <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}