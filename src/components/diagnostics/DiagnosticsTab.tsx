"use client";

import React, { useState } from "react";
import {
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  TrendingDown,
  Layers,
  Thermometer,
  Zap,
  Gauge,
  HelpCircle,
  FileCheck,
  Wrench,
  Download,
} from "lucide-react";
import { FaultDiagnosis, PlantTelemetry } from "@/types";

interface DiagnosticsTabProps {
  telemetry: PlantTelemetry;
  diagnosis: FaultDiagnosis;
  onOpenReport: () => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
  telemetry,
  diagnosis,
  onOpenReport,
}) => {
  const [selectedClassIndex, setSelectedClassIndex] = useState<number>(0);

  const faultClasses = [
    {
      name: "Uniform Soiling",
      code: "SOIL-001",
      severity: "WARNING",
      baseProb: diagnosis.faultType === "Uniform Soiling" ? diagnosis.confidencePct : 12,
      summary: "Broad dust/particulate layer across array surfaces attenuating optical transmission.",
      symptoms: "Uniform ~16% yield deficit across all 12 inverters, steady PR degradation, uniform module temperatures.",
    },
    {
      name: "Partial Shading",
      code: "SHAD-002",
      severity: "MEDIUM",
      baseProb: diagnosis.faultType === "Partial Shading" ? diagnosis.confidencePct : 8,
      summary: "Vegetation or physical object casting shadow across perimeter strings.",
      symptoms: "Localized MPPT current mismatch (>50%), neighboring inverters normal, bypass diode activation.",
    },
    {
      name: "Inverter Derating",
      code: "INV-003",
      severity: "CRITICAL",
      baseProb: diagnosis.faultType === "Inverter Derating" ? diagnosis.confidencePct : 4,
      summary: "Inverter internal IGBT heat sink exceeds thermal tripping limit (>75°C).",
      symptoms: "High DC input availability, high irradiance, AC power clamped down, internal heat-sink > 78°C.",
    },
    {
      name: "String Mismatch / Open Circuit",
      code: "STR-004",
      severity: "CRITICAL",
      baseProb: diagnosis.faultType === "String Mismatch / Open Circuit" ? diagnosis.confidencePct : 6,
      summary: "Blown DC string fuse or disconnected MC4 connector carrying 0.0 A.",
      symptoms: "Single string current = 0.0 A while peer strings carry full rated current; MPPT voltage shift.",
    },
    {
      name: "Grid Curtailment",
      code: "GRID-005",
      severity: "WARNING",
      baseProb: diagnosis.faultType === "Grid Curtailment" ? diagnosis.confidencePct : 2,
      summary: "Downstream utility export limit enforced on substation interconnect.",
      symptoms: "All inverters clamped uniformly, DC bus voltage shifted off MPP, grid curtailment flag active.",
    },
    {
      name: "Sensor Calibration Drift",
      code: "SENS-006",
      severity: "WARNING",
      baseProb: diagnosis.faultType === "Sensor Calibration Drift" ? diagnosis.confidencePct : 3,
      summary: "POA Pyranometer has positive drift bias (+18%), creating false underperformance.",
      symptoms: "POA to GHI ratio unphysical (>1.35), inverter DC currents normal, paper-only loss.",
    },
    {
      name: "Normal Operation",
      code: "NORM-000",
      severity: "NORMAL",
      baseProb: diagnosis.faultType === "Normal Operation" ? diagnosis.confidencePct : 5,
      summary: "Plant is generating optimally within ±3% of physics model envelope.",
      symptoms: "Yield gap < 5%, all strings balanced, inverter temperatures < 65°C, PR > 80%.",
    },
  ];

  return (
    <div className="space-y-4 pb-8">
      {/* Header Banner */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Industrial Diagnostics Workspace
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                SCADA Rule & ML Engine
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Multi-sensor physics correlation, string current mismatch analysis, and fault classification.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition"
        >
          <Download className="w-4 h-4" />
          <span>Export Root-Cause Dossier</span>
        </button>
      </div>

      {/* 1. COMPREHENSIVE ELECTRICAL & THERMAL METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Expected vs Actual Power */}
        <div className="scada-panel p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Expected Power</span>
          <span className="text-lg font-bold font-mono text-cyan-300">
            {telemetry.totalExpectedPowerKw.toFixed(1)} <span className="text-xs">kW</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">pvlib clear-sky baseline</span>
        </div>

        <div className="scada-panel p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Actual AC Power</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {telemetry.totalActualPowerKw.toFixed(1)} <span className="text-xs">kW</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Substation export meter</span>
        </div>

        {/* Yield Gap & Yield Gap % */}
        <div className="scada-panel p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Yield Gap (kW / %)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono text-amber-400">
              -{telemetry.totalYieldGapKw.toFixed(1)} <span className="text-xs">kW</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              ({telemetry.totalYieldGapPct.toFixed(1)}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Instantaneous deficit</span>
        </div>

        {/* Irradiance POA */}
        <div className="scada-panel p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[11px] block">POA Irradiance</span>
          <span className="text-lg font-bold font-mono text-amber-300">
            {telemetry.weather.irradiancePoa.toFixed(1)} <span className="text-xs">W/m²</span>
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Tilted reference sensor</span>
        </div>

        {/* DC vs AC Power */}
        <div className="scada-panel p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[11px] block">DC / AC Fleet Ratio</span>
          <span className="text-lg font-bold font-mono text-slate-100">
            {(
              (telemetry.inverters.reduce((a, b) => a + b.dcPowerKw, 0) /
                Math.max(1, telemetry.totalActualPowerKw))
            ).toFixed(3)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Inverter DC to AC ratio</span>
        </div>

        {/* Inverter & Module Temp */}
        <div className="scada-panel p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-[11px] block">Temperatures (Mod / Inv)</span>
          <div className="text-base font-bold font-mono text-slate-200">
            {telemetry.weather.moduleTempC.toFixed(0)}°C /{" "}
            <span className={telemetry.inverters.some((i) => i.inverterTempC >= 75) ? "text-red-400" : ""}>
              {Math.max(...telemetry.inverters.map((i) => i.inverterTempC)).toFixed(0)}°C max
            </span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Module vs IGBT max</span>
        </div>
      </div>

      {/* 2. MAIN SECTION: ACTIVE ROOT CAUSE CARD & FAULT CLASSES MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Live Root-Cause Diagnostic Report (7 Cols) */}
        <div className="lg:col-span-7 scada-panel rounded-xl p-4 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                Active Telemetry Diagnosis
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                {diagnosis.faultType} ({diagnosis.faultCode})
              </h3>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-mono text-cyan-300">
                {diagnosis.confidencePct}%
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Model Confidence
              </span>
            </div>
          </div>

          {/* Root Cause Summary */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-1">
              Physiological Root Cause:
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              {diagnosis.rootCauseDescription}
            </p>
          </div>

          {/* Root-Cause Multi-Sensor Evidence Badges & Metrics */}
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Multi-Sensor Root Cause Evidence:
            </span>
            <div className="space-y-2">
              {diagnosis.evidence.map((ev, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {ev.parameter}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          ev.verdict === "critical"
                            ? "bg-red-500/20 text-red-300 border border-red-500/30"
                            : ev.verdict === "abnormal"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {ev.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{ev.explanation}</p>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono text-xs">
                    <div className="text-slate-200 font-bold">{ev.observedValue}</div>
                    <div className="text-slate-400 text-[10px]">Exp: {ev.expectedValue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loss & Revenue Impact */}
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 grid grid-cols-3 gap-2 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Instant Deficit</span>
              <span className="text-sm font-bold text-red-400">
                -{diagnosis.estimatedPowerLossKw.toFixed(1)} kW
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Today's Loss</span>
              <span className="text-sm font-bold text-slate-200">
                {diagnosis.estimatedDailyLossKwh.toFixed(1)} kWh
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">30-Day Extrapolated</span>
              <span className="text-sm font-bold text-amber-400">
                {diagnosis.estimatedMonthlyLossMwh.toFixed(2)} MWh
              </span>
            </div>
          </div>

          {/* Actionable O&M Directive */}
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
            <Wrench className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Actionable O&M Work Order ({diagnosis.priority})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {diagnosis.recommendedAction}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: 7 Fault Classes Classifier Probabilities (5 Cols) */}
        <div className="lg:col-span-5 scada-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-200">
                Fault Classes Probability Spectrum
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                scikit-learn RF + Rules
              </span>
            </div>

            <div className="space-y-2.5">
              {faultClasses.map((fc, i) => {
                const isSelected = diagnosis.faultType === fc.name;
                const prob = isSelected ? diagnosis.confidencePct : fc.baseProb;
                return (
                  <div
                    key={fc.code}
                    className={`p-2.5 rounded-lg border transition ${
                      isSelected
                        ? "bg-slate-900 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="font-mono text-slate-400 text-[10px]">
                          {i + 1}.
                        </span>
                        <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-300"}>
                          {fc.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-200">
                        {prob}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected
                            ? "bg-cyan-400"
                            : prob > 20
                            ? "bg-amber-400"
                            : "bg-slate-600"
                        }`}
                        style={{ width: `${prob}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                      {fc.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Model: Hybrid RF v1.4</span>
            <span className="text-emerald-400 font-mono">Trained on 2,100 Scenarios</span>
          </div>
        </div>
      </div>
    </div>
  );
};
