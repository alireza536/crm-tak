# TAK CRM production deployment

## 1. DNS and server requirements

Create these DNS records before enabling TLS:

- `A  @    -> VPS_PUBLIC_IP`
- `A  www  -> VPS_PUBLIC_IP`

Recommended minimum server: Ubuntu 24.04 LTS, 2 vCPU, 4 GB RAM, 40 GB SSD. Open inbound TCP ports 22, 80 and 443 only. PostgreSQL, NestJS and the frontend container are not published on host ports.

## 2. Install Docker on Ubuntu

```bash
sudo apt update
sudo apt install -y ca-certificates curl git openssl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and back in, then verify:

```bash
docker version
docker compose version
```

## 3. Install the application

```bash
sudo mkdir -p /opt/tak-crm
sudo chown "$USER":"$USER" /opt/tak-crm
git clone <REPOSITORY_URL> /opt/tak-crm
cd /opt/tak-crm
cp .env.production.example .env.production
```

Generate URL-safe secrets and edit the environment:

```bash
openssl rand -hex 32   # POSTGRES_PASSWORD
openssl rand -hex 64   # JWT_SECRET
nano .env.production
chmod 600 .env.production
```

Set at least `DOMAIN`, `WWW_DOMAIN`, `LETSENCRYPT_EMAIL`, `POSTGRES_PASSWORD` and `JWT_SECRET`. Do not commit `.env.production`.

## 4. Validate and deploy

```bash
cd /opt/tak-crm
chmod +x deploy/*.sh backend/docker-entrypoint.sh deploy/nginx/docker-entrypoint.sh
docker compose --env-file .env.production config --quiet
bash deploy/deploy.sh
docker compose --env-file .env.production ps
curl -fsS -H "Host: yourdomain.ir" http://127.0.0.1/api/health
```

The backend entrypoint waits for PostgreSQL and executes pending TypeORM migrations before starting NestJS. On subsequent deployments, `deploy.sh` creates a database backup before rebuilding when the existing database is healthy.

## 5. Create the first administrator

Create it once. The password is read without echo and is not stored in `.env.production`:

```bash
cd /opt/tak-crm
read -rsp "Initial admin password (12+ characters): " INITIAL_ADMIN_PASSWORD
echo
export INITIAL_ADMIN_PASSWORD

docker compose --env-file .env.production exec \
  -e INITIAL_ADMIN_NAME='System Administrator' \
  -e INITIAL_ADMIN_PHONE='09xxxxxxxxx' \
  -e INITIAL_ADMIN_PERSON_CODE='ADMIN001' \
  -e INITIAL_ADMIN_PASSWORD \
  backend npm run admin:create

unset INITIAL_ADMIN_PASSWORD
```

Verify login through `/api/auth/login` using the configured phone and password.

## 6. Enable HTTPS

After both DNS records resolve to the VPS:

```bash
cd /opt/tak-crm
bash deploy/enable-https.sh
curl -fsS https://yourdomain.ir/api/health
curl -fsSI https://yourdomain.ir/
```

Schedule certificate renewal as root (`sudo crontab -e`):

```cron
17 3 * * * cd /opt/tak-crm && docker compose --env-file .env.production --profile tls run --rm certbot renew --webroot -w /var/www/certbot && docker compose --env-file .env.production exec nginx nginx -s reload
```

## 7. Backups and updates

Create and test a backup:

```bash
cd /opt/tak-crm
bash deploy/backup.sh
bash deploy/restore.sh /absolute/path/to/tak-crm-YYYYMMDDTHHMMSSZ.dump
```

Keep encrypted off-server copies. Suggested daily backup cron:

```cron
0 2 * * * cd /opt/tak-crm && ENV_FILE=/opt/tak-crm/.env.production bash deploy/backup.sh
```

Deploy an update:

```bash
cd /opt/tak-crm
git pull --ff-only
bash deploy/deploy.sh
```

## 8. Verification and diagnostics

```bash
docker compose --env-file .env.production config --quiet
docker compose --env-file .env.production ps
docker compose --env-file .env.production logs --tail=200 backend nginx db frontend
docker compose --env-file .env.production exec backend \
  node ./node_modules/typeorm/cli.js migration:show -d dist/data-source.js
curl -fsS https://yourdomain.ir/api/health
```

For an isolated integration check on a trusted staging database, set `DATABASE_URL` in `backend/.env`, build the application and run:

```bash
npm run verify:production
```

This creates a temporary database, runs migrations, creates a temporary administrator, verifies authentication and protected APIs, and removes the temporary database afterward.
