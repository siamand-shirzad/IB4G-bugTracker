#!/usr/bin/env bash
# Backs up the SQLite database inside the docker volume to a dated file,
# using an ephemeral alpine container (sqlite3 CLI) so no host install is needed.
#
# Usage (from the repo root, while the stack runs or is stopped):
#   bash scripts/backup-db.sh [volume-name] [output-dir]
#
# Defaults: volume "ib4g-bugtracker_app-data" (compose project name may differ —
# check with `docker volume ls`), output to ./backups.

set -euo pipefail

VOLUME="${1:-ib4g-bugtracker_app-data}"
OUT_DIR="${2:-./backups}"
DATE="$(date +%F)"

mkdir -p "$OUT_DIR"

docker run --rm \
  -v "${VOLUME}:/data" \
  -v "$(cd "$OUT_DIR" && pwd)/:/out" \
  alpine:latest \
  sh -c "sqlite3 /data/custom.db \".backup /out/custom-backup-${DATE}.db\""

echo "Backup written to ${OUT_DIR}/custom-backup-${DATE}.db"
