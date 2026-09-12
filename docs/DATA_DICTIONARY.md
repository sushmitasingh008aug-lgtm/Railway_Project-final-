# Indian Railways Unified Data Dictionary & Canonical Schema (Blueprint v2)

## 1. Overview & Source Systems Mapping

The canonical data contract integrates four operational Indian Railways source systems into a unified relational schema:

| Source System | Acronym | Department | Operational Domain | Canonical Tables Fed |
| :--- | :--- | :--- | :--- | :--- |
| **Track Management System** | **TMS** | Engineering | Permanent Way (P-Way), Rail, Weld, Sleepers, Ballast | `ASSET_MASTER`, `MAINTENANCE_TASKS`, `INSPECTIONS` |
| **Traction Distribution Management System** | **TDMS** | Traction (TRD) | 25kV OHE, Catenary, Droppers, Insulators, Sub-stations | `ASSET_MASTER`, `MAINTENANCE_TASKS`, `INSPECTIONS` |
| **Signalling Maintenance & Management System** | **SMMS** | S&T | Electronic Interlocking, Axle Counters, Track Circuits, Point Machines | `ASSET_MASTER`, `MAINTENANCE_TASKS`, `INSPECTIONS` |
| **Control Office Application** | **COA / FOIS** | Operating | Timetabled Passenger Movements, Goods Train Density | `TRAIN_OPERATION_HISTORY`, `BLOCK_AVAILABILITY`, `GOODS_TRAIN_FORECAST` |
| **Unified Incident Management System** | **UIMS** | Safety / Operations | Sectional Asset Failures, Punctuality Loss, Detentions | `FAILURE_EVENT_HISTORY` |

---

## 2. Canonical Tables & Columns Specification

### 2.1 ASSET_MASTER (`assets`)
Authoritative physical asset registry mapped across operational railway corridors.

| Column | Type | Nullable | Description | Source System |
| :--- | :--- | :--- | :--- | :--- |
| `asset_id` | `VARCHAR(50)` | NO | Primary Key (e.g., `ENG-1455434121`, `TRD-889104523`) | TMS / TDMS / SMMS |
| `asset_number` | `VARCHAR(60)` | YES | Official IR asset inventory tag (`IR-ENG-034121`) | Departmental Master |
| `asset_type` | `VARCHAR(50)` | NO | Asset category (`Track`, `OHE`, `Signal`) | TMS / TDMS / SMMS |
| `asset_subtype` | `VARCHAR(80)` | YES | Specific technical model (`60kg UIC Rail`, `LED 4-Aspect Signal`) | Technical Specs |
| `department` | `VARCHAR(50)` | NO | Operational department (`Engineering`, `Traction`, `S&T`) | Master |
| `zone` | `VARCHAR(10)` | NO | Railway Zone (`NR`, `ECR`, `NCR`) | Divisional Master |
| `division` | `VARCHAR(10)` | NO | Railway Division (`LKO`, `DDU`, `ALD`) | Divisional Master |
| `corridor_id` | `VARCHAR(50)` | NO | Foreign key to `corridors` (`CORR_BSB_LKO`, `CORR_HWH_DLI`) | IR Network Model |
| `section_id` | `VARCHAR(50)` | NO | Foreign key to `sections` (`SEC_BSB_LKO_02`) | IR Network Model |
| `block_section` | `VARCHAR(100)` | YES | Signalling block section (`SEC_BSB_LKO_02_BLK`) | SMMS / COA |
| `chainage_km` | `FLOAT` | YES | Kilometric chainage position from zone origin | Engineering Log |
| `direction` | `VARCHAR(10)` | NO | Track orientation (`UP`, `DOWN`, `BOTH`) | P-Way Register |
| `location_lat` | `FLOAT` | NO | Geospatial Latitude (WGS-84) | TMS-Nirikshan GPS |
| `location_lon` | `FLOAT` | NO | Geospatial Longitude (WGS-84) | TMS-Nirikshan GPS |
| `commissioning_date` | `DATE` | YES | Date asset was placed into revenue service | Asset Ledger |
| `asset_age_years` | `INT` | NO | Elapsed service life in years | Calculated |
| `asset_importance` | `FLOAT` | NO | Operational weight factor in $[0.1, 1.0]$ | Divisional Rule |
| `criticality_class` | `VARCHAR(5)` | NO | Asset consequence class (`A+`, `A`, `B`, `C`) | IR Engineering Code |
| `condition_score` | `INT` | NO | Present physical condition rating ($0-100$) | NDT / Inspection |
| `health_index` | `INT` | NO | Composite health index ($0-100$) | ML Predictive Score |

---

### 2.2 MAINTENANCE_TASKS (`maintenance_tasks`)
Consolidated departmental maintenance demand backlog awaiting corridor possession allocation.

| Column | Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `task_id` | `VARCHAR(50)` | NO | Primary Key (e.g., `TSK_1013`) |
| `source_system` | `VARCHAR(20)` | NO | Source provenance tag (`TMS`, `SMMS`, `TDMS`) |
| `department` | `VARCHAR(50)` | NO | Requesting department |
| `asset_id` | `VARCHAR(50)` | NO | Target asset foreign key |
| `section_id` | `VARCHAR(50)` | NO | Target operational section |
| `task_type` | `VARCHAR(100)` | NO | Canonical task title (`Track Circuit Short`, `Broken Rail Weld`) |
| `criticality` | `VARCHAR(20)` | NO | Consequence rating (`Critical`, `High`, `Medium`, `Low`) |
| `safety_impact` | `VARCHAR(20)` | NO | Safety hazard level (`Critical`, `High`, `Medium`, `Low`) |
| `urgency` | `VARCHAR(20)` | NO | Operational urgency band |
| `due_date` | `DATE` | NO | Hard compliance deadline for regulatory safety |
| `duration_minutes` | `INT` | NO | Estimated net possession window duration |
| `priority_score` | `FLOAT` | NO | Expected-Loss Priority score $Priority_i \in [0, 100]$ |
| `risk_probability` | `FLOAT` | YES | ML 30-day failure probability $R_i \in [0, 1]$ |
| `required_resources`| `VARCHAR(100)` | YES | Machine/Gang requirement (`Track Tamper Machine`, `Tower Wagon`) |
| `isolation_requirement` | `VARCHAR(100)` | YES | Line isolation rule (`Power Block`, `Track Possession`) |
| `affects_line` | `VARCHAR(10)` | NO | Track closure requirement (`UP`, `DOWN`, `BOTH`) |
| `status` | `VARCHAR(30)` | NO | Lifecycle state (`Pending`, `Scheduled`, `Completed`, `Cancelled`) |

---

### 2.3 FAILURE_EVENT_HISTORY (`failure_event_history`)
Government-standard incident record capturing historical equipment failures and train detentions.

| Column | Type | Description |
| :--- | :--- | :--- |
| `af_id` | `VARCHAR(50)` | Primary Key (`AF_2026_5001`) |
| `uims_id` | `VARCHAR(50)` | UIMS official incident ID (`UIMS_NR_5001`) |
| `failure_type` | `VARCHAR(100)` | Technical failure classification |
| `failure_start` | `TIMESTAMP` | Time failure was reported by Station Master |
| `failure_end` | `TIMESTAMP` | Time section was certified and restored |
| `failure_duration_min` | `INT` | Total minutes line was blocked |
| `trains_delayed` | `INT` | Number of passenger and goods trains impacted |
| `total_detention_min` | `FLOAT` | Cumulative train delay caused by incident |
| `cause` | `TEXT` | Primary physical root cause (e.g., `Fatigue / Thermal Stress`) |
| `subcause` | `VARCHAR(100)` | Specific component failure mode |
| `sm_remarks` | `TEXT` | Station Master operational log report |

---

### 2.4 BLOCK_AVAILABILITY (`block_windows`)
Authorized maintenance possession windows granted by Divisional Operating Control.

| Column | Type | Description |
| :--- | :--- | :--- |
| `block_id` | `VARCHAR(50)` | Primary Key (`BW_0001`) |
| `corridor_id` | `VARCHAR(50)` | Target railway corridor |
| `section_id` | `VARCHAR(50)` | Target section |
| `start_time` | `TIMESTAMP` | Allowed window start timestamp |
| `end_time` | `TIMESTAMP` | Allowed window finish timestamp |
| `duration_min` | `INT` | Possession duration (e.g., 180 min, 120 min) |
| `block_type` | `VARCHAR(50)` | `Corridor Integrated Block` or `Line Possession Block` |
| `availability_status` | `VARCHAR(30)` | `AVAILABLE`, `RESERVED`, `CLOSED` |
| `direction` | `VARCHAR(10)` | `UP`, `DOWN`, `BOTH` |
| `allowed_departments` | `VARCHAR(100)`| Permitted departments (`Engineering,Traction,S&T`) |

---

### 2.5 OPTIMIZED_BLOCKS (`optimized_blocks`)
Final CP-SAT scheduled maintenance blocks combining multi-department works.

| Column | Type | Description |
| :--- | :--- | :--- |
| `block_id` | `VARCHAR(50)` | Unique possession block ID (`CB_001`) |
| `version_id` | `VARCHAR(50)` | Plan governance version (`v2.0-approved`) |
| `section_id` | `VARCHAR(50)` | Physical corridor section |
| `start_time` | `TIMESTAMP` | Optimizer-assigned start time |
| `end_time` | `TIMESTAMP` | Optimizer-assigned end time |
| `duration_minutes`| `INT` | Total elapsed line possession duration |
| `task_count` | `INT` | Number of coordinated tasks executed within window |
| `departments` | `TEXT` | Departments executing work (`Engineering,S&T,Traction`) |
| `utilization_pct`| `FLOAT` | Effective productive work utilization percentage |
| `status` | `VARCHAR(30)` | Lifecycle state (`PROPOSED`, `APPROVED`, `REJECTED`) |

---

### 2.6 AUDIT_LOG (`audit_log`)
Immutable governance and regulatory tracking ledger.

| Column | Type | Description |
| :--- | :--- | :--- |
| `log_id` | `VARCHAR(80)` | Unique audit entry hash (`AUD_1789201948`) |
| `event_type` | `VARCHAR(80)` | Event tag (`PLAN_APPROVED`, `TASK_SUBMITTED`, `OVERRIDE_APPLIED`) |
| `entity_id` | `VARCHAR(80)` | Target entity identifier |
| `timestamp` | `TIMESTAMP` | ISO-8601 audit timestamp |
| `user_id` | `VARCHAR(80)` | Officer / Controller ID |
| `details_json` | `TEXT` | Complete JSON payload of modification or decision |
| `status` | `VARCHAR(30)` | Resulting status |
