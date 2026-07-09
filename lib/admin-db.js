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
      select table_name, table_type
      from information_schema.tables
      where table_schema = 'public'
        and table_name not in ('registration_details', 'payment_transaction_details', 'payment_transactions_details')
      order by table_name asc
    `);

    const tables = [];

    for (const { table_name, table_type } of tableRows) {
      try {
        const { rows, fields } = await client.query(
          `select * from ${quoteIdentifier(table_name)}`
        );

        tables.push({
          name: table_name,
          columns: fields.map((field) => field.name),
          rows,
          count: rows.length,
          readOnly: table_type === 'VIEW' && table_name !== 'registration_details',
        });
      } catch (error) {
        tables.push({
          name: table_name,
          columns: ['error'],
          rows: [{ error: error.message }],
          count: 0,
          readOnly: true,
          error: error.message,
        });
      }
    }

    return tables;
  } finally {
    client.release();
  }
}

export async function deleteRow(tableName, idColumn, idValue) {
  const client = await pool.connect();
  try {
    const targetTable = tableName === 'registration_details' ? 'registrations' : tableName;
    const result = await client.query(
      `DELETE FROM ${quoteIdentifier(targetTable)} WHERE ${quoteIdentifier(idColumn)} = $1`,
      [idValue]
    );
    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

function normalizePayload(payload) {
  const normalized = { ...payload };
  const enumCols = ['registration_status', 'gender', 'payment_status', 'status'];
  for (const col of enumCols) {
    if (typeof normalized[col] === 'string') {
      normalized[col] = normalized[col].toLowerCase().trim();
    }
  }
  return normalized;
}

export async function updateRow(tableName, idColumn, idValue, payload) {
  const client = await pool.connect();
  try {
    const targetTable = tableName === 'registration_details' ? 'registrations' : tableName;

    // If it's the view, filter the payload to only include actual columns from registrations
    let finalPayload = normalizePayload(payload);
    if (tableName === 'registration_details') {
      const allowedColumns = [
        'full_name', 'mobile_no', 'date_of_birth', 'gender',
        'school_college_name', 'category_code', 'registration_status', 'bib_number',
        'document_url', 'partner_document_url',
      ];
      const filtered = {};
      for (const key of Object.keys(finalPayload)) {
        if (allowedColumns.includes(key)) {
          filtered[key] = finalPayload[key];
        }
      }
      finalPayload = filtered;
    }

    const keys = Object.keys(finalPayload);
    if (keys.length === 0) return false;

    const setParts = keys.map((key, i) => `${quoteIdentifier(key)} = $${i + 2}`);
    const values = keys.map((key) => finalPayload[key]);

    const query = `
      UPDATE ${quoteIdentifier(targetTable)}
      SET ${setParts.join(', ')}
      WHERE ${quoteIdentifier(idColumn)} = $1
    `;

    const result = await client.query(query, [idValue, ...values]);
    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

export async function insertRow(tableName, payload) {
  const client = await pool.connect();
  try {
    const targetTable = tableName === 'registration_details' ? 'registrations' : tableName;

    // Filter payload for view mapping just like updateRow
    let finalPayload = normalizePayload(payload);
    if (tableName === 'registration_details') {
      const allowedColumns = [
        'full_name', 'mobile_no', 'date_of_birth', 'gender',
        'school_college_name', 'category_code', 'registration_status', 'bib_number',
        'document_url', 'partner_document_url',
      ];
      const filtered = {};
      for (const key of Object.keys(finalPayload)) {
        if (allowedColumns.includes(key)) {
          filtered[key] = finalPayload[key];
        }
      }
      finalPayload = filtered;
    }

    const keys = Object.keys(finalPayload);
    if (keys.length === 0) return false;

    const cols = keys.map(key => quoteIdentifier(key)).join(', ');
    const vals = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(key => finalPayload[key]);

    const query = `INSERT INTO ${quoteIdentifier(targetTable)} (${cols}) VALUES (${vals})`;

    const result = await client.query(query, values);
    return result.rowCount > 0;
  } finally {
    client.release();
  }
}

export async function confirmParticipation(registrationId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE registrations
         SET registration_status = 'confirmed', updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [registrationId]
    );
    return result.rowCount > 0;
  } finally {
    client.release();
  }
}
