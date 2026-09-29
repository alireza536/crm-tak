#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a
: "${DOMAIN:?DOMAIN is required}"
: "${WWW_DOMAIN:?WWW_DOMAIN is required}"
: "${LETSENCRYPT_EMAIL:?LETSENCRYPT_EMAIL is required}"

cd "$ROOT_DIR"
docker compose --env-file "$ENV_FILE" up -d nginx
docker compose --env-file "$ENV_FILE" --profile tls run --rm certbot \
  certonly --webroot --webroot-path /var/www/certbot \
  --non-interactive --agree-tos --no-eff-email \
  --email "$LETSENCRYPT_EMAIL" -d "$DOMAIN" -d "$WWW_DOMAIN"
docker compose --env-file "$ENV_FILE" up -d --force-recreate nginx

echo "HTTPS enabled for $DOMAIN and $WWW_DOMAIN"
