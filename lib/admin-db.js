import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('Missing DATABASE_URL in .env.local');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com')
    ? { rejectUnauthorized: false }
    : undefined,
});

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

export async function getDatabaseSnapshot() {
  const client = await pool.connect();

  try {
    const { rows: tableRows } = await client.query(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
      order by table_name asc
    `);

    const tables = [];

    for (const { table_name } of tableRows) {
      try {
        const { rows, fields } = await client.query(
          `select * from ${quoteIdentifier(table_name)}`
        );

        tables.push({
          name: table_name,
          columns: fields.map((field) => field.name),
          rows,
          count: rows.length,
        });
      } catch (error) {
        tables.push({
          name: table_name,
          columns: ['error'],
          rows: [{ error: error.message }],
          count: 0,
          error: error.message,
        });
      }
    }

    return tables;
  } finally {
    client.release();
  }
}
