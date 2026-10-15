import fs from 'fs';
import path from 'path';

const envPath = fs.existsSync(path.resolve('.env.local')) ? path.resolve('.env.local') : path.resolve('.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index > 0 && !line.startsWith('#')) process.env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
}

try {
  const { getDbClient } = await import('./lib/postgres.js');
  const client = await getDbClient();
  try {
    await client.query(fs.readFileSync('db_migration_auction.sql', 'utf8'));
    console.log('Auction module database tables created successfully.');
  } finally {
    client.release();
  }
} catch (err) {
  console.error('Migration error:', err.message);
}
