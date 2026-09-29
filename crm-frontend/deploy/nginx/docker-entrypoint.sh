#!/bin/sh
set -eu

HTTP_TEMPLATE=/opt/tak-nginx/templates/default.conf.template
HTTPS_TEMPLATE=/opt/tak-nginx/templates/https.conf.template.example
CERTIFICATE=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
PRIVATE_KEY=/etc/letsencrypt/live/${DOMAIN}/privkey.pem

if [ -s "$CERTIFICATE" ] && [ -s "$PRIVATE_KEY" ]; then
  TEMPLATE="$HTTPS_TEMPLATE"
  echo "TLS certificate found; enabling HTTPS."
else
  TEMPLATE="$HTTP_TEMPLATE"
  echo "TLS certificate not found; starting HTTP for ACME validation."
fi

envsubst '${DOMAIN} ${WWW_DOMAIN} ${NGINX_CLIENT_MAX_BODY_SIZE}' < "$TEMPLATE" > /etc/nginx/conf.d/default.conf
nginx -t
exec nginx -g 'daemon off;'
