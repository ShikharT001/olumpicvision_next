import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const index = line.indexOf('=');
  if (index > 0 && !line.startsWith('#')) process.env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
}
const { getDbClient } = await import('./lib/postgres.js');
const client = await getDbClient();
try { await client.query(fs.readFileSync('db_migration_pdvl.sql', 'utf8')); console.log('PDVL volleyball_registrations table is ready.'); } finally { client.release(); }
