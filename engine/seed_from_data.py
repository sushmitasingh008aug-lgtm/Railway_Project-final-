"""
seed_from_data.py  — ABPS v4 canonical seeder
Reads all CSVs from engine/data/ and loads them into block_planning.db (SQLite WAL).
Replaces old transform_and_seed.py which relied on deleted mapped_assets.csv.
"""

import os, sys, traceback
import pandas as pd
from sqlalchemy import text

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db_helper import get_db_engine


def load(filename, **kwargs):
    path = os.path.join(DATA_DIR, filename)
    df = pd.read_csv(path, **kwargs)
    print(f"  loaded {filename}: {len(df):,} rows x {df.shape[1]} cols")
    return df


def ensure_col(engine, table, col, col_def="TEXT DEFAULT ''"):
    try:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
    except Exception:
        pass


def upsert(engine, table, df, chunk=500):
    if df.empty:
        return
    with engine.begin() as conn:
        conn.execute(text(f"DELETE FROM {table}"))
        for start in range(0, len(df), chunk):
            df.iloc[start:start+chunk].to_sql(
                table, conn, if_exists='append', index=False, method='multi')
    print(f"  -> {table}: {len(df):,} rows written")


def create_if_missing(engine, table, ddl):
    with engine.begin() as conn:
        conn.execute(text(f"CREATE TABLE IF NOT EXISTS {table} ({ddl})"))


def seed(engine):
    print("\n" + "="*70)
    print("ABPS v4 - Canonical Data Seeder")
    print("="*70)

    # 1. CORRIDORS
    print("\n[1] corridors")
    df = load("01_corridors.csv").drop_duplicates("corridor_id")
    for c in ["electrification_type","signaling_type"]:
        ensure_col(engine, "corridors", c)
    keep = [c for c in ["corridor_id","name","zone","division","electrification_type","signaling_type"] if c in df.columns]
    upsert(engine, "corridors", df[keep])

    # 2. SECTIONS with GIS
    print("\n[2] sections (GIS)")
    df = load("02_sections.csv").drop_duplicates("section_id")
    for c in ["start_station","end_station"]:
        ensure_col(engine, "sections", c)
    for c in ["start_lat","start_lon","end_lat","end_lon","length_km"]:
        ensure_col(engine, "sections", c, "REAL DEFAULT 0.0")
    keep = [c for c in ["section_id","name","corridor_id","length_km","start_station","end_station",
                         "start_lat","start_lon","end_lat","end_lon"] if c in df.columns]
    upsert(engine, "sections", df[keep])

    # 3. ASSETS with lat/lon
    print("\n[3] assets (GIS)")
    df = load("03_assets.csv")
    for c in ["block_section","station_from","station_to","direction","route_variant",
              "criticality_class","operational_status","last_maintenance_date","last_inspection_date"]:
        ensure_col(engine, "assets", c)
    for c in ["location_lat","location_lon","chainage_km","asset_age_years",
              "asset_importance","condition_score","health_index"]:
        ensure_col(engine, "assets", c, "REAL DEFAULT 0.0")
    keep = [c for c in ["asset_id","asset_type","asset_subtype","department","zone","division",
                         "corridor_id","section_id","block_section","station_from","station_to",
                         "chainage_km","direction","location_lat","location_lon",
                         "commissioning_date","asset_age_years","asset_importance",
                         "criticality_class","operational_status","last_maintenance_date",
                         "last_inspection_date","condition_score","health_index","route_variant"] if c in df.columns]
    upsert(engine, "assets", df[keep])

    # 4. FAILURE EVENT HISTORY
    print("\n[4] failure_event_history")
    df = load("04_failure_event_history.csv")
    real_cols = ['af_id','uims_id','zone','division','head','sub_head','failure_type','failure_date',
                 'failure_time','failure_start','failure_end','failure_duration_min','corridor_id',
                 'coa_section','block_section','station_from','station_to','section_id','chainage_km',
                 'direction','train_name','train_id','loco_id','coach_id','wagon_id','trains_delayed',
                 'avg_detention_min','total_detention_min','service_added','update_time','responsibility',
                 'cause','subcause','sm_remarks','department_comment','raw_description','source_system','severity']
    keep = [c for c in real_cols if c in df.columns]
    upsert(engine, "failure_event_history", df[keep])

    # 5. DEFECT HISTORY
    print("\n[5] defect_history")
    df = load("05_defect_history.csv")
    for c in ["section_id","defect_type","severity","detected_at"]:
        ensure_col(engine, "defect_history", c)
    keep = [c for c in ["defect_id","asset_id","section_id","defect_type","severity","detected_at"] if c in df.columns]
    upsert(engine, "defect_history", df[keep])

    # 6. MAINTENANCE TASKS
    print("\n[6] maintenance_tasks")
    df = load("06_maintenance_tasks.csv")
    for c in ["source_system","asset_type","affects_line","combined_group_id","block_section"]:
        ensure_col(engine, "maintenance_tasks", c)
    for c in ["priority_score","start_minute","end_minute"]:
        ensure_col(engine, "maintenance_tasks", c, "REAL DEFAULT 0.0")
    keep = [c for c in ["task_id","source_system","department","asset_id","asset_type","section_id",
                         "task_type","criticality","status","priority_score","due_date",
                         "duration_minutes","start_minute","end_minute","affects_line",
                         "combined_group_id","block_section"] if c in df.columns]
    upsert(engine, "maintenance_tasks", df[keep])

    # 7. TASK ACTIONS
    print("\n[7] task_actions")
    df = load("07_task_actions.csv")
    real_cols = ['action_id','task_id','action_type','required_crew','required_resources',
                 'setup_minutes','work_duration_minutes','isolation_requirement',
                 'possession_requirement','verification_required','sequence_order']
    for c in real_cols[4:]:
        ensure_col(engine, "task_actions", c, "TEXT DEFAULT ''")
    keep = [c for c in real_cols if c in df.columns]
    upsert(engine, "task_actions", df[keep])

    # 8. TRAIN MOVEMENTS
    print("\n[8] train_movements")
    df = load("08_train_movements.csv")
    for c in ["train_name","train_type","service_category"]:
        ensure_col(engine, "train_movements", c)
    for c in ["speed_kmh","occupancy"]:
        ensure_col(engine, "train_movements", c, "REAL DEFAULT 0.0")
    keep = [c for c in ["movement_id","train_id","train_name","train_type","service_category",
                         "corridor_id","section_id","direction","entry_time","exit_time",
                         "speed_kmh","occupancy"] if c in df.columns]
    upsert(engine, "train_movements", df[keep])

    # 9. BLOCK WINDOWS
    print("\n[9] block_windows")
    df = load("09_block_windows.csv")
    for c in ["block_section","block_type","status"]:
        ensure_col(engine, "block_windows", c)
    keep = [c for c in ["block_id","corridor_id","section_id","block_section","date",
                         "start_time","end_time","duration_minutes","block_type","status"] if c in df.columns]
    upsert(engine, "block_windows", df[keep])

    # 10. GOODS FORECAST
    print("\n[10] goods_forecast")
    df = load("10_goods_forecast.csv")
    for c in ["forecast_tonnes","actual_tonnes","congestion_level"]:
        ensure_col(engine, "goods_forecast", c, "REAL DEFAULT 0.0")
    keep = [c for c in ["forecast_id","corridor_id","section_id","forecast_date",
                         "time_window_start","time_window_end","forecast_tonnes",
                         "actual_tonnes","congestion_level"] if c in df.columns]
    upsert(engine, "goods_forecast", df[keep])

    # 11. RESOURCES
    print("\n[11] resources")
    df = load("11_resources.csv")
    for c in ["capability","available_from","available_to"]:
        ensure_col(engine, "resources", c)
    ensure_col(engine, "resources", "capacity", "REAL DEFAULT 0.0")
    keep = [c for c in ["resource_id","resource_type","department","capability",
                         "section_id","capacity","available_from","available_to"] if c in df.columns]
    upsert(engine, "resources", df[keep])

    # 12. TASK COMPATIBILITY
    print("\n[12] task_compatibility")
    df = load("12_task_compatibility.csv")
    for c in ["reason_codes","spatial_compatible"]:
        ensure_col(engine, "task_compatibility", c)
    keep = [c for c in ["pair_id","task_id_1","task_id_2","section_id",
                         "is_compatible","spatial_compatible","reason_codes"] if c in df.columns]
    upsert(engine, "task_compatibility", df[keep])

    # 13. TASK DEPENDENCIES
    print("\n[13] task_dependencies")
    df = load("13_task_dependencies.csv")
    ensure_col(engine, "task_dependencies", "dependency_type")
    ensure_col(engine, "task_dependencies", "min_lag_minutes", "REAL DEFAULT 0.0")
    keep = [c for c in ["dependency_id","predecessor_task_id","successor_task_id",
                         "dependency_type","min_lag_minutes"] if c in df.columns]
    upsert(engine, "task_dependencies", df[keep])

    # 14. ML PREDICTIONS
    print("\n[14] ml_predictions")
    df = load("14_ml_predictions.csv")
    for c in ["prediction_id","model_version","prediction_timestamp","predicted_failure_mode"]:
        ensure_col(engine, "ml_predictions", c)
    for c in ["risk_probability","priority_score","confidence"]:
        ensure_col(engine, "ml_predictions", c, "REAL DEFAULT 0.0")
    keep = [c for c in ["prediction_id","task_id","model_version","prediction_timestamp",
                         "risk_probability","priority_score","predicted_failure_mode","confidence"] if c in df.columns]
    upsert(engine, "ml_predictions", df[keep])

    # 15. SCHEDULE VERSIONS
    print("\n[15] schedule_versions")
    df = load("15_schedule_versions.csv")
    for c in ["approved_by","approved_at","notes"]:
        ensure_col(engine, "schedule_versions", c)
    keep = [c for c in ["version_id","created_at","horizon_days","status",
                         "approved_by","approved_at","notes"] if c in df.columns]
    upsert(engine, "schedule_versions", df[keep])

    # 16. OPTIMIZED BLOCKS
    print("\n[16] optimized_blocks")
    df = load("16_optimized_blocks.csv")
    for c in ["block_type","status"]:
        ensure_col(engine, "optimized_blocks", c)
    keep = [c for c in ["block_id","version_id","section_id","corridor_id","block_type",
                         "start_time","end_time","duration_minutes","tasks_count","status"] if c in df.columns]
    upsert(engine, "optimized_blocks", df[keep])

    # 17. AUDIT LOG
    print("\n[17] audit_log")
    df = load("17_audit_log.csv")
    ensure_col(engine, "audit_log", "sha256_hash")
    keep = [c for c in ["log_id","event_type","entity_id","timestamp","user_id",
                         "details_json","sha256_hash"] if c in df.columns]
    upsert(engine, "audit_log", df[keep])

    # 18. DEPARTMENT FEEDS
    print("\n[18] department_feeds")
    df = load("18_department_feeds.csv")
    ensure_col(engine, "department_feeds", "details")
    keep = [c for c in ["feed_id","source_system","asset_id","raw_type","severity",
                         "reported_date","details"] if c in df.columns]
    upsert(engine, "department_feeds", df[keep])

    # 19. INSPECTIONS
    print("\n[19] inspections")
    df = load("19_inspections.csv")
    for c in ["inspection_type","findings","inspector_id"]:
        ensure_col(engine, "inspections", c)
    ensure_col(engine, "inspections", "condition_score", "REAL DEFAULT 0.0")
    keep = [c for c in ["inspection_id","asset_id","section_id","inspection_date",
                         "inspection_type","condition_score","findings","inspector_id"] if c in df.columns]
    upsert(engine, "inspections", df[keep])

    # 20. MAINTENANCE HISTORY
    print("\n[20] maintenance_history")
    df = load("20_maintenance_history.csv")
    ensure_col(engine, "maintenance_history", "outcome")
    ensure_col(engine, "maintenance_history", "actual_cost", "REAL DEFAULT 0.0")
    keep = [c for c in ["record_id","task_id","asset_id","completed_at",
                         "duration_minutes","actual_cost","outcome"] if c in df.columns]
    upsert(engine, "maintenance_history", df[keep])

    # 21. BLOCK TASKS
    print("\n[21] block_tasks")
    df = load("21_block_tasks.csv")
    keep = [c for c in ["block_id","task_id","role"] if c in df.columns]
    upsert(engine, "block_tasks", df[keep])

    # 22. ROUTE STATION POINTS (GIS)
    print("\n[22] route_station_points (GIS)")
    df = load("22_route_station_points.csv")
    create_if_missing(engine, "route_station_points",
        """route_point_id TEXT PRIMARY KEY, route_variant TEXT DEFAULT '',
           section_id TEXT DEFAULT '', corridor_id TEXT DEFAULT '',
           from_station_code TEXT DEFAULT '', to_station_code TEXT DEFAULT '',
           from_station_name TEXT DEFAULT '', to_station_name TEXT DEFAULT '',
           chainage_from_segment_km REAL DEFAULT 0.0, direction TEXT DEFAULT '',
           latitude REAL DEFAULT 0.0, longitude REAL DEFAULT 0.0,
           coordinate_quality TEXT DEFAULT '', source_basis TEXT DEFAULT ''""")
    keep = [c for c in ["route_point_id","route_variant","section_id","corridor_id",
                         "from_station_code","to_station_code","from_station_name","to_station_name",
                         "chainage_from_segment_km","direction","latitude","longitude",
                         "coordinate_quality","source_basis"] if c in df.columns]
    upsert(engine, "route_station_points", df[keep])

    # 23. ANOMALY SCENARIO INSTANCES
    print("\n[23] anomaly_scenario_instances")
    df = load("23_anomaly_scenario_instances.csv")
    create_if_missing(engine, "anomaly_scenario_instances",
        """scenario_instance_id TEXT PRIMARY KEY, anomaly_scenario TEXT DEFAULT '',
           department TEXT DEFAULT '', recommended_task_type TEXT DEFAULT '',
           recommended_action TEXT DEFAULT '', planning_handling TEXT DEFAULT ''""")
    keep = [c for c in ["scenario_instance_id","anomaly_scenario","department",
                         "recommended_task_type","recommended_action","planning_handling"] if c in df.columns]
    upsert(engine, "anomaly_scenario_instances", df[keep])

    # Rebuild scheduled_tasks from maintenance + ML
    print("\n[+] Rebuilding scheduled_tasks from maintenance_tasks + ml_predictions")
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM scheduled_tasks"))
        conn.execute(text("""
            INSERT INTO scheduled_tasks
                (task_id, asset_id, department, task_type, criticality, priority_score,
                 section_id, duration_minutes, start_minute, end_minute,
                 affects_line, combined_group_id)
            SELECT
                mt.task_id,
                mt.asset_id,
                mt.department,
                mt.task_type,
                mt.criticality,
                COALESCE(ml.priority_score, mt.priority_score, 50.0),
                mt.section_id,
                mt.duration_minutes,
                COALESCE(mt.start_minute, 0),
                COALESCE(mt.end_minute, mt.duration_minutes),
                COALESCE(mt.affects_line, 'BOTH'),
                COALESCE(mt.combined_group_id, '')
            FROM maintenance_tasks mt
            LEFT JOIN ml_predictions ml ON mt.task_id = ml.task_id
            LIMIT 15000
        """))
        n = conn.execute(text("SELECT COUNT(*) FROM scheduled_tasks")).scalar()
    print(f"  -> scheduled_tasks: {n:,} rows rebuilt")

    # VACUUM
    print("\n[+] VACUUM + checkpoint")
    import sqlite3
    raw = sqlite3.connect(os.path.join(BASE_DIR, 'block_planning.db'))
    raw.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    raw.execute("VACUUM")
    raw.close()
    size_mb = os.path.getsize(os.path.join(BASE_DIR, 'block_planning.db')) / 1024 / 1024
    print(f"  DB size after VACUUM: {size_mb:.1f} MB")

    print("\n" + "="*70)
    print("Seeding complete - all 23 datasets loaded into block_planning.db")
    print("="*70)


if __name__ == "__main__":
    seed(get_db_engine())
