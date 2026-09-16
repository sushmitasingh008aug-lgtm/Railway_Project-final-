import os
import sys
import sqlalchemy
from sqlalchemy import text, event

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_PATH = os.path.join(BASE_DIR, 'block_planning.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

_CACHED_ENGINE = None
_SCHEMA_ENSURED = False

def _resolve_db_url() -> str:
    for key in ("DATABASE_URL", "POSTGRES_URI"):
        v = os.getenv(key)
        if v and v.strip():
            return v.strip()
    return f"sqlite:///{SQLITE_PATH}"

def ensure_schema(engine):
    """Executes schema.sql once to ensure all required tables exist."""
    global _SCHEMA_ENSURED
    if _SCHEMA_ENSURED or not os.path.exists(SCHEMA_PATH):
        return
    try:
        # Quick check if tables already exist to avoid locking
        with engine.connect() as conn:
            check = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='assets'")).first()
            if check:
                _SCHEMA_ENSURED = True
                return

        with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        is_pg = getattr(engine, 'dialect', None) and engine.dialect.name == 'postgresql'
        with engine.connect() as conn:
            for statement in statements:
                if not statement:
                    continue
                if is_pg and 'VIEW IF NOT EXISTS' in statement.upper():
                    statement = statement.replace('CREATE VIEW IF NOT EXISTS', 'CREATE OR REPLACE VIEW').replace('create view if not exists', 'CREATE OR REPLACE VIEW')
                try:
                    with conn.begin():
                        conn.execute(text(statement))
                except Exception:
                    pass
        _SCHEMA_ENSURED = True
    except Exception as e:
        print(f"Warning: error ensuring schema: {str(e)[:100]}")

def get_db_engine():
    global _CACHED_ENGINE
    if _CACHED_ENGINE is not None:
        return _CACHED_ENGINE

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
            _CACHED_ENGINE = engine
            return engine
        except Exception as e:
            print("PostgreSQL connection failed. Falling back to local SQLite database.")
    
    # SQLite with WAL mode, 60s busy timeout, and memory cache
    sqlite_url = f"sqlite:///{SQLITE_PATH}"
    engine = sqlalchemy.create_engine(
        sqlite_url,
        connect_args={
            "check_same_thread": False,
            "timeout": 60
        },
        pool_size=20,
        max_overflow=30
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=60000")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")
        cursor.close()

    print("Connected to SQLite database (WAL mode enabled, 60s busy timeout).")
    ensure_schema(engine)
    _CACHED_ENGINE = engine
    return engine
