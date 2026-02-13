-- RPC Function to handle onboarding transaction securely
-- This allows creation of a clinic and user without giving public insert access to the tables
CREATE OR REPLACE FUNCTION create_clinic_and_admin(
    p_clinic_name TEXT,
    p_admin_name TEXT,
    p_admin_email TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/superuser)
AS $$
DECLARE
    v_clinic_id UUID;
    v_first_name TEXT;
    v_last_name TEXT;
BEGIN
    -- 1. Create Clinic
    INSERT INTO clinics (name, subscription_plan, subscription_status)
    VALUES (p_clinic_name, 'trial', 'active')
    RETURNING id INTO v_clinic_id;

    -- Split name
    v_first_name := split_part(p_admin_name, ' ', 1);
    v_last_name := substring(p_admin_name from length(v_first_name) + 2);

    -- 2. Create User linked to auth.users (p_user_id) and the new clinic
    INSERT INTO users (id, clinic_id, email, first_name, last_name, role)
    VALUES (p_user_id, v_clinic_id, p_admin_email, v_first_name, v_last_name, 'clinic_admin');

    RETURN jsonb_build_object(
        'success', true,
        'clinic_id', v_clinic_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
