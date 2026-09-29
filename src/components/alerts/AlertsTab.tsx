"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Check,
  Wrench,
} from "lucide-react";
import { AlertItem } from "@/types";

interface AlertsTabProps {
  alerts: AlertItem[];
  onAcknowledgeAlert: (id: string) => void;
  onResolveAlert: (id: string) => void;
  onNavigateToDiagnostics: () => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onNavigateToDiagnostics,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSeverity =
      filterSeverity === "ALL" || alert.severity === filterSeverity;
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.affectedAsset.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header Banner */}
      <div className="scada-panel rounded-xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Chronological SCADA Alert Timeline
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                Live Event Sequence
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail of detected underperformance anomalies, sensor drift, and O&M dispatches.
            </p>
          </div>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts or assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
          </div>

          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
            {["ALL", "CRITICAL", "WARNING", "INFO"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-md transition font-mono ${
                  filterSeverity === sev
                    ? sev === "CRITICAL"
                      ? "bg-red-500/20 text-red-300 font-bold"
                      : sev === "WARNING"
                      ? "bg-amber-500/20 text-amber-300 font-bold"
                      : sev === "INFO"
                      ? "bg-cyan-500/20 text-cyan-300 font-bold"
                      : "bg-slate-700 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chronological Timeline Container */}
      <div className="scada-panel rounded-xl p-4 sm:p-6 border border-slate-800">
        <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
          {filteredAlerts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No alarms matching current criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isCrit = alert.severity === "CRITICAL";
              const isWarn = alert.severity === "WARNING";
              const dotColor = isCrit
                ? "bg-red-500 shadow-[0_0_10px_#ef4444]"
                : isWarn
                ? "bg-amber-500 shadow-[0_0_8px_#f59e0b]"
                : "bg-cyan-400";
              const badgeColor = isCrit
                ? "bg-red-500/20 text-red-300 border-red-500/40"
                : isWarn
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";

              return (
                <div key={alert.id} className="relative group">
                  {/* Timeline Node Point */}
                  <span
                    className={`absolute -left-[23px] sm:-left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${dotColor}`}
                  />

                  {/* Alert Content Card */}
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {alert.timeFormatted}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <h4 className="text-sm font-bold text-slate-100 font-mono">
                          {alert.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeColor}`}
                        >
                          {alert.severity}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            alert.status === "Active"
                              ? "bg-red-950 text-red-400 border border-red-800"
                              : alert.status === "Acknowledged"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          }`}
                        >
                          {alert.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 font-mono mb-2">
                      <span className="text-slate-400">Affected Asset: </span>
                      <span className="text-cyan-300 font-semibold">
                        {alert.affectedAsset}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {alert.diagnosis}
                    </p>

                    {/* Actionable Directive & Controls */}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Wrench className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="font-semibold text-slate-400">Directive:</span>
                        <span className="text-slate-300">{alert.recommendedAction}</span>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        {alert.status === "Active" && (
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {alert.status !== "Resolved" && (
                          <button
                            onClick={() => onResolveAlert(alert.id)}
                            className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
