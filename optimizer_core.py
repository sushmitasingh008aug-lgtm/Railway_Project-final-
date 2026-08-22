import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime, timedelta
from ortools.sat.python import cp_model

def time_aware_optimizer(db_url="postgresql://postgres:postgres@localhost:5432/block_planning", horizon_days=7, max_solver_time=30.0):
    engine = sqlalchemy.create_engine(db_url)
    
    print("=" * 60)
    print("🚀 EXECUTING PHASE 3: TIME-AWARE CP-SAT OPTIMIZER")
    print("=" * 60)

    base_time = datetime(2026, 8, 23, 0, 0, 0)
    max_horizon_minutes = horizon_days * 24 * 60 # 10080 minutes for 7 days

    # 1. Pull Prioritized Tasks
    task_query = """
    SELECT mt.task_id, mt.task_type, mt.criticality, mt.duration_minutes, mt.priority_score,
           a.asset_id, a.department, a.section_id, s.name as section_name
    FROM maintenance_tasks mt
    JOIN assets a ON mt.asset_id = a.asset_id
    JOIN sections s ON a.section_id = s.section_id
    WHERE mt.status = 'Pending'
    ORDER BY mt.priority_score DESC
    """
    df_tasks = pd.read_sql(task_query, engine)
    print(f"  Ingested {len(df_tasks)} prioritized tasks for optimization.")

    # 2. Pull Train Movements
    train_query = """
    SELECT movement_id, train_id, section_id, train_type, entry_time, exit_time
    FROM train_movements
    WHERE entry_time >= '2026-08-23 00:00:00' AND exit_time <= '2026-08-30 00:00:00'
    ORDER BY entry_time ASC
    """
    df_trains = pd.read_sql(train_query, engine)
    print(f"  Ingested {len(df_trains)} train movements across {df_trains['section_id'].nunique()} sections.")

    # Convert Train Timestamps to Integer Minutes from base_time
    df_trains['entry_min'] = ((pd.to_datetime(df_trains['entry_time']) - base_time).dt.total_seconds() / 60).astype(int)
    df_trains['exit_min'] = ((pd.to_datetime(df_trains['exit_time']) - base_time).dt.total_seconds() / 60).astype(int)
    df_trains['duration_min'] = df_trains['exit_min'] - df_trains['entry_min']

    # 3. Pull Resources
    res_query = "SELECT resource_id, resource_type, department, capacity FROM resources"
    df_resources = pd.read_sql(res_query, engine)
    resource_map = {row['department']: (row['resource_id'], row['capacity']) for _, row in df_resources.iterrows()}
    print(f"  Ingested resource capacities: {dict(df_resources[['resource_type', 'capacity']].values)}")

    # 4. Initialize CP-SAT Model
    model = cp_model.CpModel()

    task_presences = {}
    task_starts = {}
    task_ends = {}
    task_intervals = {}
    tasks_by_section = {}
    tasks_by_resource = {}

    for _, t in df_tasks.iterrows():
        tid = t['task_id']
        duration = int(t['duration_minutes'])
        sec_id = t['section_id']
        dept = t['department']

        # Decision Variables
        presence = model.NewBoolVar(f"presence_{tid}")
        start = model.NewIntVar(0, max_horizon_minutes, f"start_{tid}")
        end = model.NewIntVar(0, max_horizon_minutes, f"end_{tid}")
        interval = model.NewOptionalIntervalVar(start, duration, end, presence, f"interval_{tid}")

        task_presences[tid] = presence
        task_starts[tid] = start
        task_ends[tid] = end
        task_intervals[tid] = interval

        # Group by Section for NoOverlap with trains
        tasks_by_section.setdefault(sec_id, []).append((tid, interval))

        # Group by Resource Capacity
        res_id, _ = resource_map.get(dept, ("GENERIC", 10))
        tasks_by_resource.setdefault(res_id, []).append(interval)

    # 5. HARD CONSTRAINT: THE TRAIN WALL (AddNoOverlap per section)
    print("\n  Enforcing Constraint 1: The Train Wall (AddNoOverlap with Trains)...")
    for sec_id, task_list in tasks_by_section.items():
        section_intervals = [interval for _, interval in task_list]
        
        # Add all fixed train intervals on this section
        sec_trains = df_trains[df_trains['section_id'] == sec_id]
        for _, train in sec_trains.iterrows():
            entry_m = int(train['entry_min'])
            dur_m = int(train['duration_min'])
            exit_m = int(train['exit_min'])
            # Create a fixed, unmovable interval for the train movement
            train_interval = model.NewIntervalVar(entry_m, dur_m, exit_m, f"train_{train['train_id']}_{sec_id}")
            section_intervals.append(train_interval)

        # Nothing on this section can overlap in time!
        model.AddNoOverlap(section_intervals)

    # 6. HARD CONSTRAINT: RESOURCE CAPACITY (AddCumulative)
    print("  Enforcing Constraint 2: Physical Machinery Capacity (AddCumulative)...")
    for _, res in df_resources.iterrows():
        res_id = res['resource_id']
        capacity = int(res['capacity'])
        intervals = tasks_by_resource.get(res_id, [])
        if intervals:
            demands = [1] * len(intervals)
            model.AddCumulative(intervals, demands, capacity)

    # 7. MULTI-OBJECTIVE MAXIMIZATION
    # Maximize sum(presence * priority_score)
    print("  Formulating Objective: Maximize (Priority Score * Scheduled Tasks)...")
    objective_terms = []
    for _, t in df_tasks.iterrows():
        tid = t['task_id']
        score = int(t['priority_score'] * 10) # Integer scaling for CP-SAT
        objective_terms.append(task_presences[tid] * score)

    model.Maximize(sum(objective_terms))

    # 8. SOLVE THE MODEL
    print(f"\n  Running Google OR-Tools CP-SAT Solver (Time limit: {max_solver_time}s)...")
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_solver_time
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        status_name = "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"
        print(f"  ✓ Solution Found: {status_name}!")
        print(f"  Solver Objective Value: {solver.ObjectiveValue() / 10:.2f}")
        print(f"  Wall Time: {solver.WallTime():.2f}s")
        
        # 9. EXTRACT FINAL TIME SCHEDULE
        scheduled_tasks = []
        for _, t in df_tasks.iterrows():
            tid = t['task_id']
            if solver.Value(task_presences[tid]) == 1:
                start_m = solver.Value(task_starts[tid])
                end_m = solver.Value(task_ends[tid])
                start_dt = base_time + timedelta(minutes=start_m)
                end_dt = base_time + timedelta(minutes=end_m)
                
                scheduled_tasks.append({
                    'task_id': tid,
                    'asset_id': t['asset_id'],
                    'department': t['department'],
                    'task_type': t['task_type'],
                    'criticality': t['criticality'],
                    'priority_score': t['priority_score'],
                    'section_id': t['section_id'],
                    'section_name': t['section_name'],
                    'duration_minutes': t['duration_minutes'],
                    'start_minute': start_m,
                    'end_minute': end_m,
                    'assigned_start_time': start_dt.strftime('%Y-%m-%d %H:%M'),
                    'assigned_end_time': end_dt.strftime('%Y-%m-%d %H:%M')
                })

        df_schedule = pd.DataFrame(scheduled_tasks)
        print(f"\nSuccessfully Scheduled {len(df_schedule)} / {len(df_tasks)} Pending Tasks into Available Train Gaps!")
        
        # Save output schedule to CSV
        df_schedule.to_csv('optimized_schedule.csv', index=False)
        print("  ✓ Saved schedule to 'optimized_schedule.csv'")
        
        return df_schedule, df_trains, resource_map
    else:
        raise RuntimeError("No feasible schedule found by the CP-SAT solver!")

if __name__ == '__main__':
    time_aware_optimizer()
