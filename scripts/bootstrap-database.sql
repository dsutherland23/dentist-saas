-- ============================================================
-- STEP 1: Bootstrap - Run this FIRST in Supabase SQL Editor
-- Creates only: clinics, users, RLS, and onboarding RPC
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clinics
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

-- 2. Users (no FK to auth.users so signup works)
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

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- 3. Enable RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Helper (must exist before policies)
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Policies
DROP POLICY IF EXISTS "Users can read own row" ON users;
CREATE POLICY "Users can read own row" ON users FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can view members of their own clinic" ON users;
CREATE POLICY "Users can view members of their own clinic" ON users FOR SELECT USING (clinic_id = get_my_clinic_id());

DROP POLICY IF EXISTS "Users can view their own clinic" ON clinics;
CREATE POLICY "Users can view their own clinic" ON clinics FOR SELECT USING (id = get_my_clinic_id());

-- 6. Onboarding RPC
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

-- Done. You can now sign up and complete onboarding.
-- Run full-database-setup.sql next for patients, appointments, etc.
