"use client";

import React, { useState } from "react";
import {
  Grid,
  Zap,
  Thermometer,
  Percent,
  X,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Cpu,
  Layers,
  Activity,
  ArrowRight,
} from "lucide-react";
import { InverterTelemetry, PlantTelemetry } from "@/types";

interface PlantTabProps {
  telemetry: PlantTelemetry;
  selectedInverterId: string | null;
  onSelectInverter: (id: string | null) => void;
}

export const PlantTab: React.FC<PlantTabProps> = ({
  telemetry,
  selectedInverterId,
  onSelectInverter,
}) => {
  const selectedInverter = telemetry.inverters.find(
    (i) => i.inverterId === selectedInverterId
  );

  return (
    <div className="space-y-4 pb-8 relative">
      {/* Header Banner */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Solaria West Array Topography & Inverter Fleet
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                12 Inverter Nodes (1.2 MW)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Interactive plant layout. Click any inverter node to inspect string currents and MPPT channels.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Warning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-slate-300">Critical</span>
          </div>
        </div>
      </div>

      {/* FARM LAYOUT MAP */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Block A */}
        <div className="scada-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
              Block A (North Array)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">300 kWp DC</span>
          </div>
          <div className="space-y-2.5">
            {telemetry.inverters.slice(0, 3).map((inv) => (
              <InverterCard
                key={inv.inverterId}
                inverter={inv}
                isSelected={selectedInverterId === inv.inverterId}
                onClick={() => onSelectInverter(inv.inverterId)}
              />
            ))}
          </div>
        </div>

        {/* Block B */}
        <div className="scada-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
              Block B (Central Array)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">300 kWp DC</span>
          </div>
          <div className="space-y-2.5">
            {telemetry.inverters.slice(3, 6).map((inv) => (
              <InverterCard
                key={inv.inverterId}
                inverter={inv}
                isSelected={selectedInverterId === inv.inverterId}
                onClick={() => onSelectInverter(inv.inverterId)}
              />
            ))}
          </div>
        </div>

        {/* Block C */}
        <div className="scada-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
              Block C (East Array)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">300 kWp DC</span>
          </div>
          <div className="space-y-2.5">
            {telemetry.inverters.slice(6, 9).map((inv) => (
              <InverterCard
                key={inv.inverterId}
                inverter={inv}
                isSelected={selectedInverterId === inv.inverterId}
                onClick={() => onSelectInverter(inv.inverterId)}
              />
            ))}
          </div>
        </div>

        {/* Block D */}
        <div className="scada-panel p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
            <span className="font-mono text-xs font-bold text-cyan-300 uppercase">
              Block D (South Array)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">300 kWp DC</span>
          </div>
          <div className="space-y-2.5">
            {telemetry.inverters.slice(9, 12).map((inv) => (
              <InverterCard
                key={inv.inverterId}
                inverter={inv}
                isSelected={selectedInverterId === inv.inverterId}
                onClick={() => onSelectInverter(inv.inverterId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* PLANT SUBSTATION INFRASTRUCTURE FOOTER */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-slate-200 font-bold block">
              Central Step-Up Substation (POI)
            </span>
            <span className="text-slate-400">
              480V to 34.5kV MV Transformer • 1,500 kVA
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="text-slate-200 font-bold block">SCADA Master RTU Hub</span>
            <span className="text-slate-400">
              Fiber Optic Modbus TCP Loop • 1,000 ms Poll
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="text-slate-200 font-bold block">
              Met-Mast Weather Station
            </span>
            <span className="text-slate-400">
              Class A Pyranometers (POA + GHI) • RTD Sensors
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED TELEMETRY DRAWER (Slide-over for selected Inverter) */}
      {selectedInverter && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950/95 border-l border-slate-800 shadow-2xl z-50 p-5 flex flex-col justify-between overflow-y-auto backdrop-blur-xl">
          <div className="space-y-4">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    selectedInverter.status === "critical"
                      ? "bg-red-400 animate-ping"
                      : selectedInverter.status === "warning"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                />
                <div>
                  <h3 className="font-bold text-base text-slate-100 font-mono">
                    {selectedInverter.inverterId}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedInverter.name}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectInverter(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inverter Status Badge */}
            {selectedInverter.faultState && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/40 text-xs text-red-300 flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase">
                    Active Fault Condition:
                  </span>
                  <span>{selectedInverter.faultState}</span>
                </div>
              </div>
            )}

            {/* Electrical Telemetry Overview */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">AC Output Power</span>
                <span className="text-base font-bold text-emerald-400">
                  {selectedInverter.acPowerKw.toFixed(1)} kW
                </span>
                <span className="text-slate-400 text-[10px] block">
                  Expected: {selectedInverter.expectedPowerKw.toFixed(1)} kW
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">DC Input Power</span>
                <span className="text-base font-bold text-cyan-300">
                  {selectedInverter.dcPowerKw.toFixed(1)} kW
                </span>
                <span className="text-slate-400 text-[10px] block">
                  {selectedInverter.dcVoltage.toFixed(0)} V / {selectedInverter.dcCurrent.toFixed(1)} A
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Conversion Efficiency</span>
                <span className="text-base font-bold text-slate-200">
                  {selectedInverter.efficiencyPct.toFixed(1)}%
                </span>
                <span className="text-slate-400 text-[10px] block">
                  Nominal: 98.5%
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">IGBT Bridge Temp</span>
                <span
                  className={`text-base font-bold ${
                    selectedInverter.inverterTempC >= 75
                      ? "text-red-400 animate-pulse"
                      : "text-slate-200"
                  }`}
                >
                  {selectedInverter.inverterTempC.toFixed(1)}°C
                </span>
                <span className="text-slate-400 text-[10px] block">
                  Limit: 75.0°C
                </span>
              </div>
            </div>

            {/* MPPT & String Channels Breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                MPPT Trackers & String Telemetry:
              </span>

              {selectedInverter.mpptChannels.map((mppt) => (
                <div
                  key={mppt.mpptId}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2"
                >
                  <div className="flex justify-between items-center text-xs font-mono border-b border-slate-800/80 pb-1.5">
                    <span className="font-bold text-cyan-300">{mppt.mpptId}</span>
                    <span className="text-slate-300">
                      {mppt.voltageV.toFixed(0)} V • {mppt.currentA.toFixed(1)} A •{" "}
                      {mppt.powerKw.toFixed(1)} kW
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {mppt.strings.map((str) => {
                      const isZero = str.currentA < 1.0;
                      const isShaded = str.status === "shaded";
                      const statusColor = isZero
                        ? "text-red-400 bg-red-950/40 border-red-500/40"
                        : isShaded
                        ? "text-amber-400 bg-amber-950/40 border-amber-500/40"
                        : "text-slate-300 bg-slate-950/60 border-slate-800/60";

                      return (
                        <div
                          key={str.stringId}
                          className={`p-2 rounded border text-xs font-mono flex items-center justify-between ${statusColor}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{str.stringId}</span>
                            <span className="text-[10px] uppercase text-slate-400">
                              {str.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">
                              {str.currentA.toFixed(1)} A
                            </span>
                            <span className="text-slate-400">
                              {str.powerW.toFixed(0)} W
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => onSelectInverter(null)}
            className="w-full mt-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Close Telemetry Drawer
          </button>
        </div>
      )}
    </div>
  );
};

interface InverterCardProps {
  inverter: InverterTelemetry;
  isSelected: boolean;
  onClick: () => void;
}

const InverterCard: React.FC<InverterCardProps> = ({
  inverter,
  isSelected,
  onClick,
}) => {
  const isCrit = inverter.status === "critical";
  const isWarn = inverter.status === "warning";

  const borderColor = isSelected
    ? "border-cyan-400 bg-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
    : isCrit
    ? "border-red-500/60 bg-red-950/20 hover:border-red-400"
    : isWarn
    ? "border-amber-500/60 bg-amber-950/20 hover:border-amber-400"
    : "border-slate-800 bg-slate-900/60 hover:border-slate-700";

  const statusDot = isCrit
    ? "bg-red-400 shadow-[0_0_8px_#ef4444]"
    : isWarn
    ? "bg-amber-400 shadow-[0_0_8px_#f59e0b]"
    : "bg-emerald-400 shadow-[0_0_8px_#10b981]";

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer transition ${borderColor}`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold text-slate-200">
            {inverter.inverterId}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
            {inverter.name}
          </span>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
      </div>

      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono mt-2 pt-2 border-t border-slate-800/80">
        <div>
          <span className="text-[9px] text-slate-400 block">AC Power</span>
          <span className="text-slate-100 font-bold">
            {inverter.acPowerKw.toFixed(1)} kW
          </span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 block">Efficiency</span>
          <span className="text-slate-200">
            {inverter.efficiencyPct.toFixed(1)}%
          </span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-slate-400 block">IGBT Temp</span>
          <span
            className={
              inverter.inverterTempC >= 75
                ? "text-red-400 font-bold animate-pulse"
                : "text-slate-200"
            }
          >
            {inverter.inverterTempC.toFixed(0)}°C
          </span>
        </div>
      </div>

      {inverter.faultState && (
        <div className="mt-2 text-[10px] text-red-400 font-semibold truncate flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          <span>{inverter.faultState}</span>
        </div>
      )}
    </div>
  );
};
