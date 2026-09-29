"""
SolarGuard AI - Sensor Validation and Telemetry Quality Layer
Detects missing, null, stuck, or unphysical sensor behavior in SCADA streams.
"""

from typing import Dict, List, Any
import numpy as np

def validate_telemetry_batch(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates a list of telemetry rows from CSV ingestion or live stream.
    """
    flags = []
    penalty = 0
    total_records = len(records)
    if total_records == 0:
        return {
            "is_valid": False,
            "quality_score_pct": 0.0,
            "flags": [{"sensor": "Batch", "issue_type": "MISSING_DATA", "severity": "CRITICAL", "message": "Zero records provided."}],
            "valid_records_count": 0,
        }

    poa_values = []
    stuck_counter = 0
    spike_counter = 0

    for idx, r in enumerate(records):
        poa = r.get("irradiance_poa")
        amb_temp = r.get("ambient_temperature")
        mod_temp = r.get("module_temperature")
        ac_power = r.get("ac_power")

        # 1. Null / Missing checks
        if poa is None or (isinstance(poa, float) and np.isnan(poa)):
            flags.append({
                "sensor": "POA Pyranometer",
                "issue_type": "MISSING_DATA",
                "severity": "CRITICAL",
                "message": f"Row {idx+1}: Missing POA irradiance value.",
            })
            penalty += 10
        else:
            poa_values.append(float(poa))
            # 2. Impossible ranges
            if float(poa) < 0 or float(poa) > 1550:
                flags.append({
                    "sensor": "POA Pyranometer",
                    "issue_type": "IMPOSSIBLE_VALUE",
                    "severity": "CRITICAL",
                    "message": f"Row {idx+1}: Impossible POA reading {poa} W/m² (bounds: 0-1550).",
                })
                penalty += 15

        if amb_temp is not None and not (isinstance(amb_temp, float) and np.isnan(amb_temp)):
            if float(amb_temp) < -40 or float(amb_temp) > 65:
                flags.append({
                    "sensor": "Ambient RTD",
                    "issue_type": "IMPOSSIBLE_VALUE",
                    "severity": "CRITICAL",
                    "message": f"Row {idx+1}: Ambient temperature {amb_temp}°C exceeds physical limit (-40 to 65°C).",
                })
                penalty += 10

        # 3. Disagreement checks
        ghi = r.get("irradiance_ghi")
        if poa is not None and ghi is not None and float(ghi) > 300:
            ratio = float(poa) / float(ghi)
            if ratio < 0.3 or ratio > 2.5:
                flags.append({
                    "sensor": "POA vs GHI Pyranometers",
                    "issue_type": "DISAGREEMENT",
                    "severity": "WARNING",
                    "message": f"Row {idx+1}: POA/GHI ratio {ratio:.2f} indicates potential drift or occlusion.",
                })
                penalty += 5

    # 4. Stuck sensor check
    if len(poa_values) >= 5:
        # Check if identical over 5 intervals
        diffs = np.diff(poa_values)
        if np.all(diffs == 0) and poa_values[0] > 100:
            flags.append({
                "sensor": "POA Pyranometer",
                "issue_type": "STUCK_SENSOR",
                "severity": "WARNING",
                "message": f"POA sensor stuck at constant {poa_values[0]} W/m² across multiple time steps.",
            })
            penalty += 20

    quality_score = max(0.0, min(100.0, 100.0 - penalty))
    is_valid = quality_score >= 60.0 and not any(f["severity"] == "CRITICAL" for f in flags)

    return {
        "is_valid": is_valid,
        "quality_score_pct": round(quality_score, 1),
        "flags": flags[:10], # Top 10 flags
        "total_records": total_records,
        "valid_records_count": total_records - len([f for f in flags if f["severity"] == "CRITICAL"]),
    }
