import os
import sys
import json
import zlib
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime
from db_helper import get_db_engine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(ENGINE_DIR, 'ml_risk_model.pkl')
META_PATH = os.path.join(ENGINE_DIR, 'ml_model_meta.json')

CRIT_WEIGHTS = {'Critical': 100.0, 'High': 75.0, 'Medium': 50.0, 'Low': 25.0}


def load_champion():
    """Load the benchmark champion model + metadata produced by
    ml_model_comparison.ipynb (highest-accuracy model, XGBoost tuned)."""
    if not (os.path.exists(MODEL_PATH) and os.path.exists(META_PATH)):
        return None, None
    try:
        import joblib
        model = joblib.load(MODEL_PATH)
        with open(META_PATH, encoding='utf-8') as f:
            meta = json.load(f)
        return model, meta
    except Exception as e:
        print(f"  ! Could not load champion model ({e}); falling back to rule-based mode.")
        return None, None


def risk_to_criticality(p, bands):
    """Map predicted failure probability to a criticality class using the
    calibrated bands stored alongside the champion (default >=0.80 Critical ...)."""
    for band in sorted(bands, key=lambda b: -b['min_p']):
        if p >= band['min_p']:
            return band['class'], float(band['weight'])
    return 'Low', 25.0


def enrich_ml_features(df):
    """Build the 12 training-space features for every pending task.

    Real telemetry (asset_age / condition / inspection sensors) is not yet wired
    into the TMS/TDMS/SMMS feeds, so per-asset characteristics are simulated with
    a deterministic generator keyed on asset_id+task_id (stable across runs),
    while days_overdue comes from the REAL due date in the database.
    """
    today = pd.to_datetime('2026-08-23')
    rows = []
    for _, t in df.iterrows():
        days_left = (pd.to_datetime(t['due_date']) - today).days
        days_overdue = int(max(0, -days_left))
        rng = np.random.default_rng(zlib.crc32(f"{t['asset_id']}|{t['task_id']}".encode()))

        asset_age = int(rng.integers(1, 30))
        condition = int(np.clip(100 - asset_age * 1.5 - days_overdue * 2 + rng.normal(0, 10), 10, 100))
        inspection = int(np.clip(condition + rng.normal(0, 8), 10, 100))
        days_since_maint = int(rng.integers(10, 200))
        defects = int(rng.poisson(1.5 if condition < 50 else 0.4))
        failures = int(rng.poisson(0.8 if condition < 40 else 0.1))
        traffic = str(rng.choice(['Low', 'Medium', 'High'], p=[0.2, 0.5, 0.3]))

        rows.append({
            'department': t['department'],
            'traffic_density': traffic,
            'asset_importance': round(float(rng.uniform(0.5, 0.99)), 2),
            'asset_age': asset_age,
            'condition_score': condition,
            'inspection_score': inspection,
            'days_overdue': days_overdue,
            'days_since_last_maintenance': days_since_maint,
            'defects_30d': defects,
            'failures_90d': failures,
            'passenger_train_count': int(rng.integers(10, 80)) if traffic == 'High' else int(rng.integers(5, 30)),
            'goods_train_count': int(rng.integers(15, 90)) if traffic == 'High' else int(rng.integers(2, 25)),
        })
    return pd.DataFrame(rows)


def calculate_priorities(db_url=None, use_ml=True):
    engine = get_db_engine() if db_url is None else sqlalchemy.create_engine(db_url)

    model, meta = (load_champion() if use_ml else (None, None))
    mode = f"ML Champion ({meta['model_name']}, acc={meta['metrics']['Accuracy']:.4f})" if model else "Static Rules (60/40)"
    print("Executing Phase 2: Explainable Priority Engine...")
    print(f"  Scoring mode: {mode}")

    query = """
    SELECT mt.task_id, mt.asset_id, mt.criticality, mt.due_date, mt.duration_minutes,
           a.department, a.asset_type, s.section_id, s.name as section_name
    FROM maintenance_tasks mt
    JOIN assets a ON mt.asset_id = a.asset_id
    JOIN sections s ON a.section_id = s.section_id
    WHERE mt.status = 'Pending'
    """
    df = pd.read_sql(query, engine)
    print(f"  Pulled {len(df)} pending maintenance tasks.")

    today = pd.to_datetime('2026-08-23')
    df['days_left'] = (pd.to_datetime(df['due_date']) - today).dt.days
    df['score_urgency'] = np.where(
        df['days_left'] < 0,
        100.0,
        np.maximum(10.0, 100.0 - (df['days_left'].clip(lower=0, upper=10) * 9.0))
    )

    if model:
        X_raw = enrich_ml_features(df)
        feature_cols = meta['feature_columns']
        X_ml = pd.get_dummies(X_raw, drop_first=True).reindex(columns=feature_cols, fill_value=0)
        proba = model.predict_proba(X_ml)[:, 1]
        bands = meta['criticality_bands']

        cls_w = [risk_to_criticality(float(p), bands) for p in proba]
        df['ml_failure_probability'] = np.round(proba, 4)
        df['criticality'] = [c for c, _ in cls_w]
        df['score_crit'] = [w for _, w in cls_w]
        df['priority_score'] = ((df['score_crit'] * 0.6) + (df['score_urgency'] * 0.4)).round(2)

        dist = df['criticality'].value_counts().reindex(['Critical', 'High', 'Medium', 'Low']).fillna(0).astype(int)
        print(f"  ML-determined criticality distribution: {dist.to_dict()}")
        print(f"  Risk range: P(failure) in [{proba.min():.3f}, {proba.max():.3f}] | mean={proba.mean():.3f}")
        update_sql = text("UPDATE maintenance_tasks SET priority_score = :score, criticality = :crit WHERE task_id = :tid")
    else:
        df['score_crit'] = df['criticality'].map(CRIT_WEIGHTS).fillna(25.0)
        df['priority_score'] = ((df['score_crit'] * 0.6) + (df['score_urgency'] * 0.4)).round(2)
        update_sql = text("UPDATE maintenance_tasks SET priority_score = :score WHERE task_id = :tid")

    with engine.begin() as conn:
        for _, row in df.iterrows():
            params = {"score": float(row['priority_score']), "tid": row['task_id']}
            if model:
                params["crit"] = row['criticality']
            conn.execute(update_sql, params)

    print(f"  Updated {len(df)} tasks (priority_score{' + criticality' if model else ''}).")
    print(f"  Min Score: {df['priority_score'].min():.2f} | Max Score: {df['priority_score'].max():.2f} | Mean Score: {df['priority_score'].mean():.2f}")
    return df


if __name__ == '__main__':
    calculate_priorities()
