-- RPC for users who have auth but no clinic (e.g., signup API failed or email verification race)
-- Handles both: new user (INSERT) and existing user with null clinic_id (UPDATE)
CREATE OR REPLACE FUNCTION complete_clinic_setup(
    p_clinic_name TEXT,
    p_admin_name TEXT,
    p_admin_email TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_clinic_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
    v_existing_clinic_id UUID;
BEGIN
    -- Check if user already has clinic
    SELECT clinic_id INTO v_existing_clinic_id FROM users WHERE id = p_user_id;

    IF v_existing_clinic_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'clinic_id', v_existing_clinic_id, 'already_linked', true);
    END IF;

    -- 1. Create Clinic
    INSERT INTO clinics (name, subscription_plan, subscription_status)
    VALUES (p_clinic_name, 'trial', 'active')
    RETURNING id INTO v_clinic_id;

    -- Split name (handle empty/single word)
    v_first_name := COALESCE(NULLIF(TRIM(split_part(COALESCE(p_admin_name, ''), ' ', 1)), ''), 'Admin');
    v_last_name := COALESCE(NULLIF(TRIM(substring(COALESCE(p_admin_name, '') from length(split_part(COALESCE(p_admin_name, ''), ' ', 1)) + 2)), ''), 'User');

    -- 2. Insert or update user (handle both new users and existing users with null clinic_id)
    INSERT INTO users (id, clinic_id, email, first_name, last_name, role)
    VALUES (p_user_id, v_clinic_id, p_admin_email, v_first_name, v_last_name, 'clinic_admin')
    ON CONFLICT (id) DO UPDATE SET
        clinic_id = EXCLUDED.clinic_id,
        first_name = COALESCE(users.first_name, EXCLUDED.first_name),
        last_name = COALESCE(users.last_name, EXCLUDED.last_name);

    RETURN jsonb_build_object('success', true, 'clinic_id', v_clinic_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
