import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { getDbClient } = await import('../lib/postgres.js');
  const client = await getDbClient();
  const tournId = '0d01ffe1-5802-4e8d-89b2-534f86af4ac5';
  try {
    const firstPRes = await client.query(
      `SELECT id, full_name, base_price FROM auction_players
       WHERE tournament_id::text = $1 AND auction_status IN ('on_hammer', 'queued')
       ORDER BY lot_number ASC, created_at ASC LIMIT 1`,
      [tournId]
    );
    const firstPlayer = firstPRes.rows[0] || null;
    const initialAction = firstPlayer
      ? `Now on hammer: ${firstPlayer.full_name} (Base ₹${Number(firstPlayer.base_price).toLocaleString('en-IN')})`
      : 'Auction system ready';

    const insertRes = await client.query(
      `INSERT INTO auction_state (
        tournament_id, active_player_id, current_highest_bid, bid_increment,
        hammer_stage, is_paused, last_action, updated_at
      ) VALUES ($1, $2, 0, 500, 0, false, $3, NOW())
      ON CONFLICT (tournament_id) DO UPDATE SET updated_at = NOW()
      RETURNING *`,
      [tournId, firstPlayer?.id || null, initialAction]
    );
    console.log('INSERTED AUCTION STATE:', insertRes.rows[0]);
  } finally {
    client.release();
  }
}

main().catch(console.error);
