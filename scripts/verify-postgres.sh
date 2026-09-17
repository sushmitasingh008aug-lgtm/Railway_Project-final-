#!/bin/sh
# verify-postgres.sh — dual-backend parity gate (Phase A3 guardrail).
# Spins a throwaway Postgres 16, runs the FULL chain against it, then drops it.
# Rule: no backend change is done until this passes AND the SQLite chain passes.
# Usage: sh scripts/verify-postgres.sh   (needs docker + the project .venv)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV_PY="/home/deadass/Desktop/sih/rl_data/.venv/bin/python"
PG_NAME="pg-verify-gate"
PG_PORT="${PG_PORT:-5545}"
export DATABASE_URL="postgresql://postgres:postgrespassword@127.0.0.1:${PG_PORT}/block_planning?sslmode=disable"

echo "=== 1/6 starting Postgres 16 (db: block_planning, port ${PG_PORT}) ==="
docker rm -f "${PG_NAME}" >/dev/null 2>&1 || true
docker run -d --name "${PG_NAME}" -e POSTGRES_DB=block_planning \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgrespassword \
  -p "${PG_PORT}:5432" postgres:16-alpine >/dev/null
for i in $(seq 1 30); do
  if "${VENV_PY}" -c "import sqlalchemy; sqlalchemy.create_engine('${DATABASE_URL}', connect_args={'connect_timeout': 2}).connect().close()" 2>/dev/null; then
    echo "✓ Postgres reachable"; break
  fi
  sleep 2
done

echo "=== 2/6 schema ensure (fails loudly on SQLite-only DDL) ==="
cd "${ROOT}/engine"
"${VENV_PY}" -c "
import sys; sys.path.insert(0,'.')
from db_helper import get_db_engine
e = get_db_engine()
tbls = e.connect().exec_driver_sql(\"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'\").first()[0]
views = e.connect().exec_driver_sql(\"SELECT COUNT(*) FROM information_schema.views WHERE table_schema='public'\").first()[0]
assert tbls >= 24, f'expected >=24 tables, got {tbls}'
assert views >= 7, f'expected >=7 views, got {views}'
print(f'✓ schema: {tbls} tables, {views} views')
"

echo "=== 3/6 seed 12K ==="
"${VENV_PY}" seed_diversified_12k.py 2>&1 | tail -n 1

echo "=== 4/6 priority (B1 overdue wiring live?) ==="
"${VENV_PY}" -c "
import sys; sys.path.insert(0,'.')
from priority_engine import calculate_priorities
from datetime import datetime
df = calculate_priorities(plan_time=datetime(2026,8,23))
assert int(df['priority_score'].isna().sum()) == 0, 'NULL priorities!'
assert int((df['days_overdue'] > 0).sum()) > 0, 'days_overdue dead!'
print(f\"✓ priority: {len(df)} rows, 0 nulls, overdue flowing\")
" 2>&1 | tail -n 1

echo "=== 5/6 optimizer + manifest + test_suite ==="
"${VENV_PY}" optimizer_core.py --horizon-days 7 2>&1 | tail -n 1
"${VENV_PY}" test_suite.py 2>&1 | grep -E "VERIFICATION COMPLETE"
rm -f optimized_schedule.VER-*.csv .schedule_*.tmp
git checkout -- optimized_schedule.csv 2>/dev/null || true

echo "=== 6/6 API smoke (submit pipeline + impact horizon) ==="
cd "${ROOT}"
"${VENV_PY}" -c "
import sys; sys.path.insert(0,'backend'); sys.path.insert(0,'engine')
import warnings; warnings.filterwarnings('ignore')
import server
c = server.app.test_client()
sec = c.get('/api/sections').get_json()['data'][0]['section_id']
r = c.post('/api/tasks/submit', json={'department':'Engineering','target_section':sec,'task_type':'Broken Rail Weld','criticality':'High','duration_minutes':90,'due_date':'2026-08-20'}).get_json()
i30 = c.get('/api/impact?horizon_days=30').get_json()
assert r['priority_band'] == 'Critical' and r['computed_priority_score'] >= 92.5, r
assert i30['horizon_days'] == 30, i30.get('horizon_days')
print(f\"✓ submit {r['task_id']} Critical + impact30 trains={i30['train_movements_analyzed']}\")
" 2>&1 | tail -n 1

echo "=== gate PASS — dropping throwaway Postgres ==="
docker rm -f "${PG_NAME}" >/dev/null
echo "DONE: backend change is Postgres-clean. Now run the same chain on SQLite before commit."
