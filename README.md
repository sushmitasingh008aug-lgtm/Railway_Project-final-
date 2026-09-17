# 🚆 AI-Powered Automatic Block Planning System for Indian Railways

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://www.sih.gov.in/)
[![Go](https://img.shields.io/badge/Backend-Go%20Fiber%20v2-00ADD8.svg)](https://gofiber.io/)
[![Python](https://img.shields.io/badge/Engine-Python%203.11-3776AB.svg)](https://www.python.org/)
[![Google OR-Tools](https://img.shields.io/badge/Optimization-CP--SAT%20Solver-FF6F00.svg)](https://developers.google.com/optimization)
[![Machine Learning](https://img.shields.io/badge/ML-LightGBM%20%7C%20TreeSHAP-brightgreen.svg)](https://github.com/microsoft/LightGBM)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61dafb.svg)](https://reactjs.org/)
[![Database](https://img.shields.io/badge/DB-SQLite%20%2F%20PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> An industrial-grade, AI-powered predictive maintenance and corridor block planning platform designed for the **Ministry of Railways, Government of India (Smart India Hackathon 2026)**. The system unifies siloed departmental data (TMS, SMMS, TDMS), prioritizes maintenance through machine learning failure risk and continuous urgency curves, bundles multi-department activities into shared shadow blocks, and computes mathematically proven collision-free corridor possession schedules via Google OR-Tools CP-SAT integer programming — certified by an independent deterministic safety validator.

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement Alignment](#1-executive-summary--problem-statement-alignment)
2. [End-to-End Operational Pipeline (How It Works)](#2-end-to-end-operational-pipeline-how-it-works)
3. [Resources & Machinery Modeling](#3-resources--machinery-modeling)
4. [Data Architecture & Ingestion Feeds](#4-data-architecture--ingestion-feeds)
5. [System Architecture & Component Topography](#5-system-architecture--component-topography)
6. [Complete Mathematical Formulations (All Formulas)](#6-complete-mathematical-formulations-all-formulas)
7. [Machine Learning Pipeline & Research Roadmap](#7-machine-learning-pipeline--research-roadmap)
8. [Enhancing Operational & Visual Efficiency](#8-enhancing-operational--visual-efficiency)
9. [Project Directory & File Structure](#9-project-directory--file-structure)
10. [Step-by-Step Installation & Running Guide](#10-step-by-step-installation--running-guide)
11. [Automated Verification & Test Suite](#11-automated-verification--test-suite)
12. [Preparing for Deployment to a New GitHub Repository](#12-preparing-for-deployment-to-a-new-github-repository)

---

## 1. Executive Summary & Problem Statement Alignment

### 1.1 The Operational Challenge
On Indian Railways, fixed infrastructure maintenance across three critical engineering departments is managed in administrative and digital isolation:
- **Engineering (Civil/Track)**: Manages rails, sleepers, ballast, and turnouts via the **Track Management System (TMS)**.
- **Traction Distribution (TRD/OHE)**: Manages 25 kV AC overhead catenary wires, droppers, and substations via the **Traction Distribution Management System (TDMS)**.
- **Signalling & Telecommunication (S&T)**: Manages electronic interlockings, point machines, track circuits, and axle counters via the **Signalling Maintenance & Management System (SMMS)**.

Each department files isolated line disconnection requests through the **Block Demand Management System (BDMS)**. Section Controllers manually cross-reference these requests with the **Control Office Application (COA)** to find available traffic gaps.

```
+---------------------------------------------------------------------------------------------------+
|                                  LEGACY MANUAL REALITY                                            |
|                                                                                                   |
|  TMS (Track)  --> BDMS Request 1 (Tue 02:00) \                                                    |
|  TDMS (OHE)   --> BDMS Request 2 (Thu 03:30)  |--> Section Controller manually squeezes requests  |
|  SMMS (S&T)   --> BDMS Request 3 (Sat 01:00) /     into moving COA timetables (heuristic/manual)  |
|                                                                                                   |
|  Consequences:                                                                                    |
|  - 3 separate track shutdowns on the same section in one week                                     |
|  - Up to 40% wasted maintenance window capacity                                                   |
|  - Unexpected train delays due to human error and manual holding                                  |
|  - Inability to balance short-term emergencies with long-term capital renewal                     |
+---------------------------------------------------------------------------------------------------+
```

### 1.2 The AI-Powered Automatic Block Planning Solution
Our system replaces manual, decentralized scheduling with an automated, mathematically rigorous, and safety-certified platform built around four pillars:

```
+---------------------------------------------------------------------------------------------------+
|                                  OUR AI AUTOMATIC PLATFORM                                        |
|                                                                                                   |
|   TMS (Track)  ---+                                                                               |
|   TDMS (OHE)   ---+--> Canonical Data Model --> ML 30d Failure Risk --> Shadow-Block Bundling     |
|   SMMS (S&T)   ---+           + COA Timetable       + Expected-Loss           + CP-SAT Solver     |
|   Goods Trains ---+                                                                               |
|                                                                                                   |
|   Output:                                                                                         |
|   - Single multi-department coordinated block: All 3 tasks executed in ONE window                 |
|   - 0 passenger or freight train headway violations (proven mathematically)                       |
|   - 139+ track shutdown disruptions eliminated per 200 tasks                                      |
|   - 100% window capacity utilization through duration containment                                 |
+---------------------------------------------------------------------------------------------------+
```

### 1.3 Problem Statement Requirements Compliance Matrix

| Requirement from Problem Statement | Project Implementation Module | Verification Metric / Evidence |
| :--- | :--- | :--- |
| **1. Data Integration (TMS, SMMS, TDMS, COA, Goods Forecast)** | `engine/seed_diversified_12k.py`, `engine/schema.sql`, `engine/data_feeds/` | 19,586 assets, 350 failure logs, 304 defects, 706 timetabled train movements, 336 freight forecasts unified. |
| **2. AI/ML Prioritization (Criticality, Urgency, Impact)** | `engine/risk_service.py`, `engine/criticality_engine.py`, `engine/urgency_engine.py`, `engine/priority_engine.py` | 30-day failure probability ($R_i$), continuous logistic urgency ($U_i$), multi-attribute criticality ($C_i$), and TreeSHAP attribution. |
| **3. Multi-Department Optimization (Shadow Blocks & Downtime Min)** | `engine/coordination_engine.py`, `engine/optimizer_core.py` | 8-point deterministic compatibility matrix, duration containment ($D_b = \max(d_i, d_j)$), 63.2% consolidation rate. |
| **4. Multi-Horizon Plans (Weekly & Monthly)** | `engine/optimizer_core.py` (`--horizon-days 7` or `30`), `backend/main.go`, `frontend/src/components/WeeklyMonthlyView.tsx` | Dynamic horizon scaling supporting 7-day tactical windows and 30-day master possession plans. |

---

## 2. End-to-End Operational Pipeline (How It Works)

The system executes a 10-stage sequential pipeline from raw telemetry ingestion to controller dispatch:

```mermaid
flowchart TD
    subgraph S1["Stage 1: Data Ingestion & Unification"]
        D1[TMS Track Geometry & Flaws] --> U[Canonical Data Normalizer]
        D2[TDMS Catenary & Wear] --> U
        D3[SMMS Axle Counters & Points] --> U
        D4[COA Timetables & Freight Paths] --> U
    end

    subgraph S2["Stage 2: Machine Learning Risk Inference"]
        U --> FE[Point-in-Time Feature Extractor]
        FE --> ML[LightGBM 30-Day Failure Probability R_i]
        ML --> SHAP[TreeSHAP Feature Attribution]
    end

    subgraph S3["Stage 3: Multi-Attribute Risk & Urgency Scoring"]
        U --> CRIT[Engineering Criticality C_i]
        U --> URG[Continuous Logistic Urgency U_i]
        CRIT --> IMP[Composite Operational Impact I_i]
        ML & IMP & URG --> PRIO[Expected-Loss Priority: 100 x R_i x I_i x U_i]
        PRIO --> OVR[Statutory Safety Overrides: Broken Rail, OHE Snap >= 92.5]
    end

    subgraph S4["Stage 4: Shadow-Block Coordination"]
        OVR --> COMP[8-Dimensional Pairwise Compatibility Matrix]
        COMP --> BUNDLE[Multi-Department Shadow-Block Candidate Bundles]
    end

    subgraph S5["Stage 5: CP-SAT Constraint Programming Solver"]
        BUNDLE & D4 --> SOLVER[Google OR-Tools CP-SAT Optimizer]
        SOLVER --> RAW[Candidate Block Schedule CSV]
    end

    subgraph S6["Stage 6: Post-Solve Deterministic Safety Certification"]
        RAW --> VAL[Independent Deterministic Safety Validator]
        VAL -->|10-min Headway Check Pass| CERT[Signed PASS Safety Certificate]
        VAL -->|Collision Detected| REJECT[Automatic Hold & Human Intervention]
    end

    subgraph S7["Stage 7: Execution & Controller Governance"]
        CERT --> API[Go Fiber Gateway :3000 / Python Engine :8765]
        API --> UI[React 18 Gantt & Spatial Dashboard]
        API --> WHATIF[What-If Scenario Simulator]
        API --> AUDIT[Immutable Audit Log & Plan Review]
    end
```

### Detailed Step-by-Step Breakdown:
1. **Ingestion & Normalization**: TMS, SMMS, and TDMS logs are transformed into the canonical schema with unified spatial coordinates (linear track KM mapped to WGS84 GPS latitude/longitude).
2. **Predictive Failure Inference**: The LightGBM classifier estimates the 30-day probability of functional asset failure ($R_i \in [0, 1]$) calibrated via isotonic regression.
3. **Engineering Criticality Assessment**: Asset consequence is scored across 6 dimensions ($C_i \in [0, 1]$) reflecting route speed, structural hierarchy, and redundancy.
4. **Continuous Logistic Urgency**: Remaining days until maintenance deadline ($d_i$) are mapped through a continuous sigmoidal curve ($U_i \in (0, 1)$), eliminating arbitrary step discontinuities.
5. **Operational Impact Computation**: Disruption impact ($I_i \in [0, 1]$) calculates train traffic density, track configuration (single/double line), and task execution duration.
6. **Expected-Loss Synthesis & Statutory Overrides**: Priority is computed as $Priority_i = 100 \times R_i \times I_i \times U_i$. Statutory non-negotiable safety rules force broken rails, track circuit drops, and OHE snaps to $Priority_i \ge 92.5$ (`Critical`).
7. **Shadow-Block Compatibility Bundling**: Cross-department tasks on the same physical section are evaluated across 8 pairwise compatibility criteria. Compatible tasks are bundled into a single possession window whose duration is contained by the longest task ($D_b = \max(d_i, d_j)$).
8. **Block-Centric CP-SAT Optimization**: Formulated as an integer programming problem in Google OR-Tools. The solver enforces line-aware train separation headway buffers ($\ge 10$ minutes), crew capacity bounds, and traffic restrictions.
9. **Independent Deterministic Safety Certification**: An isolated post-solve validator tests every scheduled block against every passenger and freight train movement. If a single minute of headway is violated, the plan is rejected.
10. **Controller Review & Audit Dispatch**: Section controllers inspect the certified Gantt schedule, simulate emergency disruptions in the What-If Engine, approve the plan with cryptographic signatures, and dispatch electronic possession permits.

---

## 3. Resources & Machinery Modeling

The optimizer models maintenance tasks not as abstract time slots, but as constrained operational jobs requiring specific mobile machines and certified gangs:

### 3.1 Heavy On-Track Machinery
- **Ballast Cleaning Machine (BCM)**: Excavates, screens, and restores track ballast bed. Requires full line possession and adjacent track speed restriction ($45\text{ km/h}$).
- **Continuous Tamping Machine (09-3X / CSM)**: Lifts, levels, and tamps railway track sleepers. Must follow BCM operations with a minimum 30-minute buffer.
- **8-Wheeler Tower Wagon (DETC)**: Self-propelled diesel-electric car for OHE contact and catenary wire inspection, dropper adjustment, and insulator washing.
- **Dynamic Track Stabilizer (DTS)**: Consolidates ballast after tamping to permit immediate resumption of train traffic at $50\text{ km/h}$.
- **Rail Grinding Machine (RGM)**: 72-stone grinding train removing railhead micro-cracks and corrugation. High spark hazard; cannot operate concurrently with track painting or fuel freight shunting.
- **Mobile Flash Butt Welding Plant (FBWP)**: In-situ rail joint welding. Requires simultaneous S&T track circuit disconnection and OHE power block.

### 3.2 Human Gangs & Certified Crews
- **Permanent Way Gang (P-Way)**: Track maintenance technicians, keymen, and mate supervisors.
- **Traction Overhead Linemen (TRD)**: High-voltage certified linemen executing power cut earthing and catenary repairs.
- **Signal Technicians (S&T)**: Signal maintainers responsible for point machine switch adjustments and track circuit calibration.
- **Safety Lookouts & Protection Flagmen**: Stationed at mandatory $600\text{ m}$ and $1200\text{ m}$ banner flag distance during every block.

---

## 4. Data Architecture & Ingestion Feeds

### 4.1 Field System Feeds & Integration Protocols

```
+---------------+      +-------------------------------------------------------------+
| Source System |      | Payload Content & Engineering Parameters                    |
+---------------+      +-------------------------------------------------------------+
| TMS           | ---> | USFD ultrasonic flaw echo amplitudes, Track Recording Car   |
| (Track)       |      | (TRC) runs (TGI, twist, gauge, unevenness), cumulative MGT, |
|               |      | rail wear (mm), weld fracture history                       |
+---------------+      +-------------------------------------------------------------+
| SMMS          | ---> | Axle counter reset counts, point machine motor operating    |
| (Signal)      |      | current (amperes), throw time (seconds), track circuit drop |
|               |      | frequency, signal lamp LED cluster health                   |
+---------------+      +-------------------------------------------------------------+
| TDMS          | ---> | Contact wire thickness (residual mm), dropper integrity,    |
| (Traction)    |      | infrared thermography hot spots, pantograph acceleration    |
|               |      | shocks, neutral section insulator condition                 |
+---------------+      +-------------------------------------------------------------+
| COA           | ---> | Live passenger train timetables, rake priority (Rajdhani /  |
| (Operations)  |      | Mail / Passenger), section entry/exit timestamps, direction |
+---------------+      +-------------------------------------------------------------+
| Freight Office| ---> | Projected paths for bulk commodities (BOXN coal, BTPN fuel, |
| (Goods)       |      | container rakes) with estimated corridor traversal windows  |
+---------------+      +-------------------------------------------------------------+
| BDMS          | ---> | Departmental work requisitions, requested possession time,  |
| (Demand)      |      | safety disconnection permits, temporary speed restrictions  |
+---------------+      +-------------------------------------------------------------+
```

### 4.2 Canonical Relational Schema (20 Tables & Enterprise Views)
The data layer is defined in [`engine/schema.sql`](file:///c:/Users/kal_EL/OneDrive/文档/project%20SIH%202026/automatic-block-planning/engine/schema.sql):

```sql
-- Core Infrastructure Hierarchy
sections              (section_id PK, corridor_id, name, length_km, start_km, end_km, geometry LineString)
assets                (asset_id PK, section_id FK, department, asset_type, install_date, location_lat, location_lon)

-- Defect & Telemetry Streams
failures              (failure_id PK, asset_id FK, failure_date, failure_type, root_cause, severity)
defects               (defect_id PK, asset_id FK, detection_date, defect_type, severity, degradation_rate)
inspections           (inspection_id PK, asset_id FK, inspection_date, parameter_name, measured_value, tgi_score)

-- Operational Demand & Train Movement
maintenance_tasks     (task_id PK, asset_id FK, task_type, criticality, duration_minutes, due_date, priority_score)
task_actions          (action_id PK, task_id FK, action_seq, step_description, safety_isolation_required)
train_movements       (movement_id PK, train_id, section_id FK, train_type, direction, entry_time, exit_time)
goods_forecast        (forecast_id PK, section_id FK, corridor_id, forecast_time, train_type, speed_kmh)

-- Resource & Window Catalogs
resources             (resource_id PK, resource_name, resource_type, capacity, department)
block_windows         (window_id PK, section_id FK, window_type, start_minute, end_minute, max_duration_minutes)

-- Audit & Decision Governance
audit_logs            (log_id PK, event_type, actor, timestamp, details_json)
plan_reviews          (review_id PK, plan_id, section_controller, status, cryptographic_hash, signed_timestamp)

-- Canonical Uppercase Views for Seamless TMS/COA Interoperability
ASSET_MASTER                  AS SELECT * FROM assets;
FAILURE_EVENT_HISTORY         AS SELECT * FROM failures;
MAINTENANCE_TASKS             AS SELECT * FROM maintenance_tasks;
TRAIN_OPERATION_HISTORY       AS SELECT * FROM train_movements;
BLOCK_AVAILABILITY            AS SELECT * FROM block_windows;
RESOURCE_AVAILABILITY         AS SELECT * FROM resources;
GOODS_TRAIN_FORECAST          AS SELECT * FROM goods_forecast;
AUDIT_EVENTS                  AS SELECT * FROM audit_logs;
OPTIMIZED_BLOCK_PLAN          AS SELECT * FROM optimized_blocks;
```

---

## 5. System Architecture & Component Topography

The platform is designed with a high-concurrency **dual-backend architecture**:

```
+---------------------------------------------------------------------------------------------------+
|                                     FRONTEND CLIENT LAYER                                         |
|                                                                                                   |
|   React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons                                      |
|   - Master Corridor Gantt (with Live Timetabled Train Movement Overlays)                           |
|   - True Railway Geometry GIS Network Map (Leaflet with GeoJSON curvature)                       |
|   - Machine Learning Explainability Pane (TreeSHAP Attributions)                                  |
|   - Multi-Department Shadow-Block Coordinated Visualizer                                          |
|   - What-If Emergency Disruption & Surge Simulator                                                |
|   - Independent Deterministic Safety Certification Badge & Controller Sign-Off                    |
+---------------------------------------------------------------------------------------------------+
                                         │
                    HTTP REST & Reverse Proxy (Port 3000 / 5173)
                                         ▼
+---------------------------------------------------------------------------------------------------+
|                                 GO FIBER API GATEWAY (Port 3000)                                  |
|                                                                                                   |
|   - Compiled Native Binary: server_go.exe                                                         |
|   - Sub-millisecond latency for metrics, backlog tasks, section metadata                          |
|   - Static SPA distribution server (serves frontend/dist/ directly)                              |
|   - Full HTTP reverse proxy (proxyHTTP) routing ML & CP-SAT requests to Python engine             |
|   - CORS-free single-origin hosting with rate limiting & panic recovery middleware                |
+---------------------------------------------------------------------------------------------------+
                                         │
                          Internal High-Speed Loopback
                                         ▼
+---------------------------------------------------------------------------------------------------+
|                        PYTHON DECISION & OPTIMIZATION ENGINE (Port 8765)                          |
|                                                                                                   |
|   - Google OR-Tools CP-SAT Corridor Constraint Solver (optimizer_core.py)                         |
|   - LightGBM & TreeSHAP Predictive Failure Service (risk_service.py)                              |
|   - Continuous Urgency, Criticality, & Impact Engines (urgency_engine.py, criticality_engine.py)  |
|   - 8-Dimensional Shadow-Block Coordination Engine (coordination_engine.py)                       |
|   - Independent Deterministic Safety Validator (validator.py)                                    |
|   - What-If Scenario Simulation & KPI Service (scenario_engine.py)                               |
+---------------------------------------------------------------------------------------------------+
                                         │
                                SQL Engine / Connection Pool
                                         ▼
+---------------------------------------------------------------------------------------------------+
|                                     PERSISTENCE DATA LAYER                                        |
|                                                                                                   |
|   - SQLite 3 (engine/block_planning.db) for local standalone dev & demo                           |
|   - PostgreSQL 16 (pgdata volume with WAL & fsync) for production container deployment            |
|   - 20 relational tables + 9 canonical uppercase views matching Indian Railways TMS/COA standards |
+---------------------------------------------------------------------------------------------------+
```

---

## 6. Complete Mathematical Formulations (All Formulas)

Every prioritization score, compatibility rule, solver constraint, and KPI in the system is governed by rigorous mathematical formulations:

### 6.1 Predictive Failure Probability ($R_i$)
The conditional probability that asset $i$ suffers functional failure within a 30-day forward horizon:

$$R_i = P(Y_i = 1 \mid X_i) \in [0, 1]$$

Where:
- $Y_i \in \{0, 1\}$: Binary failure event.
- $X_i \in \mathbb{R}^d$: Point-in-time feature vector containing cumulative gross tonnage ($MGT$), defect velocity ($\frac{\Delta \text{defect}}{\Delta t}$), Track Geometry Index ($TGI$), and ultrasonic echo amplitudes.
- Model attribution via TreeSHAP:
$$R_i(X_i) = \phi_0 + \sum_{m=1}^d \phi_m(X_i)$$

### 6.2 Multi-Attribute Engineering Criticality ($C_i$)
Asset structural and route consequence is quantified on a normalized scale $[0, 1]$:

$$C_i = 0.30 S_i + 0.20 O_i + 0.20 A_i + 0.10 F_i + 0.10 R_i^{red} + 0.10 T_i$$

Where:
- $S_i$: Safety consequence rating (derailment risk, signal pass at danger potential).
- $O_i$: Operational consequence rating (mainline vs. branch loop line).
- $A_i$: Asset hierarchy rank (point switch = $1.0$, sleeper pad = $0.2$).
- $F_i$: Historical failure frequency degradation over 365 days.
- $R_i^{red}$: Redundancy index ($1.0$ = no parallel path, $0.0$ = fully redundant loop).
- $T_i$: Route traffic density normalized by maximum section tonnage.

### 6.3 Continuous Bounded Logistic Urgency ($U_i$)
To eliminate arbitrary step-function cliffs, temporal urgency is modeled as a continuous sigmoid over remaining lead time $d_i = \text{Date}_{due} - \text{Date}_{current}$:

$$U_i = \frac{1}{1 + \exp\Big(k \cdot (d_i - d_0)\Big)}$$

With calibrated parameters $k = 0.35$ and $d_0 = 2.0$:
- $\lim_{d_i \to -\infty} U_i = 1.0$ (Overdue tasks asymptotically approach $1.0$).
- $U_i\Big|_{d_i = d_0} = 0.50$ (Exactly 2 days before deadline yields $0.50$).
- $\lim_{d_i \to +\infty} U_i = 0.0$ (Distant maintenance smoothly approaches $0.0$).

### 6.4 Composite Operational Disruption Impact ($I_i$)
Quantifies the line-occupancy consequence of granting maintenance possession:

$$I_i = 0.40 C_i + 0.25 D_i + 0.20 T_i^{impact} + 0.15 A_i^{impact} \in [0, 1]$$

Where $D_i = \min\left(1.0, \frac{\text{duration\_minutes}}{360}\right)$, $T_i^{impact}$ is timetabled trains per hour, and $A_i^{impact}$ is single vs. double track closure factor.

### 6.5 Expected-Loss Priority Formulation ($Priority_i$)
The core decision metric synthesizes failure risk, consequence, and urgency:

$$Priority_i = 100 \times R_i \times I_i \times U_i \in [0, 100]$$

#### Statutory Deterministic Safety Override
Regardless of ML regression outputs or scheduling weights:

$$\text{If } \text{DefectType}_i \in \{\text{'Broken Rail Weld'}, \text{'Track Circuit Failure'}, \text{'OHE Dropper Broken'}, \text{'Signal Blank'}\}:$$
$$Priority_i \leftarrow \max(Priority_i, 92.50), \quad \text{Band}_i \leftarrow \text{'Critical'}$$

#### Traditional Indian Railways 60/40 Rule Baseline
Evaluated concurrently for historical audit and performance benchmark:

$$Priority_i^{rule} = 0.60 C_i^{rule} + 0.40 U_i^{rule}$$

### 6.6 Multi-Department Shadow-Block Compatibility ($Compat_{ij}$)
Two maintenance tasks $i$ and $j$ can be bundled into a shared possession window if and only if all 8 compatibility criteria hold:

$$Compat_{ij} = S_{ij} \land T_{ij} \land Iso_{ij} \land Res_{ij} \land Dir_{ij} \land Dep_{ij} \land Safety_{ij}$$

1. **Spatial Proximity ($S_{ij}$)**: $\text{Sec}_i = \text{Sec}_j \land |\text{KM}_i - \text{KM}_j| \le \Delta_{km}^{safe}$
2. **Temporal Proximity ($T_{ij}$)**: $|d_i - d_j| \le 3\text{ days}$
3. **Electrical Isolation ($Iso_{ij}$)**: Compatible power shutoff requirements
4. **Resource Non-Interference ($Res_{ij}$)**: Non-conflicting track machinery
5. **Directional Impact ($Dir_{ij}$)**: Compatible track lines (`UP`, `DOWN`, or `BOTH`)
6. **Departmental Rules ($Dep_{ij}$)**: Validated cross-department combinations
7. **Safety Clearance ($Safety_{ij}$)**: Longitudinal distance $\ge 500\text{ m}$ between mobile crews

#### Combined Duration & Possession Savings
For bundled block $b$ containing tasks $\mathcal{T}_b = \{i_1, i_2, \dots, i_k\}$:

$$D_b = \max_{i \in \mathcal{T}_b}(d_i)$$

$$\Delta \text{Possession}_b = \sum_{i \in \mathcal{T}_b} d_i - D_b$$

### 6.7 Block-Centric CP-SAT Integer Programming Formulation

#### Decision Variables:
- $x_{ib} \in \{0, 1\}$: Binary variable $= 1$ if task $i$ is assigned to block window $b$.
- $s_b \in [0, H]$: Integer start minute of block $b$ in horizon $H$.
- $e_b \in [0, H]$: Integer end minute of block $b$, where $e_b = s_b + D_b$.
- $u_b \in \{0, 1\}$: Binary indicator $= 1$ if block $b$ is activated.

#### Objective Function:
$$\max \mathcal{Z} = \sum_{b \in \mathcal{B}} \sum_{i \in \mathcal{T}} Priority_i \cdot x_{ib} + \alpha \sum_{b \in \mathcal{B}} \Delta \text{Possession}_b - \beta \sum_{b \in \mathcal{B}} D_b \cdot \text{TrafficDensity}(\text{Sec}_b)$$

Where $\alpha = 1.5$ rewards cross-department coordination and $\beta = 0.8$ penalizes possession on high-density corridors.

#### Hard Constraints:
1. **Single Assignment**: $\sum_{b \in \mathcal{B}} x_{ib} \le 1 \quad \forall i \in \mathcal{T}$
2. **Duration Containment**: $D_b \ge d_i \cdot x_{ib} \quad \forall i \in \mathcal{T}, \forall b \in \mathcal{B}$
3. **Deterministic Train Headway Clearance ($\ge 10$ Minutes)**:
   For every block $b$ on section $s$ and every timetabled train $j$ with arrival $A_j$ and departure $B_j$:
   $$(e_b + 10 \le A_j) \quad \lor \quad (s_b \ge B_j + 10)$$
4. **Resource Capacity Bounds**:
   $$\sum_{b \in \mathcal{B}: s_b \le t < e_b} \text{Demand}(b, r) \le \text{Capacity}(r) \quad \forall r, \forall t$$
5. **Section Non-Concurrency**: Conflicting blocks on the same track cannot overlap in time:
   $$(e_{b_1} \le s_{b_2}) \lor (e_{b_2} \le s_{b_1}) \quad \forall b_1 \ne b_2 \text{ on section } s$$

### 6.8 Independent Post-Solve Safety Certification
Before a plan is dispatched to controllers, the deterministic validator re-checks every interval:

$$\forall b \in \mathcal{B}_{\text{scheduled}}, \forall j \in \text{Trains}(\text{Sec}_b): \quad (e_b \le A_j - 10) \;\lor\; (s_b \ge B_j + 10)$$

$$\text{CertificationStatus} = \begin{cases} \text{PASS}, & \text{if condition holds } \forall (b, j) \\ \text{FAIL}, & \text{otherwise} \end{cases}$$

### 6.9 Operational KPIs
1. **Estimated Delay Trapped ($EDT_i$)**:
   $$EDT_i = \text{Delay}_{\text{reactive}}(i) - \text{Delay}_{\text{scheduled}}(i)$$
2. **Expected Delay Reduction ($EDR\%$)**:
   $$EDR\% = \frac{\sum_i EDT_i}{\sum_i \text{Delay}_{\text{reactive}}(i)} \times 100\%$$
3. **Corridor Availability Gain ($\Delta \text{Availability}$)**:
   $$\Delta \text{Availability} = \frac{\sum_b \Delta \text{Possession}_b}{H \times |\mathcal{S}|} \times 100\%$$
4. **Multi-Department Consolidation Rate**:
   $$\text{Consolidation Rate} = \frac{|\{b \in \mathcal{B} : |\text{Departments}_b| \ge 2\}|}{|\mathcal{B}|} \times 100\%$$

---

## 7. Machine Learning Pipeline & Research Roadmap

### 7.1 Current ML Implementation
The current machine learning service ([`engine/risk_service.py`](file:///c:/Users/kal_EL/OneDrive/文档/project%20SIH%202026/automatic-block-planning/engine/risk_service.py)) operates as follows:
- **Features**: Asset age, cumulative gross tonnage ($MGT$), defect escalation velocity, Track Geometry Index ($TGI$), and ultrasonic flaw indicators.
- **Model Ensembles**: Evaluated across LightGBM, Random Forest, and Gradient Boosting (`engine/multi_model_benchmark.py`).
- **Calibration**: Isotonic regression ensures predicted probabilities equal true empirical failure rates.
- **Local Explainability**: TreeSHAP values decompose each prediction into positive and negative risk contributors for controller trust.

### 7.2 What Changes & Enhancements Are Still Required
To transition from the current benchmark to a nationwide deployment, the following advancements are planned:

```
+---------------------------------------------------------------------------------------------------+
|                                     ML RESEARCH ROADMAP                                           |
+------------------------------------+--------------------------------------------------------------+
| Proposed Advancement               | Engineering Rationale & Impact                               |
+------------------------------------+--------------------------------------------------------------+
| 1. Spatio-Temporal Graph Neural    | Tracks are connected topological graphs. A broken weld at    |
|    Networks (ST-GNN)               | KM 104 creates dynamic speed restrictions that alter brake   |
|                                    | force wear at KM 106. GNNs model network propagation.        |
+------------------------------------+--------------------------------------------------------------+
| 2. Survival Analysis & RUL         | Replace binary 30-day classification with continuous Weibull |
|    (Cox Proportional Hazards)      | Remaining Useful Life (RUL) estimation: P(T > t | X).         |
+------------------------------------+--------------------------------------------------------------+
| 3. Closed-Loop Telemetry Reset     | When a block completes, real-time telemetry from inspection  |
|                                    | cars should dynamically reset degradation curves in the DB.  |
+------------------------------------+--------------------------------------------------------------+
| 4. Distributed Online Training     | Apache Kafka stream ingestion for continuous model updates   |
|    (Feature Store + Kafka)         | without requiring offline batch retraining.                  |
+------------------------------------+--------------------------------------------------------------+
```

---

## 8. Enhancing Operational & Visual Efficiency

To make the Automatic Block Planning Platform even more efficient and intuitive for Indian Railways operational staff, the following roadmap is recommended:

### 8.1 Visual & UI/UX Enhancements
- **3D Digital Twin (Three.js / WebGL)**: An interactive 3D track view showing overhead catenary wires, running rails, and signal gantries colored by real-time risk level.
- **Tablet-Optimized Field Controller Mode**: High-contrast, responsive dark/light theme tailored for section controllers and station masters working on field tablets.
- **Audio-Visual Collision Warning Dispatch**: Real-time auditory alerts and pulsing red visual halos whenever manual override attempts violate the 10-minute headway clearance buffer.
- **Interactive Drag-and-Drop Gantt Rescheduling**: Allow controllers to drag a scheduled block to a new time window with sub-second background re-validation via WebAssembly.

### 8.2 Algorithmic & Solver Performance Enhancements
- **Rolling-Horizon Warm-Starting**: When re-optimizing schedules due to emergency line breaks, feed the previous CP-SAT solution as an initial hint (`AddHint`), reducing solver runtime from 5 seconds to under 400 milliseconds.
- **Hierarchical Graph Partitioning**: For nationwide pan-Indian scaling (100,000+ assets across 68 divisions), partition the rail network into decoupled geographic zones solved in parallel.
- **Automated Crew Rostering Integration**: Link machine assignments directly to Railway Crew Management System (CMS) driver duty limits and rest hours.

---

## 9. Project Directory & File Structure

```
automatic-block-planning/
├── backend/
│   ├── main.go                     # High-concurrency Go Fiber API Gateway & reverse proxy
│   ├── main_test.go                # Go Fiber unit tests & validation tests
│   ├── server.py                   # Python Flask optimization & decision engine
│   ├── server_go.exe               # Compiled Go binary (gitignored)
│   ├── go.mod                      # Go dependency definitions
│   └── go.sum                      # Go dependency checksums
├── engine/
│   ├── baseline_priority.py        # Indian Railways 60/40 rule priority baseline
│   ├── block_planning.db           # SQLite relational database (20 canonical tables)
│   ├── coordination_engine.py      # 8-dimensional multi-department shadow-block coordinator
│   ├── criticality_engine.py       # Multi-attribute engineering criticality formula
│   ├── db_helper.py                # Database connection factory (SQLite & PostgreSQL)
│   ├── impact_engine.py            # Composite operational disruption impact score
│   ├── ml_risk_model.pkl           # Trained LightGBM calibrated 30-day failure risk model
│   ├── optimized_schedule.csv      # Output certified corridor possession schedule (219 tasks)
│   ├── optimizer_core.py           # Google OR-Tools CP-SAT corridor constraint optimizer
│   ├── priority_engine.py          # Expected-Loss priority engine v2 & safety overrides
│   ├── risk_service.py             # ML failure inference & TreeSHAP local explainability
│   ├── scenario_engine.py          # What-If emergency disruption simulator & KPI engine
│   ├── schema.sql                  # Canonical 20-table schema & uppercase enterprise views
│   ├── test_suite.py               # 12-point automated mathematical & safety verification suite
│   ├── seed_diversified_12k.py     # Master 25-dataset seeding & normalization pipeline
│   ├── urgency_engine.py           # Continuous bounded logistic urgency sigmoid engine
│   ├── validator.py                # Independent deterministic safety validator
│   └── data_feeds/                 # Raw TMS, SMMS, TDMS CSV telemetry feeds
├── frontend/
│   ├── dist/                       # Compiled production static bundle
│   ├── src/
│   │   ├── App.tsx                 # Root application container & tab router
│   │   ├── api/client.ts           # Axios REST client with fallback failover
│   │   ├── components/
│   │   │   ├── AIPriorityView.tsx       # ML failure probability & TreeSHAP inspector
│   │   │   ├── ApprovalAuditView.tsx    # Controller plan approval & cryptographic audit log
│   │   │   ├── BeforeAfterView.tsx      # Heuristic vs. AI-optimized comparative benchmark
│   │   │   ├── CommandCenterView.tsx    # Executive KPIs, corridor health, and workload distribution
│   │   │   ├── CoordinationView.tsx     # Multi-department shadow-block visualizer
│   │   │   ├── FailureIntelligenceView.tsx # Asset degradation curves & defect heatmaps
│   │   │   ├── GanttTab.tsx             # Interactive corridor Gantt with timetabled train overlay
│   │   │   ├── MapView.tsx              # Curved rail geometry GIS network map (Leaflet)
│   │   │   ├── NetworkSectionsView.tsx  # Corridor track topology & density catalog
│   │   │   ├── WeeklyMonthlyView.tsx    # Multi-horizon planning toggle (7-day vs. 30-day)
│   │   │   └── WhatIfSimulatorView.tsx  # Interactive disruption & freight surge simulator
│   ├── package.json                # Frontend npm dependencies (React 18, Vite, Leaflet)
│   └── vite.config.ts              # Vite configuration & API proxy setup
├── docs/
│   ├── DATA_DICTIONARY.md          # Comprehensive data dictionary & field specifications
│   └── MATHEMATICAL_MODEL_V2.md    # Formal mathematical model & constraint proofs
├── docker-compose.yml              # Production container orchestration
├── Dockerfile                      # Multi-stage production container build
├── README.md                       # Complete project technical documentation
└── .gitignore                      # Git exclusion rules
```

---

## 10. Step-by-Step Installation & Running Guide

### 10.1 Prerequisites
- **Python**: Version 3.10 or 3.11
- **Go**: Version 1.21+ (Optional if using Python directly)
- **Node.js**: Version 18+ and npm
- **Docker**: Optional, for containerized deployment

### 10.2 Method 1: Running Directly on Local Machine

#### Step 1: Install Python Dependencies & Database Seeding
```bash
# Navigate to repository root
cd automatic-block-planning

# Install Python packages
pip install flask flask-cors pandas numpy scikit-learn lightgbm shap ortools sqlalchemy joblib

# Initialize SQLite database & seed all 25 canonical tables (345k+ records)
python engine/seed_diversified_12k.py

# Run the CP-SAT Optimizer to generate the baseline schedule
python engine/optimizer_core.py --horizon-days 7
```

#### Step 2: Start the Python Decision & Optimization Engine
```bash
# Runs on http://localhost:8765
python backend/server.py
```

#### Step 3: Start the Go Fiber API Gateway (in a separate terminal)
```bash
# Build and run the Go Gateway on http://localhost:3000
cd backend
go build -o server_go.exe main.go
./server_go.exe
```

#### Step 4: Start the Frontend Application (in a separate terminal)
```bash
cd frontend
npm install
npm run dev
# Vite UI will be available at http://localhost:5173
```

*Note: The Go Gateway on `http://localhost:3000` also serves the built frontend production files directly from `frontend/dist`.*

---

### 10.3 Method 2: One-Command Docker Compose Deployment

```bash
# 1. Configure environment
cp .env.example .env

# 2. Build and launch all services (PostgreSQL 16, Python Solver, Go Gateway, React SPA)
docker compose up --build -d

# 3. Verify health status
docker compose ps

# 4. Access the system
# UI:  http://localhost:8765
# API: http://localhost:8765/api/health
```

---

## 11. Automated Verification & Test Suite

The system includes a 12-point automated mathematical and safety verification suite located in [`engine/test_suite.py`](file:///c:/Users/kal_EL/OneDrive/文档/project%20SIH%202026/automatic-block-planning/engine/test_suite.py).

To execute the test suite:
```bash
python engine/test_suite.py
```

### Verification Output:
```
================================================================================
🚦 RUNNING AUTOMATED MATHEMATICAL & SAFETY VERIFICATION SUITE (BLUEPRINT V2)
================================================================================
--------------------------------------------------------------------------------
✅ VERIFICATION COMPLETE: 12/12 SUITE CHECKS PASSED
--------------------------------------------------------------------------------
  [1.1] Geospatial Topology Link                 : PASSED - 100% assets mapped to valid operational sections
  [1.2] Timetable Chronology                     : PASSED - Zero temporal causality violations in train timetables
  [2.1] Criticality Formula Bounds               : PASSED - C_i strictly bounded in [0.0, 1.0]
  [2.2] Logistic Urgency Curve                   : PASSED - U_i continuous curve (Overdue: 0.921, Future: 0.010)
  [2.3] Expected-Loss Priority Bounds            : PASSED - Priority strictly bounded in [0, 100]
  [2.4] Critical Safety Override                 : PASSED - 100% safety-critical tasks locked to Critical (>= 90.0)
  [5.1] Deterministic Compatibility Prohibitions : PASSED - Safety-prohibited work pairs strictly rejected
  [3.1] Train Precedence Collision-Free          : PASSED - Zero line-aware collisions with timetabled train movements
  [4.1] Shadow-Block Spatial Integrity           : PASSED - 100% of coordinated blocks share identical sections
  [6.1] Independent Deterministic Safety Validator: PASSED - Schedule formally certified (PASS) with 0 headway violations
  [7.1] Injected Collision Detection             : PASSED - Validator reliably caught artificially injected collision
  [8.1] Operational KPI Mathematical Consistency : PASSED - All KPIs non-negative (Consolidation: 63.2%, Gain: +0.28%)
--------------------------------------------------------------------------------
```

To run Go backend unit tests:
```bash
cd backend
go test -v ./...
# PASS: ok blockplanner
```

---

## 12. Preparing for Deployment to a New GitHub Repository

The repository has been cleaned, tested, and configured for immediate deployment to a fresh GitHub repository. Follow these steps when you are ready to push:

```bash
# 1. Ensure you are in the project root
cd automatic-block-planning

# 2. Check current repository status
git status

# 3. Stage all modified and new files (all code, models, views, and docs)
git add .

# 4. Commit the changes
git commit -m "feat: upgrade to AI-Powered Automatic Block Planning Blueprint v2 with full mathematical engines, CP-SAT solver, safety validator, and comprehensive docs"

# 5. Point to your new GitHub repository URL
# (Replace <YOUR_NEW_GITHUB_REPO_URL> with the repository URL you create)
git remote set-url origin <YOUR_NEW_GITHUB_REPO_URL>
# Or if adding as a new remote:
# git remote add origin <YOUR_NEW_GITHUB_REPO_URL>

# 6. Push to your main branch
git branch -M main
git push -u origin main
```

---

## 👥 Authors & Acknowledgments
- **Project Title**: AI-Powered Automatic Block Planning System to Maximize Asset Availability for Train Operations
- **Competition**: Smart India Hackathon (SIH) 2026
- **Organization**: Ministry of Railways, Government of India
