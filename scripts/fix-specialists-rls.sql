-- Fix: Allow admins to add specialists (insert with user_id null, status approved)
-- Clinic admins and super_admins can insert new specialist records directly.

DROP POLICY IF EXISTS "Admins can add specialists" ON specialists;
CREATE POLICY "Admins can add specialists"
ON specialists FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('clinic_admin', 'super_admin')
  )
);
