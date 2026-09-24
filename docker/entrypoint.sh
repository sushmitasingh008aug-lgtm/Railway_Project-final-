#!/bin/sh
set -e

# Centralized entrypoint for portable runs (Windows ↔ Linux) — Go API + Postgres-only.
# Auto-creates schema + seeds if empty (idempotent), then execs the Go binary.
# pgdata is crash-safe (fsync WAL), no SQLite fallback.

echo "=== Block Planning Entrypoint (Go+Postgres) ==="
echo "DATABASE_URL=${DATABASE_URL:-unset}"
echo "POSTGRES_URI=${POSTGRES_URI:-unset}"
echo "PORT=${PORT:-3000} HORIZON_DAYS=${HORIZON_DAYS:-7} PYTHON_BIN=${PYTHON_BIN:-python3}"

# Wait for postgres DNS + readiness (compose healthcheck ensures, but also for docker run)
if [ -n "${DATABASE_URL}" ] || [ -n "${POSTGRES_URI}" ]; then
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if python3 -c "import sqlalchemy,os; e=sqlalchemy.create_engine(os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URI')); e.connect().close()" 2>/dev/null; then
      echo "✓ Postgres reachable"
      break
    fi
    echo "… waiting for postgres ($i/10)"
    sleep 2
  done
fi

# Ensure Postgres schema exists (idempotent) + migrate geometry column
echo "→ Ensuring DB schema…"
python3 -c "
import os, sqlalchemy
from sqlalchemy import text
url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URI') or 'postgresql://postgres:postgrespassword@postgres:5432/block_planning'
try:
    eng = sqlalchemy.create_engine(url, connect_args={'connect_timeout': 3})
    schema_path = None
    for p in ['/app/engine/schema.sql', 'engine/schema.sql']:
        if os.path.exists(p):
            schema_path = p
            break
    if not schema_path:
        print('⚠ schema.sql not found')
        raise SystemExit(0)
    ddl = open(schema_path).read()
    clean_ddl = '\n'.join(line for line in ddl.splitlines() if not line.strip().startswith('--'))
    with eng.connect() as conn:
        for stmt in clean_ddl.split(';'):
            s = stmt.strip()
            if s:
                s = s.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
                try:
                    with conn.begin():
                        conn.execute(text(s))
                except Exception as ex:
                    print(f'  (statement notice: {ex})')
        # Migrate: add geometry column if missing (for DB created before this patch)
        try:
            with conn.begin():
                conn.execute(text('ALTER TABLE sections ADD COLUMN IF NOT EXISTS geometry TEXT'))
        except Exception as e:
            print(f'  (migrate geometry column: {e})')
    print(f'✓ Schema ensured from {schema_path}')
except Exception as e:
    print(f'⚠ schema ensure failed: {e}')
    raise
" || { echo "✗ schema ensure failed — aborting"; exit 1; }

# Backfill geometry for existing DB (when sections already seeded but geometry is NULL)
echo "→ Checking section geometry…"
python3 -c "
import os, json, sqlalchemy
from sqlalchemy import text
url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URI') or 'postgresql://postgres:postgrespassword@postgres:5432/block_planning'
try:
    eng = sqlalchemy.create_engine(url, connect_args={'connect_timeout': 3})
    with eng.connect() as conn:
        try:
            cnt_null = conn.execute(text('SELECT COUNT(*) FROM sections WHERE geometry IS NULL OR geometry = \'\'''')).scalar()
        except Exception:
            cnt_null = 1
        if cnt_null and cnt_null > 0:
            print(f'  {cnt_null} sections missing geometry — backfilling from section_geography.json')
            # Load geography
            geo_path = None
            for p in ['/app/engine/section_geography.json', 'engine/section_geography.json']:
                if os.path.exists(p):
                    geo_path = p
                    break
            if not geo_path:
                print('  ⚠ section_geography.json not found, skipping backfill')
                raise SystemExit(0)
            geo = json.load(open(geo_path))
            # Build map section_id -> geometry JSON
            geom_map = {}
            for corr_id, prefix in [('CORR_BSB_LKO','SEC_BSB_LKO'),('CORR_HWH_DLI','SEC_HWH_DLI')]:
                for blk in geo.get(corr_id, []):
                    sid = f\"{prefix}_{blk['block_index']:02d}\"
                    geom = blk.get('geometry')
                    if geom:
                        geom_map[sid] = json.dumps(geom)
            for y in geo.get('CORR_DDU_YARD', []):
                sid = y.get('section_id_hint')
                geom = y.get('geometry')
                if sid and geom:
                    geom_map[sid] = json.dumps(geom)
            with eng.begin() as conn2:
                for sid, g in geom_map.items():
                    conn2.execute(text('UPDATE sections SET geometry = :g WHERE section_id = :sid AND (geometry IS NULL OR geometry = \'\')'), {'g': g, 'sid': sid})
            print(f'  ✓ Backfilled geometry for {len(geom_map)} sections')
        else:
            print('  ✓ Section geometry present')
except Exception as e:
    print(f'  ⚠ geometry backfill failed: {e}')
" || echo "  (geometry backfill continuing)"

# Seed DB if empty (check sections count) — pgdata ensures no loss on restart
if python3 -c "
import os, sqlalchemy
from sqlalchemy import text
url = os.getenv('DATABASE_URL') or os.getenv('POSTGRES_URI') or 'postgresql://postgres:postgrespassword@postgres:5432/block_planning'
try:
    eng = sqlalchemy.create_engine(url, connect_args={'connect_timeout': 3})
    with eng.connect() as c:
        cnt = c.execute(text('SELECT COUNT(*) FROM sections')).scalar()
        print(f'sections={cnt}')
        exit(0 if cnt and cnt>0 else 1)
except Exception as e:
    print(f'seed-check fallback: {e}')
    exit(1)
" 2>/dev/null; then
  echo "✓ DB already seeded (sections present) — skipping seed"
  # Schedule CSV is ephemeral (container overlay) but pgdata is durable — regenerate if missing
  if [ ! -f "/app/engine/optimized_schedule.csv" ] && [ ! -f "engine/optimized_schedule.csv" ]; then
    echo "↻ Schedule file missing (pgdata preserved, overlay lost) — regenerating optimizer"
    python3 engine/optimizer_core.py --horizon-days "${HORIZON_DAYS:-7}" --max-solver-time 30 || echo "⚠ optimizer regenerate failed"
  fi
else
  echo "↻ DB empty — seeding (transform → priority → optimizer)"
  # Master diversified 12k dataset seeder (loads all 25 canonical CSVs)
  python3 engine/seed_diversified_12k.py || { echo "✗ seed_diversified_12k failed"; exit 1; }
  python3 engine/ingest_feeds.py || true
  python3 engine/priority_engine.py || { echo "✗ priority_engine failed"; exit 1; }
  python3 engine/optimizer_core.py --horizon-days "${HORIZON_DAYS:-7}" --max-solver-time 30 || { echo "⚠ optimizer failed (schedule may be missing but DB remains)"; }
  echo "✓ Seed pipeline finished"
fi

# Handle Go vs Python CMD — entrypoint always execs "$@"
# When running block_planner, launch Python backend on 127.0.0.1:8765 in background
# to handle CP-SAT solver, task generation, TreeSHAP explainability, and ML requests.
if [ "$1" = "./block_planner" ] || [ "$1" = "block_planner" ]; then
  echo "→ Starting Python ML & Solver engine on http://127.0.0.1:8765..."
  PORT=8765 python3 backend/server.py &
  PYTHON_PID=$!
  echo "✓ Python solver engine running (PID $PYTHON_PID)"

  cleanup() {
    echo "Shutting down services..."
    if [ -n "$PYTHON_PID" ]; then
      kill "$PYTHON_PID" 2>/dev/null || true
    fi
  }
  trap cleanup EXIT TERM INT
fi

echo "→ Starting: $@"
exec "$@"
