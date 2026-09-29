const path = require('path');
const { execFileSync } = require('child_process');
const { Client } = require('../backend/node_modules/pg');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error('DATABASE_URL is required (backend/.env is supported).');

const testDatabase = `tak_crm_migration_test_${Date.now()}`;
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = '/postgres';
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${testDatabase}`;

const expectedTables = [
  'User', 'Customer', 'CustomerHistory', 'CustomerImport', 'Sale',
  'SalesReportImport', 'Invoice', 'Payment', 'Quotation', 'QuotationItem',
  'FollowUp', 'SalesCommission', 'migrations',
];

async function main() {
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${testDatabase}"`);
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
      const tables = await testClient.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
      );
      const names = new Set(tables.rows.map(row => row.table_name));
      const missing = expectedTables.filter(table => !names.has(table));
      if (missing.length) throw new Error(`Missing tables: ${missing.join(', ')}`);

      const foreignKeys = await testClient.query(
        `SELECT count(*)::int AS count FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace`,
      );
      if (foreignKeys.rows[0].count < 10) {
        throw new Error(`Expected relational constraints; found ${foreignKeys.rows[0].count}.`);
      }
      console.log(`Migration validation passed: ${expectedTables.length} tables, ${foreignKeys.rows[0].count} foreign keys.`);
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
  console.error(error);
  process.exit(1);
});
