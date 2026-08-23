import sys
import pandas as pd
import numpy as np
import sqlalchemy
from sqlalchemy import text
from datetime import datetime
from db_helper import get_db_engine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def calculate_priorities(db_url=None):
    engine = get_db_engine() if db_url is None else sqlalchemy.create_engine(db_url)
    
    print("Executing Phase 2: Explainable Priority Rules Engine...")
    
    # 1. Pull pending tasks joined with their operational section
    query = """
    SELECT mt.task_id, mt.criticality, mt.due_date, mt.duration_minutes,
           a.department, a.asset_type, s.section_id, s.name as section_name
    FROM maintenance_tasks mt
    JOIN assets a ON mt.asset_id = a.asset_id
    JOIN sections s ON a.section_id = s.section_id
    WHERE mt.status = 'Pending'
    """
    df = pd.read_sql(query, engine)
    print(f"  Pulled {len(df)} pending maintenance tasks.")
    
    # 2. Base Criticality Weight (Scale: 0 - 100)
    crit_weights = {'Critical': 100.0, 'High': 75.0, 'Medium': 50.0, 'Low': 25.0}
    df['score_crit'] = df['criticality'].map(crit_weights).fillna(25.0)
    
    # 3. Urgency & Overdue Score (Scale: 0 - 100)
    # Today reference: 2026-08-23
    today = pd.to_datetime('2026-08-23')
    df['days_left'] = (pd.to_datetime(df['due_date']) - today).dt.days
    
    # If overdue (days_left < 0): max urgency score (100)
    # If due today (0): 90
    # If due within 10 days: scale down to 10
    df['score_urgency'] = np.where(
        df['days_left'] < 0,
        100.0,
        np.maximum(10.0, 100.0 - (df['days_left'].clip(lower=0, upper=10) * 9.0))
    )
    
    # 4. Final Explainable Score (60% Criticality + 40% Urgency) -> Bounds [0, 100]
    df['priority_score'] = (df['score_crit'] * 0.6) + (df['score_urgency'] * 0.4)
    df['priority_score'] = df['priority_score'].round(2)
    
    # 5. Batch update to PostgreSQL
    with engine.begin() as conn:
        for _, row in df.iterrows():
            conn.execute(
                text("UPDATE maintenance_tasks SET priority_score = :score WHERE task_id = :tid"),
                {"score": float(row['priority_score']), "tid": row['task_id']}
            )
            
    print(f"  ✓ Updated priority_score for all {len(df)} tasks.")
    print(f"  Min Score: {df['priority_score'].min():.2f} | Max Score: {df['priority_score'].max():.2f} | Mean Score: {df['priority_score'].mean():.2f}")
    return df

if __name__ == '__main__':
    calculate_priorities()
