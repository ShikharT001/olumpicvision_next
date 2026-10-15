import fs from 'fs';
import path from 'path';

// Parse env variables first!
try {
    const envPath = path.resolve('.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const index = trimmed.indexOf('=');
                if (index !== -1) {
                    const key = trimmed.substring(0, index).trim();
                    const val = trimmed.substring(index + 1).trim();
                    process.env[key] = val;
                }
            }
        });
    }
} catch (e) {
    console.warn('Failed to parse .env.local file manually:', e.message);
}

async function run() {
    console.log('Connecting to database...');
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set!');
        process.exit(1);
    }

    // Dynamically import to ensure env variables are set beforehand
    const { getDbClient } = await import('./lib/postgres.js');
    const client = await getDbClient();
    try {
        console.log('Altering registrations table...');
        await client.query(`
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS email TEXT;
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
    `);

        console.log('Replacing registration_details view...');
        await client.query(`
      DROP VIEW IF EXISTS registration_details;
      CREATE OR REPLACE VIEW registration_details AS
      SELECT
        r.id,
        r.full_name,
        r.email,
        r.mobile_no,
        r.gender,
        r.date_of_birth,
        DATE_PART('year', AGE(r.date_of_birth))::INT AS age,
        r.school_college_name,
        r.category_code,
        rc.label AS category_label,
        rc.distance_km,
        r.registration_status,
        r.bib_number,
        r.payment_required,
        r.payment_status,
        r.fee_amount_paise,
        (r.fee_amount_paise / 100.0)::NUMERIC(10,2) AS fee_amount_rupees,
        r.document_url,
        r.partner_document_url,
        r.payment_screenshot_url,
        pt.provider_order_id,
        pt.provider_payment_id,
        pt.status AS transaction_status,
        pt.paid_at,
        r.submitted_at
      FROM registrations r
      JOIN race_categories rc ON r.category_code = rc.code
      LEFT JOIN LATERAL (
        SELECT *
        FROM payment_transactions pt
        WHERE pt.registration_id = r.id
        ORDER BY pt.created_at DESC
        LIMIT 1
      ) pt ON true;
    `);
        console.log('Database migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit(0);
    }
}

run();
