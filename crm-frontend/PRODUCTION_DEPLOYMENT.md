# TAK CRM production deployment

Replace `yourdomain.ir` with the real domain before deployment. Never commit production `.env` files.

## Recommended topology

- Frontend: `https://yourdomain.ir` (static Vite `dist/`)
- Backend: `https://api.yourdomain.ir` (Node.js/NestJS)
- PostgreSQL: private network only; PostgreSQL must not be publicly reachable
- TLS: valid certificates for both hostnames, automatic renewal enabled

Minimum for a small team: 2 vCPU, 4 GB RAM and 40 GB SSD for the application, plus managed PostgreSQL with 2 GB RAM and automated backups. For large Excel imports use 4 vCPU/8 GB RAM and monitor memory.

## Docker deployment

The repository includes multi-stage frontend/backend Dockerfiles, an internal-network Compose stack, Nginx reverse proxy, and deployment/backup/restore scripts. Start with:

```bash
cp .env.production.example .env.production
# Replace domain, database password and JWT secret.
chmod +x deploy/*.sh
bash deploy/deploy.sh
```

See `deploy/README.md` for TLS activation and operational commands. Use a long URL-safe PostgreSQL password because the Compose stack embeds it in `DATABASE_URL`.

## DNS and TLS

1. Add an `A`/`AAAA` record for `yourdomain.ir` and `www`, pointing to the frontend host.
2. Add an `A` or `CNAME` record for `api.yourdomain.ir`, pointing to the backend host.
3. Issue certificates with the hosting provider or Let's Encrypt.
4. Redirect HTTP to HTTPS and redirect `www` to the chosen canonical hostname.
5. Configure the frontend host to serve `index.html` for unknown paths (SPA fallback).

## Backend

```bash
cd backend
npm ci
npm run build
npm run migration:run
npm run start:prod
```

Required environment variables are documented in `backend/.env.example`. Use a 64+ character random JWT secret and keep `TYPEORM_SYNCHRONIZE=false` in production. Test users are never bootstrapped by the production application.

Campaign SMS uses the Melipayamak REST API. Set `SMS_USERNAME`, `SMS_PASSWORD` and the approved sender line in `SMS_FROM` as backend-only deployment secrets; never add these values to the frontend environment. Campaign delivery is disabled until all three values exist. Record customer consent from the customer profile before targeting them. Campaign status `SENT` means the provider accepted the requests; it does not confirm handset delivery.

For a remote PostgreSQL service set `DATABASE_SSL=true`, keep certificate verification enabled where the provider supplies a trusted certificate, and tune `DB_POOL_MAX` to the database connection limit. Keep `TYPEORM_MIGRATIONS_RUN=true` when the application is responsible for migrations; set it to `false` when migrations run as a separate release job.

The service must expose port `$PORT`. Configure a health check against `GET /health`.

## Frontend

Create a production environment file in the deployment platform:

```env
VITE_API_URL=https://api.yourdomain.ir
```

Then build and publish `dist/`:

```bash
npm ci
npm run build
```

If the backend is reverse-proxied under `https://yourdomain.ir/api`, omit `VITE_API_URL`; the production fallback is `/api`.

## PostgreSQL migrations and verification

Run migrations once before switching traffic. Verify:

```sql
SELECT * FROM "migrations" ORDER BY "timestamp" DESC;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype='f';
```

Do not enable TypeORM synchronize in production.

## Backup and restore

- Managed PostgreSQL: enable daily snapshots with at least 30 days retention and point-in-time recovery where available.
- Create an encrypted off-provider weekly backup.
- Test restore into a staging database every month.

Manual backup example:

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" --file=tak-crm-$(date +%F).dump
```

Restore only into an empty/staging database first:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" tak-crm-YYYY-MM-DD.dump
```

## Release checklist

- Database backup completed and restore tested
- Migrations completed successfully
- `/health` returns HTTP 200
- ADMIN and SALES login tested
- SALES cannot access another salesperson's customers, invoices, payments or follow-ups
- Import rejects unsupported files and oversized uploads
- Browser network requests use HTTPS only
- CORS only contains approved production domains
- Default/test accounts are removed or passwords rotated
- Logs and database metrics have alerts for errors, CPU, memory, storage and connection saturation

## Remaining operational risks

- Excel parsing runs inside the API process; exceptionally large files can consume substantial memory. A background queue/object storage workflow is recommended as volume grows.
- The current `xlsx` package has published high-severity advisories with no upstream npm fix. Upload endpoints are ADMIN-only, extension/MIME checked and size-limited, but replacing the parser remains recommended.
- No distributed API rate limiter is currently configured. Add a reverse-proxy/WAF rate limit, especially for `/auth/login` and upload endpoints.
- JWT revocation is not implemented; short token expiry and password rotation reduce exposure, but refresh-token/session revocation is recommended.

## Security notice

An SMS provider credential previously existed in source code. It has been removed and the dormant SMS implementation is excluded from the production image. Treat the old credential as compromised and rotate/revoke it at the provider before deployment.
- The frontend bundle remains above Vite's 500 kB warning threshold; route-level code splitting is recommended but does not block deployment.
