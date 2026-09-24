# Indian Railways Automated Block Planning System (ABPS v4.0)
## Complete Website UI Annotation, 18-Section Feature Analysis & Presentation Guide

> **Ministry of Railways · Smart India Hackathon 2026**  
> **Operational Jurisdiction**: Delhi Division — Howrah Main Line (1,447 km · 6 High-Density Sections)  
> **Production Stack**: React 18 + TypeScript + Vite | Go Fiber (High-Concurrency Gateway) | Python 3.11 + Google OR-Tools (CP-SAT Solver) | PostgreSQL 16 + Redis

---

### Executive Summary & 5-Tier Operational Organization
The Automated Block Planning System (ABPS v4.0) resolves the fundamental operational conflict of modern railway networks: executing heavy track maintenance without disrupting high-speed passenger traffic.
The application interface is organized into **18 integrated operational sections** across 5 functional tiers:

1. **OPERATIONS**: 1. Dashboard / GIS Map, 2. Asset Backlog, 3. Task Generator, 4. Weekly Block Planner, 5. Monthly Forecast
2. **COORDINATION**: 6. Coordination Centre, 7. Integrated / Shadow Blocks, 8. Train & Block Conflicts
3. **INTELLIGENCE**: 9. AI Risk & Priority, 10. Failure Intelligence, 11. Asset Health
4. **DATA**: 12. Data Ingestion, 13. Data Quality, 14. Model / Data Versions
5. **CONTROL & SIMULATION**: 15. Human Review & Audit, 16. Verification Suite, 17. What-If Simulator, 18. Scenario Explorer

### Multi-Color Visual Annotation Taxonomy
Every UI component in ABPS v4.0 is annotated using a deterministic 6-color taxonomy across diagrams, screenshots, and evaluation tables:

| Color Indicator | Code | Category Name | Hex Code | Operational Purview & Examples |
| :---: | :---: | :--- | :---: | :--- |
| 🟦 | `NAV` | **Navigation & Page Structure** | `#2563EB` | Global headers, division shell, date navigators, horizon toggle buttons, stepper bars |
| 🟩 | `ACTION` | **Primary Actions & Buttons** | `#10B981` | Re-run CP-SAT optimizer, optimize group, dispatch work order, promote model, export certificate |
| 🟧 | `FORM` | **Forms, Filters & Inputs** | `#D96F13` | Department quick-filters, search bars, temporal shift controls, CSV file dropzone |
| 🟪 | `CARD` | **Cards & Content Sections** | `#7C3AED` | Metric ribbons, asset backlog table, scheduled possessions roster, hyperparameter manifests |
| 🟥 | `ALERT` | **Alerts, Errors & Safety Warnings** | `#DC2626` | Emergency priority queue, headway buffer violations, collision radar, 25kV power interlocks |
| 🟦 | `CHART` | **Charts, Analytics & Telemetry** | `#0891B2` | Leaflet GIS map, 6-corridor Gantt timeline, Weibull curves, SHAP explainability, Pareto charts |

---

## Section 01 — 1. Dashboard / GIS Map
**Operational Tier**: `OPERATIONS` | **Route**: `/?tab=dashboard` | **Source File**: [`frontend/src/components/CommandCenterView.tsx`](file:///frontend/src/components/CommandCenterView.tsx)  
**Core Purpose**: Consolidated operational nerve-center providing real-time situational awareness across the Delhi-Howrah mainline, integrating KPI summaries, emergency queues, corridor availability, and interactive GIS geospatial mapping.

![Annotated UI - 1. Dashboard / GIS Map](./annotated/01_dashboard_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/01_dashboard_annotated.png) | [Clean Production Screenshot](./clean/01_dashboard_clean.png) | [Presentation Poster](./infographics/01_dashboard_guide.png)*

### 4.1 What is this section?
The Dashboard / GIS Map is the executive operational landing page of ABPS v4.0. It integrates real-time network health, scheduled CP-SAT block status, pending asset maintenance alerts, and an interactive GIS spatial map across all 6 high-density corridor sections of Delhi Division.

### 4.2 Why is it included?
Without a unified command dashboard, railway traffic controllers must cross-reference isolated logbooks, scada alarms, and train control charts. This section brings all operational threads into a single glass pane, allowing instant decision-making and rapid bottleneck identification.

### 4.3 Features
- 4-Card Critical KPI Ribbon summarizing active maintenance tasks, safety overrides, CP-SAT blocks, and conflict counts.
- Maintenance Priority Queue with urgent work orders sorted by expected-loss ranking.
- Interactive Leaflet GIS Map displaying track sections, active block possessions, and asset geolocations with popup inspectors.
- Real-Time Corridor Availability Gauges and sectional traffic density meters.
- Quick action triggers for emergency re-optimization and system-wide status refresh.

### 4.4 What does each feature do?
On initial render, CommandCenterView triggers concurrent asynchronous calls to /api/metrics, /api/tasks, and /api/network/corridors. As telemetry feeds in, priority scores are normalized, Leaflet polylines render corridor track segments colored by health status, and live WebSocket heartbeats keep counters synchronized.

### 4.5 How does the user interact with it?
Controllers scan top KPIs to detect anomalies, toggle between Weekly and Monthly horizons, click on urgent maintenance rows in the queue to inspect asset wear, and pan/zoom the GIS map to inspect specific track sections and OHE feeder stations.

### 4.6 What happens after interaction?
Real-time visual map of corridor possessions, aggregated divisional maintenance metrics, and instant navigational entry points into deep diagnostic views.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Directly links to Section 2 (Asset Backlog) via priority queue rows, Section 3 (Weekly Block Planner) via block status chips, and Section 18 (Verification Suite) via the safety gate status badge.

### 4.9 Practical example
At 06:30 AM during morning peak, a Sectional Controller notices the 'Critical Tasks' badge turns red (15 urgent defects). By clicking the top urgent TRD task on the GIS map, the controller instantly sees a sagging catenary wire at KM 142/8 and initiates an emergency block recommendation before freight congestion peaks.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "The Dashboard is our operational nerve-center. It combines mathematical telemetry with Leaflet GIS spatial mapping so divisional controllers can monitor 1,447 km of high-density track, 72 certified maintenance blocks, and 1,819 train movements in a single, conflict-free interface."

### 4.11 Technical explanation (Architecture & Data Flow)
Built with React 18, Tailwind CSS, Lucide icons, and React-Leaflet. Consumes Go Fiber REST endpoints (/api/metrics, /api/network/corridors) and communicates with the Python CP-SAT solver backend via asynchronous HTTP state hooks.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S01-C01 | **Global Brand & Divisional Shell Header** | 🟦 `NAV` | Navigation & Shell Header | Top View Header (x: 280-1890, y: 15-60) | Clean header banner with Indian Railways crest, 'ABPS CONTROL' wordmark, Delhi Division subtitle, and live connection status chip. | Establishes system context, operational jurisdiction, and verified server connectivity. | Displays live system status; clicking branding returns to root dashboard view. | `frontend/src/components/Header.tsx, Lucide-React LayoutDashboard` | `GET /api/status, WebSocket /ws/telemetry` | `activeView, connectionStatus, la...` | Displays amber 'RECONNECTING' pill if WebSocket disconnects; auto-reconnects with exponential backoff. | App.tsx root navigation shell, Sidebar navigation items | Guarantees that controllers always know their operating jurisdiction and connectivity state. | "Our shell header anchors the system to Delhi Division, displaying live connection status to the central dispatch server." |
| S01-C02 | **Critical KPI Telemetry Ribbon** | 🟪 `CARD` | Metric Card Grid (4 Cards) | Upper Dashboard Banner (x: 280-1890, y: 70-160) | Four white cards with accent borders in Saffron, Blue, Amber, and Emerald featuring numerical badges and status chips. | Provides instant situational awareness of safety-critical tasks, approved possessions, and conflict status. | Hover to view metric deltas; click to filter corresponding maintenance task categories. | `frontend/src/components/CommandCenterView.tsx, backend/main.go (/api/metrics)` | `GET /api/metrics, GET /api/kpi/summary` | `metricsData: { criticalTasks: 15...` | Displays skeleton loaders if backend latency exceeds 200ms; highlights red if conflicts > 0. | TasksView (Section 2), GanttTab (Section 3), AlertsView (Section 18) | Alerts leadership within seconds to pending safety hazards and block execution progress. | "At a glance, division controllers see our system has certified 72 conflict-free block windows while resolving all 15 high-criticality asset defects." |
| S01-C03 | **Maintenance Priority Queue** | 🟥 `ALERT` | Urgency-Ranked List / Alert Card | Mid Dashboard (Left Column, x: 280-800, y: 180-520) | Vertical card with red badge indicator showing top urgent asset work orders with department tags (TRD, ENG, S&T). | Prevents catastrophic asset failures by ranking maintenance tasks using expected-loss formulation. | Click on any task row to open the Task Detail Drawer with failure probability curves. | `frontend/src/components/CommandCenterView.tsx, engine/priority_engine.py` | `GET /api/tasks?sort=priority_desc&limit=10` | `urgentTasks: Task[], selectedTas...` | Handles empty queue gracefully with 'Zero Critical Overdue Tasks' green banner. | TaskDetailDrawer, TasksView (Section 2), CoordinationView (Section 6) | Directly mitigates derailment risks by surfacing ultrasonic flaw detections before track fractures occur. | "Our priority queue ranks work orders using physics-informed degradation models, guaranteeing that safety-critical rail cracks are addressed first." |
| S01-C04 | **Leaflet GIS Corridor Asset Map** | 🟦 `CHART` | Interactive Geospatial GIS Map | Mid Dashboard (Right Column, x: 820-1890, y: 180-520) | Interactive OpenStreetMap canvas with colored corridor track segments, station markers, and possession overlays. | Visualizes geospatial track topology, active line closures, and maintenance asset locations across Delhi-Howrah. | Pan, zoom, click on corridor lines to view live possession popup and asset telemetry. | `react-leaflet, leaflet/dist/leaflet.css, CommandCenterView.tsx` | `GET /api/network/corridors, GET /api/gis/assets` | `mapCenter: [28.6139, 77.2090], a...` | Gracefully falls back to offline schematic svg if Leaflet tile servers are unreachable. | AssetHealthView (Section 11), GanttTab (Section 3) | Enables dispatchers to visualize geographic density and avoid isolated block trap points. | "This interactive GIS map provides live geospatial tracking of Delhi Division's 6 main sections, highlighting active track possessions in real time." |
| S01-C05 | **Corridor Performance & Punctuality Matrix** | 🟦 `CHART` | Sectional Telemetry Table / Heatmap | Lower Dashboard (x: 280-1890, y: 540-950) | Multi-row tabular matrix with progress bars, availability percentages, and punctuality trend sparklines. | Monitors throughput efficiency and passenger punctuality impact across all 6 corridor subsections. | Sort by availability or punctuality; click a section to drill into weekly block schedule. | `frontend/src/components/CommandCenterView.tsx` | `GET /api/corridors/performance` | `corridorMetrics: CorridorMetric[...` | Flags sections experiencing speed restrictions with amber alert icon. | GanttTab (Section 3), WeeklyMonthlyView (Section 4) | Maintains 95%+ punctuality for Vande Bharat and Rajdhani expresses during active maintenance cycles. | "Here controllers monitor throughput and punctuality across all 6 corridor segments, proving that our block allocations preserve track capacity." |

---

## Section 02 — 2. Asset Backlog
**Operational Tier**: `OPERATIONS` | **Route**: `/?tab=asset_backlog` | **Source File**: [`frontend/src/components/TasksView.tsx`](file:///frontend/src/components/TasksView.tsx)  
**Core Purpose**: Comprehensive maintenance task repository integrating work orders from Engineering (ENG), Traction Distribution (TRD), and Signal & Telecommunication (S&T) with expected-loss prioritization.

![Annotated UI - 2. Asset Backlog](./annotated/02_asset_backlog_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/02_asset_backlog_annotated.png) | [Clean Production Screenshot](./clean/02_asset_backlog_clean.png) | [Presentation Poster](./infographics/02_asset_backlog_guide.png)*

### 4.1 What is this section?
Asset Backlog is the centralized inventory of all pending, approved, and completed railway maintenance tasks across permanent way, overhead electrification, and signaling assets.

### 4.2 Why is it included?
Historically, each railway department operated in silos using separate paper ledgers or disparate legacy databases. Asset Backlog unifies all departments into a standardized schema with rigorous priority scoring.

### 4.3 Features
- Unified task table showing Task ID, Department, Section, Duration, Criticality Score, and Deadline.
- Department filter buttons (All, TRD, ENG, S&T, MECH) with dynamic counter badges.
- Search input with instant filtering by asset ID, track kilometer, or supervisor name.
- Priority distribution summary cards breaking down tasks by Critical, High, Medium, and Routine.
- Direct action triggers to inspect asset health curves and manually adjust scheduling windows.

### 4.4 What does each feature do?
Tasks ingested from UIMS and manual work orders are evaluated by the Python urgency engine. Criticality is computed as a product of asset failure probability, line importance factor, and traffic gross million tonnes (GMT). Tasks exceeding threshold 90.0 trigger statutory safety overrides.

### 4.5 How does the user interact with it?
Supervisors filter tasks by their specific department, sort by impending statutory deadlines, search for specific track kilometers, and click tasks to view required machinery and crew logistics.

### 4.6 What happens after interaction?
Standardized, urgency-ranked work order ledger ready for batch injection into the CP-SAT optimization engine.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Feeds directly into Section 3 (Weekly Block Planner) for timeline scheduling, Section 6 (Coordination Centre) for shadow bundling, and Section 11 (Asset Health) for USFD history.

### 4.9 Practical example
A Permanent Way Inspector logs an ultrasonic flaw detected at KM 142/8. The task enters Asset Backlog, is flagged as ENG with Criticality 96.7, and is immediately color-coded in red with a statutory 48-hour completion deadline.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Asset Backlog breaks departmental silos by aggregating engineering, traction, and signaling work orders into one place. Every task is scored with our expected-loss formula so life-safety track repairs always take precedence."

### 4.11 Technical explanation (Architecture & Data Flow)
Implemented in frontend/src/components/TasksView.tsx. Consumes /api/tasks REST endpoint with client-side fuzzy search and server-side pagination. Backed by PostgreSQL task tables and SQLite WAL mirror.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S02-C01 | **Departmental Quick-Filter Toolbar** | 🟩 `ACTION` | Filter Button Group | Top Toolbar (x: 280-1000, y: 140-185) | Row of pill buttons for 'All Departments', 'TRD (Electrical)', 'ENG (Track)', 'S&T (Signals)', and 'MECH' with active state highlighting. | Allows sectional engineers to isolate work orders belonging strictly to their operational purview. | Click any department pill to filter the table; count badges update dynamically. | `frontend/src/components/TasksView.tsx` | `Client-side state filter over GET /api/tasks payload` | `activeDepartmentFilter: 'ALL' \| ...` | If no tasks match selected department, displays 'No pending work orders for this department'. | Tasks Data Table, Priority Distribution Cards | Enables Senior Section Engineers (SSE) to audit their department's backlog in seconds. | "These quick-filters allow track, overhead electric, and signaling supervisors to instantly filter their respective work orders." |
| S02-C02 | **Urgency & Risk Distribution Cards** | 🟪 `CARD` | Metric Summary Group | Top-Right Ribbon (x: 1020-1890, y: 140-185) | Four color-coded metric counters: Critical (Red), High (Amber), Medium (Blue), and Routine (Slate). | Displays current backlog risk profile and statutory deadline urgency breakdown. | Click on any risk bucket to filter table rows to that specific risk tier. | `frontend/src/components/TasksView.tsx` | `Computed from GET /api/tasks` | `urgencyCounts: { critical: 15, h...` | Critical counter pulses red if any statutory deadline has lapsed. | AIPriorityView (Section 9), CommandCenterView (Section 1) | Prevents safety-critical tasks from being buried under routine cosmetic maintenance. | "These summary cards categorize the backlog into 4 distinct risk tiers, highlighting the 15 non-negotiable safety tasks." |
| S02-C03 | **Backlog Search & Corridor Filter Input** | 🟧 `FORM` | Search Input Field | Search Bar (x: 280-700, y: 70-130) | Input field with magnifying glass icon, clear button, and placeholder 'Search by Task ID, Asset KM, or Description...'. | Enables rapid retrieval of specific maintenance jobs by physical kilometer or asset tag. | Type search keywords; press Escape or click 'X' to reset query. | `frontend/src/components/TasksView.tsx, Lucide-React Search` | `Client-side search filter over /api/tasks` | `searchQuery: string` | Sanitizes special regex characters to prevent input evaluation errors. | Tasks Data Table | Locates critical rail defect work orders in less than 1 second across 500+ items. | "With this search bar, a controller can type 'KM 142' and immediately find all pending track, signal, and wire work at that exact kilometer." |
| S02-C04 | **Unified Asset Maintenance Task Table** | 🟪 `CARD` | Interactive Data Table | Main Content Area (x: 280-1890, y: 200-950) | Dense, clean tabular display with columns for Task ID, Department Chip, Section, Duration, Priority Badge, and Action Menu. | Presents comprehensive work order details with full operational parameters. | Click row to view Task Detail Drawer; click column header to sort; click action icon to edit. | `frontend/src/components/TasksView.tsx, TaskDetailDrawer.tsx` | `GET /api/tasks, PATCH /api/tasks/:id` | `tasks: Task[], selectedTaskId: s...` | Row turns amber if task deadline is within 24 hours; red if overdue. | TaskDetailDrawer, CoordinationView (Section 6), GanttTab (Section 3) | Standardizes maintenance operations across disparate railway divisions into a single digital ledger. | "This table lists every pending task with its mathematical priority score, department code, required duration, and statutory deadline." |
| S02-C05 | **Task Action & Drawer Trigger** | 🟩 `ACTION` | Row Action Button | Table Action Column (x: 1750-1880, y: 240-900) | Blue action button with 'Inspect' text and chevron icon on each table row. | Opens detailed engineering specifications, failure curves, and isolation checklists for the selected task. | Click button on any task row to slide out the detail inspector. | `frontend/src/components/TaskDetailDrawer.tsx` | `GET /api/tasks/:id/telemetry` | `drawerOpen: boolean, activeTaskD...` | Loads fallback asset data if deep telemetry endpoint is temporarily unavailable. | TaskDetailDrawer, AssetHealthView (Section 11) | Ensures that controllers verify 25kV power shutoff requirements before dispatching track crews. | "Clicking inspect opens our detailed engineering drawer, displaying ultrasonic flaw depth, required tamping machinery, and electrical isolation checklists." |

---

## Section 03 — 3. Task Generator
**Operational Tier**: `OPERATIONS` | **Route**: `/?tab=task_generator` | **Source File**: [`frontend/src/components/TaskGeneratorView.tsx`](file:///frontend/src/components/TaskGeneratorView.tsx)  
**Core Purpose**: Interactive cross-departmental maintenance intake and instant CP-SAT corridor feasibility evaluation engine. Enables Civil, Electrical (TRD), and S&T engineers to define work packages, select assets, configure 8-stage isolation/safety procedures, and immediately obtain constraint-certified block windows.

![Annotated UI - 3. Task Generator](./annotated/03_task_generator_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/03_task_generator_annotated.png) | [Clean Production Screenshot](./clean/03_task_generator_clean.png) | [Presentation Poster](./infographics/03_task_generator_guide.png)*

### 4.1 What is this section?
The Task Generator is the primary operational portal for field engineers across Indian Railways departments (Engineering/P-Way, Traction/TRD, and Signal & Telecom/S&T) to submit new maintenance requirements and generate conflict-free possession blocks.

### 4.2 Why is it included?
Historically, maintenance requisitions were filed on fragmented paper slips or isolated division portals without spatial or timetable validation. The Task Generator unifies requirements intake, enforces safety isolation protocols, and executes immediate mathematical pre-validation against timetabled passenger trains.

### 4.3 Features
- Cross-Department Category Selector (Engineering, Traction, S&T) with department-tailored templates.
- Geospatial Asset Selector linking directly to track centerline chainage, section codes, and GIS coordinates.
- Comprehensive Maintenance Task Definition with preset engineering packages (Rail Replacement, Tamping, OHE Inspection, Point Machine Testing).
- 8-Stage Safety & Isolation Package Stepper (Site Preparation, Traffic Protection, 25kV OHE Isolation, Work Execution, Testing, Inspection, Restoration, Handover).
- Instant CP-SAT Feasibility Assessment Engine testing candidate possession windows against timetabled trains.

### 4.4 What does each feature do?
The user selects a department, chooses a physical track asset from canonical inventory, selects a work package template, and specifies isolation requirements. Upon clicking Generate Task, the frontend calls POST /api/tasks/generate. The backend calculates Weibull failure urgency, searches the timetable graph for minimum 10-minute headway windows, and returns certified block options.

### 4.5 How does the user interact with it?
1. Department Selection: Click Civil Engineering, TRD, or S&T card.
2. Asset Selection: Choose asset from searchable dropdown or click on the embedded Leaflet track map.
3. Task Parameters: Select template (e.g. Rail Replacement), target date, and requested duration (minutes).
4. Safety & Isolation: Check required isolations (25kV Traction Power, Signalling Lockout) and select crew resources.
5. Dispatch: Click 'Generate Maintenance Task & Block Allocation'. Review certified block options and commit to the master schedule.

### 4.6 What happens after interaction?
Generates a canonical task record (TASK-DH-xxxxxx), assigns an expected-loss priority score, returns certified block windows with zero train overlap, and displays a radar chart of section disruption impact.

### 4.7 What information does it handle?
- **Displays**: Asset attributes (type, section, age, condition score), candidate block slots, timetable train traffic density, isolation checklists.
- **Collects**: Department code, asset ID, task type, work description, target date, duration in minutes, urgency flag, isolation flags, allocated machine/crew resources.
- **Processes**: Logistic urgency transformation, CP-SAT time-window feasibility validation, 10-minute statutory headway clearance calculation.
- **Generates / Returns**: Task ID, certified candidate block timeslots, conflict radar telemetry, schedule commitment confirmation.

### 4.8 Connection with other sections
Tasks created here immediately populate Section 02 (Asset Backlog), Section 04 (Weekly Block Planner), Section 06 (Coordination Centre) for shadow-block pairing, and Section 15 (Human Review & Audit).

### 4.9 Practical example
A P-Way Section Engineer identifies track gauge widening near km 142 on Section SEC-DH-01. They open Task Generator, select Engineering -> Rail Replacement on Asset AST-DH-003582, set 180 min duration, require 25kV OHE isolation, and click Generate. The system finds a 02:15-05:15 nighttime window between freight trains with zero passenger delay.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "The Task Generator solves the root cause of railway coordination failure: fragmented work orders. By integrating department-specific safety templates with live timetable intelligence, field engineers receive mathematically certified possession windows in under 2 seconds instead of days of manual correspondence."

### 4.11 Technical explanation (Architecture & Data Flow)
Implemented in frontend/src/components/TaskGeneratorView.tsx using React state hooks for multi-step form wizard, React-Leaflet for asset coordinate pin drops, and Axios communicating with POST /api/tasks/generate. Validates required crew skills, machine availability, and 25kV traction power interlock rules before API dispatch.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S03-C01 | **Cross-Department Selection Cards** | 🟧 `FORM` | Interactive Department Cards | Top Left Wizard Step 1 (x: 300-850, y: 340-480) | Three interactive cards with department icons: Civil Engineering (TMS), Signal & Telecom (SMMS), and TRD Traction (TDMS) with saffron active border. | Filters available task templates, machinery options, and safety protocols to the operating department. | Click on Civil Engineering, S&T, or TRD card to switch wizard context. | `frontend/src/components/TaskGeneratorView.tsx, Lucide-React Radio, Wrench, Zap` | `GET /api/departments/templates` | `selectedDept ('Engineering' \| 'T...` | Defaults to Engineering; updates templates without clearing already entered notes. | Asset selector, Quick templates, Resource options | Maintains strict departmental accountability while enforcing unified multi-department data schemas. | "First, the field engineer selects their department, immediately customizing the wizard for track, overhead electric, or signaling workflows." |
| S03-C02 | **Asset Selector & Geospatial Topology Context** | 🟧 `FORM` | Searchable Select & GIS Mini-Map | Top Right Wizard Step 2 (x: 870-1880, y: 220-480) | Searchable dropdown with asset ID autocomplete, displaying asset class, operational section, chainage kilometer, and Leaflet location preview. | Binds the maintenance work order to an exact physical asset and operational corridor section. | Type asset ID or name; click asset to select; mini-map pans to asset coordinates. | `React-Leaflet MapContainer, TileLayer, CircleMarker, Lucide MapPin` | `GET /api/assets?department=:dept` | `selectedAsset (AssetItem \| null)...` | Disables generate button if asset does not belong to valid corridor section. | TasksView, AssetHealthView, Leaflet GIS Map | Eliminates work on incorrect track locations by enforcing 100% geospatial alignment with railway track charts. | "Second, selecting an asset automatically locks the exact track section and chainage kilometer, pinpointing the work location on the GIS map." |
| S03-C03 | **Maintenance Task Definition & Quick Templates** | 🟧 `FORM` | Template Buttons & Form Inputs | Bottom Left Wizard Step 3 (x: 300-850, y: 500-950) | Pill buttons for rapid task selection (Rail Replacement, Tamping, Track Repair) plus inputs for target date, duration (min), and urgency toggle. | Captures operational parameters of the requested maintenance block. | Click template pills for 1-click auto-fill, adjust duration slider, pick completion target date. | `Tailwind form inputs, Lucide Clock, Calendar, Sliders` | `POST /api/tasks/generate` | `taskType, durationMinutes, targe...` | Requires duration > 15 min and <= 480 min; target date must be within planning horizon. | AIPriorityView, WeeklyMonthlyView | Standardizes maintenance durations based on RDSO maintenance manual benchmarks. | "Third, one-click templates allow field teams to specify complex maintenance tasks in seconds, including duration and target completion dates." |
| S03-C04 | **8-Stage Action, Isolation & Safety Stepper** | 🟪 `CARD` | Interactive Process Stepper & Checklists | Bottom Right Wizard Step 4 (x: 870-1880, y: 500-850) | Numbered circular badges showing 8 workflow stages: Site Prep, Traffic Protection, Isolation, Work, Testing, Inspection, Restoration, Handover, with 25kV OHE isolation toggle. | Ensures comprehensive safety compliance and procedural rigor prior to block grant. | Click stages to inspect details, check required isolations, add crew/machine allocations. | `Lucide ShieldAlert, CheckCircle2, Zap, Layers` | `POST /api/tasks/generate` | `actionStages, isolationRequired,...` | If Traction department or OHE work selected, 25kV isolation is locked to REQUIRED. | ApprovalAuditView, VerificationSuite | Guarantees zero electrocution risk and strict compliance with General Rules (GR 4.08) for railway line protection. | "Fourth, our 8-stage safety package embeds railway protection rules directly into the workflow, locking 25kV OHE isolation whenever overhead work is required." |
| S03-C05 | **CP-SAT Block Window Certification & Dispatch Button** | 🟩 `ACTION` | Primary Submission Button & Feasibility Badge | Bottom Action Bar (x: 870-1880, y: 870-950) | Vibrant emerald green primary CTA with sparkle icon: 'Generate Maintenance Task & Block Allocation', accompanied by certified status badge. | Submits maintenance requirement, triggers instant CP-SAT optimization, and returns collision-free block candidates. | Click button to trigger optimization. Spinner displays during solver execution (< 2.0s). | `Lucide Sparkles, Send, Axios POST call to /api/tasks/generate` | `POST /api/tasks/generate` | `isSubmitting, generatedTaskResul...` | Displays explanatory warning if no block window is available without train rescheduling. | CommandCenterView, GanttTab, CoordinationView | Compresses hours of manual block requisitioning into an instant, constraint-certified mathematical grant. | "Finally, clicking Generate evaluates live train timetables using Google OR-Tools CP-SAT, returning verified, collision-free possession windows in real time." |

---

## Section 04 — 4. Weekly Block Planner
**Operational Tier**: `OPERATIONS` | **Route**: `/?tab=weekly_planner` | **Source File**: [`frontend/src/components/GanttTab.tsx`](file:///frontend/src/components/GanttTab.tsx)  
**Core Purpose**: Interactive Gantt timeline displaying Google OR-Tools CP-SAT optimized 7-day maintenance block allocations across all 6 corridor sections, guaranteed to be conflict-free against 1,819 timetable trains.

![Annotated UI - 4. Weekly Block Planner](./annotated/04_weekly_planner_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/04_weekly_planner_annotated.png) | [Clean Production Screenshot](./clean/04_weekly_planner_clean.png) | [Presentation Poster](./infographics/04_weekly_planner_guide.png)*

### 4.1 What is this section?
The Weekly Block Planner is the tactical scheduling canvas of ABPS v4.0. It renders a 7-day, 24-hour visual Gantt timeline of certified maintenance blocks allocated across Delhi Division's 6 corridor sections.

### 4.2 Why is it included?
Manual scheduling of line blocks across saturated double-track lines frequently leads to canceled blocks, emergency train stoppages, or unsafe overlapping possessions. The Weekly Block Planner delivers mathematically certified, conflict-free block windows.

### 4.3 Features
- 6 Corridor Section Swimlanes (NDLS-GZB, GZB-ALJN, ALJN-TDL, TDL-ETW, ETW-CNB, CNB-PRYJ).
- Interactive time grid spanning 00:00 to 24:00 across 7 calendar days with 1-hour graduation lines.
- Color-coded block bars indicating department (TRD=Blue, ENG=Green, S&T=Amber, Integrated=Purple).
- CP-SAT Optimization Trigger Button with live solving telemetry and singleflight mutex lock status.
- Assigned Corridor Possessions Table listing approved start/end times, durations, and allocated track lines.

### 4.4 What does each feature do?
The backend Python optimizer runs Google OR-Tools CP-SAT. It models block allocations as non-overlapping interval variables subject to no-overlap constraints with train paths, statutory 10-minute headway buffers, machine availability, and daylight restrictions. The solved schedule is rendered via HTML5 canvas/SVG.

### 4.5 How does the user interact with it?
Controllers navigate calendar days using date selectors, hover over block bars to inspect allocated tasks and headway buffers, click blocks to open conflict inspectors, and click 'Run CP-SAT Optimizer' to re-solve after schedule disruptions.

### 4.6 What happens after interaction?
Certified 7-day corridor possession roster ready for divisional sign-off and live TMS dispatch.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Directly linked to Section 6 (Coordination Centre) for shadow blocks, Section 8 (Train Conflicts) for headway auditing, and Section 17 (Human Review & Audit) for formal L4 sign-off.

### 4.9 Practical example
During weekend planning, the optimizer detects a 180-minute maintenance window between Kanpur and Prayagraj at 02:30 AM. It allocates a combined OHE wire replacement and track tamping possession, automatically keeping the UP line clear for Prayagraj Express.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "The Weekly Block Planner is powered by Google OR-Tools CP-SAT. It converts complex railway constraints into mathematical equations, delivering 72 certified, conflict-free maintenance windows across 7 days with zero headway violations."

### 4.11 Technical explanation (Architecture & Data Flow)
Built with React 18 in frontend/src/components/GanttTab.tsx. Uses virtualized scrolling for smooth 60fps rendering across 168 hours of timeline data. Backed by engine/optimizer.py and Go Fiber orchestration proxy.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S04-C01 | **Planner Date Navigator & Horizon Toolbar** | 🟦 `NAV` | Date Navigator Bar | Timeline Header (x: 280-1890, y: 70-130) | Navigation bar with previous/next day buttons, active date range indicator ('21 Sep - 27 Sep 2026'), and today reset button. | Controls the temporal window displayed on the Gantt timeline. | Click left/right arrow buttons to shift days; click date picker to jump to specific date. | `frontend/src/components/GanttTab.tsx, date-fns` | `GET /api/schedule?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` | `currentStartDate: Date, calendar...` | Prevents navigation beyond allowable 60-day timetable projection window. | Gantt Timeline Canvas, Possessions Table | Allows advance planning of weekly track possessions aligned with zonal railway circulars. | "This date navigator allows controllers to scroll seamlessly through 7 days of scheduled blocks or jump directly to weekend possession windows." |
| S04-C02 | **CP-SAT Optimization Execution Button** | 🟩 `ACTION` | Primary Action Button | Top Action Controls (x: 1620-1880, y: 75-125) | Vibrant emerald green button with lightning bolt icon, labelled 'RE-RUN CP-SAT OPTIMIZER'. | Triggers the Google OR-Tools CP-SAT constraint solver to compute an optimal, conflict-free block plan. | Click button to trigger optimization; spinner appears with elapsed solve time (typically 1.2s - 2.8s). | `frontend/src/components/GanttTab.tsx, backend/main.go, engine/optimizer.py` | `POST /api/schedule/generate` | `isOptimizing: boolean, solverTel...` | Gated by 60s Singleflight Mutex to prevent multiple controllers from triggering concurrent solver thrashing. | AlertsView (Section 18), CommandCenterView (Section 1) | Replaces 4 hours of error-prone manual conflict checking with a 2-second mathematically optimal schedule. | "Clicking this button invokes Google OR-Tools CP-SAT, solving 15,000 constraint equations in under 2 seconds to generate a conflict-free plan." |
| S04-C03 | **6 Corridor Sections Gantt Swimlanes** | 🟦 `CHART` | Interactive Timeline Swimlanes | Timeline Body (x: 280-1890, y: 140-680) | Six horizontal rows representing Delhi Division sections, mapped against a 24-hour time ruler with colored block bars. | Displays spatial and temporal allocation of maintenance blocks across all corridor sections simultaneously. | Hover to view tooltip with block ID, duration, and headway clearance; click to open block inspector drawer. | `frontend/src/components/GanttTab.tsx, SVG rendering engine` | `GET /api/schedule` | `blocks: Block[], hoveredBlockId:...` | Highlights block in red if emergency train schedule change causes headway buffer violation (<10m). | TrainConflictsView (Section 8), TaskDetailDrawer | Eliminates spatial overlap errors, preventing multiple track machines from entering the same block section. | "These 6 corridor swimlanes map out all maintenance blocks across the Delhi-Howrah route, color-coded by department so controllers immediately see track occupancy." |
| S04-C04 | **Assigned Corridor Possessions Table** | 🟪 `CARD` | Structured Data Table | Lower Section (x: 280-1890, y: 700-950) | White card containing tabular list of certified blocks with Block ID, Corridor, Line (UP/DOWN), Time Window, and Status. | Provides an auditable tabular breakdown of all scheduled blocks shown on the Gantt chart. | Click on any row to highlight the corresponding bar on the Gantt timeline above. | `frontend/src/components/GanttTab.tsx` | `GET /api/schedule` | `filteredBlocks: Block[], selecte...` | Flags unapproved or pending blocks with amber badge. | ApprovalAuditView (Section 17), TasksView (Section 2) | Generates verified, tamper-evident block possession notices required under Indian Railways General Rules (GR). | "Below the timeline, this table provides the official possession roster, showing exact line allocations, start/end times, and certified safety clearances." |
| S04-C05 | **Statutory Headway Clearance Indicator** | 🟥 `ALERT` | Compliance Status Chip | Gantt Timeline Header (x: 1300-1600, y: 75-125) | Green pill chip showing '10m Statutory Headway: 100% Compliant' with checkmark shield icon. | Verifies that every scheduled block maintains the mandatory 10-minute buffer before and after train movements. | Hover to view worst-case buffer margin across all 72 blocks (e.g., minimum margin: +14 minutes). | `frontend/src/components/GanttTab.tsx, engine/safety_gate.py` | `GET /api/verification/headway-status` | `headwayCompliance: { compliant: ...` | Immediately alerts if high-speed express schedule update infringes on planned possession window. | AlertsView (Section 18), TrainConflictsView (Section 8) | Directly enforces Indian Railways General & Subsidiary Rules (G&SR) for safe block working. | "This compliance badge proves that all 72 blocks strictly adhere to the mandatory 10-minute headway clearance from high-speed trains." |

---

## Section 05 — 5. Monthly Forecast
**Operational Tier**: `OPERATIONS` | **Route**: `/?tab=monthly_forecast` | **Source File**: [`frontend/src/components/WeeklyMonthlyView.tsx`](file:///frontend/src/components/WeeklyMonthlyView.tsx)  
**Core Purpose**: Strategic 30-day corridor planning dashboard providing long-term capacity forecasts, seasonal maintenance demand trends, and multi-horizon day cards for major engineering work.

![Annotated UI - 5. Monthly Forecast](./annotated/05_monthly_forecast_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/05_monthly_forecast_annotated.png) | [Clean Production Screenshot](./clean/05_monthly_forecast_clean.png) | [Presentation Poster](./infographics/05_monthly_forecast_guide.png)*

### 4.1 What is this section?
The Monthly Forecast section is the strategic capacity planning dashboard of ABPS v4.0. It projects maintenance requirements and track possession opportunities across a 30-day planning horizon.

### 4.2 Why is it included?
Major infrastructure works (such as deep track screening, bridge girder rebuilding, or OHE rewiring) require weeks of advance notice to coordinate loco diversions and freight re-routing. This section enables long-range strategic coordination.

### 4.3 Features
- 7-Day and 30-Day Multi-Horizon Day Cards displaying daily maintenance quotas and capacity availability.
- Corridor Capacity Projection Chart showing peak traffic vs available maintenance windows over 4 weeks.
- Preventive vs Emergency Possession Distribution metrics.
- Seasonal Weather Impact Factors (monsoon flooding, summer rail buckling risks).
- Export facility for Headquarters Zonal Operating Committee review.

### 4.4 What does each feature do?
Aggregates asset degradation forecasts from Weibull survival models over 30 days. Projects train timetable traffic patterns, identifies recurring low-density windows (e.g. Tuesday early mornings), and recommends optimal days for heavy machine deployment.

### 4.5 How does the user interact with it?
Planners inspect upcoming weeks, compare workload distributions across the 6 corridor sections, click individual day cards to view proposed possessions, and adjust long-range block quotas.

### 4.6 What happens after interaction?
30-day strategic corridor maintenance outlook, machine mobilization schedules, and preliminary passenger train regulation advisories.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Feeds into Section 3 (Weekly Block Planner) as tactical dates approach, and receives long-term defect trends from Section 11 (Asset Health).

### 4.9 Practical example
A Senior Divisional Engineer plans a 4-hour track renewal near Aligarh. Looking at the 30-day forecast, the system highlights Day 18 (low freight density window) as having 42% lower passenger traffic disruption than Day 12.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "While the Weekly Planner handles tactical execution, the Monthly Forecast provides 30-day strategic foresight. It allows headquarters to plan heavy track renewal and bridge works weeks in advance without causing unannounced train cancellations."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/WeeklyMonthlyView.tsx. Uses Recharts for capacity trend graphs. Consumes Go Fiber /api/forecast/monthly endpoint backed by predictive degradation pipelines.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S05-C01 | **Horizon Duration Toggle** | 🟦 `NAV` | Pill Switcher | Top Control Bar (x: 280-600, y: 70-130) | Rounded toggle pill with '7 Days' and '30 Days' options with white active card highlight. | Switches the view between intermediate weekly outlook and full 30-day strategic forecasting. | Click '30 Days' to expand the planning horizon to a full monthly cycle. | `frontend/src/components/WeeklyMonthlyView.tsx` | `GET /api/forecast?horizon=30d` | `forecastHorizon: '7d' \| '30d'` | Smoothly transitions chart axes without screen flicker. | Multi-Horizon Day Cards, Capacity Curve Chart | Enables rolling 30-day capital works budgeting for track machine fuel and crew staging. | "This horizon switcher toggles between tactical 7-day schedules and strategic 30-day long-range corridor projections." |
| S05-C02 | **Corridor Capacity & Traffic Projection Chart** | 🟦 `CHART` | Multi-Series Area Chart | Upper Canvas Area (x: 280-1890, y: 140-360) | Area chart displaying available track capacity (blue) versus scheduled train paths (grey) across 30 days. | Identifies recurring low-density traffic troughs ideal for scheduling heavy engineering possessions. | Hover over curve to see exact train count and available block minutes for that day. | `Recharts AreaChart, frontend/src/components/WeeklyMonthlyView.tsx` | `GET /api/forecast/capacity` | `capacityData: DayCapacity[]` | Marks gazetted holidays and festival rush periods (Diwali, Chhath) with red exclusion bands. | ScenarioExplorerView (Section 15) | Prevents disruptive maintenance from being scheduled during peak festival travel seasons. | "This chart plots 30 days of train density against available maintenance capacity, highlighting optimal low-traffic days for major track works." |
| S05-C03 | **Multi-Horizon Day Cards Grid** | 🟪 `CARD` | Interactive Card Grid | Mid Canvas Area (x: 280-1890, y: 380-680) | Grid of calendar day cards displaying date, day of week, scheduled block count, and capacity utilization bar. | Provides day-by-day operational summary of planned maintenance possessions across the horizon. | Click any day card to drill into the specific block schedule for that date. | `frontend/src/components/WeeklyMonthlyView.tsx` | `GET /api/forecast/days` | `selectedForecastDay: string \| nu...` | Shows warning icon on days where maintenance requests exceed maximum allowable line occupancy (15%). | GanttTab (Section 3), TasksView (Section 2) | Ensures uniform utilization of heavy track tamping machines (CSM, BCM) across the month. | "These day cards break down the 30-day forecast day-by-day, color-coding each day by maintenance density to prevent workload clustering." |
| S05-C04 | **Preventive vs Emergency Workload Breakdown** | 🟦 `CHART` | Comparative Donut & Bar Chart | Lower Canvas Area (x: 280-1890, y: 700-950) | Split panel showing ratio of planned preventive maintenance (88%) versus emergency breakdown responses (12%). | Tracks organizational shift from reactive firefighting to predictive, planned asset management. | Toggle between department views to see which discipline has the highest emergency ratio. | `frontend/src/components/WeeklyMonthlyView.tsx` | `GET /api/forecast/breakdown` | `workloadRatio: { preventive: 88....` | Highlights emergency spikes following extreme weather events. | FailureIntelligenceView (Section 10) | Demonstrates measurable transition towards 90%+ planned maintenance, drastically reducing unexpected rail fractures. | "Here we track our preventive vs emergency workload: ABPS achieves an 88% planned maintenance ratio, drastically reducing reactive emergency line closures." |

---

## Section 06 — 6. Coordination Centre
**Operational Tier**: `COORDINATION` | **Route**: `/?tab=coordination` | **Source File**: [`frontend/src/components/CoordinationView.tsx`](file:///frontend/src/components/CoordinationView.tsx)  
**Core Purpose**: Multi-departmental synergy engine identifying spatial and temporal 'shadow block' opportunities, bundling Track, OHE, and Signaling tasks into unified possessions while enforcing an 8-point deterministic safety compatibility matrix.

![Annotated UI - 6. Coordination Centre](./annotated/06_coordination_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/06_coordination_annotated.png) | [Clean Production Screenshot](./clean/06_coordination_clean.png) | [Presentation Poster](./infographics/06_coordination_guide.png)*

### 4.1 What is this section?
The Coordination Centre is the cross-departmental synergy hub of ABPS v4.0. It clusters maintenance tasks from different railway engineering wings into single, coordinated track possessions (known as 'shadow blocks').

### 4.2 Why is it included?
In Indian Railways, Engineering, Electrical (TRD), and Signaling (S&T) traditionally demand separate block possessions on the same track segment, closing the line multiple times. Bundling them into one possession eliminates redundant track closures.

### 4.3 Features
- Hero Coordination Candidate Card highlighting high-synergy multi-departmental bundling opportunities.
- Deterministic 8-Point Compatibility Matrix auditing spatial, electrical, and crew safety rules.
- Canonical Synergy Principles breakdown (Power Isolation Synergy, Spatial Overlap, Joint Inspection).
- Approved vs Prohibited Task Pairing Ledger (5,778 Approved / 9,222 Blocked pairs).
- One-Click 'Optimize This Group' trigger to generate consolidated block requisition.

### 4.4 What does each feature do?
The engine pairs tasks within spatial proximity (<500 meters) and evaluates an 8-point statutory compatibility matrix. If tasks are compatible (e.g. OHE inspection and rail welding), synergy score increases. If prohibited (e.g. ballast dust near optical signal testing), pairing is strictly rejected with deterministic reason codes.

### 4.5 How does the user interact with it?
Departmental engineers inspect suggested bundled opportunities, review the 8 compatibility checks, verify safety distance buffers, and click 'Optimize This Group' to convert separate work orders into one unified possession.

### 4.6 What happens after interaction?
Coordinated possession packages delivering up to 63.1% reduction in total track closure time.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Feeds integrated blocks into Section 7 (Integrated / Shadow Blocks) for ROI calculation and Section 3 (Weekly Block Planner) for timeline scheduling.

### 4.9 Practical example
At Ghaziabad Yard, TRD requests 2 hours for OHE isolator maintenance, while P-Way requests 2 hours for point machine packing. The Coordination Centre bundles both into a single 2-hour block, saving 120 minutes of line closure.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "The Coordination Centre breaks the greatest efficiency barrier in Indian Railways: departmental silos. By bundling track, electrical, and signal work into shared shadow blocks, we achieve a 63.1% reduction in line possession requests without compromising safety."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/CoordinationView.tsx. Powered by engine/coordination_engine.py and engine/compatibility_engine.py. Evaluates 15,000 combinatorial task pairs using vector math and rule trees.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S06-C01 | **Hero Coordination Candidate Card** | 🟩 `ACTION` | Featured Action Card | Top Featured Area (x: 280-1890, y: 70-240) | Prominent gradient card with 'HIGH-SYNERGY OPPORTUNITY' badge, displaying 3 bundled tasks, combined duration, and savings metric (+120 min saved). | Spotlights the single highest-impact multi-departmental bundling opportunity ready for controller approval. | Click 'OPTIMIZE THIS GROUP' to bind all 3 tasks into one unified block window. | `frontend/src/components/CoordinationView.tsx, engine/coordination_engine.py` | `POST /api/coordination/bundle` | `heroCandidate: CoordinationClust...` | Ensures all 3 department supervisors have acknowledged readiness before activating the button. | BeforeAfterView (Section 7), GanttTab (Section 3) | Saves 2 complete corridor line closures in a single click. | "Our AI spotlights this high-impact opportunity: bundling rail welding, track circuit testing, and OHE maintenance saves 2 complete line closures." |
| S06-C02 | **Deterministic 8-Point Compatibility Matrix** | 🟥 `ALERT` | Analytical Compatibility Gauge & Rule Summary | Mid-Left Area (x: 280-1080, y: 260-620) | Card displaying 5,778 Approved pairs (38.5% Index) and 9,222 Blocked pairs with breakdown of safety prohibition rules. | Ensures physical safety by enforcing deterministic prohibitions (e.g. ballast dust prohibited near optical signals). | Hover over rule breakdown to inspect statutory safety rule references. | `frontend/src/components/CoordinationView.tsx, engine/compatibility_engine.py` | `GET /api/coordination/compatibility-rules` | `compatibilityStats: { approved: ...` | Strict fail-safe: any ambiguous or unclassified combination is rejected by default. | AlertsView (Section 18), TasksView (Section 2) | Prevents catastrophic safety hazards such as tamping ballast dust blinding active signal lenses. | "Our 8-point deterministic safety matrix validates 15,000 potential task combinations, strictly prohibiting hazardous overlaps like ballast cleaning near optical sensors." |
| S06-C03 | **Canonical Synergy Principles Breakdown** | 🟪 `CARD` | Synergy Metric Cards | Mid-Right Area (x: 1100-1890, y: 260-620) | Card detailing 4 foundational coordination principles: Spatial Proximity, Power De-energization, Equipment Sharing, and Joint Inspection. | Explains the underlying operational justification for bundling recommendations. | Click each principle card to view historical savings metrics and case studies. | `frontend/src/components/CoordinationView.tsx` | `GET /api/coordination/principles` | `synergyPrinciples: PrincipleDeta...` | Updates dynamically based on seasonal traction power tariffs. | BeforeAfterView (Section 7) | Reduces diesel traction switching moves by 40% through synchronized machine deployment. | "These 4 synergy principles quantify our savings: shared 25kV power shutoffs, co-located crew staging, and joint track inspection." |
| S06-C04 | **Pairwise Coordination Audit Roster** | 🟦 `CHART` | Audit Data Table | Bottom Area (x: 280-1890, y: 640-950) | Table listing Task A, Task B, Proximity Distance, Joint Priority Score, and Approval Status. | Provides transparency and auditability for every bundled possession recommendation. | Inspect individual candidate pairs and verify proximity metrics. | `frontend/src/components/CoordinationView.tsx` | `GET /api/coordination/pairs` | `candidatePairs: CandidatePair[]` | Displays explicit prohibition reason code if a pair is rejected (e.g., ERR_PROHIBITED_BALLAST_DUST). | ApprovalAuditView (Section 17) | Gives sectional engineers complete confidence that bundled blocks satisfy all safety bylaws. | "This audit roster allows engineering supervisors to verify the exact spatial proximity and power shutoff synergy for every proposed shadow block." |

---

## Section 07 — 7. Integrated / Shadow Blocks
**Operational Tier**: `COORDINATION` | **Route**: `/?tab=shadow_blocks` | **Source File**: [`frontend/src/components/BeforeAfterView.tsx`](file:///frontend/src/components/BeforeAfterView.tsx)  
**Core Purpose**: Comparative ROI and efficiency dashboard showcasing unbundled baseline operations versus ABPS-integrated shadow blocks, quantifying track availability gains, freight throughput increases, and passenger delay reductions.

![Annotated UI - 7. Integrated / Shadow Blocks](./annotated/07_shadow_blocks_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/07_shadow_blocks_annotated.png) | [Clean Production Screenshot](./clean/07_shadow_blocks_clean.png) | [Presentation Poster](./infographics/07_shadow_blocks_guide.png)*

### 4.1 What is this section?
Integrated / Shadow Blocks (Before vs After) is the quantitative business intelligence and ROI dashboard of ABPS v4.0. It compares traditional uncoordinated railway operations against ABPS-optimized shadow block scheduling.

### 4.2 Why is it included?
Railway senior executives require rigorous mathematical proof that AI optimization delivers tangible improvements in punctuality, line capacity, and financial return. This screen visualizes those gains side-by-side.

### 4.3 Features
- 4-Tile Comparative KPI Ribbon (Possessions Reduced, Track Availability Gain, Punctuality Preserved, Cost Saved).
- Side-by-side Gantt comparison showing Unbundled Baseline (scattered blocks) vs ABPS Integrated (consolidated blocks).
- Corridor Availability Improvement gauge showing +0.67% net throughput gain across 1,447 km.
- Departmental Possession Compression Ledger detailing hours saved per engineering discipline.
- Exportable ROI Executive Dossier for Railway Board and Ministry presentations.

### 4.4 What does each feature do?
The engine computes two schedules for identical task backlogs: a baseline schedule mimicking manual isolated scheduling, and the ABPS integrated schedule. It calculates the delta in line occupancy minutes, traction energy consumed, and train delay minutes.

### 4.5 How does the user interact with it?
Controllers toggle between Before and After views to observe how scattered 2-hour blocks are compressed into synchronized 3-hour windows, inspect cost savings per section, and export validation reports.

### 4.6 What happens after interaction?
Empirical validation report showing a 63.1% consolidation index, +0.67% corridor availability increase, and zero train collisions.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Derives data from Section 6 (Coordination Centre) and feeds validated metrics to Section 1 (Dashboard) and Section 18 (Verification Suite).

### 4.9 Practical example
In traditional scheduling, Delhi-Ghaziabad was blocked 5 separate times in one week (totaling 11 hours). Under ABPS, those same tasks were executed in 2 integrated windows totaling 5 hours, returning 6 full hours of track capacity to freight trains.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "This Before-and-After view provides concrete proof of our impact: we compress 11 hours of scattered departmental block requests into 5 synchronized hours. That delivers a 63.1% consolidation index and returns 6 hours of line capacity to revenue trains."

### 4.11 Technical explanation (Architecture & Data Flow)
Implemented in frontend/src/components/BeforeAfterView.tsx. Calculates comparative metrics via engine/kpi_engine.py using standardized Indian Railways operational cost formulas.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S07-C01 | **Optimization ROI & Impact Ribbon** | 🟪 `CARD` | Metric Comparison Ribbon | Top View Header (x: 280-1890, y: 70-170) | Four white cards with emerald trend arrows showing 63.1% Consolidation, +0.67% Availability Gain, 0 Headway Violations, and Rs 4.2M Estimated Savings. | Summarizes macro-level operational improvements achieved through CP-SAT optimization. | Hover to view metric derivation formulas and baseline comparison numbers. | `frontend/src/components/BeforeAfterView.tsx` | `GET /api/impact/summary` | `roiMetrics: { consolidationPct: ...` | Guarantees all KPI formulas are non-negative, validated by engine test suite [8.1]. | CommandCenterView (Section 1), AlertsView (Section 18) | Directly justifies the deployment of ABPS across all 68 divisions of Indian Railways. | "This ROI ribbon highlights our core results: 63.1% block consolidation, a 0.67% gain in mainline availability, and zero train collisions." |
| S07-C02 | **Baseline vs Integrated Comparative Gantt** | 🟦 `CHART` | Split-Screen Comparative Timeline | Upper Canvas Area (x: 280-1890, y: 190-560) | Two parallel timelines: top timeline shows fragmented baseline blocks in red/orange; bottom timeline shows consolidated ABPS blocks in purple/emerald. | Provides unmistakable visual evidence of how block compression frees up open track capacity. | Hover over paired blocks to see which original tasks were merged into the integrated window. | `frontend/src/components/BeforeAfterView.tsx, SVG engine` | `GET /api/impact/gantt-comparison` | `activeComparisonView: 'SIDE_BY_S...` | Synchronizes time scrubber across both timelines for accurate horizontal comparison. | GanttTab (Section 3), CoordinationView (Section 6) | Demonstrates why multi-departmental coordination is critical to resolving corridor saturation. | "Comparing the two timelines side-by-side: top shows fragmented manual planning blocking the line 5 times; bottom shows ABPS compressing them into 2 clean windows." |
| S07-C03 | **Corridor Availability Gain Analysis** | 🟦 `CHART` | Statistical Distribution Gauge | Lower-Left Area (x: 280-1080, y: 580-950) | Gauge card showing +0.67% network availability gain with sectional breakdown bars across all 6 corridor sections. | Proves that availability improvements are distributed equitably across the entire division. | Click on any section bar to view its specific recovered freight train path slots. | `frontend/src/components/BeforeAfterView.tsx` | `GET /api/impact/corridor-gains` | `sectionalGains: SectionGain[]` | Accounts for bidirectional single-line working capacity limits. | CommandCenterView (Section 1) | A 0.67% availability gain across Delhi-Howrah unlocks capacity for 14 additional freight trains daily. | "A 0.67% availability gain might sound modest, but on Delhi-Howrah it unlocks enough track capacity to run 14 additional freight trains every single day." |
| S07-C04 | **Departmental Possession Compression Ledger** | 🟪 `CARD` | Structured Data Card | Lower-Right Area (x: 1100-1890, y: 580-950) | Table detailing Hours Requested vs Hours Granted vs Hours Saved for TRD, ENG, and S&T. | Demonstrates that every engineering department benefits equitably without losing necessary work hours. | Inspect individual department savings and export departmental compliance certificates. | `frontend/src/components/BeforeAfterView.tsx` | `GET /api/impact/department-compression` | `deptCompression: DepartmentSumma...` | Verifies that no department had its required maintenance time truncated below minimum engineering requirements. | TasksView (Section 2), ApprovalAuditView (Section 17) | Solves inter-departmental conflicts over line possession quotas. | "This ledger shows that all 3 departments received 100% of their requested maintenance hours, but through shadow scheduling we saved 38 hours of line closures." |

---

## Section 08 — 8. Train & Block Conflicts
**Operational Tier**: `COORDINATION` | **Route**: `/?tab=train_conflicts` | **Source File**: [`frontend/src/components/TrainConflictsView.tsx`](file:///frontend/src/components/TrainConflictsView.tsx)  
**Core Purpose**: Directional timetable collision-detection engine mapping 1,819 scheduled train movements against maintenance blocks across UP and DOWN mainlines, verifying statutory 10-minute headway clearance.

![Annotated UI - 8. Train & Block Conflicts](./annotated/08_train_conflicts_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/08_train_conflicts_annotated.png) | [Clean Production Screenshot](./clean/08_train_conflicts_clean.png) | [Presentation Poster](./infographics/08_train_conflicts_guide.png)*

### 4.1 What is this section?
Train & Block Conflicts is the collision auditing and timetable verification canvas of ABPS v4.0. It maps every timetabled passenger and freight train against planned track maintenance blocks on UP and DOWN tracks.

### 4.2 Why is it included?
The primary constraint in railway block planning is passenger train safety and punctuality. A block must never overlap with a train movement or violate statutory braking headways. This section proves collision-free operation.

### 4.3 Features
- Directional UP Line and DOWN Line Timeline Swimlanes.
- 1,819 Timetabled Train Movements mapped with train numbers (e.g. 12301 Rajdhani Express).
- Automated Conflict Radar scanning for spatial and temporal overlaps.
- Statutory 10-Minute Headway Buffer Compliance Inspector.
- Directional Line Filter Controls and zero-state conflict validation display.

### 4.4 What does each feature do?
Loads 1,819 train paths from the Master Train Timetable. Evaluates directional line assignments (UP Line vs DOWN Line). Runs an interval intersection algorithm: for every block [s_b, e_b] on track line l and train movement [s_t, e_t] on line l, it enforces min(|s_t - e_b|, |s_b - e_t|) >= 10 minutes. Detects 0 conflicts.

### 4.5 How does the user interact with it?
Controllers toggle between UP Line and DOWN Line views, hover over train paths to inspect speed profiles, click on scheduled block windows to audit adjacent trains, and run live conflict scans.

### 4.6 What happens after interaction?
Formally certified zero-conflict schedule with verified 10-minute headway buffers on all directional tracks.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Integrates directly with Section 3 (Weekly Block Planner) and feeds safety compliance tokens to Section 18 (Verification Suite).

### 4.9 Practical example
A controller schedules an OHE maintenance block on the UP Line between Ghaziabad and Aligarh from 07:00 to 09:00. The conflict engine checks all UP trains, notes that Rajdhani Express passes at 06:46 (+14m buffer) and Gomti Express at 09:12 (+12m buffer), certifying the block window as 100% compliant.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "This screen is our safety proof. It cross-examines all 72 maintenance blocks against 1,819 timetabled passenger trains across both UP and DOWN lines, proving with mathematical certainty that every single train maintains at least 10 minutes of buffer."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/TrainConflictsView.tsx. Uses high-performance HTML5 canvas rendering for displaying thousands of train intervals smoothly. Backed by engine/timetable_engine.py.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S08-C01 | **Directional Track Line Selector** | 🟧 `FORM` | Segmented Control | Top Controls Bar (x: 280-800, y: 70-130) | Segmented pill control with options: 'ALL LINES', 'UP LINE (Delhi -> Kanpur)', and 'DOWN LINE (Kanpur -> Delhi)'. | Filters timetable and conflict views by physical track direction. | Click 'UP LINE' to inspect Delhi-to-Howrah traffic; click 'DOWN LINE' to inspect reverse flow. | `frontend/src/components/TrainConflictsView.tsx` | `GET /api/conflicts?direction=UP` | `activeDirection: 'ALL' \| 'UP' \| ...` | Correctly handles bi-directional single-line working exceptions. | Directional Conflict Swimlanes, Headway Inspector | Prevents confusing trains on opposing tracks, reflecting real-world double-line dispatching. | "This directional selector allows controllers to audit the UP and DOWN mainlines independently, matching actual Indian Railways double-track operations." |
| S08-C02 | **1,819 Timetable Trains Telemetry Banner** | 🟪 `CARD` | Information Banner | Upper Banner (x: 820-1890, y: 70-130) | Dark slate banner displaying '1,819 TIMETABLE TRAINS MONITORED · ZERO ACTIVE CONFLICTS' with green status indicator. | Confirms the scale of train movements audited and current collision-free status. | Displays live system status; click to trigger re-scan. | `frontend/src/components/TrainConflictsView.tsx` | `GET /api/conflicts/summary` | `conflictSummary: { totalTrains: ...` | Turns bright red if even a single conflict is detected. | AlertsView (Section 18), CommandCenterView (Section 1) | Guarantees that train operations remain 100% safe and uncompromised by maintenance. | "This banner confirms that our system has checked all 1,819 scheduled train movements and certified that zero conflicts exist across the entire division." |
| S08-C03 | **Directional UP/DOWN Conflict Swimlanes** | 🟥 `ALERT` | Interactive Collision Radar Swimlanes | Mid Canvas Area (x: 280-1890, y: 140-720) | Dense interactive canvas showing train movement trajectories (slanted lines) and planned maintenance blocks (colored rectangles). | Visualizes the physical separation between moving passenger trains and stationary maintenance blocks. | Pan horizontally across time; click any train string to inspect train category and speed. | `frontend/src/components/TrainConflictsView.tsx, Canvas/SVG` | `GET /api/conflicts/trajectories` | `hoveredTrain: TrainPath \| null, ...` | Highlights in pulsing amber if buffer is between 10 and 12 minutes (legal but tight). | GanttTab (Section 3) | Directly replaces the manual paper charts used in divisional control offices. | "This string chart plots train trajectories against our maintenance blocks, making it visually obvious that every train passes safely outside block possession windows." |
| S08-C04 | **Statutory 10-Minute Headway Buffer Compliance Card** | 🟩 `ACTION` | Safety Certification Card | Bottom Area (x: 280-1890, y: 740-950) | Green-themed compliance certificate card displaying 'STATUTORY HEADWAY CLEARANCE: CERTIFIED PASS' with buffer margin metrics. | Provides formal mathematical certification that all blocks comply with Indian Railways headway standards. | Click 'Export Safety Dossier' to download PDF audit report. | `frontend/src/components/TrainConflictsView.tsx` | `GET /api/conflicts/certificate` | `headwayCertificate: CertificateD...` | Strict non-negotiable rule: if buffer < 10.0m, certificate is revoked instantly. | ApprovalAuditView (Section 17), AlertsView (Section 18) | Ensures full compliance with Indian Railways General & Subsidiary Rules (G&SR). | "This certificate verifies that our closest train-to-block margin is +14 minutes, exceeding the statutory 10-minute requirement and ensuring complete safety." |

---

## Section 09 — 9. AI Risk & Priority
**Operational Tier**: `INTELLIGENCE` | **Route**: `/?tab=ai_priority` | **Source File**: [`frontend/src/components/AIPriorityView.tsx`](file:///frontend/src/components/AIPriorityView.tsx)  
**Core Purpose**: Explainable AI machine learning dashboard presenting multi-model risk benchmarks, physics-informed Weibull hazard curves, and local SHAP feature attributions for every maintenance priority score.

![Annotated UI - 9. AI Risk & Priority](./annotated/09_ai_priority_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/09_ai_priority_annotated.png) | [Clean Production Screenshot](./clean/09_ai_priority_clean.png) | [Presentation Poster](./infographics/09_ai_priority_guide.png)*

### 4.1 What is this section?
AI Risk & Priority is the predictive intelligence and explainable AI (XAI) dashboard of ABPS v4.0. It reveals how machine learning models and physics degradation equations compute asset failure risk and maintenance urgency.

### 4.2 Why is it included?
Railway engineers cannot trust 'black box' AI models when passenger lives are at stake. This section makes every AI prediction fully transparent, explainable, and accountable using SHAP values and physical degradation laws.

### 4.3 Features
- XGBoost v2.4 Champion Model Telemetry Banner showing PR-AUC (0.3138) and Brier Score (0.0812).
- Asset Risk Breakdown & Physics-Informed Weibull Hazard Curves plotting failure probability over time.
- Deterministic Safety Override Policy Panel locking critical rail defects to Priority >= 90.0.
- Local SHAP Feature Attribution Chart explaining exact positive and negative factor weights.
- Model Governance links showing training dataset lineage across 15,000 operational records.

### 4.4 What does each feature do?
Combines a trained XGBoost classifier with classical Weibull survival equations: h(t) = (beta/eta)*(t/eta)^(beta-1). Computes expected-loss priority P_i = C_i * U_i * W. If an asset has ultrasonic rail crack or catenary sagging, a deterministic safety rule overrides statistical prediction to force Priority >= 92.5.

### 4.5 How does the user interact with it?
Controllers select any asset ID to view its customized Weibull wear-out curve, inspect which factors (tonnage, temperature, age) pushed its risk score up, and verify safety override rules.

### 4.6 What happens after interaction?
Transparent, auditable priority score (0-100) with full mathematical and feature-level justification.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Directly feeds priority values into Section 2 (Asset Backlog) and Section 3 (Weekly Block Planner) for solver objective function weighting.

### 4.9 Practical example
A track section at KM 142/8 has an AI risk score of 96.7. Opening the SHAP chart, the engineer sees Track Age (+0.104) and High Summer Temperature (+0.047) drove the score up, while recent tamping (-0.032) slightly reduced it, justifying an immediate block.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Our AI is not a black box. We combine an XGBoost champion model with physics-based Weibull degradation curves, and explain every decision using SHAP feature attributions. When rail safety is involved, deterministic rules override AI to guarantee protection."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/AIPriorityView.tsx. Machine learning pipeline implemented in engine/urgency_engine.py and engine/explainability.py. Reads model metadata from engine/ml_model_meta.json.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S09-C01 | **XGBoost Champion Model Telemetry Banner** | 🟪 `CARD` | Model Telemetry Banner | Top Dashboard Section (x: 280-1890, y: 70-140) | Dark banner showing active Champion model: 'XGBoost v2.4 Champion' with PR-AUC of 0.3138 and Brier Score of 0.0812. | Displays current production machine learning model version and offline validation metrics. | Click 'Model Governance' to inspect retraining manifests and training dataset splits. | `frontend/src/components/AIPriorityView.tsx, engine/ml_model_meta.json` | `GET /api/models/champion` | `championMeta: ModelMeta` | Displays warning badge if challenger model outperforms champion in shadow mode. | ModelVersionsView (Section 16) | Guarantees that only statistically validated models guide operational maintenance dispatch. | "Our AI intelligence engine runs an XGBoost v2.4 Champion model, trained on 15,000 real railway operational records with verified PR-AUC benchmarks." |
| S09-C02 | **Physics-Informed Weibull Hazard Curve** | 🟦 `CHART` | Data Visualization Chart | Left Content Column (x: 280-1080, y: 160-560) | Interactive curve plotting failure probability over operational cycles using physics-based Weibull distributions. | Predicts remaining useful life (RUL) and probability of breakdown before next scheduled cycle. | Select different assets to observe wear-out curves and accelerated aging factors. | `frontend/src/components/AIPriorityView.tsx, engine/urgency_engine.py` | `GET /api/analytics/weibull/:asset_id` | `weibullCurve: Point[]` | Bounds shape parameter beta >= 1.0 to prevent non-physical negative aging rates. | AssetHealthView (Section 11), TasksView (Section 2) | Enables predictive replacement of rails before fatigue fractures develop. | "We combine machine learning with classical Weibull physics modeling to compute an asset's exact probability of failure based on accumulated gross million tonnes." |
| S09-C03 | **Deterministic Safety Override Policy Panel** | 🟥 `ALERT` | Policy Configuration Display | Right Column (Upper, x: 1100-1890, y: 160-560) | Card detailing four-pillar scoring weights (Condition: 0.35, Urgency: 0.30, Throughput: 0.20, Synergy: 0.15) and Safety Override indicator. | Ensures deterministic safety: non-negotiable safety rules override statistical predictions. | Review active policy weights configured by Divisional Safety Officers. | `frontend/src/components/AIPriorityView.tsx, engine/priority_engine.py` | `GET /api/policy/weights` | `policyWeights: PolicyConfig` | Non-bypassable: safety overrides cannot be disabled by non-admin accounts. | TasksView (Section 2), AlertsView (Section 18) | Guarantees passenger safety by treating critical defects with absolute operational urgency. | "While AI optimizes efficiency, passenger safety is non-negotiable: our safety override rule forces critical track defects to the maximum priority immediately." |
| S09-C04 | **Local SHAP Feature Attribution Chart** | 🟦 `CHART` | Explainable AI Bar Chart | Bottom Area (x: 280-1890, y: 580-950) | Horizontal bar chart showing positive (red) and negative (blue) feature contributions pushing risk above baseline. | Provides complete explainability so controllers understand why an asset was assigned high priority. | Hover over bars to read exact feature values and attribution weights. | `frontend/src/components/AIPriorityView.tsx, engine/explainability.py` | `GET /api/explainability/shap/:task_id` | `shapAttributions: ShapValue[]` | Ensures sum of SHAP values equals model prediction minus expected baseline value. | TasksView (Section 2) | Builds trust between senior railway engineers and automated AI systems. | "This SHAP explainability chart removes the AI 'black box', clearly showing controllers that high track age and temperature stress drove the urgent maintenance score." |

---

## Section 10 — 10. Failure Intelligence
**Operational Tier**: `INTELLIGENCE` | **Route**: `/?tab=failure_intelligence` | **Source File**: [`frontend/src/components/FailureIntelligenceView.tsx`](file:///frontend/src/components/FailureIntelligenceView.tsx)  
**Core Purpose**: Historical incident analytics repository ingesting Unified Incident Management System (UIMS) data to compute Mean Time Between Failures (MTBF), root-cause Pareto breakdowns, and preventative maintenance triggers.

![Annotated UI - 10. Failure Intelligence](./annotated/10_failure_intelligence_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/10_failure_intelligence_annotated.png) | [Clean Production Screenshot](./clean/10_failure_intelligence_clean.png) | [Presentation Poster](./infographics/10_failure_intelligence_guide.png)*

### 4.1 What is this section?
Failure Intelligence is the reliability engineering and incident analytics hub of ABPS v4.0. It mines historical breakdown logs to identify failure patterns, recurring defect clusters, and asset MTBF trends.

### 4.2 Why is it included?
Without historical failure intelligence, railways continually repair the same defective assets without resolving systemic root causes. This section shifts operations from repetitive firefighting to long-term reliability engineering.

### 4.3 Features
- UIMS Unscheduled Incident Metrics Header displaying total incidents, MTBF, and mean repair hours.
- Chronological Failure Timeline tracking historical track fractures, signal failures, and OHE flashovers.
- Root-Cause Pareto Chart highlighting the 20% of failure modes responsible for 80% of train delays.
- Asset Sub-System Reliability Matrix (Track, OHE, Signaling, Interlocking).
- Automated Work Order Dispatch triggering preventative maintenance before predicted failure windows.

### 4.4 What does each feature do?
Ingests historical incident logs from the Indian Railways UIMS database. Uses survival analysis to calculate sectional MTBF: MTBF = Total Operating Hours / Total Unscheduled Incidents. Generates automated work order recommendations for assets operating past 85% of their MTBF threshold.

### 4.5 How does the user interact with it?
Reliability engineers filter failures by department and section, analyze the root-cause Pareto chart to spot recurring defective batches (e.g. faulty insulator series), and export reliability dossiers.

### 4.6 What happens after interaction?
Empirical MTBF benchmarks, root-cause Pareto distributions, and preventative work orders automatically injected into the Asset Backlog.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Feeds calculated failure rates into Section 9 (AI Risk & Priority) and generates tasks for Section 2 (Asset Backlog).

### 4.9 Practical example
Analysis of the Kanpur-Prayagraj section reveals an MTBF drop from 720 hours to 180 hours on point machine motors. Failure Intelligence traces this to water ingress during monsoon, automatically issuing an urgent drainage clearing work order.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Failure Intelligence transforms Indian Railways' historical incident data into actionable foresight. By analyzing UIMS breakdown logs with MTBF and Pareto analytics, we pinpoint recurring defect hotspots and stop failures before they stop trains."

### 4.11 Technical explanation (Architecture & Data Flow)
Implemented in frontend/src/components/FailureIntelligenceView.tsx. Backend reliability calculations powered by engine/failure_analysis.py using pandas and SciPy. Consumes /api/failures endpoints.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S10-C01 | **UIMS Incident Telemetry Header** | 🟪 `CARD` | Metric Header Ribbon | Top Dashboard Section (x: 280-1890, y: 70-150) | Banner with 4 metric cards: Total Incidents (142), Mean MTBF (412 hrs), Mean Time to Repair (48 min), and Recurring Hotspots (3). | Displays high-level reliability indicators across all divisional assets. | Click on MTBF card to toggle between sectional and department views. | `frontend/src/components/FailureIntelligenceView.tsx` | `GET /api/failures/summary` | `incidentSummary: IncidentSummary` | Excludes scheduled maintenance blocks from unscheduled breakdown counts. | CommandCenterView (Section 1), AssetHealthView (Section 11) | Directly measures the operational reliability and health of divisional infrastructure. | "This header tracks our core reliability metrics: our current Mean Time Between Failures stands at 412 hours with an average repair time under 48 minutes." |
| S10-C02 | **Chronological Incident Timeline & Filter Toolbar** | 🟧 `FORM` | Filter Bar & Timeline | Upper Canvas Area (x: 280-1890, y: 170-230) | Toolbar with department selector, date range picker, severity dropdown, and export button. | Enables granular filtering of historical failure logs by time, location, and severity. | Select date range or department to filter failure analysis. | `frontend/src/components/FailureIntelligenceView.tsx` | `GET /api/failures?start=YYYY-MM-DD&end=YYYY-MM-DD` | `failureFilters: FilterState` | Preserves filter state across view switches. | Root-Cause Pareto Chart, Historical Log Table | Enables rapid retrieval of historical precedent when analyzing similar failures. | "With this toolbar, engineers can isolate failures by department and season, filtering specifically for monsoon or summer heat incidents." |
| S10-C03 | **Root-Cause Failure Pareto Chart** | 🟦 `CHART` | Pareto Bar & Cumulative Curve Chart | Mid-Left Area (x: 280-1080, y: 250-680) | Bar chart with descending failure frequencies overlaid with an 80% cumulative line in red. | Identifies the vital few root causes responsible for the majority of asset breakdowns. | Hover over bars to view exact incident counts and total train delay minutes caused. | `Recharts ComposedChart, frontend/src/components/FailureIntelligenceView.tsx` | `GET /api/failures/pareto` | `paretoData: ParetoItem[]` | Dynamically updates 80% threshold line as filters change. | TasksView (Section 2) | Eliminating the top 3 root causes on this chart resolves 80% of all corridor train delays. | "Our Pareto chart proves the 80/20 rule: just 3 defect modes—weld fractures, insulator flashovers, and point motor jams—cause 80% of our line delays." |
| S10-C04 | **Preventative Remediation Action Table** | 🟩 `ACTION` | Actionable Data Table | Bottom Area (x: 280-1890, y: 700-950) | Table listing high-risk assets, current MTBF status, recommended action, and 'Dispatch Work Order' button. | Converts historical intelligence into immediate preventative maintenance actions. | Click 'Dispatch Work Order' to inject a task directly into the Asset Backlog. | `frontend/src/components/FailureIntelligenceView.tsx` | `POST /api/tasks/create-from-failure` | `recommendedActions: ActionItem[]` | Prevents duplicate work orders for assets already in the backlog. | TasksView (Section 2), AssetHealthView (Section 11) | Replaces guesswork with automated, data-driven preventative maintenance orders. | "This table takes immediate action: it flags assets nearing their MTBF limit and allows controllers to dispatch a preventative work order with one click." |

---

## Section 11 — 11. Asset Health
**Operational Tier**: `INTELLIGENCE` | **Route**: `/?tab=asset_health` | **Source File**: [`frontend/src/components/AssetHealthView.tsx`](file:///frontend/src/components/AssetHealthView.tsx)  
**Core Purpose**: Comprehensive asset health and degradation monitoring system tracking 12,000 canonical physical assets across Delhi Division, integrating Ultrasonic Flaw Detection (USFD) scans and track quality indices.

![Annotated UI - 11. Asset Health](./annotated/11_asset_health_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/11_asset_health_annotated.png) | [Clean Production Screenshot](./clean/11_asset_health_clean.png) | [Presentation Poster](./infographics/11_asset_health_guide.png)*

### 4.1 What is this section?
Asset Health is the physical infrastructure health telemetry center of ABPS v4.0. It tracks the real-time condition, wear rate, and inspection history of all 12,000 canonical railway assets across the division.

### 4.2 Why is it included?
Railway infrastructure degrades continuously under heavy axle loads and extreme weather. Without asset-level condition monitoring, maintenance is either performed too late (causing accidents) or too early (wasting budget).

### 4.3 Features
- 12,000 Canonical Assets Coverage Header displaying overall division health index (98.4%).
- Ultrasonic Flaw Detection (USFD) Scan Telemetry showing rail flaw depth, crack growth, and tolerance thresholds.
- Department Asset Distribution (Track rails, OHE mast structures, Point machines, Track circuits).
- Track Quality Index (TQI) and Rail Condition Index (RCI) wear gauges.
- Electrical Pre-Condition & Power Isolation Checklist status.

### 4.4 What does each feature do?
Reads asset telemetry from ultrasonic rail flaw test cars, OHE inspection cars, and track recording cars (TRC). Normalizes measurements into a standardized Rail Condition Index (0-100). When flaw depth approaches statutory tolerance (e.g. 2.4 mm with 3.0 mm limit), the asset is flagged for mandatory intervention.

### 4.5 How does the user interact with it?
Engineers search for specific asset IDs or track kilometers, review USFD flaw scan history, inspect accumulated Gross Million Tonnes (GMT), and verify required maintenance machinery.

### 4.6 What happens after interaction?
High-fidelity asset health cards, degradation trajectory curves, and automated work orders with pre-populated machinery requirements.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Integrates with Section 2 (Asset Backlog) to spawn urgent tasks and Section 9 (AI Risk & Priority) to supply physical wear inputs.

### 4.9 Practical example
During routine USFD car testing, rail TRK-DH01-0428 at KM 142/8 shows an internal transverse fissure of 2.4 mm (limit 3.0 mm). Asset Health immediately marks the asset Condition Index as 86/100, assigns Priority 96.7, and specifies a CSM Continuous Tamping machine with 8 P-Way crew.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Asset Health monitors all 12,000 physical assets across Delhi Division. It integrates ultrasonic flaw detection scans directly into our planning pipeline, catching rail cracks millimeters before they become catastrophic derailments."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/AssetHealthView.tsx. Backend supported by engine/asset_engine.py. Stores asset attributes and USFD inspection histories in PostgreSQL asset_registry table.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S11-C01 | **12,000 Canonical Assets Monitor Header** | 🟪 `CARD` | Asset Fleet Overview Ribbon | Top Dashboard Section (x: 280-1890, y: 70-150) | Dark banner showing '12,000 CANONICAL PHYSICAL ASSETS MONITORED' with overall divisional health index (98.4%) and active defect count (15). | Provides macro-level situational awareness of total physical infrastructure condition. | Click on defect count to filter down to the 15 compromised assets. | `frontend/src/components/AssetHealthView.tsx` | `GET /api/assets/summary` | `fleetSummary: FleetSummary` | Ensures all 12,000 assets are mapped to valid corridor coordinates. | CommandCenterView (Section 1), TasksView (Section 2) | Guarantees complete oversight of all physical assets across 1,447 km of railway. | "This header tracks our entire physical asset fleet—12,000 canonical assets across Delhi Division—with a verified network health score of 98.4%." |
| S11-C02 | **Departmental Asset Health Distribution** | 🟧 `FORM` | Filter & Health Status Bar | Upper Canvas Area (x: 280-1890, y: 170-240) | Horizontal progress bars showing health percentage for Permanent Way (98.1%), Traction (98.8%), and Signals (98.4%). | Compares physical asset health across the three primary engineering disciplines. | Click a department bar to isolate that discipline's asset list. | `frontend/src/components/AssetHealthView.tsx` | `GET /api/assets/department-health` | `deptHealth: DepartmentHealth[]` | Flags any discipline dropping below 95% with an amber review warning. | TasksView (Section 2), CoordinationView (Section 6) | Identifies which engineering branch needs increased block allocation. | "Here we compare health across engineering branches: track stands at 98.1%, electrical at 98.8%, and signaling at 98.4%, showing balanced maintenance." |
| S11-C03 | **USFD Rail Flaw Telemetry & Wear Monitor** | 🟦 `CHART` | Ultrasonic Inspection Data Panel | Mid-Left Area (x: 280-1200, y: 260-680) | Detailed technical card showing Ultrasonic Flaw Detection (USFD) telemetry: Flaw Depth (2.4 mm), Tolerance (3.0 mm), Rail Condition Index (86/100), and Cumulative Tonnage (342 GMT). | Displays precision non-destructive testing (NDT) data for safety-critical track sections. | Inspect USFD waveform scans, historical inspection dates, and inspector certifications. | `frontend/src/components/AssetHealthView.tsx` | `GET /api/assets/:id/usfd` | `usfdRecord: USFDRecord` | Automatically locks asset to Critical Priority if flaw depth exceeds 2.5 mm. | AIPriorityView (Section 9), TasksView (Section 2) | Detects internal rail cracks invisible to the human eye, preventing catastrophic rail breaks. | "This USFD telemetry card displays precision ultrasonic flaw scans: here a 2.4 mm rail crack is tracked against its 3.0 mm statutory limit, ensuring timely intervention." |
| S11-C04 | **Machinery & Crew Requirement Specification** | 🟩 `ACTION` | Logistics Dispatch Specification Card | Mid-Right Area (x: 1220-1890, y: 260-680) | Card specifying required heavy machinery ('CSM Continuous Tamping #4'), Base Depot ('Ghaziabad Track Depot - 42 km transit'), and Crew ('8 Permanent Way Staff'). | Ensures that every maintenance block requisition has pre-verified machinery and crew logistics. | Select alternative machinery or confirm staging depot locations. | `frontend/src/components/AssetHealthView.tsx` | `GET /api/logistics/machines` | `logisticsPlan: LogisticsPlan` | Flags machine maintenance lockouts to prevent scheduling broken tampers. | GanttTab (Section 3), CoordinationView (Section 6) | Eliminates empty block possessions caused by missing track machines or delayed crews. | "Our system doesn't just allocate time—it verifies logistics. Here it confirms machine availability, base depot transit times, and crew staging before block approval." |

---

## Section 12 — 12. Data Ingestion
**Operational Tier**: `DATA` | **Route**: `/?tab=data_ingestion` | **Source File**: [`frontend/src/components/DataIngestionView.tsx`](file:///frontend/src/components/DataIngestionView.tsx)  
**Core Purpose**: Enterprise multi-source data ingestion pipeline integrating Indian Railways production feeds (COIS, ICMS, UIMS, TMS) with schema mapping, batch ETL, and immutable audit history.

![Annotated UI - 12. Data Ingestion](./annotated/12_data_ingestion_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/12_data_ingestion_annotated.png) | [Clean Production Screenshot](./clean/12_data_ingestion_clean.png) | [Presentation Poster](./infographics/12_data_ingestion_guide.png)*

### 4.1 What is this section?
Data Ingestion is the enterprise data gateway of ABPS v4.0. It manages incoming data feeds from Indian Railways production enterprise systems (COIS, ICMS, UIMS, TMS) and handles manual CSV/JSON data uploads.

### 4.2 Why is it included?
Railway operational data originates in disparate legacy systems—passenger timetables in ICMS, freight rakes in COIS, track defects in UIMS, and live signals in TMS. This section creates a clean, robust data ingestion bridge.

### 4.3 Features
- Multi-Source Enterprise Pipeline Status (COIS, ICMS, UIMS, TMS) showing sync frequency and latency.
- Manual File Upload & Batch ETL Trigger for offline timetable and track geometry updates.
- Real-Time Pipeline Health Indicators (Sync Latency, Records Ingested, Error Rate).
- Immutable Ingestion Audit History Table logging batch IDs, record counts, and schema hashes.
- Automated Schema Validation Gate verifying column headers and data types prior to database commit.

### 4.4 What does each feature do?
Polls enterprise REST APIs and SFTP servers at configured intervals (e.g. 5 minutes for TMS, 1 hour for UIMS). Passes raw data through a validation pipeline that checks referential integrity, formats timestamps, and writes clean records to PostgreSQL staging tables.

### 4.5 How does the user interact with it?
Database administrators monitor live pipeline heartbeats, upload updated timetable CSV files, inspect ingestion error logs, and trigger manual synchronization jobs.

### 4.6 What happens after interaction?
Clean, normalized database tables feeding the entire ABPS application suite.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Feeds normalized data into Section 14 (Data Quality) for schema integrity checks and Section 2 (Asset Backlog) for work orders.

### 4.9 Practical example
A new seasonal timetable circular is issued by Northern Railway. The administrator uploads the revised timetable CSV via Data Ingestion; the pipeline validates 1,819 train records in 1.4 seconds and updates the master timetable database.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Data Ingestion is our enterprise bridge to Indian Railways. It pulls real-time feeds from ICMS timetables, COIS freight rakes, and UIMS defect logs, standardizing millions of operational data points into a unified schema."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/DataIngestionView.tsx. Backend ETL pipelines implemented in Go and Python. Uses schema validators and PostgreSQL transactional staging tables.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S12-C01 | **Enterprise Ingestion Feed Status Ribbon** | 🟪 `CARD` | Pipeline Health Ribbon | Top View Header (x: 280-1890, y: 70-150) | Four cards showing connection health for ICMS (Passenger Timetable), COIS (Freight), UIMS (Asset Defects), and TMS (Traffic Management). | Provides real-time visibility into the health and sync latency of external railway enterprise systems. | Click on any feed card to view connection logs and trigger an immediate re-sync. | `frontend/src/components/DataIngestionView.tsx` | `GET /api/ingestion/feeds` | `feedStatuses: FeedStatus[]` | Displays amber 'High Latency' warning if sync lag exceeds 15 minutes. | DataQualityView (Section 14) | Guarantees that block planners are always working with the latest operational timetable data. | "This ribbon monitors our 4 enterprise feeds—ICMS, COIS, UIMS, and TMS—ensuring that live train schedules and defect logs are synchronized continuously." |
| S12-C02 | **Manual File Upload & Batch ETL Trigger** | 🟧 `FORM` | Drag-and-Drop File Upload Area | Mid-Left Area (x: 280-1080, y: 170-680) | Dashed dropzone box with cloud upload icon, 'Drag & Drop CSV / JSON Timetable Files', and 'Browse Files' button. | Enables offline updates of train schedules, track asset geometries, and machine rosters. | Drag file into dropzone or browse; review parsed columns; click 'Process Batch Ingestion'. | `frontend/src/components/DataIngestionView.tsx, Lucide-React UploadCloud` | `POST /api/ingestion/upload` | `uploadProgress: number, parsedPr...` | Rejects malformed CSVs with row-and-column error highlighting. | DataQualityView (Section 14) | Allows rapid system updates even in offline environments or air-gapped server installations. | "This upload dropzone allows administrators to import new seasonal timetables or track geometry files with instant schema validation." |
| S12-C03 | **Immutable Ingestion Audit History Table** | 🟪 `CARD` | Audit Data Table | Mid-Right Area (x: 1100-1890, y: 170-950) | Table listing Batch ID, Source Feed, Ingested Rows, Error Count, Hash, and Timestamp. | Maintains an auditable, tamper-evident log of all data updates across the application lifecycle. | Click on any batch row to view ingestion error logs or roll back a corrupted batch. | `frontend/src/components/DataIngestionView.tsx` | `GET /api/ingestion/history` | `ingestionBatches: IngestionBatch...` | Prevents rolling back batches that are actively locked by the CP-SAT solver. | ModelVersionsView (Section 16) | Ensures complete data lineage and traceability for all operational schedules. | "This audit table maintains an immutable log of every data ingestion batch with SHA-256 hashes, ensuring complete data traceability." |
| S12-C04 | **Validation Pipeline Telemetry & Error Monitor** | 🟥 `ALERT` | Pipeline Status Card | Lower-Left Area (x: 280-1080, y: 700-950) | Card showing 100% Validation Pass Rate across 21 canonical datasets with zero nulls detected. | Confirms that incoming data meets strict relational and referential integrity standards. | Inspect validation rule definitions and error resolution logs. | `frontend/src/components/DataIngestionView.tsx` | `GET /api/ingestion/validation-status` | `validationStatus: ValidationRepo...` | Quarantines malformed records in an isolation table without aborting the entire batch. | DataQualityView (Section 14) | Prevents corrupted data from causing solver crashes or schedule anomalies. | "This telemetry card proves our ingestion pipeline is hardened: all 21 canonical datasets achieve a 100% validation pass rate before entering the database." |

---

## Section 13 — 13. Data Quality
**Operational Tier**: `DATA` | **Route**: `/?tab=data_quality` | **Source File**: [`frontend/src/components/DataQualityView.tsx`](file:///frontend/src/components/DataQualityView.tsx)  
**Core Purpose**: Exhaustive data quality and schema validation gate auditing 21 canonical railway operational datasets, enforcing zero-null constraints, foreign key referential integrity, and mathematical range boundaries.

![Annotated UI - 13. Data Quality](./annotated/13_data_quality_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/13_data_quality_annotated.png) | [Clean Production Screenshot](./clean/13_data_quality_clean.png) | [Presentation Poster](./infographics/13_data_quality_guide.png)*

### 4.1 What is this section?
Data Quality is the automated data validation and schema integrity laboratory of ABPS v4.0. It continuously audits all 21 canonical datasets powering the optimization engine.

### 4.2 Why is it included?
Garbage in, garbage out: an optimization solver fed with missing track coordinates, negative durations, or duplicate train IDs will produce invalid or dangerous schedules. This section enforces zero-compromise data standards.

### 4.3 Features
- 21 Canonical Datasets Audit Matrix with 100% Pass status across all tables.
- Zero-Null Constraint Verification ensuring no missing critical attributes (lat/long, speeds, line codes).
- Foreign Key Referential Integrity Checker linking assets, sections, tasks, and trains.
- Numerical Range Bounds Validator (e.g. Criticality score strictly bounded in [0.0, 1.0]).
- One-Click 'Trigger Full Re-Validation' action button.

### 4.4 What does each feature do?
Runs automated SQL assertion queries and Great Expectations test suites across the database. Verifies primary key uniqueness, foreign key consistency, temporal causality (departure time > arrival time), and geospatial bounding boxes. Displays green pass chips for each dataset.

### 4.5 How does the user interact with it?
Engineers review validation cards for each of the 21 datasets, inspect detailed constraint rules, and click 'Run Integrity Check' to re-verify after bulk data updates.

### 4.6 What happens after interaction?
Formally certified Data Quality Audit Certificate confirming 100% compliance across all 21 canonical tables.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Validates data ingested in Section 13 (Data Ingestion) before it reaches Section 3 (Weekly Block Planner) or Section 9 (AI Risk & Priority).

### 4.9 Practical example
A data import from an external track database contains a typo: a rail section with length -450 meters. The Data Quality gate immediately flags a range constraint violation, blocks database commit, and prevents the optimizer from crashing.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Mathematical optimization requires pristine data. Our Data Quality gate audits all 21 canonical datasets—from train timetables to track geometry—enforcing zero-null rules and referential integrity with a 100% pass rate."

### 4.11 Technical explanation (Architecture & Data Flow)
Implemented in frontend/src/components/DataQualityView.tsx. Validations executed via engine/test_suite.py and backend SQL assertion checks. Backed by PostgreSQL constraints and SQLite WAL mirrors.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S13-C01 | **21 Canonical Datasets Audit Overview** | 🟪 `CARD` | Audit Summary Card | Top Dashboard Section (x: 280-1890, y: 70-160) | Emerald banner displaying '21/21 CANONICAL DATASETS AUDITED · 100% INTEGRITY PASS' with verified seal. | Summarizes complete data health and verifies that no corrupted datasets exist in the system. | Click to expand full audit checklist. | `frontend/src/components/DataQualityView.tsx` | `GET /api/quality/summary` | `qualitySummary: QualitySummary` | Requires all 21 datasets to pass; single failure flips banner to red. | DataIngestionView (Section 13), AlertsView (Section 18) | Guarantees that safety algorithms never run on incomplete or corrupted data. | "This overview confirms that all 21 canonical datasets powering our solver have been audited and achieved a 100% integrity pass." |
| S13-C02 | **Data Integrity Verification Rules Panel** | 🟥 `ALERT` | Rule Specification Display | Upper Canvas Area (x: 280-1890, y: 180-350) | Card detailing core verification checks: Zero Nulls in Primary Fields, FK Referential Integrity, Temporal Causality, and Range Bounds [0, 1]. | Displays the exact mathematical and relational assertions enforced across the database. | Inspect individual assertion logic and failure thresholds. | `frontend/src/components/DataQualityView.tsx` | `GET /api/quality/rules` | `activeRules: QualityRule[]` | Strict fail-safe: any violated constraint raises an unignorable alert. | AlertsView (Section 18) | Eliminates database corruption risks that could compromise train safety. | "These 4 rule panels show our integrity checks: zero nulls in critical fields, strict foreign key links, chronological time validation, and mathematical bounds." |
| S13-C03 | **Dataset-by-Dataset Verification Matrix** | 🟦 `CHART` | Interactive Status Grid | Mid Canvas Area (x: 280-1890, y: 370-750) | Grid of 21 dataset cards (e.g. timetable_trains, corridor_sections, asset_registry, uims_failures) with green check badges and row counts. | Provides individual status, row counts, and last validation timestamps for every canonical table. | Click on any dataset card to view sample rows and schema definitions. | `frontend/src/components/DataQualityView.tsx` | `GET /api/quality/datasets` | `datasets: DatasetStatus[]` | Highlights empty tables or tables with schema mismatches. | DataIngestionView (Section 13) | Provides complete transparency into the size and health of all railway operational data. | "This matrix breaks down all 21 tables—including our 1,819 trains and 12,000 assets—confirming that each table is populated and 100% valid." |
| S13-C04 | **Trigger Re-Validation & Anomaly Export Controls** | 🟩 `ACTION` | Action Toolbar | Bottom Area (x: 280-1890, y: 770-950) | Toolbar with emerald 'TRIGGER FULL RE-VALIDATION' button, 'Download Audit Report', and 'Export Schema Definition'. | Allows users to execute an on-demand integrity audit across all 21 tables in real time. | Click 'TRIGGER FULL RE-VALIDATION' to execute the test suite. | `frontend/src/components/DataQualityView.tsx` | `POST /api/quality/revalidate` | `isValidating: boolean, lastValid...` | Disables button during active re-validation to prevent duplicate concurrent runs. | AlertsView (Section 18) | Provides instant confidence that data is clean before running multi-hour block allocations. | "Clicking this button runs our automated verification suite across all 21 tables in 1.5 seconds, guaranteeing pristine data before scheduling begins." |

---

## Section 14 — 14. Model / Data Versions
**Operational Tier**: `DATA` | **Route**: `/?tab=model_versions` | **Source File**: [`frontend/src/components/ModelVersionsView.tsx`](file:///frontend/src/components/ModelVersionsView.tsx)  
**Core Purpose**: Enterprise MLOps model registry and data versioning repository managing machine learning model lifecycle, hyperparameter lineage, and comparative benchmark leaderboards across 6 candidate algorithms.

![Annotated UI - 14. Model / Data Versions](./annotated/14_model_versions_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/14_model_versions_annotated.png) | [Clean Production Screenshot](./clean/14_model_versions_clean.png) | [Presentation Poster](./infographics/14_model_versions_guide.png)*

### 4.1 What is this section?
Model / Data Versions is the MLOps governance and data provenance repository of ABPS v4.0. It tracks the training lineage, hyperparameters, validation benchmarks, and active production status of all AI models.

### 4.2 Why is it included?
Railway operations require strict auditability. Regulators must know exactly which model version made a prediction, what training dataset it used, and how its precision was validated before it was promoted to production.

### 4.3 Features
- Model Governance & MLflow Registry Banner displaying active Champion (XGBoost v2.4).
- 6 Candidate Benchmark Leaderboard comparing XGBoost, LightGBM, CatBoost, Random Forest, Extra Trees, and Logistic Regression.
- Hyperparameter Lineage Table showing learning rates, tree depths, and regularization values.
- Data Version Snapshot Hash (SHA-256) tracking exact training dataset splits.
- Champion Promotion Action Button for zero-downtime model hot-swapping.

### 4.4 What does each feature do?
Integrates with MLflow model registry conventions. Retraining scripts evaluate candidate algorithms on holdout operational datasets, logging PR-AUC, ROC-AUC, Brier score, and inference latency. The best-performing model is promoted to 'Champion' status and hot-swapped into the live inference pipeline.

### 4.5 How does the user interact with it?
Data scientists and safety auditors review model leaderboard metrics, inspect hyperparameter differences, verify dataset snapshot hashes, and promote validated challenger models to production.

### 4.6 What happens after interaction?
Complete MLOps governance manifest and auditable training lineage certificates for regulatory compliance.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Manages the model utilized in Section 9 (AI Risk & Priority) and records dataset versions from Section 13 (Data Ingestion).

### 4.9 Practical example
A new training cycle completes on 15,000 recent operational records. CatBoost achieves PR-AUC of 0.3110 versus XGBoost's 0.3138. The registry maintains XGBoost as Champion, documenting why CatBoost was kept in shadow challenger mode.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Model / Data Versions brings enterprise MLOps governance to Indian Railways. We maintain full lineage of our training data and benchmark 6 candidate algorithms, ensuring that only the highest-precision model ever guides live operations."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/ModelVersionsView.tsx. Model metadata stored in engine/ml_model_meta.json. MLOps pipeline automated via engine/retrain_from_operational_data.py.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S14-C01 | **Model Governance & Registry Banner** | 🟪 `CARD` | MLOps Status Banner | Top Dashboard Section (x: 280-1890, y: 70-140) | Banner displaying active Champion model: 'XGBoost v2.4 Champion' with deployment timestamp, MLflow run ID, and production status badge. | Identifies the currently deployed machine learning model serving live inference requests. | Click to view full MLflow deployment manifest. | `frontend/src/components/ModelVersionsView.tsx` | `GET /api/models/active` | `activeModelMeta: ModelMeta` | Ensures only one model can hold the 'Champion' production pointer at any time. | AIPriorityView (Section 9) | Guarantees full accountability for every automated AI recommendation. | "This banner displays our active production model—XGBoost v2.4 Champion—with its unique MLflow run ID and verified deployment timestamp." |
| S14-C02 | **6 Candidate Benchmark Leaderboard** | 🟦 `CHART` | Comparative Leaderboard Table | Upper Canvas Area (x: 280-1890, y: 160-380) | Table ranking 6 models: XGBoost (1st), CatBoost (2nd), LightGBM (3rd), Random Forest (4th), Extra Trees (5th), Logistic Regression (6th) by PR-AUC and Brier Score. | Compares candidate model performance on identical holdout validation datasets. | Click on any model row to inspect its precision-recall curve and confusion matrix. | `frontend/src/components/ModelVersionsView.tsx` | `GET /api/models/benchmarks` | `leaderboard: ModelBenchmark[]` | Requires Brier score < 0.10 and PR-AUC > 0.30 for champion consideration. | AIPriorityView (Section 9) | Ensures the system continuously uses the most accurate predictive algorithm available. | "Our leaderboard benchmarks 6 candidate algorithms: XGBoost wins with a PR-AUC of 0.3138 and a Brier score of 0.0812, outperforming Random Forest and CatBoost." |
| S14-C03 | **Hyperparameter Lineage & Dataset Splits** | 🟪 `CARD` | Parameter Configuration Table | Mid-Left Area (x: 280-1080, y: 400-950) | Table displaying exact hyperparameter configurations: max_depth=5, learning_rate=0.05, n_estimators=250, subsample=0.8, and 80/20 train/test split. | Maintains reproducible records of exact training configurations for every model build. | Inspect hyperparameter tuning history and grid search logs. | `frontend/src/components/ModelVersionsView.tsx` | `GET /api/models/:id/hyperparameters` | `hyperparameters: Record<string, ...` | Flags any hyperparameter configurations that led to overfitting on training data. | AIPriorityView (Section 9) | Guarantees algorithmic reproducibility across independent external audits. | "This table documents the exact hyperparameters and 80/20 training splits used for XGBoost v2.4, ensuring 100% reproducibility." |
| S14-C04 | **Champion Promotion & Hot-Swap Action Button** | 🟩 `ACTION` | Administrative Action Trigger | Mid-Right Upper Area (x: 1100-1890, y: 400-650) | Card with emerald 'PROMOTE CHALLENGER TO CHAMPION' button, rollback trigger, and confirmation dialog. | Enables zero-downtime hot-swapping of production machine learning models. | Click button; confirm administrative credentials; live inference seamlessly switches to new model. | `frontend/src/components/ModelVersionsView.tsx` | `POST /api/models/promote` | `isPromoting: boolean, promotionE...` | Requires dual-controller sign-off to prevent unauthorized model deployment. | ApprovalAuditView (Section 17) | Allows continuous AI improvement without requiring disruptive system maintenance windows. | "This action button enables zero-downtime model promotion: when a challenger outperforms the champion, it can be promoted atomically in under 50 milliseconds." |
| S14-C05 | **Data Version Snapshot Hash Card** | 🟦 `NAV` | Data Provenance Card | Mid-Right Lower Area (x: 1100-1890, y: 670-950) | Card displaying SHA-256 dataset hash ('e3b0c44298fc1c14...'), record count (15,000), and timestamp. | Links each trained model to the exact immutable snapshot of operational data it learned from. | Click to copy hash or download data manifest. | `frontend/src/components/ModelVersionsView.tsx` | `GET /api/models/:id/data-hash` | `dataHash: string` | Verifies that dataset hash matches the manifest recorded in the training run. | DataIngestionView (Section 13) | Guarantees complete forensic auditability for every predictive model. | "This card displays the SHA-256 hash of our 15,000-record training dataset, proving complete data provenance and tamper-evident lineage." |

---

## Section 15 — 15. Human Review & Audit
**Operational Tier**: `CONTROL` | **Route**: `/?tab=approvals_audit` | **Source File**: [`frontend/src/components/ApprovalAuditView.tsx`](file:///frontend/src/components/ApprovalAuditView.tsx)  
**Core Purpose**: Human-in-the-loop regulatory control center providing Level 4 (L4) Divisional Traffic Controller review, digital sign-off steppers, pre-condition safety checklists, and immutable dispatch audit trails.

![Annotated UI - 15. Human Review & Audit](./annotated/15_approvals_audit_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/15_approvals_audit_annotated.png) | [Clean Production Screenshot](./clean/15_approvals_audit_clean.png) | [Presentation Poster](./infographics/15_approvals_audit_guide.png)*

### 4.1 What is this section?
Human Review & Audit is the statutory human-in-the-loop governance center of ABPS v4.0. It ensures that no automated AI or solver-generated block schedule can be dispatched without explicit sign-off by a certified Level 4 (L4) Divisional Traffic Controller.

### 4.2 Why is it included?
Under Indian Railways General Rules (GR), automated algorithms cannot legally execute line closures without human authorization. This screen enforces statutory human accountability, ensuring full compliance with railway safety law.

### 4.3 Features
- L4 Controller Review Stepper (Review Allocation -> Verify Headway -> Electrical Interlocks -> Final Sign-Off).
- Pending Block Allocation Review Card detailing corridor, lines affected, and machine transit routes.
- Controller Override & Modification Controls (Adjust Window, Request Re-Solve, Approve, Reject).
- Mandatory Safety Checklist (OHE 25kV de-energization confirmed, SCADA power token held, discharge rods staged).
- Immutable Audit Trail recording controller badge ID, digital signature hash, and millisecond timestamp.

### 4.4 What does each feature do?
Presents proposed CP-SAT block allocations in an auditable review queue. The controller steps through mandatory safety verifications. Upon clicking 'Authorize Possession', the system validates controller credentials, signs the dispatch token with an SHA-256 hash, and broadcasts the approved possession to field stations.

### 4.5 How does the user interact with it?
The L4 Chief Controller reviews pending block windows, checks traction power isolation readiness, clicks the 3 safety checklist checkboxes, enters approval remarks, and signs off with a secure authorization PIN.

### 4.6 What happens after interaction?
Legally binding, digitally signed Block Possession Authority (Form T/409) dispatched to Sectional Controllers and Station Masters.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Authorizes blocks created in Section 3 (Weekly Block Planner) and logs sign-offs verified by Section 18 (Verification Suite).

### 4.9 Practical example
The Chief Controller reviews Block BLK_DH01_042 (2-hour tamping at KM 142/8). The controller checks the electrical interlock box, verifies that the 10-minute headway buffer to Rajdhani Express is +14 minutes, enters badge ID 'DEL-CTRL-409', and signs the block authority.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "AI recommends, but humans decide. This screen enforces statutory Level 4 human-in-the-loop governance: no machine moves and no line closes until an authorized Divisional Traffic Controller verifies the safety checklists and signs the digital authority."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/ApprovalAuditView.tsx. Enforces multi-stage state transitions. Signs tokens via backend/main.go and commits immutable audit logs to PostgreSQL dispatch_audit table.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S15-C01 | **L4 Controller Multi-Stage Review Stepper** | 🟦 `NAV` | Progress Stepper | Top View Header (x: 280-1890, y: 70-180) | Horizontal 4-step progress stepper: 1. Schedule Inspection (Green check), 2. Headway Audit (Green check), 3. Safety Interlocks (Active Blue), 4. Digital Sign-Off (Pending). | Guides the Chief Controller through mandatory statutory verification stages in rigid sequential order. | Step through review stages by clicking 'Next Stage' after completing required checks. | `frontend/src/components/ApprovalAuditView.tsx` | `GET /api/approval/stepper-status` | `currentStep: number (1 to 4), is...` | Prevents skipping steps or proceeding with unacknowledged safety warnings. | Mandatory Safety Checklist, Digital Sign-Off Card | Enforces strict adherence to Indian Railways standard operating procedures (SOP). | "This 4-stage stepper guides the controller through mandatory verification steps, ensuring that safety checklists cannot be bypassed before sign-off." |
| S15-C02 | **Pending Block Allocation Review Card** | 🟪 `CARD` | Structured Review Card | Mid-Left Area (x: 280-1150, y: 200-620) | Card displaying detailed block specifications: Block ID ('BLK_DH01_042'), Corridor ('NDLS-GZB'), Line ('UP Mainline'), Window ('02:30 -> 04:30'), and Bundled Departments ('TRD + ENG'). | Presents all operational parameters of the pending block allocation for human verification. | Inspect machine transit details or request schedule adjustment. | `frontend/src/components/ApprovalAuditView.tsx` | `GET /api/approval/pending/:id` | `pendingBlockDetail: BlockDetail ...` | Displays warning badge if machine transit crosses busy suburban passenger tracks. | GanttTab (Section 3), TasksView (Section 2) | Gives controllers complete situational clarity before executing disruptive line closures. | "This review card presents all block parameters—corridor section, affected track line, bundled tasks, and station limits—for human controller verification." |
| S15-C03 | **Controller Decision & Override Controls** | 🟩 `ACTION` | Decision Action Button Array | Mid-Right Area (x: 1170-1890, y: 200-620) | Control panel featuring green 'AUTHORIZE & DISPATCH', red 'REJECT WITH REMARKS', and blue 'REQUEST ADJUSTMENT' buttons. | Empowers the human controller with final, unappealable decision authority over automated recommendations. | Click 'AUTHORIZE & DISPATCH' to sign off, or 'REJECT' to return task to backlog. | `frontend/src/components/ApprovalAuditView.tsx` | `POST /api/approval/decide` | `decisionRemarks: string, isSubmi...` | Requires minimum 10-character remarks if rejecting or modifying an allocation. | Immutable Audit Trail, GanttTab (Section 3) | Maintains human command authority over AI recommendations as required by law. | "These action buttons embody human command: the controller has ultimate authority to authorize, adjust, or reject any AI recommendation." |
| S15-C04 | **Mandatory Safety & Interlock Checklist** | 🟥 `ALERT` | Interactive Safety Checklist | Lower-Left Area (x: 280-1150, y: 640-950) | High-visibility card with 3 interactive checkboxes: 1. OHE 25kV Traction Power De-energization Confirmed, 2. SCADA Isolation Token Staged, 3. Discharge Earthing Rods Verified. | Enforces non-negotiable physical life-safety pre-conditions before crews step on track. | Controller must click and confirm each checkbox individually. | `frontend/src/components/ApprovalAuditView.tsx` | `POST /api/approval/verify-checklist` | `checklist: { oheDeenergized: boo...` | All 3 checkboxes must be True; unchecking any box disables authorization immediately. | AlertsView (Section 18) | Prevents maintenance crews from working under live 25,000-volt overhead wires. | "This safety checklist enforces physical life-safety protocols: confirming that 25kV wires are de-energized, SCADA permits issued, and earthing rods staged before dispatch." |
| S15-C05 | **Immutable Dispatch Audit Trail Record** | 🟦 `CHART` | Cryptographic Audit Ledger | Lower-Right Area (x: 1170-1890, y: 640-950) | Card displaying digital signature hash ('SHA256: 7f8a92b...'), Controller ID ('DEL-CTRL-409'), and timestamp ('2026-09-20 20:15:02 IST'). | Creates an immutable, legally binding digital record of the dispatch authority. | Inspect signature certificate or export signed Block Authority (Form T/409). | `frontend/src/components/ApprovalAuditView.tsx` | `GET /api/approval/audit-trail` | `auditToken: string, signTimestam...` | Cryptographically verifies signature on retrieval to detect any database tampering. | AlertsView (Section 18) | Provides indisputable legal proof of proper authorization during safety inquiries. | "This audit card generates an immutable cryptographic signature for every approved possession, binding controller badge ID and timestamp into an unalterable legal record." |

---

## Section 16 — 16. Verification Suite
**Operational Tier**: `CONTROL` | **Route**: `/?tab=verification_suite` | **Source File**: [`frontend/src/components/AlertsView.tsx`](file:///frontend/src/components/AlertsView.tsx)  
**Core Purpose**: Formal mathematical and safety verification suite executing 12 deterministic proof checks across 6 physical railway safety laws, guaranteeing that zero unsafe or headway-violating schedules can ever be generated.

![Annotated UI - 16. Verification Suite](./annotated/16_verification_suite_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/16_verification_suite_annotated.png) | [Clean Production Screenshot](./clean/16_verification_suite_clean.png) | [Presentation Poster](./infographics/16_verification_suite_guide.png)*

### 4.1 What is this section?
The Verification Suite is the mathematical proof and safety certification gate of ABPS v4.0. It executes 12 rigorous automated verification checks across 6 physical railway safety laws, certifying every schedule before execution.

### 4.2 Why is it included?
Railway operations require mathematical guarantees, not heuristic guesses. This suite provides formal proof that the generated schedule violates zero physical constraints, maintains non-negative KPIs, and strictly enforces 10-minute train headways.

### 4.3 Features
- 12/12 Mathematical & Safety Proof Checks Passed indicator (Blueprint v2 Certification).
- 6 Physical Railway Safety Laws Compliance Matrix (Geospatial link, Timetable causality, Expected loss bounds, Safety overrides, Headway clearance, Shadow block integrity).
- Injected Collision Detection Validator proving the safety gate reliably catches simulated errors.
- Singleflight Mutex & 60-Second Recompute Lock Monitor preventing concurrent solver thrashing.
- Formal Safety Certificate Export with digital verification seal.

### 4.4 What does each feature do?
Runs engine/test_suite.py against the SQLite database and in-memory schedule. Asserts: 1) 100% assets mapped to valid sections, 2) Zero timetable chronology violations, 3) Criticality in [0, 1], 4) 100% safety-critical tasks locked >= 90.0, 5) Zero train collisions, 6) Coordinated blocks share identical sections. All 12 tests must pass.

### 4.5 How does the user interact with it?
Safety officers review the 12 proof cards, verify individual execution runtimes (all <0.04s), review solver singleflight lock status, and export the formal safety certificate.

### 4.6 What happens after interaction?
Formally certified Safety Compliance Certificate (PASS) guaranteeing zero physical or mathematical violations.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Acts as the final safety gate for Section 3 (Weekly Block Planner), Section 8 (Train Conflicts), and Section 17 (Human Review & Audit).

### 4.9 Practical example
During automated testing, test [7.1] artificially injects an overlapping train conflict into the schedule. The Verification Suite immediately detects the collision, proves the validator catches violations, rejects the bad plan, and restores the certified schedule.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "The Verification Suite provides formal mathematical proof of safety. Our 12-check test suite validates 6 physical railway laws in 35 milliseconds, proving with 100% certainty that every generated schedule has zero collisions and zero headway violations."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/AlertsView.tsx. Backend test suite implemented in engine/test_suite.py. Executes 12 assertion functions in Python against SQLite database in WAL mode with 60s busy timeout.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S16-C01 | **12/12 Mathematical Proof Gate Header** | 🟥 `ALERT` | Formal Certification Banner | Top Dashboard Section (x: 280-1890, y: 70-160) | Green-bordered banner with large badge '12/12', displaying '12/12 MATHEMATICAL & SAFETY PROOF CHECKS PASSED · SCHEDULE FORMALLY CERTIFIED'. | Declares formal mathematical and statutory safety certification of the active schedule. | Click to view full test execution logs with sub-millisecond execution times. | `frontend/src/components/AlertsView.tsx, engine/test_suite.py` | `GET /api/verification/suite-status` | `suiteStatus: { totalTests: 12, p...` | Strict binary outcome: 12/12 = CERTIFIED PASS; 11/12 = IMMEDIATE SYSTEM LOCKOUT. | ApprovalAuditView (Section 17), CommandCenterView (Section 1) | Provides absolute certainty that the schedule contains zero latent safety defects. | "This banner declares our formal certification: 12 out of 12 mathematical and safety proof checks have passed, proving the schedule is 100% collision-free." |
| S16-C02 | **6 Physical Railway Safety Laws Matrix** | 🟦 `CHART` | Proof Assertion Card Grid | Upper Canvas Area (x: 280-1890, y: 180-480) | Grid of 6 proof cards detailing: 1. Geospatial Topology Link (100%), 2. Timetable Chronology (0 violations), 3. Criticality Formula Bounds, 4. Safety Overrides (100%), 5. Train Collision-Free (0 collisions), 6. Headway Clearance (>=10m). | Exhibits individual verification proofs for the 6 non-negotiable physical laws of railway operation. | Click on any proof card to view mathematical equations and assertion code. | `frontend/src/components/AlertsView.tsx` | `GET /api/verification/proof-laws` | `safetyLaws: SafetyLawProof[]` | All runtimes monitored; flags any test taking longer than 100ms for optimization. | TrainConflictsView (Section 8), TasksView (Section 2) | Translates complex railway safety rules into verifiable mathematical invariants. | "These 6 cards verify our physical safety laws: geospatial mapping, timetable causality, mathematical bounds, non-negotiable overrides, and train headway clearance." |
| S16-C03 | **Injected Collision Detection Proof Validator** | 🟦 `CHART` | Adversarial Stress Test Card | Mid-Left Area (x: 280-1080, y: 500-950) | Card detailing Test [7.1]: artificially injects a simulated train collision into schedule; confirms validator reliably caught the violation (1 violation detected in 0.016s). | Proves adversarial robustness: verifies that the safety validator actually catches collisions when they occur. | Inspect injected conflict parameters and validator rejection response. | `frontend/src/components/AlertsView.tsx, engine/test_suite.py (Test 7.1)` | `GET /api/verification/adversarial-test` | `adversarialResult: TestResult` | Ensures the artificially injected collision is completely cleaned up after test completion. | TrainConflictsView (Section 8) | Proves beyond doubt that the verification gate cannot be bypassed by faulty data. | "To prove our validator isn't a passive rubber-stamp, Test 7.1 injects an artificial train collision: our validator reliably caught it in 16 milliseconds and rejected the schedule." |
| S16-C04 | **Singleflight Mutex & 60s Recompute Lock Monitor** | 🟪 `CARD` | Concurrency Telemetry Card | Mid-Right Upper Area (x: 1100-1890, y: 500-720) | Card displaying active Singleflight Mutex lock status, 60s busy timeout, and SQLite WAL mode telemetry. | Prevents race conditions and solver thrashing when multiple controllers interact concurrently. | Inspect active lock holders and concurrent worker counts. | `backend/main.go (singleflight.Group), engine/test_suite.py` | `GET /api/system/mutex-status` | `mutexLocked: boolean, currentLoc...` | Enforces 60-second automatic lock release to prevent deadlocks if a solver process crashes. | GanttTab (Section 3) | Guarantees system stability during critical shift handovers with dozens of active users. | "This monitor displays our Singleflight Mutex lock: it prevents solver thrashing by ensuring only one optimization runs at a time while serving cached results safely." |
| S16-C05 | **Formal Safety Certificate Export & Audit Seal** | 🟩 `ACTION` | Formal Export Action Card | Mid-Right Lower Area (x: 1100-1890, y: 740-950) | Card featuring official digital certificate seal, 'EXPORT SAFETY CERTIFICATE (PDF)', and cryptographic verification token. | Generates the official formal safety compliance certificate for regulatory filing. | Click 'EXPORT SAFETY CERTIFICATE (PDF)' to download official compliance document. | `frontend/src/components/AlertsView.tsx` | `POST /api/verification/export-certificate` | `isExportingCert: boolean` | Export disabled if any of the 12 suite checks has failed. | ApprovalAuditView (Section 17) | Provides the formal legal authorization document required to execute block possessions. | "With all 12 checks passed, this button exports our formal Safety Compliance Certificate, signed and sealed for submission to the Commissioner of Railway Safety." |

---

## Section 17 — 17. What-If Simulator
**Operational Tier**: `INTELLIGENCE` | **Route**: `/?tab=what_if` | **Source File**: [`frontend/src/components/WhatIfSimulatorView.tsx`](file:///frontend/src/components/WhatIfSimulatorView.tsx)  
**Core Purpose**: Risk-free simulation laboratory allowing train dispatchers to test emergency block shifts, asset failure injections, and temporal displacements before committing changes to live railway operations.

![Annotated UI - 17. What-If Simulator](./annotated/17_what_if_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/17_what_if_annotated.png) | [Clean Production Screenshot](./clean/17_what_if_clean.png) | [Presentation Poster](./infographics/17_what_if_guide.png)*

### 4.1 What is this section?
The What-If Simulator is the risk-free scenario testing laboratory of ABPS v4.0. It creates an isolated sandbox where controllers can perturb schedules, inject disruptions, and evaluate contingency plans without affecting live operations.

### 4.2 Why is it included?
In high-density corridors, altering a block time or delaying a train can cause catastrophic ripple delays across dozens of subsequent trains. Controllers need a simulator to evaluate the downstream consequences of their decisions before executing them.

### 4.3 Features
- Isolated Simulation Sandbox Banner guaranteeing zero corruption of live operational databases.
- Block Selector Dropdown and Temporal Shift Controls (-60m, -30m, +30m, +60m, +120m).
- Collision Radar & Infeasible Conflict Alert Banner flagging train headway infringements.
- Ripple Delay Propagation Diagram modeling knock-on passenger train delays.
- One-Click 'Reset Simulation' and 'Commit to Live Schedule' controls.

### 4.4 What does each feature do?
Clones the active CP-SAT schedule into an in-memory sandbox. When the user shifts a block (e.g. +120 minutes), the timetable conflict engine tests all 1,819 train paths against the shifted window. If headway < 10m, it flags an infeasible conflict and displays which trains are impacted.

### 4.5 How does the user interact with it?
Controllers select a target block (e.g. 'CB_001'), click temporal shift buttons (e.g. '+120m'), click 'Run Simulation', observe the conflict alerts and ripple delay curves, and iterate until an optimal contingency is found.

### 4.6 What happens after interaction?
Perturbation impact report showing train conflict counts, total passenger delay minutes, and certified feasible contingency alternatives.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Integrates with Section 3 (Weekly Block Planner) to import baseline schedules, and Section 8 (Train Conflicts) to run headway checks.

### 4.9 Practical example
A track machine arrives 120 minutes late at Ghaziabad. The controller simulates shifting Block CB_001 by +120 minutes. The simulator immediately flags a red conflict: the shifted block collides with 12301 Rajdhani Express (headway buffer -35 min). The controller tests +60m instead, which clears with +18m buffer.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "The What-If Simulator provides a risk-free sandbox where controllers can ask: 'What happens if our tamping machine is delayed by 2 hours?' Our engine computes the exact ripple effects on 1,819 trains in seconds, preventing real-world operational chaos."

### 4.11 Technical explanation (Architecture & Data Flow)
Implemented in frontend/src/components/WhatIfSimulatorView.tsx. Uses client-side state cloning for instantaneous perturbation testing, backed by engine/scenario_engine.py.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S17-C01 | **Simulation Sandbox Banner & Reset Controls** | 🟦 `NAV` | Simulation Header Banner | Top Dashboard Section (x: 280-1890, y: 70-140) | Amber-themed header banner indicating 'SIMULATION / DEMO MODE' with reset and comparison buttons. | Guarantees that exploratory testing never corrupts live operational schedules or railway databases. | Click 'Reset Simulation' to restore baseline schedule. | `frontend/src/components/WhatIfSimulatorView.tsx, engine/scenario_engine.py` | `POST /api/simulation/clone, POST /api/simulation/reset` | `isSimulationMode: boolean, isDir...` | Ensures simulated changes cannot be published without passing L4 review (Section 17). | GanttTab (Section 3), ApprovalAuditView (Section 17) | Prevents accidental disruption of live train operations during training or contingency planning. | "Our What-If simulator provides a risk-free sandbox where controllers can simulate emergency breakdowns and evaluate contingency plans before touching live operations." |
| S17-C02 | **Target Block Selector & Temporal Shift Controls** | 🟧 `FORM` | Interactive Slider & Button Array | Upper Canvas Controls (x: 280-1890, y: 160-250) | Block selector dropdown paired with temporal shift buttons (-60m, -30m, +30m, +60m, +120m) and emergency injection button. | Simulates real-world operational delays such as machine breakdowns or train derailments. | Select block 'CB_001', click '+120 min', and press 'Run Simulation'. | `frontend/src/components/WhatIfSimulatorView.tsx` | `POST /api/simulation/perturb` | `selectedSimBlockId: string, shif...` | Limits shift range to +/- 360 minutes within the 24-hour cycle. | Collision Radar Alert Banner | Allows dispatchers to test contingency shifts before machine crews depart their depots. | "With these controls, a dispatcher can ask: 'What happens if our track tamping machine arrives 2 hours late?' and see the immediate ripple effects." |
| S17-C03 | **Collision Radar & Infeasible Conflict Alert Banner** | 🟥 `ALERT` | Interactive Alert Banner | Mid Canvas Area (x: 280-1890, y: 270-420) | High-contrast crimson banner displaying 'SIMULATED SHIFT CREATES 1 INFEASIBLE CONFLICT · HEADWAY BUFFER VIOLATED'. | Alerts the controller that the simulated shift infringes upon a passenger train path. | Click on conflict banner to expand detailed string-chart showing the collision point. | `frontend/src/components/WhatIfSimulatorView.tsx` | `GET /api/simulation/conflicts` | `simConflicts: ConflictRecord[]` | Highlights affected train category (Superfast, Express, Freight) in priority order. | TrainConflictsView (Section 8) | Prevents catastrophic misjudgments where emergency block shifts trap premium express trains. | "Here our collision radar catches the hazard immediately: shifting the block by 120 minutes violates headway for Rajdhani Express by 35 minutes, instantly blocking the shift." |
| S17-C04 | **Ripple Delay Propagation Analytics** | 🟦 `CHART` | Delay Flow Diagram | Lower-Left Area (x: 280-1080, y: 440-950) | Diagram illustrating knock-on delay propagation across downstream trains (Primary: +45m, Secondary: +18m, Tertiary: +6m). | Quantifies the total passenger delay impact across the entire division. | Inspect delay curves and test alternative freight looping strategies. | `frontend/src/components/WhatIfSimulatorView.tsx` | `GET /api/simulation/ripple-delay` | `rippleMetrics: RippleDelaySummar...` | Accounts for sectional maximum permissible speed (MPS) recovery margins. | CommandCenterView (Section 1) | Saves thousands of passenger delay minutes by optimizing knock-on recovery paths. | "This delay propagation chart models how a primary 45-minute delay ripples across downstream trains, giving controllers complete visibility into total system impact." |
| S17-C05 | **Alternative Feasible Schedule Recommender** | 🟩 `ACTION` | Remediation Card | Lower-Right Area (x: 1100-1890, y: 440-950) | Emerald-bordered card recommending 'FEASIBLE ALTERNATIVE: Shift +60 min instead (Clears with +18m Headway)'. | Provides an immediate, viable alternative when the controller's initial shift is infeasible. | Click 'Apply Alternative' to adopt the mathematically verified shift. | `frontend/src/components/WhatIfSimulatorView.tsx` | `POST /api/simulation/find-alternative` | `suggestedAlternative: Alternativ...` | Guarantees all recommended alternatives have verified >=10m headway buffer. | GanttTab (Section 3) | Enables instant recovery during operational disruptions without requiring manual re-calculation. | "When an initial shift fails, our engine immediately suggests a verified alternative: 'Shift by 60 minutes instead', which clears with an 18-minute headway buffer." |

---

## Section 18 — 18. Scenario Explorer
**Operational Tier**: `DATA` | **Route**: `/?tab=scenario_explorer` | **Source File**: [`frontend/src/components/ScenarioExplorerView.tsx`](file:///frontend/src/components/ScenarioExplorerView.tsx)  
**Core Purpose**: Interactive disruption stress-testing workbench containing 29 pre-configured operational railway scenario classes, providing multi-metric benchmarking and robustness validation.

![Annotated UI - 18. Scenario Explorer](./annotated/18_scenario_explorer_annotated.png)

> *Visual Assets: [High-Res Annotated Screenshot](./annotated/18_scenario_explorer_annotated.png) | [Clean Production Screenshot](./clean/18_scenario_explorer_clean.png) | [Presentation Poster](./infographics/18_scenario_explorer_guide.png)*

### 4.1 What is this section?
Scenario Explorer is the stress-testing workbench of ABPS v4.0. It catalogs 29 pre-modeled operational railway scenarios (e.g. monsoon washouts, freight derailments, power grid trips) and tests how the system responds to each.

### 4.2 Why is it included?
Railway systems must be resilient against extreme, low-probability events. Rather than waiting for a real emergency, Scenario Explorer allows controllers to stress-test the system against 29 historical disruption classes.

### 4.3 Features
- 29 Scenarios Coverage Matrix classified by Weather, Mechanical, Signaling, and Traffic categories.
- 8 Metric Tiles Coverage Ribbon displaying solve time, delay mitigation, and safety score per scenario.
- Scenario Category Filter & Search input for rapid retrieval.
- Scenario Detail Modal with simulated disruption parameters and timeline impact.
- Stress-Test Execution Trigger running simulation and benchmarking recovery efficiency.

### 4.4 What does each feature do?
Each scenario defines a perturbation vector (e.g. 'OHE trip between KM 80-92 for 90 minutes'). When executed, the engine runs the anomaly handling and CP-SAT re-optimization pipelines, measuring how quickly the schedule converges back to normal operations.

### 4.5 How does the user interact with it?
Users filter scenarios by category (e.g. 'Extreme Weather'), select a scenario (e.g. 'Dense Winter Fog Speed Restrictions'), click 'Simulate Scenario', and inspect recovery metrics and generated contingency plans.

### 4.6 What happens after interaction?
Comprehensive stress-test scorecards verifying that the system maintains safety and restores timetable flow across all 29 scenarios.

### 4.7 What information does it handle?
- **Displays**: Telemetry, schedules, and metrics.
- **Collects**: User parameters, filters, and commands.
- **Processes**: Mathematical models and constraint equations.
- **Generates / Returns**: Certified schedules and reports.

### 4.8 Connection with other sections
Supplies scenario archetypes to Section 5 (Anomaly Handling) and Section 12 (What-If Simulator).

### 4.9 Practical example
During winter timetable prep, the committee tests Scenario #14 ('Dense Fog: 60 km/h Speed Restriction across Delhi-Aligarh'). The engine re-calculates block windows, spreads headway buffers to 15 minutes, and delivers a fog-resilient schedule.

### 4.10 PPT explanation (Spoken Presentation & Viva Pitch)
> "Scenario Explorer proves our system's robustness. We catalog 29 operational disruption scenarios—from severe monsoons to signaling failures—and prove that ABPS successfully mitigates every single one within seconds."

### 4.11 Technical explanation (Architecture & Data Flow)
Built in frontend/src/components/ScenarioExplorerView.tsx. Scenarios stored in engine/scenario_registry.json. Benchmarks executed via engine/scenario_engine.py.

### Component-Level Detailed Audit (15-Field Table)

| ID | Component Name | Color | UI Type | Screen Location | Visual Appearance | Purpose & Function | User Interaction | Frontend Tech | Backend API | State Handled | Validation / Edge Cases | Connected Components | Railway Impact | Viva Pitch |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| S18-C01 | **29 Disruptions Benchmark Header** | 🟪 `CARD` | Benchmark Header Banner | Top Dashboard Section (x: 280-1890, y: 70-140) | Banner displaying '29/29 OPERATIONAL DISRUPTION BENCHMARKS VERIFIED' with average recovery time (2.1s). | Confirms complete coverage of recognized Indian Railways disruption archetypes. | Click to export benchmark report for safety certification. | `frontend/src/components/ScenarioExplorerView.tsx` | `GET /api/scenarios/summary` | `scenarioSummary: ScenarioSummary` | Ensures all 29 scenarios have passing test certificates. | AnomalyHandlingView (Section 5) | Guarantees proven resilience against unpredictable operational emergencies. | "This header confirms that our system has been benchmarked against all 29 operational disruption scenarios with an average recovery time of just 2.1 seconds." |
| S18-C02 | **8 Metric Tiles Coverage Ribbon** | 🟦 `CHART` | Metric Tile Grid | Upper Canvas Area (x: 280-1890, y: 160-260) | Eight compact metric tiles showing Punctuality Preservation (94.2%), Delay Reduction (42%), Mean Re-solve Time (1.8s), and Safety Integrity (100%). | Displays quantitative recovery performance across multi-scenario stress tests. | Hover over tiles to view underlying calculation formulas. | `frontend/src/components/ScenarioExplorerView.tsx` | `GET /api/scenarios/metrics` | `benchmarkMetrics: BenchmarkMetri...` | Updates dynamically when new custom scenarios are executed. | CommandCenterView (Section 1) | Demonstrates measurable resilience across dozens of operational variables. | "These 8 metric tiles quantify our stress-test performance: 94.2% punctuality preserved and a 42% reduction in secondary delay during major disruptions." |
| S18-C03 | **Scenario Category Filter & Search Bar** | 🟧 `FORM` | Filter & Search Toolbar | Search Bar (x: 280-1890, y: 280-340) | Search input paired with category buttons: 'ALL (29)', 'WEATHER (6)', 'MECHANICAL (8)', 'SIGNALING (7)', and 'TRAFFIC (8)'. | Enables rapid filtering of the 29 scenarios by operational category. | Click category pill to filter; type in search box to find specific disruption types. | `frontend/src/components/ScenarioExplorerView.tsx` | `Client-side state filter` | `activeCategory: string, scenario...` | Displays clear search button when query text is entered. | 29 Scenarios Coverage Matrix | Allows rapid access to specialized contingency procedures. | "This filter bar categorizes our 29 scenarios into Weather, Mechanical, Signaling, and Traffic disruptions, allowing instant retrieval." |
| S18-C04 | **29 Scenarios Coverage & Robustness Matrix** | 🟪 `CARD` | Interactive Card Matrix | Mid Canvas Area (x: 280-1890, y: 360-780) | Grid of 29 interactive scenario cards, each featuring scenario title, category chip, severity rating, and pass badge. | Presents the complete library of railway disruption test cases. | Click on any scenario card to inspect its disruption parameters and run a live simulation. | `frontend/src/components/ScenarioExplorerView.tsx` | `GET /api/scenarios` | `scenarios: ScenarioItem[], selec...` | Maintains 100% test pass status across all 29 cards. | AnomalyHandlingView (Section 5) | Standardizes emergency response procedures across all divisional control rooms. | "This matrix displays our full library of 29 scenarios, allowing controllers to click any card to inspect simulated disruption parameters." |
| S18-C05 | **Scenario Detail & Stress-Test Executor** | 🟩 `ACTION` | Execution Action Panel | Bottom Area (x: 280-1890, y: 800-950) | Panel with 'SIMULATE & STRESS-TEST SCENARIO' button, parameters preview, and output comparison summary. | Executes live simulation of the selected scenario and evaluates optimizer recovery. | Click button to run simulation; watch live solving spinner and inspect generated recovery metrics. | `frontend/src/components/ScenarioExplorerView.tsx` | `POST /api/scenarios/:id/simulate` | `simulatingScenarioId: string \| n...` | Runs in sandbox without altering live operational data. | WhatIfSimulatorView (Section 12) | Ensures timetables are tested against severe disruptions before they ever go live. | "Clicking simulate executes the stress-test in memory, proving that our optimizer recovers timetable flow within 2 seconds without human panic." |

---
