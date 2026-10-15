-- =======================================================
-- PALGHAR DISTRICT VOLLEYBALL LEAGUE (PDVL) AUCTION MODULE
-- Migration: Teams, Players, Bids & Live Auction State
-- =======================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. AUCTION TEAMS
CREATE TABLE IF NOT EXISTS auction_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  team_code VARCHAR(10) NOT NULL UNIQUE,
  logo_url TEXT,
  owner_name TEXT,
  coach_name TEXT,
  primary_color VARCHAR(20) DEFAULT '#0d6efd',
  initial_purse NUMERIC NOT NULL DEFAULT 50000,
  remaining_purse NUMERIC NOT NULL DEFAULT 50000,
  min_squad_size INT DEFAULT 8,
  max_squad_size INT DEFAULT 12,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_teams_code ON auction_teams(team_code);
CREATE INDEX IF NOT EXISTS idx_auction_teams_active ON auction_teams(is_active);

-- 2. AUCTION PLAYERS (Derived from verified volleyball_registrations)
CREATE TABLE IF NOT EXISTS auction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES volleyball_registrations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  photo_url TEXT,
  playing_position TEXT NOT NULL,
  player_category TEXT DEFAULT 'palghar_open',
  height_cm NUMERIC,
  weight_kg NUMERIC,
  team_name TEXT,
  district TEXT DEFAULT 'Palghar',
  lot_number INT DEFAULT 1,
  player_grade VARCHAR(20) DEFAULT 'Regular',
  base_price NUMERIC NOT NULL DEFAULT 1000,
  current_bid NUMERIC NOT NULL DEFAULT 0,
  sold_price NUMERIC,
  sold_to_team_id UUID REFERENCES auction_teams(id) ON DELETE SET NULL,
  auction_status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (auction_status IN ('queued', 'on_hammer', 'sold', 'unsold', 'passed')),
  bidding_order INT DEFAULT 0,
  bid_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  auctioned_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auction_players_status ON auction_players(auction_status);
CREATE INDEX IF NOT EXISTS idx_auction_players_team ON auction_players(sold_to_team_id);
CREATE INDEX IF NOT EXISTS idx_auction_players_lot ON auction_players(lot_number);
CREATE INDEX IF NOT EXISTS idx_auction_players_position ON auction_players(playing_position);

-- 3. AUCTION BIDS (Audit log of all bids placed during auction)
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auction_players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES auction_teams(id) ON DELETE CASCADE,
  bid_amount NUMERIC NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_player ON auction_bids(player_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_team ON auction_bids(team_id);

-- 4. LIVE AUCTION STATE (Single row tracking podium state for instant 1s-polling)
CREATE TABLE IF NOT EXISTS auction_state (
  id INT PRIMARY KEY DEFAULT 1,
  active_player_id UUID REFERENCES auction_players(id) ON DELETE SET NULL,
  current_highest_bid NUMERIC NOT NULL DEFAULT 0,
  current_highest_team_id UUID REFERENCES auction_teams(id) ON DELETE SET NULL,
  bid_increment NUMERIC NOT NULL DEFAULT 500,
  hammer_stage INT NOT NULL DEFAULT 0 CHECK (hammer_stage IN (0, 1, 2, 3)), -- 0: open, 1: once, 2: twice, 3: sold
  is_paused BOOLEAN NOT NULL DEFAULT false,
  last_action TEXT DEFAULT 'System Initialized',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure default single-row state exists
INSERT INTO auction_state (id, current_highest_bid, bid_increment, hammer_stage, is_paused, last_action, updated_at)
VALUES (1, 0, 500, 0, false, 'Auction System Ready', NOW())
ON CONFLICT (id) DO NOTHING;

-- RLS Settings
ALTER TABLE auction_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public auction_teams select" ON auction_teams;
CREATE POLICY "Public auction_teams select" ON auction_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public auction_players select" ON auction_players;
CREATE POLICY "Public auction_players select" ON auction_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public auction_bids select" ON auction_bids;
CREATE POLICY "Public auction_bids select" ON auction_bids FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public auction_state select" ON auction_state;
CREATE POLICY "Public auction_state select" ON auction_state FOR SELECT USING (true);
