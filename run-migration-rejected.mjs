import fs from 'fs';
import path from 'path';

// Parse env variables first
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
    console.warn('Failed to parse .env.local:', e.message);
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not set!');
    process.exit(1);
}

const { default: pkg } = await import('pg');
const { Pool } = pkg;

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});

const client = await pool.connect();
try {
    console.log('Dropping old registration_status check constraint...');
    await client.query(
        'ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_registration_status_check;'
    );

    console.log("Adding updated check constraint with 'rejected' and 'payment_pending' statuses...");
    await client.query(
        `ALTER TABLE registrations ADD CONSTRAINT registrations_registration_status_check
         CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'rejected', 'payment_pending'));`
    );

    console.log('Migration completed successfully!');
} catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
} finally {
    client.release();
    await pool.end();
}
