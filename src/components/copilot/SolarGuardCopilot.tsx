"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  Zap,
  HelpCircle,
  Wrench,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { FaultDiagnosis, PlantTelemetry } from "@/types";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
}

interface SolarGuardCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: PlantTelemetry;
  diagnosis: FaultDiagnosis;
  onNavigateToDiagnostics: () => void;
}

export const SolarGuardCopilot: React.FC<SolarGuardCopilotProps> = ({
  isOpen,
  onClose,
  telemetry,
  diagnosis,
  onNavigateToDiagnostics,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-0",
      sender: "copilot",
      text: "Hello! I am SolarGuard Copilot, your SCADA AI assistant. I continuously analyze Solaria West's physics model, string telemetry, and inverter temperatures. How can I assist your O&M shift?",
      timestamp: "12:30 PM",
    },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    "Why is plant generation low?",
    "Which inverter is causing the largest loss?",
    "What happened in the last hour?",
    "Show today's major faults.",
    "What should the O&M team inspect first?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputText;
    if (!q.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          context: {
            diagnosis,
            yieldGapKw: telemetry.totalYieldGapKw,
            yieldGapPct: telemetry.totalYieldGapPct,
            overallPlantHealth: telemetry.overallPlantHealth,
            activeAlarms: telemetry.activeAlarmsCount.critical + telemetry.activeAlarmsCount.warning,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `c-${Date.now()}`,
            sender: "copilot",
            text: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        generateLocalReply(q);
      }
    } catch (e) {
      generateLocalReply(q);
    } finally {
      setIsTyping(false);
    }
  };

  const generateLocalReply = (q: string) => {
    const query = q.toLowerCase();
    const affected = diagnosis.affectedAssets.join(", ");
    let reply = "";

    if (query.includes("why") && (query.includes("low") || query.includes("generation"))) {
      if (diagnosis.faultType === "Normal Operation") {
        reply = `Plant generation is operating normally at ${telemetry.totalActualPowerKw.toFixed(1)} kW (98.2% tracking physics model). No abnormal degradation detected.`;
      } else {
        const evidenceStr = diagnosis.evidence.map((e) => `• ${e.parameter}: ${e.explanation}`).join("\n");
        reply = `Plant generation is currently underperforming by ${telemetry.totalYieldGapKw.toFixed(1)} kW (${telemetry.totalYieldGapPct.toFixed(1)}%) primarily due to **${diagnosis.faultType}** affecting **${affected}**.\n\n**Evidence:**\n${evidenceStr}\n\n**Recommended O&M Action:**\n${diagnosis.recommendedAction}`;
      }
    } else if (query.includes("which inverter") || query.includes("largest loss") || query.includes("worst")) {
      reply = `The largest current yield loss is on **${affected}** due to **${diagnosis.faultType}**.\n\nInstantaneous deficit: **${diagnosis.estimatedPowerLossKw.toFixed(1)} kW**\nToday's projected loss: **${diagnosis.estimatedDailyLossKwh.toFixed(1)} kWh** ($${diagnosis.estimatedRevenueLossToday.toFixed(2)}).`;
    } else if (query.includes("what happened") || query.includes("last hour")) {
      reply = `Over the last hour, plant health is in **${telemetry.overallPlantHealth}** status.\n\n• Primary classified issue: **${diagnosis.faultType}** (${diagnosis.confidencePct}% confidence)\n• Active alarms: ${telemetry.activeAlarmsCount.critical} critical, ${telemetry.activeAlarmsCount.warning} warning\n• Substation interconnect: ${telemetry.gridStatus}.`;
    } else if (query.includes("inspect") || query.includes("action") || query.includes("first")) {
      reply = `**Immediate O&M Inspection Directive (${diagnosis.priority}):**\n\n1. Target: **${affected}**\n2. Action: ${diagnosis.recommendedAction}\n3. Estimated capacity to recover upon fix: +${diagnosis.estimatedPowerLossKw.toFixed(1)} kW.`;
    } else {
      reply = `Current Plant Telemetry Snapshot:\n• Output: ${telemetry.totalActualPowerKw.toFixed(1)} kW (Expected: ${telemetry.totalExpectedPowerKw.toFixed(1)} kW)\n• Yield Gap: -${telemetry.totalYieldGapKw.toFixed(1)} kW (${telemetry.totalYieldGapPct.toFixed(1)}%)\n• Active Diagnosis: ${diagnosis.faultType} on ${affected}\n• Recommended Action: ${diagnosis.recommendedAction}`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        sender: "copilot",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950/95 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              SolarGuard Copilot
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                SCADA AI
              </span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Grounded in Solaria West Live Telemetry
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"
              }`}
          >
            <div
              className={`p-3 rounded-xl max-w-[88%] text-xs leading-relaxed ${msg.sender === "user"
                  ? "bg-cyan-600 text-white rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md"
                }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 w-28">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Analyzing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
          <span>Suggested SCADA Queries:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className="text-[11px] text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 px-2.5 py-1 rounded-full transition flex items-center gap-1 text-left"
            >
              <span>{p}</span>
              <ChevronRight className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask SolarGuard Copilot about faults, inverters, PR..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
        />
        <button
          onClick={() => handleSend()}
          className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.3)]"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
