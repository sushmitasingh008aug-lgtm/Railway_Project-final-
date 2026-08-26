# Research Synthesis — WHAT WE FOUND (Grounded Sources)

_Auto-generated 2026-08-24 from verified NotebookLM + manual PDF extractions. Every claim is traceable to a source file in `Downloads/`._

## Source Inventory (Verified)

| # | Source file | Origin | Coverage |
|---|---|---|---|
| S1 | `tdms-asset-master-reference.md` (277 lines) | NotebookLM ← YouTube: **TDMS Web Application (Asset Master Menu)** | TDMS OHE asset master — 10 entities, validation rules, mobile patrol |
| S2 | `ilide.info-bdms-user-manual-pr_70f80428e599587b81acbcd3376dadc0.pdf` (9 pp) | Downloaded BDMS User Manual (CRIS) | BDMS workflow — tabs, block types, lifecycle |
| S3 | `ilide.info-bdms-rollout-30-09-25-pr_6ee53944540735c0c7513217c02070a3.pdf` (2 pp + enclosures) | Railway Board letter 30.09.2025 + CRIS readiness note | BDMS rollout scope, ITMS project linkage |

---

## 1. TDMS Asset Master — Traction OHE (S1)

Complete inventory of **10 entities**, all anchored to a parent **Mast/Portal**:

| Entity | Foundation link | Key ML-relevant fields |
|---|---|---|
| **Mast / Portal** | Root (synced from PMS, GPS from OLI-VER-G) | `Location Number`, `Lat/Lon`, `Section/Line/Elementary Section`, `Type of Mast` (Mast/Portal/TTC), `Kilometer+Meter`, `Super Mast` (Yes/No → Short/Med/Long/Total), `Date of Commissioning`, `Type of Location` (Curvature/Platform/Theft-prone), `Implantation` (mm), `Jurisdiction` |
| **Cantilever Assembly** | → Mast | `Material/Insulator Type`, Dimensions A/B/C, `Suspension Case` (Single/Double) |
| **Regulating Equipment (ATD)** | → Anchor Mast | `Tension Value` (kgf, red-flag if ≠750), `Last Date of Maintenance` |
| **Contact Wire** | From/To anchor masts | `Tension Length`, `Size`, `Wire Type`, `Splice Locations`, `Measurement Locations`, `Initial Thickness/Wear` |
| **Catenary Wire** | From/To anchor masts | `Tension Length`, `Size`, `Splice Details` |
| **Isolator** | → Mast/Gantry | `Isolator Number/Type` (Single/Double Pole), `Capacity` (A) |
| **Level Crossing Gate** | Between Stations | `Chainage`, `Contact Wire Height` (threshold-validated), `Height Gauge` |
| **LPT / FSD** | → Mast | `Substation Association`, `Make` |
| **Jumper** | Spans 2 masts | `Jumper Type` (C/F/G), `Number of Jumpers` |
| **Line Structure (Overlap)** | Multi-mast span | `Overlap Type` (UI/GI), `Stagger`, `Span Length`, `Clearance` |

**System-wide rules (verified):**
- **Soft threshold validation:** out-of-range numeric → field turns **Red** (warning, not blocking save).
- **Confirm & Lock:** `Save Draft` → editable, `Confirm` → **permanently locked**.
- **Mandatory asterisk fields** block submission if blank.
- **Portal dual-upright:** entering Other Side Location Number auto-creates second upright.

### Integration — Verified
- **PMS → TDMS:** Section, Line, Station limits, Elementary Section, Location Numbers synced inward.
- **OLI-VER-G ↔ TDMS:** Lat/Lon + construction collection points, bi-directional.
- **Foot Patrol App (mobile):** auto-captures GPS, finds nearest Mast within **500 m radius**, logs defects against that Mast → queryable defect history in web app.

### Feature store for ML (mapped to our pipeline)
| Our ML feature | TDMS source field | Status |
|---|---|---|
| Asset age | `Date of Commissioning` (all entities) | ✅ Direct |
| Environmental exposure | `Type of Location` (Curvature/Platform/Theft-prone) | ✅ Direct (flags) |
| Defect density / MTBF | Foot Patrol GPS defect count per Mast | ✅ Via 500m linkage |
| Baseline wear | `Initial Thickness/Wear` at 10 `Measurement Locations` (Contact Wire) | ✅ Direct |
| Maintenance recency | `Last Date of Maintenance` (ATD) | ✅ Direct (ATD only) |

---

## 2. BDMS — Block Workflow & Types (S2 + S3)

**Unified platform:** `TMS + TDMS + SMMS` across Engineering / TRD / S&T / Operating. Entry via **TDMS → Alert Dashboard → Working Alerts Card → BDMS link** (TDMS login with Depot Incharge/CTPC id).

**Two-tab entry form (select block date → GO):**
- **`ALL DEPARTMENT BLOCKS`** — **live-fetched from COA**; other departments' approved blocks. Action: `Shadow & Integrated block` button to associate.
- **`MY BLOCKS`** — initiate new **Power Block** demand → `+` → fill details → **Save Draft** or **Send to TPC**.

**Block types now concrete:** `Power`, `Traffic`, `Disconnection` + `Integrated` (mandatory multi-dept, explicit checkbox) + `Shadow` (piggyback) + `Rolling` (guidelines tracked separately per rollout letter).

**Lifecycle (state machine):**

```
[Depot Incharge] Draft → Send to TPC → [CTPC] review/fill mandatory fields → Confirm → SEND TO COA
    → (COA) Approved / Imposed / Sanctioned → Grant (enter Permit to Work Time + Private Number)
    → (work) → Return (Return Time + Private Number) → Closed
    ↳ Withdraw allowed until Approved/Imposed
    ↳ CTPC may initiate on behalf of any depot
    Info button (hover) shows current status at each step
```

**Reports:** 6 report types, filterable via parameter form (types not enumerated in PDF).

---

## 3. Rollout & Project Linkage (S3)

- Pilot: **5 divisions, Central Railway** — completed; CRIS addressed field feedback.
- Authority: Railway Board letter `2020/Track-III/TK/2` dated 30.09.2025 → **2-week pan-Zonal rollout** to all divisions, coordinated with CRIS; ED/Track(Mod.) nodal; CRIS ref `2019/CRIS/NDLS-ITPI/CEP/PROJECT/ITMS/0107/PT-1`.
- Project lineage: **ITMS** (Integrated Track Management System) — umbrella for TMS/TDMS/SMMS/BDMS integration.

---

## What This Unlocks For Our Project

- **Schema:** `assets` can now be upgraded from 6 generic cols → enriched with `commissioning_date`, `last_maintenance_date`, `location_flags`, `line`, `elementary_section` — directly mappable.
- **Seed realism:** synthetic defects attach via 500m GPS rule, not random asset pick.
- **Block taxonomy:** `maintenance_tasks.affects_line` + new `block_type` enum maps to `Integrated/Shadow` semantics; our `COMBINED_BONUS` now has an IR-native name.
- **COA join confirmed:** `ALL DEPARTMENT BLOCKS ← COA` proves COA is the tonnage/density source (even if fields not shown).

> Full raw extractions preserved in `Downloads/` as listed above. Next: `research-remaining.md` for gaps.
