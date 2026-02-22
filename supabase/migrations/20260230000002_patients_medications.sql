-- Add medications column to patients for current medications list
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS medications TEXT;

COMMENT ON COLUMN patients.medications IS 'Current medications (free text or list)';
