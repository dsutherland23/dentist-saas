-- Fix: "new row violates row-level security policy" on storage uploads
-- Run this in Supabase SQL Editor if you get that error when uploading patient files or clinic assets.

-- Ensure get_my_clinic_id exists (from bootstrap/full setup)
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Patient files: allow clinic staff to upload/read/update/delete for their clinic's patients
-- Path format in app: patient_id/filename
DROP POLICY IF EXISTS "Clinic staff can upload patient files" ON storage.objects;
CREATE POLICY "Clinic staff can upload patient files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

DROP POLICY IF EXISTS "Clinic staff can read patient files" ON storage.objects;
CREATE POLICY "Clinic staff can read patient files" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

DROP POLICY IF EXISTS "Clinic staff can update patient files" ON storage.objects;
CREATE POLICY "Clinic staff can update patient files" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

DROP POLICY IF EXISTS "Clinic staff can delete patient files" ON storage.objects;
CREATE POLICY "Clinic staff can delete patient files" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

-- Clinic assets: ensure authenticated upload/update/delete (if not already present)
DROP POLICY IF EXISTS "Authenticated users can upload clinic assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload clinic assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Authenticated users can update clinic assets" ON storage.objects;
CREATE POLICY "Authenticated users can update clinic assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Authenticated users can delete clinic assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete clinic assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'clinic-assets');
