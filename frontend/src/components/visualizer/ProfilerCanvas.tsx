"use client";

import React, { useState, useEffect, useRef } from "react";
import ArrayVisualizer from "./ArrayVisualizer";
import StackVisualizer from "./StackVisualizer";
import QueueVisualizer from "./QueueVisualizer";
import TreeVisualizer from "./TreeVisualizer";
import MatrixVisualizer from "./MatrixVisualizer";
import LinkedListVisualizer from "./LinkedListVisualizer";
import VariablesHud from "./VariablesHud";
import ExecutionControls from "./ExecutionControls";
import { Sparkles, AlertCircle } from "lucide-react";

export interface VisualStepData {
  stepIndex: number;
  lineNumber: number;
  action: string;
  explanation: string;
  structures?: {
    arrays?: any[];
    pointers?: any[];
    stacks?: any[];
    queues?: any[];
    trees?: any[];
    matrices?: any[];
    linkedLists?: any[];
    variables?: Record<string, any>;
  };
}

export interface ProfilerCanvasProps {
  steps: VisualStepData[];
  onActiveLineChange?: (lineNumber: number) => void;
  summary?: string;
  className?: string;
}

export default function ProfilerCanvas({
  steps = [],
  onActiveLineChange,
  summary,
  className = ""
}: ProfilerCanvasProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] || null;

  // Sync Monaco editor line on step change
  useEffect(() => {
    if (currentStep?.lineNumber && onActiveLineChange) {
      onActiveLineChange(currentStep.lineNumber);
    }
  }, [currentStepIndex, currentStep, onActiveLineChange]);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1400 / playbackSpeed);
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Keyboard Navigation: ← / → / Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSteps]);

  if (!steps || steps.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 text-zinc-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
        <AlertCircle className="w-6 h-6 text-zinc-600" />
        <span>No execution trace steps available yet. Click &quot;Visualize Execution&quot; to begin.</span>
      </div>
    );
  }

  const structures = currentStep?.structures || {};
  const hasArrays = Boolean(structures.arrays && structures.arrays.length > 0);
  const hasStacks = Boolean(structures.stacks && structures.stacks.length > 0);
  const hasQueues = Boolean(structures.queues && structures.queues.length > 0);
  const hasTrees = Boolean(structures.trees && structures.trees.length > 0);
  const hasMatrices = Boolean(structures.matrices && structures.matrices.length > 0);
  const hasLinkedLists = Boolean(structures.linkedLists && structures.linkedLists.length > 0);
  const hasVariables = Boolean(structures.variables && Object.keys(structures.variables).length > 0);

  return (
    <div className={`space-y-4 font-sans ${className}`}>
      {/* Playback Controls & Explanation Header */}
      <ExecutionControls
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        activeLineNumber={currentStep?.lineNumber}
        actionType={currentStep?.action}
        explanation={currentStep?.explanation}
        onStepChange={(idx) => setCurrentStepIndex(idx)}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSpeedChange={(spd) => setPlaybackSpeed(spd)}
      />

      {/* Main Dynamic Visualization Panels */}
      <div className="space-y-4">
        {/* 1. 1D Arrays & Pointers */}
        {hasArrays && (
          <ArrayVisualizer
            arrays={structures.arrays}
            pointers={structures.pointers}
          />
        )}

        {/* 2. Singly Linked Lists */}
        {hasLinkedLists && (
          <LinkedListVisualizer linkedLists={structures.linkedLists} />
        )}

        {/* 3. Stacks & Queues Split Grid */}
        {(hasStacks || hasQueues) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hasStacks && <StackVisualizer stacks={structures.stacks} />}
            {hasQueues && <QueueVisualizer queues={structures.queues} />}
          </div>
        )}

        {/* 4. Hierarchical Trees */}
        {hasTrees && <TreeVisualizer trees={structures.trees} />}

        {/* 5. 2D Matrices / DP Grids */}
        {hasMatrices && <MatrixVisualizer matrices={structures.matrices} />}

        {/* 6. In-Scope Variables Tracker */}
        {hasVariables && <VariablesHud variables={structures.variables} />}
      </div>

      {/* Trace Summary Footer */}
      {summary && (
        <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-400 font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{summary}</span>
        </div>
      )}
    </div>
  );
}
