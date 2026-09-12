import os
import sys
import json
import math
import random
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db_helper import get_db_engine

def transform_and_seed():
    engine = get_db_engine()
    print("=" * 70)
    print("STEP 1: Ingesting mapped_assets.csv & configuring Asset Master...")
    print("=" * 70)

    csv_path = os.path.join(BASE_DIR, 'mapped_assets.csv')
    df_assets = pd.read_csv(csv_path)

    def parse_lat(loc):
        try:
            return float(str(loc).split(',')[0])
        except Exception:
            return 25.34243
            
    def parse_lon(loc):
        try:
            return float(str(loc).split(',')[1])
        except Exception:
            return 82.95641

    df_assets['location_lat'] = df_assets['location'].apply(parse_lat)
    df_assets['location_lon'] = df_assets['location'].apply(parse_lon)

    # 1. Corridors
    corridors = [
        {"corridor_id": "CORR_BSB_LKO", "name": "Varanasi - Sultanpur - Lucknow Mainline", "zone": "NR", "division": "LKO", "electrification_type": "25kV AC OHE", "signaling_type": "Automatic Absolute"},
        {"corridor_id": "CORR_HWH_DLI", "name": "Howrah - New Delhi Trunk Line", "zone": "ECR", "division": "DDU", "electrification_type": "2x25kV AC OHE", "signaling_type": "Automatic 4-Aspect"},
        {"corridor_id": "CORR_DDU_YARD", "name": "Deen Dayal Upadhyaya Junction & Yards", "zone": "ECR", "division": "DDU", "electrification_type": "25kV AC OHE", "signaling_type": "Route Relay Interlocking"}
    ]
    df_corridors = pd.DataFrame(corridors)

    # 2. Sections
    sections = []
    for i in range(1, 5):
        sections.append({
            "section_id": f"SEC_BSB_LKO_{i:02d}",
            "name": f"Varanasi-Lucknow Block {i}",
            "corridor_id": "CORR_BSB_LKO",
            "length_km": round(random.uniform(18.0, 32.0), 2)
        })
    for i in range(1, 5):
        sections.append({
            "section_id": f"SEC_HWH_DLI_{i:02d}",
            "name": f"Howrah-Delhi Fast Corridor {i}",
            "corridor_id": "CORR_HWH_DLI",
            "length_km": round(random.uniform(22.0, 42.0), 2)
        })
    for i in range(1, 5):
        sections.append({
            "section_id": f"SEC_DDU_YARD_{i:02d}",
            "name": f"DDU Marshalling & Yard Sec {i}",
            "corridor_id": "CORR_DDU_YARD",
            "length_km": round(random.uniform(6.0, 14.0), 2)
        })
    df_sections = pd.DataFrame(sections)

    geo_path = os.path.join(BASE_DIR, 'section_geography.json')
    if os.path.exists(geo_path):
        with open(geo_path, 'r', encoding='utf-8') as f:
            geo = json.load(f)
        for corr_id, prefix in [('CORR_BSB_LKO', 'SEC_BSB_LKO'), ('CORR_HWH_DLI', 'SEC_HWH_DLI')]:
            for blk in geo.get(corr_id, []):
                sid = f"{prefix}_{blk['block_index']:02d}"
                mask = df_sections['section_id'] == sid
                geom_str = json.dumps(blk.get('geometry', [[blk['start_lat'], blk['start_lon']],[blk['end_lat'], blk['end_lon']]]))
                df_sections.loc[mask, ['start_station', 'end_station', 'start_lat', 'start_lon',
                                       'end_lat', 'end_lon', 'length_km', 'geometry']] = [
                    blk['start_station'], blk['end_station'], blk['start_lat'], blk['start_lon'],
                    blk['end_lat'], blk['end_lon'], blk['length_km'], geom_str]
        for y in geo.get('CORR_DDU_YARD', []):
            mask = df_sections['section_id'] == y['section_id_hint']
            if mask.any():
                geom_str = json.dumps(y.get('geometry', [[y['start_lat'], y['start_lon']]]))
                df_sections.loc[mask, ['start_station', 'end_station', 'start_lat', 'start_lon',
                                       'end_lat', 'end_lon', 'geometry']] = [
                    y['start_station'], y['end_station'], y['start_lat'], y['start_lon'],
                    y['end_lat'], y['end_lon'], geom_str]
        print("  ✓ Merged accurate section geography from section_geography.json")

    # Spatial matching: nearest section to asset location
    def _haversine(lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
        a = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
        return 6371 * 2 * math.asin(math.sqrt(a))

    section_centers = []
    for _, s in df_sections.iterrows():
        try:
            g = s.get('geometry')
            if g and pd.notna(g):
                geom = json.loads(g) if isinstance(g, str) else g
                if geom and len(geom) >= 2:
                    clat = sum(p[0] for p in geom) / len(geom)
                    clon = sum(p[1] for p in geom) / len(geom)
                else:
                    clat = (float(s['start_lat']) + float(s['end_lat'])) / 2
                    clon = (float(s['start_lon']) + float(s['end_lon'])) / 2
            else:
                clat = (float(s['start_lat']) + float(s['end_lat'])) / 2
                clon = (float(s['start_lon']) + float(s['end_lon'])) / 2
        except Exception:
            clat = 25.3
            clon = 82.9
        section_centers.append((s['section_id'], s['corridor_id'], clat, clon))

    assigned_sections = []
    assigned_corridors = []
    for _, row in df_assets.iterrows():
        alat = float(row['location_lat'])
        alon = float(row['location_lon'])
        best_sid = section_centers[0][0]
        best_cid = section_centers[0][1]
        best_d = float('inf')
        for sid, cid, clat, clon in section_centers:
            d = _haversine(alon, alat, clon, clat)
            if d < best_d:
                best_d = d
                best_sid = sid
                best_cid = cid
        assigned_sections.append(best_sid)
        assigned_corridors.append(best_cid)

    df_assets['section_id'] = assigned_sections
    df_assets['corridor_id'] = assigned_corridors
    print(f"  ✓ Spatially mapped {len(df_assets)} assets to 12 operational railway sections.")

    # Build Asset Master fields
    np.random.seed(42)
    random.seed(42)
    base_date = datetime(2026, 8, 23)

    asset_subtypes = {
        'Track': ['60kg UIC Rail', 'PSC Sleeper 60kg', 'Glued Insulated Joint', 'Turnout 1:12 Curved', 'Expansion Joint'],
        'OHE': ['Contact Wire Cu 107mm2', 'Catenary Wire Cd-Cu 65mm2', 'Cantilever Assembly', 'Neutral Section Ceramic', 'Dropper Wire'],
        'Signal': ['Electronic Interlocking SSI', 'Axle Counter Multi-Section', 'Track Circuit DC High Voltage', 'Point Machine 143mm', 'LED 4-Aspect Signal']
    }

    df_assets_dedup = df_assets.drop_duplicates(subset=['asset_id']).copy()
    asset_rows = []
    for _, a in df_assets_dedup.iterrows():
        aid = a['asset_id']
        dept = a['department']
        atype = a.get('asset_type', 'Track')
        stypes = asset_subtypes.get(dept, ['Standard Unit'])
        subtype = random.choice(stypes)
        age = random.randint(2, 28)
        cond = int(np.clip(100 - age * 2.1 + random.gauss(0, 8), 15, 98))
        health = int(np.clip(cond - random.randint(0, 8), 10, 100))
        crit_class = 'A+' if cond < 40 else ('A' if cond < 65 else ('B' if cond < 85 else 'C'))
        
        last_m = (base_date - timedelta(days=random.randint(15, 180))).strftime('%Y-%m-%d')
        last_i = (base_date - timedelta(days=random.randint(5, 45))).strftime('%Y-%m-%d')
        comm_d = (base_date - timedelta(days=age * 365)).strftime('%Y-%m-%d')

        asset_rows.append({
            'asset_id': aid,
            'asset_number': f"IR-{dept[:3].upper()}-{aid[-6:]}",
            'asset_type': atype,
            'asset_subtype': subtype,
            'department': dept,
            'zone': 'NR' if 'BSB' in a['corridor_id'] else 'ECR',
            'division': 'LKO' if 'BSB' in a['corridor_id'] else 'DDU',
            'corridor_id': a['corridor_id'],
            'section_id': a['section_id'],
            'block_section': f"{a['section_id']}_BLK",
            'station_from': 'BSB',
            'station_to': 'SLN' if 'BSB' in a['corridor_id'] else 'DDU',
            'chainage_km': round(random.uniform(5.0, 180.0), 2),
            'direction': 'UP' if random.random() > 0.5 else 'DOWN',
            'location_lat': a['location_lat'],
            'location_lon': a['location_lon'],
            'commissioning_date': comm_d,
            'asset_age_years': age,
            'asset_importance': round(random.uniform(0.65, 0.99), 2),
            'criticality_class': crit_class,
            'operational_status': 'Operational',
            'last_maintenance_date': last_m,
            'last_inspection_date': last_i,
            'condition_score': cond,
            'health_index': health
        })
    df_asset_master = pd.DataFrame(asset_rows)

    print("=" * 70)
    print("STEP 2: Generating Government Failure Event History (UIMS/COA Schema)...")
    print("=" * 70)

    # 4. Failure Event History
    failure_types = {
        'Engineering': [
            ('RAIL_FRACTURE', 'Broken Rail Weld at Km 142/6', 'Fatigue / Thermal Stress', 'Permanent Way'),
            ('TRACK_GAUGE_DEFECT', 'Track Gauge Spread > 1682mm', 'Slack gauge bolts / Wear', 'Track Maintenance Gang'),
            ('WELD_FAILURE', 'AT Weld Failure in Continuous Welded Rail', 'Defective weld execution', 'Welding Gang'),
            ('POINTS_CROSSING_DEFECT', 'Crossing Nose Wear exceeding 6mm', 'Heavy Freight impact', 'P-Way Sectional')
        ],
        'Traction': [
            ('OHE_DROPPER_BREAK', 'OHE Dropper Wire snapped under pantograph impact', 'Vibration fatigue', 'OHE Depo'),
            ('CANTILEVER_FLASHOVER', 'Cantilever Insulator Flashover and tripping', 'Bird nest contamination / Dust', 'TRD Sub-Station'),
            ('CONTACT_WIRE_SAG', 'Contact wire sag below 5.50m clearance', 'Tensioning wheel stuck', 'TRD Gang'),
            ('NEUTRAL_SECTION_ARC', 'Heavy flashover at PTFE Neutral Section', 'Pantograph not lowered in coasting', 'Electric Loco Shed')
        ],
        'S&T': [
            ('TRACK_CIRCUIT_FAIL', 'DC Track Circuit Drop / Bobbing failure', 'Ballast resistance drop / Rain water', 'Signal Maintenance'),
            ('AXLE_COUNTER_RESET', 'Digital Axle Counter Sector Count Mismatch', 'Transient inductive surge', 'S&T Telecom'),
            ('POINT_MACHINE_FAIL', '143mm Point Machine detection contact failure', 'Obstruction in switch rail tongue', 'Signal Inspector'),
            ('SIGNAL_ASPECT_FAIL', 'Down Home Signal LED Aspect blank', 'Signal surge arrestor burnt', 'Signal Maintenance')
        ]
    }

    failure_events = []
    af_counter = 5000
    for idx in range(350):
        af_counter += 1
        dept = random.choice(['Engineering', 'Traction', 'S&T'])
        ft_info = random.choice(failure_types[dept])
        sec_info = random.choice(sections)
        sid = sec_info['section_id']
        cid = sec_info['corridor_id']
        
        # Historical dates over previous 180 days
        days_ago = random.randint(1, 180)
        f_date = (base_date - timedelta(days=days_ago)).date()
        f_hour = random.randint(0, 23)
        f_min = random.randint(0, 59)
        f_start = datetime(f_date.year, f_date.month, f_date.day, f_hour, f_min)
        duration_min = random.randint(25, 210)
        f_end = f_start + timedelta(minutes=duration_min)
        
        trains_del = random.randint(1, 7) if duration_min > 40 else random.randint(0, 2)
        tot_det = round(trains_del * random.uniform(18.0, 48.0), 1)
        avg_det = round(tot_det / max(1, trains_del), 1)

        failure_events.append({
            'af_id': f"AF_2026_{af_counter}",
            'uims_id': f"UIMS_NR_{af_counter}",
            'zone': 'NR' if 'BSB' in cid else 'ECR',
            'division': 'LKO' if 'BSB' in cid else 'DDU',
            'head': 'Fixed Infrastructure Failures',
            'sub_head': dept,
            'failure_type': ft_info[0],
            'failure_date': f_date.strftime('%Y-%m-%d'),
            'failure_time': f"{f_hour:02d}:{f_min:02d}",
            'failure_start': f_start.strftime('%Y-%m-%d %H:%M:%S'),
            'failure_end': f_end.strftime('%Y-%m-%d %H:%M:%S'),
            'failure_duration_min': duration_min,
            'corridor_id': cid,
            'coa_section': f"{sid}_COA",
            'block_section': f"{sid}_BLK",
            'station_from': 'BSB',
            'station_to': 'SLN' if 'BSB' in cid else 'DDU',
            'section_id': sid,
            'chainage_km': round(random.uniform(10.0, 160.0), 2),
            'direction': 'UP' if random.random() > 0.5 else 'DOWN',
            'train_name': f"142{random.randint(10, 99)} Intercity Superfast",
            'train_id': f"TRN_{random.randint(12000, 14999)}",
            'loco_id': f"WAP7-{random.randint(30200, 30999)}",
            'coach_id': f"C-{random.randint(10, 99)}",
            'wagon_id': f"BOXN-{random.randint(1000, 9999)}",
            'trains_delayed': trains_del,
            'avg_detention_min': avg_det,
            'total_detention_min': tot_det,
            'service_added': 'No',
            'update_time': f_end.strftime('%Y-%m-%d %H:%M:%S'),
            'responsibility': ft_info[3],
            'cause': ft_info[2],
            'subcause': ft_info[0].replace('_', ' ').title(),
            'sm_remarks': f"Station Master reported section failure: {ft_info[1]}. COA line block advised.",
            'department_comment': f"Emergency field staff attended. Line rectified in {duration_min} mins.",
            'raw_description': ft_info[1],
            'source_system': 'TMS' if dept == 'Engineering' else ('TDMS' if dept == 'Traction' else 'SMMS')
        })
    df_failures = pd.DataFrame(failure_events)
    print(f"  ✓ Generated {len(df_failures)} government-aligned UIMS/COA failure history events.")

    # 5. Defect History
    defect_records = []
    def_counter = 1000
    for a in asset_rows[:400]:
        if a['condition_score'] < 75 or random.random() < 0.35:
            def_counter += 1
            dept = a['department']
            d_type = random.choice(failure_types[dept])[0]
            detected = (base_date - timedelta(days=random.randint(3, 90))).strftime('%Y-%m-%d %H:%M:%S')
            resolved = (base_date - timedelta(days=random.randint(1, 10))).strftime('%Y-%m-%d %H:%M:%S') if random.random() > 0.3 else None
            recur = 1 if a['condition_score'] < 50 else 0

            defect_records.append({
                'defect_id': f"DEF_{def_counter}",
                'asset_id': a['asset_id'],
                'section_id': a['section_id'],
                'defect_type': d_type,
                'severity': a['criticality_class'],
                'detected_at': detected,
                'resolved_at': resolved,
                'recurrence_flag': recur,
                'source_system': 'TMS' if dept == 'Engineering' else ('TDMS' if dept == 'Traction' else 'SMMS'),
                'description': f"Automated inspection detected {d_type.replace('_', ' ').lower()} on asset {a['asset_id']}."
            })
    df_defects = pd.DataFrame(defect_records)
    print(f"  ✓ Generated {len(df_defects)} historical defect records linked to canonical assets.")

    # 6. Maintenance Tasks (220 pending unified backlog tasks)
    print("=" * 70)
    print("STEP 3: Generating Unified Maintenance Tasks Backlog...")
    print("=" * 70)

    task_types_map = {
        'Engineering': [
            ('Broken Rail Weld', 'PWAY-01', 'Critical', 90, 'High', 'Track Tamper Machine', 'Track Possession'),
            ('Track Gauge Spread', 'PWAY-02', 'High', 120, 'Medium', 'Track Inspection Rig', 'Line Block'),
            ('Ballast Deep Screening', 'PWAY-03', 'Medium', 180, 'Low', 'Ballast Cleaner BCM', 'Corridor Block'),
            ('Point Machine Mechanical Fault', 'PWAY-04', 'Critical', 60, 'Critical', 'P-Way Emergency Gang', 'Track Possession')
        ],
        'Traction': [
            ('OHE Dropper Broken', 'TRD-01', 'Critical', 90, 'High', 'Tower Inspection Wagon', 'Power Block'),
            ('Cantilever Insulator Flashover', 'TRD-02', 'High', 60, 'Medium', 'OHE Gang Wagon', 'Power Block'),
            ('Contact Wire Sag', 'TRD-03', 'Medium', 120, 'Medium', 'OHE Tower Wagon', 'Power Block'),
            ('Neutral Section Inspection', 'TRD-04', 'Low', 90, 'Low', 'TRD Testing Kit', 'Power Block')
        ],
        'S&T': [
            ('Track Circuit Short', 'SIG-01', 'Critical', 60, 'Critical', 'Signal Testing Rig', 'Signaling Disconnection'),
            ('Axle Counter Error', 'SIG-02', 'High', 90, 'High', 'Axle Counter Calibrator', 'Signaling Disconnection'),
            ('Signal Aspect Lamp Fail', 'SIG-03', 'Critical', 45, 'Critical', 'Signal Gang Vehicle', 'Signaling Disconnection'),
            ('Point Machine Detection Fault', 'SIG-04', 'High', 90, 'High', 'Interlocking Rig', 'Signaling Disconnection')
        ]
    }

    sampled_assets = df_asset_master.sample(n=220, random_state=42).reset_index(drop=True)
    tasks = []
    task_actions_list = []
    
    for i, a in sampled_assets.iterrows():
        dept = a['department']
        t_choice = random.choice(task_types_map[dept])
        task_name, d_code, def_crit, duration, saf_imp, req_res, isol_req = t_choice
        
        # Determine due date
        if def_crit == 'Critical':
            due_offset = random.randint(-1, 2)
        elif def_crit == 'High':
            due_offset = random.randint(1, 4)
        elif def_crit == 'Medium':
            due_offset = random.randint(3, 7)
        else:
            due_offset = random.randint(6, 12)
            
        due_d = (base_date + timedelta(days=due_offset)).strftime('%Y-%m-%d')
        tid = f"TSK_{1000 + i}"
        
        # Double-line working: S&T works affect BOTH lines; track/traction take UP or DOWN
        line_affected = 'BOTH' if dept == 'S&T' else ('UP' if i % 2 == 0 else 'DOWN')
        
        tasks.append({
            'task_id': tid,
            'source_system': 'TMS' if dept == 'Engineering' else ('TDMS' if dept == 'Traction' else 'SMMS'),
            'department': dept,
            'asset_id': a['asset_id'],
            'asset_type': a['asset_type'],
            'section_id': a['section_id'],
            'corridor_id': a['corridor_id'],
            'task_type': task_name,
            'defect_code': d_code,
            'inspection_code': f"INSP_{random.randint(100, 999)}",
            'safety_impact': saf_imp,
            'urgency': 'Immediate' if due_offset <= 0 else ('High' if due_offset <= 2 else 'Normal'),
            'due_date': due_d,
            'duration_minutes': duration,
            'earliest_start': (base_date + timedelta(hours=random.randint(1, 24))).strftime('%Y-%m-%d %H:%M:%S'),
            'latest_finish': (base_date + timedelta(days=due_offset + 3)).strftime('%Y-%m-%d %H:%M:%S'),
            'required_resources': req_res,
            'isolation_requirement': isol_req,
            'dependency_ids': '',
            'status': 'Pending',
            'created_at': (base_date - timedelta(days=random.randint(1, 10))).strftime('%Y-%m-%d %H:%M:%S'),
            'updated_at': base_date.strftime('%Y-%m-%d %H:%M:%S'),
            'risk_probability': None,
            'priority_score': None,
            'criticality': def_crit,
            'affects_line': line_affected
        })

        # Generate Maintenance Actions (Canonical 6-step railway procedure)
        actions = [
            (1, 'Site Inspection & Gauge Verification', 'Sectional Gang (2)', 'Diagnostic Gauges', 15, 15, 'None', 'None', 1),
            (2, 'Permit-to-Work & Traction/Signal Isolation', 'Station Master & TRD (2)', 'Disconnection Keys', 15, 15, isol_req, 'Line Possession', 1),
            (3, f"Core Maintenance Execution ({task_name})", f"{dept} Maintenance Gang (6)", req_res, 10, duration - 40, isol_req, 'Corridor Block', 1),
            (4, 'Electromechanical Testing & Alignment Check', 'Inspector & Technician (2)', 'Test Instruments', 10, 15, isol_req, 'Possession', 1),
            (5, 'Joint Track & Signal Verification', 'Joint Inspection Committee (3)', 'Joint Certification Kit', 10, 10, 'None', 'Possession', 1),
            (6, 'De-isolation, Block Release & Caution Clearance', 'Traffic Controller & P-Way', 'Safety Release Memo', 10, 10, 'None', 'Release', 1)
        ]
        for seq, aname, crew, res, setup, work_dur, act_isol, act_poss, verif in actions:
            task_actions_list.append({
                'action_id': f"ACT_{tid}_{seq}",
                'task_id': tid,
                'action_type': aname,
                'required_crew': crew,
                'required_resources': res,
                'setup_minutes': setup,
                'work_duration_minutes': max(10, work_dur),
                'isolation_requirement': act_isol,
                'possession_requirement': act_poss,
                'verification_required': verif,
                'sequence_order': seq
            })

    df_tasks = pd.DataFrame(tasks)
    df_task_actions = pd.DataFrame(task_actions_list)
    print(f"  ✓ Created {len(df_tasks)} unified maintenance tasks with {len(df_task_actions)} decomposed maintenance actions.")

    # 7. Sequential Train Timetable (7-day horizon with headway)
    print("=" * 70)
    print("STEP 4: Generating Sequential Train Timetables & Operational Blocks...")
    print("=" * 70)

    train_movements = []
    train_types = ['Vande Bharat Express', 'Rajdhani Express', 'Mail/Express', 'Container Goods Freight', 'Coal Freight']
    train_counter = 100

    for s in sections:
        sec_id = s['section_id']
        cid = s['corridor_id']
        curr = base_date + timedelta(hours=random.randint(1, 3))
        horizon_end = base_date + timedelta(days=7)

        while curr < horizon_end:
            transit_duration = random.randint(25, 45)
            entry_t = curr
            exit_t = entry_t + timedelta(minutes=transit_duration)
            if exit_t > horizon_end:
                break
            train_counter += 1
            t_type = random.choice(train_types)
            is_pass = 1 if 'Express' in t_type else 0
            is_good = 1 - is_pass
            t_dir = 'UP' if train_counter % 2 == 0 else 'DOWN'

            train_movements.append({
                'movement_id': f"MOV_{train_counter}",
                'train_id': f"TRN_{train_counter}",
                'train_name': f"{t_type} #{train_counter}",
                'train_type': t_type,
                'corridor_id': cid,
                'section_id': sec_id,
                'block_section': f"{sec_id}_BLK",
                'direction': t_dir,
                'entry_time': entry_t.strftime('%Y-%m-%d %H:%M:%S'),
                'exit_time': exit_t.strftime('%Y-%m-%d %H:%M:%S'),
                'actual_entry': entry_t.strftime('%Y-%m-%d %H:%M:%S'),
                'actual_exit': exit_t.strftime('%Y-%m-%d %H:%M:%S'),
                'delay_minutes': 0,
                'priority_class': 'High' if 'Vande' in t_type or 'Rajdhani' in t_type else 'Standard',
                'is_passenger': is_pass,
                'is_goods': is_good,
                'date': entry_t.date().strftime('%Y-%m-%d')
            })

            hour = exit_t.hour
            # Night window gap: 00:00 - 05:00 has 220-330 min gap for corridor blocks
            if 0 <= hour <= 4:
                gap = random.randint(220, 320)
            else:
                gap = random.randint(65, 170)
            curr = exit_t + timedelta(minutes=gap)

    df_trains = pd.DataFrame(train_movements)
    print(f"  ✓ Generated {len(df_trains)} conflict-free sequential train movements.")

    # 8. Block Windows
    block_windows = []
    bw_counter = 1
    for day in range(7):
        curr_day = base_date + timedelta(days=day)
        for s in sections:
            sid = s['section_id']
            cid = s['corridor_id']
            # Window 1: Night shadow corridor window (01:30 - 04:30)
            w1_start = datetime(curr_day.year, curr_day.month, curr_day.day, 1, 30)
            w1_end = w1_start + timedelta(hours=3)
            block_windows.append({
                'block_id': f"BW_{bw_counter:04d}",
                'corridor_id': cid,
                'section_id': sid,
                'block_section': f"{sid}_BLK",
                'date': curr_day.strftime('%Y-%m-%d'),
                'start_time': w1_start.strftime('%Y-%m-%d %H:%M:%S'),
                'end_time': w1_end.strftime('%Y-%m-%d %H:%M:%S'),
                'duration_min': 180,
                'block_type': 'Corridor Integrated Block',
                'availability_status': 'AVAILABLE',
                'direction': 'BOTH',
                'line': 'BOTH',
                'allowed_departments': 'Engineering,Traction,S&T',
                'isolation_type': 'Complete Power & Track Possession',
                'source': 'Divisional Timetable Grant',
                'created_at': base_date.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': base_date.strftime('%Y-%m-%d %H:%M:%S')
            })
            bw_counter += 1

            # Window 2: Mid-day freight window (10:00 - 12:00)
            w2_start = datetime(curr_day.year, curr_day.month, curr_day.day, 10, 0)
            w2_end = w2_start + timedelta(hours=2)
            block_windows.append({
                'block_id': f"BW_{bw_counter:04d}",
                'corridor_id': cid,
                'section_id': sid,
                'block_section': f"{sid}_BLK",
                'date': curr_day.strftime('%Y-%m-%d'),
                'start_time': w2_start.strftime('%Y-%m-%d %H:%M:%S'),
                'end_time': w2_end.strftime('%Y-%m-%d %H:%M:%S'),
                'duration_min': 120,
                'block_type': 'Line Possession Block',
                'availability_status': 'AVAILABLE',
                'direction': 'UP',
                'line': 'UP',
                'allowed_departments': 'Engineering,S&T',
                'isolation_type': 'Line Possession',
                'source': 'Divisional Timetable Grant',
                'created_at': base_date.strftime('%Y-%m-%d %H:%M:%S'),
                'updated_at': base_date.strftime('%Y-%m-%d %H:%M:%S')
            })
            bw_counter += 1
    df_block_windows = pd.DataFrame(block_windows)
    print(f"  ✓ Generated {len(df_block_windows)} operational corridor block windows.")

    # 9. Goods Forecast
    goods_forecasts = []
    gf_counter = 1
    for day in range(7):
        curr_day = base_date + timedelta(days=day)
        for s in sections:
            sid = s['section_id']
            cid = s['corridor_id']
            for slot_start, slot_end in [(0, 6), (6, 12), (12, 18), (18, 24)]:
                t_start = datetime(curr_day.year, curr_day.month, curr_day.day, slot_start, 0)
                t_end = datetime(curr_day.year, curr_day.month, curr_day.day, slot_end - 1, 59)
                exp_goods = random.randint(3, 11) if 'DDU' in cid else random.randint(2, 7)
                goods_forecasts.append({
                    'forecast_id': f"GF_{gf_counter:04d}",
                    'corridor_id': cid,
                    'section_id': sid,
                    'forecast_date': curr_day.strftime('%Y-%m-%d'),
                    'time_window_start': t_start.strftime('%Y-%m-%d %H:%M:%S'),
                    'time_window_end': t_end.strftime('%Y-%m-%d %H:%M:%S'),
                    'expected_goods_trains': exp_goods,
                    'forecast_confidence': round(random.uniform(0.82, 0.94), 2),
                    'source': 'COA FOIS Predictive Goods Model',
                    'generated_at': base_date.strftime('%Y-%m-%d %H:%M:%S')
                })
                gf_counter += 1
    df_goods_forecast = pd.DataFrame(goods_forecasts)
    print(f"  ✓ Generated {len(df_goods_forecast)} freight movement forecasts.")

    # 10. Physical Resources
    resources = [
        {"resource_id": "RES_TAMPER_01", "resource_type": "Heavy Track Tamping Machine (CSM)", "department": "Engineering", "capability": "Track Levelling & Tamping", "section_id": "SEC_BSB_LKO_01", "capacity": 2, "team_size": 8, "skill": "Heavy P-Way Machine Operator", "equipment": "Plasser CSM-09", "status": "AVAILABLE"},
        {"resource_id": "RES_TAMPER_02", "resource_type": "Ballast Cleaning Machine (BCM)", "department": "Engineering", "capability": "Deep Ballast Screening", "section_id": "SEC_HWH_DLI_01", "capacity": 1, "team_size": 10, "skill": "P-Way Heavy Screening Operator", "equipment": "Plasser BCM-80", "status": "AVAILABLE"},
        {"resource_id": "RES_OHE_TOWER_01", "resource_type": "8-Wheeler OHE Tower Inspection Car", "department": "Traction", "capability": "OHE Catenary/Dropper Inspection", "section_id": "SEC_BSB_LKO_02", "capacity": 2, "team_size": 6, "skill": "Traction Distribution Supervisor", "equipment": "BEML 8-Wheeler Tower Car", "status": "AVAILABLE"},
        {"resource_id": "RES_OHE_WAGON_02", "resource_type": "OHE Wiring & Tensioning Train", "department": "Traction", "capability": "Contact Wire Renewal", "section_id": "SEC_HWH_DLI_02", "capacity": 1, "team_size": 8, "skill": "OHE Wiring Specialist", "equipment": "Wiring Wagon Rig", "status": "AVAILABLE"},
        {"resource_id": "RES_SIG_RIG_01", "resource_type": "Signal Diagnostic & Interlock Test Rig", "department": "S&T", "capability": "Electronic Interlocking & Point Testing", "section_id": "SEC_BSB_LKO_01", "capacity": 3, "team_size": 4, "skill": "Signal Interlocking Engineer", "equipment": "SSI Logic Analyzer", "status": "AVAILABLE"},
        {"resource_id": "RES_AXLE_CALIB_02", "resource_type": "Digital Axle Counter Diagnostic Unit", "department": "S&T", "capability": "High-Precision Track Detection Calibration", "section_id": "SEC_DDU_YARD_01", "capacity": 2, "team_size": 4, "skill": "Telecom / Axle Counter Specialist", "equipment": "Frauscher Sensor Calibrator", "status": "AVAILABLE"}
    ]
    df_resources = pd.DataFrame(resources)
    print(f"  ✓ Configured {len(df_resources)} physical machinery and specialized gang resources.")

    # 10b. Inspections & Maintenance History (Blueprint v2 Section 09)
    inspections_list = []
    insp_counter = 1
    for a in asset_rows[:120]:
        aid = a['asset_id']
        sid = a['section_id']
        dept = a['department']
        itype = 'Ultrasonic Rail Flaw' if dept == 'Engineering' else ('OHE Current Test' if dept == 'Traction' else 'Axle Counter Check')
        inspections_list.append({
            'inspection_id': f"INSP_{insp_counter:04d}",
            'asset_id': aid,
            'section_id': sid,
            'inspection_date': a['last_inspection_date'],
            'inspection_type': itype,
            'condition_score': a['condition_score'],
            'inspector_id': f"INSP_OFFICER_{random.randint(10, 99)}",
            'findings': f"Field condition assessed at {a['condition_score']}/100. Routine preventive action recommended.",
            'created_at': a['last_inspection_date'] + " 08:00:00"
        })
        insp_counter += 1
    df_inspections = pd.DataFrame(inspections_list)

    maint_hist_list = []
    mh_counter = 1
    for a in asset_rows[:80]:
        aid = a['asset_id']
        dept = a['department']
        maint_hist_list.append({
            'record_id': f"MH_{mh_counter:04d}",
            'task_id': f"PAST_TSK_{mh_counter:04d}",
            'asset_id': aid,
            'completed_at': a['last_maintenance_date'] + " 16:30:00",
            'duration_minutes': random.choice([45, 60, 90, 120]),
            'actual_cost': float(random.randint(15000, 85000)),
            'rectification_details': f"Scheduled maintenance completed by {dept} divisional gang.",
            'outcome_status': 'COMPLETED'
        })
        mh_counter += 1
    df_maint_hist = pd.DataFrame(maint_hist_list)

    # 11. Write everything to Database
    print("=" * 70)
    print("STEP 5: Persisting all tables to database...")
    print("=" * 70)

    tables_to_clear = [
        'audit_log', 'task_compatibility', 'task_dependencies', 'ml_predictions',
        'optimized_blocks', 'schedule_versions', 'task_actions', 'goods_forecast',
        'block_windows', 'defect_history', 'failure_event_history', 'train_movements',
        'maintenance_tasks', 'resources', 'assets', 'sections', 'corridors', 'department_feeds',
        'inspections', 'maintenance_history', 'block_tasks'
    ]

    with engine.begin() as conn:
        for tbl in tables_to_clear:
            try:
                conn.execute(text(f"DELETE FROM {tbl};"))
            except Exception as e:
                pass

        df_corridors.to_sql('corridors', conn, if_exists='append', index=False)
        df_sections.to_sql('sections', conn, if_exists='append', index=False)
        df_asset_master.to_sql('assets', conn, if_exists='append', index=False)
        df_failures.to_sql('failure_event_history', conn, if_exists='append', index=False)
        df_defects.to_sql('defect_history', conn, if_exists='append', index=False)
        df_tasks.to_sql('maintenance_tasks', conn, if_exists='append', index=False)
        df_task_actions.to_sql('task_actions', conn, if_exists='append', index=False)
        df_trains.to_sql('train_movements', conn, if_exists='append', index=False)
        df_block_windows.to_sql('block_windows', conn, if_exists='append', index=False)
        df_goods_forecast.to_sql('goods_forecast', conn, if_exists='append', index=False)
        df_resources.to_sql('resources', conn, if_exists='append', index=False)
        df_inspections.to_sql('inspections', conn, if_exists='append', index=False)
        df_maint_hist.to_sql('maintenance_history', conn, if_exists='append', index=False)

        # Audit log initial seed event
        audit_entry = {
            'log_id': f"AUDIT_{int(datetime.now().timestamp())}",
            'event_type': 'SYSTEM_SEED',
            'entity_id': 'SYSTEM_INIT',
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'user_id': 'SYSTEM_ADMIN',
            'details_json': json.dumps({'message': 'Master Plan v2 seed completed successfully', 'task_count': len(df_tasks)}),
            'status': 'SUCCESS'
        }
        pd.DataFrame([audit_entry]).to_sql('audit_log', conn, if_exists='append', index=False)

    # 12. BDMS-style department feed drops
    feeds_dir = os.path.join(BASE_DIR, 'data_feeds')
    os.makedirs(feeds_dir, exist_ok=True)
    severity_map = {'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4}
    for sys_name, fname in [('TMS', 'tms_engineering.csv'), ('TDMS', 'tdms_traction.csv'), ('SMMS', 'smms_sndt.csv')]:
        chunk = df_tasks[df_tasks['source_system'] == sys_name].head(10)
        feed_df = pd.DataFrame({
            'asset_id': chunk['asset_id'],
            'raw_type': chunk['task_type'],
            'severity': chunk['criticality'].map(severity_map).fillna(2),
            'reported_date': chunk['due_date']
        })
        feed_df.to_csv(os.path.join(feeds_dir, fname), index=False)

    print("=" * 70)
    print("✓ Master Plan v2 Data Architecture Seed Successfully Executed!")
    print("=" * 70)

if __name__ == '__main__':
    transform_and_seed()
