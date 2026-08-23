import os
import sys
import pandas as pd
import sqlalchemy
from datetime import datetime
from db_helper import get_db_engine

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEEDS_DIR = os.path.join(BASE_DIR, 'data_feeds')

# Department -> source system mapping (mirrors real IR stack)
SOURCE_SYSTEMS = {
    'Engineering': 'TMS',   # Track Management System
    'Traction': 'TDMS',     # Traction Distribution Management System
    'S&T': 'SMMS',          # Signalling Maintenance & Management System
}

CRIT_MAP = {'1': 'Critical', '2': 'High', '3': 'Medium', '4': 'Low'}


def ingest_feeds(db_url=None):
    """Normalize departmental CSV drops into maintenance_tasks with provenance.

    Expected feed file format (per source system):
        asset_id,raw_type,severity(1-4),reported_date
    Missing feed files are skipped gracefully so the synthetic pipeline keeps working.
    """
    engine = get_db_engine() if db_url is None else sqlalchemy.create_engine(db_url)

    print("=" * 60)
    print("EXECUTING PHASE 1b: DEPARTMENTAL FEED INGESTION")
    print("=" * 60)

    if not os.path.isdir(FEEDS_DIR):
        print(f"  No feeds directory at {FEEDS_DIR} — skipping ingestion.")
        return 0

    total = 0
    for fname in sorted(os.listdir(FEEDS_DIR)):
        if not fname.endswith('.csv'):
            continue
        path = os.path.join(FEEDS_DIR, fname)
        try:
            df = pd.read_csv(path)
        except Exception as e:
            print(f"  ! Skipping unreadable feed {fname}: {e}")
            continue

        required = {'asset_id', 'raw_type', 'severity'}
        if not required.issubset(df.columns):
            print(f"  ! Feed {fname} missing columns {required - set(df.columns)} — skipped.")
            continue

        df['task_id'] = [f"FEED_{fname.split('.')[0].upper()}_{i:04d}" for i in range(len(df))]
        df['criticality'] = df['severity'].astype(str).map(CRIT_MAP).fillna('Low')
        if 'reported_date' in df.columns:
            df['due_date'] = pd.to_datetime(df['reported_date']).dt.date
        else:
            df['due_date'] = datetime.now().date()
        if 'duration_minutes' not in df.columns:
            df['duration_minutes'] = 90
        df['priority_score'] = None
        df['status'] = 'Pending'

        # Resolve source_system: explicit column wins, else infer from filename prefix.
        if 'source_system' in df.columns:
            df['source_system'] = df['source_system'].astype(str).str.upper().str.slice(0, 10)
        else:
            prefix = fname.split('_')[0].upper()  # tms_*.csv / tdms_*.csv / smms_*.csv
            df['source_system'] = prefix

        cols = ['task_id', 'asset_id', 'raw_type', 'criticality', 'due_date',
                'duration_minutes', 'priority_score', 'status', 'source_system']
        out = df[cols].rename(columns={'raw_type': 'task_type'})

        with engine.begin() as conn:
            existing = pd.read_sql(
                "SELECT task_id FROM maintenance_tasks",
                conn
            )
            new = out[~out['task_id'].isin(set(existing['task_id']))]
            if len(new):
                new.to_sql('maintenance_tasks', conn, if_exists='append', index=False)
                conn.execute(
                    sqlalchemy.text(
                        "INSERT INTO department_feeds (source_system, asset_id, raw_type, severity, reported_date) "
                        "SELECT source_system, asset_id, task_type, criticality, due_date FROM maintenance_tasks "
                        "WHERE task_id LIKE :prefix"
                    ),
                    {"prefix": f"FEED_{fname.split('.')[0].upper()}_%"},
                )

        print(f"  ✓ {fname}: ingested {len(new)} new tasks (system={df['source_system'].iloc[0]}).")
        total += len(new)

    print(f"  Feed ingestion complete. {total} tasks added from departmental systems.\n")
    return total


if __name__ == '__main__':
    import sqlalchemy
    ingest_feeds()
