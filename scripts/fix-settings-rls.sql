-- Fix: "Save changes" on Settings page not working (RLS blocking clinic update)
-- Run this in Supabase SQL Editor.

-- Ensure get_my_clinic_id exists
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow clinic admins to UPDATE their own clinic row
DROP POLICY IF EXISTS "Clinic admins can update their clinic" ON clinics;
CREATE POLICY "Clinic admins can update their clinic"
ON clinics FOR UPDATE
USING (id = get_my_clinic_id())
WITH CHECK (id = get_my_clinic_id());
