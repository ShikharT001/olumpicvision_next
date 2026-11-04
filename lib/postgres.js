import { Pool } from 'pg';

function shouldUseSsl(connectionString) {
  return /supabase\.(com|co)|pooler\.supabase\.com/.test(connectionString);
}

let globalPool = null;

export function getPool() {
  if (globalPool) return globalPool;
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    console.warn('[postgres] WARNING: Missing DATABASE_URL — falling back to in-memory auction store.');
    return null;
  }
  globalPool = new Pool({
    connectionString: connStr,
    ssl: shouldUseSsl(connStr) ? { rejectUnauthorized: false } : undefined,
    max: 10,
    min: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 15_000,
  });
  globalPool.on('error', (err) => {
    console.error('[pg-pool] Unexpected pool error:', err.message);
  });
  return globalPool;
}

export async function getDbClient() {
  const p = getPool();
  if (!p) throw new Error('No database connection available. Set DATABASE_URL in .env.local');
  return p.connect();
}

export async function query(sql, params) {
  const p = getPool();
  if (!p) throw new Error('No database connection available. Set DATABASE_URL in .env.local');
  const client = await p.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}
