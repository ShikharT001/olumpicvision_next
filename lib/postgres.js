import { Pool } from 'pg';

const primaryConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!primaryConnectionString) {
  throw new Error('Missing DATABASE_URL in .env.local');
}

function shouldUseSsl(connectionString) {
  return /supabase\.(com|co)|pooler\.supabase\.com/.test(connectionString);
}

// Single, properly configured pool — shared across all requests (Next.js module cache keeps this alive)
const pool = new Pool({
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
});

// Log pool errors so they don't silently kill the process
pool.on('error', (err) => {
  console.error('[pg-pool] Unexpected pool error:', err.message);
});

export async function getDbClient() {
  return pool.connect();
}

// Helper for one-shot queries without manual connect/release
export async function query(sql, params) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}
