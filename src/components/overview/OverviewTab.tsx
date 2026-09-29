"use client";

import React, { useState } from "react";
import {
  Zap,
  TrendingDown,
  Sun,
  Thermometer,
  Wind,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu,
  ArrowUpRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Percent,
  DollarSign,
  Maximize2,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FaultDiagnosis, PlantTelemetry } from "@/types";

interface OverviewTabProps {
  telemetry: PlantTelemetry;
  diagnosis: FaultDiagnosis;
  historyData: Array<{
    time: string;
    expectedKw: number;
    actualKw: number;
    poa: number;
    yieldGapKw: number;
    prPct: number;
  }>;
  onNavigateToDiagnostics: () => void;
  onSelectInverter: (inverterId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  telemetry,
  diagnosis,
  historyData,
  onNavigateToDiagnostics,
  onSelectInverter,
}) => {
  const [showEvidence, setShowEvidence] = useState<boolean>(true);

  // Blend history with current live point for real-time visualization
  const chartData = React.useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    const sliced = [...historyData];
    // inject current real-time point at 12:30 (noon peak)
    const noonIdx = sliced.findIndex((d) => d.time === "12:30");
    if (noonIdx !== -1) {
      sliced[noonIdx] = {
        ...sliced[noonIdx],
        actualKw: telemetry.totalActualPowerKw,
        expectedKw: telemetry.totalExpectedPowerKw,
        yieldGapKw: telemetry.totalYieldGapKw,
        poa: telemetry.weather.irradiancePoa,
      };
    }
    return sliced;
  }, [historyData, telemetry]);

  const severityBadge =
    diagnosis.severity === "CRITICAL"
      ? "bg-red-500/20 text-red-400 border-red-500/30"
      : diagnosis.severity === "WARNING"
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : diagnosis.severity === "MEDIUM"
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";

  return (
    <div className="space-y-4 pb-8">
      {/* 1. TOP COMMAND CENTER KPI RIBBON */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* Current Generation */}
        <div className="scada-panel p-3.5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Current Generation</span>
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-bold font-mono text-slate-100">
              {telemetry.totalActualPowerKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Rated: 1,200 kW</span>
            <span className="text-emerald-400 font-medium">
              {((telemetry.totalActualPowerKw / 1200) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Expected Generation */}
        <div className="scada-panel p-3.5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Expected (Physics)</span>
            <span className="text-[10px] px-1 py-0.2 bg-cyan-950 text-cyan-400 rounded font-mono border border-cyan-800">
              pvlib
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-bold font-mono text-cyan-300">
              {telemetry.totalExpectedPowerKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Clear-Sky Baseline</span>
          </div>
        </div>

        {/* Yield Gap (kW & %) */}
        <div
          className={`scada-panel p-3.5 rounded-xl border relative overflow-hidden ${
            telemetry.totalYieldGapPct > 8.0
              ? "border-amber-500/40 bg-amber-950/20"
              : "border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Yield Gap</span>
            <TrendingDown
              className={`w-3.5 h-3.5 ${
                telemetry.totalYieldGapPct > 8.0 ? "text-amber-400" : "text-slate-500"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-xl lg:text-2xl font-bold font-mono ${
                telemetry.totalYieldGapPct > 8.0 ? "text-amber-400" : "text-slate-200"
              }`}
            >
              -{telemetry.totalYieldGapKw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">kW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-mono">
            <span>Deficit:</span>
            <span
              className={`font-semibold ${
                telemetry.totalYieldGapPct > 8.0 ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {telemetry.totalYieldGapPct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Today's Energy Loss */}
        <div className="scada-panel p-3.5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Today's Energy Loss</span>
            <DollarSign className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-bold font-mono text-red-400">
              {telemetry.todayEnergyLossKwh.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">kWh</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-mono">
            <span>Revenue Impact:</span>
            <span className="text-red-400 font-semibold">
              -${telemetry.todayMonetaryLoss.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Performance Ratio */}
        <div className="scada-panel p-3.5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Performance Ratio</span>
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl lg:text-2xl font-bold font-mono text-slate-100">
              {telemetry.performanceRatioPct.toFixed(1)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>Warranty Target:</span>
            <span className="text-slate-300 font-mono">80.0%</span>
          </div>
        </div>

        {/* Active Alarms */}
        <div className="scada-panel p-3.5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Active Alarms</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-xl lg:text-2xl font-bold font-mono ${
                telemetry.activeAlarmsCount.critical > 0
                  ? "text-red-400"
                  : telemetry.activeAlarmsCount.warning > 0
                  ? "text-amber-400"
                  : "text-slate-300"
              }`}
            >
              {telemetry.activeAlarmsCount.critical + telemetry.activeAlarmsCount.warning}
            </span>
            <div className="flex flex-col text-[10px] font-mono leading-tight">
              <span className="text-red-400 font-bold">
                {telemetry.activeAlarmsCount.critical} Crit
              </span>
              <span className="text-amber-400">
                {telemetry.activeAlarmsCount.warning} Warn
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>SCADA Queue</span>
          </div>
        </div>

        {/* Grid Status */}
        <div className="scada-panel p-3.5 rounded-xl border border-slate-800 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-xs mb-1">
            <span>Grid Interconnect</span>
            <span
              className={`w-2 h-2 rounded-full ${
                telemetry.gridStatus === "normal" ? "bg-emerald-400 animate-ping" : "bg-amber-400"
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-sm lg:text-base font-bold uppercase font-mono ${
                telemetry.gridStatus === "normal"
                  ? "text-emerald-400"
                  : telemetry.gridStatus === "curtailed"
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {telemetry.gridStatus === "normal" ? "Synchronized" : telemetry.gridStatus}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between font-mono">
            <span>{telemetry.gridFrequencyHz.toFixed(2)} Hz</span>
            <span>{telemetry.gridVoltageV.toFixed(0)} V</span>
          </div>
        </div>
      </div>

      {/* 2. WEATHER TELEMETRY BAR */}
      <div className="scada-panel rounded-xl px-4 py-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">POA Irradiance:</span>
          <span className="font-mono font-bold text-slate-100">
            {telemetry.weather.irradiancePoa.toFixed(1)} W/m²
          </span>
          <span className="text-slate-500 font-mono text-[11px]">
            (GHI: {telemetry.weather.irradianceGhi.toFixed(1)})
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-slate-300">
          <Thermometer className="w-4 h-4 text-orange-400" />
          <span className="text-slate-400">Ambient Temp:</span>
          <span className="font-mono font-bold text-slate-100">
            {telemetry.weather.ambientTempC.toFixed(1)}°C
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-slate-300">
          <Thermometer className="w-4 h-4 text-red-400" />
          <span className="text-slate-400">Module Cell Temp:</span>
          <span className="font-mono font-bold text-slate-100">
            {telemetry.weather.moduleTempC.toFixed(1)}°C
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-slate-300">
          <Wind className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">Wind Speed:</span>
          <span className="font-mono font-bold text-slate-100">
            {telemetry.weather.windSpeedKmh.toFixed(1)} km/h
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Sensor Quality:</span>
          <span
            className={`font-mono font-bold ${
              telemetry.weather.sensorQualityScore >= 80
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {telemetry.weather.sensorQualityScore}%
          </span>
        </div>
      </div>

      {/* 3. MAIN SECTION: TIME-SERIES CHART & LIVE AI DIAGNOSIS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Generation Time-Series Chart (8 Cols) */}
        <div className="lg:col-span-8 scada-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-200">
                  Expected vs Actual Generation Profile
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-cyan-300 border border-slate-700">
                  24-Hour Diurnal Curve
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Physics model baseline vs real-time SCADA telemetry. Shaded zone denotes instantaneous yield gap.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
                Expected
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-1 bg-emerald-400 rounded-sm" />
                Actual
              </span>
              <span className="flex items-center gap-1.5 text-amber-400/80">
                <span className="w-3 h-0.5 bg-amber-400/80" />
                Irradiance
              </span>
            </div>
          </div>

          {/* Recharts Chart */}
          <div className="w-full h-80 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  interval={8}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  unit=" kW"
                  domain={[0, 1300]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950/95 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
                          <p className="text-slate-300 font-bold mb-1 border-b border-slate-800 pb-1">
                            Time: {label}
                          </p>
                          <div className="space-y-1">
                            <p className="text-cyan-400">
                              Expected: {data.expectedKw?.toFixed(1)} kW
                            </p>
                            <p className="text-emerald-400 font-bold">
                              Actual: {data.actualKw?.toFixed(1)} kW
                            </p>
                            <p className="text-amber-400">
                              Yield Gap: -{data.yieldGapKw?.toFixed(1)} kW
                            </p>
                            <p className="text-slate-400">
                              POA: {data.poa?.toFixed(0)} W/m²
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="actualKw"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#actualGrad)"
                  name="Actual Power (kW)"
                />
                <Line
                  type="monotone"
                  dataKey="expectedKw"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Expected Power (kW)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Live AI Diagnosis Card (4 Cols) */}
        <div className="lg:col-span-4 scada-panel rounded-xl p-4 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm text-slate-100">AI Root-Cause Engine</h3>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${severityBadge}`}
              >
                {diagnosis.severity}
              </span>
            </div>

            {/* Fault Title & Confidence */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">
                Primary Classified Condition
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                  {diagnosis.faultType}
                </h4>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {diagnosis.confidencePct}% Conf
                </span>
              </div>

              {/* Confidence Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${diagnosis.confidencePct}%` }}
                />
              </div>

              {/* Affected Equipment */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs flex justify-between items-center">
                <span className="text-slate-400">Affected Asset:</span>
                <span className="text-slate-200 font-mono font-semibold truncate max-w-[200px]">
                  {diagnosis.affectedAssets[0] || "Fleet Wide"}
                </span>
              </div>

              {/* Estimated Power Loss */}
              <div className="mt-1 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-400">Est. Power Loss:</span>
                <span className="text-red-400 font-bold">
                  -{diagnosis.estimatedPowerLossKw.toFixed(1)} kW
                </span>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Recommended O&M Action:
              </span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {diagnosis.recommendedAction}
              </p>
            </div>

            {/* Expandable "Why this diagnosis?" Section */}
            <div className="mt-3">
              <button
                onClick={() => setShowEvidence(!showEvidence)}
                className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 font-medium transition"
              >
                <span className="flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  Why this diagnosis? (Telemetry Evidence)
                </span>
                {showEvidence ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showEvidence && (
                <div className="mt-1.5 space-y-1.5 text-xs">
                  {diagnosis.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px]"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-slate-300 font-mono">
                          {ev.parameter}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
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
                      <p className="text-slate-400 text-[11px] leading-tight">
                        {ev.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Deep Dive Action Button */}
          <button
            onClick={onNavigateToDiagnostics}
            className="w-full mt-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <span>Open Comprehensive Diagnostics Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. INVERTER FLEET MATRIX MINI-PREVIEW (12 Inverters) */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-200">
              Inverter Fleet Live Matrix (12 Inverters / 1.2 MW)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Click any inverter for string-level telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2">
          {telemetry.inverters.map((inv) => {
            const isCrit = inv.status === "critical";
            const isWarn = inv.status === "warning";
            const borderColor = isCrit
              ? "border-red-500/50 bg-red-950/20"
              : isWarn
              ? "border-amber-500/50 bg-amber-950/20"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/50";
            const statusDot = isCrit
              ? "bg-red-400"
              : isWarn
              ? "bg-amber-400"
              : "bg-emerald-400";

            return (
              <button
                key={inv.inverterId}
                onClick={() => onSelectInverter(inv.inverterId)}
                className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${borderColor}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-200">
                    {inv.inverterId}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                </div>
                <div className="mt-1.5 font-mono">
                  <div className="text-sm font-bold text-slate-100">
                    {inv.acPowerKw.toFixed(0)} <span className="text-[10px] text-slate-400">kW</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex justify-between mt-0.5">
                    <span>{inv.efficiencyPct.toFixed(1)}%</span>
                    <span className={inv.inverterTempC >= 75 ? "text-red-400 font-bold" : ""}>
                      {inv.inverterTempC.toFixed(0)}°C
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
