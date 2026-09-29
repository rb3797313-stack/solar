"use client";

import React from "react";
import {
  LayoutDashboard,
  Stethoscope,
  Grid,
  TrendingUp,
  AlertTriangle,
  Database,
  Sliders,
  Radio,
  Cpu,
  ShieldCheck,
} from "lucide-react";

export type TabType =
  | "overview"
  | "diagnostics"
  | "plant"
  | "analytics"
  | "alerts"
  | "data"
  | "settings";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeAlarmsCount: {
    critical: number;
    warning: number;
    info: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  activeAlarmsCount,
}) => {
  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "diagnostics", label: "Diagnostics", icon: Stethoscope },
    { id: "plant", label: "Plant Layout", icon: Grid },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    {
      id: "alerts",
      label: "Alerts",
      icon: AlertTriangle,
      badge: activeAlarmsCount.critical + activeAlarmsCount.warning,
      badgeColor: activeAlarmsCount.critical > 0 ? "bg-red-500" : "bg-amber-500",
    },
    { id: "data", label: "Data Ingestion", icon: Database },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  return (
    <aside className="w-60 border-r border-slate-800 bg-slate-950/70 flex flex-col justify-between flex-shrink-0 select-none">
      {/* Navigation List */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
          <span>Control Console</span>
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition duration-150 ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.12)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? "text-cyan-400" : "text-slate-500"
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Station Hardware Metadata */}
      <div className="p-3.5 m-2.5 rounded-lg bg-slate-900/70 border border-slate-800/90 text-slate-400">
        <div className="flex items-center gap-2 mb-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
            Solaria West PV
          </span>
        </div>
        <div className="space-y-1 text-[10px] font-mono text-slate-400">
          <div className="flex justify-between">
            <span>Capacity:</span>
            <span className="text-slate-200 font-semibold">1,200 kWp DC</span>
          </div>
          <div className="flex justify-between">
            <span>Inverters:</span>
            <span className="text-slate-200">12x Central (100 kW)</span>
          </div>
          <div className="flex justify-between">
            <span>Location:</span>
            <span className="text-slate-200">Mojave 35.01° N</span>
          </div>
          <div className="flex justify-between">
            <span>PPA Tariff:</span>
            <span className="text-emerald-400 font-semibold">$0.082 / kWh</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Physics Model
          </span>
          <span className="text-slate-400 font-mono">pvlib-v1</span>
        </div>
      </div>
    </aside>
  );
};
