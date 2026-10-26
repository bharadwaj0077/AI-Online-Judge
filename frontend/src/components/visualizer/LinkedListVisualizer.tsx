"use client";

import React from "react";
import { ArrowRight, ArrowDown, ArrowUp, Link2 } from "lucide-react";

export interface VisualLinkedListNode {
  id: string;
  value: any;
  nextId?: string | null;
  status?: "default" | "active" | "matched" | "reversed" | "visited";
  label?: string;
}

export interface VisualLinkedList {
  id: string;
  name: string;
  headId: string;
  nodes: VisualLinkedListNode[];
  pointers?: Array<{
    name: string;
    targetNodeId: string;
    color?: string;
    label?: string;
  }>;
}

export interface VisualLinkedListProps {
  linkedLists?: VisualLinkedList[];
}

export default function LinkedListVisualizer({ linkedLists = [] }: VisualLinkedListProps) {
  if (!linkedLists || linkedLists.length === 0) return null;

  return (
    <div className="space-y-6">
      {linkedLists.map((list) => {
        const nodes = list.nodes || [];
        const pointers = list.pointers || [];

        // Order nodes starting from headId by traversing nextId
        const nodeMap = new Map<string, VisualLinkedListNode>();
        nodes.forEach((n) => nodeMap.set(String(n.id), n));

        const orderedNodes: VisualLinkedListNode[] = [];
        const visitedIds = new Set<string>();
        let currId: string | null | undefined = list.headId || (nodes[0]?.id ? String(nodes[0].id) : null);

        while (currId && nodeMap.has(currId) && !visitedIds.has(currId)) {
          visitedIds.add(currId);
          const node = nodeMap.get(currId)!;
          orderedNodes.push(node);
          currId = node.nextId ? String(node.nextId) : null;
        }

        // If any disconnected nodes remain, append them
        nodes.forEach((n) => {
          if (!visitedIds.has(String(n.id))) {
            orderedNodes.push(n);
          }
        });

        // Group pointers targeting each node
        const topPointers = pointers.filter((_, idx) => idx % 2 === 0);
        const bottomPointers = pointers.filter((_, idx) => idx % 2 === 1);

        return (
          <div key={list.id} className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-emerald-400" />
                <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
                  Singly Linked List: <span className="text-emerald-300">{list.name || "head"}</span>
                </h4>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Nodes Count: <strong className="text-emerald-300">{orderedNodes.length}</strong>
              </span>
            </div>

            {/* Scrollable Chain Container */}
            <div className="overflow-x-auto pb-4 pt-2">
              <div className="min-w-fit flex flex-col items-start gap-1">
                {/* Top Pointers Layer */}
                <div className="flex items-end gap-3 h-8 relative w-full px-2">
                  {orderedNodes.map((node) => {
                    const pointing = topPointers.filter((p) => String(p.targetNodeId) === String(node.id));

                    return (
                      <div key={node.id} className="flex items-center gap-3">
                        <div className="w-20 shrink-0 flex flex-col items-center justify-end">
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
                        {/* Spacing for arrow gap */}
                        <div className="w-6 shrink-0" />
                      </div>
                    );
                  })}
                  {/* NULL block gap */}
                  <div className="w-14 shrink-0" />
                </div>

                {/* Nodes & Arrows Chain Layer */}
                <div className="flex items-center gap-3 px-2">
                  {orderedNodes.map((node, idx) => {
                    let nodeStyle = "border-zinc-800 bg-zinc-900/80 text-zinc-200";

                    if (node.status === "active") {
                      nodeStyle = "border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-2 ring-cyan-400/40 scale-105 shadow-md shadow-cyan-950/50";
                    } else if (node.status === "reversed") {
                      nodeStyle = "border-purple-400 bg-purple-950/40 text-purple-200 ring-2 ring-purple-400/30";
                    } else if (node.status === "matched") {
                      nodeStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-2 ring-emerald-500/30";
                    } else if (node.status === "visited") {
                      nodeStyle = "border-indigo-800 bg-indigo-950/30 text-indigo-300";
                    }

                    return (
                      <React.Fragment key={node.id}>
                        {/* Node Box with [ Val | Next ] split compartments */}
                        <div
                          className={`w-20 h-14 shrink-0 rounded-xl border flex overflow-hidden font-mono transition-all duration-300 ${nodeStyle}`}
                        >
                          {/* Value Compartment */}
                          <div className="w-12 h-full flex flex-col items-center justify-center border-r border-zinc-800/80 bg-black/20">
                            <span className="font-extrabold text-sm">{node.value}</span>
                            <span className="text-[8px] text-zinc-500">val</span>
                          </div>
                          {/* Pointer Dot Compartment */}
                          <div className="flex-1 h-full flex flex-col items-center justify-center bg-black/40">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[8px] text-zinc-500">next</span>
                          </div>
                        </div>

                        {/* Arrow Link to Next */}
                        <div className="w-6 shrink-0 flex items-center justify-center text-zinc-500">
                          <ArrowRight className="w-5 h-5 text-zinc-400 animate-pulse" />
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* Terminal NULL Badge */}
                  <div className="w-14 h-10 shrink-0 rounded-xl border border-rose-500/40 bg-rose-950/20 text-rose-400 font-mono font-bold text-xs flex items-center justify-center shadow-inner">
                    NULL
                  </div>
                </div>

                {/* Bottom Pointers Layer */}
                <div className="flex items-start gap-3 h-8 relative w-full px-2 mt-1">
                  {orderedNodes.map((node) => {
                    const pointing = bottomPointers.filter((p) => String(p.targetNodeId) === String(node.id));

                    return (
                      <div key={node.id} className="flex items-center gap-3">
                        <div className="w-20 shrink-0 flex flex-col items-center justify-start">
                          {pointing.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex flex-col items-center animate-bounce [animation-duration:1.2s]"
                            >
                              <ArrowUp
                                className="w-3.5 h-3.5"
                                style={{ color: p.color || "#10b981" }}
                              />
                              <span
                                className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded shadow-sm text-white uppercase"
                                style={{ backgroundColor: p.color || "#10b981" }}
                              >
                                {p.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        {/* Spacing for arrow gap */}
                        <div className="w-6 shrink-0" />
                      </div>
                    );
                  })}
                  <div className="w-14 shrink-0" />
                </div>
              </div>
            </div>

            <div className="text-center font-mono text-[10px] text-zinc-500">
              Singly Linked Nodes · Memory references linked sequentially to terminal NULL
            </div>
          </div>
        );
      })}
    </div>
  );
}
