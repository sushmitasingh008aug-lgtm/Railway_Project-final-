import os
import sqlalchemy
from sqlalchemy import text

def _resolve_db_url() -> str:
    # Postgres-only: DATABASE_URL required, POSTGRES_URI alias, no SQLite fallback
    for key in ("DATABASE_URL", "POSTGRES_URI"):
        v = os.getenv(key)
        if v and v.strip():
            return v.strip()
    # Fallback only for local dev without compose: try localhost then postgres service
    # Prefer postgres service DNS when running inside Docker
    return "postgresql://postgres:postgrespassword@postgres:5432/block_planning"


def get_db_engine():
    db_url = _resolve_db_url()
    if not db_url.startswith("postgresql://") and not db_url.startswith("postgres://"):
        raise RuntimeError(f"DATABASE_URL must be a postgresql URL, got: {db_url!r}")

    # Fail-fast: never silently fallback to SQLite — postgres-only per architecture
    try:
        engine = sqlalchemy.create_engine(db_url, connect_args={"connect_timeout": 3}, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"Connected to PostgreSQL: {db_url}")
        return engine
    except Exception as e:
        # Do not fallback — surface the error so entrypoint/orchestrator can retry or fail
        print(f"PostgreSQL connection failed: {e}")
        print(f"DATABASE_URL={db_url}")
        raise RuntimeError(f"Postgres connection failed (no SQLite fallback): {e}") from e
