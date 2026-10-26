-- =======================================================
-- MULTI-SPORT AUCTION SYSTEM MIGRATION
-- Supports Tournaments, Sports, Teams, Players & Live State
-- Idempotent — safe to run multiple times
-- =======================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUCTION TOURNAMENTS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id VARCHAR(50) NOT NULL,
  sport_name VARCHAR(100) NOT NULL,
  tournament_name TEXT NOT NULL,
  slug VARCHAR(100) UNIQUE,
  season_year VARCHAR(20) DEFAULT '2026/27',
  venue TEXT,
  banner_url TEXT,
  default_purse NUMERIC NOT NULL DEFAULT 100000,
  min_bid_increment NUMERIC NOT NULL DEFAULT 500,
  min_squad_size INT DEFAULT 8,
  max_squad_size INT DEFAULT 15,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_tournaments_sport ON auction_tournaments(sport_id);
CREATE INDEX IF NOT EXISTS idx_auction_tournaments_slug ON auction_tournaments(slug);

-- Seed Initial Tournaments for All Standard Sports
INSERT INTO auction_tournaments (id, sport_id, sport_name, tournament_name, slug, season_year, venue, default_purse, min_bid_increment, min_squad_size, max_squad_size, status)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'volleyball', 'Volleyball', 'Palghar District Volleyball League 2026/27', 'pdvl-2026', '2026/27', 'Palghar Sports Complex', 100000, 500, 8, 12, 'active'),
  ('00000000-0000-0000-0000-000000000002', 'football', 'Football', 'Palghar District Premier Football Cup 2026', 'pdfc-2026', '2026/27', 'Tarapur Atomic Arena, Boisar', 200000, 1000, 11, 18, 'active'),
  ('00000000-0000-0000-0000-000000000003', 'kabaddi', 'Kabaddi', 'Palghar Pro Kabaddi League Championship 2026', 'ppkc-2026', 'Season 4', 'Manor Sports Pavilion, Manor', 150000, 500, 7, 14, 'active'),
  ('00000000-0000-0000-0000-000000000004', 'khokho', 'Kho-Kho', 'Maharashtra State District Kho-Kho Trophy 2026', 'dkkc-2026', '2026', 'Dahanu Coastal Grounds, Dahanu', 100000, 500, 9, 15, 'active'),
  ('00000000-0000-0000-0000-000000000005', 'cricket', 'Cricket', 'Palghar Super League T20 Championship 2026', 'psl-t20-2026', '2026', 'Kelva Green Oval, Kelva', 500000, 2000, 11, 16, 'active'),
  ('00000000-0000-0000-0000-000000000006', 'badminton', 'Badminton', 'District Badminton Super Series 2026', 'dbss-2026', '2026', 'Virar Indoor Badminton Stadium, Virar', 100000, 500, 4, 8, 'active')
ON CONFLICT (id) DO UPDATE SET
  sport_id = EXCLUDED.sport_id,
  sport_name = EXCLUDED.sport_name,
  tournament_name = EXCLUDED.tournament_name,
  slug = EXCLUDED.slug;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AUCTION TEAMS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_code VARCHAR(10) NOT NULL,
  logo_url TEXT,
  owner_name TEXT,
  coach_name TEXT,
  primary_color VARCHAR(20) DEFAULT '#0d6efd',
  initial_purse NUMERIC NOT NULL DEFAULT 100000,
  remaining_purse NUMERIC NOT NULL DEFAULT 100000,
  min_squad_size INT DEFAULT 8,
  max_squad_size INT DEFAULT 12,
  display_order INT DEFAULT 0,
  pool_group VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auction_teams ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE;
ALTER TABLE auction_teams ADD COLUMN IF NOT EXISTS pool_group VARCHAR(20);
UPDATE auction_teams SET tournament_id = '00000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_auction_teams_tournament ON auction_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_teams_code ON auction_teams(team_code);
CREATE INDEX IF NOT EXISTS idx_auction_teams_pool ON auction_teams(pool_group);
CREATE INDEX IF NOT EXISTS idx_auction_teams_active ON auction_teams(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUCTION PLAYERS (COMMON PLAYER REGISTRY ACROSS SPORTS & TOURNAMENTS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE SET NULL,
  sport_id VARCHAR(50) DEFAULT 'volleyball',
  registration_id UUID,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  playing_position TEXT NOT NULL,
  player_category TEXT DEFAULT 'open',
  height_cm NUMERIC,
  weight_kg NUMERIC,
  team_name TEXT,
  district TEXT DEFAULT 'Palghar',
  lot_number INT DEFAULT 1,
  player_grade VARCHAR(20) DEFAULT 'Grade A',
  base_price NUMERIC NOT NULL DEFAULT 1000,
  current_bid NUMERIC NOT NULL DEFAULT 0,
  sold_price NUMERIC,
  sold_to_team_id UUID REFERENCES auction_teams(id) ON DELETE SET NULL,
  auction_status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (auction_status IN ('queued', 'on_hammer', 'sold', 'unsold', 'passed')),
  bidding_order INT DEFAULT 0,
  bid_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auctioned_at TIMESTAMPTZ
);

ALTER TABLE auction_players ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE SET NULL;
ALTER TABLE auction_players ADD COLUMN IF NOT EXISTS sport_id VARCHAR(50) DEFAULT 'volleyball';
UPDATE auction_players SET tournament_id = '00000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;
UPDATE auction_players SET sport_id = 'volleyball' WHERE sport_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_auction_players_tournament ON auction_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_sport ON auction_players(sport_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_category ON auction_players(player_category);
CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(auction_status);
CREATE INDEX IF NOT EXISTS idx_auction_players_team ON auction_players(sold_to_team_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_lot ON auction_players(lot_number);
CREATE INDEX IF NOT EXISTS idx_auction_players_position ON auction_players(playing_position);
CREATE INDEX IF NOT EXISTS idx_auction_players_order ON auction_players(bidding_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUCTION BIDS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auction_players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES auction_teams(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_player ON auction_bids(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_team ON auction_bids(team_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_placed ON auction_bids(placed_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LIVE AUCTION STATE (SCOPED PER TOURNAMENT)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_state (
  tournament_id UUID PRIMARY KEY REFERENCES auction_tournaments(id) ON DELETE CASCADE,
  active_player_id UUID REFERENCES auction_players(id) ON DELETE SET NULL,
  current_highest_bid NUMERIC NOT NULL DEFAULT 0,
  current_highest_team_id UUID REFERENCES auction_teams(id) ON DELETE SET NULL,
  bid_increment NUMERIC NOT NULL DEFAULT 500,
  hammer_stage INT NOT NULL DEFAULT 0
    CHECK (hammer_stage IN (0, 1, 2, 3)),
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_action TEXT DEFAULT 'Auction System Ready',
  last_notification JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auction_state ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE;
ALTER TABLE auction_state ADD COLUMN IF NOT EXISTS last_notification JSONB;
UPDATE auction_state SET tournament_id = '00000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;

-- If table was created earlier with 'id' column, adjust primary key cleanly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auction_state' AND column_name = 'id') THEN
    ALTER TABLE auction_state DROP CONSTRAINT IF EXISTS auction_state_pkey;
    ALTER TABLE auction_state DROP COLUMN IF EXISTS id;
    ALTER TABLE auction_state ADD PRIMARY KEY (tournament_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Initialize Live State for all default tournaments
INSERT INTO auction_state (tournament_id, current_highest_bid, bid_increment, hammer_stage, is_paused, last_action, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 0, 500, 0, false, 'Auction System Ready', NOW()),
  ('00000000-0000-0000-0000-000000000002', 0, 1000, 0, false, 'Auction System Ready', NOW()),
  ('00000000-0000-0000-0000-000000000003', 0, 500, 0, false, 'Auction System Ready', NOW()),
  ('00000000-0000-0000-0000-000000000004', 0, 500, 0, false, 'Auction System Ready', NOW()),
  ('00000000-0000-0000-0000-000000000005', 0, 2000, 0, false, 'Auction System Ready', NOW()),
  ('00000000-0000-0000-0000-000000000006', 0, 500, 0, false, 'Auction System Ready', NOW())
ON CONFLICT (tournament_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE auction_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public auction_tournaments select" ON auction_tournaments;
CREATE POLICY "Public auction_tournaments select" ON auction_tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Server auction_tournaments all" ON auction_tournaments;
CREATE POLICY "Server auction_tournaments all" ON auction_tournaments FOR ALL USING (true);

DROP POLICY IF EXISTS "Public auction_teams select" ON auction_teams;
CREATE POLICY "Public auction_teams select" ON auction_teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Server auction_teams all" ON auction_teams;
CREATE POLICY "Server auction_teams all" ON auction_teams FOR ALL USING (true);

DROP POLICY IF EXISTS "Public auction_players select" ON auction_players;
CREATE POLICY "Public auction_players select" ON auction_players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Server auction_players all" ON auction_players;
CREATE POLICY "Server auction_players all" ON auction_players FOR ALL USING (true);

DROP POLICY IF EXISTS "Public auction_bids select" ON auction_bids;
CREATE POLICY "Public auction_bids select" ON auction_bids FOR SELECT USING (true);
DROP POLICY IF EXISTS "Server auction_bids all" ON auction_bids;
CREATE POLICY "Server auction_bids all" ON auction_bids FOR ALL USING (true);

DROP POLICY IF EXISTS "Public auction_state select" ON auction_state;
CREATE POLICY "Public auction_state select" ON auction_state FOR SELECT USING (true);
DROP POLICY IF EXISTS "Server auction_state all" ON auction_state;
CREATE POLICY "Server auction_state all" ON auction_state FOR ALL USING (true);
