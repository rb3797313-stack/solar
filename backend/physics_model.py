"""
SolarGuard AI - Physics-Informed Expected Power Model
pvlib-compatible modeling architecture for utility-scale solar PV generation.
"""

from typing import Dict, Any
import numpy as np

def estimate_cell_temperature(ambient_temp_c: float, poa_w_per_m2: float, noct_c: float = 45.0) -> float:
    """
    King / NOCT PV cell temperature estimation formula:
    T_cell = T_amb + (POA / 800) * (NOCT - 20) * 0.9
    """
    if poa_w_per_m2 <= 10.0:
        return ambient_temp_c
    cell_temp = ambient_temp_c + (poa_w_per_m2 / 800.0) * (noct_c - 20.0) * 0.9
    return round(float(cell_temp), 2)

def calculate_expected_power(
    poa_w_per_m2: float,
    cell_temp_c: float,
    rated_capacity_kw: float = 1200.0,
    temp_coeff_pct: float = -0.38,
    nominal_inv_eff: float = 0.985,
    wiring_eff: float = 0.982,
    soiling_baseline_eff: float = 0.985,
) -> float:
    """
    Physics-informed PV generation model:
    P_expected = P_rated * (G_poa / 1000) * [1 + (gamma / 100) * (T_cell - 25)] * eta_inv * eta_wiring * eta_soiling
    """
    if poa_w_per_m2 < 25.0:
        return 0.0

    irradiance_ratio = poa_w_per_m2 / 1000.0
    temp_delta = cell_temp_c - 25.0
    temp_correction = 1.0 + (temp_coeff_pct / 100.0) * temp_delta
    system_efficiency = nominal_inv_eff * wiring_eff * soiling_baseline_eff

    raw_expected = rated_capacity_kw * irradiance_ratio * temp_correction * system_efficiency
    return round(max(0.0, float(raw_expected)), 2)

def calculate_yield_gap(expected_kw: float, actual_kw: float, threshold_pct: float = 8.0) -> Dict[str, Any]:
    """
    Calculates yield gap in kW and percentage, filtering out night/low-light periods.
    """
    if expected_kw <= 5.0:
        return {
            "yield_gap_kw": 0.0,
            "yield_gap_pct": 0.0,
            "underperforming": False,
        }

    gap_kw = max(0.0, expected_kw - actual_kw)
    gap_pct = (gap_kw / expected_kw) * 100.0

    return {
        "yield_gap_kw": round(float(gap_kw), 2),
        "yield_gap_pct": round(float(gap_pct), 1),
        "underperforming": gap_pct >= threshold_pct,
    }
