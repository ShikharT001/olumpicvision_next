-- ================================================================
-- BOISAR VARSHA MARATHON 2026 - Supabase PostgreSQL Schema
-- Organizer: Aadhar Pratishthan | Palghar District
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 1. RACE CATEGORIES
-- ================================================================
CREATE TABLE IF NOT EXISTS race_categories (
  code                TEXT PRIMARY KEY,
  label               TEXT NOT NULL,
  distance_km         NUMERIC(4,1) NOT NULL,
  gender_allowed      TEXT NOT NULL CHECK (gender_allowed IN ('male','female','Both','Mixed')),
  description         TEXT,
  payment_required    BOOLEAN NOT NULL DEFAULT false,
  fee_amount_paise    INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE race_categories
  ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fee_amount_paise INTEGER NOT NULL DEFAULT 0;

INSERT INTO race_categories
  (code, label, distance_km, gender_allowed, description, payment_required, fee_amount_paise)
VALUES
  ('u14', 'U14 (Boys & Girls)', 3.0, 'Both', 'Under 14 years only', false, 0),
  ('u17', 'U17 (Boys & Girls)', 5.0, 'Both', 'Under 17 years only', false, 0),
  ('u19', 'U19 (Boys & Girls)', 6.0, 'Both', 'Under 19 years only', false, 0),
  ('open_men', 'Open - Men', 11.0, 'male', 'Maharashtra State Only - Rs. 800 PhonePe fee', true, 80000),
  ('open_women', 'Open - Women', 8.0, 'female', 'Maharashtra State Only - Rs. 800 PhonePe fee', true, 80000),
  ('senior', 'Senior Citizens Fun Run', 1.0, 'Both', '55+ Years Old', false, 0),
  ('couple', 'Married Couple Fun Run', 1.0, 'Mixed', 'Couples Race', false, 0)
ON CONFLICT (code) DO UPDATE SET
  label = EXCLUDED.label,
  distance_km = EXCLUDED.distance_km,
  gender_allowed = EXCLUDED.gender_allowed,
  description = EXCLUDED.description,
  payment_required = EXCLUDED.payment_required,
  fee_amount_paise = EXCLUDED.fee_amount_paise;

-- ================================================================
-- 2. REGISTRATIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS registrations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name             TEXT NOT NULL,
  email                 TEXT,
  mobile_no             TEXT NOT NULL,
  date_of_birth         DATE NOT NULL,
  gender                TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  school_college_name   TEXT,
  category_code         TEXT NOT NULL REFERENCES race_categories(code),

  registration_status   TEXT DEFAULT 'pending' CHECK (registration_status IN ('pending','confirmed','cancelled')),
  bib_number            TEXT UNIQUE,

  payment_required      BOOLEAN NOT NULL DEFAULT false,
  payment_status        TEXT NOT NULL DEFAULT 'not_required'
                          CHECK (payment_status IN ('not_required','payment_pending','paid','failed','cancelled')),
  fee_amount_paise      INTEGER NOT NULL DEFAULT 0,

  -- T-shirt size: only set for open (paid) categories
  tshirt_size           TEXT CHECK (tshirt_size IN ('S', 'M', 'L', 'XL', 'XXL')),

  document_url          TEXT,
  partner_document_url  TEXT,
  payment_screenshot_url TEXT,

  submitted_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS fee_amount_paise INTEGER NOT NULL DEFAULT 0;

-- Migration: add tshirt_size column if it doesn't exist yet
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS tshirt_size TEXT CHECK (tshirt_size IN ('S', 'M', 'L', 'XL', 'XXL'));

-- Migration: add document URL columns if they don't exist yet
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS partner_document_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'registrations_payment_status_check'
  ) THEN
    ALTER TABLE registrations
      ADD CONSTRAINT registrations_payment_status_check
      CHECK (payment_status IN ('not_required','payment_pending','paid','failed','cancelled'));
  END IF;
END $$;

UPDATE registrations r
SET
  payment_required = rc.payment_required,
  fee_amount_paise = rc.fee_amount_paise,
  payment_status = CASE
    WHEN rc.payment_required AND r.payment_status = 'not_required' THEN 'payment_pending'
    ELSE r.payment_status
  END
FROM race_categories rc
WHERE r.category_code = rc.code;

-- ================================================================
-- 3. PAYMENT TRANSACTIONS TABLE
--    Stores PhonePe order/payment updates for admin visibility
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id       UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  category_code         TEXT NOT NULL REFERENCES race_categories(code),
  amount_paise          INTEGER NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'INR',
  provider              TEXT NOT NULL DEFAULT 'phonepe',
  provider_order_id     TEXT UNIQUE,
  provider_payment_id   TEXT,
  provider_signature    TEXT,
  status                TEXT NOT NULL DEFAULT 'created'
                          CHECK (status IN ('created','captured','failed','cancelled')),
  failure_reason        TEXT,
  raw_response          JSONB,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_registration_id
  ON payment_transactions(registration_id);

-- ================================================================
-- 4. COMPUTED ADMIN VIEWS
-- ================================================================
DROP VIEW IF EXISTS registration_details;
DROP VIEW IF EXISTS payment_transaction_details;

CREATE OR REPLACE VIEW registration_details AS
SELECT
  r.id,
  r.full_name,
  r.email,
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
  r.payment_required,
  r.payment_status,
  r.fee_amount_paise,
  (r.fee_amount_paise / 100.0)::NUMERIC(10,2) AS fee_amount_rupees,
  r.tshirt_size,
  r.document_url,
  r.partner_document_url,
  r.payment_screenshot_url,
  pt.provider_order_id,
  pt.provider_payment_id,
  pt.status AS transaction_status,
  pt.paid_at,
  r.submitted_at
FROM registrations r
JOIN race_categories rc ON r.category_code = rc.code
LEFT JOIN LATERAL (
  SELECT *
  FROM payment_transactions pt
  WHERE pt.registration_id = r.id
  ORDER BY pt.created_at DESC
      LIMIT 1
) pt ON true;

CREATE OR REPLACE VIEW payment_transaction_details AS
SELECT
  pt.id,
  r.full_name AS sender_name,
  r.mobile_no AS sender_mobile_no,
  r.gender AS sender_gender,
  r.date_of_birth AS sender_date_of_birth,
  DATE_PART('year', AGE(r.date_of_birth))::INT AS sender_age,
  r.school_college_name,
  pt.registration_id,
  pt.category_code,
  rc.label AS category_label,
  pt.amount_paise,
  (pt.amount_paise / 100.0)::NUMERIC(10,2) AS amount_rupees,
  pt.currency,
  pt.provider,
  pt.provider_order_id,
  pt.provider_payment_id,
  pt.status AS transaction_status,
  r.payment_status AS registration_payment_status,
  r.registration_status,
  pt.failure_reason,
  pt.paid_at,
  pt.created_at,
  pt.updated_at,
  pt.raw_response
FROM payment_transactions pt
JOIN registrations r ON r.id = pt.registration_id
JOIN race_categories rc ON rc.code = pt.category_code;

-- ================================================================
-- 5. AUTO-UPDATE updated_at TRIGGERS
-- ================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrations_updated ON registrations;
CREATE TRIGGER trg_registrations_updated
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payment_transactions_updated ON payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- 6. ROW LEVEL SECURITY (Supabase RLS)
-- ================================================================
ALTER TABLE race_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public categories select" ON race_categories;
CREATE POLICY "Public categories select"
  ON race_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public registration insert" ON registrations;
CREATE POLICY "Public registration insert"
  ON registrations FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin read registrations" ON registrations;
CREATE POLICY "Admin read registrations"
  ON registrations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin read payment transactions" ON payment_transactions;
CREATE POLICY "Admin read payment transactions"
  ON payment_transactions FOR SELECT
  USING (true);

-- ================================================================
-- 7. SAMPLE DATA (for testing)
-- ================================================================
INSERT INTO registrations
  (
    full_name,
    mobile_no,
    date_of_birth,
    gender,
    school_college_name,
    category_code,
    registration_status,
    payment_required,
    payment_status,
    fee_amount_paise
  )
VALUES
  ('Rahul Patil', '9876543210', '2014-05-10', 'male', 'Boisar High School', 'u14', 'confirmed', false, 'not_required', 0),
  ('Priya Sharma', '9876543211', '2011-08-22', 'female', 'St. Xavier College', 'u17', 'confirmed', false, 'not_required', 0),
  ('Amit Thakur', '9876543212', '2000-03-15', 'male', 'Palghar Sports Academy', 'open_men', 'pending', true, 'payment_pending', 80000)
ON CONFLICT DO NOTHING;
