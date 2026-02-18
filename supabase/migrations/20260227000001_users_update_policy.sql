-- Allow clinic_admin and super_admin to update users in their clinic (e.g. role)
CREATE POLICY "Admins can update users in their clinic"
ON users FOR UPDATE
USING (clinic_id = get_my_clinic_id())
WITH CHECK (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('clinic_admin', 'super_admin')
  )
);
