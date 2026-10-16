import { Pool } from 'pg';

const primaryConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!primaryConnectionString) {
  console.warn('[postgres] WARNING: Missing DATABASE_URL — falling back to in-memory auction store.');
}

function shouldUseSsl(connectionString) {
  return /supabase\.(com|co)|pooler\.supabase\.com/.test(connectionString);
}

// Single, properly configured pool — shared across all requests (Next.js module cache keeps this alive)
const pool = primaryConnectionString
  ? new Pool({
      connectionString: primaryConnectionString,
      ssl: shouldUseSsl(primaryConnectionString) ? { rejectUnauthorized: false } : undefined,

      // Pool size: Supabase free tier max is 60. Keep headroom for admin + migrations.
      max: 10,
      min: 2,

      // Kill idle connections after 30s to free Supabase slots
      idleTimeoutMillis: 30_000,

      // Fail fast if no connection available within 5s (don't let requests pile up)
      connectionTimeoutMillis: 5_000,

      // Kill long-running queries after 15s
      statement_timeout: 15_000,
    })
  : null;

// Log pool errors so they don't silently kill the process
if (pool) {
  pool.on('error', (err) => {
    console.error('[pg-pool] Unexpected pool error:', err.message);
  });
}

export async function getDbClient() {
  if (!pool) throw new Error('No database connection available. Set DATABASE_URL in .env.local');
  return pool.connect();
}

// Helper for one-shot queries without manual connect/release
export async function query(sql, params) {
  if (!pool) throw new Error('No database connection available. Set DATABASE_URL in .env.local');
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}
