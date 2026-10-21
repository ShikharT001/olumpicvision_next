-- =======================================================
-- PALGHAR DISTRICT VOLLEYBALL LEAGUE (PDVL) AUCTION MODULE
-- Migration: Teams, Players, Bids & Live Auction State
-- Idempotent — safe to run multiple times
-- =======================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. AUCTION TOURNAMENTS (Multi-Sport & Multi-Tournament Engine)
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

-- Ensure default initial PDVL volleyball tournament exists
INSERT INTO auction_tournaments (id, sport_id, sport_name, tournament_name, slug, season_year, venue, default_purse, min_bid_increment, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'volleyball', 'Volleyball', 'Palghar District Volleyball League 2026/27', 'pdvl-2026', '2026/27', 'Palghar Sports Complex', 100000, 500, 'active')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUCTION TEAMS
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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auction_teams ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE;
UPDATE auction_teams SET tournament_id = '00000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_auction_teams_tournament ON auction_teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_teams_code ON auction_teams(team_code);
CREATE INDEX IF NOT EXISTS idx_auction_teams_active ON auction_teams(is_active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AUCTION PLAYERS
--    Standalone table — players can be added directly without a volleyball
--    registration, OR imported from volleyball_registrations (when it exists).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE,
  registration_id UUID,                  -- Optional FK to volleyball_registrations
  full_name TEXT NOT NULL,
  photo_url TEXT,
  playing_position TEXT NOT NULL,
  player_category TEXT DEFAULT 'palghar_open',
  height_cm NUMERIC,
  weight_kg NUMERIC,
  team_name TEXT,                        -- Source club / school name
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

ALTER TABLE auction_players ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE;
UPDATE auction_players SET tournament_id = '00000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_auction_players_tournament ON auction_players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(auction_status);
CREATE INDEX IF NOT EXISTS idx_auction_players_team ON auction_players(sold_to_team_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_lot ON auction_players(lot_number);
CREATE INDEX IF NOT EXISTS idx_auction_players_position ON auction_players(playing_position);
CREATE INDEX IF NOT EXISTS idx_auction_players_order ON auction_players(bidding_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. AUCTION BIDS — Full audit log of every bid placed
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
-- 4. LIVE AUCTION STATE — Scoped per tournament (polled every ~1.5 s by clients)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auction_state (
  id INT PRIMARY KEY DEFAULT 1,
  tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE,
  active_player_id UUID REFERENCES auction_players(id) ON DELETE SET NULL,
  current_highest_bid NUMERIC NOT NULL DEFAULT 0,
  current_highest_team_id UUID REFERENCES auction_teams(id) ON DELETE SET NULL,
  bid_increment NUMERIC NOT NULL DEFAULT 500,
  hammer_stage INT NOT NULL DEFAULT 0
    CHECK (hammer_stage IN (0, 1, 2, 3)),  -- 0=open, 1=once, 2=twice, 3=sold
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_action TEXT DEFAULT 'Auction System Ready',
  last_notification JSONB,               -- Latest SOLD / UNSOLD broadcast JSON
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auction_state ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES auction_tournaments(id) ON DELETE CASCADE;
UPDATE auction_state SET tournament_id = '00000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;

-- Guarantee the singleton default row exists
INSERT INTO auction_state (id, tournament_id, current_highest_bid, bid_increment, hammer_stage, is_paused, last_action, updated_at)
VALUES (1, '00000000-0000-0000-0000-000000000001', 0, 500, 0, false, 'Auction System Ready', NOW())
ON CONFLICT (id) DO NOTHING;

-- Add last_notification column if upgrading from older schema
ALTER TABLE auction_state ADD COLUMN IF NOT EXISTS last_notification JSONB;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AUTO-UPDATED updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auction_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auction_teams_updated ON auction_teams;
CREATE TRIGGER trg_auction_teams_updated
  BEFORE UPDATE ON auction_teams
  FOR EACH ROW EXECUTE FUNCTION auction_set_updated_at();

DROP TRIGGER IF EXISTS trg_auction_state_updated ON auction_state;
CREATE TRIGGER trg_auction_state_updated
  BEFORE UPDATE ON auction_state
  FOR EACH ROW EXECUTE FUNCTION auction_set_updated_at();

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
