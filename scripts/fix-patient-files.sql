-- Create patient_files table if missing (fixes "Failed to save file record" on upload)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS patient_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'document',
    file_path TEXT NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_patient_files_patient ON patient_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_clinic ON patient_files(clinic_id);

ALTER TABLE patient_files ENABLE ROW LEVEL SECURITY;

-- Ensure get_my_clinic_id exists
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Clinic staff can manage patient files" ON patient_files;
CREATE POLICY "Clinic staff can manage patient files" ON patient_files FOR ALL
USING (clinic_id = get_my_clinic_id())
WITH CHECK (clinic_id = get_my_clinic_id());
