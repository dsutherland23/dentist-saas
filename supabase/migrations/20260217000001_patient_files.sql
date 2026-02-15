-- Patient files table (metadata for files stored in Supabase Storage bucket 'patient-files')
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

DROP POLICY IF EXISTS "Clinic staff can manage patient files" ON patient_files;
CREATE POLICY "Clinic staff can manage patient files" ON patient_files FOR ALL
USING (clinic_id = get_my_clinic_id())
WITH CHECK (clinic_id = get_my_clinic_id());
