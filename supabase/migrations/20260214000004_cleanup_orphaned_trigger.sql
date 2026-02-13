-- Drop the orphaned trigger and function that are causing signup failures
-- These were likely left over from a previous project or setup and do not match the current schema.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();
