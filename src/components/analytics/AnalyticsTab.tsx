"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Calendar,
  Download,
  Filter,
  BarChart3,
  Sun,
  Thermometer,
  Zap,
  Activity,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { PlantTelemetry } from "@/types";

interface AnalyticsTabProps {
  telemetry: PlantTelemetry;
  historyData: Array<{
    time: string;
    expectedKw: number;
    actualKw: number;
    poa: number;
    yieldGapKw: number;
    prPct: number;
    ambTempC?: number;
    modTempC?: number;
    invTempAvgC?: number;
  }>;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  telemetry,
  historyData,
}) => {
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7d" | "30d">(
    "today"
  );

  const faultDistribution = [
    { name: "Inverter Derating", count: 18, color: "#ef4444" },
    { name: "Partial Shading", count: 24, color: "#f59e0b" },
    { name: "Uniform Soiling", count: 42, color: "#06b6d4" },
    { name: "String Open Circuit", count: 9, color: "#ec4899" },
    { name: "Grid Curtailment", count: 7, color: "#8b5cf6" },
    { name: "Sensor Calibration Drift", count: 5, color: "#14b8a6" },
  ];

  const handleExportCsv = () => {
    const headers = "timestamp,expected_kw,actual_kw,yield_gap_kw,poa_irradiance,pr_percent\n";
    const rows = historyData
      .map(
        (d) =>
          `2026-09-27T${d.time}:00Z,${d.expectedKw},${d.actualKw},${d.yieldGapKw},${d.poa},${d.prPct}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `solarguard_analytics_${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header & Controls */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              High-Resolution Analytics & Telemetry Engine
            </h2>
            <p className="text-xs text-slate-400">
              Long-term degradation tracking, thermal dispersion metrics, and yield gap audits.
            </p>
          </div>
        </div>

        {/* Date Range Selection & Export */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setDateRange("today")}
              className={`px-3 py-1.5 rounded-md transition ${
                dateRange === "today"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange("yesterday")}
              className={`px-3 py-1.5 rounded-md transition ${
                dateRange === "yesterday"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateRange("7d")}
              className={`px-3 py-1.5 rounded-md transition ${
                dateRange === "7d"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange("30d")}
              className={`px-3 py-1.5 rounded-md transition ${
                dateRange === "30d"
                  ? "bg-cyan-500/20 text-cyan-300 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Month-to-Date
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. PRIMARY TIME-SERIES: GENERATION VS IRRADIANCE */}
      <div className="scada-panel p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Generation Power (kW) vs Plane-of-Array Irradiance (W/m²)
            </h3>
            <p className="text-xs text-slate-400">
              Expected physics baseline vs actual generation with irradiance correlation.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-cyan-400">--- Expected Power</span>
            <span className="text-emerald-400 font-bold">— Actual Power</span>
            <span className="text-amber-400">— POA Irradiance</span>
          </div>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} interval={8} />
              <YAxis yAxisId="left" stroke="#64748b" fontSize={11} unit=" kW" domain={[0, 1300]} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} unit=" W/m²" domain={[0, 1100]} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-950/95 border border-slate-700 p-2.5 rounded-lg text-xs font-mono">
                        <p className="text-slate-300 font-bold mb-1">{label}</p>
                        <p className="text-cyan-400">Expected: {d.expectedKw} kW</p>
                        <p className="text-emerald-400 font-bold">Actual: {d.actualKw} kW</p>
                        <p className="text-amber-400">POA: {d.poa} W/m²</p>
                        <p className="text-red-400">Yield Gap: -{d.yieldGapKw} kW</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area yAxisId="left" type="monotone" dataKey="actualKw" stroke="#10b981" strokeWidth={2} fill="url(#actGrad)" />
              <Line yAxisId="left" type="monotone" dataKey="expectedKw" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="poa" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. DUAL CHARTS: THERMAL PROFILING & PERFORMANCE RATIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Thermal Profiling */}
        <div className="scada-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                Thermal Progression Profile (°C)
              </h3>
              <p className="text-xs text-slate-400">
                Inverter internal IGBT temp vs PV module cell temp vs ambient.
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} interval={8} />
                <YAxis stroke="#64748b" fontSize={11} unit=" °C" domain={[10, 90]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950/95 border border-slate-700 p-2 rounded text-xs font-mono">
                          <p className="font-bold text-slate-300">{label}</p>
                          <p className="text-orange-400">Inverter Avg: {d.invTempAvgC}°C</p>
                          <p className="text-red-400">Module Cell: {d.modTempC}°C</p>
                          <p className="text-cyan-400">Ambient: {d.ambTempC}°C</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line type="monotone" dataKey="invTempAvgC" stroke="#f97316" strokeWidth={2} dot={false} name="Inverter IGBT (°C)" />
                <Line type="monotone" dataKey="modTempC" stroke="#ef4444" strokeWidth={2} dot={false} name="Module Cell (°C)" />
                <Line type="monotone" dataKey="ambTempC" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Ambient Air (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PR % & Yield Loss Chart */}
        <div className="scada-panel p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Performance Ratio (PR %) & Yield Deficit
              </h3>
              <p className="text-xs text-slate-400">
                PR tracking with contract baseline (80.0%) and instantaneous deficit.
              </p>
            </div>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData.filter((_, i) => i % 4 === 0)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" %" domain={[0, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-950/95 border border-slate-700 p-2 rounded text-xs font-mono">
                          <p className="font-bold text-slate-300">{label}</p>
                          <p className="text-cyan-400">PR: {d.prPct}%</p>
                          <p className="text-red-400">Yield Gap: {d.yieldGapKw} kW</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="prPct" fill="#06b6d4" name="PR (%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. FAULT FREQUENCY DISTRIBUTION BREAKDOWN */}
      <div className="scada-panel p-4 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Historical Root-Cause Fault Distribution (Last 30 Days)
            </h3>
            <p className="text-xs text-slate-400">
              Occurrence frequency across the 7 classified failure modes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {faultDistribution.map((item) => (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2 font-mono">
                <span className="text-xl font-bold text-slate-100">{item.count}</span>
                <span className="text-xs text-slate-400">events</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
