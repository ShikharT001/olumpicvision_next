-- ================================================================
-- MIGRATION: Add 'rejected' to registration_status check constraint
-- ================================================================

-- Drop the existing check constraint
ALTER TABLE registrations
  DROP CONSTRAINT IF EXISTS registrations_registration_status_check;

-- Re-add the constraint with 'rejected' included
ALTER TABLE registrations
  ADD CONSTRAINT registrations_registration_status_check
  CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'rejected', 'payment_pending'));
