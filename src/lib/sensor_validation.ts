export interface TelemetryPoint {
  timestamp: string;
  irradiancePoa: number;
  irradianceGhi: number;
  ambientTempC: number;
  moduleTempC: number;
  windSpeedKmh: number;
  dcVoltage?: number;
  dcCurrent?: number;
  acPower?: number;
  inverterTemp?: number;
}

export interface SensorValidationReport {
  isValid: boolean;
  qualityScorePct: number; // 0 to 100
  flags: Array<{
    sensor: string;
    issueType: "IMPOSSIBLE_VALUE" | "STUCK_SENSOR" | "UNREALISTIC_SPIKE" | "DISAGREEMENT" | "MISSING_DATA";
    severity: "CRITICAL" | "WARNING" | "INFO";
    message: string;
  }>;
  cleanedTelemetry: TelemetryPoint;
}

/**
 * Validates SCADA & weather telemetry against physical plausibility,
 * stuck-sensor signatures, unrealistic rate-of-change, and sensor cross-checks.
 */
export function validateTelemetry(
  current: TelemetryPoint,
  history: TelemetryPoint[] = []
): SensorValidationReport {
  const flags: SensorValidationReport["flags"] = [];
  let penalty = 0;

  // 1. Missing or Null Data Checks
  if (current.irradiancePoa === undefined || current.irradiancePoa === null || isNaN(current.irradiancePoa)) {
    flags.push({
      sensor: "POA Pyranometer",
      issueType: "MISSING_DATA",
      severity: "CRITICAL",
      message: "Irradiance POA value is missing or NaN.",
    });
    penalty += 35;
  }

  if (current.ambientTempC === undefined || current.ambientTempC === null || isNaN(current.ambientTempC)) {
    flags.push({
      sensor: "Ambient RTD",
      issueType: "MISSING_DATA",
      severity: "WARNING",
      message: "Ambient temperature reading is missing.",
    });
    penalty += 15;
  }

  // 2. Impossible Physical Range Checks
  if (current.irradiancePoa < 0 || current.irradiancePoa > 1550) {
    flags.push({
      sensor: "POA Pyranometer",
      issueType: "IMPOSSIBLE_VALUE",
      severity: "CRITICAL",
      message: `Irradiance POA of ${current.irradiancePoa} W/m² exceeds extraterrestrial/physical limits (0-1550 W/m²).`,
    });
    penalty += 40;
  }

  if (current.ambientTempC < -40 || current.ambientTempC > 65) {
    flags.push({
      sensor: "Ambient RTD",
      issueType: "IMPOSSIBLE_VALUE",
      severity: "CRITICAL",
      message: `Ambient temperature ${current.ambientTempC}°C is outside terrestrial sensor bounds (-40°C to +65°C).`,
    });
    penalty += 25;
  }

  if (current.moduleTempC < -40 || current.moduleTempC > 115) {
    flags.push({
      sensor: "Module Thermocouple",
      issueType: "IMPOSSIBLE_VALUE",
      severity: "CRITICAL",
      message: `Module temperature ${current.moduleTempC}°C exceeds physical PV module boundaries (-40°C to +115°C).`,
    });
    penalty += 25;
  }

  // 3. Physical Cross-Validation / Sensor Disagreement (POA vs GHI)
  // On a tilted plane, POA is normally within a physical envelope of GHI
  if (current.irradianceGhi > 300 && current.irradiancePoa > 0) {
    const ratio = current.irradiancePoa / current.irradianceGhi;
    if (ratio < 0.3 || ratio > 2.5) {
      flags.push({
        sensor: "Solar Sensor Array",
        issueType: "DISAGREEMENT",
        severity: "WARNING",
        message: `POA (${current.irradiancePoa} W/m²) and GHI (${current.irradianceGhi} W/m²) ratio (${ratio.toFixed(2)}) indicates possible sensor drift or misalignment.`,
      });
      penalty += 20;
    }
  }

  // High irradiance vs Module Temp check: Module temp should be >= Ambient temp when POA > 400 W/m²
  if (current.irradiancePoa > 400 && current.moduleTempC < current.ambientTempC - 3) {
    flags.push({
      sensor: "Module Thermocouple",
      issueType: "DISAGREEMENT",
      severity: "WARNING",
      message: `Module temp (${current.moduleTempC}°C) is cooler than ambient (${current.ambientTempC}°C) under high sun (${current.irradiancePoa} W/m²). Suspect sensor detachment.`,
    });
    penalty += 20;
  }

  // 4. Rate-of-Change / Unrealistic Spikes & Stuck Sensor checks using history
  if (history.length >= 3) {
    const prev = history[history.length - 1];
    
    // Unrealistic temperature jumps (> 12°C jump in 1-5 minutes)
    if (Math.abs(current.ambientTempC - prev.ambientTempC) > 12) {
      flags.push({
        sensor: "Ambient RTD",
        issueType: "UNREALISTIC_SPIKE",
        severity: "CRITICAL",
        message: `Rapid unphysical ambient temperature change of ${Math.abs(current.ambientTempC - prev.ambientTempC).toFixed(1)}°C detected.`,
      });
      penalty += 25;
    }

    // Stuck sensor detection (e.g. constant irradiance value to 3 decimal places over consecutive intervals while time advances)
    if (current.irradiancePoa > 200) {
      const recentPoa = [...history.slice(-4).map((h) => h.irradiancePoa), current.irradiancePoa];
      const variance = recentPoa.reduce((acc, val, _, arr) => acc + Math.pow(val - arr[0], 2), 0);
      if (variance === 0 && recentPoa.length >= 4) {
        flags.push({
          sensor: "POA Pyranometer",
          issueType: "STUCK_SENSOR",
          severity: "WARNING",
          message: `POA sensor stuck at constant value ${current.irradiancePoa} W/m² for multiple consecutive telemetry frames.`,
        });
        penalty += 25;
      }
    }
  }

  const qualityScorePct = Math.max(0, 100 - penalty);
  const isValid = qualityScorePct >= 60 && !flags.some((f) => f.severity === "CRITICAL");

  // Cleaned telemetry: clamp impossible readings to nearest valid physical limits
  const cleanedTelemetry: TelemetryPoint = {
    ...current,
    irradiancePoa: Math.max(0, Math.min(1500, isNaN(current.irradiancePoa) ? 0 : current.irradiancePoa)),
    irradianceGhi: Math.max(0, Math.min(1400, isNaN(current.irradianceGhi) ? 0 : current.irradianceGhi)),
    ambientTempC: Math.max(-20, Math.min(55, isNaN(current.ambientTempC) ? 25 : current.ambientTempC)),
    moduleTempC: Math.max(-20, Math.min(95, isNaN(current.moduleTempC) ? current.ambientTempC + 15 : current.moduleTempC)),
    windSpeedKmh: Math.max(0, Math.min(160, isNaN(current.windSpeedKmh) ? 5 : current.windSpeedKmh)),
  };

  return {
    isValid,
    qualityScorePct,
    flags,
    cleanedTelemetry,
  };
}
