#!/bin/sh
set -eu

if [ "${WAIT_FOR_DATABASE:-true}" = "true" ]; then
  echo "Waiting for PostgreSQL..."
  node - <<'NODE'
const { Client } = require('pg');
const deadline = Date.now() + Number(process.env.DB_WAIT_TIMEOUT_MS || 60000);
(async function waitForDatabase() {
  while (Date.now() < deadline) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined,
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      process.exit(0);
    } catch (error) {
      await client.end().catch(() => undefined);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  console.error('PostgreSQL did not become ready before the timeout.');
  process.exit(1);
})();
NODE
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running TypeORM migrations..."
  node ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js
fi

exec "$@"
