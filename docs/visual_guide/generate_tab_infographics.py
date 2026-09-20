#!/usr/bin/env python3
"""
Automatic Block Planning System (ABPS v4.0)
High-Resolution Tab Infographic Generator with Numbered Callouts & Structured Legends.
"""
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

CANVAS_W = 1920
CANVAS_H = 2050
SCREEN_TARGET_W = 1860
SCREEN_TARGET_H = 1000

# Color Palette
COLOR_BG = (248, 250, 252)          # Slate-50
COLOR_HEADER_BG = (15, 23, 42)      # Slate-900
COLOR_CARD_BG = (255, 255, 255)     # Pure White
COLOR_CARD_BORDER = (226, 232, 240) # Slate-200
COLOR_PRIMARY = (217, 111, 19)      # Saffron Accent (#D96F13)
COLOR_SECONDARY = (37, 99, 235)     # IR Blue (#2563EB)
COLOR_EMERALD = (16, 185, 129)      # Green (#10B981)
COLOR_CRIMSON = (127, 20, 24)       # Deep Crimson (#7F1418)
COLOR_TEXT_MAIN = (31, 41, 55)      # Slate-800
COLOR_TEXT_MUTED = (100, 116, 139)  # Slate-500
COLOR_WHITE = (255, 255, 255)

FONT_PATH_BOLD = "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf"
FONT_PATH_REG = "/usr/share/fonts/TTF/DejaVuSans.ttf"
FONT_PATH_MONO = "/usr/share/fonts/TTF/DejaVuSansMono-Bold.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

FONT_HEADER = get_font(FONT_PATH_BOLD, 28)
FONT_SUBHEADER = get_font(FONT_PATH_REG, 15)
FONT_PIN = get_font(FONT_PATH_BOLD, 16)
FONT_CARD_TITLE = get_font(FONT_PATH_BOLD, 15)
FONT_CARD_BODY = get_font(FONT_PATH_REG, 12)
FONT_CARD_LABEL = get_font(FONT_PATH_BOLD, 11)
FONT_CARD_CODE = get_font(FONT_PATH_MONO, 11)

TABS_DATA = [
    {
        "id": "01_dashboard",
        "title": "TAB 01: COMMAND CENTER & GIS CORRIDOR OVERVIEW",
        "subtitle": "Real-Time Network Operational State, Disruption Analytics & Interactive Delhi–Howrah Asset Map",
        "source_screen": "/tmp/screens/01_dashboard.png",
        "pins": [
            {
                "num": 1,
                "box": [240, 75, 780, 120],
                "pin": [250, 70],
                "title": "Operational Planning Horizon",
                "purpose": "Selects tactical 7-day or strategic 30-day temporal window for corridor block scheduling.",
                "tech": "PlanningCalendarContext synchronization across all 25 operational datasets.",
                "action": "Toggle between Weekly and Monthly horizons to inspect corridor capacity."
            },
            {
                "num": 2,
                "box": [240, 130, 1820, 235],
                "pin": [250, 125],
                "title": "Critical KPI Summary Ribbon",
                "purpose": "Displays vital health metrics: 15 Critical Tasks, 2,163 Safety Overrides, and 72 CP-SAT Certified Blocks.",
                "tech": "Aggregated in real-time from PostgreSQL via /api/metrics and Redis-backed buffer.",
                "action": "Immediate executive check ensuring zero train precedence breaches."
            },
            {
                "num": 3,
                "box": [240, 260, 680, 730],
                "pin": [250, 255],
                "title": "Maintenance Priority Queue",
                "purpose": "Risk-ordered asset queue ranking urgent TRD, Civil Engineering, and S&T work orders.",
                "tech": "Expected-loss formula: P_i = C_i * U_i * W. Safety-critical tasks locked to >=90.0.",
                "action": "Click any maintenance task to inspect asset history and failure telemetry."
            },
            {
                "num": 4,
                "box": [700, 260, 1130, 730],
                "pin": [710, 255],
                "title": "Operational Availability & Risk",
                "purpose": "Quantifies network throughput gains (+0.27%), 23.4% downtime reduction, and 0 collisions.",
                "tech": "Mathematical proof gate comparing baseline unplanned outages vs scheduled blocks.",
                "action": "Verify headway clearance compliance and review feed synchronization status."
            },
            {
                "num": 5,
                "box": [1150, 260, 1820, 730],
                "pin": [1160, 255],
                "title": "AI Coordinated Action Feed",
                "purpose": "Recommends multi-department shadow blocks combining Track Tamping with S&T Point inspection.",
                "tech": "Candidate generator clustering tasks sharing identical corridor segments and power shutoffs.",
                "action": "Click 'Approve Recommended Plan' to atomically push plan to Control Office."
            },
            {
                "num": 6,
                "box": [240, 760, 1820, 990],
                "pin": [250, 755],
                "title": "GIS Corridor Control Map",
                "purpose": "Geospatial visualization of track sections, active train paths, and maintenance block locations.",
                "tech": "Leaflet GIS engine rendering geo-referenced coordinates from Delhi to Howrah.",
                "action": "Filter layers (Assets, Failures, Blocks, Trains) to inspect spatial possessions."
            }
        ]
    },
    {
        "id": "02_weekly_planner",
        "title": "TAB 02: CP-SAT CORRIDOR BLOCK PLANNER (GANTT TIMELINE)",
        "subtitle": "Combinatorial Constraint Satisfaction Engine Scheduling Maintenance Around Train Precedence Walls",
        "source_screen": "/tmp/screens/02_weekly_planner.png",
        "pins": [
            {
                "num": 1,
                "box": [1180, 85, 1490, 135],
                "pin": [1190, 80],
                "title": "Horizon Selector (7d vs 30d)",
                "purpose": "Selects 10,080-minute (7-day) tactical or 43,200-minute (30-day) strategic corridor horizon.",
                "tech": "Configures CP-SAT integer programming time domain variables dynamically.",
                "action": "Click Weekly (7d) for shift coordination or Monthly (30d) for macro maintenance planning."
            },
            {
                "num": 2,
                "box": [1210, 140, 1520, 185],
                "pin": [1220, 135],
                "title": "Regenerate CP-SAT Plan CTA",
                "purpose": "Launches the Google OR-Tools CP-SAT solver to explore zero-conflict block arrangements.",
                "tech": "Embedded Python solver with 60s timeout enforcing mutual exclusion on moving train paths.",
                "action": "Click to re-solve all 189 tasks and publish a newly certified schedule manifest."
            },
            {
                "num": 3,
                "box": [240, 210, 1820, 310],
                "pin": [250, 205],
                "title": "Timeline Precedence Header",
                "purpose": "Displays 7-day navigation pills (D1-D7) and corridor search filter to pinpoint sections.",
                "tech": "Filters 15k movements across all 6 sections (Delhi to Howrah) in sub-millisecond time.",
                "action": "Filter by Day (D1-D7) or type section name (e.g. 'Kanpur') to inspect local block clearance."
            },
            {
                "num": 4,
                "box": [240, 320, 1820, 990],
                "pin": [250, 315],
                "title": "Time-Aware Multi-Corridor Gantt",
                "purpose": "Interactive Gantt chart showing moving train precedence bars vs coordinated maintenance blocks.",
                "tech": "Virtualized O(1) indexed canvas showing 72 certified blocks with 0 train overlaps.",
                "action": "Hover or click any block possession bar to inspect feasibility justification."
            },
            {
                "num": 5,
                "box": [15, 80, 220, 850],
                "pin": [25, 75],
                "title": "Integrated Navigation Sidebar",
                "purpose": "One-click access across Operations, Coordination, Intelligence, Data, and Governance.",
                "tech": "Responsive single-page router maintaining corridor filters across tabs.",
                "action": "Click '8. Train & Block Conflicts' to verify statutory train headway clearances."
            }
        ]
    },
    {
        "id": "03_train_conflicts",
        "title": "TAB 03: TRAIN & BLOCK CONFLICT TIMELINE (SWIMLANES)",
        "subtitle": "Directional Multi-Lane Track Corridors Verifying Statutory 10-Minute Train Headway Clearances",
        "source_screen": "/tmp/screens/03_train_conflicts.png",
        "pins": [
            {
                "num": 1,
                "box": [1140, 95, 1820, 150],
                "pin": [1150, 90],
                "title": "Corridor & Line Selectors",
                "purpose": "Switches active section (SEC-DH-01 to SEC-DH-06) and filters direction (UP, DOWN, or ALL).",
                "tech": "Dynamically pulls section geography and corridor boundaries from /api/sections.",
                "action": "Select 'SEC-DH-01 — Delhi – Kanpur' to inspect mainline high-speed corridor occupancy."
            },
            {
                "num": 2,
                "box": [240, 170, 1820, 275],
                "pin": [250, 165],
                "title": "Occupancy & Clearance Cards",
                "purpose": "Shows 1,819 Timetabled Trains, 2,500 Block Windows, and 14 Scheduled Tasks with 0 Overlaps.",
                "tech": "Calculates real-time statutory buffer clearance across all corridor possession windows.",
                "action": "Verify 100% buffer enforcement status before issuing line possession authority."
            },
            {
                "num": 3,
                "box": [240, 300, 1820, 620],
                "pin": [250, 295],
                "title": "UP Line Track Swimlane",
                "purpose": "Dedicated Northbound corridor lane (Delhi → Kanpur) with multi-lane interval packing.",
                "tech": "Greedy interval scheduling algorithm preventing visual block collision across 24h horizon.",
                "action": "Click any UP train or maintenance block to inspect detailed route and time window."
            },
            {
                "num": 4,
                "box": [240, 640, 1820, 980],
                "pin": [250, 635],
                "title": "DOWN Line Track Swimlane",
                "purpose": "Dedicated Southbound corridor lane (Kanpur → Delhi) with staggered non-overlapping blocks.",
                "tech": "Interval lane stacking ensuring concurrent trains on multiple tracks are distinctly visible.",
                "action": "Inspect DOWN passenger trains and verify safe separation from TRD power blocks."
            },
            {
                "num": 5,
                "box": [15, 80, 220, 850],
                "pin": [25, 75],
                "title": "Integrated Navigation Sidebar",
                "purpose": "Quick access across all Operations, Coordination, Intelligence, Data, and Control modules.",
                "tech": "Responsive single-page application routing preserving corridor session state.",
                "action": "Click any module to jump directly between real-time Gantt, AI Priority, and GIS views."
            }
        ]
    },
    {
        "id": "04_asset_backlog",
        "title": "TAB 04: MAINTENANCE TASKS & ASSET BACKLOG",
        "subtitle": "Holistic Work Order Inventory, Departmental Categorization & Criticality-Ranked Execution Queue",
        "source_screen": "/tmp/screens/04_asset_backlog.png",
        "pins": [
            {
                "num": 1,
                "box": [240, 90, 890, 140],
                "pin": [250, 85],
                "title": "Backlog Inventory Header",
                "purpose": "Displays 15,000 active maintenance work orders awaiting corridor block allocation.",
                "tech": "Synced with Indian Railways TMS (Track Management) and UIMS asset registries.",
                "action": "Review total backlog volume and track asset condition distributions."
            },
            {
                "num": 2,
                "box": [950, 90, 1820, 140],
                "pin": [960, 85],
                "title": "Multi-Criteria Filter Controls",
                "purpose": "Filters tasks by Department (TRD, Engineering, S&T), Criticality (CRITICAL, HIGH, MED, LOW).",
                "tech": "Client-side indexed memory cache providing instant filtering across 15k rows.",
                "action": "Filter by 'TRD' and 'CRITICAL' to prioritize imminent overhead equipment repairs."
            },
            {
                "num": 3,
                "box": [240, 150, 1820, 225],
                "pin": [250, 145],
                "title": "Backlog Schema Table Header",
                "purpose": "Shows Task ID, Department, Asset ID, Description, Section, Due Date, Criticality, Priority.",
                "tech": "Sortable tabular view connected to real-time asset degradation telemetry.",
                "action": "Click column headers to sort tasks by Expected-Loss priority score or Due Date."
            },
            {
                "num": 4,
                "box": [240, 230, 1820, 990],
                "pin": [250, 225],
                "title": "Work Order Dispatch Roster",
                "purpose": "Comprehensive table detailing individual work orders, duration in minutes, and action buttons.",
                "tech": "Direct link to CP-SAT solver candidate pool and automated shadow block generator.",
                "action": "Click 'Detail & Actions' to view geospatial coordinates, required machinery, and crew."
            }
        ]
    },
    {
        "id": "05_coordination",
        "title": "TAB 05: COORDINATION CENTRE & SHADOW BLOCKS",
        "subtitle": "Multi-Departmental Possession Bundling Eliminating Redundant Track Closures Across TRD, Civil & S&T",
        "source_screen": "/tmp/screens/05_coordination.png",
        "pins": [
            {
                "num": 1,
                "box": [240, 80, 1820, 160],
                "pin": [250, 75],
                "title": "Cross-Department Coordination Header",
                "purpose": "Central hub for multi-department block consolidation across Engineering, TRD, and S&T.",
                "tech": "Automated compatibility solver verifying 8-point statutory safety rules.",
                "action": "Click 'Solve in CP-SAT' to optimize all approved multi-department pairs."
            },
            {
                "num": 2,
                "box": [240, 180, 1820, 480],
                "pin": [250, 175],
                "title": "Hero Candidate Opportunity",
                "purpose": "Spotlights top shadow block in Delhi Division (SEC-03: Broken Rail Weld + Track Circuit + OHE Isolator).",
                "tech": "Consolidates 3 departments into a single 90-minute joint possession, saving 2 line closures.",
                "action": "Click 'OPTIMIZE THIS GROUP' to bind all 3 tasks into one conflict-free corridor window."
            },
            {
                "num": 3,
                "box": [240, 500, 1820, 720],
                "pin": [250, 495],
                "title": "Deterministic 8-Point Compatibility Matrix",
                "purpose": "Validates 15,000 pairs: 5,778 Approved (38.5% Index), 9,222 Blocked for safety rules.",
                "tech": "Enforces formal compatibility rules (e.g. ballast dust prohibited near signal optics).",
                "action": "Inspect why candidate pairs were approved or blocked by safety rules."
            },
            {
                "num": 4,
                "box": [240, 740, 1820, 990],
                "pin": [250, 735],
                "title": "Canonical Principles & Pair Audit",
                "purpose": "Detailed audit list showing individual task pairs, proximity reasons, and joint scores.",
                "tech": "Persisted in PostgreSQL database with transactional integrity and audit logging.",
                "action": "Verify spatial footprint, directional alignment, and OHE/signal power shutoff synergy."
            }
        ]
    },
    {
        "id": "06_ai_priority",
        "title": "TAB 06: AI RISK & PRIORITY INTELLIGENCE ENGINE",
        "subtitle": "Physics-Informed Weibull Hazard Modeling, Failure Prediction & Expected-Loss Risk Optimization",
        "source_screen": "/tmp/screens/06_ai_priority.png",
        "pins": [
            {
                "num": 1,
                "box": [240, 80, 1820, 165],
                "pin": [250, 75],
                "title": "AI Priority & SHAP Engine Header",
                "purpose": "Displays active machine learning model metadata: XGBoost v2.4 Champion (PR-AUC: 0.3138).",
                "tech": "Multi-model ML inference comparing Random Forest, XGBoost, and LightGBM models.",
                "action": "Review model explainability metrics and four-pillar policy formulation."
            },
            {
                "num": 2,
                "box": [240, 180, 660, 980],
                "pin": [250, 175],
                "title": "Prioritized Task Backlog (196)",
                "purpose": "Scrollable queue ranking all 196 active corridor tasks by composite expected-loss score.",
                "tech": "Score computed from 35% ML Risk, 25% Urgency, 25% Safety, and 15% Line Impact.",
                "action": "Click any task card in the list to reveal deep explainability and SHAP values."
            },
            {
                "num": 3,
                "box": [680, 180, 1820, 520],
                "pin": [690, 175],
                "title": "Safety Override & Policy Weights",
                "purpose": "Enforces non-negotiable safety rules: broken rails & OHE droppers locked to Critical (Score >= 92.5).",
                "tech": "Deterministic rule gate overriding statistical ML predictions for passenger safety.",
                "action": "Inspect asset condition score (86/100), statutory due date, and four-pillar breakdown."
            },
            {
                "num": 4,
                "box": [680, 540, 1820, 980],
                "pin": [690, 535],
                "title": "Local SHAP Feature Attribution",
                "purpose": "Transparent explainability showing top factors elevating risk vs mitigating baseline factors.",
                "tech": "Shapley additive explanations decomposing ML model output into transparent risk deltas.",
                "action": "Examine why an asset received high priority (e.g. Risk History +0.104, Condition +0.047)."
            }
        ]
    },
    {
        "id": "07_what_if",
        "title": "TAB 07: WHAT-IF SCENARIO EXPLORER & SIMULATOR",
        "subtitle": "Real-Time Emergency Injection, Ripple Delay Propagation & Dynamic Contingency Replanning",
        "source_screen": "/tmp/screens/07_what_if.png",
        "pins": [
            {
                "num": 1,
                "box": [240, 80, 1820, 165],
                "pin": [250, 75],
                "title": "What-If Planning Laboratory",
                "purpose": "Enables controllers to test schedule changes before approval without affecting live operations.",
                "tech": "Isolated simulation sandbox executing CP-SAT re-optimization in memory.",
                "action": "Select a block and test moving it forward or backward in time."
            },
            {
                "num": 2,
                "box": [240, 180, 1820, 310],
                "pin": [250, 175],
                "title": "Temporal Shift & Simulation Controls",
                "purpose": "Selects specific block (e.g. CB_001) and applies temporal displacement (-60m, -30m, +30m, +60m, +120m).",
                "tech": "Dynamic perturbation engine re-evaluating train headway margins under time shift.",
                "action": "Click '+30 min' and press 'Run Simulation' to evaluate upstream train impacts."
            },
            {
                "num": 3,
                "box": [240, 330, 1820, 680],
                "pin": [250, 325],
                "title": "Conflict Propagation Simulation Area",
                "purpose": "Visualizes whether the shifted possession causes train queuing or overlaps passenger express paths.",
                "tech": "Deterministic conflict checker flagging secondary timetable collisions across loop tracks.",
                "action": "Inspect newly introduced conflict warnings and check if secondary line closures occur."
            },
            {
                "num": 4,
                "box": [240, 700, 1820, 980],
                "pin": [250, 695],
                "title": "Scenario Contingency Audit Roster",
                "purpose": "Summarizes impact on passenger punctuality, freight throughput, and safety buffer integrity.",
                "tech": "Generates audit log and comparison report ready for submission to Divisional Controller.",
                "action": "Review summary metrics and choose to accept, adjust, or discard the simulation."
            }
        ]
    }
]

def draw_rounded_rect(draw, coords, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = coords
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def render_infographic(tab_info, output_path):
    print(f"Generating Infographic: {tab_info['id']}...")
    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), COLOR_BG)
    draw = ImageDraw.Draw(canvas)

    # 1. Header Banner
    draw.rectangle([0, 0, CANVAS_W, 110], fill=COLOR_HEADER_BG)
    draw.rectangle([0, 0, CANVAS_W, 6], fill=COLOR_PRIMARY)

    draw.text((40, 22), tab_info["title"], font=FONT_HEADER, fill=COLOR_WHITE)
    draw.text((40, 68), tab_info["subtitle"], font=FONT_SUBHEADER, fill=(148, 163, 184))

    # Badge in Header
    draw_rounded_rect(draw, [CANVAS_W - 340, 30, CANVAS_W - 40, 78], 8, fill=(30, 41, 59), outline=(51, 65, 85), width=1)
    draw.text((CANVAS_W - 320, 44), "ABPS v4.0 OPERATOR GUIDE", font=FONT_CARD_CODE, fill=COLOR_PRIMARY)

    # 2. Embed Screenshot with Border & Drop Shadow
    screen_x = 30
    screen_y = 125
    if os.path.exists(tab_info["source_screen"]):
        raw_screen = Image.open(tab_info["source_screen"]).convert("RGB")
        resized_screen = raw_screen.resize((SCREEN_TARGET_W, SCREEN_TARGET_H), Image.Resampling.LANCZOS)
        
        # Shadow
        draw_rounded_rect(draw, [screen_x + 6, screen_y + 6, screen_x + SCREEN_TARGET_W + 6, screen_y + SCREEN_TARGET_H + 6], 12, fill=(203, 213, 225))
        # Image
        canvas.paste(resized_screen, (screen_x, screen_y))
        # Outline
        draw.rounded_rectangle([screen_x, screen_y, screen_x + SCREEN_TARGET_W, screen_y + SCREEN_TARGET_H], radius=12, outline=COLOR_CARD_BORDER, width=2)
    else:
        draw.rectangle([screen_x, screen_y, screen_x + SCREEN_TARGET_W, screen_y + SCREEN_TARGET_H], fill=(226, 232, 240))
        draw.text((screen_x + 500, screen_y + 400), "Screenshot not found", font=FONT_HEADER, fill=(100, 116, 139))

    # 3. Draw Bounding Boxes and Circular Number Pins
    for pin in tab_info["pins"]:
        box = pin["box"]
        bx1 = screen_x + box[0]
        by1 = screen_y + box[1]
        bx2 = screen_x + box[2]
        by2 = screen_y + box[3]

        # Draw glowing highlight box
        draw.rounded_rectangle([bx1, by1, bx2, by2], radius=8, outline=COLOR_PRIMARY, width=3)
        # Inner subtle white line
        draw.rounded_rectangle([bx1 - 2, by1 - 2, bx2 + 2, by2 + 2], radius=10, outline=(255, 237, 213), width=1)

        # Draw Pin Circle Badge (positioned at top-left of box)
        px = screen_x + pin["pin"][0]
        py = screen_y + pin["pin"][1]
        pin_radius = 18

        # Shadow
        draw.ellipse([px - pin_radius + 2, py - pin_radius + 2, px + pin_radius + 2, py + pin_radius + 2], fill=(0, 0, 0, 120))
        # Outer Ring
        draw.ellipse([px - pin_radius - 2, py - pin_radius - 2, px + pin_radius + 2, py + pin_radius + 2], fill=COLOR_WHITE)
        # Main Fill
        draw.ellipse([px - pin_radius, py - pin_radius, px + pin_radius, py + pin_radius], fill=COLOR_PRIMARY)
        # Number Text
        num_str = str(pin["num"])
        draw.text((px - 6, py - 10), num_str, font=FONT_PIN, fill=COLOR_WHITE)

    # 4. Structured Legend Cards Panel (Bottom Grid)
    legend_y = screen_y + SCREEN_TARGET_H + 25
    draw.text((screen_x, legend_y), "COMPONENT BREAKDOWN & OPERATIONAL SPECIFICATIONS", font=FONT_HEADER, fill=COLOR_HEADER_BG)
    draw.text((screen_x, legend_y + 36), "Detailed operational guidance, algorithmic explanations, and controller actions for every highlighted element above", font=FONT_SUBHEADER, fill=COLOR_TEXT_MUTED)

    cards_start_y = legend_y + 70
    cards_per_row = 3 if len(tab_info["pins"]) >= 5 else 2
    card_margin_x = 24
    card_margin_y = 20
    total_w = CANVAS_W - (screen_x * 2)
    card_w = (total_w - (card_margin_x * (cards_per_row - 1))) // cards_per_row
    card_h = 240 if len(tab_info["pins"]) >= 5 else 320

    for idx, pin in enumerate(tab_info["pins"]):
        row = idx // cards_per_row
        col = idx % cards_per_row
        cx = screen_x + col * (card_w + card_margin_x)
        cy = cards_start_y + row * (card_h + card_margin_y)

        # Card Background & Border
        draw_rounded_rect(draw, [cx, cy, cx + card_w, cy + card_h], 12, fill=COLOR_CARD_BG, outline=COLOR_CARD_BORDER, width=1)
        # Saffron left accent bar
        draw_rounded_rect(draw, [cx, cy, cx + 5, cy + card_h], 4, fill=COLOR_PRIMARY)

        # Number Badge inside Card
        draw_rounded_rect(draw, [cx + 14, cy + 14, cx + 44, cy + 44], 8, fill=COLOR_PRIMARY)
        draw.text((cx + 23, cy + 18), str(pin["num"]), font=FONT_PIN, fill=COLOR_WHITE)

        # Card Title
        draw.text((cx + 54, cy + 20), pin["title"], font=FONT_CARD_TITLE, fill=COLOR_TEXT_MAIN)

        # Content Lines with Word Wrap
        text_y = cy + 54
        wrap_width = 46 if cards_per_row == 3 else 70

        # Purpose
        draw.text((cx + 14, text_y), "PURPOSE:", font=FONT_CARD_LABEL, fill=COLOR_TEXT_MUTED)
        lines = textwrap.wrap(pin["purpose"], width=wrap_width)
        for line in lines[:2]:
            draw.text((cx + 82, text_y), line, font=FONT_CARD_BODY, fill=COLOR_TEXT_MAIN)
            text_y += 18

        # Technology
        text_y += 12
        draw.text((cx + 14, text_y), "ENGINE:", font=FONT_CARD_LABEL, fill=COLOR_SECONDARY)
        lines = textwrap.wrap(pin["tech"], width=wrap_width)
        for line in lines[:2]:
            draw.text((cx + 82, text_y), line, font=FONT_CARD_BODY, fill=(30, 58, 138))
            text_y += 18

        # Operator Action
        text_y += 12
        draw.text((cx + 14, text_y), "ACTION:", font=FONT_CARD_LABEL, fill=COLOR_EMERALD)
        lines = textwrap.wrap(pin["action"], width=wrap_width)
        for line in lines[:2]:
            draw.text((cx + 82, text_y), line, font=FONT_CARD_BODY, fill=(6, 95, 70))
            text_y += 18

    # Save Output
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    canvas.save(output_path, "PNG", quality=95)
    print(f"Saved: {output_path} ({os.path.getsize(output_path)} bytes)")

def main():
    output_dir = "/home/deadass/Desktop/sih/rl_data/rl_2/SIH-2026/docs/visual_guide"
    artifact_dir = "/home/deadass/.gemini/antigravity/brain/18b4d9f7-8a35-4443-b618-de3fd3756ee0"
    
    generated_files = []
    for tab in TABS_DATA:
        out_file = os.path.join(output_dir, f"{tab['id']}_guide.png")
        render_infographic(tab, out_file)
        art_file = os.path.join(artifact_dir, f"{tab['id']}_guide.png")
        Image.open(out_file).save(art_file, "PNG")
        generated_files.append(out_file)

    print(f"\nAll {len(generated_files)} annotated tab infographics generated successfully!")

if __name__ == "__main__":
    main()
