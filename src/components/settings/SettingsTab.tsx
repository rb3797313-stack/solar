"use client";

import React, { useState } from "react";
import {
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Zap,
  DollarSign,
  ShieldAlert,
  Info,
} from "lucide-react";
import { PlantConfig } from "@/types";
import { DEFAULT_PLANT_CONFIG } from "@/lib/physics";

interface SettingsTabProps {
  config: PlantConfig;
  onSaveConfig: (newConfig: PlantConfig) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<PlantConfig>(config);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const handleReset = () => {
    setFormData(DEFAULT_PLANT_CONFIG);
    onSaveConfig(DEFAULT_PLANT_CONFIG);
  };

  return (
    <div className="space-y-4 pb-8 max-w-4xl">
      {/* Header Banner */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Plant Physics & SCADA Threshold Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Calibrate pvlib model coefficients, inverter derating triggers, and financial tariffs.
            </p>
          </div>
        </div>

        {savedNotification && (
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30 animate-pulse">
            <CheckCircle2 className="w-4 h-4" /> Parameters Saved to SCADA Store
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Plant Infrastructure */}
        <div className="scada-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            1. Station Hardware & Geometry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Plant Facility Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Geographic Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Total DC Rated Capacity (kWp)</label>
              <input
                type="number"
                value={formData.ratedCapacityKw}
                onChange={(e) => setFormData({ ...formData, ratedCapacityKw: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Racking Tilt Angle (°)</label>
              <input
                type="number"
                value={formData.tiltDeg}
                onChange={(e) => setFormData({ ...formData, tiltDeg: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Physics Modeling Parameters */}
        <div className="scada-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            2. Physics Model (pvlib) Coefficients
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Temperature Coeff γ (%/°C)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tempCoeffPercent}
                onChange={(e) => setFormData({ ...formData, tempCoeffPercent: parseFloat(e.target.value) || -0.38 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: -0.38% (Mono-Si)</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Nominal Inverter Efficiency</label>
              <input
                type="number"
                step="0.001"
                value={formData.nominalInverterEfficiency}
                onChange={(e) => setFormData({ ...formData, nominalInverterEfficiency: parseFloat(e.target.value) || 0.985 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 0.985 (98.5%)</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Baseline Clean Soiling Factor</label>
              <input
                type="number"
                step="0.001"
                value={formData.soilingBaselineFactor}
                onChange={(e) => setFormData({ ...formData, soilingBaselineFactor: parseFloat(e.target.value) || 0.985 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Default: 0.985 (1.5% optical loss)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Financial & Alarm Trigger Thresholds */}
        <div className="scada-panel p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            3. Financial Tariff & SCADA Alarm Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">PPA Energy Tariff ($/kWh)</label>
              <input
                type="number"
                step="0.001"
                value={formData.tariffPerKwh}
                onChange={(e) => setFormData({ ...formData, tariffPerKwh: parseFloat(e.target.value) || 0.082 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">PPA Feed-in Contract</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Yield Gap Alert Threshold (%)</label>
              <input
                type="number"
                step="0.5"
                value={formData.yieldGapAlertThresholdPct}
                onChange={(e) => setFormData({ ...formData, yieldGapAlertThresholdPct: parseFloat(e.target.value) || 8.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Triggers Warning Alarm</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Inverter Derating Limit (°C)</label>
              <input
                type="number"
                step="1"
                value={formData.deratingTempThresholdC}
                onChange={(e) => setFormData({ ...formData, deratingTempThresholdC: parseFloat(e.target.value) || 75.0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">IGBT Thermal Trip</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Factory Baselines</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply SCADA Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
