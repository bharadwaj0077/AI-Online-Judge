"use client";

import React from "react";
import { ArrowLeft, Layers } from "lucide-react";

export interface VisualStackProps {
  stacks?: Array<{
    id: string;
    name: string;
    items: Array<{ value: any; label?: string }>;
  }>;
}

export default function StackVisualizer({ stacks = [] }: VisualStackProps) {
  if (!stacks || stacks.length === 0) return null;

  return (
    <div className="space-y-4">
      {stacks.map((stk) => {
        const items = stk.items || [];

        return (
          <div key={stk.id} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  Stack: <span className="text-purple-300">{stk.name}</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Size: <strong className="text-purple-300">{items.length}</strong>
              </span>
            </div>

            {/* Vertical Stack Canister Container */}
            <div className="flex items-end justify-center py-4">
              <div className="relative min-w-[140px] max-w-[200px] border-x-2 border-b-2 border-purple-500/50 rounded-b-xl p-2 bg-gradient-to-t from-purple-950/20 to-transparent flex flex-col-reverse gap-1.5 min-h-[160px] max-h-[260px] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 font-mono text-[11px] italic">
                    (Stack Empty)
                  </div>
                ) : (
                  items.map((it, idx) => {
                    const isTop = idx === items.length - 1;

                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg border font-mono font-extrabold text-xs flex items-center justify-between transition-all duration-300 ${
                          isTop
                            ? "bg-purple-900/40 border-purple-400 text-white shadow-md shadow-purple-950/50 ring-1 ring-purple-400/40 scale-[1.02]"
                            : "bg-zinc-900/80 border-zinc-800 text-zinc-300"
                        }`}
                      >
                        <span>{it.value}</span>
                        {isTop && (
                          <div className="flex items-center gap-1 text-[9px] text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-400/30">
                            <ArrowLeft className="w-2.5 h-2.5" />
                            <span>TOP</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="text-center font-mono text-[10px] text-zinc-500">
              Last-In, First-Out (LIFO) · Elements push &amp; pop from Top
            </div>
          </div>
        );
      })}
    </div>
  );
}
