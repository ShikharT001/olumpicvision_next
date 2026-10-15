-- ================================================================
-- BOISAR VARSHA MARATHON 2026 — Document Verification Migration
-- Run this SQL in Supabase SQL Editor to add identity document
-- upload support to the registrations table.
-- ================================================================

-- 1. Add document URL columns to registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS document_url          TEXT,
  ADD COLUMN IF NOT EXISTS partner_document_url  TEXT;

-- Comments for clarity
COMMENT ON COLUMN registrations.document_url
  IS 'Cloudinary URL of the participant identity proof (Aadhaar/PAN/Passport)';

COMMENT ON COLUMN registrations.partner_document_url
  IS 'Cloudinary URL of the partner identity proof – required only for the couple category';

-- ================================================================
-- 2. Recreate the registration_details view to include doc columns
-- ================================================================
DROP VIEW IF EXISTS registration_details;

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
  r.payment_required,
  r.payment_status,
  r.fee_amount_paise,
  (r.fee_amount_paise / 100.0)::NUMERIC(10,2) AS fee_amount_rupees,
  r.document_url,
  r.partner_document_url,
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

-- ================================================================
-- 3. RLS – allow admin reads on the new columns (already covered
--    by the existing "Admin read registrations" policy, no change
--    needed). Just verify RLS is still on:
-- ================================================================
-- ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;  -- already set

-- ================================================================
-- 4. Optional: Add an index to help filter by registration_status
--    (useful for the "pending" filter admin uses for confirming)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_registrations_status
  ON registrations(registration_status);

-- ================================================================
-- DONE. Your registrations table now has:
--   document_url          — participant identity proof (required)
--   partner_document_url  — partner proof (required for couple)
--
-- The registration_details view now surfaces both columns.
-- ================================================================
