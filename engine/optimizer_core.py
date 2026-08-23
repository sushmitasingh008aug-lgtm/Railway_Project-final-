import os
import sys
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime, timedelta
from ortools.sat.python import cp_model
from db_helper import get_db_engine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCHEDULE_CSV = os.path.join(BASE_DIR, 'optimized_schedule.csv')

# Bonus paid per coordinated cross-department pair scheduled within the same
# corridor window. One disruption serving multiple departments is the core
# efficiency lever (PS point 3a).
COMBINED_BONUS = 150
# Blocks are granted in coarse increments; partners may enter within this many
# minutes of each other while still counting as one combined corridor window.
COMBINED_TOLERANCE_MIN = 15
# Coordination candidates per (section, department): top-N priority tasks only,
# keeping the pairwise boolean layer small enough for fast propagation.
COMBINED_TOP_N = 4

def time_aware_optimizer(db_url=None, horizon_days=7, max_solver_time=30.0):
    engine = get_db_engine() if db_url is None else sqlalchemy.create_engine(db_url)

    print("=" * 60)
    print(f"🚀 EXECUTING PHASE 3: TIME-AWARE CP-SAT OPTIMIZER ({horizon_days}-DAY HORIZON)")
    print("=" * 60)

    base_time = datetime(2026, 8, 23, 0, 0, 0)
    horizon_end = base_time + timedelta(days=int(horizon_days))
    max_horizon_minutes = int(horizon_days) * 24 * 60

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

    # 2. Pull Train Movements (window derived from horizon, not hardcoded)
    train_query = f"""
    SELECT movement_id, train_id, section_id, train_type, entry_time, exit_time
    FROM train_movements
    WHERE entry_time >= '{base_time.strftime('%Y-%m-%d %H:%M:%S')}'
      AND exit_time <= '{horizon_end.strftime('%Y-%m-%d %H:%M:%S')}'
    ORDER BY entry_time ASC
    """
    df_trains = pd.read_sql(train_query, engine)
    print(f"  Ingested {len(df_trains)} train movements across {df_trains['section_id'].nunique()} sections.")

    df_trains['entry_min'] = ((pd.to_datetime(df_trains['entry_time']) - base_time).dt.total_seconds() / 60).astype(int)
    df_trains['exit_min'] = ((pd.to_datetime(df_trains['exit_time']) - base_time).dt.total_seconds() / 60).astype(int)
    df_trains['duration_min'] = df_trains['exit_min'] - df_trains['entry_min']

    # 3. Pull Resources
    res_query = "SELECT resource_id, resource_type, department, capacity FROM resources"
    df_resources = pd.read_sql(res_query, engine)
    resource_map = {row['department']: (row['resource_id'], row['capacity']) for _, row in df_resources.iterrows()}

    # 4. Initialize CP-SAT Model
    model = cp_model.CpModel()

    task_presences = {}
    task_starts = {}
    task_ends = {}
    task_intervals = {}
    tasks_by_section = {}
    tasks_by_resource = {}
    task_meta = {}

    for _, t in df_tasks.iterrows():
        tid = t['task_id']
        duration = int(t['duration_minutes'])
        sec_id = t['section_id']
        dept = t['department']

        presence = model.NewBoolVar(f"presence_{tid}")
        start = model.NewIntVar(0, max_horizon_minutes, f"start_{tid}")
        end = model.NewIntVar(0, max_horizon_minutes, f"end_{tid}")
        interval = model.NewOptionalIntervalVar(start, duration, end, presence, f"interval_{tid}")

        task_presences[tid] = presence
        task_starts[tid] = start
        task_ends[tid] = end
        task_intervals[tid] = interval
        task_meta[tid] = {
            'section_id': sec_id,
            'department': dept,
            'priority': float(t['priority_score']) if t['priority_score'] is not None else 0.0,
        }
        tasks_by_section.setdefault(sec_id, []).append((tid, interval))
        res_id, _ = resource_map.get(dept, ("GENERIC", 10))
        tasks_by_resource.setdefault(res_id, []).append(interval)

    # 5. HARD CONSTRAINT: THE TRAIN WALL + TASK SEPARATION (pairwise form)
    # Monolithic AddNoOverlap would forbid ANY task-task overlap, making combined
    # multi-department blocks structurally impossible. We switch to pairwise
    # disjunctions so that designated combined partners MAY share the window
    # (concurrent crews in one corridor block), while every task still strictly
    # avoids all train movements.
    def _separate_or_combine(tid_i, tid_j):
        """Task-vs-task: sequence them OR mark as one combined block."""
        lb = model.NewBoolVar(f"seq_{tid_i}_before_{tid_j}")
        la = model.NewBoolVar(f"seq_{tid_j}_before_{tid_i}")
        lc = model.NewBoolVar(f"combined_{tid_i}_{tid_j}")
        pi = task_presences[tid_i]
        pj = task_presences[tid_j]
        # A combination only exists when BOTH tasks are actually scheduled —
        # without these implications the solver could farm phantom bonuses.
        model.AddImplication(lc, pi)
        model.AddImplication(lc, pj)
        model.Add(task_ends[tid_i] <= task_starts[tid_j]).OnlyEnforceIf([lb, pi, pj])
        model.Add(task_ends[tid_j] <= task_starts[tid_i]).OnlyEnforceIf([la, pi, pj])
        model.Add(task_starts[tid_i] - task_starts[tid_j] <= COMBINED_TOLERANCE_MIN).OnlyEnforceIf([lc, pi, pj])
        model.Add(task_starts[tid_j] - task_starts[tid_i] <= COMBINED_TOLERANCE_MIN).OnlyEnforceIf([lc, pi, pj])
        # When both tasks are scheduled, exactly one arrangement must apply.
        model.Add(lb + la + lc >= pi + pj - 1)
        model.Add(lb + la + lc <= 1)
        return lc

    def _avoid_train(tid, entry_m, exit_m, tag):
        """Task-vs-fixed-train: strict temporal separation whenever scheduled."""
        pi = task_presences[tid]
        lb = model.NewBoolVar(f"{tag}_after_{tid}")
        la = model.NewBoolVar(f"{tag}_before_{tid}")
        model.Add(task_ends[tid] <= entry_m).OnlyEnforceIf([lb, pi])
        model.Add(task_starts[tid] >= exit_m).OnlyEnforceIf([la, pi])
        model.Add(lb + la >= pi)

    combined_vars = {}
    seen_pairs = set()

    # Top-N priority candidates per (section, department) may opt into combined
    # blocks; all remaining pairs are strictly sequenced.
    pool_by_section_dept = {}
    for tid, info in task_meta.items():
        pool_by_section_dept.setdefault((info['section_id'], info['department']), []).append(
            (info['priority'], tid))
    coordination_candidates = set()
    for key, pool in pool_by_section_dept.items():
        for _, tid in sorted(pool, reverse=True)[:COMBINED_TOP_N]:
            coordination_candidates.add(tid)

    for sec_id, task_list in tasks_by_section.items():
        sec_trains = df_trains[df_trains['section_id'] == sec_id]
        for _, train in sec_trains.iterrows():
            entry_m = int(train['entry_min'])
            exit_m = int(train['exit_min'])
            for tid, _ in task_list:
                _avoid_train(tid, entry_m, exit_m, f"trn_{train['movement_id']}")

    # IR Peak Traffic Rule: No maintenance blocks granted between 12:00 and 18:00 (12 PM - 6 PM)
    # unless task criticality is explicitly 'Critical'.
    for _, t in df_tasks.iterrows():
        tid = t['task_id']
        crit = str(t['criticality'])
        if crit != 'Critical':
            for d in range(int(horizon_days)):
                f_start = d * 1440 + 720   # 12:00 PM
                f_end = d * 1440 + 1080    # 06:00 PM
                _avoid_train(tid, f_start, f_end, f"ir_peak_d{d}")

        for a in range(len(task_list)):
            for b in range(a + 1, len(task_list)):
                tid_i, tid_j = task_list[a][0], task_list[b][0]
                if (tid_i, tid_j) in seen_pairs:
                    continue
                seen_pairs.add((tid_i, tid_j))
                can_combine = (
                    task_meta[tid_i]['department'] != task_meta[tid_j]['department']
                    and tid_i in coordination_candidates
                    and tid_j in coordination_candidates
                )
                if can_combine:
                    combined_vars[(tid_i, tid_j)] = _separate_or_combine(tid_i, tid_j)
                else:
                    # Pure sequencing, no combined-block option.
                    lb = model.NewBoolVar(f"seq_{tid_i}_before_{tid_j}")
                    la = model.NewBoolVar(f"seq_{tid_j}_before_{tid_i}")
                    pi, pj = task_presences[tid_i], task_presences[tid_j]
                    model.Add(task_ends[tid_i] <= task_starts[tid_j]).OnlyEnforceIf([lb, pi, pj])
                    model.Add(task_ends[tid_j] <= task_starts[tid_i]).OnlyEnforceIf([la, pi, pj])
                    model.Add(lb + la >= pi + pj - 1)
                    model.Add(lb + la <= 1)

    print(f"  Coordination pairs created: {len(combined_vars)} cross-department combinations "
          f"(candidates: {len(coordination_candidates)})")

    # 6. HARD CONSTRAINT: RESOURCE CAPACITY (AddCumulative)
    for _, res in df_resources.iterrows():
        res_id = res['resource_id']
        capacity = int(res['capacity'])
        intervals = tasks_by_resource.get(res_id, [])
        if intervals:
            demands = [1] * len(intervals)
            model.AddCumulative(intervals, demands, capacity)

    # 7. OBJECTIVE
    objective_terms = []
    for _, t in df_tasks.iterrows():
        tid = t['task_id']
        score = int(t['priority_score'] * 10)
        objective_terms.append(task_presences[tid] * score)

    for (_, _), c in combined_vars.items():
        objective_terms.append(COMBINED_BONUS * c)

    model.Maximize(sum(objective_terms))

    # 8. SOLVE
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max_solver_time
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)

    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        status_name = "OPTIMAL" if status == cp_model.OPTIMAL else "FEASIBLE"
        print(f"  ✓ Solution Found: {status_name}!")
        print(f"  Solver Objective Value: {solver.ObjectiveValue() / 10:.2f}")
        print(f"  Wall Time: {solver.WallTime():.2f}s")

        # Resolve combined-block groups via union-find over active pair bonuses.
        parent = {}
        def find(x):
            while parent.setdefault(x, x) != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        def union(a, b):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb

        active_pairs = 0
        for (tid_i, tid_j), c in combined_vars.items():
            if solver.Value(c) == 1:
                union(tid_i, tid_j)
                active_pairs += 1
        covered_tasks = len(parent)  # every task appearing in an active pair
        roots = {find(t) for t in parent}
        group_ids = {root: f"CB_{i + 1:03d}" for i, root in enumerate(sorted(roots))}
        print(f"  ✓ Combined blocks formed: {len(group_ids)} groups covering {covered_tasks} tasks ({active_pairs} coordinated pairs)")

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
                    'assigned_end_time': end_dt.strftime('%Y-%m-%d %H:%M'),
                    'combined_group_id': group_ids.get(find(tid), '') if tid in parent else '',
                })

        df_schedule = pd.DataFrame(scheduled_tasks)
        df_schedule.to_csv(SCHEDULE_CSV, index=False)
        print(f"  ✓ Successfully scheduled {len(df_schedule)} tasks. Saved to {SCHEDULE_CSV}")
        return df_schedule, df_trains, resource_map
    else:
        raise RuntimeError("No feasible schedule found by the CP-SAT solver!")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description="Time-Aware CP-SAT Block Optimizer")
    parser.add_argument('--horizon-days', type=int, default=7, help='Planning horizon in days (7=weekly, 30=monthly)')
    parser.add_argument('--max-solver-time', type=float, default=30.0, help='Solver wall-time limit in seconds')
    args = parser.parse_args()
    time_aware_optimizer(horizon_days=args.horizon_days, max_solver_time=args.max_solver_time)
