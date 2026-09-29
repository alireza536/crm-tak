#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/tak-crm-backup.dump" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"
BACKUP_FILE="$1"

if [[ ! -f "$ENV_FILE" || ! -f "$BACKUP_FILE" ]]; then
  echo "Environment file or backup file does not exist." >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

read -r -p "Restore will overwrite objects in '$POSTGRES_DB'. Type RESTORE to continue: " CONFIRM
[[ "$CONFIRM" == "RESTORE" ]] || { echo "Restore cancelled."; exit 1; }

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" stop backend
trap 'docker compose --env-file "$ENV_FILE" start backend >/dev/null 2>&1 || true' EXIT
docker compose --env-file "$ENV_FILE" exec -T db \
  pg_restore --clean --if-exists --no-owner --no-privileges --exit-on-error \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" < "$BACKUP_FILE"
docker compose --env-file "$ENV_FILE" start backend
trap - EXIT
echo "Restore completed from: $BACKUP_FILE"
