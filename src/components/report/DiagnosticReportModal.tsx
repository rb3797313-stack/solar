"use client";

import React from "react";
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Cpu,
  Calendar,
} from "lucide-react";
import { FaultDiagnosis, PlantTelemetry } from "@/types";

interface DiagnosticReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: PlantTelemetry;
  diagnosis: FaultDiagnosis;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  diagnosis,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportId = `SG-REP-20260927-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:max-h-full print:p-0">
        {/* Controls Bar (Hidden during Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm text-slate-200">
              Technical Root-Cause Diagnostic Dossier
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTENT */}
        <div className="space-y-6 text-slate-200 print:text-black">
          {/* 1. Header with Problem Statement & Facility Metadata */}
          <div className="border-b border-slate-800 pb-4">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    SolarGuard AI • Root-Cause Diagnostic Report
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  HACKVERSE &apos;26 • Problem Statement CB-SW-07: AI Solar Underperformance Engine
                </p>
                <p className="text-xs text-cyan-400 font-semibold mt-0.5">
                  Facility: Solaria West Utility PV Station (1,200 kWp DC) • Mojave Sector 4-B
                </p>
              </div>

              <div className="text-right font-mono text-xs text-slate-400 space-y-0.5">
                <div>Report ID: <span className="text-slate-200 font-bold">{reportId}</span></div>
                <div>Date: <span className="text-slate-200">September 27, 2026</span></div>
                <div>Timestamp: <span className="text-slate-200">{telemetry.timeFormatted} PST</span></div>
                <div>Status: <span className="text-emerald-400 font-bold">Validated</span></div>
              </div>
            </div>
          </div>

          {/* 2. Executive Summary */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
              1. Executive Engineering Summary
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              At {telemetry.timeFormatted}, automated physics-informed supervisory algorithms detected a{" "}
              <strong className="text-amber-400 font-mono">
                {telemetry.totalYieldGapPct.toFixed(1)}% yield gap
              </strong>{" "}
              ({telemetry.totalYieldGapKw.toFixed(1)} kW) between measured AC power and the clear-sky pvlib model baseline. Multi-sensor cross-correlation and scikit-learn classifier identified{" "}
              <strong className="text-red-400 font-mono">{diagnosis.faultType}</strong> affecting{" "}
              <strong>{diagnosis.affectedAssets.join(", ")}</strong> with{" "}
              <strong>{diagnosis.confidencePct}% statistical confidence</strong>.
            </p>
          </div>

          {/* 3. Telemetry Snapshot Table */}
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
              2. Synchronous Telemetry Snapshot
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Actual AC Power</span>
                <span className="text-sm font-bold text-emerald-400">
                  {telemetry.totalActualPowerKw.toFixed(1)} kW
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Expected Model Power</span>
                <span className="text-sm font-bold text-cyan-300">
                  {telemetry.totalExpectedPowerKw.toFixed(1)} kW
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">POA Irradiance</span>
                <span className="text-sm font-bold text-amber-300">
                  {telemetry.weather.irradiancePoa.toFixed(1)} W/m²
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Performance Ratio (PR)</span>
                <span className="text-sm font-bold text-slate-100">
                  {telemetry.performanceRatioPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* 4. Diagnostic Findings & Root Cause Analysis */}
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
              3. Root-Cause Analysis & Classified Evidence
            </h2>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex flex-wrap justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Condition: </span>
                  <span className="font-bold font-mono text-cyan-300 text-sm">
                    {diagnosis.faultType} ({diagnosis.faultCode})
                  </span>
                </div>
                <div className="font-mono">
                  <span className="text-slate-400">Severity: </span>
                  <span className="font-bold text-red-400">{diagnosis.severity}</span>
                  <span className="text-slate-400 ml-2">Confidence: </span>
                  <span className="font-bold text-cyan-300">{diagnosis.confidencePct}%</span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                <span className="text-[11px] font-semibold text-slate-300 block">
                  Sensor Evidence Matrix:
                </span>
                {diagnosis.evidence.map((ev, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 flex justify-between items-start text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{ev.parameter}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ev.explanation}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-slate-100">{ev.observedValue}</span>
                      <span className="text-[10px] text-slate-400 block">Expected: {ev.expectedValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Energy and Financial Loss Quantification */}
          <div>
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono mb-2">
              4. Energy & Revenue Loss Quantification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Instantaneous Deficit</span>
                <span className="text-base font-bold text-red-400">
                  -{diagnosis.estimatedPowerLossKw.toFixed(1)} kW
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Current unharvested capacity</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Today's Cumulative Energy Loss</span>
                <span className="text-base font-bold text-slate-200">
                  {diagnosis.estimatedDailyLossKwh.toFixed(1)} kWh
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  -${diagnosis.estimatedRevenueLossToday.toFixed(2)} at $0.082/kWh tariff
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">30-Day Extrapolated Exposure</span>
                <span className="text-base font-bold text-amber-400">
                  {diagnosis.estimatedMonthlyLossMwh.toFixed(2)} MWh
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Unmitigated run-rate</span>
              </div>
            </div>
          </div>

          {/* 6. Actionable Recommended Action */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 5. Required O&M Field Action ({diagnosis.priority})
            </h2>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {diagnosis.recommendedAction}
            </p>
          </div>

          {/* 7. Sign-off Footer */}
          <div className="pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="block text-[10px] uppercase text-slate-400">SCADA Control Operator:</span>
              <span className="text-slate-200 font-bold">Auto-Logged by SolarGuard AI</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-400">O&M Supervisor Approval:</span>
              <span className="text-slate-200 font-bold">_________________________</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase text-slate-400">Dispatch Priority:</span>
              <span className="text-cyan-400 font-bold">{diagnosis.priority}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
