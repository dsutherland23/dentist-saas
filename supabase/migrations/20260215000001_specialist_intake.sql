-- Specialist Intake: secure token-based intake link for referrals
-- Token expires 48h, one-time submission, geocode + optional GPS

-- 1. Referrals: intake token, expiry, one-time submission, location confirmed
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS intake_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS intake_token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS intake_submitted_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS location_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS intake_submission_ip INET;

-- Allow status 'location_confirmed'
ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_status_check;
ALTER TABLE referrals ADD CONSTRAINT referrals_status_check
  CHECK (status IN ('sent', 'received', 'reviewed', 'scheduled', 'completed', 'cancelled', 'location_confirmed'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_intake_token ON referrals(intake_token) WHERE intake_token IS NOT NULL;

-- 2. Specialists: optional address line 2 for intake form
ALTER TABLE specialists ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);

COMMENT ON COLUMN referrals.intake_token IS 'Secure token for specialist intake link; 48h expiry, one-time use';
COMMENT ON COLUMN referrals.intake_submission_ip IS 'Client IP at intake form submission for audit';
