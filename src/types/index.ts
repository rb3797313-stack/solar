export type SeverityLevel = "NORMAL" | "LOW" | "MEDIUM" | "WARNING" | "CRITICAL";
export type PlantHealth = "HEALTHY" | "WARNING" | "CRITICAL";


export interface PlantConfig {
  plantId: string;
  name: string;
  location: string;
  ratedCapacityKw: number;
  latitude: number;
  longitude: number;
  tiltDeg: number;
  azimuthDeg: number;
  tempCoeffPercent: number; // e.g. -0.38 (%/°C)
  nominalInverterEfficiency: number; // e.g. 0.985
  wiringLossFactor: number; // e.g. 0.98
  soilingBaselineFactor: number; // e.g. 0.985
  tariffPerKwh: number; // e.g. 0.08 ($) or 6.5 (INR)
  currencySymbol: string; // "$"
  yieldGapAlertThresholdPct: number; // 8.0%
  deratingTempThresholdC: number; // 75.0°C
}

export interface WeatherTelemetry {
  timestamp: string;
  irradiancePoa: number; // W/m2
  irradianceGhi: number; // W/m2
  ambientTempC: number; // °C
  moduleTempC: number; // °C
  windSpeedKmh: number; // km/h
  sensorQualityScore: number; // 0 - 100%
  sensorFlags: string[];
}

export interface PvString {
  stringId: string;
  currentA: number;
  voltageV: number;
  powerW: number;
  status: "normal" | "mismatch" | "open_circuit" | "shaded";
}

export interface MpptChannel {
  mpptId: string;
  voltageV: number;
  currentA: number;
  powerKw: number;
  strings: PvString[];
}

export interface InverterTelemetry {
  inverterId: string;
  name: string;
  ratedPowerKw: number;
  status: "healthy" | "warning" | "critical" | "offline";
  dcVoltage: number;
  dcCurrent: number;
  dcPowerKw: number;
  acPowerKw: number;
  expectedPowerKw: number;
  yieldGapKw: number;
  yieldGapPct: number;
  efficiencyPct: number;
  inverterTempC: number;
  mpptChannels: MpptChannel[];
  faultState: string | null;
}

export interface PlantTelemetry {
  timestamp: string;
  timeFormatted: string;
  gridStatus: "normal" | "curtailed" | "voltage_high" | "frequency_deviation" | "disconnected";
  gridFrequencyHz: number;
  gridVoltageV: number;
  totalActualPowerKw: number;
  totalExpectedPowerKw: number;
  totalYieldGapKw: number;
  totalYieldGapPct: number;
  performanceRatioPct: number;
  todayEnergyGeneratedKwh: number;
  todayExpectedEnergyKwh: number;
  todayEnergyLossKwh: number;
  todayMonetaryLoss: number;
  activeAlarmsCount: {
    critical: number;
    warning: number;
    info: number;
  };
  overallPlantHealth: PlantHealth;
  inverters: InverterTelemetry[];
  weather: WeatherTelemetry;
}

export interface EvidenceItem {
  parameter: string;
  observedValue: string;
  expectedValue: string;
  verdict: "normal" | "abnormal" | "critical";
  badge: string;
  explanation: string;
}

export interface FaultDiagnosis {
  faultType:
    | "Normal Operation"
    | "Uniform Soiling"
    | "Partial Shading"
    | "Inverter Derating"
    | "String Mismatch / Open Circuit"
    | "Grid Curtailment"
    | "Sensor Calibration Drift";
  faultCode: string;
  severity: SeverityLevel;
  confidencePct: number;
  affectedAssets: string[];
  estimatedPowerLossKw: number;
  estimatedDailyLossKwh: number;
  estimatedMonthlyLossMwh: number;
  estimatedRevenueLossToday: number;
  evidence: EvidenceItem[];
  rootCauseDescription: string;
  recommendedAction: string;
  priority: "P1 - Immediate" | "P2 - Within 24h" | "P3 - Scheduled Maintenance" | "None";
}

export interface AlertItem {
  id: string;
  timestamp: string;
  timeFormatted: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  affectedAsset: string;
  title: string;
  diagnosis: string;
  recommendedAction: string;
  status: "Active" | "Acknowledged" | "Resolved";
}

export type ScenarioType =
  | "normal"
  | "inverter_derating"
  | "partial_shading"
  | "uniform_soiling"
  | "string_fault"
  | "grid_curtailment"
  | "sensor_drift";

export interface SimulationScenario {
  id: ScenarioType;
  title: string;
  shortDesc: string;
  description: string;
  targetAsset: string;
}
