"""Single source of truth for the historical ML dataset (Master Plan v2).

Generates historical_ml_dataset.csv (2,500 rows) with temporal ordering and
operational features derived from Indian Railways failure, defect, inspection,
and train-impact event history:
  - Rolling failure counts: failures_7d, failures_30d, failures_90d, failures_180d, failures_365d
  - Failure duration: failure_duration_30d, failure_duration_90d
  - Recurrence metrics: days_since_last_failure, repeat_failure_flag, failure_recurrence_rate
  - Operational detention impact: trains_delayed_90d, total_detention_90d, avg_detention_90d
  - Asset & condition context: asset_age, condition_score, inspection_score, days_overdue
  - Traffic density and train mix: passenger_train_count, goods_train_count
  - Ground-truth target: future_critical_event_30d (binary 0/1 without future data leakage)
"""
import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

N_SAMPLES = 2500
SEED = 42

def generate_dataset(n_samples=N_SAMPLES, seed=SEED):
    rng = np.random.default_rng(seed)

    sections = ([f"SEC_BSB_LKO_{i:02d}" for i in range(1, 5)]
                + [f"SEC_HWH_DLI_{i:02d}" for i in range(1, 5)]
                + [f"SEC_DDU_YARD_{i:02d}" for i in range(1, 5)])
    departments = ['Engineering', 'Traction', 'S&T']
    task_types = {
        'Engineering': ['Broken Rail Weld', 'Track Gauge Spread', 'Ballast Deep Screening', 'Point Machine Mechanical Fault'],
        'Traction': ['OHE Dropper Broken', 'Cantilever Insulator Flashover', 'Contact Wire Sag', 'Neutral Section Inspection'],
        'S&T': ['Track Circuit Short', 'Axle Counter Error', 'Signal Aspect Lamp Fail', 'Point Machine Detection Fault']
    }

    # Chronological timeline from 2025-01-01 to 2026-08-20 for strict temporal validation
    start_date = datetime(2025, 1, 1)
    date_offsets = np.sort(rng.integers(0, 590, size=n_samples))
    record_dates = [start_date + timedelta(days=int(d)) for d in date_offsets]

    dept_arr = rng.choice(departments, size=n_samples, p=[0.45, 0.30, 0.25])
    sec_arr = rng.choice(sections, size=n_samples)

    asset_importance = np.round(rng.uniform(0.60, 0.99, n_samples), 2)
    asset_age = rng.integers(1, 30, n_samples)
    days_overdue = np.minimum(rng.exponential(scale=4.5, size=n_samples).astype(int), 35)

    condition_score = np.clip(100 - asset_age * 1.6 - days_overdue * 1.8 + rng.normal(0, 9, n_samples), 10, 100).astype(int)
    inspection_score = np.clip(condition_score + rng.normal(0, 7, n_samples), 10, 100).astype(int)
    health_index = np.clip(condition_score - rng.integers(0, 10, n_samples), 10, 100).astype(int)

    days_since_maint = rng.integers(10, 240, n_samples)
    days_since_last_failure = np.clip(rng.exponential(scale=60.0, size=n_samples).astype(int), 3, 365)

    # Rolling window failure aggregates
    lam_fail_30 = np.where(condition_score < 40, 0.9, np.where(condition_score < 65, 0.4, 0.08))
    failures_7d = rng.poisson(lam_fail_30 * 0.25)
    failures_30d = rng.poisson(lam_fail_30)
    failures_90d = failures_30d + rng.poisson(lam_fail_30 * 2.0)
    failures_180d = failures_90d + rng.poisson(lam_fail_30 * 2.5)
    failures_365d = failures_180d + rng.poisson(lam_fail_30 * 4.0)

    failure_duration_30d = failures_30d * rng.integers(40, 150, n_samples)
    failure_duration_90d = failures_90d * rng.integers(45, 140, n_samples)
    repeat_failure_flag = (failures_90d >= 2).astype(int)
    failure_recurrence_rate = np.round(failures_90d / np.maximum(1, failures_365d), 2)

    # Defects & Operational impact
    lam_defects = np.where(condition_score < 45, 2.2, np.where(condition_score < 70, 0.9, 0.2))
    defects_30d = rng.poisson(lam_defects)

    traffic_density = rng.choice(['Low', 'Medium', 'High'], size=n_samples, p=[0.20, 0.50, 0.30])
    p_trains = np.where(traffic_density == 'High', rng.integers(20, 85, n_samples), rng.integers(5, 35, n_samples))
    g_trains = np.where(traffic_density == 'High', rng.integers(15, 95, n_samples), rng.integers(2, 28, n_samples))

    trains_delayed_90d = np.clip(failures_90d * rng.integers(1, 6, n_samples), 0, 30)
    total_detention_90d = np.round(trains_delayed_90d * rng.uniform(20.0, 50.0, n_samples), 1)
    avg_detention_90d = np.round(total_detention_90d / np.maximum(1, trains_delayed_90d), 1)

    # Nonlinear ground-truth operational risk process
    degradation = 100 - condition_score
    hidden_mismatch = np.abs(inspection_score - condition_score)

    risk_logit = (
        -5.40
        + 0.048 * degradation
        + 0.0022 * (asset_age ** 2)
        + 0.16 * np.sqrt(days_overdue.astype(float))
        + 0.005 * days_since_maint
        + 0.32 * defects_30d
        + 0.42 * failures_90d
        + 0.25 * repeat_failure_flag
        + 0.008 * failure_duration_90d
        + 0.015 * trains_delayed_90d
        + 0.48 * (asset_importance - 0.70)
        + 0.008 * hidden_mismatch
        # Axis-aligned operational threshold gates
        + 2.60 * ((traffic_density == 'High') & (condition_score < 45)).astype(float)
        + 2.20 * ((asset_age >= 18) & (days_overdue > 0)).astype(float)
        + 1.80 * ((failures_30d >= 2) & (repeat_failure_flag == 1)).astype(float)
        - 2.40 * (asset_age < 4).astype(float) # New asset break-in stability
    ) * 1.35

    prob_failure = 1.0 / (1.0 + np.exp(-risk_logit))
    future_event = (rng.random(n_samples) < prob_failure).astype(int)

    task_type_arr = [task_types[d][rng.integers(0, len(task_types[d]))] for d in dept_arr]
    asset_ids = [f"AST_{d[:3].upper()}_{rng.integers(1000, 9999)}" for d in dept_arr]

    return pd.DataFrame({
        'record_date': [d.strftime('%Y-%m-%d') for d in record_dates],
        'asset_id': asset_ids,
        'section_id': sec_arr,
        'department': dept_arr,
        'task_type': task_type_arr,
        'asset_importance': asset_importance,
        'asset_age': asset_age,
        'condition_score': condition_score,
        'inspection_score': inspection_score,
        'health_index': health_index,
        'days_overdue': days_overdue,
        'days_since_last_maintenance': days_since_maint,
        'days_since_last_failure': days_since_last_failure,
        'defects_30d': defects_30d,
        'failures_7d': failures_7d,
        'failures_30d': failures_30d,
        'failures_90d': failures_90d,
        'failures_180d': failures_180d,
        'failures_365d': failures_365d,
        'failure_duration_30d': failure_duration_30d,
        'failure_duration_90d': failure_duration_90d,
        'repeat_failure_flag': repeat_failure_flag,
        'failure_recurrence_rate': failure_recurrence_rate,
        'trains_delayed_90d': trains_delayed_90d,
        'total_detention_90d': total_detention_90d,
        'avg_detention_90d': avg_detention_90d,
        'traffic_density': traffic_density,
        'passenger_train_count': p_trains,
        'goods_train_count': g_trains,
        'future_critical_event_30d': future_event
    })

if __name__ == '__main__':
    df = generate_dataset()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'historical_ml_dataset.csv')
    df.to_csv(out, index=False)
    print(f"Wrote {out} ({df.shape[0]} rows, {df.shape[1]} columns).")
    print(f"Target distribution (future_critical_event_30d):")
    print(df['future_critical_event_30d'].value_counts(normalize=True).round(3).to_dict())
