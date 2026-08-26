# Research Synthesis — WHAT REMAINS (Gaps & Next Sources)

_Companion to `research-found.md`. Every gap below is explicitly marked [NOT IN SOURCE] in the verified docs and needs a new NotebookLM source._

## Summary Matrix

| Need | Needed for | Found? | Next source to add |
|---|---|---|---|
| Defect lifecycle statuses & SLA/overdue rules | Priority engine + ML labels (what counts as “overdue”) | ❌ | **TDMS Defect-Management module** video (see search plan below) |
| Severity / criticality codebook | ML severity + our `criticality` field semantics | ❌ | Same defect module |
| Possession **numeric constraints** — durations, notice periods, post-work cure/speed-restriction | CP-SAT hard windows (currently generic) | ❌ | **BDMS demand-form field list** — screenshot not legible in 9pp PDF; needs the actual BDMS form video |
| Block duration limits / night window hours | CP-SAT + IR Peak Rule tuning (12:00–18:00 is our current rule, but S2 hints at night/spare windows) | ❌ | BDMS form video |
| Permit-to-Work timing & Private Number semantics | State-machine timing edges | Partial | S2 lifecycle gives names only |
| TMS track-asset master (Engineering side) | Complete `assets` model — TDMS only covered OHE (Traction). TMS covers rail/ballast/points. | ❌ | **TMS walkthrough** — Terminal vs Track ambiguity (see below) |
| Tonnage / traffic density per section | The one ML feature TDMS explicitly *lacks* (Section 3, row 6) | ❌ | **COA** traffic chart / FOIS — see verified links |
| Bulk export capability | ML pipeline data extraction path | ❌ | TDMS Reports module video |
| KPIs — asset availability formula | Impact endpoint semantics | ❌ | COA or TDMS Reports |

---

## 1. TDMS Gaps (Traction side still incomplete)

From S1 §2.3 & §5: **3 sub-modules missing:**
- **Defect Management** — status flow (Open → Assigned → Attended → Closed), SLAs, escalation to SSE/DEE.
- **Inspection Planning / Exception Reporting** — tonnage/time-based trigger tables.
- **MIS Reports** — KPI dashboard (mentioned but not shown).

> These are **not** in the Asset Master menu. Any more TDMS-asset videos will duplicate S1.

## 2. BDMS Gaps (Workflow names known, numbers unknown)

S2 gives state names but the 9-page PDF is **low-resolution — mandatory form fields are unreadable**. Missing numeric constraints:
- Allowed durations per possession type (Power: ?h, Traffic: ?h, Shadow: inherits)
- Notice period before `SEND TO COA` (is CTPC confirmation instant or 48h?)
- Safety margins: post-OHE energization test window, post-tamping consolidation, speed restrictions after work
- The 6 report-type names

## 3. TMS Ambiguity (Engineering side)

Your source `ssru.jpg` item #4 says **Terminal Management System | TM…** — likely a mis-read of **TMS (Track Management System)** at `ircep.gov.in/TMS`.
- If it's **Track** → capture its master entities (Track Segment, Weld, Ballast, Turnout) the same way S1 did for OHE — direct complement.
- If it's truly **Terminal** (passenger/freight terminals) → skip; low relevance to block planning.

**Action:** confirm full title of that 4th video before extracting — one-line check.

## 4. COA Gaps (the tonnage join)

S2+S3 prove `ALL DEPARTMENT BLOCKS ← COA` but COA's own data model is unverified. Missing:
- Train density & tonnage fields per section
- How `advance forecast` is generated (the DSS the COA description promises)
- Data-logger → COA → NTES/FOIS integration specifics

---

## Exact Source-Finding Plan (Ready to Execute)

### A. BDMS — form fields (closes 60% of optimizer gaps)
- **YouTube:** `BDMS CRIS Indian Railways block demand form walkthrough`
- **Verified PDFs (already downloaded):** re-ingest at higher resolution or add the **Scribd BDMS Rollout** (`scribd.com/document/929254345/BDMS-ROLLOUT-30-09-25`) as high-res source
- **Expected payoff:** duration dropdown values, notice-period hint in form validation text
- **Alternative path:** RTI-style — the PDF text layer may already contain field names if re-OCR'd (check with `pdftotext`)

### B. TDMS Defect Management — closes priority/SLA gaps
- **YouTube:** `TDMS "defect" Indian Railways inspection planning` → target the 4-min defect-list screen where status column is visible
- **Play Store description** as Website URL: `https://play.google.com/store/apps/details?id=in.org.cris.tdms` (lists KPI dashboard modules)
- **Expected payoff:** severity codebook (the 4-tier our `priority_score` maps to), overdue-day threshold

### C. TMS — closes Engineering asset gap
- **Portal:** `https://ircep.gov.in/TMS/Login.jsp?param=1` → add as Website URL
- **YouTube:** `IR TMS Track Management System walkthrough` (ircep channel, ~IR-TMS prefix)
- **Expected payoff:** entity table for track assets → upgrade `assets.asset_type` from free text to enum + commissioning dates for rails

### D. COA — closes ML tonnage gap
Add these **three verified URLs** (from our web search) to NotebookLM — no video hunt needed:
1. `https://cris.org.in/loadpage?page=proCOA` — advance-forecast definition
2. `https://www.scribd.com/document/827539216/CoA-Control-Office-Application` — TSR, FOIS/NTES/CAS integration, DSS
3. `https://coamis.indianrail.gov.in/webchart/index` + RTIS article `https://www.railway-technology.com/news/indian-railways-train-tracking/` — 6,500 GPS locos feeding COA (the tonnage data pipe)

---

## Recommended Execution Order

1. **Confirm #4 title** (Track vs Terminal) → if Track, extract it first (highest ROI — completes Engineering side).
2. Add the **3 COA URLs** above → re-run the 5-section prompt; Section 3 will finally get a tonnage source.
3. Then chase the BDMS form video for numeric constraints → directly harden CP-SAT (notice windows, cure times).
4. Defect module last — polishes priority scoring, not blocking.

> **Do not** source more TDMS Asset Master videos — S1 is exhaustive for OHE.
