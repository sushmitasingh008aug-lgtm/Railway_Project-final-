# AI-Assisted Automatic Block Planning System for Indian Railways
## Master Plan v2: End-to-End System Architecture, Processing Pipeline & UI/UX Operations

**Domain Ministry:** Ministry of Railways, Government of India  
**Event:** Smart India Hackathon (SIH) 2026  
**Document Version:** 2.0 (Comprehensive Technical & Operational Specification)  
**Status:** Live & Deployed (`http://localhost:8765`)

---

## Executive Summary & The Canonical Philosophy

Fixed-infrastructure maintenance on Indian Railways has historically operated in decentralized departmental silos:
- **Track Management System (TMS)** for Engineering (P-Way)
- **Traction Distribution Management System (TDMS)** for Electrical (OHE/TRD)
- **Signal & Telecom Maintenance Management System (SMMS)** for S&T
- **Control Office Application (COA)** for Train Movements and Section Controllers
- **Universal Incident Management System (UIMS)** for Failure Event and Detention Reporting

When departments file block requests independently on different days for the same corridor section, lines suffer repeated closures, excessive asset downtime, and human error during manual timetable fitting.

This system establishes a unified, constraint-safe, AI-assisted platform operating under the canonical principle:

$$\begin{aligned}
\textbf{Data Integration} &\longrightarrow \text{Tells us \textbf{WHAT} needs work and \textbf{WHERE} it is located.} \\
\textbf{ML Benchmark} &\longrightarrow \text{Predicts failure \textbf{RISK}.} \\
\textbf{SHAP Engine} &\longrightarrow \text{Explains \textbf{WHY} it is high risk.} \\
\textbf{Compatibility Engine} &\longrightarrow \text{Determines \textbf{WHICH} tasks may safely coordinate.} \\
\textbf{Action Engine} &\longrightarrow \text{Defines the exact \textbf{WORK PROCEDURES} to perform.} \\
\textbf{CP-SAT Optimizer} &\longrightarrow \text{Determines \textbf{WHEN} and \textbf{HOW} blocks are granted.} \\
\textbf{Human Review} &\longrightarrow \text{Controller inspects, approves, and electronically signs the plan.} \\
\textbf{Evaluation Engine} &\longrightarrow \text{Proves the \textbf{MEASURED OPERATIONAL VALUE}.}
\end{aligned}$$

---

## 1. End-to-End Processing Architecture

```text
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           1. INGESTION & DATA SOURCES                             │
│   TMS (Track)       TDMS (Traction)     SMMS (Signals)     COA (Timetables)      UIMS / Govt Reports │
│   Rail fractures    OHE dropper snaps   Track circuits     706 Train Movements   350 Failure logs    │
│   Gauge defects     Insulator flashover Axle counter fail  Headways / UP & DOWN  Detention minutes   │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      2. SPATIAL MAPPING & ASSET MASTER                            │
│   • 19,586 physical railway assets mapped to 12 operational sections via Haversine│
│   • Canonical Identity: Asset ID -> Section ID -> Corridor ID                     │
│   • True curved geometry (OSM LineStrings) & GPS coordinates                      │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    3. ML RISK PREDICTION & SHAP EXPLAINABILITY                    │
│   • Rolling features: Failures (7d/30d/90d/365d), durations, detention, age, cond │
│   • Multi-Model Benchmark Champion: HistGradientBoosting / Tuned XGBoost          │
│   • Output: P(Critical Failure in 30 Days)                                        │
│   • Local SHAP attributions: Top positive (+Δ Risk) & negative (-Δ Risk) features │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│               4. PRIORITY POLICY & NON-NEGOTIABLE SAFETY OVERRIDE                 │
│   • Formula: 35% Risk + 25% Urgency + 25% Safety Impact + 15% Line Impact         │
│   • Rule-Based Safety Lock: Broken rail welds, track circuits, dropper snaps      │
│     are LOCKED to Critical (Score ≥ 92.5) — ML is NEVER allowed to downgrade safety│
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│               5. MAINTENANCE ACTION ENGINE & COMPATIBILITY CHECK                  │
│   • Action Engine: Decomposes tasks into standard 6-stage railway sequence:        │
│     Inspection ➔ Isolation ➔ Core Repair ➔ Testing ➔ Verification ➔ Release      │
│   • Deterministic 8-Point Compatibility:                                          │
│     Spatial, Possession, Isolation, Resources, Sequence, Time, Clearance, Train    │
│   • Output: Audit-approved candidate pairs (93 verified pairs, 24 blocked)        │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│             6. TIME-AWARE GOOGLE OR-TOOLS CP-SAT CORRIDOR OPTIMIZER               │
│   • Discrete integer-minute timeline across planning horizon (7 days = 10,080 min)│
│   • Line-Aware Train Walls: UP blocks avoid UP trains; BOTH blocks avoid all      │
│   • Indian Railways Peak Ban: 12:00 - 18:00 strictly banned for non-critical work │
│   • Cumulative Machinery Limits: Tampers, tower inspection wagons, signal rigs   │
│   • Objective: Maximize priority tasks + Maximize eligible combined block bonus   │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│             7. OPTIMIZED BLOCK OUTPUT & "WHY CHOSEN" EXPLANATIONS                 │
│   • 143 scheduled blocks (24 multi-department groups covering 56 tasks)           │
│   • Alternative candidate windows evaluated (Earlier: train collision; Later: peak)│
│   • 32 line closures avoided (-18.3%), 34.8 shared hours saved, -35.2% downtime   │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                 8. RAILWAY MAINTENANCE CONTROL CENTER UI (PORT 8765)              │
│   • Command Center (Top KPIs & Risk)     • AI Priority & SHAP Explanations        │
│   • Network & Sections (Drill-downs)     • Coordination Center (8-point checks)   │
│   • Backlog with Action Drawers          • CP-SAT Block Planner & Gantt           │
│   • Before vs After (Verified KPIs)      • Weekly / Monthly Heatmaps              │
│   • Government Failure Intelligence      • What-If Simulator & Approval Audit     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Backend Processing Stages

### Stage 1: Ingestion & Geospatial Normalization
1. **Raw Multi-Source Ingestion**:
   - `department_feeds`: Ingests BDMS-style CSV drops from TMS, TDMS, and SMMS with source provenance.
   - `train_movements`: Ingests COA timetables across the horizon with arrival, departure, direction (`UP`/`DOWN`), and train class (Vande Bharat, Rajdhani, Mail/Express, Freight).
   - `failure_event_history`: Ingests government-aligned UIMS failure event reports containing duration, trains delayed, total detention minutes, root causes, subcauses, and Station Master remarks.
2. **Spatial Topology & Asset Master**:
   - Assets possess true GPS coordinates extracted from railway geospatial telemetry and OpenStreetMap rail extracts.
   - To link raw assets to operational infrastructure, a **Haversine spherical distance function** calculates the closest operational railway section:
     $$d = 2R \arcsin \left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$
   - Each asset receives a canonical link: $\text{Asset ID} \longrightarrow \text{Section ID} \longrightarrow \text{Corridor ID}$.

### Stage 2: Feature Engineering & Multi-Model ML Benchmark
1. **Feature Engineering Pipeline** (`engine/generate_ml_dataset.py`):
   - Computes 30 temporal and operational features strictly using information known before the prediction timestamp:
     - **Rolling Failures**: $\text{failures}_{7\text{d}}, \text{failures}_{30\text{d}}, \text{failures}_{90\text{d}}, \text{failures}_{180\text{d}}, \text{failures}_{365\text{d}}$
     - **Duration Metrics**: $\text{failure\_duration}_{30\text{d}}, \text{failure\_duration}_{90\text{d}}$
     - **Recurrence**: $\text{repeat\_failure\_flag}$, $\text{failure\_recurrence\_rate}$, $\text{days\_since\_last\_failure}$
     - **Operational Impact**: $\text{trains\_delayed}_{90\text{d}}$, $\text{total\_detention\_minutes}_{90\text{d}}$, $\text{avg\_detention}_{90\text{d}}$
     - **Condition & Traffic**: $\text{condition\_score}$, $\text{health\_index}$, $\text{days\_overdue}$, $\text{traffic\_density}$, $\text{tonnage}$
2. **Temporal Validation Benchmark** (`engine/multi_model_benchmark.py`):
   - Evaluated 6 candidate model architectures using strict chronological ordering to prevent future data leakage (Train: 65%, Validation: 20%, Test: 15%):

| Model Architecture | PR-AUC | Recall | Precision | F1-Score | ROC-AUC | Brier Score | Status |
|---|---|---|---|---|---|---|---|
| **HistGradientBoosting** | **0.9576** | **0.8929** | **0.8865** | **0.8897** | **0.9698** | **0.0652** | **CHAMPION** |
| **XGBoost (Tuned)** | **0.9590** | **0.8929** | **0.8562** | **0.8741** | **0.9705** | **0.0645** | **Evaluated** |
| **Random Forest** | 0.9469 | 0.8643 | 0.8705 | 0.8674 | 0.9649 | 0.0716 | Evaluated |
| **Logistic Regression** | 0.9487 | 0.8357 | 0.8931 | 0.8635 | 0.9643 | 0.0689 | Evaluated |
| **Extra Trees** | 0.9301 | 0.8357 | 0.8931 | 0.8635 | 0.9552 | 0.0841 | Evaluated |
| **Decision Tree** | 0.9007 | 0.8929 | 0.8446 | 0.8681 | 0.9351 | 0.0836 | Evaluated |

   - The champion model produces the calibrated failure probability: $P(\text{Critical Failure within 30 Days})$.

### Stage 3: Priority Policy & Non-Negotiable Critical Safety Override
1. **Four-Pillar Policy Formula** (`engine/priority_engine.py`):
   $$\text{Priority Score} = (0.35 \times \text{Risk}) + (0.25 \times \text{Urgency}) + (0.25 \times \text{Safety}) + (0.15 \times \text{Line Impact})$$
   - Normalizes scores strictly to $[0.0, 100.0]$.
2. **Critical Safety Override Rule**:
   - Statistical models must never downgrade safety-critical railway infrastructure.
   - If a task involves broken rail welds, track circuit dropouts, or snapped OHE droppers:
     $$\text{Criticality} = \text{'Critical'}, \quad \text{Safety Override} = 1, \quad \text{Priority Score} = \max(\text{Priority Score}, 92.5)$$
3. **Local SHAP Explainability** (`engine/explainability.py`):
   - Computes local Shapley values decomposing why a task received its risk score:
     - **Top Positive Drivers ($+\Delta$ Risk)**: High failure history (90d), degraded condition cliff, excessive days overdue, high corridor traffic.
     - **Top Negative Drivers ($-\Delta$ Risk)**: High recent visual inspection score, normal traffic density.

### Stage 4: Maintenance Action Engine & Deterministic Compatibility
1. **Maintenance Action Engine** (`engine/actions_engine.py`):
   - Decomposes each abstract task into the standard 6-stage operational sequence:
     1. **Site Inspection & Pre-check**: Diagnostic gauges, 15 min setup.
     2. **Permit-to-Work & Traction/Signal Isolation**: Disconnection keys, line possession.
     3. **Core Maintenance Execution**: Primary task repair, gang allocation, heavy equipment.
     4. **Electromechanical Testing**: Instrument checks, circuit verification.
     5. **Joint Verification**: Joint Inspection Committee sign-off.
     6. **De-isolation & Block Release**: Caution clearance memo, normal speed release.
2. **Deterministic Compatibility Engine** (`engine/compatibility_engine.py`):
   - Principle: *"Same section does not mean automatic merging."*
   - Evaluates **8 auditable rules** between candidate tasks:
     1. **Spatial Check**: Tasks must share the identical operational section.
     2. **Possession Check**: Track line directions must align (`UP`, `DOWN`, or `BOTH`).
     3. **Isolation Check**: Power block and signaling disconnection must be compatible.
     4. **Resource Check**: No contention for exclusive machinery (e.g. Tamper or Tower Wagon).
     5. **Dependency Check**: Preserves chronological execution precedence.
     6. **Time Balance Check**: Work durations must not exceed a $2.5\times$ ratio.
     7. **Safety Clearance Check**: Safe separation between simultaneous activities.
     8. **Operations Check**: Zero conflicts with active moving trains.
   - **Audit Result**: Out of 117 candidate pairs evaluated across 12 sections, **93 pairs were approved** and **24 pairs were blocked** with explicit reason codes.

### Stage 5: Time-Aware CP-SAT Corridor Optimization
1. **Mathematical Discrete Formulation** (`engine/optimizer_core.py`):
   - Timeline is mapped into integer minutes: $t \in [0, \text{Horizon Minutes}]$.
   - Variables:
     - $\text{start}_t, \text{end}_t = \text{start}_t + \text{duration}_t$.
     - $\text{presence}_t \in \{0, 1\}$ (task scheduled in this horizon).
     - $\text{combined}_{i,j} \in \{0, 1\}$ (tasks $i$ and $j$ consolidated into one block).
2. **Hard Constraints**:
   - **Line-Aware Train Precedence Walls**:
     $$\text{end}_t \le \text{entry}_{\text{train}} \quad \lor \quad \text{start}_t \ge \text{exit}_{\text{train}} \quad (\text{if lines conflict})$$
   - **Indian Railways Peak Ban**: Non-critical blocks strictly banned between 12:00 and 18:00 (12 PM – 6 PM).
   - **Cumulative Fleet Limits**: $\text{AddCumulative}$ guarantees tamper, tower car, and signal rig demands never exceed available capacities.
   - **Deterministic Compatibility Enforced**: $\text{combined}_{i,j} = 1$ is permitted only for pairs verified by the compatibility engine.
3. **Multi-Objective Function**:
   $$\text{Maximize } \sum_{t} \left(10 \times \text{Priority}_t \times \text{presence}_t\right) + \sum_{(i,j)} \left(\text{Bonus}_{\text{combined}} \times \text{combined}_{i,j}\right)$$
4. **Block Packages & Alternative Evaluations**:
   - Forms multi-department coordinated blocks (`CB_001`, `CB_002`, ...).
   - Generates alternative candidate window analysis (*"Why Did CP-SAT Choose This Block?"*), recording why earlier or later windows were rejected.

---

## 3. Evaluation Framework: Baseline vs CP-SAT

The platform includes an automated evaluation framework (`engine/evaluation_engine.py`) comparing the traditional uncoordinated departmental silo approach against the integrated CP-SAT schedule:

| Evaluation Metric | Baseline Silo Planning | AI-Integrated CP-SAT | Measured Operational Improvement |
|---|---|---|---|
| **Total Corridor Blocks** | 175 Line Blocks | 143 Shared Blocks | **32 Line Closures Saved (-18.3%)** |
| **Total Block Hours** | 278.2 Hours | 243.4 Hours | **34.8 Shared Hours Saved** |
| **Asset Downtime** | 375.6 Hours | 243.4 Hours | **35.2% Net Downtime Reduction** |
| **Block Utilization** | 65.0% | 89.4% | **+24.4% Efficiency Gain** |
| **Train Precedence Collisions** | High (COA Manual Squeeze) | **0 Collisions** | **100% Zero-Conflict Guarantee** |
| **Disruptions Avoided** | 0 Closures | 32 Closures | **32 Multi-Department Groupings** |

---

## 4. Control Center UI/UX Architecture

The frontend is served from `http://localhost:8765` as an operational **Railway Maintenance Control Center** divided into 12 screens:

```text
CONTROL CENTER NAVIGATION
├── Operations Control
│   ├── 1. Command Center           (Top KPIs, Network Risk Profile, Priority Quicklist)
│   ├── 2. Network & Sections       (Section diagnostics, critical tasks, condition scores)
│   ├── 3. Maintenance Tasks        (Unified backlog, 6-stage action package drawer)
│   └── 4. GPS Network Map          (True OSM rail curves, GPS asset dots, UP/DN offsets)
├── AI & Optimization
│   ├── 5. AI Priority & SHAP       (ML benchmark leaderboard, SHAP waterfall cards)
│   ├── 6. Coordination Center      (8-point compatibility checks, PASS/FAIL reason codes)
│   ├── 7. CP-SAT Block Planner     (Time-aware Gantt, train movements, "Why Chosen" modal)
│   ├── 8. Before vs After (KPIs)   (Measured baseline vs optimized comparative metrics)
│   └── 9. Weekly / Monthly Plan    (7-day calendar & 30-day section workload heatmap)
└── Intelligence & Review
    ├── 10. Failure Intelligence    (Normalized UIMS/COA logs, detention hours, root causes)
    ├── 11. What-If Simulator       (Real-time window shift slider, dynamic collision check)
    ├── 12. Human Review & Audit    (Section Controller sign-off & immutable audit log)
```

### Screen Details:
1. **Command Center**: Top 6 KPIs (Open Tasks: 220, Critical: 97, Coordinated Blocks: 24, Collisions: 0, Availability: 94.8%, Utilization: 89.4%), Network Risk Profile across sections, and today's unified block timeline.
2. **Network & Sections**: Answers *"Where is maintenance risk concentrated?"*. Click any section to drill down into track length, critical task count, condition score, and scheduled backlog.
3. **Maintenance Tasks**: Filterable table across Engineering (TMS), Traction (TDMS), and Signalling (SMMS). Clicking any row opens the **6-Stage Action Package Drawer** (`Inspection -> Isolation -> Repair -> Test -> Verify -> Release`).
4. **AI Priority & SHAP**: Displays the ML champion benchmark comparison table. Select any task to inspect its **Risk Probability**, **Priority Score**, **Critical Safety Override Badge**, and **Local SHAP Waterfall** (top factors pushing risk UP and DOWN).
5. **Coordination Center**: Hero MVP view. Displays candidate cross-department task pairs side-by-side with **8-Point Compatibility Status** (`PASS` / `BLOCKED`) and auditable reason codes.
6. **CP-SAT Block Planner**: Interactive time-aware Gantt chart displaying moving trains (red/grey bars) alongside corridor maintenance blocks (blue/orange/green bars). Click any block to view **Why Did CP-SAT Choose This Block?** and candidate alternative windows evaluated.
7. **Before vs After**: Side-by-side comparison of traditional departmental silo scheduling vs AI CP-SAT planning, displaying measured KPIs (32 blocks saved, 34.8h downtime saved, 0 collisions).
8. **Weekly / Monthly Plan**: Switch between a 7-day calendar view (Day 1–7) and a 30-day section-by-department exposure heatmap (Week 1–4).
9. **Failure Intelligence**: Normalized government UIMS/COA failure history log (350 events). Displays total train detention minutes, rectification speeds, failure modes, root causes, and Station Master remarks.
10. **What-If Simulator**: Interactive time-shift slider (-60 min to +120 min) for any corridor block. Dynamically runs traffic simulation against moving train timetables to report real-time train collisions and feasibility recommendations.
11. **Human Approval & Audit**: Section Controller review card with electronic sign-off (`[APPROVE]` / `[REJECT]`), remarks entry, and chronological immutable audit log (`audit_log`).
12. **GPS Network Map**: True curved track geometry with true GPS coordinates and local normal track offsets for UP and DOWN double-line working.

---

## 5. Verification & Compliance Matrix

The system includes an automated 10-point physics and compliance verification test suite (`engine/test_suite.py`):

| Test ID | Test Name | Category | Verification Result |
|---|---|---|---|
| **1.1** | Geospatial Link Integrity | SQL | **PASSED** (100% of physical assets mapped to valid operational sections) |
| **1.2** | Timetable Chronology | SQL | **PASSED** (Zero temporal causality violations: $\text{exit\_time} > \text{entry\_time}$) |
| **2.1** | Priority Score Bounds | Python | **PASSED** (Scores strictly bounded in $[0.0, 100.0]$) |
| **2.2** | Execution Completeness | Python | **PASSED** (100% of pending maintenance backlog scored deterministically) |
| **3.1** | Train Precedence Collision | CP-SAT | **PASSED** (Zero line-aware temporal collisions detected with moving trains) |
| **3.2** | Resource Capacity Limits | CP-SAT | **PASSED** (Machinery and department capacities strictly respected) |
| **4.1** | Combined Block Structure | CP-SAT | **PASSED** (Multi-department groups: $\ge 2$ departments, same section, time-aligned) |
| **5.1** | IR Peak Traffic Ban | CP-SAT | **PASSED** (Zero non-critical blocks granted during 12:00–18:00 peak hours) |
| **6.1** | Critical Safety Override | Policy | **PASSED** (100% safety-critical tasks locked to Critical with priority $\ge 90.0$) |
| **8.1** | Action Workflow Completeness | Actions | **PASSED** (100% tasks mapped to 6-stage operational action packages) |

---

## 6. Accessing the Live System

The system is fully containerized and runs locally:
- **Control Center UI & API:** `http://localhost:8765`
- **Health Check Probe:** `http://localhost:8765/api/health`
- **Run Verification Suite Live:** `curl http://localhost:8765/api/tests/status`
- **Benchmark Evaluation:** `curl http://localhost:8765/api/evaluation/baseline-vs-optimized`

*Ministry of Railways · Smart India Hackathon 2026 · Automatic Block Planning System v2.0*
