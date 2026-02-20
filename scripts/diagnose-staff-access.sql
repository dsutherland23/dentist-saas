-- Diagnose staff clinic access issues
-- Run this in Supabase SQL Editor.
-- This script helps you confirm why a staff member (e.g. receptionist)
-- is not seeing clinic data (patients, appointments, etc.).
--
-- IMPORTANT:
-- - Do NOT commit real email addresses to version control.
-- - Replace the placeholder email with the staff member's actual email
--   when running this script in your own project.

-- 1) Set the staff email you want to diagnose
-- NOTE: Replace the example email with the real one BEFORE running.
\set staff_email 'kaydaana.sutherland@example.com'

-- 2) Check the public.users row for this email
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  clinic_id,
  is_active,
  must_change_password
FROM users
WHERE email ILIKE :'staff_email';

-- 3) (Optional) Check which clinic this clinic_id belongs to
--    Copy the clinic_id from the query above and paste it here.
--    If clinic_id is NULL, this will return no rows.
-- SELECT id, name, subscription_plan, subscription_status
-- FROM clinics
-- WHERE id = 'PASTE-CLINIC-ID-HERE';

-- 4) (Manual step in Supabase Dashboard)
--    Go to Authentication → Users and search by the same email.
--    Confirm that:
--      - The Auth user exists
--      - The Auth user ID matches the `id` you see in public.users
--
-- Data access relies on:
--   get_my_clinic_id() = (SELECT clinic_id FROM users WHERE id = auth.uid());
--
-- So BOTH of these must be true:
--   - public.users.id = auth.users.id
--   - public.users.clinic_id is the correct clinic UUID

