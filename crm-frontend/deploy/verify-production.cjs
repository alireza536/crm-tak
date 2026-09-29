const { spawn, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'backend');
require(path.join(backend, 'node_modules', 'dotenv')).config({ path: path.join(backend, '.env') });
const { Client } = require(path.join(backend, 'node_modules', 'pg'));

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error('DATABASE_URL is required (backend/.env or process environment).');

const suffix = `${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
const databaseName = `tak_crm_verify_${suffix}`;
const source = new URL(sourceUrl);
const adminUrl = new URL(sourceUrl);
adminUrl.pathname = '/postgres';
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${databaseName}`;
const port = String(3200 + Math.floor(Math.random() * 500));
const password = `Verify-${crypto.randomBytes(18).toString('base64url')}`;
const jwtSecret = crypto.randomBytes(64).toString('hex');
let server;
let serverErrors = '';

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: backend,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout || ''}\n${result.stderr || ''}`);
  }
  return result.stdout.trim();
}

async function request(url, options = {}, expected = 200) {
  const response = await fetch(url, options);
  const text = await response.text();
  if (response.status !== expected) {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error(`${options.method || 'GET'} ${url} returned ${response.status}, expected ${expected}: ${text}${serverErrors ? `\nBackend logs:\n${serverErrors}` : ''}`);
  }
  try { return JSON.parse(text); } catch { return text; }
}

async function waitForHealth(baseUrl) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try {
      return await request(`${baseUrl}/health`);
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error('Backend did not become healthy within 45 seconds.');
}

async function terminateDatabase(client) {
  await client.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()', [databaseName]);
}

(async () => {
  const admin = new Client({ connectionString: adminUrl.toString(), ssl: source.searchParams.get('sslmode') ? { rejectUnauthorized: false } : undefined });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    const env = {
      NODE_ENV: 'production',
      DATABASE_URL: testUrl.toString(),
      DATABASE_SSL: 'false',
      TYPEORM_SYNCHRONIZE: 'false',
      TYPEORM_MIGRATIONS_RUN: 'false',
      JWT_SECRET: jwtSecret,
      JWT_EXPIRES_IN: '15m',
      CORS_ORIGINS: 'https://crm-verification.example.ir',
      PORT: port,
    };

    run(process.execPath, ['./node_modules/typeorm/cli.js', 'migration:run', '-d', 'dist/data-source.js'], env);
    run(process.execPath, ['dist/create-production-admin.js'], {
      ...env,
      INITIAL_ADMIN_NAME: 'Production Verification Admin',
      INITIAL_ADMIN_PHONE: '09000000000',
      INITIAL_ADMIN_PERSON_CODE: `VERIFY_${suffix}`,
      INITIAL_ADMIN_PASSWORD: password,
    });

    server = spawn(process.execPath, ['dist/main.js'], { cwd: backend, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stderr.on('data', chunk => { serverErrors += chunk.toString(); });
    server.on('exit', code => { if (code && !server.killed) serverErrors += `Backend exited with ${code}.`; });
    const baseUrl = `http://127.0.0.1:${port}`;
    const health = await waitForHealth(baseUrl);
    if (health.database !== 'connected') throw new Error('Health response did not confirm the database connection.');

    const allowedCors = await fetch(`${baseUrl}/health`, { headers: { origin: env.CORS_ORIGINS } });
    if (allowedCors.headers.get('access-control-allow-origin') !== env.CORS_ORIGINS) {
      throw new Error('The configured production CORS origin was not accepted.');
    }
    const deniedCors = await fetch(`${baseUrl}/health`, { headers: { origin: 'https://untrusted.example.com' } });
    if (deniedCors.headers.has('access-control-allow-origin')) {
      throw new Error('An untrusted CORS origin was accepted.');
    }

    const login = await request(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: env.CORS_ORIGINS },
      body: JSON.stringify({ phone: '09000000000', password }),
    }, 201);
    if (!login.access_token || login.role !== 'ADMIN') throw new Error('Login response did not contain a valid ADMIN token.');
    const authenticated = { headers: { authorization: `Bearer ${login.access_token}`, origin: env.CORS_ORIGINS } };
    await request(`${baseUrl}/customers`, authenticated);
    await request(`${baseUrl}/intelligence/customers`, authenticated);
    await request(`${baseUrl}/intelligence/churn`, authenticated);
    await request(`${baseUrl}/intelligence/recommendations`, authenticated);
    await request(`${baseUrl}/intelligence/dashboard`, authenticated);
    await request(`${baseUrl}/marketing/campaigns`, authenticated);
    await request(`${baseUrl}/marketing/templates`, authenticated);
    await request(`${baseUrl}/marketing/automations`, authenticated);
    const campaign = await request(`${baseUrl}/marketing/campaigns`, {
      method: 'POST',
      headers: { ...authenticated.headers, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Verification campaign', message: 'Verification only', filters: {} }),
    }, 201);
    await request(`${baseUrl}/marketing/campaigns/${campaign.id}/preview`, { method: 'POST', ...authenticated }, 201);
    await request(`${baseUrl}/marketing/campaigns/${campaign.id}/send`, {
      method: 'POST', headers: { ...authenticated.headers, 'content-type': 'application/json' }, body: JSON.stringify({}),
    }, 400);
    await request(`${baseUrl}/reports/summary`, authenticated);
    await request(`${baseUrl}/reports/chart`, authenticated);
    await request(`${baseUrl}/customers`, {}, 401);

    console.log(JSON.stringify({
      status: 'passed',
      database: 'connected',
      migrations: 'passed',
      adminCreation: 'passed',
      login: 'passed',
      cors: 'passed',
      endpoints: ['/health', '/auth/login', '/customers', '/intelligence/customers', '/intelligence/churn', '/intelligence/recommendations', '/intelligence/dashboard', '/marketing/campaigns', '/marketing/templates', '/marketing/automations', '/reports/summary', '/reports/chart'],
      unauthorizedAccess: 'blocked',
    }, null, 2));
    if (serverErrors) process.stderr.write(serverErrors);
  } finally {
    if (server && !server.killed) {
      server.kill();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    await terminateDatabase(admin).catch(() => undefined);
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`).catch(() => undefined);
    await admin.end();
  }
})().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
