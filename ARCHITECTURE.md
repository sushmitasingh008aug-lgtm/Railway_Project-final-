# Architecture — In Simple Words

## 1. The Idea
- 3 departments ask for separate track closures.
- We put them in 1 shared closure when safe.
- Trains stop less. Tracks stay free more.
- Like hospital: patients = tracks, doctors = departments, operation slot = block.

## 2. Full Flow — Start, Middle, End

```
START (make data) → MIDDLE (rank + combine + schedule + check) → END (serve + show)
```

### START — Where data comes from
- Trigger: `python engine/transform_and_seed.py` by hand, or auto in Docker if DB is empty (`docker/entrypoint.sh` → seed → ingest → priority → optimizer).
- Base day is `2026-08-23`, horizon is 30 days, random seed 42 (same demo every run).
- What gets created:
  - 3 corridors (`BSB_LKO, HWH_DLI, DDU_YARD`), 12 sections.
  - ~19.5k assets from `mapped_assets.csv` matched to nearest section by GPS.
  - 350 past failures, ~220 repair tasks (each has 6 work steps = 1320 actions).
  - Trains: one section at a time, gap is long at night (00-04h) and short in day.
  - 720 windows: night `01:30-04:30 (180 min)` + midday `10:00-12:00 (120 min)`.
  - 1440 goods slots, 6 machines/crews, 120 inspections, 80 past repairs.
- Feed files: `engine/data_feeds/tms_engineering.csv, tdms_traction.csv, smms_sndt.csv`.
- Each feed row: `asset_id, raw_type, severity 1-4, reported_date`.
- Example: `ENG-1455434121, Broken Rail Weld, 1, 2026-08-23`.
- `ingest_feeds.py` reads them → adds `maintenance_tasks` rows + `department_feeds` log. Skips duplicates.

### MIDDLE — Rank, combine, schedule, check
- Step 1 Rank (which job first):
  - `risk_service.py` = chance it breaks in 30 days (R). ML model or fallback math.
  - `criticality_engine.py` = how bad if it breaks (C). Safety x route x importance.
  - `urgency_engine.py` = how late it is (U). Late = near 1, early = near 0.
  - `impact_engine.py` = how many trains it disturbs (I). Long job on busy line = high.
  - `priority_engine.py` = `Score = 100 x R x I x U`. Broken rail / OHE snap / signal blank always 92.5+.
- Step 2 Combine (which jobs share 1 closure):
  - `compatibility_engine.py` checks 8 things per pair: same section, same possession (BOTH-or-equal), safe power-cut, no tool clash (Tamper / Tower / Cleaner are exclusive), no bad combo (ballast work x signal lamp), time ratio under 2.5x, cross-department only.
  - `coordination_engine.py` bundles pass-pairs into `CB_001, CB_002...`. Time = longest job, not sum. Saving = sum − longest.
- Step 3 Schedule (when):
  - `optimizer_core.py` tries shadow blocks first, then single urgent jobs.
  - Only night `01:30-04:30` and midday `10:30-12:30` slots. Singles start +15 min inside slot.
  - Rule: block must end 10 min before a train OR start 10 min after it.
- Step 4 Check (is it safe):
  - `validator.py` re-checks all: train gap, job under 240 min, end after start, peak `12:00-18:00` warning.
  - Result: `PASS` = show, `PASS_WITH_WARNINGS` = show with caution, `FAIL` = hold.

### END — How plan reaches the judge
- Outputs written:
  - `engine/optimized_schedule.csv` — 18 columns: task, asset, dept, type, score, section, start/end minutes, start/end time, `combined_group_id`, line, lat/lon. ~219 rows.
  - DB `optimized_blocks` — one row per `CB_*` shared closure.
  - DB `ml_predictions` — score + reasons per task. DB `task_compatibility` — why pairs passed/failed.
- Serve:
  - Python `backend/server.py` on `:8765` = brain (schedule, tasks, trains, compatibility, risk, what-if, approve, KPIs).
  - Go `backend/main.go` on `:3000` = fast counter + proxy to brain + app hosting.
- Show: `frontend/src/App.tsx` fetches metrics + schedule + sections + trains at once, then routes to 14 screens below.

## 3. File Map — File | In | Out
| Step | File | In | Out |
|---|---|---|---|
| Collect | `engine/data_feeds/*.csv` | Raw TMS / TDMS / SMMS fault reports | Demo fault drops |
| Collect | `engine/ingest_feeds.py` | CSV drops | Clean `maintenance_tasks` + source log |
| Collect | `engine/transform_and_seed.py` | Assets + geography | Full DB: assets, tasks, trains, goods, windows |
| Rank | `engine/risk_service.py` | Asset health, age, overdue | Chance it breaks in 30 days (R) |
| Rank | `engine/criticality_engine.py` | Safety, route, importance | How bad if it breaks (C) |
| Rank | `engine/urgency_engine.py` | Due date vs today | How late it is (U) |
| Rank | `engine/impact_engine.py` | Duration, corridor, line | How many trains it disturbs (I) |
| Rank | `engine/priority_engine.py` | R + C + U + I | Score = 100 x R x I x U; broken rail always 92.5+ |
| Combine | `engine/compatibility_engine.py` | Top tasks per section | Yes/No + reason per pair |
| Combine | `engine/coordination_engine.py` | Compatible tasks | Shared block `CB_*`, time = longest job |
| Schedule | `engine/optimizer_core.py` | Tasks + trains + windows | `optimized_schedule.csv` + `optimized_blocks` |
| Check | `engine/validator.py` | Blocks + trains | PASS / FAIL + certificate |
| Serve | `backend/server.py` | DB + CSV + engines | Brain API on :8765 |
| Serve | `backend/main.go` | DB + CSV + brain API | Fast API + app on :3000 |
| Show | `frontend/src/api/client.ts` | API JSON | Data for screens |
| Show | `frontend/src/App.tsx` | All views | Menu + page router |

## 4. Rules We Follow
- Same section only.
- Same time window only.
- Safe power-cut match.
- No tool clash.
- 10-min gap from any train.
- Night 01:30-04:30, midday 10:30-12:30 preferred.
- Noon 12:00-18:00 peak = caution.
- Shared block time = longest job, not sum.

## 5. Screens — What Judge Sees
| Screen | Source | What you see |
|---|---|---|
| CommandCenter | `/api/metrics` | Big numbers: tasks, risks, savings |
| NetworkSections | `/api/sections` | Section cards + job table |
| Tasks | `/api/tasks` | Full repair list, click for 6 work steps |
| AIPriority | `/api/ml/explain` | Ranked urgent list + why (red/green bars) |
| Coordination | `/api/compatibility` | Which jobs share 1 closure, tick marks |
| Gantt | `/api/schedule` | Timeline of closures vs trains |
| Map | `/api/schedule` lat/lon | Live map, colored lines, work dots |
| BeforeAfter | `/api/impact` | Old manual vs new AI, hours saved |
| WeeklyMonthly | `/api/schedule` | 7-day cards + monthly heat table |
| FailureIntelligence | `/api/failures` | Past breakdowns + delays |
| WhatIf | `/api/what-if` | Shift a block, see feasible / blocked |
| ApprovalAudit | `/api/approvals` | Approve / reject + who-did-what log |
| Submit | `POST /api/tasks/submit` | New repair request form |
| Alerts | `/api/tests/status` | Green PASS checks + speed numbers |

## 6. Run — 3 Commands
- `python engine/transform_and_seed.py` = make demo data
- `python engine/optimizer_core.py --horizon-days 7` or `30` = make plan
- `python backend/server.py` + `go run backend/main.go` + `npm run dev` = see app

## 7. Real Vs Demo
- Real: ranking math, combining rules, safety check, scheduling logic.
- Demo: fault CSVs and train times are made-up for SIH.
- Safety check is separate from scheduler, so FAIL always stops a bad plan.

## Appendix — Technical Refs
- Seed: `transform_and_seed.py:12` horizon 30, `:156` base date, `:51-56` corridors, `:60-81` sections, `:173-207` assets, `:238-326` failures/defects, `:354-432` tasks, `:445-492` trains, `:497-550` windows, `:553-590` goods/resources.
- Score: `risk_service.py:80-123` ML + `:125-134` fallback, `criticality_engine.py:92-99` weights, `urgency_engine.py:31-37` k=0.35 d0=2.0, `impact_engine.py:47-52` weights, `priority_engine.py:77` formula + `:94-98` override.
- Combine: `compatibility_engine.py:46-125` checks + `:127-186` top-8 scan, `coordination_engine.py:196-205` duration/saving/value.
- Schedule: `optimizer_core.py:51` headway 10, `:114-124` windows, `:156-164` conflict rule, `:149-239` pack order.
- Check: `validator.py:103-123` train gap, `:128-143` duration, `:145-160` chronology, `:162-177` peak flag.
- Serve: `backend/server.py:271` schedule, `:604` blocks, `:568` compatibility, `:881` validate, `:906` approve, `:664` what-if, `:944` KPIs. Go mirror `backend/main.go:655-657`.
- Outputs: `optimizer_core.py:246-251` CSV cols, `:271-275` blocks write, `priority_engine.py:176-216` predictions write.
