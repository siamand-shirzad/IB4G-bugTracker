#!/bin/sh
# Applies pending database migrations, then hands off to the CMD (next server).
# `prisma migrate deploy` is idempotent and a fast no-op when the schema is current.
set -e

echo "[entrypoint] applying database migrations..."
bunx prisma migrate deploy

exec "$@"
