#!/usr/bin/env bash
# Aplica db/schema.sql a la base de Neon. Idempotente: todo el esquema usa
# CREATE ... IF NOT EXISTS, así que se puede correr las veces que haga falta.
#
#   npm run db:push
#
# Lee DATABASE_URL de .env.local (el mismo valor que usa lib/db.ts en runtime).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "falta mcp-landing/.env.local (copiar de .env.example)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env.local
set +a

: "${DATABASE_URL:?falta DATABASE_URL en .env.local}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/schema.sql
