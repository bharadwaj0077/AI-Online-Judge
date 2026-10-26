"use client";

import React from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FastForward,
  Sparkles,
  Code
} from "lucide-react";

export interface ExecutionControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1, 2
  activeLineNumber?: number;
  actionType?: string;
  explanation?: string;
  onStepChange: (index: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function ExecutionControls({
  currentStepIndex,
  totalSteps,
  isPlaying,
  playbackSpeed,
  activeLineNumber,
  actionType = "INIT",
  explanation = "",
  onStepChange,
  onTogglePlay,
  onSpeedChange
}: ExecutionControlsProps) {
  const canGoBack = currentStepIndex > 0;
  const canGoForward = currentStepIndex < totalSteps - 1;

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "COMPARE":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "SWAP":
        return "bg-purple-500/20 text-purple-300 border-purple-500/40";
      case "POINTER_MOVE":
        return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
      case "PUSH_STACK":
      case "POP_STACK":
        return "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40";
      case "ENQUEUE":
      case "DEQUEUE":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "TREE_TRAVERSE":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "RETURN":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. Step Explanation Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-cyan-950/30 border border-cyan-500/30 shadow-md flex items-start gap-3">
        <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded border ${getActionBadgeColor(
                actionType
              )}`}
            >
              {actionType}
            </span>
            {activeLineNumber && (
              <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                <Code className="w-3 h-3 text-cyan-400" />
                Line <strong className="text-white">{activeLineNumber}</strong>
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-500 ml-auto">
              Step <strong className="text-cyan-300">{currentStepIndex + 1}</strong> of {totalSteps}
            </span>
          </div>
          <p className="text-xs text-zinc-200 font-medium leading-relaxed">
            {explanation || "Initializing algorithm state..."}
          </p>
        </div>
      </div>

      {/* 2. Interactive Scrubber & Playback Controls Bar */}
      <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex flex-col sm:flex-row items-center gap-3">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Jump to Start */}
          <button
            type="button"
            onClick={() => onStepChange(0)}
            disabled={!canGoBack}
            title="Reset to Start"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Step Back */}
          <button
            type="button"
            onClick={() => onStepChange(Math.max(0, currentStepIndex - 1))}
            disabled={!canGoBack}
            title="Previous Step (←)"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" /> <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> <span>Auto-Play</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            type="button"
            onClick={() => onStepChange(Math.min(totalSteps - 1, currentStepIndex + 1))}
            disabled={!canGoForward}
            title="Next Step (→)"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Jump to End */}
          <button
            type="button"
            onClick={() => onStepChange(totalSteps - 1)}
            disabled={!canGoForward}
            title="Jump to Final Step"
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Scrubber Timeline Slider */}
        <div className="flex-1 w-full flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentStepIndex}
            onChange={(e) => onStepChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
        </div>

        {/* Playback Speed Controls */}
        <div className="flex items-center gap-1 shrink-0 border border-zinc-800 rounded-xl p-0.5 bg-zinc-900/60">
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                playbackSpeed === spd
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
