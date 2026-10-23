#!/usr/bin/env bash
# Sobe um PostgreSQL temporário, aplica o shim do Supabase e as migrações e roda os testes de banco.
set -euo pipefail
cd "$(dirname "$0")/.."
PGBIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d)
PORT=${PGPORT_TESTE:-54329}
cleanup() { $RUNAS "$PGBIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
RUNAS=""
if [ "$(id -u)" = "0" ]; then chown -R postgres "$DIR" 2>/dev/null; RUNAS="runuser -u postgres --"; fi
$RUNAS "$PGBIN/initdb" -D "$DIR/data" -U postgres -A trust -E UTF8 --locale=C.UTF-8 >/dev/null
$RUNAS "$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c timezone=UTC" -l "$DIR/log" start -w >/dev/null
export DATABASE_URL="postgresql://postgres@localhost:$PORT/postgres"
psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f tests/db/supabase_shim.sql >/dev/null
for f in supabase/migrations/*.sql; do
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null 2>"$DIR/err" || { echo "Falha na migração $f"; cat "$DIR/err"; exit 1; }
done
echo "Migrações aplicadas."
npx vitest run --config vitest.db.config.ts "$@"
