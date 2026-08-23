# Coordinated Multi-Department Block Scheduling (CP-SAT) — Implementation Plan

**Status:** Approved 2026-08-23
**Goal:** Upgrade the CP-SAT engine so one corridor disruption serves all three departments
(Engineering + Traction + S&T), fed by per-department source systems modeled on the real IR stack —
closing GAP-1 (combined blocks, PS point 3a) and demonstrating PS point-1 integration.

**Domain mapping:** Engineering → **TMS** · Traction → **TDMS** · S&T → **SMMS**

---

## Phase 1 — Departmental data feeds & provenance

1. **Schema (`engine/schema.sql`)**
   - `maintenance_tasks` + column `source_system VARCHAR(10)` ('TMS' | 'TDMS' | 'SMMS' | 'SYNTHETIC')
   - New staging table `department_feeds` (feed_id, source_system, asset_id, raw_type, severity,
     reported_date, ingested_at) representing BDMS-style ingestion.
2. **New script `engine/ingest_feeds.py`**
   - Reads CSV drops from `engine/data_feeds/{tms,tdms,smms}.csv` → normalizes → inserts into
     `maintenance_tasks` with provenance.
   - Graceful skip when feed files absent (keeps current synthetic flow working).
3. **Update `transform_and_seed.py`**
   - Tag seeded tasks with department→system mapping above.
   - Emit sample feed CSVs under `engine/data_feeds/`.

## Phase 2 — CP-SAT combined-block engine (`optimizer_core.py`)

4. **Pairwise same-start reification:**

```python
for i, j in cross_dept_pairs_by_section:
    c = model.NewBoolVar(f"combined_{i}_{j}")
    model.AddImplication(c, task_presences[i])          # both tasks must be scheduled
    model.AddImplication(c, task_presences[j])
    model.Add(task_starts[i] == task_starts[j]).OnlyEnforceIf(c)  # co-timed entry
    objective_terms.append(COMBINED_BONUS * c)          # COMBINED_BONUS = 150
```

   - `COMBINED_BONUS = 150` (module constant; priority scores are 0–100 ×10).
   - Same start (enter corridor together), differing durations legal.
   - Complexity negligible: pairs per section only.

5. **Objective v2:** `max Σ presence·score·10 + Σ COMBINED_BONUS·c[i,j]`
6. **CSV output**: append trailing column `combined_group_id` (empty when solo).
7. **Horizon CLI arg**: `argparse --horizon-days` (default 7), replaces hardcoded horizon math.

## Phase 3 — Go API awareness of coordination

8. `ScheduledTask` struct + parser: optional 14th column `combined_group_id`.
9. `/api/metrics`: new fields `combined_blocks_count`, `disruptions_avoided`.
10. `/api/schedule/generate?horizon_days=7|30` → passed to optimizer CLI arg.

## Phase 4 — Validation & verification

11. **`test_suite.py` additions:**
    - Every combined group: ≥2 distinct departments, same section, identical start minute.
    - Zero train collisions still hold (regression guard).
    - Priority scores bounded [0,100].
12. **Run matrix:** `transform_and_seed.py` → `priority_engine.py` → `optimizer_core.py` →
    `test_suite.py` → `go test ./...` → restart API → verify combined-block counts > 0.

## Out of scope (deferred)
ML risk pipeline · traction/diesel pass-through + freight elasticity · frontend UI changes ·
monthly-horizon UI toggle.
