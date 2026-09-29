import { PlantConfig } from "@/types";

export const DEFAULT_PLANT_CONFIG: PlantConfig = {
  plantId: "SG-PLANT-01",
  name: "Solaria West Utility PV Station",
  location: "Mojave Desert, Sector 4-B",
  ratedCapacityKw: 1200, // 1.2 MW DC
  latitude: 35.011,
  longitude: -115.473,
  tiltDeg: 25,
  azimuthDeg: 180,
  tempCoeffPercent: -0.38, // -0.38% / °C (standard mono-Si)
  nominalInverterEfficiency: 0.985, // 98.5%
  wiringLossFactor: 0.982, // 1.8% wiring & collection losses
  soilingBaselineFactor: 0.985, // 1.5% baseline clean glass transmission loss
  tariffPerKwh: 0.082, // $0.082 / kWh PPA rate
  currencySymbol: "$",
  yieldGapAlertThresholdPct: 8.0, // 8% threshold for warning
  deratingTempThresholdC: 75.0, // 75°C internal threshold for derating
};

/**
 * Calculates cell/module temperature from ambient temperature and POA irradiance
 * using the standard PVsyst / King NOCT heat dissipation formula if direct module sensor is absent.
 */
export function estimateCellTemperature(
  ambientTempC: number,
  poaWPerM2: number,
  noctC: number = 45
): number {
  if (poaWPerM2 <= 10) return ambientTempC;
  // Tcell = Tamb + (NOCT - 20) * (POA / 800) * (1 - eta_stc / tau_alpha)
  const cellTemp = ambientTempC + (poaWPerM2 / 800) * (noctC - 20) * 0.9;
  return Number(cellTemp.toFixed(2));
}

/**
 * Calculates inverter dynamic efficiency based on relative loading ratio.
 * Models the classic CEC / Sandia inverter efficiency curve (high at >20% load, tapering near zero).
 */
export function calculateInverterEfficiency(
  dcPowerKw: number,
  ratedPowerKw: number,
  nominalEfficiency: number = 0.985
): number {
  if (dcPowerKw <= 0.5) return 0;
  const loadRatio = Math.min(1.2, dcPowerKw / ratedPowerKw);
  if (loadRatio < 0.05) {
    return nominalEfficiency * (loadRatio / 0.05) * 0.85;
  }
  // Realistic CEC curve: efficiency plateaus from 25% to 100% load
  const loadPenalty = 0.02 * Math.exp(-loadRatio * 8);
  return Math.min(nominalEfficiency, nominalEfficiency - loadPenalty);
}

/**
 * Physics-Informed Expected Power Model (pvlib-compatible).
 * Formula:
 * P_expected = P_rated * (G_poa / 1000) * [1 + (gamma / 100) * (T_cell - 25)] * eta_inv * eta_wiring * eta_soiling
 */
export function calculateExpectedPowerKw(
  poaWPerM2: number,
  cellTempC: number,
  ratedCapacityKw: number = DEFAULT_PLANT_CONFIG.ratedCapacityKw,
  config: PlantConfig = DEFAULT_PLANT_CONFIG
): number {
  // Low-light inverter startup cutoff (< 25 W/m2)
  if (poaWPerM2 < 25) {
    return 0;
  }

  const irradianceRatio = poaWPerM2 / 1000.0;
  const tempDelta = cellTempC - 25.0; // STC reference is 25°C
  const tempCorrection = 1.0 + (config.tempCoeffPercent / 100.0) * tempDelta;

  const systemEfficiency =
    config.nominalInverterEfficiency *
    config.wiringLossFactor *
    config.soilingBaselineFactor;

  const rawExpected =
    ratedCapacityKw * irradianceRatio * tempCorrection * systemEfficiency;

  return Math.max(0, Number(rawExpected.toFixed(2)));
}

/**
 * Calculates Yield Gap metrics:
 * yield_gap_kw = expected_power_kw - actual_power_kw
 * yield_gap_percent = (expected_power_kw - actual_power_kw) / expected_power_kw * 100
 */
export function calculateYieldGap(
  expectedKw: number,
  actualKw: number
): {
  yieldGapKw: number;
  yieldGapPct: number;
  underperforming: boolean;
} {
  if (expectedKw <= 5.0) {
    return {
      yieldGapKw: 0,
      yieldGapPct: 0,
      underperforming: false,
    };
  }

  const gapKw = Math.max(0, expectedKw - actualKw);
  const gapPct = (gapKw / expectedKw) * 100.0;

  return {
    yieldGapKw: Number(gapKw.toFixed(2)),
    yieldGapPct: Number(gapPct.toFixed(1)),
    underperforming: gapPct >= DEFAULT_PLANT_CONFIG.yieldGapAlertThresholdPct,
  };
}

/**
 * Calculates Performance Ratio (PR %):
 * PR = (Actual AC Energy / Expected STC Energy) = Actual_AC / (POA / 1000 * P_rated)
 */
export function calculatePerformanceRatio(
  actualKw: number,
  poaWPerM2: number,
  ratedCapacityKw: number = DEFAULT_PLANT_CONFIG.ratedCapacityKw
): number {
  if (poaWPerM2 < 100 || ratedCapacityKw <= 0) {
    return 0;
  }
  const idealStcPower = (poaWPerM2 / 1000.0) * ratedCapacityKw;
  const pr = (actualKw / idealStcPower) * 100.0;
  return Number(Math.min(99.9, Math.max(0, pr)).toFixed(1));
}
