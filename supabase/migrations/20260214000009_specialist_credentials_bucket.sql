-- Storage Bucket for Specialist Credential Uploads

-- Create private bucket for specialist credentials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('specialist-credentials', 'specialist-credentials', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Authenticated users can upload their own credentials
CREATE POLICY "Users can upload their own credentials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'specialist-credentials' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Users can read their own uploaded credentials
CREATE POLICY "Users can read their own credentials"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'specialist-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS Policy: Admins can read all credentials
CREATE POLICY "Admins can read all credentials"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'specialist-credentials'
    AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'clinic_admin')
    )
);

-- RLS Policy: Users can delete their own credentials
CREATE POLICY "Users can delete their own credentials"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'specialist-credentials'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
