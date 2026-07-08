import { Pool } from 'pg';

const primaryConnectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!primaryConnectionString) {
  throw new Error('Missing DATABASE_URL in .env.local');
}

function getSupabaseProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    try {
      return new URL(supabaseUrl).hostname.split('.')[0];
    } catch {
      return null;
    }
  }

  try {
    const dbUrl = new URL(primaryConnectionString);
    const [, projectRef] = dbUrl.username.split('.');
    return projectRef || null;
  } catch {
    return null;
  }
}

function createDirectSupabaseUrl() {
  try {
    const dbUrl = new URL(primaryConnectionString);
    const projectRef = getSupabaseProjectRef();

    if (!projectRef || !dbUrl.password) {
      return null;
    }

    dbUrl.username = 'postgres';
    dbUrl.hostname = `db.${projectRef}.supabase.co`;
    dbUrl.port = '5432';

    return dbUrl.toString();
  } catch {
    return null;
  }
}

function shouldUseSsl(connectionString) {
  return /supabase\.(com|co)|pooler\.supabase\.com/.test(connectionString);
}

const connectionStrings = [
  primaryConnectionString,
  createDirectSupabaseUrl(),
].filter(Boolean);

const pools = connectionStrings.map((connectionString) => ({
  connectionString,
  pool: new Pool({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  }),
}));

export async function getDbClient() {
  let lastError = null;

  for (const { pool } of pools) {
    try {
      return await pool.connect();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Unable to connect to database');
}
