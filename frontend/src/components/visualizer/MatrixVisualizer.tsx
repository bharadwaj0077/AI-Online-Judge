"use client";

import React from "react";
import { Grid } from "lucide-react";

export interface VisualMatrixProps {
  matrices?: Array<{
    id: string;
    name: string;
    rows: number;
    cols: number;
    data: any[][];
    activeCell?: [number, number];
  }>;
}

export default function MatrixVisualizer({ matrices = [] }: VisualMatrixProps) {
  if (!matrices || matrices.length === 0) return null;

  return (
    <div className="space-y-4">
      {matrices.map((mat) => {
        const rows = mat.data || [];
        const activeR = mat.activeCell ? mat.activeCell[0] : -1;
        const activeC = mat.activeCell ? mat.activeCell[1] : -1;

        return (
          <div key={mat.id} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-sky-400" />
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  2D Matrix: <span className="text-sky-300">{mat.name}</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Dimensions: <strong className="text-sky-300">{mat.rows} × {mat.cols}</strong>
              </span>
            </div>

            {/* 2D Grid Table */}
            <div className="overflow-x-auto py-2">
              <div className="min-w-fit flex flex-col items-center">
                {/* Column Index Header */}
                <div className="flex items-center gap-1.5 mb-1 pl-8">
                  {rows[0]?.map((_, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-11 text-center font-mono text-[10px] text-zinc-500"
                    >
                      c={cIdx}
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                {rows.map((row, rIdx) => (
                  <div key={rIdx} className="flex items-center gap-1.5 mb-1.5">
                    {/* Row Index Header */}
                    <div className="w-6 text-right pr-2 font-mono text-[10px] text-zinc-500">
                      r={rIdx}
                    </div>

                    {/* Row Cells */}
                    {row.map((val, cIdx) => {
                      const isActive = rIdx === activeR && cIdx === activeC;

                      return (
                        <div
                          key={cIdx}
                          className={`w-11 h-11 shrink-0 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? "bg-sky-500/30 border-sky-400 text-white ring-2 ring-sky-400/50 scale-110 shadow-lg shadow-sky-950/60"
                              : "bg-zinc-900/80 border-zinc-800 text-zinc-300"
                          }`}
                        >
                          {String(val)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center font-mono text-[10px] text-zinc-500">
              Dynamic Programming State Space · Active cell coordinates: [{activeR}, {activeC}]
            </div>
          </div>
        );
      })}
    </div>
  );
}
