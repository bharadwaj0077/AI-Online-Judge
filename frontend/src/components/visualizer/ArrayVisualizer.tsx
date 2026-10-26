"use client";

import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export interface VisualArrayProps {
  arrays?: Array<{
    id: string;
    name: string;
    elements: Array<{
      value: any;
      status?: "default" | "active" | "matched" | "swapping" | "visited";
      label?: string;
    }>;
  }>;
  pointers?: Array<{
    name: string;
    arrayId: string;
    index: number;
    color?: string;
    label?: string;
  }>;
}

export default function ArrayVisualizer({ arrays = [], pointers = [] }: VisualArrayProps) {
  if (!arrays || arrays.length === 0) return null;

  return (
    <div className="space-y-6">
      {arrays.map((arr) => {
        // Collect pointers targeting this array
        const arrayPointers = pointers.filter((p) => p.arrayId === arr.id || p.arrayId === arr.name || pointers.length <= 2);

        // Group pointers by top and bottom placement to avoid visual collision
        const topPointers = arrayPointers.filter((_, idx) => idx % 2 === 0);
        const bottomPointers = arrayPointers.filter((_, idx) => idx % 2 === 1);

        return (
          <div key={arr.id} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  Array: <span className="text-cyan-300">{arr.name}</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Length: <strong className="text-zinc-300">{arr.elements.length}</strong>
              </span>
            </div>

            {/* Scrollable Array Canvas Container */}
            <div className="overflow-x-auto pb-4 pt-2">
              <div className="min-w-fit flex flex-col items-start gap-1">
                {/* Top Pointers Layer */}
                <div className="flex items-end gap-2 h-8 relative w-full px-1">
                  {arr.elements.map((_, idx) => {
                    const pointing = topPointers.filter((p) => p.index === idx);
                    return (
                      <div key={idx} className="w-14 shrink-0 flex flex-col items-center justify-end">
                        {pointing.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex flex-col items-center animate-bounce [animation-duration:1.2s]"
                          >
                            <span
                              className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded shadow-sm text-black uppercase"
                              style={{ backgroundColor: p.color || "#38bdf8" }}
                            >
                              {p.name}
                            </span>
                            <ArrowDown
                              className="w-3.5 h-3.5"
                              style={{ color: p.color || "#38bdf8" }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Array Memory Boxes Layer */}
                <div className="flex items-center gap-2 px-1">
                  {arr.elements.map((el, idx) => {
                    let boxStyle = "border-zinc-800 bg-zinc-900/80 text-zinc-200";

                    if (el.status === "matched") {
                      boxStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/30 scale-105 shadow-md shadow-emerald-950/50";
                    } else if (el.status === "active") {
                      boxStyle = "border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-400/30 scale-105 shadow-md shadow-cyan-950/50";
                    } else if (el.status === "swapping") {
                      boxStyle = "border-purple-500 bg-purple-950/40 text-purple-300 ring-2 ring-purple-500/30 animate-pulse";
                    } else if (el.status === "visited") {
                      boxStyle = "border-indigo-800 bg-indigo-950/20 text-indigo-300";
                    }

                    return (
                      <div
                        key={idx}
                        className={`w-14 h-14 shrink-0 rounded-xl border flex flex-col items-center justify-center font-mono transition-all duration-300 ${boxStyle}`}
                      >
                        <span className="font-extrabold text-sm tracking-tight">{el.value}</span>
                        {el.label && (
                          <span className="text-[9px] text-zinc-400 truncate max-w-[50px]">{el.label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Index Labels Layer */}
                <div className="flex items-center gap-2 px-1 mt-1">
                  {arr.elements.map((_, idx) => (
                    <div
                      key={idx}
                      className="w-14 shrink-0 text-center font-mono text-[10px] text-zinc-500"
                    >
                      [{idx}]
                    </div>
                  ))}
                </div>

                {/* Bottom Pointers Layer */}
                <div className="flex items-start gap-2 h-8 relative w-full px-1">
                  {arr.elements.map((_, idx) => {
                    const pointing = bottomPointers.filter((p) => p.index === idx);
                    return (
                      <div key={idx} className="w-14 shrink-0 flex flex-col items-center justify-start">
                        {pointing.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex flex-col items-center animate-bounce [animation-duration:1.2s]"
                          >
                            <ArrowUp
                              className="w-3.5 h-3.5"
                              style={{ color: p.color || "#f43f5e" }}
                            />
                            <span
                              className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded shadow-sm text-white uppercase"
                              style={{ backgroundColor: p.color || "#f43f5e" }}
                            >
                              {p.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
