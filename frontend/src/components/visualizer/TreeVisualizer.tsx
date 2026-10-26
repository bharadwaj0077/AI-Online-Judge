"use client";

import React from "react";
import { GitFork } from "lucide-react";

export interface VisualTreeNode {
  id: string;
  value: any;
  leftId?: string | null;
  rightId?: string | null;
  status?: "default" | "active" | "visited" | "matched";
  label?: string;
}

export interface VisualTreeProps {
  trees?: Array<{
    rootId: string;
    name?: string;
    nodes: VisualTreeNode[];
  }>;
}

interface PositionedNode extends VisualTreeNode {
  x: number;
  y: number;
  level: number;
}

export default function TreeVisualizer({ trees = [] }: VisualTreeProps) {
  if (!trees || trees.length === 0) return null;

  return (
    <div className="space-y-6">
      {trees.map((t, tIdx) => {
        const nodesMap = new Map<string, VisualTreeNode>();
        (t.nodes || []).forEach((n) => nodesMap.set(String(n.id), n));

        // Calculate positions using simple recursive tree layout
        const positionedNodes: PositionedNode[] = [];
        const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

        const assignPositions = (
          nodeId: string | null | undefined,
          x: number,
          y: number,
          spread: number,
          level: number
        ) => {
          if (!nodeId || !nodesMap.has(String(nodeId))) return;
          const node = nodesMap.get(String(nodeId))!;

          positionedNodes.push({
            ...node,
            x,
            y,
            level
          });

          const childY = y + 70;
          const childSpread = Math.max(30, spread / 2);

          if (node.leftId && nodesMap.has(String(node.leftId))) {
            const childX = x - spread;
            edges.push({ x1: x, y1: y + 18, x2: childX, y2: childY - 18 });
            assignPositions(node.leftId, childX, childY, childSpread, level + 1);
          }

          if (node.rightId && nodesMap.has(String(node.rightId))) {
            const childX = x + spread;
            edges.push({ x1: x, y1: y + 18, x2: childX, y2: childY - 18 });
            assignPositions(node.rightId, childX, childY, childSpread, level + 1);
          }
        };

        const rootId = t.rootId || (t.nodes && t.nodes[0]?.id);
        const svgWidth = 440;
        const svgHeight = 240;
        if (rootId) {
          assignPositions(rootId, svgWidth / 2, 40, 90, 0);
        }

        return (
          <div key={tIdx} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-400 rotate-180" />
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  Binary Tree: <span className="text-amber-300">{t.name || "Tree Structure"}</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Nodes: <strong className="text-amber-300">{t.nodes?.length || 0}</strong>
              </span>
            </div>

            {/* Tree SVG Visualization Canvas */}
            <div className="overflow-x-auto flex justify-center py-2">
              <svg width={svgWidth} height={svgHeight} className="overflow-visible">
                {/* Tree Edges (Branches) */}
                {edges.map((edge, idx) => (
                  <line
                    key={idx}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke="#52525b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="transition-all duration-300"
                  />
                ))}

                {/* Tree Nodes */}
                {positionedNodes.map((n) => {
                  let fill = "#18181b";
                  let stroke = "#3f3f46";
                  let textColor = "#f4f4f5";

                  if (n.status === "active") {
                    fill = "#083344";
                    stroke = "#22d3ee";
                    textColor = "#67e8f9";
                  } else if (n.status === "matched") {
                    fill = "#064e3b";
                    stroke = "#34d399";
                    textColor = "#a7f3d0";
                  } else if (n.status === "visited") {
                    fill = "#312e81";
                    stroke = "#818cf8";
                    textColor = "#c7d2fe";
                  }

                  return (
                    <g key={n.id} className="cursor-pointer transition-all duration-300">
                      {n.status === "active" && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r="25"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="2"
                          opacity="0.5"
                          className="animate-ping"
                        />
                      )}
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r="18"
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="2"
                        className="transition-all duration-300 drop-shadow-md"
                      />
                      <text
                        x={n.x}
                        y={n.y + 4}
                        textAnchor="middle"
                        fill={textColor}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {String(n.value)}
                      </text>
                      {n.label && (
                        <text
                          x={n.x}
                          y={n.y + 30}
                          textAnchor="middle"
                          fill="#a1a1aa"
                          fontSize="9"
                          fontFamily="monospace"
                        >
                          {n.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="text-center font-mono text-[10px] text-zinc-500">
              Hierarchical Graph Traversal · Cyan ring denotes currently active node frame
            </div>
          </div>
        );
      })}
    </div>
  );
}
