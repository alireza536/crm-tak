#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a
mkdir -p "$BACKUP_DIR"
umask 077

BACKUP_FILE="$BACKUP_DIR/tak-crm-$(date -u +%Y%m%dT%H%M%SZ).dump"
TEMP_FILE="$BACKUP_FILE.partial"
trap 'rm -f "$TEMP_FILE"' EXIT
cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" exec -T db \
  pg_dump --format=custom --no-owner --no-acl --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" > "$TEMP_FILE"
mv "$TEMP_FILE" "$BACKUP_FILE"
trap - EXIT

find "$BACKUP_DIR" -type f -name 'tak-crm-*.dump' -mtime "+$RETENTION_DAYS" -delete
echo "Backup created: $BACKUP_FILE"
