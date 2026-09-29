# SolarGuard AI ☀️⚡
> **"Detect. Diagnose. Recover. Every Watt Counts."**

**SolarGuard AI** is a production-quality, AI + physics hybrid solar PV plant monitoring and diagnostic platform engineered for Operations & Maintenance (O&M) engineers, control room operators, and asset managers. Built for **HACKVERSE '26 Problem Statement CB-SW-07: AI-Powered Solar Underperformance Diagnosis & Root-Cause Engine**.

---

## 🏆 Key Capabilities & Innovations

1. **Physics-Informed Expected Power Model (`pvlib`-compatible)**
   - Calculates baseline solar power using plane-of-array (POA) irradiance, ambient temperature, King/NOCT cell thermal dissipation, monocrystalline temperature coefficient ($\gamma = -0.38\%/^\circ\text{C}$), inverter efficiency curves, and transmission baseline factors.
   - Computes real-time **Yield Gap (kW)** and **Yield Gap (%)** with transient cloud-edge filtering.

2. **Sensor Validation & Telemetry Quality Layer**
   - Detects missing/null values, physically impossible ranges (e.g., negative irradiance, temperatures exceeding terrestrial boundaries), stuck sensors (zero variance over intervals), and sensor disagreement (cross-check between POA, GHI, and reference cells).

3. **Hybrid Diagnostic Engine (scikit-learn + Physics Rules)**
   - Distinguishes between 7 key solar operational & fault classes:
     1. **Uniform Soiling** (Broad, farm-wide optical attenuation)
     2. **Partial Shading** (Localized inter-string current mismatch)
     3. **Inverter Derating** (IGBT thermal throttling above $75^\circ\text{C}$ while DC input is high)
     4. **String Mismatch / Open Circuit** ($0.0\text{ A}$ string current from blown inline fuses or disconnected MC4s)
     5. **Grid Curtailment** (External utility AGC export limits capping plant generation)
     6. **Sensor Calibration Drift** (Pyranometer positive drift producing false underperformance alarms)
     7. **Normal Operation** (Nominal tracking within $\pm 3\%$ of physics model)

4. **Explainable AI (XAI) & Evidence Breakdown**
   - Transparent *"Why this diagnosis?"* telemetry audit with comparative parameter badges, expected vs. observed values, and specific O&M work-order directives.

5. **Financial & Energy Loss Quantification**
   - Instantaneous power loss (kW), today's cumulative energy loss (kWh), 30-day extrapolated exposure (MWh), and financial revenue impact based on configurable PPA feed-in tariffs.

6. **Interactive Live Simulation Engine**
   - Real-time simulation of 12 Central Inverters (1.2 MW DC utility station) with 2 MPPTs and 4 strings per channel.
   - Interactive scenario switcher with Play/Pause, Single-Step, and Speed controls ($1\times, 2\times, 5\times$).

7. **SolarGuard AI Copilot**
   - Real-time contextual intelligent assistant grounded in active SCADA telemetry, answering engineering inquiries without inventing data.

8. **SCADA CSV Ingestion Pipeline**
   - 8-stage automated validator for external SCADA logs with downloadable sample CSV templates and instant diagnostic dossier generation.

---

## 🚀 60-Second Judge Demo Flow

To demonstrate the full power of SolarGuard AI in under a minute:
1. Open the application at **`http://localhost:3000`**.
2. Notice the **Command Center** showing **HEALTHY** status, generation tracking expected baseline ($98.2\%$), and balanced strings.
3. In the top bar, click the **Demo Scenario** dropdown and select **"2. Inverter Derating"**.
4. Click **"Simulate"** (or use the step button).
5. Watch the telemetry update live:
   - **INV-05** internal IGBT temperature climbs from $55^\circ\text{C}$ to $82^\circ\text{C}$.
   - Actual and expected power diverge on the time-series chart (Yield Gap widens).
   - Plant Health changes to **CRITICAL**.
   - The **AI Diagnosis Card** classifies **"Inverter Derating"** with **$93\%$ confidence**.
   - Expand **"Why this diagnosis?"** to review multi-sensor evidence (IGBT temperature exceeding $75^\circ\text{C}$, AC clamped while DC remains high, grid normal).
   - Review the financial loss and specific O&M action directive.
6. Click **"Diagnostic Report"** to open and print the technical executive dossier.
7. Click **"SolarGuard Copilot"** on the top right and ask: *"Why is plant generation low?"* to witness real-time grounding in live plant data.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: FastAPI (Python 3.11), Uvicorn, Pydantic
- **Data & Physics Processing**: NumPy, Pandas, Scikit-learn (RandomForest multi-fault feature classifier), `pvlib`-compatible mathematical modeling
- **Design System**: Industrial SCADA Dark Theme (`#070c14` charcoal backgrounds, cyan `#06b6d4` energy accents, emerald `#10b981` status, amber `#f59e0b` warnings, red `#ef4444` alerts)

---

## 💻 Running the Application

### 1. Active Services
- **Next.js Web Console**: `http://localhost:3000`
- **FastAPI Diagnostic Engine**: `http://127.0.0.1:8000`
- **Swagger API Docs**: `http://127.0.0.1:8000/docs`

### 2. Manual Start Commands (if restarting)

**Start FastAPI Backend:**
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Start Next.js Production Server:**
```powershell
npm run start
```
*(Or for hot-reload development: `npm run dev`)*
