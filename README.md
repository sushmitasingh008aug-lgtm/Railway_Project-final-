# AI-Powered Automatic Block Planning System for Indian Railways 🚆⚡

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://www.sih.gov.in/)
[![Go](https://img.shields.io/badge/Backend-Go%20Fiber-00ADD8.svg)](https://gofiber.io/)
[![Google OR-Tools](https://img.shields.io/badge/ML-CP--SAT-orange.svg)](https://developers.google.com/optimization)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED.svg)](https://docs.docker.com/compose/)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL%2016-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

An industrial-grade, AI-driven maintenance block planning and corridor optimization platform developed for **Indian Railways (Ministry of Railways)**. The system unifies decentralized maintenance requests across Engineering, Traction Distribution, and Signalling departments, calculates explainable priority scores, and formulates optimal corridor block schedules using Google OR-Tools CP-SAT constraint programming — all served by a single **Go Fiber** API with a **PostgreSQL 16** backend, fully containerized with **one command**.

**Runs identically on Windows (WSL2/Docker Desktop), Linux, and macOS.**

---

## 🚀 One-Command Start (Docker)

```bash
# 1. Clone
git clone https://github.com/cluelessbaj/automatic-block-planning.git
cd automatic-block-planning

# 2. Configure (ports pre-fixed to 8765/5433 — no conflicts)
cp .env.example .env

# 3. Build + Start (first build ~3-5 min; rebuilds are fully cached, ~seconds)
docker compose up --build -d

# 4. Verify
docker compose ps                      # both containers should be "healthy"
docker compose logs -f app             # watch: Schema ensured → Seeding → OPTIMAL → Go listening

# 5. Open
#    UI:  http://localhost:8765
#    API: http://localhost:8765/api/health
```

### Stopping / Cleanup

```bash
docker compose down        # stop & remove containers — pgdata volume KEPT (data safe, instant restart)
docker compose down -v     # ⚠ ALSO deletes pgdata — next up does a full re-seed (~1 min)
docker system prune -f     # optional: reclaim dangling build cache
```

### What happens on first `up`

The `docker/entrypoint.sh` automatically:
1. Waits for PostgreSQL to be healthy
2. Ensures the DB schema (`CREATE TABLE IF NOT EXISTS` + geometry column migration)
3. Seeds if empty: 12 sections, ~19.5k assets (spatially assigned to nearest section), 200+ tasks, ~700 train movements
4. Runs the 60/40 priority engine, then the CP-SAT optimizer (`OPTIMAL` in ~5s)
5. Starts the Go API serving both UI and API on port **8765**

On every restart with existing `pgdata`: seeding is **skipped** (data preserved), and the schedule CSV is regenerated only if missing.

### Portability notes (per OS)

| OS | Requirement |
|---|---|
| **Linux (Arch/Ubuntu/Debian)** | `sudo pacman -S docker docker-compose` (or `apt install docker.io docker-compose-plugin`) → `sudo systemctl enable --now docker` → `sudo usermod -aG docker $USER` (re-login) |
| **Windows 11** | Docker Desktop with **WSL2 backend** enabled; run commands from Ubuntu/WSL terminal; `git config --global core.autocrlf input` before cloning |
| **macOS** | Docker Desktop, or `brew install colima docker docker-compose && colima start` |

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

- **Unified Departmental Feed Ingestion**: Ingests and normalizes BDMS-style CSV drops from **TMS** (Engineering), **TDMS** (Traction Distribution), and **SMMS** (Signal & Telecom) into a single relational schema with `source_system` provenance.
- **Explainable Priority Engine (60/40 Rule)**: Maps risk to a 0–100 scale using `60% Criticality + 40% Urgency`, deterministic and auditable.
- **ML Benchmark Pipeline**: Multi-model XGBoost benchmark (`engine/eda_and_ml_pipeline.ipynb`) driving runtime criticality rescoring.
- **Google OR-Tools CP-SAT Corridor Optimization Engine**:
  - **Line-aware train walls**: maintenance blocks never collide with same-direction train movements (double-line working: `UP`/`DOWN`/`BOTH`).
  - **Pairwise Combined Block Reification (`COMBINED_BONUS = 150`)**: merges cross-department maintenance into shared corridor closures.
  - **Resource Capacity Bounds (`AddCumulative`)**: respects machinery limits (tampers, OHE wagons, signal rigs).
  - **Indian Railways 12:00–18:00 Peak Traffic Ban**: non-critical blocks prohibited during peak passenger hours.
- **Multi-Horizon Support**: `horizon_days=7` (weekly) or `30` (monthly) via API parameter.
- **PostgreSQL 16 Only (crash-safe)**: `pgdata` named volume with `fsync=on`, WAL, `stop_grace_period: 30s` — survives `kill -9`, power loss, and container rebuilds. No data loss on restart.
- **Single Go Fiber API (Port 8765)**: serves both the REST API and the built React UI from one binary — no CORS, minimal latency. Python is used only as the optimizer worker (`engine/optimizer_core.py`).
- **Govt-Grade Network Map**: dots plotted at **true asset GPS** (OSM coordinates) on **true curved rail geometry** (`export.geojson` → `sections.geometry` LineStrings), not straight-line approximations.
- **Interactive Dashboard**: React 18 + TypeScript + Vite + Tailwind — executive dashboard, master Gantt with train overlay, network map, demand submission, reports, alerts, settings.
- **Automated Verification Suite**: 8-point engine physics and compliance verification (`test_suite.py`), runnable live from the UI.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                        1. FRONTEND PRESENTATION LAYER                             |
|         React 18 + TypeScript + Vite + Tailwind (served by Go on :8765)           |
|  Dashboard · Gantt + Train Overlay · Network Map (true GPS) · Demand · Reports    |
+-----------------------------------------+-----------------------------------------+
                                          | Same-origin REST (/api/*)
                                          v
+-----------------------------------------------------------------------------------+
|                     2. GO FIBER API & ORCHESTRATION LAYER (:8765)                 |
|  /api/metrics · /api/schedule/generate (async CP-SAT) · /api/tasks/submit         |
|  /api/sections (curved geometry) · /api/trains · /api/tests/status · /api/impact  |
+-----------------------------------------+-----------------------------------------+
                      |                                       |
                      v                                       v
+---------------------------------------+   +---------------------------------------+
|     CP-SAT OPTIMIZATION WORKER        |   |      PRIORITY / ML SCORING            |
|  Python 3.11 + OR-Tools (optimizer_   |   |  60/40 explainable + ML benchmark     |
|  core.py) — exec'd by Go on demand    |   |  rescoring                            |
+---------------------------------------+   +---------------------------------------+
                      |                                       |
                      +-------------------+-------------------+
                                          | SQLAlchemy / lib/pq
                                          v
+-----------------------------------------------------------------------------------+
|                     3. POSTGRESQL 16 PERSISTENCE (pgdata volume)                  |
|  fsync=on · WAL · crash-safe · named volume rl_pgdata                             |
|  sections (+geometry LineStrings) · assets (true GPS) · maintenance_tasks         |
|  train_movements (UP/DOWN) · resources · department_feeds (TMS/TDMS/SMMS)         |
+-----------------------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
automatic-block-planning/
├── Dockerfile                       # 3-stage: node (UI) → golang (API) → python (optimizer)
├── docker-compose.yml               # postgres + app, pgdata volume, healthchecks
├── docker/entrypoint.sh             # idempotent schema-ensure + seed + optimizer
├── .env.example                     # fixed free ports: app 8765, postgres 5433
├── backend/
│   ├── main.go                      # Go Fiber API + static UI + SPA fallback (port 8765)
│   └── server.py                    # Legacy Flask API (dev reference; Go is production)
├── engine/
│   ├── schema.sql                   # PostgreSQL DDL (incl. sections.geometry)
│   ├── db_helper.py                 # Postgres-only fail-fast connection helper
│   ├── transform_and_seed.py        # Seeder: haversine spatial asset→section assignment
│   ├── derive_section_boundaries.py # True OSM rail geometry extraction (LineStrings)
│   ├── ingest_feeds.py              # TMS / TDMS / SMMS department feed ingestion
│   ├── priority_engine.py           # 60/40 Explainable Priority Scoring Engine
│   ├── optimizer_core.py            # Google OR-Tools CP-SAT Solver Engine
│   ├── test_suite.py                # Automated 8-Point Verification Suite
│   ├── requirements.runtime.txt     # 6 runtime deps (pandas, ortools, …) — used in Docker
│   ├── requirements.txt             # runtime + report/ML deps (host-only: xgboost, shap…)
│   ├── section_geography.json       # True curved geometry per section
│   ├── export.geojson               # OSM rail extract (ground truth)
│   ├── historical_ml_dataset.csv    # Historical asset dataset (PDF Sec 7)
│   └── data_feeds/                  # Sample department feed drops
├── frontend/                        # React 18 + TypeScript + Vite + Tailwind Dashboard
│   └── src/components/              # Dashboard, Gantt, MapView (true GPS dots), Submit, …
├── docs/                            # Research notes & strategy audit
└── README.md
```

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8765` | Host port for the app (UI + API). Chosen to avoid common dev conflicts. |
| `POSTGRES_PORT` | `5433` | Host port for PostgreSQL (container-internal stays 5432). |
| `POSTGRES_DB/USER/PASSWORD` | `block_planning/postgres/postgrespassword` | DB credentials. |
| `DATABASE_URL` | `postgresql://…@postgres:5432/block_planning?sslmode=disable` | Internal connection (service DNS). |
| `HORIZON_DAYS` | `7` | Default planning horizon for the auto-run optimizer. |
| `VITE_API_URL` | `/api` | Same-origin API base for the built frontend. |

---

## 🧪 Automated Verification Suite Matrix (`test_suite.py`)

| Test ID | Test Name | Category | Details |
|---|---|---|---|
| **1.1** | Geospatial Link | SQL | 100% of physical assets mapped to valid operational sections. |
| **1.2** | Timetable Chronology | SQL | Zero temporal causality violations (`exit_time > entry_time`). |
| **2.1** | Priority Score Bounds | Python | Scores strictly bounded in [0.0, 100.0] with 60/40 explainability. |
| **2.2** | Execution Completeness | Python | 100% of pending maintenance backlog scored deterministically. |
| **3.1** | Train Precedence Collision Check | CP-SAT | Zero line-aware temporal collisions with moving trains. |
| **3.2** | Resource Saturation Check | CP-SAT | Machinery and department capacities strictly respected. |
| **4.1** | Combined Block Structure | CP-SAT | Multi-department groups: ≥2 depts, same section, starts within 15 min. |
| **5.1** | IR Peak Traffic Restriction | CP-SAT | 0 non-critical blocks during 12:00–18:00 peak window. |

Run live from the UI (**Alerts → Run Verification**) or via API: `curl http://localhost:8765/api/tests/status`.

---

## 📡 REST API Specifications

Base URL: `http://localhost:8765/api`

| Endpoint | Method | Function |
|---|---|---|
| `/api/health` | GET | Liveness probe (used by Docker healthcheck). |
| `/api/metrics` | GET | Executive KPIs, department workloads, priority distribution, combined-block stats. |
| `/api/tasks` | GET | Top 250 prioritized pending maintenance tasks. |
| `/api/sections` | GET | 12 sections **with true curved geometry** (LineString coordinates). |
| `/api/trains` | GET | Train movements as minutes relative to plan base time (Gantt overlay). |
| `/api/schedule` | GET | Scheduled blocks **with true asset GPS (`lat`/`lon`)** and combined group IDs. |
| `/api/schedule/generate?horizon_days=7\|30` | POST | Triggers CP-SAT solver asynchronously. |
| `/api/schedule/status` | GET | Polls background solver status + output tail. |
| `/api/tasks/submit` | POST | Submits a block request; computes 60/40 priority; inserts into DB. |
| `/api/tests/status` | GET | Runs `test_suite.py` on-demand; returns pass/fail per test. |
| `/api/impact` | GET | Simulates traffic-blind baseline vs CP-SAT plan; returns delay eliminated. |

---

## 🗺️ Network Map Accuracy

The Network Map view is built for audit-grade accuracy:

- **Dots** are plotted at the **true asset GPS coordinates** stored in `assets.location_lat/lon` (sourced from OSM rail data), not synthetic interpolation.
- **Lines** render the **true curved track geometry** extracted from `export.geojson` into `sections.geometry` (per-section LineStrings, up to ~200 vertices each).
- **UP/DOWN** blocks are offset ±1.6 km perpendicular to the **local track segment azimuth** (double-line working), not a straight-chord normal.
- Assets are assigned to sections via **haversine nearest-section** spatial matching — not name heuristics.

---

## 📄 Documentation & Reports

- **30-Page Technical PDF Report**: [`SIH_2026_Automatic_Block_Planning_Comprehensive_Report.pdf`](SIH_2026_Automatic_Block_Planning_Comprehensive_Report.pdf)
- **Jupyter EDA & ML Notebook**: [`engine/eda_and_ml_pipeline.ipynb`](engine/eda_and_ml_pipeline.ipynb)
- **Research notes**: [`docs/research-found.md`](docs/research-found.md), [`docs/research-remaining.md`](docs/research-remaining.md)

---

## 🛠️ Local (non-Docker) Development

```bash
# Frontend dev server with hot reload (proxies /api → :8765)
cd frontend && npm install && npm run dev   # http://localhost:5173

# Go API directly
cd backend && DATABASE_URL="postgres://postgres:postgrespassword@localhost:5433/block_planning?sslmode=disable" go run main.go

# Optimizer manually (requires runtime pip deps)
pip install -r engine/requirements.runtime.txt
python engine/optimizer_core.py --horizon-days 7

# Report/ML extras (host only — not in Docker image)
pip install -r engine/requirements.txt
```

---

## 📜 License & Acknowledgments

This project is developed for **Smart India Hackathon (SIH) 2026** under the **Ministry of Railways, Government of India**.
Licensed under the **MIT License**.
