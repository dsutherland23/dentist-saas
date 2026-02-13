-- Relax users table constraint for demo/invitation purposes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
-- If we want to keep it, we could make it optional, but it's a PK.
-- So we just remove the FK constraint to auth.users for now.
