import os
import sys
import sqlalchemy
from sqlalchemy import text

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, 'block_planning.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

def _resolve_db_url() -> str:
    # If DATABASE_URL or POSTGRES_URI is explicitly set in env, use it
    for key in ("DATABASE_URL", "POSTGRES_URI"):
        v = os.getenv(key)
        if v and v.strip():
            return v.strip()
    # Default to SQLite for seamless local execution
    return f"sqlite:///{SQLITE_PATH}"

def ensure_schema(engine):
    """Executes schema.sql to ensure all required tables exist."""
    if not os.path.exists(SCHEMA_PATH):
        return
    try:
        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        with engine.begin() as conn:
            for statement in statements:
                conn.execute(text(statement))
    except Exception as e:
        print(f"Warning: error ensuring schema: {str(e)[:100]}")

def get_db_engine():
    db_url = _resolve_db_url()
    
    # If explicitly pointing to PostgreSQL
    if db_url.startswith("postgresql://") or db_url.startswith("postgres://"):
        try:
            engine = sqlalchemy.create_engine(
                db_url,
                connect_args={"connect_timeout": 3},
                pool_pre_ping=True
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Connected to PostgreSQL database.")
            ensure_schema(engine)
            return engine
        except Exception as e:
            print("PostgreSQL connection failed. Falling back to local SQLite database.")
    
    # SQLite fallback / default
    sqlite_url = f"sqlite:///{SQLITE_PATH}"
    engine = sqlalchemy.create_engine(sqlite_url, connect_args={"check_same_thread": False})
    print("Connected to SQLite database.")
    ensure_schema(engine)
    return engine
