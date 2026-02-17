-- Team Planner Module Migration
-- Created: 2026-02-13

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff Schedules Table (Recurring Weekly Schedules)
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation: end_time must be after start_time
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    
    -- Prevent duplicate schedules for same staff/day
    CONSTRAINT unique_staff_day UNIQUE (staff_id, day_of_week, start_time)
);

-- Staff Schedule Overrides (One-time exceptions)
CREATE TABLE IF NOT EXISTS staff_schedule_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    override_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation: if times are provided, end must be after start
    CONSTRAINT valid_override_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    
    -- One override per staff per date
    CONSTRAINT unique_staff_override_date UNIQUE (staff_id, override_date)
);

-- Time Off Requests
CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation: end_date must be >= start_date
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_schedules_clinic ON staff_schedules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_day ON staff_schedules(day_of_week);

CREATE INDEX IF NOT EXISTS idx_schedule_overrides_clinic ON staff_schedule_overrides(clinic_id);
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_staff ON staff_schedule_overrides(staff_id);
CREATE INDEX IF NOT EXISTS idx_schedule_overrides_date ON staff_schedule_overrides(override_date);

CREATE INDEX IF NOT EXISTS idx_time_off_clinic ON time_off_requests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_time_off_staff ON time_off_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_dates ON time_off_requests(start_date, end_date);

-- Audit Logging Table
CREATE TABLE IF NOT EXISTS team_planner_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'approve', 'reject')),
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_clinic ON team_planner_audit_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON team_planner_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON team_planner_audit_log(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_planner_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_schedules
DROP POLICY IF EXISTS "Users can view schedules in their clinic" ON staff_schedules;
CREATE POLICY "Users can view schedules in their clinic"
    ON staff_schedules FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage schedules" ON staff_schedules;
CREATE POLICY "Admins can manage schedules"
    ON staff_schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND clinic_id = staff_schedules.clinic_id 
            AND role IN ('super_admin', 'clinic_admin')
        )
    );

-- RLS Policies for staff_schedule_overrides
DROP POLICY IF EXISTS "Users can view overrides in their clinic" ON staff_schedule_overrides;
CREATE POLICY "Users can view overrides in their clinic"
    ON staff_schedule_overrides FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage overrides" ON staff_schedule_overrides;
CREATE POLICY "Admins can manage overrides"
    ON staff_schedule_overrides FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND clinic_id = staff_schedule_overrides.clinic_id 
            AND role IN ('super_admin', 'clinic_admin')
        )
    );

-- RLS Policies for time_off_requests
DROP POLICY IF EXISTS "Staff can view their own time off requests" ON time_off_requests;
CREATE POLICY "Staff can view their own time off requests"
    ON time_off_requests FOR SELECT
    USING (
        staff_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND clinic_id = time_off_requests.clinic_id 
            AND role IN ('super_admin', 'clinic_admin')
        )
    );

DROP POLICY IF EXISTS "Staff can create their own time off requests" ON time_off_requests;
CREATE POLICY "Staff can create their own time off requests"
    ON time_off_requests FOR INSERT
    WITH CHECK (staff_id = auth.uid());

DROP POLICY IF EXISTS "Staff can update their own pending requests" ON time_off_requests;
CREATE POLICY "Staff can update their own pending requests"
    ON time_off_requests FOR UPDATE
    USING (staff_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all time off requests" ON time_off_requests;
CREATE POLICY "Admins can manage all time off requests"
    ON time_off_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND clinic_id = time_off_requests.clinic_id 
            AND role IN ('super_admin', 'clinic_admin')
        )
    );

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_staff_schedules_updated_at ON staff_schedules;
CREATE TRIGGER update_staff_schedules_updated_at
    BEFORE UPDATE ON staff_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_overrides_updated_at ON staff_schedule_overrides;
CREATE TRIGGER update_schedule_overrides_updated_at
    BEFORE UPDATE ON staff_schedule_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
CREATE TRIGGER update_time_off_requests_updated_at
    BEFORE UPDATE ON time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION log_team_planner_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO team_planner_audit_log (clinic_id, table_name, record_id, action, changed_by, old_values)
        VALUES (OLD.clinic_id, TG_TABLE_NAME, OLD.id, 'delete', auth.uid(), row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO team_planner_audit_log (clinic_id, table_name, record_id, action, changed_by, old_values, new_values)
        VALUES (NEW.clinic_id, TG_TABLE_NAME, NEW.id, 'update', auth.uid(), row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO team_planner_audit_log (clinic_id, table_name, record_id, action, changed_by, new_values)
        VALUES (NEW.clinic_id, TG_TABLE_NAME, NEW.id, 'create', auth.uid(), row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_staff_schedules ON staff_schedules;
CREATE TRIGGER audit_staff_schedules
    AFTER INSERT OR UPDATE OR DELETE ON staff_schedules
    FOR EACH ROW EXECUTE FUNCTION log_team_planner_changes();

DROP TRIGGER IF EXISTS audit_schedule_overrides ON staff_schedule_overrides;
CREATE TRIGGER audit_schedule_overrides
    AFTER INSERT OR UPDATE OR DELETE ON staff_schedule_overrides
    FOR EACH ROW EXECUTE FUNCTION log_team_planner_changes();

DROP TRIGGER IF EXISTS audit_time_off_requests ON time_off_requests;
CREATE TRIGGER audit_time_off_requests
    AFTER INSERT OR UPDATE OR DELETE ON time_off_requests
    FOR EACH ROW EXECUTE FUNCTION log_team_planner_changes();

-- Function to check staff availability for appointment booking
CREATE OR REPLACE FUNCTION check_staff_availability(
    p_staff_id UUID,
    p_date DATE,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    v_day_of_week INTEGER;
    v_has_schedule BOOLEAN;
    v_has_override BOOLEAN;
    v_override_available BOOLEAN;
    v_has_time_off BOOLEAN;
BEGIN
    -- Get day of week (0 = Sunday)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Check for approved time off
    SELECT EXISTS (
        SELECT 1 FROM time_off_requests
        WHERE staff_id = p_staff_id
        AND status = 'approved'
        AND p_date BETWEEN start_date AND end_date
    ) INTO v_has_time_off;
    
    IF v_has_time_off THEN
        RETURN FALSE;
    END IF;
    
    -- Check for schedule override
    SELECT 
        EXISTS (SELECT 1 FROM staff_schedule_overrides WHERE staff_id = p_staff_id AND override_date = p_date),
        COALESCE((SELECT is_available FROM staff_schedule_overrides WHERE staff_id = p_staff_id AND override_date = p_date), false)
    INTO v_has_override, v_override_available;
    
    IF v_has_override THEN
        IF NOT v_override_available THEN
            RETURN FALSE;
        END IF;
        
        -- Check if time falls within override hours
        RETURN EXISTS (
            SELECT 1 FROM staff_schedule_overrides
            WHERE staff_id = p_staff_id
            AND override_date = p_date
            AND start_time <= p_start_time
            AND end_time >= p_end_time
        );
    END IF;
    
    -- Check recurring schedule
    RETURN EXISTS (
        SELECT 1 FROM staff_schedules
        WHERE staff_id = p_staff_id
        AND day_of_week = v_day_of_week
        AND is_active = true
        AND start_time <= p_start_time
        AND end_time >= p_end_time
    );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON staff_schedules TO authenticated;
GRANT ALL ON staff_schedule_overrides TO authenticated;
GRANT ALL ON time_off_requests TO authenticated;
GRANT SELECT ON team_planner_audit_log TO authenticated;
