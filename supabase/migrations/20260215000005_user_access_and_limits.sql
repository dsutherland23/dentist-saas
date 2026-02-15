-- Add allowed_sections and limits columns to users table for granular access control
-- This supports the multi-user architecture with per-user section access and usage limits

-- Add allowed_sections: array of section keys (null = full access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_sections text[];

-- Add limits: jsonb for usage limits (e.g., max patients, appointments per month)
ALTER TABLE users ADD COLUMN IF NOT EXISTS limits jsonb DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN users.allowed_sections IS 'Array of section keys user can access. NULL or empty = full access. Example: [''dashboard'', ''calendar'', ''patients'']';
COMMENT ON COLUMN users.limits IS 'Usage limits per user. Example: {"patients": 500, "appointments_per_month": 200}. Missing keys = unlimited.';
