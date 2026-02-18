-- Optional consent requirement in visit flow (Settings toggle)
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS require_consent_in_visit_flow BOOLEAN DEFAULT false;
