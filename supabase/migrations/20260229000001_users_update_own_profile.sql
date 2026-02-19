-- Allow any authenticated user to update their own profile row (e.g. first_name, last_name).
-- Used by Settings → Your Profile. Admins already have update via "Admins can update users in their clinic";
-- this policy lets non-admins update only their own row.
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
