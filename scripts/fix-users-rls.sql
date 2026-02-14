-- Fix: "new row violates row-level security policy" when adding staff
-- The users table had RLS enabled but only SELECT policies.
-- Clinic admins need INSERT, UPDATE, DELETE to manage staff.

-- Ensure helper exists
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clinic admins can insert new staff into their clinic
DROP POLICY IF EXISTS "Clinic admins can insert staff" ON users;
CREATE POLICY "Clinic admins can insert staff"
ON users FOR INSERT
WITH CHECK (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.clinic_id = get_my_clinic_id()
    AND u.role IN ('clinic_admin', 'super_admin')
  )
);

-- Clinic admins can update users in their clinic
DROP POLICY IF EXISTS "Clinic admins can update staff" ON users;
CREATE POLICY "Clinic admins can update staff"
ON users FOR UPDATE
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.clinic_id = get_my_clinic_id()
    AND u.role IN ('clinic_admin', 'super_admin')
  )
)
WITH CHECK (
  clinic_id = get_my_clinic_id()
);

-- Clinic admins can delete users in their clinic
DROP POLICY IF EXISTS "Clinic admins can delete staff" ON users;
CREATE POLICY "Clinic admins can delete staff"
ON users FOR DELETE
USING (
  clinic_id = get_my_clinic_id()
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.clinic_id = get_my_clinic_id()
    AND u.role IN ('clinic_admin', 'super_admin')
  )
);
