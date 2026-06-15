-- ================================================================
-- BOISAR VARSHA MARATHON 2026 — Supabase PostgreSQL Schema
-- Organizer: Aadhar Pratishthan | Palghar District
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. RACE CATEGORIES (exactly as per the frontend logic)
-- ================================================================
CREATE TABLE race_categories (
  code            TEXT PRIMARY KEY,
  label           TEXT NOT NULL,
  distance_km     NUMERIC(4,1) NOT NULL,
  gender_allowed  TEXT NOT NULL CHECK (gender_allowed IN ('male','female','Both','Mixed')),
  description     TEXT
);

-- Insert the categories that match the frontend values precisely
INSERT INTO race_categories (code, label, distance_km, gender_allowed, description) VALUES
  ('u14', 'U14 (Boys & Girls)', 3.0, 'Both', 'Born on or after 2013-01-01'),
  ('u17', 'U17 (Boys & Girls)', 5.0, 'Both', 'Born on or after 2010-01-01'),
  ('u19', 'U19 (Boys & Girls)', 6.0, 'Both', 'Born on or after 2008-01-01'),
  ('open_men', 'Open - Men', 11.0, 'male', 'Maharashtra State Only'),
  ('open_women', 'Open - Women', 8.0, 'female', 'Maharashtra State Only'),
  ('senior', 'Senior Citizens Fun Run', 1.0, 'Both', '55+ Years Old'),
  ('couple', 'Married Couple Fun Run', 1.0, 'Mixed', 'Couples Race');


-- ================================================================
-- 2. REGISTRATIONS TABLE
--    Maps exactly to the Registration.jsx formData
-- ================================================================
CREATE TABLE registrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name           TEXT NOT NULL,
  mobile_no           TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  gender              TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  school_college_name TEXT,
  category_code       TEXT NOT NULL REFERENCES race_categories(code),

  -- Admin specific
  registration_status TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending','confirmed','cancelled')),
  bib_number          TEXT UNIQUE,

  submitted_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ================================================================
-- 3. COMPUTED REGISTRATION DETAILS VIEW
--    Handy for the admin panel overview
-- ================================================================
CREATE OR REPLACE VIEW registration_details AS
SELECT
  r.id,
  r.full_name,
  r.mobile_no,
  r.gender,
  r.date_of_birth,
  DATE_PART('year', AGE(r.date_of_birth))::INT AS age,
  r.school_college_name,
  r.category_code,
  rc.label AS category_label,
  rc.distance_km,
  r.registration_status,
  r.bib_number,
  r.submitted_at
FROM registrations r
JOIN race_categories rc ON r.category_code = rc.code;


-- ================================================================
-- 4. AUTO-UPDATE updated_at TRIGGER
-- ================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrations_updated
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ================================================================
-- 5. ROW LEVEL SECURITY (Supabase RLS)
-- ================================================================
ALTER TABLE race_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations  ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Public categories select"
  ON race_categories FOR SELECT
  USING (true);

-- Allow public inserts for registration
CREATE POLICY "Public registration insert"
  ON registrations FOR INSERT
  WITH CHECK (true);

-- Optionally restrict reads to admins (assuming authenticated users are admins)
CREATE POLICY "Admin read registrations"
  ON registrations FOR SELECT
  USING (true); -- For now allowing all to keep admin-db simple, you can restrict this to auth.role() = 'authenticated'

-- ================================================================
-- 6. SAMPLE DATA (for testing)
-- ================================================================
INSERT INTO registrations
  (full_name, mobile_no, date_of_birth, gender, school_college_name, category_code, registration_status)
VALUES
  ('Rahul Patil', '9876543210', '2014-05-10', 'male', 'Boisar High School', 'u14', 'confirmed'),
  ('Priya Sharma', '9876543211', '2011-08-22', 'female', 'St. Xavier College', 'u17', 'confirmed'),
  ('Amit Thakur', '9876543212', '2000-03-15', 'male', 'Palghar Sports Academy', 'open_men', 'pending');
