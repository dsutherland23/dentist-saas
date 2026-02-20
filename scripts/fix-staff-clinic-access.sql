-- Fix staff clinic access by updating users.clinic_id
-- Run this in Supabase SQL Editor.
--
-- This script is intended for one-time repairs when a staff member
-- (e.g. receptionist) cannot see clinic data because their row in
-- public.users has:
--   - clinic_id = NULL, or
--   - clinic_id pointing to the wrong clinic.
--
-- Data access is enforced by Row Level Security (RLS) that uses:
--   get_my_clinic_id() = (SELECT clinic_id FROM users WHERE id = auth.uid());
--
-- So BOTH of these must be true:
--   1) public.users.id = auth.users.id
--   2) public.users.clinic_id is the correct clinic UUID
--
-- IMPORTANT:
-- - Adjust the email/clinic values below for your environment.
-- - Do NOT commit real email addresses to version control.

------------------------------------------------------------
-- STEP 1: Find the clinic_id you want to use
------------------------------------------------------------

-- Option A: Get clinic_id by clinic name
-- Replace 'Your Clinic Name' with the actual clinic name.
-- SELECT id, name
-- FROM clinics
-- WHERE name ILIKE '%Your Clinic Name%';

-- Option B: Get clinic_id for the currently logged-in admin
-- (Run this while logged in as the clinic admin in Supabase SQL Editor
--  using the \"Run as authenticated user\" option, if available.)
-- SELECT clinic_id
-- FROM users
-- WHERE id = auth.uid();

------------------------------------------------------------
-- STEP 2: Set variables for the staff email and clinic_id
------------------------------------------------------------

-- Replace with the staff member's email (e.g. receptionist).
\set staff_email 'kaydaana.sutherland@example.com'

-- Replace with the correct clinic UUID (from STEP 1).
\set target_clinic_id '00000000-0000-0000-0000-000000000000'

------------------------------------------------------------
-- STEP 3: Inspect current user row before changing anything
------------------------------------------------------------

SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  clinic_id,
  is_active
FROM users
WHERE email ILIKE :'staff_email';

------------------------------------------------------------
-- STEP 4: Update clinic_id for this staff member
------------------------------------------------------------

UPDATE users
SET clinic_id = :'target_clinic_id'
WHERE email ILIKE :'staff_email'
  AND (clinic_id IS NULL OR clinic_id <> :'target_clinic_id');

------------------------------------------------------------
-- STEP 5: Verify the change
------------------------------------------------------------

SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  clinic_id,
  is_active
FROM users
WHERE email ILIKE :'staff_email';

-- After running this script:
-- - Have the staff member sign out of the app and sign back in.
-- - Once their session is refreshed, RLS should allow them to
--   see data for the clinic identified by target_clinic_id.

