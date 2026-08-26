import os
import sys
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime, timedelta
import random
from db_helper import get_db_engine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def transform_and_seed():
    engine = get_db_engine()

    print("Step 1: Ingesting mapped_assets.csv...")
    csv_path = os.path.join(BASE_DIR, 'mapped_assets.csv')
    df_assets = pd.read_csv(csv_path)

    def parse_lat(loc):
        try:
            return float(str(loc).split(',')[0])
        except:
            return 25.34243
            
    def parse_lon(loc):
        try:
            return float(str(loc).split(',')[1])
        except:
            return 82.95641

    df_assets['location_lat'] = df_assets['location'].apply(parse_lat)
    df_assets['location_lon'] = df_assets['location'].apply(parse_lon)

    print("Step 2: Grouping assets into operational Sections & Corridors...")
    corridors = [
        {"corridor_id": "CORR_BSB_LKO", "name": "Varanasi - Sultanpur - Lucknow Mainline"},
        {"corridor_id": "CORR_HWH_DLI", "name": "Howrah - New Delhi Trunk Line"},
        {"corridor_id": "CORR_DDU_YARD", "name": "Deen Dayal Upadhyaya Junction & Yards"}
    ]
    
    sections = []
    for i in range(1, 5):
        sections.append({
            "section_id": f"SEC_BSB_LKO_{i:02d}",
            "name": f"Varanasi-Lucknow Block {i}",
            "corridor_id": "CORR_BSB_LKO",
            "length_km": round(random.uniform(15.0, 35.0), 2)
        })
    for i in range(1, 5):
        sections.append({
            "section_id": f"SEC_HWH_DLI_{i:02d}",
            "name": f"Howrah-Delhi Fast Corridor {i}",
            "corridor_id": "CORR_HWH_DLI",
            "length_km": round(random.uniform(20.0, 45.0), 2)
        })
    for i in range(1, 5):
        sections.append({
            "section_id": f"SEC_DDU_YARD_{i:02d}",
            "name": f"DDU Marshalling & Yard Sec {i}",
            "corridor_id": "CORR_DDU_YARD",
            "length_km": round(random.uniform(5.0, 12.0), 2)
        })

    df_sections = pd.DataFrame(sections)

    # Merge geographic boundaries derived from OSM geometry (derive_section_boundaries.py)
    geo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'section_geography.json')
    if os.path.exists(geo_path):
        import json as _json
        geo = _json.load(open(geo_path))
        for corr_id, prefix in [('CORR_BSB_LKO', 'SEC_BSB_LKO'), ('CORR_HWH_DLI', 'SEC_HWH_DLI')]:
            for blk in geo.get(corr_id, []):
                sid = f"{prefix}_{blk['block_index']:02d}"
                mask = df_sections['section_id'] == sid
                # geometry as JSON string
                geom_str = _json.dumps(blk.get('geometry', [[blk['start_lat'], blk['start_lon']],[blk['end_lat'], blk['end_lon']]]))
                df_sections.loc[mask, ['start_station', 'end_station', 'start_lat', 'start_lon',
                                       'end_lat', 'end_lon', 'length_km', 'geometry']] = [
                    blk['start_station'], blk['end_station'], blk['start_lat'], blk['start_lon'],
                    blk['end_lat'], blk['end_lon'], blk['length_km'], geom_str]
        for y in geo.get('CORR_DDU_YARD', []):
            mask = df_sections['section_id'] == y['section_id_hint']
            if mask.any():
                geom_str = _json.dumps(y.get('geometry', [[y['start_lat'], y['start_lon']]]))
                df_sections.loc[mask, ['start_station', 'end_station', 'start_lat', 'start_lon',
                                       'end_lat', 'end_lon', 'geometry']] = [
                    y['start_station'], y['end_station'], y['start_lat'], y['start_lon'],
                    y['end_lat'], y['end_lon'], geom_str]
        print("  ✓ Merged section geography from section_geography.json")

    # Govt-grade spatial assignment: nearest section by haversine to true asset GPS
    import math as _math
    import json as _json2

    def _haversine(lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(_math.radians, [lon1, lat1, lon2, lat2])
        a = _math.sin((lat2 - lat1) / 2) ** 2 + _math.cos(lat1) * _math.cos(lat2) * _math.sin((lon2 - lon1) / 2) ** 2
        return 6371 * 2 * _math.asin(_math.sqrt(a))

    # Build section centers from true geometry (or fallback to start/end midpoint)
    section_centers = []
    for _, s in df_sections.iterrows():
        try:
            g = s.get('geometry')
            if g and not (isinstance(g, float) and _math.isnan(g)):
                geom = _json2.loads(g) if isinstance(g, str) else g
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
            clat = (float(s['start_lat']) + float(s['end_lat'])) / 2 if pd.notna(s['start_lat']) else 25.0
            clon = (float(s['start_lon']) + float(s['end_lon'])) / 2 if pd.notna(s['start_lon']) else 82.9
        section_centers.append((s['section_id'], clat, clon))

    assigned_sections = []
    for _, row in df_assets.iterrows():
        alat = float(row['location_lat'])
        alon = float(row['location_lon'])
        best_sid = section_centers[0][0]
        best_d = float('inf')
        for sid, clat, clon in section_centers:
            d = _haversine(alon, alat, clon, clat)
            if d < best_d:
                best_d = d
                best_sid = sid
        assigned_sections.append(best_sid)

    df_assets['section_id'] = assigned_sections
    print(f"  ✓ Spatially assigned {len(df_assets)} assets to nearest sections (govt-grade haversine)")

    print("Step 3: Generating 200 Synthetic Maintenance Tasks...")
    sampled_assets = df_assets.sample(n=200, random_state=42).reset_index(drop=True)
    
    defect_types = {
        'Engineering': ['Broken Rail Weld', 'Track Gauge Spread', 'Ballast Deep Screening', 'Point Machine Mechanical Fault'],
        'Traction': ['OHE Dropper Broken', 'Cantilever Insulator Flashover', 'Contact Wire Sag', 'Neutral Section Inspection'],
        'S&T': ['Track Circuit Short', 'Axle Counter Error', 'Signal Aspect Lamp Fail', 'Point Machine Detection Fault']
    }

    base_date = datetime(2026, 8, 23)
    # Department -> source system (mirrors real IR stack: TMS/TDMS/SMMS feeds)
    source_systems = {
        'Engineering': 'TMS',
        'Traction': 'TDMS',
        'S&T': 'SMMS',
    }
    tasks = []
    crit_choices = ['Critical', 'High', 'Medium', 'Low']
    crit_probs = [0.15, 0.30, 0.35, 0.20]

    for i, row in sampled_assets.iterrows():
        dept = row['department']
        task_type = random.choice(defect_types.get(dept, ['Routine Track Maintenance']))
        criticality = np.random.choice(crit_choices, p=crit_probs)

        if criticality == 'Critical':
            due_offset = random.randint(-1, 2)
        elif criticality == 'High':
            due_offset = random.randint(1, 4)
        elif criticality == 'Medium':
            due_offset = random.randint(3, 7)
        else:
            due_offset = random.randint(5, 10)

        due_date = (base_date + timedelta(days=due_offset)).strftime('%Y-%m-%d')
        duration = random.choice([60, 90, 120, 180])

        tasks.append({
            'task_id': f"TSK_{1000 + i}",
            'asset_id': row['asset_id'],
            'task_type': task_type,
            'criticality': criticality,
            'due_date': due_date,
            'duration_minutes': duration,
            'priority_score': None,
            'status': 'Pending',
            'source_system': source_systems.get(dept, 'SYNTHETIC'),
            # S&T signaling works affect BOTH running lines; physical track/OHE
            # works are taken on one line at a time (double-line working).
            'affects_line': 'BOTH' if dept == 'S&T' else ('UP' if i % 2 == 0 else 'DOWN'),
        })
    df_tasks = pd.DataFrame(tasks)

    print("Step 4: Generating Realistic Sequential Train Movements (Enforcing Headway)...")
    train_movements = []
    train_types = ['Passenger', 'Freight']
    train_counter = 100
    
    # For each section, generate a conflict-free sequential train timetable across 7 days
    for s in sections:
        sec_id = s['section_id']
        current_time = base_date + timedelta(hours=random.randint(1, 3)) # Start around 01:00-03:00
        end_horizon = base_date + timedelta(days=7)
        
        while current_time < end_horizon:
            # Transit time for train on this section (25 - 45 mins)
            transit_duration = random.randint(25, 45)
            entry_time = current_time
            exit_time = entry_time + timedelta(minutes=transit_duration)
            
            if exit_time > end_horizon:
                break
                
            train_counter += 1
            train_movements.append({
                'train_id': f"TRN_{train_counter}",
                'section_id': sec_id,
                'train_type': random.choice(train_types),
                'entry_time': entry_time,
                'exit_time': exit_time,
                # IR convention: even train numbers = UP (toward LKO/Delhi), odd = DOWN
                'direction': 'UP' if train_counter % 2 == 0 else 'DOWN',
            })
            
            # Headway / Gap between trains:
            # Daytime: 60 - 180 min gap
            # Night window (00:00 - 05:00): 240 - 360 min gap (Corridor Block opportunity)
            hour = exit_time.hour
            if 0 <= hour <= 4:
                gap_minutes = random.randint(200, 320)
            else:
                gap_minutes = random.randint(60, 180)
                
            current_time = exit_time + timedelta(minutes=gap_minutes)

    df_trains = pd.DataFrame(train_movements)

    print("Step 5: Defining Physical Resources...")
    resources = [
        {"resource_id": "RES_TAMPER_01", "resource_type": "Heavy Track Tamping Machine", "department": "Engineering", "capacity": 2},
        {"resource_id": "RES_OHE_TOWER_01", "resource_type": "OHE Tower Inspection Wagon", "department": "Traction", "capacity": 2},
        {"resource_id": "RES_SIG_RIG_01", "resource_type": "Signal Diagnostic & Interlock Rig", "department": "S&T", "capacity": 3}
    ]
    df_resources = pd.DataFrame(resources)

    print("Step 6: Writing to Database...")
    # Postgres-only: no data loss on reseed — only TRUNCATE when DB is empty or FORCE_SEED=1
    force = os.getenv("FORCE_SEED", "0") == "1"
    with engine.begin() as conn:
        try:
            cnt = conn.execute(text("SELECT COUNT(*) FROM sections")).scalar() or 0
        except Exception:
            cnt = 0
        if cnt and cnt > 0 and not force:
            print(f"  DB already has {cnt} sections — skipping TRUNCATE (set FORCE_SEED=1 to overwrite).")
            print("  → Transform will append/skip; use entrypoint's idempotent check for fresh deploys.")
            # Do not truncate; delete only synthetic staging to avoid duplicating sections? Instead abort seeding
            # For safety, clear only if force
            raise SystemExit(f"Aborted seeding: DB already seeded ({cnt} sections). Set FORCE_SEED=1 to force reset.")
        if engine.name == 'sqlite':
            for tbl in ['department_feeds', 'train_movements', 'maintenance_tasks', 'assets', 'sections', 'resources']:
                conn.execute(text(f"DELETE FROM {tbl};"))
        else:
            conn.execute(text("TRUNCATE TABLE train_movements, maintenance_tasks, assets, sections, resources, department_feeds CASCADE;"))

        df_sections.to_sql('sections', conn, if_exists='append', index=False)
        print(f"  ✓ Inserted {len(df_sections)} sections.")
        
        db_assets = df_assets[['asset_id', 'section_id', 'department', 'asset_type', 'location_lat', 'location_lon']].drop_duplicates(subset=['asset_id'])
        db_assets.to_sql('assets', conn, if_exists='append', index=False)
        print(f"  ✓ Inserted {len(db_assets)} assets.")
        
        df_tasks.to_sql('maintenance_tasks', conn, if_exists='append', index=False)
        print(f"  ✓ Inserted {len(df_tasks)} maintenance tasks.")
        
        df_trains.to_sql('train_movements', conn, if_exists='append', index=False)
        print(f"  ✓ Inserted {len(df_trains)} conflict-free sequential train movements.")
        
        df_resources.to_sql('resources', conn, if_exists='append', index=False)
        print(f"  ✓ Inserted {len(df_resources)} physical resources.")

    print("Step 7: Emitting Sample Departmental Feed Drops (BDMS-style)...")
    feeds_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data_feeds')
    os.makedirs(feeds_dir, exist_ok=True)
    feed_samples = {
        'tms_engineering.csv': df_tasks[df_tasks['source_system'] == 'TMS'].head(5),
        'tdms_traction.csv': df_tasks[df_tasks['source_system'] == 'TDMS'].head(5),
        'smms_sndt.csv': df_tasks[df_tasks['source_system'] == 'SMMS'].head(5),
    }
    severity_map = {'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4}
    for fname, chunk in feed_samples.items():
        feed = pd.DataFrame({
            'asset_id': chunk['asset_id'],
            'raw_type': chunk['task_type'],
            'severity': chunk['criticality'].map(severity_map),
            'reported_date': chunk['due_date'],
        })
        feed.to_csv(os.path.join(feeds_dir, fname), index=False)
    print(f"  ✓ Wrote {len(feed_samples)} sample feed files to data_feeds/ (ingest with ingest_feeds.py).")

    print("\nPhase 1 Database Seed Completed Successfully!")

if __name__ == '__main__':
    transform_and_seed()
