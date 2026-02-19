-- Set Dr. Wright (or any user with last name "Wright") to clinic_admin.
-- Run in Supabase Dashboard: SQL Editor → New query → paste and Run.
-- Use one of the options below.

-- Option A: By last name (matches "Dr. Wright", "Jane Wright", etc.)
UPDATE users
SET role = 'clinic_admin'
WHERE last_name ILIKE 'Wright'
  AND role != 'patient'
  AND (is_active IS NULL OR is_active = true);

-- Option B: By full name containing "Wright" (if you use different name format)
-- UPDATE users
-- SET role = 'clinic_admin'
-- WHERE (first_name || ' ' || last_name) ILIKE '%Wright%'
--   AND role != 'patient'
--   AND (is_active IS NULL OR is_active = true);

-- Option C: By exact email (replace with Dr. Wright's email)
-- UPDATE users
-- SET role = 'clinic_admin'
-- WHERE email = 'dr.wright@yourclinic.com';

-- Check result (optional)
-- SELECT id, email, first_name, last_name, role FROM users WHERE last_name ILIKE 'Wright';
