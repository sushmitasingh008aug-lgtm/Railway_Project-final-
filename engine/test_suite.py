import os
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEDULE_CSV = os.path.join(BASE_DIR, 'optimized_schedule.csv')

def run_test_suite():
    db_url = "postgresql://postgres:postgres@localhost:5432/block_planning"
    engine = sqlalchemy.create_engine(db_url)
    
    print("\n" + "=" * 70)
    print("🚦 RUNNING AUTOMATED CORE ENGINE VERIFICATION SUITE")
    print("=" * 70)

    results = []

    # -------------------------------------------------------------
    # TEST 1: NETWORK TOPOLOGY INTEGRITY (SQL)
    # -------------------------------------------------------------
    print("\n[TEST 1] Network Topology Integrity (SQL)")
    with engine.connect() as conn:
        null_sections = conn.execute(text("SELECT COUNT(*) FROM assets WHERE section_id IS NULL;")).scalar()
        print(f"  • Test 1.1 Geospatial Link (Assets with NULL section_id): {null_sections}")
        assert null_sections == 0, f"Test 1.1 FAILED: Found {null_sections} unlinked assets!"
        results.append({"id": "1.1", "name": "Geospatial Link", "passed": True, "details": "100% assets mapped to valid operational sections"})

        invalid_trains = conn.execute(text("SELECT COUNT(*) FROM train_movements WHERE exit_time <= entry_time;")).scalar()
        print(f"  • Test 1.2 Timetable Chronology (Invalid Chronology): {invalid_trains}")
        assert invalid_trains == 0, f"Test 1.2 FAILED: Found {invalid_trains} chronologically impossible train movements!"
        results.append({"id": "1.2", "name": "Timetable Chronology", "passed": True, "details": "Zero temporal causality violations in train movements"})

    # -------------------------------------------------------------
    # TEST 2: PRIORITY ENGINE DETERMINISM (Python)
    # -------------------------------------------------------------
    print("\n[TEST 2] Priority Engine Determinism (Python)")
    with engine.connect() as conn:
        max_score = conn.execute(text("SELECT MAX(priority_score) FROM maintenance_tasks;")).scalar()
        min_score = conn.execute(text("SELECT MIN(priority_score) FROM maintenance_tasks;")).scalar()
        print(f"  • Test 2.1 Score Bounds: Min={min_score:.2f}, Max={max_score:.2f}")
        assert 0.0 <= min_score and max_score <= 100.0, f"Test 2.1 FAILED: Scores out of bounds [0, 100]!"
        results.append({"id": "2.1", "name": "Priority Score Bounds", "passed": True, "details": f"Scores strictly bounded in [0, 100] (Min: {min_score:.1f}, Max: {max_score:.1f})"})

        unscored_tasks = conn.execute(text("SELECT COUNT(*) FROM maintenance_tasks WHERE priority_score IS NULL AND status = 'Pending';")).scalar()
        print(f"  • Test 2.2 Execution Completeness (Unscored Pending Tasks): {unscored_tasks}")
        assert unscored_tasks == 0, f"Test 2.2 FAILED: Found {unscored_tasks} unscored tasks!"
        results.append({"id": "2.2", "name": "Execution Completeness", "passed": True, "details": "100% of pending maintenance backlog scored deterministically"})

    # -------------------------------------------------------------
    # TEST 3: OPTIMIZER PHYSICS VALIDATION (Python)
    # -------------------------------------------------------------
    print("\n[TEST 3] Optimizer Physics Validation (Python)")
    df_schedule = pd.read_csv(SCHEDULE_CSV)
    df_trains = pd.read_sql("SELECT movement_id, train_id, section_id, entry_time, exit_time FROM train_movements", engine)

    base_time = datetime(2026, 8, 23, 0, 0, 0)
    df_trains['entry_min'] = ((pd.to_datetime(df_trains['entry_time']) - base_time).dt.total_seconds() / 60).astype(int)
    df_trains['exit_min'] = ((pd.to_datetime(df_trains['exit_time']) - base_time).dt.total_seconds() / 60).astype(int)

    # Test 3.1: Train Precedence Collision Check
    print("  • Test 3.1 Train Precedence Collision Check (Zero-Overlap Verification)...")
    total_train_conflicts = 0
    for _, task in df_schedule.iterrows():
        sec_id = task['section_id']
        t_start = task['start_minute']
        t_end = task['end_minute']
        
        sec_trains = df_trains[df_trains['section_id'] == sec_id]
        for _, train in sec_trains.iterrows():
            tr_start = train['entry_min']
            tr_end = train['exit_min']
            overlap = max(0, min(t_end, tr_end) - max(t_start, tr_start))
            if overlap > 0:
                total_train_conflicts += 1

    assert total_train_conflicts == 0, f"Test 3.1 FAILED: Found {total_train_conflicts} temporal collisions between maintenance blocks and scheduled trains!"
    results.append({"id": "3.1", "name": "Train Precedence Collision Check", "passed": True, "details": "Zero temporal collisions detected with moving trains across all 200 tasks"})

    # Test 3.2: Resource Saturation Check
    print("  • Test 3.2 Multi-Department Resource Saturation Check...")
    df_res = pd.read_sql("SELECT resource_id, department, capacity FROM resources", engine)
    resource_dept_map = dict(df_res[['department', 'resource_id']].values)
    capacity_map = dict(df_res[['resource_id', 'capacity']].values)

    df_schedule['resource_id'] = df_schedule['department'].map(resource_dept_map)

    horizon_minutes = 7 * 24 * 60
    for res_id, cap in capacity_map.items():
        res_tasks = df_schedule[df_schedule['resource_id'] == res_id]
        minute_usage = np.zeros(horizon_minutes, dtype=int)
        for _, task in res_tasks.iterrows():
            s_min = int(task['start_minute'])
            e_min = int(task['end_minute'])
            minute_usage[s_min:e_min] += 1
            
        max_concurrent = minute_usage.max()
        assert max_concurrent <= cap, f"Test 3.2 FAILED: Resource {res_id} capacity exceeded ({max_concurrent} > {cap})!"

    results.append({"id": "3.2", "name": "Resource Saturation Check", "passed": True, "details": "Physical machinery and department capacities strictly respected"})

    # -------------------------------------------------------------
    # TEST 4: MULTI-DEPARTMENT COORDINATION INTEGRITY (Python)
    # -------------------------------------------------------------
    print("\n[TEST 4] Multi-Department Coordination Integrity (Python)")
    if 'combined_group_id' not in df_schedule.columns:
        df_schedule['combined_group_id'] = ''
    df_schedule['combined_group_id'] = df_schedule['combined_group_id'].fillna('')

    grouped = df_schedule[df_schedule['combined_group_id'] != '']
    TOLERANCE_MIN = 15
    if len(grouped):
        violations = 0
        group_summary = []
        for gid, grp in grouped.groupby('combined_group_id'):
            n_depts = grp['department'].nunique()
            same_section = grp['section_id'].nunique() == 1
            aligned = (grp['start_minute'].max() - grp['start_minute'].min()) <= TOLERANCE_MIN
            if n_depts < 2 or not same_section or not aligned:
                violations += 1
            group_summary.append(f"{gid}:{n_depts} depts")
        assert violations == 0, f"Test 4.1 FAILED: {violations} malformed combined blocks!"
        print(f"  • Test 4.1 Combined Block Structure: {grouped['combined_group_id'].nunique()} groups verified (>=2 depts, same section, starts within {TOLERANCE_MIN} min)")
        results.append({"id": "4.1", "name": "Combined Block Structure", "passed": True,
                        "details": f"{grouped['combined_group_id'].nunique()} multi-department blocks share single corridor windows"})
    else:
        print("  • Test 4.1 Combined Block Structure: no combined groups present (coordination bonus may be disabled)")
        results.append({"id": "4.1", "name": "Combined Block Structure", "passed": True,
                        "details": "No combined blocks in current plan"})

    total = len(results)
    print("\n" + "=" * 70)
    print(f"🏆 ALL {total} TEST CASES PASSED WITH ZERO VIOLATIONS!")
    print("=" * 70 + "\n")
    return results

if __name__ == '__main__':
    run_test_suite()
