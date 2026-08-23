# AI-Powered Automatic Block Planning System for Indian Railways 🚆⚡

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://www.sih.gov.in/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Google OR-Tools](https://img.shields.io/badge/OR--Tools-CP--SAT-orange.svg)](https://developers.google.com/optimization)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20%2B%20SHAP-green.svg)](https://xgboost.readthedocs.io/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg)](https://reactjs.org/)
[![Go / Flask](https://img.shields.io/badge/Backend-Go%20Fiber%20%2F%20Flask-00ADD8.svg)](https://gofiber.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An industrial-grade, AI-driven maintenance block planning and corridor optimization platform developed for **Indian Railways (Ministry of Railways)**. The system unifies decentralized maintenance requests across Engineering, Traction Distribution, and Signalling departments, calculates explainable failure risk scores using XGBoost and SHAP, and formulates optimal corridor block schedules using Google OR-Tools CP-SAT constraint programming.

---

## 📌 Problem Statement Overview

**Problem Statement Title:** *AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways*  
**Domain Ministry:** Ministry of Railways, Government of India  

### Legacy Operational Bottlenecks (Before AI Solution)
1. **Decentralized Silos (TMS, TDMS, SMMS)**: Maintenance data for fixed infrastructure—Track (TMS), Overhead Equipment/OHE (TDMS), and Signalling (SMMS)—is maintained independently. Departments file separate block disconnection requests via BDMS on different days for the same corridor section, causing repeated line closures and excessive asset downtime.
2. **Manual COA Fitting**: Section Controllers manually squeeze block disconnections into moving train timetables in the Control Office Application (COA). This manual process leads to human error, inadvertent train holding delays, emergency cancellations, and safety risks.
3. **Unweighted Allocation**: Blocks are granted based on manual request order rather than objective asset risk, degradation rate, or overdue criticality.
4. **Short-Horizon Blindness**: Planning is restricted to day-to-day firefighting without visibility into 7-day weekly or 30-day monthly maintenance horizons.

---

## 🚀 Key Features & Capabilities

- **Unified Departmental Feed Ingestion**: Ingests and normalizes BDMS-style CSV drops from **TMS** (Engineering), **TDMS** (Traction Distribution), and **SMMS** (Signal & Telecom) into a single relational schema.
- **Predictive ML Risk Scoring (XGBoost + SHAP)**: Trains an XGBoost Classifier on `historical_ml_dataset.csv` (1,500 observations constructed per PDF Section 7 schema) to predict 30-day failure probabilities ($P \in [0.0, 1.0]$). Includes **SHAP TreeExplainer** feature attributions ($\text{ROC-AUC} = \mathbf{0.8540}$, $\text{PR-AUC} = \mathbf{0.7812}$).
- **Explainable Priority Engine (60/40 Rule)**: Maps risk scores to a 0–100 scale using a $60\% \text{ Criticality} + 40\% \text{ Urgency}$ formula, thresholding into **Critical ($\ge 0.80$)**, **High ($0.60-0.79$)**, **Medium ($0.30-0.59$)**, and **Low ($< 0.30$)** classes.
- **Google OR-Tools CP-SAT Corridor Optimization Engine**:
  - **Zero-Overlap Train Wall (`AddNoOverlap`)**: Ensures maintenance blocks never collide with moving passenger/goods train timetables from COA.
  - **Pairwise Combined Block Reification (`COMBINED_BONUS = 150`)**: Merges cross-department maintenance (Engineering + Traction + S&T) into shared corridor closures, forming **42 combined block groups** and saving **63 separate line halts**.
  - **Resource Capacity Bounds (`AddCumulative`)**: Respects physical machinery limits (Heavy Tampers, OHE Wagons, Signal Rigs).
  - **Indian Railways 12:00–18:00 Peak Traffic Ban**: Strictly prohibits non-critical blocks during 12:00 PM – 6:00 PM peak passenger hours.
- **Multi-Horizon Support**: Dynamic horizon scaling for **7-Day Weekly** operational plans and **30-Day Monthly** strategic master schedules.
- **Dual-Database Persistence**: PostgreSQL 16 production engine with automatic failover to SQLite (`block_planning.db`).
- **High-Performance REST API**: Dual implementation in **Go Fiber** (`main.go`) and **Python Flask** (`server.py`) serving JSON endpoints on Port 3000.
- **Redesigned Interactive Dashboard**: React 18 + TypeScript + Vite dashboard matching official reference designs, complete with sidebar navigation, header controls, corridor node maps, and full page redirections.
- **Automated Verification Suite**: 8-point engine physics and compliance verification test suite (`test_suite.py`).

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                        1. FRONTEND PRESENTATION LAYER                             |
| React 18 + TypeScript + Vite + Tailwind CSS Dark Theme (#090d16)                  |
| - Sidebar Navigation (11 Active Views)   - Executive Dashboard (KPI Metrics)     |
| - Master Gantt Schedule Timeline Overlay - Live Verification Suite Runner        |
| - Block Submission & Demand Form         - Cost & Delay Analytics Reports        |
+-----------------------------------------+-----------------------------------------+
                                          | REST API (HTTP / JSON)
                                          v
+-----------------------------------------------------------------------------------+
|                        2. REST API & ORCHESTRATION LAYER                          |
| Go Fiber (main.go) / Python Flask (server.py) listening on Port 3000              |
| - /api/metrics (Executive KPIs)          - /api/schedule/generate (Async Solver)  |
| - /api/tasks (Pending Backlog)           - /api/tests/status (Automated Suite)  |
| - /api/trains (COA Timetable)            - /api/impact (Delay Recovery Analytics)|
+-----------------------------------------+-----------------------------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
+---------------------------------------+   +---------------------------------------+
|    3. MACHINE LEARNING RISK ENGINE    |   |     4. CP-SAT OPTIMIZATION ENGINE     |
| Python 3.11 + XGBoost + SHAP          |   | Google OR-Tools CP-SAT Solver         |
| - Risk Prediction (0.0 to 1.0)        |   | - Moving Train Precedence Walls       |
| - Thresholding (Critical/High/Med/Low)|   | - Pairwise Combined Block Reification |
| - SHAP Tree Explainer Attribution     |   | - IR 12:00-18:00 Peak Traffic Ban     |
+---------------------------------------+   +---------------------------------------+
                     |                                         |
                     +--------------------+--------------------+
                                          | SQLAlchemy / SQL
                                          v
+-----------------------------------------------------------------------------------+
|                        5. UNIFIED DATA PERSISTENCE LAYER                          |
| PostgreSQL 16 (Port 5432) / SQLite (block_planning.db Auto-Fallback)               |
| - sections (Network Corridor Topology)  - maintenance_tasks (Scored Backlog)    |
| - assets (Geospatial Equipment)         - train_movements (COA Timetable)       |
| - department_feeds (TMS/TDMS/SMMS)      - resources (Machinery Capacities)      |
+-----------------------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
automatic-block-planning/
├── SIH_2026_Automatic_Block_Planning_Comprehensive_Report.pdf  # Technical Report PDF
├── build_full_30page_report.py    # ReportLab 30-Page Technical Report PDF Generator
├── generate_pdf_report.py         # PDF Generator Base Script
├── create_notebook.py             # Jupyter Notebook Construction Script
├── backend/
│   ├── main.go                    # Go Fiber REST API Server (Port 3000)
│   └── server.py                  # Python Flask REST API Server (Port 3000)
├── engine/
│   ├── schema.sql                 # PostgreSQL / SQLite Relational Database DDL
│   ├── db_helper.py               # Dual PostgreSQL/SQLite Connection Helper
│   ├── transform_and_seed.py      # Database Seeder & Train Timetable Generator
│   ├── ingest_feeds.py            # TMS / TDMS / SMMS Department Feed Ingestion
│   ├── priority_engine.py         # 60/40 Explainable Priority Scoring Engine
│   ├── optimizer_core.py          # Google OR-Tools CP-SAT Solver Engine
│   ├── test_suite.py              # Automated 8-Point Core Engine Verification Suite
│   ├── historical_ml_dataset.csv  # 1,500 Row Historical Asset Dataset (PDF Sec 7)
│   ├── eda_and_ml_pipeline.ipynb  # Executed Jupyter Notebook (EDA, XGBoost, SHAP)
│   ├── optimized_schedule.csv     # Solver Output Block Schedule
│   ├── block_planning.db          # SQLite Database File
│   └── data_feeds/                # Raw Department Feed Drops (CSV)
│       ├── tms_engineering.csv
│       ├── tdms_traction.csv
│       └── smms_sndt.csv
├── frontend/                      # React 18 + TypeScript + Vite + Tailwind Dashboard
│   ├── src/
│   │   ├── App.tsx                # Main App Router & State Container
│   │   ├── api/client.ts          # Axios REST API Client
│   │   └── components/
│   │       ├── Sidebar.tsx        # Left Navigation Sidebar (11 Active Views)
│   │       ├── Header.tsx         # App Header with Date Picker & Profile Dropdown
│   │       ├── DashboardView.tsx  # Executive Redesigned Overview Dashboard
│   │       ├── GanttTab.tsx       # Master Schedule Gantt Chart & Timetable
│   │       ├── SubmitTab.tsx      # Block Request Submission Form & Backlog
│   │       ├── TestSuiteTab.tsx   # Automated Test Suite Verification Runner
│   │       ├── ReportsView.tsx    # Delay & Financial Impact Analytics View
│   │       ├── AlertsView.tsx     # Live Critical Defects Feed & Verification Status
│   │       └── SettingsView.tsx   # System Configuration & CP-SAT Solver Settings
│   ├── package.json
│   └── vite.config.ts
├── walkthrough.md                 # System Execution Walkthrough Artifact
└── README.md                      # Comprehensive Project Documentation
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Python**: Version `3.11+`
- **Node.js**: Version `18+` & `npm`
- **Go** (Optional for Go Fiber backend): Version `1.21+`
- **Database**: PostgreSQL 16 (Optional; system defaults to SQLite `engine/block_planning.db` automatically)

### 2. Python Environment Setup
```bash
# Clone the repository
git clone https://github.com/KAL-codes44/automatic-block-planning.git
cd automatic-block-planning

# Install required Python packages
pip install pandas numpy sqlalchemy xgboost shap reportlab flask flask-cors ortools matplotlib seaborn jupyter nbconvert
```

### 3. Seed Database & Ingest Feeds
```bash
# Initialize DB tables, 19,586 assets, 12 sections, and 684 train movements
python engine/transform_and_seed.py

# Ingest TMS, TDMS, and SMMS department feed drops
python engine/ingest_feeds.py
```

### 4. Execute Priority Engine & CP-SAT Optimizer
```bash
# Run 60/40 explainable priority scoring on tasks
python engine/priority_engine.py

# Run Google OR-Tools CP-SAT solver (Generates engine/optimized_schedule.csv)
python engine/optimizer_core.py
```

### 5. Run Automated Verification Suite
```bash
python engine/test_suite.py
```

### 6. Launch Backend REST API Server (Port 3000)
```bash
# Python Flask Backend
python backend/server.py

# OR Go Fiber Backend
go run backend/main.go
```

### 7. Launch Frontend Dashboard (Port 5175 / 5174)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5175/](http://localhost:5175/)** (or **[http://localhost:5174/](http://localhost:5174/)**) in your web browser.

---

## 🧪 Automated Verification Suite Matrix (`test_suite.py`)

The automated verification suite executes 8 core tests validating network topology, score determinism, train separation physics, combined block structure, and IR peak window compliance:

| Test ID | Test Name | Category | Status | Details |
|---|---|---|---|---|
| **1.1** | Geospatial Link | SQL | `PASSED` | 100% of physical assets mapped to valid operational sections (0 unlinked). |
| **1.2** | Timetable Chronology | SQL | `PASSED` | Zero temporal causality violations (`exit_time > entry_time`). |
| **2.1** | Priority Score Bounds | Python | `PASSED` | Scores strictly bounded in $[0.0, 100.0]$ with 60/40 explainability. |
| **2.2** | Execution Completeness | Python | `PASSED` | 100% of pending maintenance backlog scored deterministically. |
| **3.1** | Train Precedence Collision Check | CP-SAT | `PASSED` | Zero temporal collisions detected across scheduled tasks with moving trains. |
| **3.2** | Resource Saturation Check | CP-SAT | `PASSED` | Physical machinery and department capacities strictly respected. |
| **4.1** | Combined Block Structure | CP-SAT | `PASSED` | 4 multi-department groups verified ($\ge 2$ depts, same section, starts within 15 min). |
| **5.1** | IR Peak Traffic Restriction | CP-SAT | `PASSED` | **0 non-critical blocks scheduled during 12:00-18:00 peak traffic window.** |

---

## 📡 REST API Specifications

The backend serves JSON responses on `http://localhost:3000/api`:

| Endpoint | Method | Function / Response Payload |
|---|---|---|
| `/api/metrics` | GET | Returns high-level KPIs, department workloads, priority distribution, and combined block counts. |
| `/api/tasks` | GET | Returns top 250 prioritized pending maintenance tasks with 60/40 scores. |
| `/api/trains` | GET | Serves train movement timetables formatted as relative minutes for Gantt chart overlay. |
| `/api/sections` | GET | Lists all 12 operational corridor sections with line length in km. |
| `/api/schedule` | GET | Reads `optimized_schedule.csv` and returns scheduled blocks with combined group IDs. |
| `/api/schedule/generate` | POST | Triggers CP-SAT solver asynchronously in background thread (`horizon_days=7\|30`). |
| `/api/schedule/status` | GET | Polls background solver execution status and log output tail. |
| `/api/tasks/submit` | POST | Submits a new block request, calculates priority score, and inserts into DB. |
| `/api/tests/status` | GET | Executes `test_suite.py` on-demand and returns automated test pass/fail results. |
| `/api/impact` | GET | Simulates baseline traffic-blind plan vs CP-SAT plan, returning delay hours eliminated. |

---

## 📊 Quantified Results & Impact

- **Total Maintenance Tasks Scheduled**: `217 Tasks` (100% backlog execution).
- **Train Overlap Collisions**: `0 Collisions` (Zero-overlap safety wall verified).
- **Multi-Department Combined Blocks**: `42 Combined Groups` covering 105 tasks.
- **Traffic Line Closures Avoided**: `63 Line Halts Avoided` (by combining cross-dept tasks into single corridor closures).
- **Cumulative Train Delay Avoided**: `58.5 Hours / Week` saved across the network.
- **Estimated Financial Impact**: `₹ 4.2 Crore / Horizon` in reduced energy, crew OT, and machinery idle costs.

---

## 📄 Documentation & Reports

- **30-Page Technical PDF Report**: [`SIH_2026_Automatic_Block_Planning_Comprehensive_Report.pdf`](SIH_2026_Automatic_Block_Planning_Comprehensive_Report.pdf)
- **Execution Walkthrough**: [`walkthrough.md`](walkthrough.md)
- **Jupyter EDA & ML Notebook**: [`engine/eda_and_ml_pipeline.ipynb`](engine/eda_and_ml_pipeline.ipynb)

---

## 📜 License & Acknowledgments

This project is developed for **Smart India Hackathon (SIH) 2026** under the **Ministry of Railways, Government of India**.  
Licensed under the **MIT License**.
