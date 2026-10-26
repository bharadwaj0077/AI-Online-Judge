"use client";

import React from "react";
import { Terminal } from "lucide-react";

export interface VariablesHudProps {
  variables?: Record<string, any>;
}

export default function VariablesHud({ variables = {} }: VariablesHudProps) {
  const entries = Object.entries(variables || {});
  if (entries.length === 0) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-md">
      <div className="flex items-center gap-2 mb-2.5">
        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-mono font-bold text-[11px] text-zinc-300 uppercase tracking-wider">
          Active Scope Variables
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {entries.map(([key, val]) => {
          let formattedVal = typeof val === "object" ? JSON.stringify(val) : String(val);
          if (typeof val === "boolean") {
            formattedVal = val ? "True" : "False";
          }

          return (
            <div
              key={key}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center gap-2 font-mono text-xs shadow-inner"
            >
              <span className="text-zinc-400 font-semibold">{key}:</span>
              <span className="font-extrabold text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {formattedVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
