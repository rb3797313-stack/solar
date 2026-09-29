"use client";

import React, { useState, useEffect } from "react";
import {
  Sun,
  Activity,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  StepForward,
  FileText,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
} from "lucide-react";
import { PlantTelemetry, ScenarioType } from "@/types";
import { SIMULATION_SCENARIOS } from "@/lib/simulation";

interface HeaderProps {
  telemetry: PlantTelemetry;
  selectedScenario: ScenarioType;
  isPlaying: boolean;
  simSpeed: number;
  onScenarioChange: (scenario: ScenarioType) => void;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onOpenReport: () => void;
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  selectedScenario,
  isPlaying,
  simSpeed,
  onScenarioChange,
  onTogglePlay,
  onStep,
  onReset,
  onSpeedChange,
  onOpenReport,
  onToggleCopilot,
  isCopilotOpen,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("12:30:00 PM");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const healthColor =
    telemetry.overallPlantHealth === "HEALTHY"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : telemetry.overallPlantHealth === "WARNING"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-red-400 bg-red-500/10 border-red-500/30";

  const healthDot =
    telemetry.overallPlantHealth === "HEALTHY"
      ? "bg-emerald-400 shadow-[0_0_8px_#10b981]"
      : telemetry.overallPlantHealth === "WARNING"
      ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
      : "bg-red-400 shadow-[0_0_10px_#ef4444]";

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <Sun className="w-5 h-5 animate-spin-slow text-amber-400" />
          <Zap className="w-3.5 h-3.5 absolute text-emerald-400 -bottom-0.5 -right-0.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wider text-slate-100 flex items-center gap-1.5">
              SolarGuard<span className="text-cyan-400 font-extrabold">AI</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              v2.6 SCADA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 tracking-tight font-medium hidden sm:block">
            &ldquo;Detect. Diagnose. Recover. Every Watt Counts.&rdquo;
          </p>
        </div>
      </div>

      {/* Middle: Live Simulation Controller */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 shadow-inner">
        <div className="flex items-center gap-1.5 mr-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Demo Scenario:</span>
        </div>

        <select
          value={selectedScenario}
          onChange={(e) => onScenarioChange(e.target.value as ScenarioType)}
          className="bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-medium"
        >
          {SIMULATION_SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded transition text-xs flex items-center gap-1 px-2 font-medium ${
              isPlaying
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            }`}
            title={isPlaying ? "Pause Live Simulation" : "Start Live Simulation"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Simulate</span>
              </>
            )}
          </button>

          <button
            onClick={onStep}
            disabled={isPlaying}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            title="Step 1 Interval"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset to Normal State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSpeedChange(simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : 1)}
            className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-cyan-300 transition flex items-center gap-0.5"
            title="Toggle Simulation Speed"
          >
            <FastForward className="w-3 h-3 text-cyan-400" />
            {simSpeed}x
          </button>
        </div>
      </div>

      {/* Right: Health Status, SCADA Clock, Report & Copilot */}
      <div className="flex items-center gap-3">
        {/* Plant Health Beacon */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-semibold uppercase tracking-wider ${healthColor}`}
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${healthDot}`} />
          <span>{telemetry.overallPlantHealth}</span>
        </div>

        {/* SCADA Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 px-2 py-1 bg-slate-900/60 rounded border border-slate-800/80">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentTime}</span>
        </div>

        {/* Generate Report Button */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Diagnostic Report</span>
        </button>

        {/* AI Copilot Toggle Button */}
        <button
          onClick={onToggleCopilot}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition border ${
            isCopilotOpen
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="hidden md:inline">SolarGuard Copilot</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
        </button>
      </div>
    </header>
  );
};
