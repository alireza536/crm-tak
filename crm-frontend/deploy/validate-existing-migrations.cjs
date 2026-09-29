const path = require('path');
const { execFileSync } = require('child_process');
const { Client } = require('../backend/node_modules/pg');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error('DATABASE_URL is required.');

const parsedSource = new URL(sourceUrl);
const sourceDatabase = decodeURIComponent(parsedSource.pathname.slice(1));
if (!/^[A-Za-z0-9_-]+$/.test(sourceDatabase)) throw new Error('Unsafe source database identifier.');

const testDatabase = `tak_crm_compat_test_${Date.now()}`;
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = '/postgres';
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${testDatabase}`;

async function main() {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${testDatabase}" WITH TEMPLATE "${sourceDatabase}"`);
    execFileSync(
      process.execPath,
      ['./node_modules/typeorm/cli.js', 'migration:run', '-d', 'dist/data-source.js'],
      {
        cwd: path.join(__dirname, '../backend'),
        env: { ...process.env, DATABASE_URL: testUrl.toString(), DATABASE_SSL: 'false' },
        stdio: 'inherit',
      },
    );

    const testClient = new Client({ connectionString: testUrl.toString() });
    await testClient.connect();
    try {
      const pending = await testClient.query(`SELECT count(*)::int AS count FROM "migrations"`);
      if (pending.rows[0].count < 10) throw new Error('Not all production migrations were recorded.');
      await testClient.query('SELECT count(*) FROM "User"');
      await testClient.query('SELECT count(*) FROM "Customer"');
      await testClient.query('SELECT count(*) FROM "Invoice"');
      console.log('Existing database compatibility validation passed on an isolated clone.');
    } finally {
      await testClient.end();
    }
  } finally {
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=$1 AND pid <> pg_backend_pid()`,
      [testDatabase],
    );
    await admin.query(`DROP DATABASE IF EXISTS "${testDatabase}"`);
    await admin.end();
  }
}

main().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
