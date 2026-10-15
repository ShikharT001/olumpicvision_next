// =======================================================
// PDVL AUCTION MODULE — DATABASE & SERVICE LAYER
// Handles Teams, Players, Bids, and Live Podium State
// =======================================================

const g = globalThis;
if (!g.__pdvlAuctionMemoryStore__) {
  g.__pdvlAuctionMemoryStore__ = null;
}
if (!g.__pdvlAuctionNotification__) {
  g.__pdvlAuctionNotification__ = null;
}
if (!g.__pdvlAuctionNotificationHistory__) {
  g.__pdvlAuctionNotificationHistory__ = [];
}

function initMemoryStore() {
  if (g.__pdvlAuctionMemoryStore__) return g.__pdvlAuctionMemoryStore__;

  const sampleTeams = [
    {
      id: 'team-1',
      team_name: 'Palghar Spikers',
      team_code: 'PSP',
      owner_name: 'Mahesh Patil',
      coach_name: 'Vikram Joshi',
      logo_url: '',
      primary_color: '#0d6efd',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 1,
      is_active: true,
      squad: [],
    },
    {
      id: 'team-2',
      team_name: 'Boisar Blasters',
      team_code: 'BBL',
      owner_name: 'Rahul Raut',
      coach_name: 'Sameer More',
      logo_url: '',
      primary_color: '#dc3545',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 2,
      is_active: true,
      squad: [],
    },
    {
      id: 'team-3',
      team_name: 'Dahanu Warriors',
      team_code: 'DWR',
      owner_name: 'Kiran Tare',
      coach_name: 'Sanjay Vaze',
      logo_url: '',
      primary_color: '#198754',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 3,
      is_active: true,
      squad: [],
    },
    {
      id: 'team-4',
      team_name: 'Vasai Challengers',
      team_code: 'VCH',
      owner_name: 'Aniket Mhatre',
      coach_name: 'Pravin Kini',
      logo_url: '',
      primary_color: '#fd7e14',
      initial_purse: 100000,
      remaining_purse: 100000,
      min_squad_size: 8,
      max_squad_size: 12,
      display_order: 4,
      is_active: true,
      squad: [],
    },
  ];

  const samplePlayers = [
    {
      id: 'player-1',
      full_name: 'Rohit Pradeep Gharat',
      photo_url: '',
      playing_position: 'outside_hitter',
      player_category: 'palghar_open',
      height_cm: 185,
      weight_kg: 76,
      team_name: 'Palghar Boys Club',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Icon',
      base_price: 3000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 1,
      bid_count: 0,
    },
    {
      id: 'player-2',
      full_name: 'Siddhesh Santosh Patil',
      photo_url: '',
      playing_position: 'setter',
      player_category: 'palghar_open',
      height_cm: 178,
      weight_kg: 70,
      team_name: 'Tarapur Strikers',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Grade A',
      base_price: 2000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 2,
      bid_count: 0,
    },
    {
      id: 'player-3',
      full_name: 'Aditya Rajendra Vaze',
      photo_url: '',
      playing_position: 'middle_blocker',
      player_category: 'palghar_open',
      height_cm: 192,
      weight_kg: 82,
      team_name: 'Dahanu Spikers',
      district: 'Palghar',
      lot_number: 1,
      player_grade: 'Grade A',
      base_price: 2000,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 3,
      bid_count: 0,
    },
    {
      id: 'player-4',
      full_name: 'Chetan Mhatre',
      photo_url: '',
      playing_position: 'libero',
      player_category: 'u19',
      height_cm: 170,
      weight_kg: 64,
      team_name: 'Kelva Volleyball Academy',
      district: 'Palghar',
      lot_number: 2,
      player_grade: 'Grade B',
      base_price: 1500,
      current_bid: 0,
      sold_price: null,
      sold_to_team_id: null,
      auction_status: 'queued',
      bidding_order: 4,
      bid_count: 0,
    },
  ];

  g.__pdvlAuctionMemoryStore__ = {
    teams: sampleTeams,
    players: samplePlayers,
    bids: [],
    history: [],
    state: {
      active_player_id: samplePlayers[0].id,
      current_highest_bid: 0,
      current_highest_team_id: null,
      bid_increment: 500,
      hammer_stage: 0, // 0: open, 1: once, 2: twice, 3: sold
      is_paused: false,
      last_action: 'Auction system ready',
      last_notification: null,
      updated_at: new Date().toISOString(),
    },
  };

  return g.__pdvlAuctionMemoryStore__;
}

async function hasDbConnection() {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return Boolean(connStr && connStr.trim().length > 0);
}

// ── TEAMS API ─────────────────────────────────────────────────────────────

export async function getAuctionTeams() {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const teamsRes = await client.query(`
          SELECT t.*, 
            COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]') as squad,
            COUNT(p.id)::int as squad_count
          FROM auction_teams t
          LEFT JOIN auction_players p ON p.sold_to_team_id = t.id
          WHERE t.is_active = true
          GROUP BY t.id
          ORDER BY t.display_order ASC, t.team_name ASC
        `);
        return teamsRes.rows;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] Falling back to memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  return store.teams.map((t) => {
    const squad = store.players.filter((p) => p.sold_to_team_id === t.id);
    return { ...t, squad, squad_count: squad.length };
  });
}

export async function createAuctionTeam(data) {
  const initialPurse = Number(data.initial_purse) || 50000;
  const teamCode = String(data.team_code || '').trim().toUpperCase();
  const teamName = String(data.team_name || '').trim();

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `INSERT INTO auction_teams (
            team_name, team_code, owner_name, coach_name, logo_url, primary_color,
            initial_purse, remaining_purse, min_squad_size, max_squad_size
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9) RETURNING *`,
          [
            teamName,
            teamCode,
            data.owner_name?.trim() || null,
            data.coach_name?.trim() || null,
            data.logo_url?.trim() || null,
            data.primary_color || '#0d6efd',
            initialPurse,
            Number(data.min_squad_size) || 8,
            Number(data.max_squad_size) || 12,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB insert team failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  const newTeam = {
    id: `team-${Date.now()}`,
    team_name: teamName,
    team_code: teamCode,
    owner_name: data.owner_name?.trim() || '',
    coach_name: data.coach_name?.trim() || '',
    logo_url: data.logo_url?.trim() || '',
    primary_color: data.primary_color || '#0d6efd',
    initial_purse: initialPurse,
    remaining_purse: initialPurse,
    min_squad_size: Number(data.min_squad_size) || 8,
    max_squad_size: Number(data.max_squad_size) || 12,
    display_order: store.teams.length + 1,
    is_active: true,
    squad: [],
    squad_count: 0,
  };
  store.teams.push(newTeam);
  return newTeam;
}

export async function updateAuctionTeam(teamId, data) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `UPDATE auction_teams SET
            team_name = COALESCE($2, team_name),
            owner_name = COALESCE($3, owner_name),
            coach_name = COALESCE($4, coach_name),
            initial_purse = COALESCE($5, initial_purse),
            remaining_purse = COALESCE($6, remaining_purse),
            primary_color = COALESCE($7, primary_color),
            updated_at = NOW()
          WHERE id = $1 RETURNING *`,
          [
            teamId,
            data.team_name,
            data.owner_name,
            data.coach_name,
            data.initial_purse ? Number(data.initial_purse) : null,
            data.remaining_purse ? Number(data.remaining_purse) : null,
            data.primary_color,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB update team failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  const team = store.teams.find((t) => t.id === teamId);
  if (team) {
    if (data.team_name !== undefined) team.team_name = data.team_name;
    if (data.owner_name !== undefined) team.owner_name = data.owner_name;
    if (data.coach_name !== undefined) team.coach_name = data.coach_name;
    if (data.initial_purse !== undefined) team.initial_purse = Number(data.initial_purse);
    if (data.remaining_purse !== undefined) team.remaining_purse = Number(data.remaining_purse);
    if (data.primary_color !== undefined) team.primary_color = data.primary_color;
  }
  return team;
}

// ── PLAYERS API ───────────────────────────────────────────────────────────

export async function getAuctionPlayers(filters = {}) {
  const { status, lot, position } = filters;

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        let query = `
          SELECT p.*, t.team_name as sold_team_name, t.team_code as sold_team_code, t.primary_color as sold_team_color
          FROM auction_players p
          LEFT JOIN auction_teams t ON t.id = p.sold_to_team_id
          WHERE 1=1
        `;
        const params = [];
        if (status) {
          params.push(status);
          query += ` AND p.auction_status = $${params.length}`;
        }
        if (lot) {
          params.push(Number(lot));
          query += ` AND p.lot_number = $${params.length}`;
        }
        if (position) {
          params.push(position);
          query += ` AND p.playing_position = $${params.length}`;
        }
        query += ` ORDER BY p.bidding_order ASC, p.created_at ASC`;

        const res = await client.query(query, params);
        return res.rows;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB get players failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  return store.players.filter((p) => {
    if (status && p.auction_status !== status) return false;
    if (lot && p.lot_number !== Number(lot)) return false;
    if (position && p.playing_position !== position) return false;
    return true;
  });
}

export async function importFromRegistrations() {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const insertRes = await client.query(`
          INSERT INTO auction_players (
            registration_id, full_name, photo_url, playing_position, player_category,
            height_cm, weight_kg, team_name, district, base_price, player_grade, auction_status
          )
          SELECT 
            r.id, r.full_name, r.photo_url, r.playing_position, r.player_category,
            r.height_cm, r.weight_kg, r.team_name, r.district,
            CASE 
              WHEN r.player_category = 'icon_player' THEN 3000
              WHEN r.player_category = 'palghar_open' THEN 2000
              ELSE 1000
            END as base_price,
            CASE 
              WHEN r.player_category = 'icon_player' THEN 'Icon'
              WHEN r.player_category = 'palghar_open' THEN 'Grade A'
              ELSE 'Grade B'
            END as player_grade,
            'queued' as auction_status
          FROM volleyball_registrations r
          WHERE r.registration_status = 'approved'
            AND r.id NOT IN (SELECT registration_id FROM auction_players WHERE registration_id IS NOT NULL)
          RETURNING *;
        `);
        return { importedCount: insertRes.rowCount };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB import from registrations failed:', err.message);
    }
  }

  return { importedCount: 0 };
}

export async function updateAuctionPlayer(playerId, data) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const res = await client.query(
          `UPDATE auction_players SET
            base_price = COALESCE($2, base_price),
            lot_number = COALESCE($3, lot_number),
            player_grade = COALESCE($4, player_grade),
            bidding_order = COALESCE($5, bidding_order)
          WHERE id = $1 RETURNING *`,
          [
            playerId,
            data.base_price ? Number(data.base_price) : null,
            data.lot_number ? Number(data.lot_number) : null,
            data.player_grade,
            data.bidding_order ? Number(data.bidding_order) : null,
          ]
        );
        return res.rows[0];
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB update player failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  const player = store.players.find((p) => p.id === playerId);
  if (player) {
    if (data.base_price !== undefined) player.base_price = Number(data.base_price);
    if (data.lot_number !== undefined) player.lot_number = Number(data.lot_number);
    if (data.player_grade !== undefined) player.player_grade = data.player_grade;
    if (data.bidding_order !== undefined) player.bidding_order = Number(data.bidding_order);
  }
  return player;
}

// ── LIVE AUCTION ENGINE ───────────────────────────────────────────────────

export async function getLiveAuctionState() {
  const teams = await getAuctionTeams();
  let state = null;
  let activePlayer = null;
  let recentBids = [];

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const stateRes = await client.query('SELECT * FROM auction_state WHERE id = 1');
        state = stateRes.rows[0] || null;

        if (state?.active_player_id) {
          const playerRes = await client.query('SELECT * FROM auction_players WHERE id = $1', [state.active_player_id]);
          activePlayer = playerRes.rows[0] || null;

          const bidsRes = await client.query(`
            SELECT b.*, t.team_name, t.team_code, t.primary_color
            FROM auction_bids b
            JOIN auction_teams t ON t.id = b.team_id
            WHERE b.player_id = $1
            ORDER BY b.placed_at DESC
            LIMIT 8
          `, [state.active_player_id]);
          recentBids = bidsRes.rows;
        }
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB get live state failed, using memory store:', err.message);
    }
  }

  if (!state) {
    const store = initMemoryStore();
    state = store.state;
    activePlayer = store.players.find((p) => p.id === state.active_player_id) || null;
    recentBids = store.bids
      .filter((b) => b.player_id === state.active_player_id)
      .slice(-8)
      .reverse();
  }

  const highestTeam = teams.find((t) => t.id === state.current_highest_team_id) || null;

  return {
    state,
    activePlayer,
    highestTeam,
    recentBids,
    teams,
    lastNotification: state.last_notification || g.__pdvlAuctionNotification__,
    notificationHistory: (g.__pdvlAuctionNotificationHistory__ || []).slice(0, 10),
    serverTime: new Date().toISOString(),
  };
}

export async function setActivePlayer(playerId) {
  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        const playerRes = await client.query('SELECT * FROM auction_players WHERE id = $1', [playerId]);
        const player = playerRes.rows[0];
        if (!player) throw new Error('Player not found');

        await client.query(`
          UPDATE auction_players SET auction_status = 'on_hammer' WHERE id = $1;
          UPDATE auction_state SET
            active_player_id = $1,
            current_highest_bid = 0,
            current_highest_team_id = NULL,
            hammer_stage = 0,
            last_action = $2,
            updated_at = NOW()
          WHERE id = 1;
        `, [playerId, `Now on hammer: ${player.full_name} (Base ₹${player.base_price})`]);

        return { success: true, player };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB set active player failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  const player = store.players.find((p) => p.id === playerId);
  if (!player) throw new Error('Player not found');

  player.auction_status = 'on_hammer';
  store.state.active_player_id = playerId;
  store.state.current_highest_bid = 0;
  store.state.current_highest_team_id = null;
  store.state.hammer_stage = 0;
  store.state.last_action = `Now on hammer: ${player.full_name} (Base ₹${player.base_price})`;
  store.state.updated_at = new Date().toISOString();

  return { success: true, player };
}

export async function placeBid({ teamId, bidAmount }) {
  const liveState = await getLiveAuctionState();
  const player = liveState.activePlayer;
  if (!player) throw new Error('No player is currently on the auction podium.');

  const team = liveState.teams.find((t) => t.id === teamId);
  if (!team) throw new Error('Invalid team selected.');

  const basePrice = Number(player.base_price) || 1000;
  const currentBid = Number(liveState.state.current_highest_bid) || 0;
  const nextMinimum = currentBid === 0 ? basePrice : currentBid + Number(liveState.state.bid_increment || 500);

  const finalBidAmount = bidAmount ? Math.max(Number(bidAmount), nextMinimum) : nextMinimum;

  // Purse verification: does team have enough remaining purse?
  if (Number(team.remaining_purse) < finalBidAmount) {
    throw new Error(`Insufficient budget. ${team.team_name} has ₹${team.remaining_purse.toLocaleString()} remaining, but bid is ₹${finalBidAmount.toLocaleString()}.`);
  }

  // Max squad check
  if (team.squad_count >= team.max_squad_size) {
    throw new Error(`${team.team_name} has already reached the maximum squad limit of ${team.max_squad_size} players.`);
  }

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO auction_bids (player_id, team_id, bid_amount) VALUES ($1, $2, $3)`,
          [player.id, team.id, finalBidAmount]
        );
        await client.query(
          `UPDATE auction_players SET current_bid = $1, bid_count = bid_count + 1 WHERE id = $2`,
          [finalBidAmount, player.id]
        );
        await client.query(
          `UPDATE auction_state SET
            current_highest_bid = $1,
            current_highest_team_id = $2,
            hammer_stage = 0,
            last_action = $3,
            updated_at = NOW()
          WHERE id = 1`,
          [finalBidAmount, team.id, `Bid: ₹${finalBidAmount.toLocaleString()} by ${team.team_code}`]
        );
        await client.query('COMMIT');
        return { success: true, bidAmount: finalBidAmount, team };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB bid transaction failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  const memPlayer = store.players.find((p) => p.id === player.id);
  if (memPlayer) {
    memPlayer.current_bid = finalBidAmount;
    memPlayer.bid_count = (memPlayer.bid_count || 0) + 1;
  }

  store.bids.push({
    id: `bid-${Date.now()}`,
    player_id: player.id,
    team_id: team.id,
    bid_amount: finalBidAmount,
    placed_at: new Date().toISOString(),
    team_name: team.team_name,
    team_code: team.team_code,
    primary_color: team.primary_color,
  });

  store.state.current_highest_bid = finalBidAmount;
  store.state.current_highest_team_id = team.id;
  store.state.hammer_stage = 0;
  store.state.last_action = `Bid: ₹${finalBidAmount.toLocaleString()} by ${team.team_code}`;
  store.state.updated_at = new Date().toISOString();

  return { success: true, bidAmount: finalBidAmount, team };
}

export async function advanceHammer(stage) {
  const allowed = [0, 1, 2, 3];
  if (!allowed.includes(stage)) throw new Error('Invalid hammer stage');

  let actionText = 'Podium Open';
  if (stage === 1) actionText = 'Going ONCE...';
  if (stage === 2) actionText = 'Going TWICE...';
  if (stage === 3) actionText = 'SOLD!';

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query(
          `UPDATE auction_state SET hammer_stage = $1, last_action = $2, updated_at = NOW() WHERE id = 1`,
          [stage, actionText]
        );
        return { success: true, stage, actionText };
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB hammer stage failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  store.state.hammer_stage = stage;
  store.state.last_action = actionText;
  store.state.updated_at = new Date().toISOString();

  return { success: true, stage, actionText };
}

export async function finalizeSale() {
  const liveState = await getLiveAuctionState();
  const player = liveState.activePlayer;
  const team = liveState.highestTeam;
  const winningBid = Number(liveState.state.current_highest_bid);

  if (!player || !team || winningBid <= 0) {
    throw new Error('Cannot finalize sale without an active player, bidding team, and positive bid.');
  }

  // Exact requested format: "[player name] sold to [team name] at ₹[price]"
  const soldMessage = `${player.full_name} sold to ${team.team_name} at ₹${winningBid.toLocaleString()}`;

  const soldNotification = {
    id: `notif-${Date.now()}`,
    type: 'sold',
    message: soldMessage,
    playerName: player.full_name,
    teamName: team.team_name,
    teamCode: team.team_code,
    teamColor: team.primary_color || '#0d6efd',
    price: winningBid,
    formattedPrice: `₹${winningBid.toLocaleString()}`,
    photoUrl: player.photo_url || '',
    playingPosition: player.playing_position || '',
    playerGrade: player.player_grade || '',
    lotNumber: player.lot_number || 1,
    timestamp: new Date().toISOString(),
  };

  g.__pdvlAuctionNotification__ = soldNotification;
  if (!g.__pdvlAuctionNotificationHistory__) g.__pdvlAuctionNotificationHistory__ = [];
  g.__pdvlAuctionNotificationHistory__.unshift(soldNotification);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        // Deduct purse from winning team
        await client.query(
          `UPDATE auction_teams SET remaining_purse = remaining_purse - $1, updated_at = NOW() WHERE id = $2`,
          [winningBid, team.id]
        );
        // Mark player as sold
        await client.query(
          `UPDATE auction_players SET 
            auction_status = 'sold',
            sold_price = $1,
            sold_to_team_id = $2,
            auctioned_at = NOW()
          WHERE id = $3`,
          [winningBid, team.id, player.id]
        );
        // Reset state
        await client.query(
          `UPDATE auction_state SET
            active_player_id = NULL,
            current_highest_bid = 0,
            current_highest_team_id = NULL,
            hammer_stage = 0,
            last_action = $1,
            updated_at = NOW()
          WHERE id = 1`,
          [soldMessage]
        );
        await client.query('COMMIT');
        return { success: true, player, team, winningBid, message: soldMessage, notification: soldNotification };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB finalize sale failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  // Deduct team purse
  const memTeam = store.teams.find((t) => t.id === team.id);
  if (memTeam) {
    memTeam.remaining_purse = Math.max(0, memTeam.remaining_purse - winningBid);
  }

  // Mark player as sold
  const memPlayer = store.players.find((p) => p.id === player.id);
  if (memPlayer) {
    memPlayer.auction_status = 'sold';
    memPlayer.sold_price = winningBid;
    memPlayer.sold_to_team_id = team.id;
    memPlayer.auctioned_at = new Date().toISOString();
  }

  // Save in history for undo
  store.history.push({
    type: 'sale',
    player_id: player.id,
    team_id: team.id,
    amount: winningBid,
    timestamp: new Date().toISOString(),
  });

  // Reset live state
  store.state.active_player_id = null;
  store.state.current_highest_bid = 0;
  store.state.current_highest_team_id = null;
  store.state.hammer_stage = 0;
  store.state.last_action = soldMessage;
  store.state.last_notification = soldNotification;
  store.state.updated_at = new Date().toISOString();

  return { success: true, player, team, winningBid, message: soldMessage, notification: soldNotification };
}

export async function markPlayerUnsold() {
  const liveState = await getLiveAuctionState();
  const player = liveState.activePlayer;
  if (!player) throw new Error('No player is currently on the auction podium.');

  const unsoldMessage = `${player.full_name} remained UNSOLD and moved to the unsold pool.`;

  const unsoldNotification = {
    id: `notif-${Date.now()}`,
    type: 'unsold',
    message: unsoldMessage,
    playerName: player.full_name,
    photoUrl: player.photo_url || '',
    playingPosition: player.playing_position || '',
    playerGrade: player.player_grade || '',
    basePrice: player.base_price || 1000,
    timestamp: new Date().toISOString(),
  };

  g.__pdvlAuctionNotification__ = unsoldNotification;
  if (!g.__pdvlAuctionNotificationHistory__) g.__pdvlAuctionNotificationHistory__ = [];
  g.__pdvlAuctionNotificationHistory__.unshift(unsoldNotification);

  if (await hasDbConnection()) {
    try {
      const { getDbClient } = await import('./postgres.js');
      const client = await getDbClient();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE auction_players SET auction_status = 'unsold', auctioned_at = NOW() WHERE id = $1`,
          [player.id]
        );
        await client.query(
          `UPDATE auction_state SET
            active_player_id = NULL,
            current_highest_bid = 0,
            current_highest_team_id = NULL,
            hammer_stage = 0,
            last_action = $1,
            updated_at = NOW()
          WHERE id = 1`,
          [unsoldMessage]
        );
        await client.query('COMMIT');
        return { success: true, player, message: unsoldMessage, notification: unsoldNotification };
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn('[auction-db] DB mark unsold failed, using memory store:', err.message);
    }
  }

  const store = initMemoryStore();
  const memPlayer = store.players.find((p) => p.id === player.id);
  if (memPlayer) {
    memPlayer.auction_status = 'unsold';
    memPlayer.auctioned_at = new Date().toISOString();
  }

  store.state.active_player_id = null;
  store.state.current_highest_bid = 0;
  store.state.current_highest_team_id = null;
  store.state.hammer_stage = 0;
  store.state.last_action = unsoldMessage;
  store.state.last_notification = unsoldNotification;
  store.state.updated_at = new Date().toISOString();

  return { success: true, player, message: unsoldMessage, notification: unsoldNotification };
}

export async function undoLastAction() {
  const store = initMemoryStore();
  const lastHistory = store.history.pop();
  if (!lastHistory) {
    return { success: false, message: 'No recorded action to undo.' };
  }

  if (lastHistory.type === 'sale') {
    const team = store.teams.find((t) => t.id === lastHistory.team_id);
    const player = store.players.find((p) => p.id === lastHistory.player_id);

    if (team) team.remaining_purse += lastHistory.amount;
    if (player) {
      player.auction_status = 'on_hammer';
      player.sold_price = null;
      player.sold_to_team_id = null;
    }

    const undoMsg = `Reverted sale of ${player?.full_name || 'player'}. Purse restored to ${team?.team_name || 'team'}.`;

    const undoNotification = {
      id: `notif-${Date.now()}`,
      type: 'undo',
      message: undoMsg,
      timestamp: new Date().toISOString(),
    };
    g.__pdvlAuctionNotification__ = undoNotification;
    if (!g.__pdvlAuctionNotificationHistory__) g.__pdvlAuctionNotificationHistory__ = [];
    g.__pdvlAuctionNotificationHistory__.unshift(undoNotification);

    store.state.active_player_id = lastHistory.player_id;
    store.state.current_highest_bid = lastHistory.amount;
    store.state.current_highest_team_id = lastHistory.team_id;
    store.state.hammer_stage = 0;
    store.state.last_action = undoMsg;
    store.state.last_notification = undoNotification;
    store.state.updated_at = new Date().toISOString();

    return { success: true, message: undoMsg, notification: undoNotification };
  }

  return { success: false, message: 'Nothing to undo.' };
}
