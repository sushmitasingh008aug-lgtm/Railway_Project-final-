# ABPS v4.0 Visual Guide Discrepancy & Technical Gap Analysis Report

> **Project**: Indian Railways Automated Block Planning System (ABPS v4.0)  
> **Corridor**: Delhi Division — Howrah Main Line (1,447 km · 6 High-Density Sections)  
> **Agency**: Ministry of Railways · Smart India Hackathon 2026  
> **Date**: September 2026  
> **Coverage**: Complete 18-Section Production Architecture & 33 Uploaded Screenshots

---

## 1. Executive Summary

This report documents all technical discrepancies, outdated descriptions, and missing UI components identified between the legacy visual guide documentation and the live, production-grade codebase (`frontend/src/`, `backend/main.go`, and `engine/`).

Rather than treating the legacy 7-view visual guide as a limitation, this audit establishes the verified 18-section codebase as the single source of truth, mapping all **33 screenshots in `docs/visual_guide/`** (`Screenshot (1560).png` through `Screenshot (1594).png`) to the **18 operational sections** of the system.

```mermaid
pie title "Visual Guide Documentation & Screenshot Coverage Audit"
    "18 Sections Fully Mapped" : 18
    "33 Visual Guide Screenshots Integrated" : 33
    "Legacy Gaps Reconciled" : 12
    "Mathematical Verification Proofs" : 12
```

---

## 2. 33-Screenshot to 18-Section Production Mapping Matrix

Every uploaded screenshot in `docs/visual_guide/` is mapped to its primary and secondary role within the 18-section application structure:

| Section ID | Section Title | Primary Uploaded Screenshot | Secondary Screenshots | Operational Role |
| :---: | :--- | :--- | :--- | :--- |
| **01** | `1. Dashboard / GIS Map` | `Screenshot (1571).png` | `Screenshot (1572).png`, `(1573)`, `(1574)` | Real-time network state, 4 KPI cards, maintenance queue, and interactive Leaflet GIS corridor map. |
| **02** | `2. Asset Backlog` | `Screenshot (1576).png` | `Screenshot (1575).png`, `(1577)` | Multi-department work order catalog (15,004 tasks), urgency distribution, and expected-loss ranking. |
| **03** | `3. Task Generator` | `Screenshot (1578).png` | `Screenshot (1579).png`, `(1580)` | Cross-department intake wizard (Engineering, TRD, S&T), 8-stage isolation package, and instant CP-SAT certification. |
| **04** | `4. Weekly Block Planner` | `Screenshot (1581).png` | `Screenshot (1582).png` | CP-SAT 7-day corridor timeline, 6 sectional swimlanes, train precedence walls, and assigned possessions table. |
| **05** | `5. Monthly Forecast` | `Screenshot (1583).png` | `Screenshot (1584).png` | 30-day strategic corridor capacity, multi-horizon day cards, and monthly possession density heatmap. |
| **06** | `6. Coordination Centre` | `Screenshot (1585).png` | `Screenshot (1586).png` | Hero bundling candidate (SEC-03), 8-point compatibility matrix, and cross-department shadow blocks. |
| **07** | `7. Integrated / Shadow Blocks` | `Screenshot (1587).png` | `Screenshot (1570).png` | Before vs. After ROI analysis, 63.1% block compression, and +0.67% availability gain. |
| **08** | `8. Train & Block Conflicts` | `Screenshot (1588).png` | `Screenshot (1589).png` | UP/DOWN directional swimlanes, 1,819 timetable trains, and 10-minute statutory safety headway proof. |
| **09** | `9. AI Risk & Priority` | `Screenshot (1590).png` | — | XGBoost v2.4 Champion model, physics Weibull hazard curves, and local SHAP feature attributions. |
| **10** | `10. Failure Intelligence` | `Screenshot (1591).png` | `Screenshot (1592).png` | Historical 12,000 UIMS failure logs, MTBF analytics, root-cause incident dossiers, and preventative orders. |
| **11** | `11. Asset Health` | `Screenshot (1593).png` | — | 12,000 canonical assets, Ultrasonic Flaw Detection (USFD) scans, condition curves, and machine logistics staging. |
| **12** | `12. Data Ingestion` | `Screenshot (1594).png` | `Screenshot (1562).png` | Multi-source enterprise feeds (COA, TMS, TDMS, SMMS, UIMS), CSV drag-and-drop, and staging pipeline. |
| **13** | `13. Data Quality` | `Screenshot (1563).png` | — | Great Expectations audit matrix, zero-null constraints, schema completeness, and referential integrity. |
| **14** | `14. Model / Data Versions` | `Screenshot (1565).png` | — | Model registry, 6-candidate benchmark leaderboard, MLflow hyperparameter lineage, and hot-swap button. |
| **15** | `15. Human Review & Audit` | `Screenshot (1566).png` | — | Chief Controller review stepper, electrical interlock checklist, and cryptographically signed authority. |
| **16** | `16. Verification Suite` | `Screenshot (1567).png` | — | 12/12 mathematical proof gate, 6 physical safety laws, and formal safety compliance certificate. |
| **17** | `17. What-If Simulator` | `Screenshot (1560).png` | `Screenshot (1561).png` | Dynamic contingency replanning, temporal shifts (-60m to +120m), disturbance injection, and ripple delay simulation. |
| **18** | `18. Scenario Explorer` | `Screenshot (1564).png` | — | Strategic multi-scenario comparison, cost vs throughput Pareto frontier, and scenario commitment. |

---

## 3. Itemized Technical Gap Resolutions

| Discrepancy ID | Feature Area | Legacy Visual Guide Statement | Live Production Codebase Implementation | Technical Resolution & Impact |
| :---: | :--- | :--- | :--- | :--- |
| **DISC-01** | **Track Conflicts Timeline** | Documented a single flat timeline mixing both track directions with static mock data. | Implemented **Directional Track Swimlanes** separating UP Line (Delhi $	o$ Howrah) and DOWN Line (Howrah $	o$ Delhi) using greedy interval packing ([TrainConflictsView.tsx](file:///frontend/src/components/TrainConflictsView.tsx)). | Resolves parallel-track confusion; prevents false collision alarms across bidirectional double tracks. |
| **DISC-02** | **Dynamic Section & Timetable Binding** | Documented hardcoded mock data for train conflict cards and timetables. | Bound `TrainConflictsView` dynamically to live API endpoints: `/api/sections`, `/api/trains`, and `/api/schedule` ([App.tsx](file:///frontend/src/App.tsx)). | Dynamically loads all 1,819 trains, computing pairwise headway buffers in real time. |
| **DISC-03** | **Headway Compliance Inspector** | Entirely omitted from visual guide; no mention of interactive modal popups. | Implemented interactive **Headway Inspector Modal** featuring 2x4 attribute grid and statutory clearance certificate box ([TrainConflictsView.tsx](file:///frontend/src/components/TrainConflictsView.tsx)). | Provides verifiable mathematical compliance certificate proving adherence to 10-minute headway. |
| **DISC-04** | **Cross-Department Task Generator** | Documented as a static intake form without safety validation. | Implemented full **5-Step Task Generator Wizard** with 8-stage isolation packages, 25kV traction power interlocks, and real-time CP-SAT feasibility checks ([TaskGeneratorView.tsx](file:///frontend/src/components/TaskGeneratorView.tsx)). | Field engineers generate constraint-certified block slots directly, enforcing zero electrical hazards. |
| **DISC-05** | **Asset Backlog Pagination & Count** | Described as displaying 0 or mock tasks. | Connected to canonical SQLite database of 15,004 multi-department tasks with 25 tasks per page and 601 pages ([server.py](file:///backend/server.py), [TasksView.tsx](file:///frontend/src/components/TasksView.tsx)). | Full production backlog accessible with instant search, department filters, and detail drawers. |
| **DISC-06** | **Mathematical Proof Gate** | Documented as generic alert banner. | Created **12-Point Automated Safety Gate** executing exact mathematical formulas for headway, causality, Weibull hazard, and spatial consistency ([test_suite.py](file:///engine/test_suite.py), [AlertsView.tsx](file:///frontend/src/components/AlertsView.tsx)). | 100% test pass rate provides regulatory safety verification before schedule export. |
