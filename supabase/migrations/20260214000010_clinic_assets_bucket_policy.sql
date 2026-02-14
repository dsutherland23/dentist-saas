-- Ensure clinic-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('clinic-assets', 'clinic-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Grant usage on storage schema just in case (usually redundant)
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated, anon;

-- Policies for clinic-assets bucket

-- 1. Allow public read access to clinic-assets
CREATE POLICY "Public Access to Clinic Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clinic-assets');

-- 2. Allow authenticated users to upload to clinic-assets
CREATE POLICY "Authenticated users can upload clinic assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clinic-assets');

-- 3. Allow authenticated users to update their clinic assets
CREATE POLICY "Authenticated users can update clinic assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clinic-assets');

-- 4. Allow authenticated users to delete their clinic assets
CREATE POLICY "Authenticated users can delete clinic assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clinic-assets');
