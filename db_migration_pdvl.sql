-- PALGHAR DISTRICT VOLLEYBALL LEAGUE (PDVL) 2026/27
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS volleyball_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  mobile_no TEXT NOT NULL UNIQUE CHECK (mobile_no ~ '^[6-9][0-9]{9}$'),
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  photo_url TEXT,
  district TEXT NOT NULL DEFAULT 'Palghar',
  team_name TEXT NOT NULL,
  playing_position TEXT NOT NULL,
  jersey_size TEXT NOT NULL CHECK (jersey_size IN ('s', 'm', 'l', 'xl', 'xxl')),
  emergency_contact_phone TEXT NOT NULL CHECK (emergency_contact_phone ~ '^[6-9][0-9]{9}$'),
  typed_signature TEXT NOT NULL,
  undertaking_accepted BOOLEAN NOT NULL DEFAULT false,
  medical_consent BOOLEAN NOT NULL DEFAULT false,
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'approved', 'rejected', 'cancelled')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volleyball_registrations_team_name ON volleyball_registrations(team_name);
CREATE INDEX IF NOT EXISTS idx_volleyball_registrations_status ON volleyball_registrations(registration_status);

-- A single emergency phone number is sufficient; remove the duplicate name field
-- created by the initial PDVL registration version.
ALTER TABLE volleyball_registrations
  DROP COLUMN IF EXISTS emergency_contact_name;

ALTER TABLE volleyball_registrations
  DROP COLUMN IF EXISTS medical_notes;

ALTER TABLE volleyball_registrations
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE volleyball_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public volleyball registration insert" ON volleyball_registrations;
CREATE POLICY "Public volleyball registration insert" ON volleyball_registrations FOR INSERT WITH CHECK (true);
