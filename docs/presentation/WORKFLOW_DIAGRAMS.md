# Indian Railways Automated Block Planning System (ABPS v4.0)
## Verified Operational User Workflows & System Interaction Diagrams

> **Ministry of Railways · Smart India Hackathon 2026**  
> **Operational Corridor**: Delhi Division — Howrah Mainline (1,447 km · 6 High-Density Sections)  
> **Document Purpose**: End-to-end mapping of operational user journeys, state transitions, API calls, and mathematical gates for PowerPoint presentation and viva defense.

---

## 1. Executive Workflow Architecture

The ABPS architecture orchestrates user actions across six tightly coupled operational workflows:

```mermaid
graph TD
    subgraph "Operational Planning & Dispatch Pipeline"
        WF1["Workflow 1: Daily Operations & Emergency Response (S01, S02)"]
        WF2["Workflow 2: Maintenance Intake & Constraint Block Grant (S03)"]
        WF3["Workflow 3: Multi-Corridor CP-SAT Weekly Planning (S04)"]
        WF4["Workflow 4: Cross-Department Shadow Block Consolidation (S06, S07)"]
        WF5["Workflow 5: Predictive Failure Forensics & Dispatch (S09, S10, S11)"]
        WF6["Workflow 6: Dual-Signoff & Mathematical Certification (S15, S16)"]
    end

    WF1 -->|Dispatches Immediate Need| WF2
    WF2 -->|Feeds Certified Tasks| WF3
    WF3 -->|Supplies Schedules| WF4
    WF5 -->|Prioritizes Backlog| WF1
    WF4 -->|Prepares Final Plan| WF6
    WF6 -->|Issues Master Authority| WF1
```

---

## 2. Workflow 1: Daily Operations & Situational Awareness (Sections 01 & 02)

### Context & Goal
A Chief Traffic Controller starts their 8-hour shift at the Delhi Division Operations Nerve Center. They review live network state, inspect pending high-risk tasks, verify corridor track availability, and triage overdue maintenance.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Controller as Chief Traffic Controller
    participant UI as React Frontend (CommandCenterView S01)
    participant Backlog as TasksView (S02)
    participant API as Go Fiber Gateway (:3000)
    participant Engine as Python CP-SAT Engine (:8765)
    participant DB as SQLite Master DB

    Controller->>UI: Opens Dashboard (/?tab=dashboard)
    UI->>API: GET /api/metrics & GET /api/schedule
    API->>Engine: Forward telemetry request
    Engine->>DB: Query current block allocations & train stats
    DB-->>Engine: Raw operational state
    Engine-->>API: 4 KPI Cards, Priority Queue, Corridor Health
    API-->>UI: HighLevelMetrics JSON
    UI-->>Controller: Renders 4 KPI Cards, Leaflet Track Map, Urgent Tasks
    Controller->>UI: Clicks "View All Backlog Tasks" (S01-C03)
    UI->>Backlog: Navigates to Section 02 (/?tab=asset_backlog)
    Backlog->>API: GET /api/tasks?page=1&limit=25
    API->>Engine: Query paginated backlog
    Engine->>DB: SELECT * FROM maintenance_tasks LIMIT 25
    DB-->>Engine: 25 tasks, total: 15,004, total_pages: 601
    Engine-->>Backlog: Return 25 tasks with priority rankings
    Backlog-->>Controller: Displays Paginated Table (Page 1 of 601)
```

---

## 3. Workflow 2: Cross-Department Maintenance Intake & Block Grant (Section 03)

### Context & Goal
A P-Way Section Engineer identifies track gauge widening near km 142 on Section SEC-DH-01. They open Task Generator, select Engineering -> Rail Replacement on Asset AST-DH-003582, set 180 min duration, require 25kV OHE isolation, and obtain an instant conflict-free possession window.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as P-Way Section Engineer
    participant Wizard as TaskGeneratorView (S03)
    participant API as Go Gateway (:3000)
    participant Solver as Python CP-SAT Engine (:8765)
    participant DB as Master DB

    Engineer->>Wizard: Selects Department "Civil Engineering" (S03-C01)
    Engineer->>Wizard: Selects Asset AST-DH-003582 (S03-C02)
    Wizard->>API: GET /api/assets?asset_id=AST-DH-003582
    API-->>Wizard: Returns section SEC-DH-01, chainage km 142.4
    Wizard-->>Engineer: Locks track location & centers Leaflet mini-map
    Engineer->>Wizard: Selects template "Rail Replacement", 180 min (S03-C03)
    Engineer->>Wizard: Toggles 25kV OHE Isolation: REQUIRED (S03-C04)
    Engineer->>Wizard: Clicks "Generate Maintenance Task & Block Allocation" (S03-C05)
    Wizard->>API: POST /api/tasks/generate (Payload)
    API->>Solver: Evaluate candidate windows vs timetabled trains
    Solver->>Solver: Check 10-min statutory headway against 1,819 trains
    Solver->>DB: Insert new task TASK-DH-015005 (Priority: 85.7)
    Solver-->>API: Certified Window (02:15 - 05:15 Night Window, 0 Overlaps)
    API-->>Wizard: CandidateBlockOptions JSON
    Wizard-->>Engineer: Displays Certified Feasibility Radar & Commit CTA
```

---

## 4. Workflow 3: Multi-Corridor CP-SAT Weekly Planning (Section 04)

### Context & Goal
The Divisional Block Coordinator executes the 7-day tactical planning cycle across all 6 sections (1,447 km mainline), resolving mutual exclusion between train precedence walls and track possessions.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Coordinator as Divisional Block Coordinator
    participant Gantt as Weekly Planner (GanttTab S04)
    participant API as Go Gateway (:3000)
    participant CPSAT as Google OR-Tools CP-SAT Solver
    participant DB as Master DB

    Coordinator->>Gantt: Selects Section SEC-DH-01 (Delhi - Kanpur)
    Coordinator->>Gantt: Clicks "Regenerate CP-SAT Plan" (S04-C01)
    Gantt->>API: POST /api/schedule/generate?section_id=SEC-DH-01
    API->>CPSAT: Launch optimizer_core.py subprocess
    CPSAT->>DB: Fetch 1,819 trains and pending eligible tasks
    CPSAT->>CPSAT: Model interval variables across 10,080 min timeline
    CPSAT->>CPSAT: Solve NoOverlap constraints & minimize passenger delay
    CPSAT->>DB: Atomic write to scheduled_tasks & optimized_blocks
    CPSAT-->>API: Optimal solution found (Status: OPTIMAL, Runtime: 1.42s)
    API-->>Gantt: Return 72 conflict-free scheduled blocks
    Gantt-->>Coordinator: Canvas renders 6-corridor interactive Gantt chart
```

---

## 5. Workflow 4: Cross-Department Shadow Block Consolidation (Sections 06 & 07)

### Context & Goal
Consolidate separate work orders from Track (TMS), OHE Traction (TDMS), and Signalling (SMMS) into a single physical track possession window (Shadow Block), cutting passenger disruption by 32.4%.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Coordinator as Coordination Specialist
    participant CoordUI as Coordination Centre (S06)
    participant BeforeAfter as Shadow Blocks View (S07)
    participant API as Go Gateway (:3000)
    participant Engine as Optimization Core

    Coordinator->>CoordUI: Opens Section 06 (/?tab=coordination)
    CoordUI->>API: GET /api/coordination/candidates
    API-->>CoordUI: Candidate Pairs (e.g. PAIR-DH-01)
    CoordUI-->>Coordinator: Displays Hero Card SEC-03 (2 Closures Avoided)
    Coordinator->>CoordUI: Clicks "Verify 8-Point Safety Compatibility" (S06-C03)
    CoordUI->>CoordUI: Run deterministic compatibility matrix (Spatial, Electrical, Buffer)
    CoordUI-->>Coordinator: Displays "COMPATIBLE FOR COORDINATION" (All 8 checks PASS)
    Coordinator->>CoordUI: Clicks "Bundle into Shadow Block" (S06-C04)
    CoordUI->>API: POST /api/coordination/bundle (PAIR-DH-01)
    API->>Engine: Re-index schedule into single multi-department possession
    API-->>CoordUI: Bundle confirmed
    Coordinator->>BeforeAfter: Navigates to Section 07 (/?tab=shadow_blocks)
    BeforeAfter-->>Coordinator: Renders Before vs After ROI: +0.67% capacity gain, 63.1% consolidation
```

---

## 6. Workflow 5: Predictive Failure Forensics & Preventive Dispatch (Sections 09, 10 & 11)

### Context & Goal
AI Risk engine identifies high-hazard assets approaching critical wear. Reliability engineers inspect historical UIMS failure logs, examine SHAP feature attribution waterfalls, and dispatch preventative work orders before line breakdown occurs.

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Engineer as Asset Reliability Engineer
    participant AIPriority as AI Risk View (S09)
    participant FailureUI as Failure Intelligence (S10)
    participant HealthUI as Asset Health View (S11)
    participant API as Go Gateway (:3000)

    Engineer->>AIPriority: Opens Section 09 (/?tab=ai_priority)
    AIPriority->>API: GET /api/ai/risk-scores
    API-->>AIPriority: Champion XGBoost scores + SHAP waterfalls
    AIPriority-->>Engineer: Highlights TASK-DH-001643 (Risk: 71.3%)
    Engineer->>FailureUI: Navigates to Section 10 (/?tab=failure_intelligence)
    FailureUI->>API: GET /api/failures/uims
    API-->>FailureUI: 12,000 UIMS logs, recurrence clusters, MTBF stats
    FailureUI-->>Engineer: Shows Section Insulator Failure dossier (355 min duration)
    Engineer->>HealthUI: Opens Section 11 (/?tab=asset_health)
    HealthUI-->>Engineer: Renders Weibull physical degradation curve
    Engineer->>HealthUI: Clicks "Create Preventative Task" (S11-C04)
    HealthUI-->>Engineer: Pre-fills Task Generator with asset ID and urgent priority
```

---

## 7. Workflow 6: Dual-Signoff & Mathematical Certification (Sections 15 & 16)

### Context & Goal
Before any maintenance block can be physically dispatched to station masters, the master schedule must pass 12 deterministic mathematical proofs and receive two-person cryptographic sign-off (Chief Controller + Safety Commissioner).

### Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Controller as Chief Train Controller
    actor Commissioner as Safety Commissioner
    participant AuditUI as Human Review & Audit (S15)
    participant VerifyUI as Verification Suite (S16)
    participant Gate as Automated Test Suite (test_suite.py)

    Controller->>AuditUI: Opens Section 15 (/?tab=approvals_audit)
    AuditUI-->>Controller: Displays Chief Controller Approval Stepper
    Controller->>AuditUI: Inputs controller notes and signs Stage 1
    Commissioner->>AuditUI: Enters safety audit clearance and signs Stage 2 (S15-C04)
    AuditUI->>AuditUI: Generate SHA-256 cryptographic audit hash
    Controller->>VerifyUI: Navigates to Section 16 (/?tab=verification_suite)
    VerifyUI->>Gate: Trigger 12 mathematical safety checks
    Gate->>Gate: Test 10-min headway, logistic urgency, spatial integrity
    Gate-->>VerifyUI: 12/12 CHECKS PASSED (Zero collisions)
    VerifyUI-->>Controller: Renders Green Certificate Badge & "Export Safety Certificate" (S16-C04)
    Controller->>VerifyUI: Clicks Export Certificate -> Master Schedule Dispatch Authorized!
```
