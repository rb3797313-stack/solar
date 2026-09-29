"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, TabType } from "@/components/layout/Sidebar";
import { OverviewTab } from "@/components/overview/OverviewTab";
import { DiagnosticsTab } from "@/components/diagnostics/DiagnosticsTab";
import { PlantTab } from "@/components/plant/PlantTab";
import { AnalyticsTab } from "@/components/analytics/AnalyticsTab";
import { AlertsTab } from "@/components/alerts/AlertsTab";
import { DataTab } from "@/components/data/DataTab";
import { SettingsTab } from "@/components/settings/SettingsTab";
import { SolarGuardCopilot } from "@/components/copilot/SolarGuardCopilot";
import { DiagnosticReportModal } from "@/components/report/DiagnosticReportModal";

import {
  PlantTelemetry,
  ScenarioType,
  FaultDiagnosis,
  AlertItem,
  PlantConfig,
} from "@/types";
import {
  getInitialPlantTelemetry,
  generate24HourHistory,
  stepSimulation,
} from "@/lib/simulation";
import { diagnosePlantState } from "@/lib/diagnostics";
import { INITIAL_ALERTS } from "@/lib/alerts";
import { DEFAULT_PLANT_CONFIG } from "@/lib/physics";

export default function SolarGuardDashboard() {
  // Navigation & UI Modals
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedInverterId, setSelectedInverterId] = useState<string | null>(null);

  // Core Data Stores
  const [plantConfig, setPlantConfig] = useState<PlantConfig>(DEFAULT_PLANT_CONFIG);
  const [telemetry, setTelemetry] = useState<PlantTelemetry>(getInitialPlantTelemetry());
  const [historyData, setHistoryData] = useState(generate24HourHistory());
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);

  // Simulation State
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("normal");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressRatio, setProgressRatio] = useState<number>(0.0);
  const [simSpeed, setSimSpeed] = useState<number>(1);

  // Compute live diagnosis based on current telemetry
  const [diagnosis, setDiagnosis] = useState<FaultDiagnosis>(() =>
    diagnosePlantState(getInitialPlantTelemetry())
  );

  // Update diagnosis whenever telemetry updates
  useEffect(() => {
    // Attempt backend diagnosis with fallback to local hybrid engine
    const runDiagnosis = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/diagnose`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telemetry),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.diagnosis) {
            setDiagnosis(data.diagnosis);
            return;
          }
        }
      } catch (err) {
        // Fallback to local TypeScript diagnostic engine
      }
      const localDiag = diagnosePlantState(telemetry);
      setDiagnosis(localDiag);
    };

    runDiagnosis();
  }, [telemetry]);

  // Simulation Tick Loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(200, 1000 / simSpeed);
    const interval = setInterval(() => {
      setProgressRatio((prev) => {
        const next = Math.min(1.0, prev + 0.08);

        setTelemetry((currTel) => {
          const updated = stepSimulation(currTel, selectedScenario, next);

          // If fault becomes pronounced (> 0.4 progress) and not yet logged in alerts, add live alert
          if (next >= 0.4 && prev < 0.4 && selectedScenario !== "normal") {
            const scenarioLabels: Record<string, string> = {
              inverter_derating: "Inverter Thermal Derating Detected",
              partial_shading: "Partial Shading — String Current Mismatch",
              uniform_soiling: "Uniform Soiling Loss Detected",
              string_fault: "String Open-Circuit Fault (Blown Fuse)",
              grid_curtailment: "Grid Export Curtailment Active",
              sensor_drift: "Pyranometer Sensor Calibration Drift",
            };
            const scenarioAssets: Record<string, string> = {
              inverter_derating: "INV-05 (Block B Central)",
              partial_shading: "INV-03 MPPT-2 (Strings 3 & 4)",
              string_fault: "INV-08 MPPT-1 STR-02",
              grid_curtailment: "POI Substation Governor",
              uniform_soiling: "Plant PV Array (All Blocks A-D)",
              sensor_drift: "Met-Mast POA Pyranometer 01",
            };
            const newAlert: AlertItem = {
              id: `ALT-LIVE-${Date.now()}`,
              timestamp: new Date().toISOString(),
              timeFormatted: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              severity:
                selectedScenario === "inverter_derating" || selectedScenario === "string_fault"
                  ? "CRITICAL"
                  : "WARNING",
              affectedAsset: scenarioAssets[selectedScenario] || "Plant PV Array",
              title: scenarioLabels[selectedScenario] || `${selectedScenario.replace(/_/g, " ")} Detected`,
              diagnosis: `AI diagnostic engine classified fault with ${next > 0.6 ? "HIGH" : "MEDIUM"} confidence. Yield gap diverging from physics model — immediate O&M review recommended.`,
              recommendedAction: "Navigate to Diagnostics workspace for full evidence breakdown and recommended O&M action.",
              status: "Active",
            };

            setAlerts((a) => [newAlert, ...a]);
          }

          // Update history chart at current time point (12:30 simulation noon peak)
          setHistoryData((prevHistory) => {
            const updatedHistory = [...prevHistory];
            const noonIdx = updatedHistory.findIndex((d) => d.time === "12:30");
            if (noonIdx !== -1) {
              updatedHistory[noonIdx] = {
                ...updatedHistory[noonIdx],
                actualKw: updated.totalActualPowerKw,
                expectedKw: updated.totalExpectedPowerKw,
                yieldGapKw: updated.totalYieldGapKw,
                poa: updated.weather.irradiancePoa,
              };
            }
            return updatedHistory;
          });

          return updated;
        });

        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed, selectedScenario]);

  // Scenario Change Handler
  const handleScenarioChange = (scenario: ScenarioType) => {
    setSelectedScenario(scenario);
    setProgressRatio(0.0);
    // If switching scenario while playing, immediately step with new scenario
    const base = getInitialPlantTelemetry();
    if (scenario === "normal") {
      setTelemetry(base);
      setIsPlaying(false);
    } else {
      setTelemetry(stepSimulation(base, scenario, 0.1));
      setIsPlaying(true);
    }
  };

  const handleStep = () => {
    setProgressRatio((prev) => {
      const next = Math.min(1.0, prev + 0.15);
      setTelemetry((curr) => stepSimulation(curr, selectedScenario, next));
      return next;
    });
  };

  const handleReset = () => {
    setSelectedScenario("normal");
    setProgressRatio(0.0);
    setIsPlaying(false);
    setTelemetry(getInitialPlantTelemetry());
  };

  const handleAcknowledgeAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Acknowledged" } : a))
    );
  };

  const handleResolveAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Resolved" } : a))
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070c14] text-slate-100 font-sans">
      {/* 1. Global Header */}
      <Header
        telemetry={telemetry}
        selectedScenario={selectedScenario}
        isPlaying={isPlaying}
        simSpeed={simSpeed}
        onScenarioChange={handleScenarioChange}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={setSimSpeed}
        onOpenReport={() => setIsReportModalOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        isCopilotOpen={isCopilotOpen}
      />

      {/* 2. Main Body with Sidebar + Tab Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            if (tab === "plant") {
              setSelectedInverterId(null);
            }
          }}
          activeAlarmsCount={telemetry.activeAlarmsCount}
        />

        {/* Tab Content Display Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#080d16] to-[#05080e]">
          {activeTab === "overview" && (
            <OverviewTab
              telemetry={telemetry}
              diagnosis={diagnosis}
              historyData={historyData}
              onNavigateToDiagnostics={() => setActiveTab("diagnostics")}
              onSelectInverter={(id) => {
                setSelectedInverterId(id);
                setActiveTab("plant");
              }}
            />
          )}

          {activeTab === "diagnostics" && (
            <DiagnosticsTab
              telemetry={telemetry}
              diagnosis={diagnosis}
              onOpenReport={() => setIsReportModalOpen(true)}
            />
          )}

          {activeTab === "plant" && (
            <PlantTab
              telemetry={telemetry}
              selectedInverterId={selectedInverterId}
              onSelectInverter={setSelectedInverterId}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsTab
              telemetry={telemetry}
              historyData={historyData}
            />
          )}

          {activeTab === "alerts" && (
            <AlertsTab
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
              onNavigateToDiagnostics={() => setActiveTab("diagnostics")}
            />
          )}

          {activeTab === "data" && (
            <DataTab onOpenReport={() => setIsReportModalOpen(true)} />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              config={plantConfig}
              onSaveConfig={(cfg) => setPlantConfig(cfg)}
            />
          )}
        </main>
      </div>

      {/* 3. SolarGuard Copilot Slide-over Panel */}
      <SolarGuardCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        telemetry={telemetry}
        diagnosis={diagnosis}
        onNavigateToDiagnostics={() => {
          setIsCopilotOpen(false);
          setActiveTab("diagnostics");
        }}
      />

      {/* 4. Diagnostic Report Modal (Print / PDF) */}
      <DiagnosticReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        telemetry={telemetry}
        diagnosis={diagnosis}
      />
    </div>
  );
}
