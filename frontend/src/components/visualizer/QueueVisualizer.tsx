"use client";

import React from "react";
import { ArrowLeft, ArrowRight, GitCommit } from "lucide-react";

export interface VisualQueueProps {
  queues?: Array<{
    id: string;
    name: string;
    items: Array<{ value: any; label?: string }>;
  }>;
}

export default function QueueVisualizer({ queues = [] }: VisualQueueProps) {
  if (!queues || queues.length === 0) return null;

  return (
    <div className="space-y-4">
      {queues.map((q) => {
        const items = q.items || [];

        return (
          <div key={q.id} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-emerald-400 rotate-90" />
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  Queue: <span className="text-emerald-300">{q.name}</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Count: <strong className="text-emerald-300">{items.length}</strong>
              </span>
            </div>

            {/* Horizontal Queue Pipeline */}
            <div className="py-4 overflow-x-auto">
              <div className="flex items-center justify-center gap-3 min-w-fit px-4">
                {/* Dequeue / Head Arrow */}
                <div className="flex flex-col items-center shrink-0 text-emerald-400">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                    [Head / Dequeue]
                  </span>
                  <div className="p-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    <ArrowLeft className="w-4 h-4 animate-pulse" />
                  </div>
                </div>

                {/* Queue Chamber Box */}
                <div className="border-y-2 border-emerald-500/40 rounded-lg p-2.5 bg-gradient-to-r from-emerald-950/20 via-zinc-900/60 to-emerald-950/20 flex items-center gap-2 min-w-[200px] min-h-[64px]">
                  {items.length === 0 ? (
                    <div className="flex-1 text-center text-zinc-600 font-mono text-[11px] italic">
                      (Queue Empty)
                    </div>
                  ) : (
                    items.map((it, idx) => {
                      const isFront = idx === 0;
                      const isRear = idx === items.length - 1;

                      return (
                        <div
                          key={idx}
                          className={`px-3 py-2 shrink-0 rounded-xl border font-mono font-bold text-xs flex flex-col items-center justify-center transition-all duration-300 ${
                            isFront
                              ? "bg-emerald-900/40 border-emerald-400 text-white shadow-md shadow-emerald-950/50 ring-2 ring-emerald-400/40 scale-105"
                              : isRear
                              ? "bg-zinc-800/90 border-cyan-500/50 text-cyan-200"
                              : "bg-zinc-900/90 border-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span className="text-sm">{it.value}</span>
                          <span className="text-[8px] text-zinc-400 font-normal">
                            {isFront ? "Front" : isRear ? "Rear" : `#${idx}`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Enqueue / Tail Arrow */}
                <div className="flex flex-col items-center shrink-0 text-cyan-400">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider mb-1">
                    [Tail / Enqueue]
                  </span>
                  <div className="p-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                    <ArrowLeft className="w-4 h-4 rotate-180 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center font-mono text-[10px] text-zinc-500">
              First-In, First-Out (FIFO) · Elements enter at Tail and exit at Head
            </div>
          </div>
        );
      })}
    </div>
  );
}
