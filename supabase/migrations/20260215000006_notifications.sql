-- Notifications: per-user in-app notifications (bell dropdown).
-- See docs/notifications-design.md for types and usage.
-- If you already have a notifications table without user_id, add a migration to add it and backfill or leave NULL for legacy rows.

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type TEXT,
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_clinic ON notifications (clinic_id);

COMMENT ON TABLE notifications IS 'In-app notifications per recipient (user_id). Created by backend; users read/update own only.';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications (mark read)"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow staff to create notifications for the same clinic (e.g. admin approves time off → insert for employee).
CREATE POLICY "Users can insert notifications for same clinic"
    ON notifications FOR INSERT
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );
