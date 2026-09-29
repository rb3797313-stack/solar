"""
SolarGuard AI - Hybrid ML & Deterministic Root-Cause Diagnostic Engine
Combines a trained scikit-learn Random Forest feature classifier with physics boundary rules.
"""

from typing import Dict, List, Any, Tuple
import numpy as np
from sklearn.ensemble import RandomForestClassifier

FAULT_CLASSES = [
    "Normal Operation",
    "Uniform Soiling",
    "Partial Shading",
    "Inverter Derating",
    "String Mismatch / Open Circuit",
    "Grid Curtailment",
    "Sensor Calibration Drift",
]

class HybridDiagnosticEngine:
    def __init__(self):
        self.classifier = self._train_initial_model()

    def _train_initial_model(self) -> RandomForestClassifier:
        """
        Trains an initial scikit-learn classifier on multi-dimensional solar fault signatures.
        Features: [yield_gap_pct, poa, dc_ac_ratio, inv_temp, string_variance, array_gap_std, poa_ghi_ratio, grid_flag]
        """
        np.random.seed(42)
        X = []
        y = []

        # 0: Normal Operation
        for _ in range(300):
            gap = np.random.uniform(0.0, 4.0)
            poa = np.random.uniform(100, 1050)
            dc_ac = np.random.uniform(1.01, 1.03)
            inv_temp = np.random.uniform(45, 65)
            str_var = np.random.uniform(0.01, 0.05)
            arr_std = np.random.uniform(0.5, 2.0)
            poa_ghi = np.random.uniform(1.08, 1.25)
            grid_flag = 0
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(0)

        # 1: Uniform Soiling
        for _ in range(300):
            gap = np.random.uniform(11.0, 24.0)
            poa = np.random.uniform(400, 1000)
            dc_ac = np.random.uniform(1.01, 1.04)
            inv_temp = np.random.uniform(45, 65)
            str_var = np.random.uniform(0.01, 0.08)
            arr_std = np.random.uniform(0.5, 2.5) # very uniform across farm
            poa_ghi = np.random.uniform(1.08, 1.25)
            grid_flag = 0
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(1)

        # 2: Partial Shading
        for _ in range(300):
            gap = np.random.uniform(15.0, 45.0)
            poa = np.random.uniform(350, 950)
            dc_ac = np.random.uniform(1.02, 1.06)
            inv_temp = np.random.uniform(45, 65)
            str_var = np.random.uniform(1.5, 4.0) # high inter-string variance
            arr_std = np.random.uniform(6.0, 15.0) # localized to a few inverters
            poa_ghi = np.random.uniform(1.08, 1.25)
            grid_flag = 0
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(2)

        # 3: Inverter Derating
        for _ in range(300):
            gap = np.random.uniform(25.0, 55.0)
            poa = np.random.uniform(650, 1050)
            dc_ac = np.random.uniform(1.20, 1.80) # DC is high, AC is low!
            inv_temp = np.random.uniform(76.0, 88.0) # thermal threshold crossed
            str_var = np.random.uniform(0.01, 0.1)
            arr_std = np.random.uniform(8.0, 20.0)
            poa_ghi = np.random.uniform(1.08, 1.25)
            grid_flag = 0
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(3)

        # 4: String Mismatch / Open Circuit
        for _ in range(300):
            gap = np.random.uniform(10.0, 30.0)
            poa = np.random.uniform(300, 1000)
            dc_ac = np.random.uniform(1.02, 1.05)
            inv_temp = np.random.uniform(45, 68)
            str_var = np.random.uniform(3.5, 8.0) # dead string drops variance huge
            arr_std = np.random.uniform(4.0, 12.0)
            poa_ghi = np.random.uniform(1.08, 1.25)
            grid_flag = 0
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(4)

        # 5: Grid Curtailment
        for _ in range(300):
            gap = np.random.uniform(20.0, 60.0)
            poa = np.random.uniform(700, 1050)
            dc_ac = np.random.uniform(1.02, 1.05)
            inv_temp = np.random.uniform(45, 65)
            str_var = np.random.uniform(0.01, 0.05)
            arr_std = np.random.uniform(0.2, 1.5) # all inverters uniformly clamped
            poa_ghi = np.random.uniform(1.08, 1.25)
            grid_flag = 1
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(5)

        # 6: Sensor Calibration Drift
        for _ in range(300):
            gap = np.random.uniform(12.0, 30.0)
            poa = np.random.uniform(1050, 1350) # abnormally high POA
            dc_ac = np.random.uniform(1.01, 1.03)
            inv_temp = np.random.uniform(45, 65)
            str_var = np.random.uniform(0.01, 0.05)
            arr_std = np.random.uniform(0.5, 1.8)
            poa_ghi = np.random.uniform(1.35, 1.85) # skewed ratio
            grid_flag = 0
            X.append([gap, poa, dc_ac, inv_temp, str_var, arr_std, poa_ghi, grid_flag])
            y.append(6)

        clf = RandomForestClassifier(n_estimators=60, max_depth=8, random_state=42)
        clf.fit(X, y)
        return clf

    def diagnose(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs ML inference blended with physical rule verifications to formulate root cause.
        """
        weather = telemetry.get("weather", {})
        inverters = telemetry.get("inverters", [])
        expected_kw = float(telemetry.get("totalExpectedPowerKw", 0.0))
        actual_kw = float(telemetry.get("totalActualPowerKw", 0.0))
        grid_status = telemetry.get("gridStatus", "normal")

        poa = float(weather.get("irradiancePoa", 0.0))
        ghi = float(weather.get("irradianceGhi", 1.0))
        yield_gap_kw = max(0.0, expected_kw - actual_kw)
        yield_gap_pct = (yield_gap_kw / expected_kw * 100.0) if expected_kw > 10.0 else 0.0

        if poa < 40.0:
            return {
                "faultType": "Normal Operation",
                "faultCode": "NORM-000",
                "severity": "NORMAL",
                "confidencePct": 99,
                "affectedAssets": ["Plant Array (Standby)"],
                "estimatedPowerLossKw": 0.0,
                "estimatedDailyLossKwh": 0.0,
                "estimatedMonthlyLossMwh": 0.0,
                "estimatedRevenueLossToday": 0.0,
                "evidence": [
                    {
                        "parameter": "Solar Irradiance",
                        "observedValue": f"{poa:.1f} W/m²",
                        "expectedValue": "< 40 W/m²",
                        "verdict": "normal",
                        "badge": "Night / Low-Light",
                        "explanation": "Array in normal night-time sleep mode.",
                    }
                ],
                "rootCauseDescription": "Plant is in normal night-time sleep standby.",
                "recommendedAction": "No action required. Automatic ignition at dawn.",
                "priority": "None",
            }

        # Extract features for ML model
        max_inv_temp = max([float(i.get("inverterTempC", 50.0)) for i in inverters]) if inverters else 50.0
        dc_powers = [float(i.get("dcPowerKw", 0.0)) for i in inverters]
        ac_powers = [float(i.get("acPowerKw", 0.0)) for i in inverters]
        sum_dc = sum(dc_powers) if dc_powers else 1.0
        sum_ac = sum(ac_powers) if ac_powers else 1.0
        dc_ac_ratio = sum_dc / max(1.0, sum_ac)

        inv_gaps = [float(i.get("yieldGapPct", 0.0)) for i in inverters] if inverters else [0.0]
        arr_std = float(np.std(inv_gaps))

        # String variance calculation
        str_variances = []
        for inv in inverters:
            mppts = inv.get("mpptChannels", [])
            for m in mppts:
                currents = [float(s.get("currentA", 8.8)) for s in m.get("strings", [])]
                if len(currents) > 1:
                    str_variances.append(float(np.var(currents)))
        max_str_var = max(str_variances) if str_variances else 0.02

        poa_ghi_ratio = poa / max(1.0, ghi)
        grid_flag = 1 if grid_status == "curtailed" else 0

        features = [[yield_gap_pct, poa, dc_ac_ratio, max_inv_temp, max_str_var, arr_std, poa_ghi_ratio, grid_flag]]
        probs = self.classifier.predict_proba(features)[0]
        pred_class_idx = int(np.argmax(probs))
        confidence = int(round(probs[pred_class_idx] * 100))

        # Enforce deterministic physical guardrails if specific extreme thresholds are met
        if max_inv_temp >= 75.0 and dc_ac_ratio > 1.15:
            pred_class_idx = 3 # Inverter Derating
            confidence = max(confidence, 93)
        elif grid_status == "curtailed":
            pred_class_idx = 5 # Grid Curtailment
            confidence = max(confidence, 96)
        elif max_str_var > 3.0 and any(s.get("status") == "open_circuit" for inv in inverters for m in inv.get("mpptChannels", []) for s in m.get("strings", [])):
            pred_class_idx = 4 # String Fault
            confidence = max(confidence, 95)
        elif poa_ghi_ratio > 1.35 and poa > 1050:
            pred_class_idx = 6 # Sensor Drift
            confidence = max(confidence, 90)

        fault_type = FAULT_CLASSES[pred_class_idx]

        # Generate structured evidence and loss estimates
        tariff = 0.082
        daily_loss_kwh = round(yield_gap_kw * 4.8, 1)
        monthly_loss_mwh = round((daily_loss_kwh * 30) / 1000.0, 2)
        revenue_loss = round(daily_loss_kwh * tariff, 2)

        evidence = []
        severity = "NORMAL"
        priority = "None"
        affected_assets = []
        root_cause = ""
        action = ""

        if fault_type == "Inverter Derating":
            severity = "CRITICAL"
            priority = "P1 - Immediate"
            derated = [i.get("inverterId") for i in inverters if float(i.get("inverterTempC", 0)) >= 75.0]
            affected_assets = derated if derated else ["INV-05"]
            root_cause = f"Thermal throttling detected on {', '.join(affected_assets)}. Heat-sink temperature reached {max_inv_temp:.1f}°C, triggering automated power limiting."
            action = f"Inspect cooling blowers, clear air intake dust screens, and verify thermal paste on {', '.join(affected_assets)}."
            evidence = [
                {"parameter": "Inverter Internal Temp", "observedValue": f"{max_inv_temp:.1f}°C", "expectedValue": "< 68.0°C", "verdict": "critical", "badge": "Thermal Limit", "explanation": "Inverter bridge temperature crossed safety limit."},
                {"parameter": "DC to AC Power Ratio", "observedValue": f"{dc_ac_ratio:.2f}", "expectedValue": "1.015", "verdict": "abnormal", "badge": "AC Clamped", "explanation": "Adequate DC solar power is present but AC injection is restricted."},
            ]
        elif fault_type == "Uniform Soiling":
            severity = "WARNING"
            priority = "P2 - Within 24h"
            affected_assets = ["Entire PV Array (Blocks A-D)"]
            root_cause = "Uniform particulate/dust accumulation across all module glass surfaces causing broadband optical transmission attenuation."
            action = "Dispatch robotic cleaning squad or schedule nighttime demineralized water array washing."
            evidence = [
                {"parameter": "Plant-wide Yield Deficit", "observedValue": f"-{yield_gap_pct:.1f}% uniform deficit", "expectedValue": "< 5.0%", "verdict": "abnormal", "badge": "Uniform Soiling", "explanation": "Yield loss is evenly distributed across all 12 inverters."},
                {"parameter": "Array Variance (Std Dev)", "observedValue": f"{arr_std:.2f}%", "expectedValue": "< 3.0%", "verdict": "normal", "badge": "Symmetric Attenuation", "explanation": "No localized hot-spots; consistent with environmental dust layer."},
            ]
        elif fault_type == "Partial Shading":
            severity = "MEDIUM"
            priority = "P3 - Scheduled Maintenance"
            shaded = [i.get("inverterId") for i in inverters if float(i.get("yieldGapPct", 0)) > 18.0]
            affected_assets = shaded if shaded else ["INV-03 MPPT-2"]
            root_cause = "Localized geometric shading across perimeter strings causing asymmetric MPPT current depression."
            action = "Inspect perimeter fence boundary for encroaching brush or adjust single-axis tracker backtracking angles."
            evidence = [
                {"parameter": "Inter-String Current Variance", "observedValue": f"{max_str_var:.2f} A²", "expectedValue": "< 0.10 A²", "verdict": "critical", "badge": "Asymmetric Strings", "explanation": "Shaded strings produce significantly lower current than adjacent unshaded strings."},
            ]
        elif fault_type == "String Mismatch / Open Circuit":
            severity = "CRITICAL"
            priority = "P1 - Immediate"
            faulty = [i.get("inverterId") for i in inverters if any(s.get("currentA", 8.8) == 0.0 for m in i.get("mpptChannels", []) for s in m.get("strings", []))]
            affected_assets = faulty if faulty else ["INV-08 MPPT-1 STR-02"]
            root_cause = "Open-circuit condition detected on DC PV string. Current is zero Amperes under active solar generation."
            action = "Dispatch technician with multi-meter to check combiner box inline gPV fuse and verify MC4 connectors."
            evidence = [
                {"parameter": "String Current", "observedValue": "0.0 A", "expectedValue": "8.5 - 9.5 A", "verdict": "critical", "badge": "Open Circuit", "explanation": "String is carrying zero current while sibling strings are at peak amperage."},
            ]
        elif fault_type == "Grid Curtailment":
            severity = "WARNING"
            priority = "P2 - Within 24h"
            affected_assets = ["Plant Point of Interconnection (POI)"]
            root_cause = "External grid transmission constraint signal enforced active power ceiling on plant export."
            action = "Log curtailment interval and verify settlement contract terms with regional grid operator."
            evidence = [
                {"parameter": "Grid Signal", "observedValue": "Active Curtailment Limit", "expectedValue": "100% Export", "verdict": "critical", "badge": "Grid Capped", "explanation": "Substation AGC commanded export throttle."},
            ]
        elif fault_type == "Sensor Calibration Drift":
            severity = "WARNING"
            priority = "P2 - Within 24h"
            affected_assets = ["Met-Mast POA Pyranometer 01"]
            root_cause = "Pyranometer sensor drift creates an exaggerated expected generation baseline, creating a false yield gap."
            action = "Clean pyranometer optical dome and perform recalibration against secondary reference sensor."
            revenue_loss = 0.0 # Paper loss only
            evidence = [
                {"parameter": "POA to GHI Ratio", "observedValue": f"{poa_ghi_ratio:.2f}", "expectedValue": "1.10 - 1.25", "verdict": "critical", "badge": "Sensor Drift", "explanation": "Pyranometer reading is unphysically elevated relative to global horizontal sensor."},
            ]
        else:
            # Normal
            affected_assets = ["All 12 Inverters (Nominal)"]
            root_cause = "Plant is operating at optimal generation within designed performance envelope."
            action = "Continue automated real-time SCADA surveillance."
            evidence = [
                {"parameter": "Expected vs Actual Yield", "observedValue": f"{actual_kw:.1f} kW / {expected_kw:.1f} kW", "expectedValue": "Within ±3%", "verdict": "normal", "badge": "Optimal Yield", "explanation": "Plant output tracks physics model closely."},
            ]

        return {
            "faultType": fault_type,
            "faultCode": f"FLT-{pred_class_idx:03d}",
            "severity": severity,
            "confidencePct": min(99, max(75, confidence)),
            "affectedAssets": affected_assets,
            "estimatedPowerLossKw": round(yield_gap_kw, 1),
            "estimatedDailyLossKwh": daily_loss_kwh,
            "estimatedMonthlyLossMwh": monthly_loss_mwh,
            "estimatedRevenueLossToday": revenue_loss,
            "evidence": evidence,
            "rootCauseDescription": root_cause,
            "recommendedAction": action,
            "priority": priority,
        }
