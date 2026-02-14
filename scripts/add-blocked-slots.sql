-- Run this in Supabase SQL Editor if blocked_slots table doesn't exist
-- or if you're getting "Failed to create blocked slot"

-- Create blocked_slots table
CREATE TABLE IF NOT EXISTS blocked_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_block_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_clinic ON blocked_slots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_staff ON blocked_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_start ON blocked_slots(start_time);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (from migration or previous runs)
DROP POLICY IF EXISTS "Users can view blocked slots in their clinic" ON blocked_slots;
DROP POLICY IF EXISTS "Clinic staff can manage blocked slots" ON blocked_slots;

-- Clinic staff can view and manage blocked slots (same as appointments)
CREATE POLICY "Clinic staff can manage blocked slots"
ON blocked_slots FOR ALL
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()))
WITH CHECK (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()));
