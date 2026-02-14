-- Add check-in / check-out timestamp columns and trigger (for existing DBs)
-- Run in Supabase SQL Editor so "Check in" and "Complete" record actual times.

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;

-- Trigger: set timestamps when status changes (so API only needs to update status)
CREATE OR REPLACE FUNCTION set_appointment_checkin_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_in' AND (OLD.checked_in_at IS NULL OR OLD.status IS DISTINCT FROM 'checked_in') THEN
    NEW.checked_in_at := timezone('utc'::text, now());
  END IF;
  IF NEW.status = 'completed' THEN
    NEW.checked_out_at := timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_appointment_checkin_timestamps ON appointments;
CREATE TRIGGER trigger_set_appointment_checkin_timestamps
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_checkin_timestamps();
