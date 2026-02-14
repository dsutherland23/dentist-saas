-- ============================================================
-- DentalCare Pro - Full Database Setup
-- Run this ONCE in Supabase SQL Editor to set up everything
-- ============================================================

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 1. CORE TABLES ====================

CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    custom_domain VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'starter',
    subscription_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'clinic_admin', 'dentist', 'hygienist', 'receptionist', 'accountant', 'patient')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Remove FK to auth.users if it exists (allows demo/invitation users)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    allergies TEXT,
    medical_conditions TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    dentist_id UUID REFERENCES users(id),
    treatment_type VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    room VARCHAR(50),
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_treatment', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS treatment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    dentist_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    diagnosis TEXT,
    procedures_performed TEXT,
    prescriptions TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) NOT NULL,
    receiver_id UUID REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id),
    appointment_id UUID REFERENCES appointments(id),
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE,
    subtotal NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    insurance_coverage NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(clinic_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
    amount_paid NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    record_type VARCHAR(100),
    record_id UUID,
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    duration_minutes INTEGER DEFAULT 30,
    price NUMERIC(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==================== 2. CLINIC DETAILS & APPOINTMENT TIMESTAMPS ====================
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS checked_out_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS zip VARCHAR(20);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS business_hours JSONB DEFAULT '{"weekday": "9:00 AM - 6:00 PM", "weekend": "Closed"}'::jsonb;

-- ==================== 3. USER PREFERENCES ====================
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(100) DEFAULT 'America/New_York',
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==================== 4. TEAM PLANNER TABLES ====================
CREATE TABLE IF NOT EXISTS staff_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_staff_day UNIQUE (staff_id, day_of_week, start_time)
);

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
    CONSTRAINT valid_override_time_range CHECK (
        (start_time IS NULL AND end_time IS NULL) OR 
        (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
    ),
    CONSTRAINT unique_staff_override_date UNIQUE (staff_id, override_date)
);

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
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

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

-- ==================== 5. CLINICAL REFERRALS ====================
CREATE TABLE IF NOT EXISTS specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS specialists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    specialty_id UUID REFERENCES specialties(id) ON DELETE RESTRICT NOT NULL,
    license_number VARCHAR(100),
    clinic_name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    parish VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Jamaica',
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    bio TEXT,
    credentials_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
    referring_user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL,
    referring_provider_name VARCHAR(255),
    referring_organization VARCHAR(255),
    referring_contact VARCHAR(255),
    patient_first_name VARCHAR(100) NOT NULL,
    patient_last_name VARCHAR(100) NOT NULL,
    dob DATE,
    urgency VARCHAR(50) DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
    reason TEXT NOT NULL,
    attachments JSONB,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'reviewed', 'scheduled', 'completed', 'cancelled')),
    consent_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==================== 6. INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_invoices_clinic ON invoices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
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
CREATE INDEX IF NOT EXISTS idx_audit_log_clinic ON team_planner_audit_log(clinic_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON team_planner_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON team_planner_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_specialists_specialty ON specialists(specialty_id);
CREATE INDEX IF NOT EXISTS idx_specialists_status ON specialists(status);
CREATE INDEX IF NOT EXISTS idx_specialists_location ON specialists(city, parish, country);
CREATE INDEX IF NOT EXISTS idx_specialists_user ON specialists(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_specialist ON referrals(specialist_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referring_user ON referrals(referring_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_created ON referrals(created_at);
CREATE INDEX IF NOT EXISTS idx_treatments_clinic ON treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatments_active ON treatments(is_active);

-- ==================== 7. STORAGE BUCKETS ====================
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-files', 'patient-files', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-assets', 'clinic-assets', true) ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('specialist-credentials', 'specialist-credentials', false) ON CONFLICT (id) DO NOTHING;

-- ==================== 8. ENABLE RLS ====================
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_planner_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- ==================== 9. RLS POLICIES ====================

-- Helper function
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users: can read own row (critical for auth flow)
DROP POLICY IF EXISTS "Users can read own row" ON users;
CREATE POLICY "Users can read own row"
ON users FOR SELECT
USING (id = auth.uid());

-- Users: can view clinic members
DROP POLICY IF EXISTS "Users can view members of their own clinic" ON users;
CREATE POLICY "Users can view members of their own clinic"
ON users FOR SELECT
USING (clinic_id = get_my_clinic_id());

-- Clinics
DROP POLICY IF EXISTS "Users can view their own clinic" ON clinics;
CREATE POLICY "Users can view their own clinic"
ON clinics FOR SELECT
USING (id = get_my_clinic_id());

DROP POLICY IF EXISTS "Clinic admins can update their clinic" ON clinics;
CREATE POLICY "Clinic admins can update their clinic"
ON clinics FOR UPDATE
USING (id = get_my_clinic_id())
WITH CHECK (id = get_my_clinic_id());

-- Patients
DROP POLICY IF EXISTS "Clinic staff can view/edit their patients" ON patients;
CREATE POLICY "Clinic staff can view/edit their patients"
ON patients FOR ALL
USING (clinic_id = get_my_clinic_id());

-- Appointments
DROP POLICY IF EXISTS "Clinic staff can manage appointments" ON appointments;
CREATE POLICY "Clinic staff can manage appointments"
ON appointments FOR ALL
USING (clinic_id = get_my_clinic_id());

-- Treatment Records
DROP POLICY IF EXISTS "Clinic staff can manage treatment records" ON treatment_records;
CREATE POLICY "Clinic staff can manage treatment records"
ON treatment_records FOR ALL
USING (clinic_id = get_my_clinic_id());

-- Messages
DROP POLICY IF EXISTS "Users can see messages sent to or by them" ON messages;
CREATE POLICY "Users can see messages sent to or by them"
ON messages FOR ALL
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Invoices
DROP POLICY IF EXISTS "Clinic staff can manage invoices" ON invoices;
CREATE POLICY "Clinic staff can manage invoices"
ON invoices FOR ALL
USING (clinic_id = get_my_clinic_id());

-- Invoice Items
DROP POLICY IF EXISTS "Clinic staff can manage invoice items" ON invoice_items;
CREATE POLICY "Clinic staff can manage invoice items"
ON invoice_items FOR ALL
USING (invoice_id IN (SELECT id FROM invoices WHERE clinic_id = get_my_clinic_id()));

-- Payments
DROP POLICY IF EXISTS "Clinic staff can manage payments" ON payments;
CREATE POLICY "Clinic staff can manage payments"
ON payments FOR ALL
USING (clinic_id = get_my_clinic_id());

-- Audit Logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  clinic_id = get_my_clinic_id() 
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('clinic_admin', 'super_admin'))
);

-- User Preferences
DROP POLICY IF EXISTS "user_preferences_select" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_update" ON user_preferences;
CREATE POLICY "user_preferences_select" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_preferences_insert" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_preferences_update" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Staff Schedules
DROP POLICY IF EXISTS "Users can view schedules in their clinic" ON staff_schedules;
CREATE POLICY "Users can view schedules in their clinic"
ON staff_schedules FOR SELECT
USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage schedules" ON staff_schedules;
CREATE POLICY "Admins can manage schedules"
ON staff_schedules FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND clinic_id = staff_schedules.clinic_id AND role IN ('super_admin', 'clinic_admin')));

-- Schedule Overrides
DROP POLICY IF EXISTS "Users can view overrides in their clinic" ON staff_schedule_overrides;
CREATE POLICY "Users can view overrides in their clinic"
ON staff_schedule_overrides FOR SELECT
USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage overrides" ON staff_schedule_overrides;
CREATE POLICY "Admins can manage overrides"
ON staff_schedule_overrides FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND clinic_id = staff_schedule_overrides.clinic_id AND role IN ('super_admin', 'clinic_admin')));

-- Time Off Requests
DROP POLICY IF EXISTS "Staff can view their own time off requests" ON time_off_requests;
CREATE POLICY "Staff can view their own time off requests"
ON time_off_requests FOR SELECT
USING (staff_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND clinic_id = time_off_requests.clinic_id AND role IN ('super_admin', 'clinic_admin')));

DROP POLICY IF EXISTS "Staff can create their own time off requests" ON time_off_requests;
CREATE POLICY "Staff can create their own time off requests"
ON time_off_requests FOR INSERT WITH CHECK (staff_id = auth.uid());

DROP POLICY IF EXISTS "Staff can update their own pending requests" ON time_off_requests;
CREATE POLICY "Staff can update their own pending requests"
ON time_off_requests FOR UPDATE USING (staff_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all time off requests" ON time_off_requests;
CREATE POLICY "Admins can manage all time off requests"
ON time_off_requests FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND clinic_id = time_off_requests.clinic_id AND role IN ('super_admin', 'clinic_admin')));

-- Specialties
DROP POLICY IF EXISTS "Anyone can view active specialties" ON specialties;
CREATE POLICY "Anyone can view active specialties" ON specialties FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage specialties" ON specialties;
CREATE POLICY "Admins can manage specialties" ON specialties FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'clinic_admin')));

-- Specialists
DROP POLICY IF EXISTS "Anyone can view approved specialists" ON specialists;
CREATE POLICY "Anyone can view approved specialists" ON specialists FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can register as specialist" ON specialists;
CREATE POLICY "Authenticated users can register as specialist" ON specialists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own specialist profile" ON specialists;
CREATE POLICY "Users can update their own specialist profile" ON specialists FOR UPDATE
USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role IN ('super_admin', 'clinic_admin')));

DROP POLICY IF EXISTS "Admins can delete specialists" ON specialists;
CREATE POLICY "Admins can delete specialists" ON specialists FOR DELETE
USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'clinic_admin')));

-- Referrals
DROP POLICY IF EXISTS "Authenticated users can create referrals" ON referrals;
CREATE POLICY "Authenticated users can create referrals" ON referrals FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND referring_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view referrals they sent" ON referrals;
CREATE POLICY "Users can view referrals they sent" ON referrals FOR SELECT USING (referring_user_id = auth.uid());

DROP POLICY IF EXISTS "Specialists can view their received referrals" ON referrals;
CREATE POLICY "Specialists can view their received referrals" ON referrals FOR SELECT
USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Specialists can update referral status" ON referrals;
CREATE POLICY "Specialists can update referral status" ON referrals FOR UPDATE
USING (specialist_id IN (SELECT id FROM specialists WHERE user_id = auth.uid()));

-- Treatments
DROP POLICY IF EXISTS "Clinic staff can view treatments" ON treatments;
CREATE POLICY "Clinic staff can view treatments" ON treatments FOR SELECT
USING (clinic_id = get_my_clinic_id());

DROP POLICY IF EXISTS "Clinic staff can manage treatments" ON treatments;
CREATE POLICY "Clinic staff can manage treatments" ON treatments FOR ALL
USING (clinic_id = get_my_clinic_id());

-- ==================== 10. FUNCTIONS & TRIGGERS ====================

-- Drop orphaned trigger from previous setup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_auth_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_staff_schedules_updated_at ON staff_schedules;
CREATE TRIGGER update_staff_schedules_updated_at BEFORE UPDATE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedule_overrides_updated_at ON staff_schedule_overrides;
CREATE TRIGGER update_schedule_overrides_updated_at BEFORE UPDATE ON staff_schedule_overrides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_off_requests_updated_at ON time_off_requests;
CREATE TRIGGER update_time_off_requests_updated_at BEFORE UPDATE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appointments: set checked_in_at / checked_out_at when status changes
CREATE OR REPLACE FUNCTION set_appointment_checkin_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_in' AND (OLD.checked_in_at IS NULL OR OLD.status IS DISTINCT FROM 'checked_in') THEN
    NEW.checked_in_at := timezone('utc'::text, now());
  END IF;
  IF NEW.status = 'completed' THEN
    NEW.checked_out_at := timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_appointment_checkin_timestamps ON appointments;
CREATE TRIGGER trigger_set_appointment_checkin_timestamps
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_appointment_checkin_timestamps();

-- Onboarding RPC (signup flow)
CREATE OR REPLACE FUNCTION create_clinic_and_admin(
    p_clinic_name TEXT, p_admin_name TEXT, p_admin_email TEXT, p_user_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_clinic_id UUID; v_first_name TEXT; v_last_name TEXT;
BEGIN
    INSERT INTO clinics (name, subscription_plan, subscription_status) VALUES (p_clinic_name, 'trial', 'active') RETURNING id INTO v_clinic_id;
    v_first_name := split_part(p_admin_name, ' ', 1);
    v_last_name := substring(p_admin_name from length(v_first_name) + 2);
    INSERT INTO users (id, clinic_id, email, first_name, last_name, role) VALUES (p_user_id, v_clinic_id, p_admin_email, v_first_name, v_last_name, 'clinic_admin');
    RETURN jsonb_build_object('success', true, 'clinic_id', v_clinic_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- Complete clinic setup RPC (onboarding page / recovery)
CREATE OR REPLACE FUNCTION complete_clinic_setup(
    p_clinic_name TEXT, p_admin_name TEXT, p_admin_email TEXT, p_user_id UUID
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_clinic_id UUID; v_first_name TEXT; v_last_name TEXT; v_existing_clinic_id UUID;
BEGIN
    SELECT clinic_id INTO v_existing_clinic_id FROM users WHERE id = p_user_id;
    IF v_existing_clinic_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'clinic_id', v_existing_clinic_id, 'already_linked', true);
    END IF;
    INSERT INTO clinics (name, subscription_plan, subscription_status) VALUES (p_clinic_name, 'trial', 'active') RETURNING id INTO v_clinic_id;
    v_first_name := COALESCE(NULLIF(TRIM(split_part(COALESCE(p_admin_name, ''), ' ', 1)), ''), 'Admin');
    v_last_name := COALESCE(NULLIF(TRIM(substring(COALESCE(p_admin_name, '') from length(split_part(COALESCE(p_admin_name, ''), ' ', 1)) + 2)), ''), 'User');
    INSERT INTO users (id, clinic_id, email, first_name, last_name, role) VALUES (p_user_id, v_clinic_id, p_admin_email, v_first_name, v_last_name, 'clinic_admin')
    ON CONFLICT (id) DO UPDATE SET clinic_id = EXCLUDED.clinic_id, first_name = COALESCE(users.first_name, EXCLUDED.first_name), last_name = COALESCE(users.last_name, EXCLUDED.last_name);
    RETURN jsonb_build_object('success', true, 'clinic_id', v_clinic_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END; $$;

-- Team planner audit trigger
CREATE OR REPLACE FUNCTION log_team_planner_changes() RETURNS TRIGGER AS $$
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
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_staff_schedules ON staff_schedules;
CREATE TRIGGER audit_staff_schedules AFTER INSERT OR UPDATE OR DELETE ON staff_schedules FOR EACH ROW EXECUTE FUNCTION log_team_planner_changes();

DROP TRIGGER IF EXISTS audit_schedule_overrides ON staff_schedule_overrides;
CREATE TRIGGER audit_schedule_overrides AFTER INSERT OR UPDATE OR DELETE ON staff_schedule_overrides FOR EACH ROW EXECUTE FUNCTION log_team_planner_changes();

DROP TRIGGER IF EXISTS audit_time_off_requests ON time_off_requests;
CREATE TRIGGER audit_time_off_requests AFTER INSERT OR UPDATE OR DELETE ON time_off_requests FOR EACH ROW EXECUTE FUNCTION log_team_planner_changes();

-- Staff availability check
CREATE OR REPLACE FUNCTION check_staff_availability(p_staff_id UUID, p_date DATE, p_start_time TIME, p_end_time TIME)
RETURNS BOOLEAN AS $$
DECLARE v_day_of_week INTEGER; v_has_time_off BOOLEAN; v_has_override BOOLEAN; v_override_available BOOLEAN;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_date);
    SELECT EXISTS (SELECT 1 FROM time_off_requests WHERE staff_id = p_staff_id AND status = 'approved' AND p_date BETWEEN start_date AND end_date) INTO v_has_time_off;
    IF v_has_time_off THEN RETURN FALSE; END IF;
    SELECT EXISTS (SELECT 1 FROM staff_schedule_overrides WHERE staff_id = p_staff_id AND override_date = p_date),
           COALESCE((SELECT is_available FROM staff_schedule_overrides WHERE staff_id = p_staff_id AND override_date = p_date), false)
    INTO v_has_override, v_override_available;
    IF v_has_override THEN
        IF NOT v_override_available THEN RETURN FALSE; END IF;
        RETURN EXISTS (SELECT 1 FROM staff_schedule_overrides WHERE staff_id = p_staff_id AND override_date = p_date AND start_time <= p_start_time AND end_time >= p_end_time);
    END IF;
    RETURN EXISTS (SELECT 1 FROM staff_schedules WHERE staff_id = p_staff_id AND day_of_week = v_day_of_week AND is_active = true AND start_time <= p_start_time AND end_time >= p_end_time);
END; $$ LANGUAGE plpgsql;

-- ==================== 11. GRANTS ====================
GRANT ALL ON staff_schedules TO authenticated;
GRANT ALL ON staff_schedule_overrides TO authenticated;
GRANT ALL ON time_off_requests TO authenticated;
GRANT SELECT ON team_planner_audit_log TO authenticated;

-- ==================== 12. SEED SPECIALTIES ====================
INSERT INTO specialties (name, active) VALUES
    ('General Dentistry', true), ('Orthodontics', true), ('Periodontics', true),
    ('Endodontics', true), ('Prosthodontics', true), ('Oral Surgery', true),
    ('Pediatric Dentistry', true), ('Oral Medicine', true), ('Restorative Dentistry', true),
    ('Cosmetic Dentistry', true), ('Cardiologist', true), ('Pediatrician', true),
    ('Dermatologist', true), ('Neurologist', true), ('Psychiatrist', true),
    ('Orthopedic Surgeon', true), ('OB/GYN', true), ('General Practitioner', true),
    ('Ophthalmologist', true), ('ENT Specialist', true)
ON CONFLICT (name) DO NOTHING;

-- ==================== 13. STORAGE POLICIES ====================
-- Patient files (path: patient_id/filename - only clinic staff for that patient)
DROP POLICY IF EXISTS "Clinic staff can upload patient files" ON storage.objects;
CREATE POLICY "Clinic staff can upload patient files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

DROP POLICY IF EXISTS "Clinic staff can read patient files" ON storage.objects;
CREATE POLICY "Clinic staff can read patient files" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

DROP POLICY IF EXISTS "Clinic staff can update patient files" ON storage.objects;
CREATE POLICY "Clinic staff can update patient files" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

DROP POLICY IF EXISTS "Clinic staff can delete patient files" ON storage.objects;
CREATE POLICY "Clinic staff can delete patient files" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-files'
  AND (storage.foldername(name))[1] IN (SELECT id::text FROM patients WHERE clinic_id = get_my_clinic_id())
);

-- Clinic assets (public read)
DROP POLICY IF EXISTS "Public Access to Clinic Assets" ON storage.objects;
CREATE POLICY "Public Access to Clinic Assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Authenticated users can upload clinic assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload clinic assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Authenticated users can update clinic assets" ON storage.objects;
CREATE POLICY "Authenticated users can update clinic assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'clinic-assets');

DROP POLICY IF EXISTS "Authenticated users can delete clinic assets" ON storage.objects;
CREATE POLICY "Authenticated users can delete clinic assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'clinic-assets');

-- Specialist credentials (private)
DROP POLICY IF EXISTS "Users can upload their own credentials" ON storage.objects;
CREATE POLICY "Users can upload their own credentials" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'specialist-credentials' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can read their own credentials" ON storage.objects;
CREATE POLICY "Users can read their own credentials" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'specialist-credentials' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can read all credentials" ON storage.objects;
CREATE POLICY "Admins can read all credentials" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'specialist-credentials' AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'clinic_admin')));

DROP POLICY IF EXISTS "Users can delete their own credentials" ON storage.objects;
CREATE POLICY "Users can delete their own credentials" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'specialist-credentials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Grant storage usage
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated, anon;

-- ============================================================
-- DONE! Your database is fully set up.
-- ============================================================
