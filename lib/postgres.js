import { Pool } from 'pg';

function shouldUseSsl(connectionString) {
  return /supabase\.(com|co)|pooler\.supabase\.com/.test(connectionString);
}

export function getPool() {
  if (globalThis.__pgPool__) return globalThis.__pgPool__;
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    console.warn('[postgres] WARNING: Missing DATABASE_URL — falling back to in-memory auction store.');
    return null;
  }
  const pool = new Pool({
    connectionString: connStr,
    ssl: shouldUseSsl(connStr) ? { rejectUnauthorized: false } : undefined,
    max: 15,
    min: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 4_000,
    statement_timeout: 10_000,
  });
  pool.on('error', (err) => {
    console.error('[pg-pool] Unexpected pool error:', err.message);
  });
  globalThis.__pgPool__ = pool;
  return pool;
}

export async function getDbClient() {
  const p = getPool();
  if (!p) throw new Error('No database connection available. Set DATABASE_URL in .env.local');
  return p.connect();
}

export async function query(sql, params) {
  const p = getPool();
  if (!p) throw new Error('No database connection available. Set DATABASE_URL in .env.local');
  return p.query(sql, params);
}
