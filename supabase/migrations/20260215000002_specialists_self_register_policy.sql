-- Allow authenticated users to register themselves as a specialist (user_id = auth.uid()).
-- Fixes "Server configuration error" when Add yourself as a specialist is used without service role key.
CREATE POLICY "Users can register themselves as specialist"
ON specialists FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
