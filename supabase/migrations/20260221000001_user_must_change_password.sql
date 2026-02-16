-- Add must_change_password flag and password_changed_at timestamp to users table
-- Used for forced password change on first login after invite

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN users.must_change_password IS 'If true, user must change password before accessing the app';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
