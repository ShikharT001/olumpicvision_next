/**
 * run-auction-migration.mjs
 * Run once to set up all PDVL auction tables, indexes, RLS policies, triggers,
 * and seed 6 teams + 20 players with admin-set base prices.
 *
 * Usage:
 *   node run-auction-migration.mjs
 */

import fs from 'fs';
import path from 'path';

// Load .env.local variables into process.env
const envPath = fs.existsSync(path.resolve('.env.local'))
  ? path.resolve('.env.local')
  : path.resolve('.env');

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index > 0 && !line.startsWith('#')) {
      const key = line.slice(0, index).trim();
      const val = line.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = val; // don't override system env
    }
  }
}

const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!connStr) {
  console.error('❌  No DATABASE_URL found in .env.local. Cannot run migration.');
  process.exit(1);
}

try {
  const { getDbClient } = await import('./lib/postgres.js');
  const client = await getDbClient();

  try {
    console.log('🔄  Running PDVL auction migration...');
    const sql = fs.readFileSync('db_migration_auction.sql', 'utf8');
    await client.query(sql);
    console.log('✅  Auction tables created / updated successfully.');

    // Verify
    const teamsRes = await client.query('SELECT COUNT(*)::int AS count FROM auction_teams');
    const playersRes = await client.query('SELECT COUNT(*)::int AS count FROM auction_players');
    const stateRes = await client.query('SELECT id, last_action FROM auction_state WHERE id = 1');

    console.log(`\n📊  Verification after migration:`);
    console.log(`    Teams    : ${teamsRes.rows[0]?.count ?? 0}`);
    console.log(`    Players  : ${playersRes.rows[0]?.count ?? 0}`);
    console.log(`    State row: ${stateRes.rows[0] ? stateRes.rows[0].last_action : 'MISSING!'}`);
    console.log('\n🎉  Auction system ready. Start the server and visit /auction');
  } finally {
    client.release();
  }
} catch (err) {
  console.error('❌  Migration error:', err.message);
  if (err.detail) console.error('    Detail:', err.detail);
  process.exit(1);
}
