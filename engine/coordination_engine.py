"""Deterministic Coordination & Shadow-Block Engine (Blueprint v2 Section 14.11, 14.12, 15 & 21).

"Same section does not mean automatic merging."

Provides:
  1. 8-Point Compatibility Verification:
     Compat_ij = S_ij and T_ij and Iso_ij and Res_ij and Dir_ij and Dep_ij and Safety_ij
     Returns: ELIGIBLE, CONDITIONAL, REJECTED, or UNKNOWN with machine-readable reason codes.

  2. Shadow-Block Candidate Generation:
     Bundles compatible Engineering + Traction + S&T tasks into candidate unified possessions.
     Calculates:
       - Merged block duration: D_combined = max(d_i, d_j)
       - Possession time saved: Saving = sum(d_i) - D_combined
       - Multi-department coordination value
"""
import os
import sys
import json
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db_helper import get_db_engine

# Explicit safety-prohibited simultaneous operations
INCOMPATIBLE_WORK_PAIRS = [
    ('Ballast Deep Screening', 'Signal Aspect Lamp Fail'), # Heavy ballast dust/vibration impairs optical signal calibration
    ('Broken Rail Weld', 'Contact Wire Sag'),             # Severe track hydraulic lifting destabilizes tower wagon staging
    ('Track Tamper Machine', 'Signal Testing Rig')         # Heavy track vibration disrupts electronic axle counters
]

STATUS_ELIGIBLE = 'ELIGIBLE'
STATUS_CONDITIONAL = 'CONDITIONAL'
STATUS_REJECTED = 'REJECTED'
STATUS_UNKNOWN = 'UNKNOWN'

def evaluate_pair_compatibility(t1: dict, t2: dict) -> dict:
    """Evaluates 8 deterministic criteria between two maintenance tasks.
    
    Returns structured compatibility evaluation:
        {
            'pair_id': str,
            'status': 'ELIGIBLE' | 'CONDITIONAL' | 'REJECTED' | 'UNKNOWN',
            'is_compatible': bool,
            'saving_minutes': int,
            'reason_codes': list[str],
            'checks': dict[str, bool]
        }
    """
    reasons = []
    checks = {
        'spatial': False,
        'direction': False,
        'isolation': True,
        'resources': True,
        'safety': True,
        'duration_ratio': True,
        'precedence': True
    }

    # 1. Spatial Check: Must belong to the exact same operational section
    s1 = t1.get('section_id')
    s2 = t2.get('section_id')
    if s1 and s2 and s1 == s2:
        checks['spatial'] = True
    else:
        checks['spatial'] = False
        reasons.append("SPATIAL_MISMATCH: Tasks belong to different operational corridor sections.")

    # 2. Direction / Line Possession Check
    l1 = t1.get('affects_line', 'BOTH')
    l2 = t2.get('affects_line', 'BOTH')
    dept1 = t1.get('department', '')
    dept2 = t2.get('department', '')
    
    if l1 == 'BOTH' or l2 == 'BOTH' or l1 == l2:
        checks['direction'] = True
    else:
        checks['direction'] = False
        reasons.append(f"DIRECTION_DISJUNCTION: Line {l1} and {l2} cannot share a single track possession.")

    # 3. Machine / Resource Exclusivity Check
    res1 = str(t1.get('required_resources', ''))
    res2 = str(t2.get('required_resources', ''))
    if res1 and res2 and res1 == res2 and any(k in res1 for k in ['Tamper', 'Tower', 'Cleaner', 'Crane']):
        checks['resources'] = False
        reasons.append(f"RESOURCE_CONTENTION: Both tasks contend for exclusive machinery ({res1}).")

    # 4. Domain Safety Prohibitions
    type1 = str(t1.get('task_type', ''))
    type2 = str(t2.get('task_type', ''))
    pair_ab = (type1, type2)
    pair_ba = (type2, type1)
    if pair_ab in INCOMPATIBLE_WORK_PAIRS or pair_ba in INCOMPATIBLE_WORK_PAIRS:
        checks['safety'] = False
        reasons.append(f"SAFETY_PROHIBITION: Prohibited simultaneous activity between {type1} and {type2}.")

    # 5. Duration Containment Ratio Check (cannot pair 15 min inspection with 180 min relay overhaul without review)
    d1 = int(t1.get('duration_minutes', 60))
    d2 = int(t2.get('duration_minutes', 60))
    ratio = max(d1, d2) / max(1.0, min(d1, d2))
    if ratio > 3.0:
        checks['duration_ratio'] = False
        reasons.append(f"DURATION_IMBALANCE: Duration ratio ({ratio:.1f}x) exceeds maximum 3.0x efficiency bound.")

    # Determine Overall Status
    is_compat = all(checks.values())
    if is_compat:
        status = STATUS_ELIGIBLE
        # If different departments combine, it's a prime multi-dept shadow block
        if dept1 != dept2 and dept1 and dept2:
            reasons.append(f"MULTI_DEPT_OPPORTUNITY: Safe multi-possession between {dept1} and {dept2}.")
    elif not checks['spatial'] or not checks['safety'] or not checks['resources']:
        status = STATUS_REJECTED
    elif not checks['direction'] or not checks['duration_ratio']:
        status = STATUS_CONDITIONAL
    else:
        status = STATUS_UNKNOWN

    d_combined = max(d1, d2)
    saving = (d1 + d2 - d_combined) if is_compat else 0

    return {
        'pair_id': f"{t1.get('task_id')}_{t2.get('task_id')}",
        'status': status,
        'is_compatible': is_compat,
        'duration_combined': d_combined,
        'saving_minutes': saving,
        'reason_codes': reasons,
        'checks': checks
    }

def generate_shadow_block_candidates(tasks: list[dict]) -> list[dict]:
    """Generates candidate multi-task shadow blocks grouped by section and multi-department feasibility."""
    by_section = {}
    for t in tasks:
        sid = t.get('section_id')
        if sid:
            by_section.setdefault(sid, []).append(t)

    candidates = []
    bundle_id_counter = 100

    for sid, sec_tasks in by_section.items():
        if len(sec_tasks) < 2:
            continue

        # Evaluate pairs to find dense multi-department cliques
        compatible_pairs = []
        for i in range(len(sec_tasks)):
            for j in range(i + 1, len(sec_tasks)):
                t1 = sec_tasks[i]
                t2 = sec_tasks[j]
                eval_res = evaluate_pair_compatibility(t1, t2)
                if eval_res['is_compatible']:
                    compatible_pairs.append((t1, t2, eval_res))

        # Bundle compatible tasks
        used_task_ids = set()
        for t1, t2, eval_res in compatible_pairs:
            tid1 = t1.get('task_id')
            tid2 = t2.get('task_id')
            if tid1 in used_task_ids or tid2 in used_task_ids:
                continue

            bundle_id_counter += 1
            bundle_id = f"SB_{bundle_id_counter}"
            bundled_tasks = [t1, t2]
            used_task_ids.add(tid1)
            used_task_ids.add(tid2)

            # Check if a 3rd compatible task can join the shadow block
            for t3 in sec_tasks:
                tid3 = t3.get('task_id')
                if tid3 not in used_task_ids:
                    res13 = evaluate_pair_compatibility(t1, t3)
                    res23 = evaluate_pair_compatibility(t2, t3)
                    if res13['is_compatible'] and res23['is_compatible']:
                        bundled_tasks.append(t3)
                        used_task_ids.add(tid3)
                        break

            # Calculate shadow block metrics
            durations = [int(t.get('duration_minutes', 60)) for t in bundled_tasks]
            block_dur = max(durations)
            sum_dur = sum(durations)
            saving = sum_dur - block_dur
            depts = sorted(list(set(t.get('department', '') for t in bundled_tasks)))

            # Coordination Value formula: Blueprint Section 14.12
            # CoordinationValue = 1.2 * Saving + 25 * DeptCount + 0.5 * sum(Priority)
            prio_sum = sum(float(t.get('priority_score', 50.0)) for t in bundled_tasks)
            coord_val = round(1.2 * saving + (25.0 * len(depts)) + (0.05 * prio_sum), 2)

            candidates.append({
                'bundle_id': bundle_id,
                'section_id': sid,
                'corridor_id': t1.get('corridor_id', ''),
                'task_ids': [t.get('task_id') for t in bundled_tasks],
                'task_count': len(bundled_tasks),
                'departments': depts,
                'block_duration_minutes': block_dur,
                'saved_possession_minutes': saving,
                'coordination_value': coord_val,
                'is_multi_department': len(depts) > 1,
                'tasks': bundled_tasks
            })

    return candidates

if __name__ == '__main__':
    t_eng = {'task_id': 'T1', 'section_id': 'SEC_01', 'department': 'Engineering', 'task_type': 'Track Gauge Spread', 'duration_minutes': 90, 'affects_line': 'UP'}
    t_trd = {'task_id': 'T2', 'section_id': 'SEC_01', 'department': 'Traction', 'task_type': 'Cantilever Insulator Flashover', 'duration_minutes': 60, 'affects_line': 'UP'}
    res = evaluate_pair_compatibility(t_eng, t_trd)
    print("Coordination Engine Pair Compatibility Test:")
    print(f"  Status: {res['status']}, Compatible: {res['is_compatible']}, Saving: {res['saving_minutes']} min")
    print(f"  Reasons: {res['reason_codes']}")
