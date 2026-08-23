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

    section_ids_main_1 = [s['section_id'] for s in sections if s['corridor_id'] == 'CORR_BSB_LKO']
    section_ids_main_2 = [s['section_id'] for s in sections if s['corridor_id'] == 'CORR_HWH_DLI']
    section_ids_yard = [s['section_id'] for s in sections if s['corridor_id'] == 'CORR_DDU_YARD']

    assigned_sections = []
    for idx, row in df_assets.iterrows():
        name = str(row.get('name', ''))
        importance = str(row.get('importance', ''))
        if 'Varanasi' in name or 'Sultanpur' in name:
            assigned_sections.append(section_ids_main_1[idx % len(section_ids_main_1)])
        elif 'Howrah' in name or 'Delhi' in name:
            assigned_sections.append(section_ids_main_2[idx % len(section_ids_main_2)])
        elif importance in ['yard', 'siding', 'spur']:
            assigned_sections.append(section_ids_yard[idx % len(section_ids_yard)])
        else:
            all_sections = [s['section_id'] for s in sections]
            assigned_sections.append(all_sections[idx % len(all_sections)])

    df_assets['section_id'] = assigned_sections

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
                'exit_time': exit_time
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
    with engine.begin() as conn:
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
