import sys
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, Preformatted
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, A4[1] - 30, "Indian Railways · AI-Assisted Block Planning System v2.0")
            self.drawRightString(A4[0] - 40, A4[1] - 30, "System Architecture & Processing Pipeline")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 35, A4[0] - 40, A4[1] - 35)

        # Running Footer (all pages)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawString(40, 25, "Smart India Hackathon 2026 · Confidential & Operational Specification")
        self.drawRightString(A4[0] - 40, 25, page_text)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 35, A4[0] - 40, 35)

        self.restoreState()

def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    PRIMARY = colors.HexColor("#0f2942")     # Deep Navy
    SECONDARY = colors.HexColor("#0284c7")   # Electric Rail Sky Blue
    DARK = colors.HexColor("#1e293b")        # Slate 800
    LIGHT_BG = colors.HexColor("#f8fafc")    # Slate 50
    CARD_BG = colors.HexColor("#f1f5f9")     # Slate 100
    BORDER_COLOR = colors.HexColor("#cbd5e1")# Slate 300
    ACCENT_GREEN = colors.HexColor("#15803d")# Green 700

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=12
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#475569")
    )
    h1_style = ParagraphStyle(
        'H1',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'H2',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK,
        spaceAfter=6
    )
    callout_style = ParagraphStyle(
        'Callout',
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#0f172a")
    )
    code_box = ParagraphStyle(
        'CodeBox',
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#0f172a")
    )
    table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=DARK
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=DARK
    )
    table_header = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    story = []

    # ==========================
    # TITLE & HEADER BANNER
    # ==========================
    header_data = [
        [
            Paragraph("<b>GOVERNMENT OF INDIA · MINISTRY OF RAILWAYS</b><br/>"
                      "<font size=7 color='#64748b'>SMART INDIA HACKATHON 2026 | TECHNICAL SPECIFICATION v2.0</font>", meta_style),
            Paragraph("<b>SYSTEM STATUS: LIVE</b><br/>"
                      "<font size=7 color='#15803d'>http://localhost:8765</font>", ParagraphStyle('RStatus', parent=meta_style, alignment=2))
        ]
    ]
    t_header = Table(header_data, colWidths=[360, 155])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, PRIMARY),
    ]))
    story.append(t_header)
    story.append(Spacer(1, 10))

    story.append(Paragraph("AI-Assisted Automatic Block Planning System", title_style))
    story.append(Paragraph("End-to-End Architecture, Data Pipeline, CP-SAT Optimization & Control Center UI/UX", subtitle_style))

    # Executive Overview Box
    exec_summary = (
        "<b>Executive Summary & Canonical Philosophy:</b><br/>"
        "Fixed-infrastructure maintenance on Indian Railways has historically suffered from departmental silos "
        "(Track/TMS, Traction/TDMS, Signalling/SMMS, Movements/COA, Failures/UIMS). "
        "When departments independently request corridor possessions, lines experience repeated closures, "
        "excessive asset downtime, and human error during manual timetable fitting.<br/><br/>"
        "<b>The Canonical Working Principle:</b><br/>"
        "• <b>Data Integration</b> tells us <i>WHAT</i> needs work and <i>WHERE</i> it is located.<br/>"
        "• <b>ML Benchmark</b> predicts failure <i>RISK</i> using 30 temporal and operational features.<br/>"
        "• <b>SHAP Engine</b> explains <i>WHY</i> an asset is at risk (top positive and negative drivers).<br/>"
        "• <b>Compatibility Engine</b> applies 8 deterministic railway checks to determine <i>WHICH</i> tasks can safely combine.<br/>"
        "• <b>Action Engine</b> decomposes tasks into standard 6-stage railway work packages.<br/>"
        "• <b>Time-Aware CP-SAT Optimizer</b> decides <i>WHEN</i> and <i>HOW</i> blocks are scheduled without train collisions.<br/>"
        "• <b>Human Review & Audit</b> guarantees Section Controller authority with full electronic provenance.<br/>"
        "• <b>Evaluation Engine</b> measures exact quantitative ROI vs the traditional silo baseline."
    )
    box_data = [[Paragraph(exec_summary, callout_style)]]
    box_table = Table(box_data, colWidths=[515])
    box_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('LINELEFT', (0,0), (0,0), 3.5, SECONDARY),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(box_table)
    story.append(Spacer(1, 12))

    # ==========================
    # SECTION 1: SYSTEM ARCHITECTURE & DATA FLOW
    # ==========================
    story.append(Paragraph("1. High-Level Data Flow: Ingestion ➔ Processing ➔ Block Grant", h1_style))
    story.append(Paragraph(
        "The diagram below depicts the end-to-end operational transition from raw multi-departmental feeds "
        "through our 6 automated backend engines into the unified Railway Maintenance Control Center:",
        body_style
    ))

    flowchart_ascii = (
        "+-----------------------------------------------------------------------------------------+\n"
        "|                             1. MULTI-DEPARTMENT DATA INGESTION                         |\n"
        "|  TMS (Track Engineering)  |  TDMS (Electrical OHE)  |  SMMS (Signalling & Telecom)       |\n"
        "|  COA (706 Train Movements)|  UIMS (350 Govt Failure Events & Detention Logs)            |\n"
        "+--------------------------------------------+--------------------------------------------+\n"
        "                                             |\n"
        "                                             v\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "|                 2. SPATIAL TOPOLOGY & ASSET MASTER (19,586 Track Assets)                |\n"
        "|  Haversine Spherical Distance Links: Asset ID -> Operational Section ID -> Corridor ID  |\n"
        "+--------------------------------------------+--------------------------------------------+\n"
        "                                             |\n"
        "                                             v\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "|                 3. MACHINE LEARNING RISK ENGINE & LOCAL SHAP ATTRIBUTION                |\n"
        "|  30 Rolling Features | Champion: HistGradientBoosting (PR-AUC: 0.9576, Recall: 0.8929)  |\n"
        "|  SHAP Waterfalls: Top Risk Drivers (+/- Delta Risk) decomposing asset health cliff     |\n"
        "+--------------------------------------------+--------------------------------------------+\n"
        "                                             |\n"
        "                                             v\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "|                 4. PRIORITY POLICY & NON-NEGOTIABLE SAFETY OVERRIDE                     |\n"
        "|  Formula: 35% Risk + 25% Urgency + 25% Safety Impact + 15% Line Impact                  |\n"
        "|  Safety Override Rule: Broken rail welds, track circuits, dropper snaps -> LOCKED >=92.5|\n"
        "+--------------------------------------------+--------------------------------------------+\n"
        "                                             |\n"
        "                                             v\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "|              5. MAINTENANCE ACTION ENGINE & 8-POINT COMPATIBILITY ENGINE                |\n"
        "|  Action Engine: 6-Stage Decomposition (Inspection -> Isolation -> Repair -> Test -> ...)|\n"
        "|  Deterministic 8-Point Verification: 93 Pairs Approved, 24 Blocked with Reason Codes    |\n"
        "+--------------------------------------------+--------------------------------------------+\n"
        "                                             |\n"
        "                                             v\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "|                 6. TIME-AWARE GOOGLE OR-TOOLS CP-SAT CORRIDOR OPTIMIZER                 |\n"
        "|  Integer-Minute Horizon | Line-Aware Train Walls | Peak Ban (12-18h) | Resource Limits  |\n"
        "|  Output: 143 Blocks (24 Coordinated Groups covering 56 tasks) | Zero Train Collisions    |\n"
        "+--------------------------------------------+--------------------------------------------+\n"
        "                                             |\n"
        "                                             v\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "|              7. CONTROL CENTER UI (12 SCREENS) & HUMAN CONTROLLER AUDIT SIGN-OFF        |\n"
        "|  Command Center | Gantt with 'Why Chosen' Modal | Simulator | Immutable Audit Log       |\n"
        "+-----------------------------------------------------------------------------------------+"
    )
    t_fc = Table([[Preformatted(flowchart_ascii, code_box)]], colWidths=[515])
    t_fc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_fc)
    story.append(Spacer(1, 10))

    # ==========================
    # SECTION 2: DETAILED BACKEND PIPELINE
    # ==========================
    story.append(Paragraph("2. Deep Dive: The 6 Backend Processing Stages", h1_style))

    # Stage 1
    story.append(Paragraph("Stage 1: Multi-Department Ingestion & Geospatial Normalization", h2_style))
    story.append(Paragraph(
        "• <b>Raw Silo Feeds:</b> Standardizes CSV and live feed drops from TMS (rail fractures, track geometry, gauge deviations), "
        "TDMS (OHE tension, dropper snaps, neutral section wear), SMMS (track circuit drops, point machines, signal filament failures), "
        "and COA (706 sequential train movements across 12 sections with exact entry/exit minutes and UP/DOWN line directions).<br/>"
        "• <b>Government Failure Intelligence:</b> Ingests 350 normalized UIMS failure incident events containing root causes, subcauses, "
        "trains delayed, detention minutes, and Station Master / Section Controller remarks.<br/>"
        "• <b>Spatial Topology:</b> 19,586 railway assets possess true GPS coordinates. A vectorized Haversine spherical algorithm "
        "maps each asset to its operational corridor section, establishing an unbroken link: "
        "<b>Asset ID ➔ Section ID ➔ Corridor ID</b>.",
        body_style
    ))

    # Stage 2
    story.append(Paragraph("Stage 2: 30-Feature Engineering & Multi-Model ML Benchmark", h2_style))
    story.append(Paragraph(
        "To predict asset failures accurately without temporal data leakage, our feature pipeline ("
        "<code>engine/generate_ml_dataset.py</code>) computes 30 backward-looking metrics strictly prior to the observation window:<br/>"
        "• <b>Rolling Failure Frequencies:</b> Past 7-day, 30-day, 90-day, 180-day, and 365-day failure counts.<br/>"
        "• <b>Detention & Impact Metrics:</b> Total detention minutes caused, trains detained, and average outage duration.<br/>"
        "• <b>Health & Stress Metrics:</b> Asset age, visual condition grade, maintenance days overdue, line traffic density (GMT), and daily tonnage.<br/><br/>"
        "We executed a rigorous benchmark across 6 model architectures under a chronological split (Train 65%, Val 20%, Test 15%):",
        body_style
    ))

    # ML Benchmark Table
    ml_headers = [
        Paragraph("<b>Model Architecture</b>", table_header),
        Paragraph("<b>PR-AUC</b>", table_header),
        Paragraph("<b>Recall</b>", table_header),
        Paragraph("<b>Precision</b>", table_header),
        Paragraph("<b>F1-Score</b>", table_header),
        Paragraph("<b>ROC-AUC</b>", table_header),
        Paragraph("<b>Status</b>", table_header)
    ]
    ml_rows = [
        ml_headers,
        [Paragraph("<b>HistGradientBoosting</b>", table_cell_bold), Paragraph("<b>0.9576</b>", table_cell_bold), Paragraph("<b>0.8929</b>", table_cell_bold), Paragraph("<b>0.8865</b>", table_cell_bold), Paragraph("<b>0.8897</b>", table_cell_bold), Paragraph("<b>0.9698</b>", table_cell_bold), Paragraph("<font color='#15803d'><b>CHAMPION</b></font>", table_cell)],
        [Paragraph("XGBoost (Tuned)", table_cell), Paragraph("0.9590", table_cell), Paragraph("0.8929", table_cell), Paragraph("0.8562", table_cell), Paragraph("0.8741", table_cell), Paragraph("0.9705", table_cell), Paragraph("Evaluated", table_cell)],
        [Paragraph("Random Forest", table_cell), Paragraph("0.9469", table_cell), Paragraph("0.8643", table_cell), Paragraph("0.8705", table_cell), Paragraph("0.8674", table_cell), Paragraph("0.9649", table_cell), Paragraph("Evaluated", table_cell)],
        [Paragraph("Logistic Regression", table_cell), Paragraph("0.9487", table_cell), Paragraph("0.8357", table_cell), Paragraph("0.8931", table_cell), Paragraph("0.8635", table_cell), Paragraph("0.9643", table_cell), Paragraph("Evaluated", table_cell)],
        [Paragraph("Extra Trees", table_cell), Paragraph("0.9301", table_cell), Paragraph("0.8357", table_cell), Paragraph("0.8931", table_cell), Paragraph("0.8635", table_cell), Paragraph("0.9552", table_cell), Paragraph("Evaluated", table_cell)],
        [Paragraph("Decision Tree", table_cell), Paragraph("0.9007", table_cell), Paragraph("0.8929", table_cell), Paragraph("0.8446", table_cell), Paragraph("0.8681", table_cell), Paragraph("0.9351", table_cell), Paragraph("Evaluated", table_cell)],
    ]
    t_ml = Table(ml_rows, colWidths=[145, 60, 60, 60, 60, 65, 65])
    t_ml.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_ml)
    story.append(Spacer(1, 10))

    # Stage 3
    story.append(Paragraph("Stage 3: Priority Policy & Non-Negotiable Safety Override", h2_style))
    story.append(Paragraph(
        "• <b>Four-Pillar Policy Formula:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>Priority Score = (0.35 * Risk) + (0.25 * Urgency) + (0.25 * Safety Impact) + (0.15 * Line Impact)</code><br/>"
        "• <b>Non-Negotiable Safety Override Rule:</b> In railway safety engineering, statistical machine learning models must never "
        "downgrade active, hazardous infrastructure defects. If a task involves broken rail welds, track circuit dropouts, or snapped OHE droppers, "
        "the policy engine automatically forces: <b>Criticality = 'Critical'</b>, <b>Safety Override = 1</b>, and <b>Priority Score >= 92.5</b>.<br/>"
        "• <b>Local SHAP Attribution:</b> Generates exact marginal contributions (+/- Delta Risk) explaining each prediction to Section Controllers.",
        body_style
    ))

    # Stage 4
    story.append(Paragraph("Stage 4: Maintenance Action Engine & Deterministic 8-Point Compatibility", h2_style))
    story.append(Paragraph(
        "• <b>6-Stage Maintenance Action Decomposition:</b> Every maintenance task is automatically broken down into standard railway steps:<br/>"
        "&nbsp;&nbsp;<code>1. Inspection ➔ 2. Isolation ➔ 3. Core Repair ➔ 4. Testing ➔ 5. Verification ➔ 6. Release</code><br/>"
        "• <b>Deterministic 8-Point Compatibility Engine:</b> Cross-department tasks are never combined merely because they are on the same section. "
        "The engine validates 8 auditable rules before approving co-location:<br/>"
        "&nbsp;&nbsp;1. <i>Spatial Check:</i> Identical corridor section.<br/>"
        "&nbsp;&nbsp;2. <i>Possession Alignment:</i> UP, DOWN, or BOTH lines match or can be isolated together.<br/>"
        "&nbsp;&nbsp;3. <i>Isolation Feasibility:</i> Power block (OHE 25kV discharge) and signaling disconnection must not conflict.<br/>"
        "&nbsp;&nbsp;4. <i>Resource Exclusivity:</i> Exclusive heavy machinery (Tamper machines, Tower Inspection Wagons) cannot be double-booked.<br/>"
        "&nbsp;&nbsp;5. <i>Sequential Dependencies:</i> Structural track repairs precede OHE cantilever adjustments.<br/>"
        "&nbsp;&nbsp;6. <i>Duration Ratio:</i> Durations must not exceed a 2.5x ratio to avoid leaving lines closed unnecessarily.<br/>"
        "&nbsp;&nbsp;7. <i>Physical Clearance:</i> Sufficient physical clearance between simultaneous work gangs.<br/>"
        "&nbsp;&nbsp;8. <i>Train Causality:</i> Safe clearance with moving trains on adjacent operational lines.<br/>"
        "<b>Audit Outcome:</b> Out of 117 candidate pairs evaluated across 12 sections, <b>93 pairs were approved</b> and <b>24 pairs were blocked</b> with explicit reason codes.",
        body_style
    ))

    # Stage 5
    story.append(Paragraph("Stage 5: Time-Aware Google OR-Tools CP-SAT Corridor Optimization", h2_style))
    story.append(Paragraph(
        "• <b>Integer-Minute Timeline:</b> The planning horizon (7 days = 10,080 minutes) is mapped into discrete integer decision variables.<br/>"
        "• <b>Train Precedence Walls:</b> For every moving train on line <i>L</i>, hard no-overlap interval constraints guarantee: "
        "<code>block_end <= train_entry  OR  block_start >= train_exit</code>.<br/>"
        "• <b>Indian Railways Peak Ban:</b> Non-critical maintenance blocks are strictly prohibited between 12:00 and 18:00 (12 PM - 6 PM).<br/>"
        "• <b>Cumulative Fleet Limits:</b> Tamper machines, tower inspection cars, and signal testing sets are bounded by cumulative capacity limits.<br/>"
        "• <b>Block Consolidation:</b> Compatible tasks are packed into unified multi-department possessions (<code>CB_001</code>, <code>CB_002</code>, ...).<br/>"
        "• <b>Alternative Window Evaluation:</b> CP-SAT records why earlier or later windows were rejected (e.g., 'Earlier Window: Collides with Rajdhani #12301; Later Window: Violates IR Peak Ban').",
        body_style
    ))

    # Stage 6
    story.append(Paragraph("Stage 6: Human Review, Approval & Immutable Audit Log", h2_style))
    story.append(Paragraph(
        "Section Controllers retain final authority. Through Screen 12 (Approval & Audit), controllers review scheduled blocks, "
        "inspect AI justification cards, and grant electronic approval or rejection with mandatory remarks. All decisions are logged "
        "to an immutable <code>audit_log</code> table with full user ID, timestamp, and action history.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # ==========================
    # SECTION 3: BASELINE VS CP-SAT EVALUATION
    # ==========================
    story.append(Paragraph("3. Quantitative Evaluation: Baseline Silos vs CP-SAT Schedule", h1_style))
    story.append(Paragraph(
        "Our automated evaluation engine (<code>engine/evaluation_engine.py</code>) executes a head-to-head comparison between "
        "traditional uncoordinated departmental silo booking and our integrated CP-SAT schedule across the identical 220-task backlog:",
        body_style
    ))

    eval_headers = [
        Paragraph("<b>Evaluation Metric</b>", table_header),
        Paragraph("<b>Baseline Silo Booking</b>", table_header),
        Paragraph("<b>AI CP-SAT Schedule</b>", table_header),
        Paragraph("<b>Measured Improvement</b>", table_header)
    ]
    eval_rows = [
        eval_headers,
        [Paragraph("<b>Total Corridor Blocks</b>", table_cell_bold), Paragraph("175 Line Possessions", table_cell), Paragraph("143 Shared Possessions", table_cell), Paragraph("<font color='#15803d'><b>32 Line Closures Saved (-18.3%)</b></font>", table_cell_bold)],
        [Paragraph("<b>Total Block Hours</b>", table_cell_bold), Paragraph("278.2 Hours", table_cell), Paragraph("243.4 Hours", table_cell), Paragraph("<font color='#15803d'><b>34.8 Shared Hours Saved</b></font>", table_cell_bold)],
        [Paragraph("<b>Total Asset Downtime</b>", table_cell_bold), Paragraph("375.6 Hours", table_cell), Paragraph("243.4 Hours", table_cell), Paragraph("<font color='#15803d'><b>35.2% Net Downtime Reduction</b></font>", table_cell_bold)],
        [Paragraph("<b>Corridor Utilization</b>", table_cell_bold), Paragraph("65.0%", table_cell), Paragraph("89.4%", table_cell), Paragraph("<font color='#15803d'><b>+24.4% Efficiency Gain</b></font>", table_cell_bold)],
        [Paragraph("<b>Train Precedence Conflicts</b>", table_cell_bold), Paragraph("Frequent (Manual Squeeze)", table_cell), Paragraph("<b>0 Collisions</b>", table_cell_bold), Paragraph("<font color='#15803d'><b>100% Zero-Conflict Guarantee</b></font>", table_cell_bold)],
        [Paragraph("<b>Multi-Dept Groupings</b>", table_cell_bold), Paragraph("0 Groupings (Pure Silos)", table_cell), Paragraph("24 Coordinated Groups", table_cell), Paragraph("<font color='#15803d'><b>56 Tasks Executed Concurrently</b></font>", table_cell_bold)],
    ]
    t_eval = Table(eval_rows, colWidths=[145, 115, 115, 140])
    t_eval.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_eval)
    story.append(Spacer(1, 12))

    # ==========================
    # SECTION 4: CONTROL CENTER UI/UX (12 SCREENS)
    # ==========================
    story.append(Paragraph("4. Control Center UI/UX Architecture (12 Screens on Port 8765)", h1_style))
    story.append(Paragraph(
        "The web interface (Vite + React + Tailwind + Lucide Icons) provides an industrial operations workstation "
        "engineered for railway controllers, infrastructure engineers, and chief operating managers:",
        body_style
    ))

    ui_headers = [
        Paragraph("<b>Screen Name</b>", table_header),
        Paragraph("<b>Primary Purpose & Operational Features</b>", table_header),
        Paragraph("<b>Target Railway User</b>", table_header)
    ]
    ui_rows = [
        ui_headers,
        [Paragraph("<b>1. Command Center</b>", table_cell_bold), Paragraph("Top 6 system KPIs (Open Tasks: 220, Critical: 97, Blocks: 24, Collisions: 0, Availability: 94.8%), Network Risk Profile by section, and today's unified block timeline.", table_cell), Paragraph("Chief Operations Manager (COM)", table_cell)],
        [Paragraph("<b>2. Network & Sections</b>", table_cell_bold), Paragraph("Corridor overview answering 'Where is risk concentrated?'. Drill into any of the 12 sections to inspect track length, critical task count, condition score, and backlog.", table_cell), Paragraph("Divisional Railway Manager (DRM)", table_cell)],
        [Paragraph("<b>3. Maintenance Tasks</b>", table_cell_bold), Paragraph("Unified filterable backlog (TMS, TDMS, SMMS). Clicking any task row opens the 6-stage operational action package drawer with safety prerequisites.", table_cell), Paragraph("Senior Divisional Engineer (Sr. DEN)", table_cell)],
        [Paragraph("<b>4. GPS Network Map</b>", table_cell_bold), Paragraph("True curved railway track geometry rendered from OpenStreetMap with GPS asset markers, section color coding, and UP/DOWN line offsets.", table_cell), Paragraph("Railway Control Office", table_cell)],
        [Paragraph("<b>5. AI Priority & SHAP</b>", table_cell_bold), Paragraph("Multi-model benchmark leaderboard and interactive task inspector displaying failure risk probability, override badges, and local SHAP feature waterfall cards.", table_cell), Paragraph("Safety & Quality Cell", table_cell)],
        [Paragraph("<b>6. Coordination Center</b>", table_cell_bold), Paragraph("Candidate multi-department task pairs shown side-by-side with 8-point compatibility status (PASS/BLOCKED) and auditable reason codes.", table_cell), Paragraph("Senior Divisional Operations Manager", table_cell)],
        [Paragraph("<b>7. CP-SAT Block Planner</b>", table_cell_bold), Paragraph("Time-aware Gantt chart displaying moving trains alongside corridor blocks. Clicking any block opens the 'Why Did CP-SAT Choose This Block?' modal.", table_cell), Paragraph("Chief Train Controller (CTC)", table_cell)],
        [Paragraph("<b>8. Before vs After (KPIs)</b>", table_cell_bold), Paragraph("Executive comparative scorecard displaying measured savings (32 closures saved, 34.8h downtime saved, 100% collision prevention).", table_cell), Paragraph("Principal Chief Engineer (PCE)", table_cell)],
        [Paragraph("<b>9. Weekly / Monthly Plan</b>", table_cell_bold), Paragraph("Dual-mode calendar view (7-day horizon breakdown) and 30-day section workload exposure heatmap across Engineering, Electrical, and Signals.", table_cell), Paragraph("Corridor Planning Officers", table_cell)],
        [Paragraph("<b>10. Failure Intelligence</b>", table_cell_bold), Paragraph("Government UIMS failure history log (350 events) with train detention minutes, rectification speeds, failure modes, root causes, and Station Master remarks.", table_cell), Paragraph("Commissioner of Railway Safety (CRS)", table_cell)],
        [Paragraph("<b>11. What-If Simulator</b>", table_cell_bold), Paragraph("Interactive slider allowing controllers to shift block timing (-60 min to +120 min). Dynamically simulates conflict with moving train timetables.", table_cell), Paragraph("Section Traffic Controllers", table_cell)],
        [Paragraph("<b>12. Approval & Audit</b>", table_cell_bold), Paragraph("Section Controller review card with electronic sign-off ([APPROVE] / [REJECT]), remarks entry, and chronological immutable audit log.", table_cell), Paragraph("Section Controller on Duty", table_cell)],
    ]
    t_ui = Table(ui_rows, colWidths=[115, 290, 110])
    t_ui.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_ui)
    story.append(Spacer(1, 12))

    # ==========================
    # SECTION 5: VERIFICATION & COMPLIANCE MATRIX
    # ==========================
    story.append(Paragraph("5. Verification & Physics Compliance Matrix", h1_style))
    story.append(Paragraph(
        "An automated 10-point test suite (<code>engine/test_suite.py</code>) validates all physical constraints, "
        "timetable integrity, and safety laws before any block is granted:",
        body_style
    ))

    test_headers = [
        Paragraph("<b>Test ID</b>", table_header),
        Paragraph("<b>Validation Test Name</b>", table_header),
        Paragraph("<b>Category</b>", table_header),
        Paragraph("<b>Test Verification Result</b>", table_header)
    ]
    test_rows = [
        test_headers,
        [Paragraph("<b>1.1</b>", table_cell_bold), Paragraph("Geospatial Link Integrity", table_cell), Paragraph("SQL", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (100% assets mapped to valid sections)</font>", table_cell)],
        [Paragraph("<b>1.2</b>", table_cell_bold), Paragraph("Timetable Chronology", table_cell), Paragraph("SQL", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (Zero causality violations: exit > entry)</font>", table_cell)],
        [Paragraph("<b>2.1</b>", table_cell_bold), Paragraph("Priority Score Bounds", table_cell), Paragraph("Python", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (Scores strictly bounded in [0.0, 100.0])</font>", table_cell)],
        [Paragraph("<b>2.2</b>", table_cell_bold), Paragraph("Execution Completeness", table_cell), Paragraph("Python", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (100% of 220 pending tasks scored)</font>", table_cell)],
        [Paragraph("<b>3.1</b>", table_cell_bold), Paragraph("Train Precedence Collision", table_cell), Paragraph("CP-SAT", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (Zero line collisions with moving trains)</font>", table_cell)],
        [Paragraph("<b>3.2</b>", table_cell_bold), Paragraph("Resource Capacity Limits", table_cell), Paragraph("CP-SAT", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (Machinery limits strictly respected)</font>", table_cell)],
        [Paragraph("<b>4.1</b>", table_cell_bold), Paragraph("Combined Block Structure", table_cell), Paragraph("CP-SAT", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (Multi-dept groups: >=2 depts, aligned)</font>", table_cell)],
        [Paragraph("<b>5.1</b>", table_cell_bold), Paragraph("IR Peak Traffic Ban", table_cell), Paragraph("CP-SAT", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (Zero non-critical blocks during 12:00-18:00)</font>", table_cell)],
        [Paragraph("<b>6.1</b>", table_cell_bold), Paragraph("Critical Safety Override", table_cell), Paragraph("Policy", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (100% safety tasks locked to Critical >=92.5)</font>", table_cell)],
        [Paragraph("<b>8.1</b>", table_cell_bold), Paragraph("Action Workflow Completeness", table_cell), Paragraph("Actions", table_cell), Paragraph("<font color='#15803d'><b>PASSED</b> (100% tasks mapped to 6-stage action packages)</font>", table_cell)],
    ]
    t_test = Table(test_rows, colWidths=[45, 170, 70, 230])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, CARD_BG]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_test)
    story.append(Spacer(1, 14))

    # ==========================
    # SECTION 6: API ACCESS & CONCLUSION
    # ==========================
    story.append(Paragraph("6. Live System Endpoints & API Access", h1_style))
    story.append(Paragraph(
        "The system is live, self-contained, and running locally on port 8765:<br/>"
        "• <b>Control Center UI:</b> <code>http://localhost:8765/</code><br/>"
        "• <b>System Health Check:</b> <code>http://localhost:8765/api/health</code><br/>"
        "• <b>ML Benchmark Leaderboard:</b> <code>http://localhost:8765/api/ml/benchmark</code><br/>"
        "• <b>Local SHAP Feature Attribution:</b> <code>http://localhost:8765/api/ml/explain/&lt;task_id&gt;</code><br/>"
        "• <b>Deterministic Compatibility Pairs:</b> <code>http://localhost:8765/api/compatibility</code><br/>"
        "• <b>Scheduled Blocks & 'Why Chosen':</b> <code>http://localhost:8765/api/blocks/detailed</code><br/>"
        "• <b>Government Failure Intelligence:</b> <code>http://localhost:8765/api/failures</code><br/>"
        "• <b>Baseline vs CP-SAT Evaluation:</b> <code>http://localhost:8765/api/evaluation/baseline-vs-optimized</code><br/>"
        "• <b>Real-Time What-If Simulation:</b> <code>http://localhost:8765/api/what-if</code><br/>"
        "• <b>Approval Workflow & Audit Log:</b> <code>http://localhost:8765/api/approvals</code> & <code>/api/audit</code>",
        body_style
    ))

    # Build document with custom canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_path}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "SYSTEM_ARCHITECTURE_AND_DATA_FLOW.pdf")
    build_pdf(target)
