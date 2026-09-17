# HANDOFF — SIH-2026 Automatic Block Planning (PS-26027)

> For the next AI/engineer taking over. Everything here is verified against the
> tree at `rl_2/SIH-2026`, commit `9ba67d8` + uncommitted Phase 0–C work.
> No tribal knowledge assumed: every claim has a file:line ref and a verify command.

---

## 1. Project snapshot

* **Problem:** SIH PS-26027 — AI-powered automatic block planning to maximize asset
  availability for train operations (TMS/SMMS/TDMS + BDMS + COA → prioritized,
  coordinated, weekly+monthly block schedules).
* **Repo:** `/home/deadass/Desktop/sih/rl_data/rl_2/SIH-2026`
  (`origin https://github.com/Apurva-Banerjee/SIH-2026.git`, branch `main`).
* **Target architecture (locked, do not regress):**
  `Python (AI: seed → score → optimize → validate) → writes buffer tables → Go serves ALL external /api/* → Postgres in production.`
  Flask (`backend/server.py`) is legacy fallback only; new code must never add Flask request-path logic.
* **Key files:** `engine/` (Python workers), `backend/main.go` (Go Fiber gateway :3000),
  `backend/server.py` (Flask legacy :8765), `frontend/src` (React 18 + Vite),
  `engine/schema.sql` (24 tables + 7 views), `docker-compose.yml` + `docker/entrypoint.sh` (prod).

### 1.1 Environment map (critical — read before running anything)

| Thing | Address | Purpose | DO NOT |
|---|---|---|---|
| `pg-verify` container | `127.0.0.1:5544` | Throwaway PG16 for verification | Assume it persists; recreate per session if gone (`scripts/verify-postgres.sh`) |
| Parent deployment | `:8765` + `:5433` (`block_planning_app/_db`, up 11h+) | OTHER project (parent dir) | Kill, write to, or trust its responses — Go proxy fallbacks hit it when DB is down, producing confusing foreign 404s |
| Repo `engine/block_planning.db` (52 MB) | working tree | Upstream 12K dataset bytes (md5 `7d3f2fd3…`) | Regenerate/overwrite in place — always work on `/tmp/*.db` copies and restore |
| Repo `engine/optimized_schedule.csv` | working tree | Upstream bytes (md5 `495f47ea…`) | Same — optimizer writes here by fixed path; back up first, restore after |
| `.venv` | `/home/deadass/Desktop/sih/rl_data/.venv` (py3.11) | All Python runs use `…/.venv/bin/python` | System python (missing joblib/flask) |

### 1.2 Boot / verify commands

```bash
# Backend (Go):          cd backend && go build ./... && go test ./...
# Frontend:              cd frontend && npm install && npx tsc --noEmit && npm run build
# Python single-task:    engine/.venv-python -c "..."  (always with sys.path including backend+engine)
# Scratch-DB pattern:    cp engine/block_planning.db /tmp/x.db
#                        DATABASE_URL="sqlite:////tmp/x.db" .venv/bin/python engine/<script>.py
# PG gate:               sh scripts/verify-postgres.sh   (throwaway PG16 on :5545, full chain)
# Full chain (either):   priority_engine → optimizer_core --horizon-days 7|30 → test_suite.py (expect 12/12)
# Go live test:          DATABASE_URL=... PORT=3559 /tmp/bpX  (setsid+nohup, then curl; fuser -k PORT/tcp to stop)
```

---

## 2. Achieved (all verified, details + proof)

### Phase 0 — integrity wiring
* **B1 `engine/priority_engine.py:64-73,128-134`** — urgency computed BEFORE risk;
  `days_overdue` injected into `risk_service` features (was always 0.0, killing the
  `overdue*0.12` term) and returned in output. *Proof:* 2402 tasks, 0 nulls, 1149 overdue rows; fallback R 0.65→0.90 on overdue.
  *Known limit:* champion DecisionTree predicts floor 0.05 regardless — real R-boost needs retraining (§3.9).
* **B2 `backend/server.py:407+`, `backend/main.go:884+`** — both submit paths score via
  `100*R*I(C)*U` + ≥92.5 override (deleted twin 60/40 implementations; Go validates then proxies).
  *Proof:* Broken Rail Weld → Critical 96.4 + override (legacy said 85.0); `go build`+`go test` green; `SubmitTab.tsx:314` only reads `computed_priority_score`.
* **B3 `engine/ingest_feeds.py:82-113`** — FEED rows backfill section/corridor/dept from asset master;
  `department_feeds` PK (`feed_id`) + `ingested_at` fixed (old INSERT failed NOT-NULL/PK). *Proof:* scratch-DB ingest test.
* **B4 both impacts** — `?horizon_days=` (schedule-span default, clamp 1–90) + fixed `trains_affected`
  (was collision count) + computed on-time. *Proof:* 7d→456 trains, 30d→3918 trains.

### Phase A — Postgres parity + fail-closed
* **A1** `engine/schema.sql` views → portable DROP+CREATE; removed 2 same-name views that can never
  exist; `AUTOINCREMENT`→`SERIAL` translation in `engine/db_helper.py` + `docker/entrypoint.sh`;
  seeder `INSERT OR REPLACE`→`ON CONFLICT` (`engine/seed_diversified_12k.py:95`).
  *Proof:* fresh PG16 → 24 tables + 7 views, seed 252,054 rows.
* **A2** fail-fast: explicit-URL PG failure raises (`db_helper.py`), Go `Ping` failure fatal with
  explicit DB env, both `/api/health` DB-aware (503 degraded vs false 200).
* **A3** `scripts/verify-postgres.sh` — throwaway-PG full-chain gate (rule: no backend change is done
  until SQLite AND PG chains pass).

### Atomic publish (safety-critical, fail-closed)
* `engine/optimizer_core.py:241+` — validate-before-write, abort on empty/uncertified, tmp+fsync+rename CSV,
  versioned copy, manifest row (`schedule_versions`: version/sha256/validation JSON), `CERTIFIED` block stamps.
  *Proof:* manifest hash == published CSV sha256; 302/302 blocks stamped; `test_suite` 12/12 on 12K data
  (optimizer 1812 tasks / 302 blocks, validator PASS).
* Gotcha fixed along the way: `get_db_engine()` ignored sqlite `DATABASE_URL` (hardcoded repo path),
  so "isolated" runs overwrote the repo DB. Now explicit URL always wins + prints which DB it uses.
  Always assert `engine.url` in scratch tests.

### Phase B — buffer contract
* `scheduled_tasks` table (`schema.sql` + `_ensure_buffer_tables` migration in `db_helper.py`) written
  atomically with blocks + manifest; CSV is export-only.
* Go + Python `/api/schedule` read buffer first (CSV legacy fallback); `?version_id=` pins (mismatch → 404
  naming live version). Go-native `/api/kpis` (joins real risk, beats Python's 0.45 default),
  `/api/blocks/detailed`, `/api/compatibility`.
* *Proof:* Go live on PG served 1812 buffered tasks, KPIs (consolidation 38.9%, EDR 39.2%), bad-version 404.

### Phase C — Go owns all APIs
* **C1** 19 native read routes (`failures`, `assets`×3, `windows`, `resources`, `goods-forecast`,
  `sections/risk`, `task compat/dependencies/actions`, `dashboard/summary`, `audit`, `anomalies`×3,
  `data-quality`×2, `models/versions`) via `queryMaps` + `allowlistedTables` + `requireDB` (`main.go`).
* **C2** native writes in single transactions: `approvals` GET/POST, `plans/:id/approve` (both refuse
  re-approving APPROVED — W4 seal), ingestion preview/validate/commit/runs. Python dynamic-table routes
  allowlisted too (`ALLOWLISTED_TABLES` in `server.py`).
* **C3** native `what-if` + `what-if/scenario`, `ml/benchmark`, `ml/explain` (SELECT + fallback port);
  worker-exec (no Flask) for `evaluation`, `coordination/candidates`, `plans/:id/validate`,
  `risk/predict`, async `models/retrain` + status. Fixed along the way: `$1`-with-2-args bug (×2),
  engine stdout chatter breaking JSON parse (span extractor), Python `NaN` breaking Go parser (regex sanitize),
  `import pandas` vs `pd.` typo.
* *Proof:* 30+ routes 200 with `source: buffer-go/worker-py`; key-shapes identical to Python (Go adds only
  `source`); fake-approve 409; approval write + revert; `go build`/`go test` green.

---

## 3. Remaining vs SIH description (build in §5 order)

1. **Optimizer ignores `block_windows` + `goods_forecast`** — `optimizer_core.py:110-126` hardcodes
   night/midday slots per section; zero `SELECT` of either table (only display APIs read them).
   *DoD:* windows built from `AVAILABLE` rows; freight counts feed the T-factor/penalty. Files: `optimizer_core.py`, `impact_engine.py`.
2. **Solver is greedy, not CP-SAT** — sole `CpModel()` at `optimizer_core.py:108`, no `Solve/Add`;
   per-section first-fit (`:147-241`); `objective_value = len()` (`:337`); hardcoded `OPTIMAL`;
   `resource_map` (`:98-100`) dead; windows infinitely reusable. *DoD:* real `Add/Minimize/Solve` +
   `AddCumulative` resources + `max_solver_time` honored + solver status reported — or rename to heuristic honestly.
3. **Downtime only post-hoc, partly synthetic** — no downtime term in solver; `evaluation_engine.py:85,86,127,128`
   (`*1.35`, `min(65…)`, `*0.72`, `+18`) and `scenario_engine.py:48,86,100` (`*1.25`, `48.5`, `14`) are
   invented constants. *DoD:* move downtime/availability into the objective; label or remove estimates.
4. **Compatibility stubs + inconsistency** — `isolation/dependencies/operations` hardcoded True
   (`compatibility_engine.py:56,59,80`); 2 vs 3 banned pairs and 2.5× vs 3.0× across the two engines;
   no KM-distance, due-window, dept-rules, 500m clearance (spec `MATHEMATICAL_MODEL_V2.md:128-134`).
   *DoD:* one engine, all checks real and unified.
5. **Monthly UI faked** — `WeeklyMonthlyView.tsx:11,43,53` toggle is local state; `:176` heatmap is
   `len/4` synthetic math; `Header.tsx:17` static label; `App.tsx:56` never passes `horizon_days` to `/impact`.
   Gantt 7/30 toggle IS wired. *DoD:* monthly generates horizon-30, renders weeks 2–4 from `?version_id=`, no synthetic counts.
6. **BDMS staging-only** — `department_feeds` has no lifecycle/status/window columns (`schema.sql:340-348`);
   submit writes `Pending` only; acknowledged unknown in `docs/research-remaining.md:11,30,57-59`.
   *DoD:* `REQUESTED/APPROVED/REJECTED/GRANTED` + requested window + notice fields + state machine.
7. **Overdue invisible in UI** — `due_date/days_overdue` not in `/api/tasks` (`server.py:299-309`);
   no Due/Overdue column/filter in `TasksView.tsx:164-177`; `AIPriorityView.tsx:188-189` hardcodes "27 days overdue".
   *DoD:* live overdue column + filter + real explanation value.
8. **Calibration unproven** — `ml_model_meta.json` shows PR-AUC 1.0/Brier 0.0 (leakage smell);
   `CalibratedClassifierCV` imported never fitted (`multi_model_benchmark.py:27`); feature lists diverge
   (10 vs 29). *DoD:* isotonic calibration + reliability curve + ECE + leakage investigation.
9. **Doc/code constant drifts** — D `dur/120` vs spec `/360` (`impact_engine.py:30`); bands 88/70/45 vs spec
   80/60/35 (`priority_engine.py:115-122`); A 1.0/0.5 vs spec 1.0/0.6. *DoD:* one source of truth.
10. **Approval/content decoupling (W4)** — approval flips flags; content can drift underneath; UI approves
    "latest" while API approves explicit ID. Partially sealed (re-approval refused). *DoD:* optimistic-lock
    approval bound to explicit `version_id` end to end.

---

## 4. Traps (learned the hard way)

* Assert `engine.url` / `DATABASE_URL` in every scratch test; never trust "isolated" without proof.
* `engine/block_planning.db` + `optimized_schedule.csv` are upstream bytes — back up, work on copies, `diff`/md5 before finishing.
* Optimizer/retrain write into the repo dir by fixed paths (`SCHEDULE_CSV`, versioned copies, `.pkl`); back up + restore + delete strays; versioned CSVs are gitignored.
* Proxy fallbacks can serve the parent deployment's responses — a 404 with no Go error log means passthrough, not a router miss.
* lib/pq: arg count must equal highest `$N` even if a placeholder repeats; Go `json.Unmarshal` rejects Python `NaN`; engine stdout chatter must be stripped before JSON parse.
* Known live processes (leave alone): `block_planning_app/_db` containers (:8765/:5433), `./block_planner` PID 2294.
* `gofmt -l` flags pre-existing alignment style — do not whole-file reformat (noisy diffs).

---

## 5. Suggested build order

1. Items §3.1 + §3.5 (data-use + monthly UI) — visible judge wins, no math risk.
2. Item §3.2 (solver) — biggest honesty risk; behind it §3.3 + §3.4 fall out naturally.
3. Items §3.7 + §3.9 (overdue UI + constant alignment) — fast, high trust.
4. Item §3.8 (calibration) — needs real failure data; time-box it.
5. Item §3.6 (BDMS) + §3.10 (approval lock) — governance polish for finals.
