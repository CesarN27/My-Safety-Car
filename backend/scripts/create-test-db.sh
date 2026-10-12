#!/bin/sh
# Crea la base tecnocar_test dentro del contenedor de Postgres si todavía no existe.
set -e
docker compose exec -T db sh -c '
  psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname = '"'"'tecnocar_test'"'"'" | grep -q 1 \
    || psql -U "$POSTGRES_USER" -c "CREATE DATABASE tecnocar_test"
'
