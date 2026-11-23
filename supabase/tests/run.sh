#!/usr/bin/env bash
# يشغّل Postgres مؤقتاً، ويطبّق الـ migrations و seed.sql، ثم اختبارات RLS.
# الاستخدام: npm run db:test   (يحتاج PostgreSQL 15+ مثبتاً محلياً)
set -euo pipefail
cd "$(dirname "$0")/../.."
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DIR="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
trap '"$PGBIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
RUN=""
if [ "$(id -u)" = "0" ]; then chown -R postgres "$DIR"; RUN="runuser -u postgres --"; fi
$RUN "$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
$RUN "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" start >/dev/null
PSQL="$RUN psql -X -q -v ON_ERROR_STOP=1 -h $DIR -p $PORT -U postgres -d postgres"
$PSQL -c "create extension if not exists pgcrypto" 
$PSQL -f supabase/tests/supabase_stub.sql
for f in supabase/migrations/*.sql; do echo "→ $f"; $PSQL -f "$f"; done
echo "→ supabase/seed.sql"; $PSQL -f supabase/seed.sql
echo "→ supabase/tests/rls.test.sql"; $PSQL -f supabase/tests/rls.test.sql
echo "✓ all database tests passed"
