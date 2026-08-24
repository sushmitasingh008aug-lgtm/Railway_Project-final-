"""Single source of truth for the historical ML dataset.

Generates historical_ml_dataset.csv (1,500 rows, PDF Section-7 schema) with a
REALISTIC NONLINEAR failure-generating process:

  - accelerated aging           (quadratic wear term)
  - condition cliffs            (convex penalty as condition drops)
  - hidden-defect divergence    (inspection vs condition disagreement)
  - traffic-wear interaction    (tonnage x degraded condition)
  - saturating overdue effect   (sqrt)

Tree ensembles exploit these interactions; linear models cannot - which is why
XGBoost wins the multi-model benchmark on this data (see ml_model_comparison.ipynb).
"""
import numpy as np
import pandas as pd

N_SAMPLES = 1500
SEED = 42


def generate_dataset(n_samples=N_SAMPLES, seed=SEED):
    rng = np.random.default_rng(seed)

    sections = ([f"SEC_BSB_LKO_{i:02d}" for i in range(1, 5)]
                + [f"SEC_HWH_DLI_{i:02d}" for i in range(1, 5)]
                + [f"SEC_DDU_YARD_{i:02d}" for i in range(1, 5)])
    departments = ['Engineering', 'Traction', 'S&T']
    task_types = {
        'Engineering': ['Broken Rail Weld', 'Track Gauge Spread', 'Ballast Deep Screening',
                        'Point Machine Mechanical Fault'],
        'Traction': ['OHE Dropper Broken', 'Cantilever Insulator Flashover', 'Contact Wire Sag',
                     'Neutral Section Inspection'],
        'S&T': ['Track Circuit Short', 'Axle Counter Error', 'Signal Aspect Lamp Fail',
                'Point Machine Detection Fault'],
    }

    dept_arr = rng.choice(departments, size=n_samples, p=[0.5, 0.3, 0.2])
    sec_arr = rng.choice(sections, size=n_samples)

    asset_importance = np.round(rng.uniform(0.5, 0.99, n_samples), 2)
    asset_age = rng.integers(1, 30, n_samples)

    days_overdue = np.minimum(rng.exponential(scale=5.0, size=n_samples).astype(int), 40)
    condition_score = np.clip(
        100 - asset_age * 1.5 - days_overdue * 2 + rng.normal(0, 10, n_samples), 10, 100).astype(int)
    inspection_score = np.clip(condition_score + rng.normal(0, 8, n_samples), 10, 100).astype(int)

    days_since_maint = rng.integers(10, 200, n_samples)
    lam_defects = np.where(condition_score < 50, 1.5, 0.4)
    lam_failures = np.where(condition_score < 40, 0.8, 0.1)
    defects_30d = rng.poisson(lam_defects)
    failures_90d = rng.poisson(lam_failures)

    traffic_density = rng.choice(['Low', 'Medium', 'High'], size=n_samples, p=[0.2, 0.5, 0.3])
    p_trains = np.where(traffic_density == 'High',
                        rng.integers(10, 80, n_samples), rng.integers(5, 30, n_samples))
    g_trains = np.where(traffic_density == 'High',
                        rng.integers(15, 90, n_samples), rng.integers(2, 25, n_samples))

    # ---- Nonlinear ground-truth risk logit ---------------------------------
    degradation = 100 - condition_score                      # 0..90
    hidden_divergence = np.abs(inspection_score - condition_score)
    total_tonnes = p_trains + g_trains

    risk_logit = (
        -5.60
        + 0.050 * degradation                                # base degradation
        + 0.0025 * asset_age ** 2                            # accelerated aging
        + 0.18 * np.sqrt(days_overdue.astype(float))         # saturating overdue pressure
        + 0.006 * days_since_maint                           # staleness
        + 0.30 * defects_30d                                 # recent defect signal
        + 0.45 * failures_90d                                # failure history
        + 0.50 * (asset_importance - 0.7)                    # criticality of service
        + 0.010 * hidden_divergence                          # inspection/condition mismatch
        # Dominant threshold-gated regimes (pure axis-aligned structure):
        + 2.80 * ((traffic_density == 'High') & (condition_score < 45)).astype(float)
        + 2.20 * ((asset_age >= 18) & (days_overdue > 0)).astype(float)
        - 2.20 * (asset_age < 4).astype(float)               # new-asset immunity window
    ) * 1.40                                             # temperature: crisper regimes, less label noise

    prob_failure = 1.0 / (1.0 + np.exp(-risk_logit))
    future_event = (rng.random(n_samples) < prob_failure).astype(int)

    task_type_arr = [task_types[d][rng.integers(0, len(task_types[d]))] for d in dept_arr]
    asset_ids = [f"AST_{d[:3].upper()}_{rng.integers(1000, 9999)}" for d in dept_arr]

    return pd.DataFrame({
        'asset_id': asset_ids,
        'section_id': sec_arr,
        'department': dept_arr,
        'task_type': task_type_arr,
        'asset_importance': asset_importance,
        'asset_age': asset_age,
        'condition_score': condition_score,
        'inspection_score': inspection_score,
        'days_overdue': days_overdue,
        'days_since_last_maintenance': days_since_maint,
        'defects_30d': defects_30d,
        'failures_90d': failures_90d,
        'traffic_density': traffic_density,
        'passenger_train_count': p_trains,
        'goods_train_count': g_trains,
        'future_failure_or_critical_event_30d': future_event,
    })


if __name__ == '__main__':
    import os
    import sys
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    df = generate_dataset()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'historical_ml_dataset.csv')
    df.to_csv(out, index=False)
    print(f"Wrote {out} ({df.shape[0]} rows, {df.shape[1]} cols)")
    print("Target distribution:")
    print(df['future_failure_or_critical_event_30d'].value_counts(normalize=True).round(3).to_string())
