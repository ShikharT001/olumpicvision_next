-- ================================================================
-- MIGRATION: Add tshirt_size + document URL columns
-- Run this once against your Supabase PostgreSQL database
-- ================================================================

-- 1. Add tshirt_size column (nullable, only filled for paid categories)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS tshirt_size TEXT;

-- 2. Add CHECK constraint for valid sizes (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'registrations_tshirt_size_check'
  ) THEN
    ALTER TABLE registrations
      ADD CONSTRAINT registrations_tshirt_size_check
      CHECK (tshirt_size IN ('S', 'M', 'L', 'XL', 'XXL'));
  END IF;
END $$;

-- 3. Add email & document URL columns (if they were not already added)
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS partner_document_url TEXT;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- 4. Refresh the admin view to include tshirt_size, email, and document URLs
DROP VIEW IF EXISTS registration_details;

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

-- Done!
SELECT 'Migration complete: tshirt_size column added.' AS status;
