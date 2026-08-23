import os
import sqlalchemy
from sqlalchemy import text

def get_db_engine():
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/block_planning")
    try:
        engine = sqlalchemy.create_engine(db_url, connect_args={"connect_timeout": 2})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"Connected to PostgreSQL: {db_url}")
        return engine
    except Exception as e:
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "block_planning.db")
        sqlite_engine = sqlalchemy.create_engine(f"sqlite:///{db_path}")
        init_sqlite_tables(sqlite_engine)
        return sqlite_engine

def init_sqlite_tables(engine):
    ddl = """
    CREATE TABLE IF NOT EXISTS sections (
        section_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100),
        corridor_id VARCHAR(50),
        length_km DECIMAL(8,2)
    );

    CREATE TABLE IF NOT EXISTS assets (
        asset_id VARCHAR(50) PRIMARY KEY,
        section_id VARCHAR(50) REFERENCES sections(section_id),
        department VARCHAR(50),
        asset_type VARCHAR(100),
        location_lat DECIMAL(9,6),
        location_lon DECIMAL(9,6)
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
        task_id VARCHAR(50) PRIMARY KEY,
        asset_id VARCHAR(50) REFERENCES assets(asset_id),
        task_type VARCHAR(100),
        criticality VARCHAR(20),
        due_date DATE,
        duration_minutes INT,
        priority_score FLOAT,
        status VARCHAR(20) DEFAULT 'Pending',
        source_system VARCHAR(10)
    );

    CREATE TABLE IF NOT EXISTS department_feeds (
        feed_id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_system VARCHAR(10),
        asset_id VARCHAR(50),
        raw_type VARCHAR(100),
        severity VARCHAR(20),
        reported_date DATE,
        ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS train_movements (
        movement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        train_id VARCHAR(50),
        section_id VARCHAR(50) REFERENCES sections(section_id),
        train_type VARCHAR(20),
        entry_time TIMESTAMP,
        exit_time TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
        resource_id VARCHAR(50) PRIMARY KEY,
        resource_type VARCHAR(50),
        department VARCHAR(50),
        capacity INT
    );
    """
    with engine.begin() as conn:
        for stmt in ddl.split(";"):
            stmt = stmt.strip()
            if stmt:
                conn.execute(text(stmt))
