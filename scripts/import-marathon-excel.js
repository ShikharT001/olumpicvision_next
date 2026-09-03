/**
 * Import MARATHON_REPORT_COMBINED.xlsx into the `marathon_participants` table.
 * Run:  node scripts/import-marathon-excel.js
 */

require('dotenv').config({ path: '.env.local' });

const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
    console.error('ERROR: DATABASE_URL not found in .env.local');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: /supabase/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
});

async function main() {
    const client = await pool.connect();

    try {
        console.log('🔗 Connected to database');

        // ── 1. Create table if not exists ────────────────────────────────────────
        await client.query(`
      CREATE TABLE IF NOT EXISTS marathon_participants (
        id            SERIAL PRIMARY KEY,
        race_group    TEXT NOT NULL,
        category      TEXT NOT NULL,
        bib_number    INTEGER NOT NULL UNIQUE,
        full_name     TEXT NOT NULL,
        organization  TEXT,
        date_of_birth TEXT,
        age           INTEGER,
        imported_at   TIMESTAMPTZ DEFAULT NOW()
      );
    `);
        console.log('✅ Table marathon_participants ready');

        // ── 2. Read Excel ─────────────────────────────────────────────────────────
        const filePath = path.join(__dirname, '../Pdf_and_excel/MARATHON_REPORT_COMBINED.xlsx');
        const wb = XLSX.readFile(filePath);
        const ws = wb.Sheets['All Runners'];
        if (!ws) {
            throw new Error('Sheet "All Runners" not found in Excel file');
        }

        // Row 0 = title row, Row 1 = header row, data starts at Row 2
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const dataRows = rows.slice(2); // skip title + header
        console.log(`📊 Found ${dataRows.length} data rows in Excel`);

        // ── 3. Upsert each row ───────────────────────────────────────────────────
        let inserted = 0;
        let skipped = 0;

        for (const row of dataRows) {
            // row structure: [race_group, category, bib_number, full_name, organization, dob, age]
            const [race_group, category, bib_number, full_name, organization, date_of_birth, age] = row;

            // Skip empty / header-like rows
            if (!bib_number || typeof bib_number !== 'number' || !full_name) {
                skipped++;
                continue;
            }

            await client.query(
                `INSERT INTO marathon_participants
           (race_group, category, bib_number, full_name, organization, date_of_birth, age)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (bib_number) DO UPDATE SET
           race_group    = EXCLUDED.race_group,
           category      = EXCLUDED.category,
           full_name     = EXCLUDED.full_name,
           organization  = EXCLUDED.organization,
           date_of_birth = EXCLUDED.date_of_birth,
           age           = EXCLUDED.age`,
                [
                    String(race_group || '').trim(),
                    String(category || '').trim(),
                    Number(bib_number),
                    String(full_name || '').trim(),
                    String(organization || '').trim() || null,
                    String(date_of_birth || '').trim() || null,
                    age ? Number(age) : null,
                ]
            );
            inserted++;
        }

        console.log(`\n🎉 Import complete!`);
        console.log(`   ✅ Inserted/Updated : ${inserted}`);
        console.log(`   ⏭️  Skipped (empty)  : ${skipped}`);

        // ── 4. Quick verification ─────────────────────────────────────────────────
        const { rows: countRows } = await client.query(
            `SELECT COUNT(*) AS total FROM marathon_participants`
        );
        console.log(`\n📋 Total participants in DB: ${countRows[0].total}`);

        // Show a sample
        const { rows: sample } = await client.query(
            `SELECT bib_number, full_name, category FROM marathon_participants ORDER BY bib_number LIMIT 5`
        );
        console.log('\nSample rows:');
        sample.forEach(r => console.log(`  BIB ${r.bib_number} — ${r.full_name} (${r.category})`));

    } finally {
        client.release();
        await pool.end();
    }
}

main().catch(err => {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
});
