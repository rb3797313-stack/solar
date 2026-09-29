import {
  InverterTelemetry,
  MpptChannel,
  PlantTelemetry,
  ScenarioType,
  SimulationScenario,
  WeatherTelemetry,
} from "@/types";
import {
  calculateExpectedPowerKw,
  calculateInverterEfficiency,
  calculatePerformanceRatio,
  calculateYieldGap,
  estimateCellTemperature,
  DEFAULT_PLANT_CONFIG,
} from "./physics";
import { validateTelemetry } from "./sensor_validation";

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: "normal",
    title: "1. Normal Operation",
    shortDesc: "Nominal 1.2 MW clear-sky PV generation",
    description: "Plant operates at full designed efficiency (~82% PR) with balanced strings and nominal temperatures.",
    targetAsset: "All Inverters (INV-01 to INV-12)",
  },
  {
    id: "inverter_derating",
    title: "2. Inverter Derating",
    shortDesc: "Thermal throttling on INV-05 (Heat-sink > 80°C)",
    description: "Cooling fan degradation causes INV-05 heat sink to climb above 75°C. Inverter throttles AC output by ~40% while DC remains high.",
    targetAsset: "INV-05 (Block B Central)",
  },
  {
    id: "partial_shading",
    title: "3. Partial Shading",
    shortDesc: "Tree line shadow on INV-03 strings",
    description: "External tree obstruction casts progressive shadow across MPPT-2 on INV-03, depressing string currents by 60%.",
    targetAsset: "INV-03 MPPT-2 (Strings 3 & 4)",
  },
  {
    id: "uniform_soiling",
    title: "4. Uniform Soiling",
    shortDesc: "Desert dust accumulation across all 12 blocks",
    description: "A recent sandstorm coated front glass panels across the farm, creating a uniform 16% optical transmission deficit.",
    targetAsset: "Plant-wide PV Array (Blocks A-D)",
  },
  {
    id: "string_fault",
    title: "5. String Fault / Open Circuit",
    shortDesc: "Blown DC string fuse on INV-08",
    description: "String 2 on INV-08 MPPT-1 suffers an inline fuse blow. String current drops to 0.0 A while other strings operate normally.",
    targetAsset: "INV-08 MPPT-1 String 2",
  },
  {
    id: "grid_curtailment",
    title: "6. Grid Curtailment",
    shortDesc: "Substation active power limitation",
    description: "Grid operator limits plant export to 550 kW due to regional transmission congestion. Inverters shift operating point off MPP.",
    targetAsset: "POI Substation Governor",
  },
  {
    id: "sensor_drift",
    title: "7. Sensor Calibration Drift",
    shortDesc: "Pyranometer calibration error (+18%)",
    description: "Plane-of-Array pyranometer develops a +18% positive drift bias, leading to artificial yield gap calculations.",
    targetAsset: "Met-Mast Pyranometer 01",
  },
];

/**
 * Generates initial 12 inverters with 2 MPPTs and 4 strings each.
 */
function createBaseInverters(): InverterTelemetry[] {
  const inverters: InverterTelemetry[] = [];
  for (let i = 1; i <= 12; i++) {
    const invId = `INV-${i.toString().padStart(2, "0")}`;
    const blockLetter = String.fromCharCode(65 + Math.floor((i - 1) / 3)); // A, B, C, D
    const mppts: MpptChannel[] = [
      {
        mpptId: "MPPT-1",
        voltageV: 660,
        currentA: 78.5,
        powerKw: 51.8,
        strings: [
          { stringId: "STR-01", currentA: 8.9, voltageV: 660, powerW: 5874, status: "normal" },
          { stringId: "STR-02", currentA: 8.8, voltageV: 660, powerW: 5808, status: "normal" },
          { stringId: "STR-03", currentA: 8.9, voltageV: 660, powerW: 5874, status: "normal" },
          { stringId: "STR-04", currentA: 8.7, voltageV: 660, powerW: 5742, status: "normal" },
        ],
      },
      {
        mpptId: "MPPT-2",
        voltageV: 658,
        currentA: 78.2,
        powerKw: 51.4,
        strings: [
          { stringId: "STR-05", currentA: 8.8, voltageV: 658, powerW: 5790, status: "normal" },
          { stringId: "STR-06", currentA: 8.9, voltageV: 658, powerW: 5856, status: "normal" },
          { stringId: "STR-07", currentA: 8.8, voltageV: 658, powerW: 5790, status: "normal" },
          { stringId: "STR-08", currentA: 8.7, voltageV: 658, powerW: 5724, status: "normal" },
        ],
      },
    ];

    inverters.push({
      inverterId: invId,
      name: `Block ${blockLetter} Inverter ${i}`,
      ratedPowerKw: 100, // 100 kW each = 1.2 MW plant
      status: "healthy",
      dcVoltage: 659,
      dcCurrent: 156.7,
      dcPowerKw: 103.2,
      acPowerKw: 98.2,
      expectedPowerKw: 99.0,
      yieldGapKw: 0.8,
      yieldGapPct: 0.8,
      efficiencyPct: 98.4,
      inverterTempC: 54.2,
      mpptChannels: mppts,
      faultState: null,
    });
  }
  return inverters;
}

/**
 * Calculates diurnal solar irradiance and ambient temperature based on time of day (hour: 0 to 24).
 * Realistic smooth bell-curve for Mojave / Desert climate.
 */
export function getDiurnalWeather(hourOfDay: number): {
  poa: number;
  ghi: number;
  ambTemp: number;
  modTemp: number;
  windSpeed: number;
} {
  // Sunrise at ~6:00, peak at 12:30, sunset at ~18:30
  if (hourOfDay < 5.8 || hourOfDay > 18.7) {
    return {
      poa: 0,
      ghi: 0,
      ambTemp: 18.5 + Math.sin((hourOfDay / 24) * Math.PI) * 4,
      modTemp: 18.0,
      windSpeed: 8.5,
    };
  }

  // Solar elevation profile
  const solarAngle = Math.sin(((hourOfDay - 6.0) / 12.5) * Math.PI);
  const peakGhi = 920; // W/m2
  const peakPoa = 985; // W/m2 tilted plane

  const ghi = Math.max(0, peakGhi * Math.pow(solarAngle, 1.15));
  const poa = Math.max(0, peakPoa * Math.pow(solarAngle, 1.05));

  // Ambient temperature peaks slightly after solar noon (around 14:30)
  const ambTemp = 20.0 + 15.0 * Math.sin(((hourOfDay - 8.0) / 14.0) * Math.PI);
  const modTemp = estimateCellTemperature(ambTemp, poa);
  const windSpeed = 12.0 + Math.sin(hourOfDay) * 4.5;

  return {
    poa: Number(poa.toFixed(1)),
    ghi: Number(ghi.toFixed(1)),
    ambTemp: Number(ambTemp.toFixed(1)),
    modTemp: Number(modTemp.toFixed(1)),
    windSpeed: Number(windSpeed.toFixed(1)),
  };
}

/**
 * Generates 24-hour historical time-series dataset (every 15 minutes, 96 points).
 */
export function generate24HourHistory(): Array<{
  time: string;
  hour: number;
  poa: number;
  expectedKw: number;
  actualKw: number;
  yieldGapKw: number;
  prPct: number;
  ambTempC: number;
  modTempC: number;
  invTempAvgC: number;
}> {
  const history = [];
  for (let m = 0; m < 24 * 60; m += 15) {
    const hour = m / 60;
    const hh = Math.floor(hour).toString().padStart(2, "0");
    const mm = (m % 60).toString().padStart(2, "0");
    const timeStr = `${hh}:${mm}`;

    const weather = getDiurnalWeather(hour);
    const expected = calculateExpectedPowerKw(weather.poa, weather.modTemp);

    // Add realistic normal operational jitter (-1.5% to +1.0%)
    let actual = expected > 0 ? expected * (0.985 + (Math.sin(hour * 7) * 0.01)) : 0;
    
    // Seed an afternoon historical event around 13:00 to 14:30 (temporary cloud transit or inverter warm-up)
    if (hour >= 13.0 && hour <= 14.2) {
      actual = actual * 0.92;
    }

    const gap = Math.max(0, expected - actual);
    const pr = calculatePerformanceRatio(actual, weather.poa);

    history.push({
      time: timeStr,
      hour,
      poa: weather.poa,
      expectedKw: Number(expected.toFixed(1)),
      actualKw: Number(actual.toFixed(1)),
      yieldGapKw: Number(gap.toFixed(1)),
      prPct: pr,
      ambTempC: weather.ambTemp,
      modTempC: weather.modTemp,
      invTempAvgC: Number((weather.ambTemp + (actual > 0 ? 25 : 5)).toFixed(1)),
    });
  }
  return history;
}

/**
 * Advances the simulation by 1 tick (representing 1-5 minutes in simulation time)
 * and mutates plant state according to the selected scenario progression.
 */
export function stepSimulation(
  currentTelemetry: PlantTelemetry,
  scenario: ScenarioType,
  progressRatio: number // 0.0 (just started) to 1.0 (fully developed fault)
): PlantTelemetry {
  const inverters = JSON.parse(JSON.stringify(currentTelemetry.inverters)) as InverterTelemetry[];
  const weather: WeatherTelemetry = { ...currentTelemetry.weather };
  let gridStatus = currentTelemetry.gridStatus;

  // Baseline expected calculation for each inverter (100 kW rated each)
  const baseExpectedPerInv = calculateExpectedPowerKw(
    weather.irradiancePoa,
    weather.moduleTempC,
    100
  );

  // Apply scenario mutations
  switch (scenario) {
    case "inverter_derating": {
      // Target INV-05 thermal climb
      const inv05 = inverters.find((i) => i.inverterId === "INV-05") || inverters[4];
      const targetTemp = 55 + progressRatio * 28; // Climbs from 55°C to 83°C!
      inv05.inverterTempC = Number(targetTemp.toFixed(1));

      if (targetTemp >= 75) {
        // Severe thermal derating: AC drops while DC remains available
        const throttleFactor = 1.0 - progressRatio * 0.42; // drops to ~58%
        inv05.acPowerKw = Number((baseExpectedPerInv * throttleFactor).toFixed(1));
        inv05.status = targetTemp >= 80 ? "critical" : "warning";
        inv05.faultState = "Thermal Throttling Active";
        inv05.yieldGapKw = Number((baseExpectedPerInv - inv05.acPowerKw).toFixed(1));
        inv05.yieldGapPct = Number(((inv05.yieldGapKw / (baseExpectedPerInv || 1)) * 100).toFixed(1));
      }
      break;
    }

    case "partial_shading": {
      // Target INV-03 MPPT-2 strings
      const inv03 = inverters.find((i) => i.inverterId === "INV-03") || inverters[2];
      const mppt2 = inv03.mpptChannels[1];
      if (mppt2) {
        const shadeDrop = 1.0 - progressRatio * 0.65; // Current drops by up to 65%
        mppt2.strings.forEach((str, idx) => {
          if (idx >= 2) {
            str.status = progressRatio > 0.3 ? "shaded" : "normal";
            str.currentA = Number((8.8 * shadeDrop).toFixed(1));
            str.powerW = Number((str.currentA * str.voltageV).toFixed(0));
          }
        });
        mppt2.currentA = Number(mppt2.strings.reduce((acc, s) => acc + s.currentA, 0).toFixed(1));
        mppt2.powerKw = Number(((mppt2.voltageV * mppt2.currentA) / 1000).toFixed(1));
      }
      inv03.dcPowerKw = Number(inv03.mpptChannels.reduce((acc, m) => acc + m.powerKw, 0).toFixed(1));
      inv03.acPowerKw = Number((inv03.dcPowerKw * 0.984).toFixed(1));
      inv03.yieldGapKw = Number(Math.max(0, baseExpectedPerInv - inv03.acPowerKw).toFixed(1));
      inv03.yieldGapPct = Number(((inv03.yieldGapKw / (baseExpectedPerInv || 1)) * 100).toFixed(1));
      inv03.status = progressRatio > 0.4 ? "warning" : "healthy";
      inv03.faultState = progressRatio > 0.4 ? "MPPT-2 Shading Mismatch" : null;
      break;
    }

    case "uniform_soiling": {
      // Uniform drop across all inverters
      const soilingLossFactor = 1.0 - progressRatio * 0.16; // 16% optical loss
      inverters.forEach((inv) => {
        inv.dcPowerKw = Number((inv.dcPowerKw * soilingLossFactor).toFixed(1));
        inv.acPowerKw = Number((baseExpectedPerInv * soilingLossFactor).toFixed(1));
        inv.yieldGapKw = Number((baseExpectedPerInv - inv.acPowerKw).toFixed(1));
        inv.yieldGapPct = Number(((inv.yieldGapKw / (baseExpectedPerInv || 1)) * 100).toFixed(1));
        inv.status = progressRatio > 0.5 ? "warning" : "healthy";
        inv.faultState = progressRatio > 0.5 ? "Soiling Loss Detected" : null;
      });
      break;
    }

    case "string_fault": {
      // INV-08 MPPT-1 String 2 open circuit
      const inv08 = inverters.find((i) => i.inverterId === "INV-08") || inverters[7];
      const targetStr = inv08.mpptChannels[0].strings[1];
      if (targetStr) {
        if (progressRatio > 0.2) {
          targetStr.currentA = 0.0;
          targetStr.powerW = 0;
          targetStr.status = "open_circuit";
          inv08.status = "critical";
          inv08.faultState = "Blown DC String Fuse (STR-02)";
        }
      }
      inv08.mpptChannels[0].currentA = Number(
        inv08.mpptChannels[0].strings.reduce((acc, s) => acc + s.currentA, 0).toFixed(1)
      );
      inv08.mpptChannels[0].powerKw = Number(
        ((inv08.mpptChannels[0].voltageV * inv08.mpptChannels[0].currentA) / 1000).toFixed(1)
      );
      inv08.dcPowerKw = Number(inv08.mpptChannels.reduce((acc, m) => acc + m.powerKw, 0).toFixed(1));
      inv08.acPowerKw = Number((inv08.dcPowerKw * 0.984).toFixed(1));
      inv08.yieldGapKw = Number(Math.max(0, baseExpectedPerInv - inv08.acPowerKw).toFixed(1));
      inv08.yieldGapPct = Number(((inv08.yieldGapKw / (baseExpectedPerInv || 1)) * 100).toFixed(1));
      break;
    }

    case "grid_curtailment": {
      gridStatus = progressRatio > 0.3 ? "curtailed" : "normal";
      if (gridStatus === "curtailed") {
        const plantCapKw = 550; // Cap entire plant at 550 kW (out of ~1150 kW potential)
        const perInvCap = plantCapKw / 12;
        inverters.forEach((inv) => {
          inv.acPowerKw = Number(perInvCap.toFixed(1));
          inv.dcVoltage = 745; // Shifts off MPP
          inv.yieldGapKw = Number(Math.max(0, baseExpectedPerInv - inv.acPowerKw).toFixed(1));
          inv.yieldGapPct = Number(((inv.yieldGapKw / (baseExpectedPerInv || 1)) * 100).toFixed(1));
          inv.status = "warning";
          inv.faultState = "Utility Curtailment Active";
        });
      }
      break;
    }

    case "sensor_drift": {
      // POA pyranometer drifts +18% higher than real sun
      const driftMult = 1.0 + progressRatio * 0.18;
      weather.irradiancePoa = Number((weather.irradiancePoa * driftMult).toFixed(1));
      weather.sensorQualityScore = Math.max(45, 100 - Math.round(progressRatio * 45));
      weather.sensorFlags =
        progressRatio > 0.3
          ? ["POA Pyranometer vs GHI ratio out of bounds (+18% drift)", "Sensor Disagreement Warning"]
          : [];
      break;
    }

    case "normal":
    default: {
      gridStatus = "normal";
      weather.sensorQualityScore = 98;
      weather.sensorFlags = [];
      inverters.forEach((inv) => {
        inv.acPowerKw = Number((baseExpectedPerInv * 0.985).toFixed(1));
        inv.dcPowerKw = Number((inv.acPowerKw / 0.985).toFixed(1));
        inv.yieldGapKw = Number(Math.max(0, baseExpectedPerInv - inv.acPowerKw).toFixed(1));
        inv.yieldGapPct = Number(((inv.yieldGapKw / (baseExpectedPerInv || 1)) * 100).toFixed(1));
        inv.inverterTempC = 54.0 + Math.random() * 2;
        inv.status = "healthy";
        inv.faultState = null;
        inv.mpptChannels.forEach((mppt) => {
          mppt.strings.forEach((str) => {
            str.status = "normal";
            str.currentA = 8.8;
          });
        });
      });
      break;
    }
  }

  // Aggregate totals
  const totalActual = Number(inverters.reduce((acc, inv) => acc + inv.acPowerKw, 0).toFixed(1));
  const totalExpected = Number(
    calculateExpectedPowerKw(weather.irradiancePoa, weather.moduleTempC, DEFAULT_PLANT_CONFIG.ratedCapacityKw).toFixed(1)
  );
  const gap = calculateYieldGap(totalExpected, totalActual);
  const pr = calculatePerformanceRatio(totalActual, weather.irradiancePoa);

  // Health calculation
  const criticalCount = inverters.filter((i) => i.status === "critical").length;
  const warningCount = inverters.filter((i) => i.status === "warning").length;
  const overallHealth =
    criticalCount > 0 || gap.yieldGapPct > 25
      ? "CRITICAL"
      : warningCount > 0 || gap.yieldGapPct > 8.0
      ? "WARNING"
      : "HEALTHY";

  const energyLossKwh = Number((gap.yieldGapKw * 0.25).toFixed(1)); // for 15-min interval

  return {
    ...currentTelemetry,
    gridStatus,
    weather,
    inverters,
    totalActualPowerKw: totalActual,
    totalExpectedPowerKw: totalExpected,
    totalYieldGapKw: gap.yieldGapKw,
    totalYieldGapPct: gap.yieldGapPct,
    performanceRatioPct: pr,
    todayEnergyGeneratedKwh: Number((currentTelemetry.todayEnergyGeneratedKwh + totalActual * 0.05).toFixed(1)),
    todayExpectedEnergyKwh: Number((currentTelemetry.todayExpectedEnergyKwh + totalExpected * 0.05).toFixed(1)),
    todayEnergyLossKwh: Number((currentTelemetry.todayEnergyLossKwh + energyLossKwh).toFixed(1)),
    todayMonetaryLoss: Number(
      ((currentTelemetry.todayEnergyLossKwh + energyLossKwh) * DEFAULT_PLANT_CONFIG.tariffPerKwh).toFixed(2)
    ),
    activeAlarmsCount: {
      critical: criticalCount,
      warning: warningCount + (gridStatus === "curtailed" ? 1 : 0),
      info: weather.sensorFlags.length,
    },
    overallPlantHealth: overallHealth,
  };
}

/**
 * Initializes the full default plant state at standard peak noon (12:30 PM).
 */
export function getInitialPlantTelemetry(): PlantTelemetry {
  const weatherData = getDiurnalWeather(12.5); // 12:30 PM peak
  const weather: WeatherTelemetry = {
    timestamp: "2026-09-27T12:30:00Z",
    irradiancePoa: weatherData.poa,
    irradianceGhi: weatherData.ghi,
    ambientTempC: weatherData.ambTemp,
    moduleTempC: weatherData.modTemp,
    windSpeedKmh: weatherData.windSpeed,
    sensorQualityScore: 98,
    sensorFlags: [],
  };

  const inverters = createBaseInverters();
  const totalActual = inverters.reduce((acc, inv) => acc + inv.acPowerKw, 0);
  const totalExpected = calculateExpectedPowerKw(
    weather.irradiancePoa,
    weather.moduleTempC,
    DEFAULT_PLANT_CONFIG.ratedCapacityKw
  );
  const gap = calculateYieldGap(totalExpected, totalActual);
  const pr = calculatePerformanceRatio(totalActual, weather.irradiancePoa);

  return {
    timestamp: "2026-09-27T12:30:00Z",
    timeFormatted: "12:30 PM",
    gridStatus: "normal",
    gridFrequencyHz: 60.01,
    gridVoltageV: 481.5,
    totalActualPowerKw: Number(totalActual.toFixed(1)),
    totalExpectedPowerKw: Number(totalExpected.toFixed(1)),
    totalYieldGapKw: gap.yieldGapKw,
    totalYieldGapPct: gap.yieldGapPct,
    performanceRatioPct: pr,
    todayEnergyGeneratedKwh: 4820.5,
    todayExpectedEnergyKwh: 4950.0,
    todayEnergyLossKwh: 129.5,
    todayMonetaryLoss: Number((129.5 * DEFAULT_PLANT_CONFIG.tariffPerKwh).toFixed(2)),
    activeAlarmsCount: {
      critical: 0,
      warning: 0,
      info: 1,
    },
    overallPlantHealth: "HEALTHY",
    inverters,
    weather,
  };
}
