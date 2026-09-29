#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE. Copy .env.production.example and set production secrets." >&2
  exit 1
fi

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" config --quiet

if docker compose --env-file "$ENV_FILE" exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
  echo "Existing database detected; creating a pre-deployment backup..."
  ENV_FILE="$ENV_FILE" bash "$ROOT_DIR/deploy/backup.sh"
fi

docker compose --env-file "$ENV_FILE" build --pull
docker compose --env-file "$ENV_FILE" up -d --remove-orphans --wait --wait-timeout 180
docker compose --env-file "$ENV_FILE" ps

echo "Deployment completed and all services are healthy."
