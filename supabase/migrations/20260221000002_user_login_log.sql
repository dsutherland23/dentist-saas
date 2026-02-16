-- Create user_login_log table to track login events for admin visibility
CREATE TABLE IF NOT EXISTS user_login_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_log_user_id ON user_login_log(user_id);
CREATE INDEX IF NOT EXISTS idx_login_log_clinic_id ON user_login_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_login_log_logged_at ON user_login_log(logged_at DESC);

-- RLS
ALTER TABLE user_login_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own login entries
CREATE POLICY "Users can insert own login log"
    ON user_login_log FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can read all login logs for their clinic
CREATE POLICY "Admins can read clinic login logs"
    ON user_login_log FOR SELECT
    USING (
        clinic_id IN (
            SELECT clinic_id FROM users
            WHERE id = auth.uid()
            AND role IN ('clinic_admin', 'super_admin')
        )
    );

-- Users can read their own login logs
CREATE POLICY "Users can read own login logs"
    ON user_login_log FOR SELECT
    USING (user_id = auth.uid());

COMMENT ON TABLE user_login_log IS 'Records each successful login event for audit and admin visibility';
