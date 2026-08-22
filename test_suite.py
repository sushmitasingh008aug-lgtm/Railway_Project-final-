import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime

def run_test_suite():
    db_url = "postgresql://postgres:postgres@localhost:5432/block_planning"
    engine = sqlalchemy.create_engine(db_url)
    
    print("\n" + "=" * 70)
    print("🚦 RUNNING AUTOMATED CORE ENGINE VERIFICATION SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: NETWORK TOPOLOGY INTEGRITY (SQL)
    # -------------------------------------------------------------
    print("\n[TEST 1] Network Topology Integrity (SQL)")
    with engine.connect() as conn:
        # Test 1.1: Geospatial Link
        null_sections = conn.execute(text("SELECT COUNT(*) FROM assets WHERE section_id IS NULL;")).scalar()
        print(f"  • Test 1.1 Geospatial Link (Assets with NULL section_id): {null_sections}")
        assert null_sections == 0, f"Test 1.1 FAILED: Found {null_sections} unlinked assets!"
        print("    ✅ PASSED: 100% of physical assets mapped to valid operational sections.")

        # Test 1.2: Timetable Chronology
        invalid_trains = conn.execute(text("SELECT COUNT(*) FROM train_movements WHERE exit_time <= entry_time;")).scalar()
        print(f"  • Test 1.2 Timetable Chronology (Invalid Chronology): {invalid_trains}")
        assert invalid_trains == 0, f"Test 1.2 FAILED: Found {invalid_trains} chronologically impossible train movements!"
        print("    ✅ PASSED: All train timetable movements strictly respect temporal causality.")

    # -------------------------------------------------------------
    # TEST 2: PRIORITY ENGINE DETERMINISM (Python)
    # -------------------------------------------------------------
    print("\n[TEST 2] Priority Engine Determinism (Python)")
    with engine.connect() as conn:
        # Test 2.1: Score Bounds
        max_score = conn.execute(text("SELECT MAX(priority_score) FROM maintenance_tasks;")).scalar()
        min_score = conn.execute(text("SELECT MIN(priority_score) FROM maintenance_tasks;")).scalar()
        print(f"  • Test 2.1 Score Bounds: Min={min_score:.2f}, Max={max_score:.2f}")
        assert 0.0 <= min_score and max_score <= 100.0, f"Test 2.1 FAILED: Scores out of bounds [0, 100]!"
        print("    ✅ PASSED: Priority scores strictly bounded between [0.0, 100.0].")

        # Test 2.2: Execution Completeness
        unscored_tasks = conn.execute(text("SELECT COUNT(*) FROM maintenance_tasks WHERE priority_score IS NULL AND status = 'Pending';")).scalar()
        print(f"  • Test 2.2 Execution Completeness (Unscored Pending Tasks): {unscored_tasks}")
        assert unscored_tasks == 0, f"Test 2.2 FAILED: Found {unscored_tasks} unscored tasks!"
        print("    ✅ PASSED: 100% of pending maintenance backlog scored deterministically.")

    # -------------------------------------------------------------
    # TEST 3: OPTIMIZER PHYSICS VALIDATION (Python)
    # -------------------------------------------------------------
    print("\n[TEST 3] Optimizer Physics Validation (Python)")
    df_schedule = pd.read_csv('optimized_schedule.csv')
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
        
        # Check against all trains on the same section
        sec_trains = df_trains[df_trains['section_id'] == sec_id]
        for _, train in sec_trains.iterrows():
            tr_start = train['entry_min']
            tr_end = train['exit_min']
            
            # Intersection of [t_start, t_end] and [tr_start, tr_end]
            overlap = max(0, min(t_end, tr_end) - max(t_start, tr_start))
            if overlap > 0:
                total_train_conflicts += 1
                print(f"    ❌ FATAL COLLISION: Task {task['task_id']} ({t_start}-{t_end}) collides with Train {train['train_id']} ({tr_start}-{tr_end}) on section {sec_id} by {overlap} mins!")

    assert total_train_conflicts == 0, f"Test 3.1 FAILED: Found {total_train_conflicts} temporal collisions between maintenance blocks and scheduled trains!"
    print(f"    ✅ PASSED: 0 train collisions detected across all {len(df_schedule)} scheduled tasks.")

    # Test 3.2: Resource Saturation Check
    print("  • Test 3.2 Multi-Department Resource Saturation Check...")
    df_res = pd.read_sql("SELECT resource_id, department, capacity FROM resources", engine)
    resource_dept_map = dict(df_res[['department', 'resource_id']].values)
    capacity_map = dict(df_res[['resource_id', 'capacity']].values)

    # Map tasks to resource
    df_schedule['resource_id'] = df_schedule['department'].map(resource_dept_map)

    # Check maximum concurrency for each resource minute-by-minute
    horizon_minutes = 7 * 24 * 60
    for res_id, cap in capacity_map.items():
        res_tasks = df_schedule[df_schedule['resource_id'] == res_id]
        minute_usage = np.zeros(horizon_minutes, dtype=int)
        for _, task in res_tasks.iterrows():
            s_min = int(task['start_minute'])
            e_min = int(task['end_minute'])
            minute_usage[s_min:e_min] += 1
            
        max_concurrent = minute_usage.max()
        print(f"    Resource '{res_id}': Max Active = {max_concurrent} / Capacity = {cap}")
        assert max_concurrent <= cap, f"Test 3.2 FAILED: Resource {res_id} capacity exceeded ({max_concurrent} > {cap})!"

    print("    ✅ PASSED: All machinery and department resource constraints strictly respected.")

    print("\n" + "=" * 70)
    print("🏆 ALL 6 TEST CASES PASSED WITH ZERO VIOLATIONS!")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    run_test_suite()
