# ABPS v3 — Railway Control-Centre UI, Data Ingestion & 12K Dataset Rebuild Plan

## 1. Goal

Upgrade the existing ABPS prototype into a railway-control-centre-style application while preserving its existing ML, compatibility, CP-SAT, validation, SHAP, audit and KPI capabilities.

The new release has three pillars:

1. **Railway operational UX** — GIS-first dashboard, maroon/navy/saffron control-console styling, controller-oriented workflow and role-aware views.
2. **Data ingestion** — COA/TMS/TDMS/SMMS/UIMS/manual XLSX, CSV and JSON intake with preview, schema validation, duplicate/reference checks, provenance and controlled commit.
3. **Data/ML rebuild** — use the new 21-table, 12,000-row-per-table dataset pack as the application test source; rebuild the point-in-time ML table from operational source tables and retrain only when the target can be defined without leakage.

The application remains a **prototype/simulation environment**. It must not claim official Indian Railways authorization, live dispatch authority or real-world predictive performance unless independently verified.

## 2. Target workflow

```text
COA / TMS / TDMS / SMMS / UIMS / Manual file
        ↓
Data Ingestion Console
        ↓
Format + schema detection
        ↓
Validation + duplicate/reference checks
        ↓
Normalization + provenance
        ↓
PostgreSQL staging
        ↓
Canonical operational data
        ↓
Risk / Criticality / Impact / Urgency
        ↓
Compatibility + Shadow/Integrated candidates
        ↓
CP-SAT block planner
        ↓
Independent validation
        ↓
Controller review
        ↓
Approved recommended plan
        ↓
KPI + audit + plan version
```

## 3. Railway-style UI

### Header

- ABPS — Automated Block Planning System
- `SIMULATION / DEMO` environment badge
- Division selector
- Weekly/Monthly planning horizon
- COA/TMS/SMMS/TDMS synchronization state
- Current role/user
- alerts and verification state

### Primary navigation

1. Dashboard / GIS Map
2. Asset Backlog
3. Weekly Block Planner
4. Monthly Forecast
5. Coordination
6. AI / Risk Analytics
7. Failure Intelligence
8. Data Ingestion
9. Human Review & Audit
10. Verification Suite

### Dashboard

Use the supplied railway-control screenshot as the visual reference. The main screen should have:

- defect/task backlog table on the left
- KPI cards across the top
- large interactive GIS map in the centre
- AI action/recommendation feed on the right
- controller alerts and upcoming blocks below

The map is the centre of the page, not an optional secondary widget.

### Visual tokens

- Railway maroon: `#7F1418` / `#8E171B`
- Saffron: `#FF9933`
- Navy: `#0B1F4A`
- White: `#FFFFFF`
- Warm canvas: `#F7F7F5`
- Critical: `#D92D20`
- Warning: `#F79009`
- Success: `#12B76A`

Do not imitate an official government portal or use official emblems unless permitted. Use project branding plus a clear demo/simulation label.

## 4. GIS behaviour

Retain Leaflet/React-Leaflet. Add switchable layers:

- sections/corridors
- assets
- defects/failures
- Engineering work
- TRD/OHE work
- S&T work
- proposed blocks
- approved recommended blocks
- train movements
- COA availability
- failure density

Clicking an asset/defect should open an operational drawer:

`Asset → Section → Department → condition → failure history → risk → pending task → candidate block → coordination candidates`.

All operational values must come from APIs; do not use decorative fake numbers.

## 5. Data ingestion console

Add `frontend/src/components/DataIngestionView.tsx` and expose it through the application shell.

Supported files:

- XLSX
- CSV
- JSON

Source selector:

- COA / timetable
- TMS / Engineering
- TDMS / Traction
- SMMS / S&T
- UIMS / failure history
- manual maintenance demand

Workflow:

```text
Upload → Detect → Select dataset → Preview → Validate → Normalize → Stage → Commit
```

Every ingestion run must record:

- ingestion ID
- source system
- file name
- source hash/checksum
- uploaded by
- uploaded timestamp
- dataset/schema version
- rows received
- accepted rows
- rejected rows
- duplicate rows
- warnings/errors
- final status

Client-side parsing is for preview only. Server-side validation is authoritative.

## 6. New dataset source of truth

The new pack contains 21 datasets with 12,000 rows each:

| Dataset | Main use |
|---|---|
| corridors | corridor identity |
| sections | network geography |
| assets | asset master |
| failure_event_history | predictive history/failure intelligence |
| defect_history | defect backlog |
| maintenance_tasks | planning backlog |
| task_actions | work breakdown/resources |
| train_movements | COA/train conflict constraints |
| block_windows | possession/block availability |
| goods_forecast | freight demand |
| resources | crew/equipment capacity |
| task_compatibility | candidate coordination |
| task_dependencies | precedence |
| ml_predictions | model outputs |
| schedule_versions | plan governance |
| optimized_blocks | planner result |
| audit_log | audit trail |
| department_feeds | source provenance |
| inspections | condition features |
| maintenance_history | historical maintenance |
| block_tasks | task-to-block mapping |

Do not train directly on `ml_predictions`; it is a derived output and would create circularity.

## 7. Training rebuild

Build a point-in-time table from:

```text
assets
+ failure_event_history
+ defect_history
+ inspections
+ maintenance_history
+ train_movements
+ maintenance_tasks
```

For snapshot time `t`, only information available at or before `t` may become a feature. The target must be a future event after `t`.

Recommended target:

```text
future_critical_event_30d = 1
when a defined critical/high-impact failure event occurs within 30 days after t
```

Use temporal evaluation:

```text
oldest 65% → train
next 20%   → validation/tuning
latest 15% → final test
```

Candidate models:

- Logistic Regression
- Random Forest
- Extra Trees
- HistGradientBoosting
- XGBoost
- LightGBM
- CatBoost

Select using PR-AUC, recall, F1, ROC-AUC, calibration/Brier score and inference latency rather than accuracy alone.

### Important data-quality gate

The supplied 12K synthetic event pack produces a sparse future-event label when failure events are matched to assets. Therefore the retraining script must **measure positive-class support and temporal separability before promoting a champion model**. If the label is too sparse or unreliable, the application should retain the previous model and report `RETRAINING_NOT_PROMOTED` rather than claiming a new model is better.

This is intentional: the objective is a trustworthy pipeline, not an artificially high metric.

## 8. Risk/priority pipeline

```text
New task
 ↓
Feature enrichment
 ↓
R_i = P(critical event within 30d | X)
 ↓
Criticality C_i
 ↓
Impact I_i
 ↓
Urgency U_i
 ↓
Priority = 100 × R_i × I_i × U_i
```

Keep ML probability, criticality, impact and urgency separately visible and auditable.

## 9. CP-SAT planning

`block_windows` becomes a first-class planning entity. A task can be assigned only if:

- section/line/direction is compatible
- required isolation is available
- resources are available
- dependencies are satisfied
- train separation buffers are satisfied
- the block window is valid

Combined blocks must come from the compatibility engine, not a fixed arbitrary bonus.

Recommended objective order:

1. hard feasibility
2. critical-task coverage
3. risk reduction
4. expected downtime reduction
5. coordination value
6. block consolidation
7. block/resource efficiency

Safety and feasibility remain hard constraints.

## 10. COA workflow

COA uploads populate:

- `train_movements`
- `block_windows`
- `goods_forecast`

New COA data should trigger:

`ingest → validate → normalize → refresh operations → identify affected plan → optional re-optimization`.

A new plan must never be automatically approved after data changes.

## 11. Role-aware views

### Engineering

Track/P-Way assets, defects, demands and candidate coordination.

### TRD

OHE assets, power blocks, traction tasks and integrated-block candidates.

### S&T

Signals, point machines, track circuits, axle counters and isolation constraints.

### Section Controller

Cross-department visibility, conflicts, AI recommendations, CP-SAT plan, validation and approval/audit.

These are application roles, not claims of official railway authorization.

## 12. Frontend structure

```text
frontend/src/
├── App.tsx
├── api/client.ts
├── components/
│   ├── CommandCenterView.tsx
│   ├── DataIngestionView.tsx
│   ├── MapView.tsx
│   ├── TasksView.tsx
│   ├── AIPriorityView.tsx
│   ├── CoordinationView.tsx
│   ├── GanttTab.tsx
│   ├── WeeklyMonthlyView.tsx
│   ├── FailureIntelligenceView.tsx
│   ├── WhatIfSimulatorView.tsx
│   ├── ApprovalAuditView.tsx
│   └── AlertsView.tsx
└── index.css
```

Reuse working components; change the shell, data contracts and data sources before rewriting functionality.

## 13. Backend structure

```text
backend/
├── main.go
├── handlers/
├── services/
└── models/
```

The current Go Fiber API remains the stable API boundary. Until the Go-only migration is complete, it may orchestrate the existing Python ML/CP-SAT engine. The final migration should replace the Python proxy only after model/solver parity is tested.

## 14. Required API additions

```text
POST /api/ingestion/preview
POST /api/ingestion/validate
POST /api/ingestion/commit
GET  /api/ingestion/runs
GET  /api/ingestion/runs/:id
GET  /api/ingestion/templates/:dataset
GET  /api/assets?page=&page_size=
GET  /api/failures?page=&page_size=
```

Example validation response:

```json
{
  "ingestion_id": "ING-...",
  "dataset": "train_movements",
  "schema_version": "v3",
  "rows_received": 12000,
  "rows_accepted": 11972,
  "rows_rejected": 28,
  "duplicates": 7,
  "validation_status": "WARNINGS"
}
```

## 15. Files to change

### Frontend

- `App.tsx`: add Data Ingestion route and railway shell.
- `Sidebar.tsx`: add Data Ingestion and reorganize navigation.
- `Header.tsx`: add division, sync, horizon and simulation state.
- `CommandCenterView.tsx` / `DashboardView.tsx`: GIS-first railway dashboard.
- `MapView.tsx`: operational layers and asset/defect drawer.
- `client.ts`: ingestion, validation, pagination and data-source contracts.
- `index.css`: railway control-centre tokens.
- `package.json`: add XLSX parser dependency for client preview.

### Engine

- `generate_ml_dataset.py`: replace synthetic-only generation with point-in-time feature building.
- `retrain_from_operational_data.py`: canonical retraining command.
- `multi_model_benchmark.py`: benchmark the rebuilt table.
- `risk_service.py`: model/data version loading.
- `criticality_engine.py`: configuration-driven corridor/criticality factors.
- `compatibility_engine.py`: block/resource/dependency-aware candidates.
- `coordination_engine.py`: measured coordination value.
- `optimizer_core.py`: block-centric CP-SAT.
- `test_suite.py`: ingestion/ML/planning regression tests.
- `schema.sql`: ingestion, model, rule and plan governance tables.

### Backend

- `main.go`: ingestion handlers, pagination, calculated validation metrics.
- Remove constant demo outputs such as hard-coded `0 collisions`, `100% success` and fixed solver runtime. These must come from validation/solver results.

## 16. Performance for 12K tables

Do not send all 12K rows to React on initial load. Use server-side pagination for task/assets/failure tables and aggregated endpoints for dashboard KPIs. Map data should be viewport/section scoped where possible. ML trains offline; task inference is lightweight. CP-SAT should receive only the selected horizon and candidate task set.

## 17. Verification

### Data

- schema/key validation
- duplicate detection
- date/time validation
- asset/section references
- task/asset references
- block/section references
- train chronology

### ML

- temporal split
- leakage checks
- target support gate
- benchmark comparison
- calibration
- artifact load
- SHAP

### Optimization

- block containment
- train buffers
- resource capacity
- dependencies
- compatibility
- integrated/shadow group validity

### UI

- dashboard loads with 12K data
- pagination works
- GIS remains responsive
- CSV/XLSX/JSON preview works
- ingestion status is visible
- plan generation status is visible
- approval creates audit event

## 18. Implementation order

### P0 — data correctness

1. Load/validate 21 datasets.
2. Add ingestion metadata and provenance.
3. Build point-in-time ML table.
4. Train/evaluate with a promotion gate.

### P1 — operational planning

5. Replace hard-coded dashboard metrics.
6. Integrate block windows/resources/goods forecast.
7. Harden CP-SAT and validator.
8. Add controller approval/audit.

### P1 — UI

9. Railway shell.
10. GIS-first dashboard.
11. Data ingestion console.
12. Role-aware navigation.
13. Weekly/monthly plan views.

### P2 — scale/security

14. Pagination and aggregation.
15. ingestion job queue.
16. backend RBAC.
17. model/rule versioning.
18. observability/CI.
19. Go-only ML/optimization migration after parity tests.

## 19. Definition of Done

A controller can upload COA data, preview and validate it, commit it into the canonical data layer, see the updated backlog/map/forecast, generate versioned risk scores, view coordination candidates, generate a CP-SAT plan using valid block windows, inspect independent validation, review/approve/reject/modify the recommendation, and compare baseline vs optimized blocks, downtime, utilization and availability.
