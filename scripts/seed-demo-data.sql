-- ============================================================
-- Demo Data Seed: patients, staff, appointments, clinical referrals
-- Run in Supabase SQL Editor (Dashboard > SQL Editor) or via psql.
-- Best run after sign-up + onboarding (so you have one clinic and one user).
-- ============================================================

DO $$
DECLARE
    cid UUID;
    uid UUID;
    spec_ortho UUID;
    spec_endo UUID;
    spec_oral UUID;
    spec_perio UUID;
    demo_staff_1 UUID := uuid_generate_v4();
    demo_staff_2 UUID := uuid_generate_v4();
    demo_staff_3 UUID := uuid_generate_v4();
BEGIN
    -- Use first clinic (assume onboarding already created one)
    SELECT id INTO cid FROM clinics LIMIT 1;
    IF cid IS NULL THEN
        RAISE NOTICE 'No clinic found. Sign up and complete onboarding first, then run this seed again.';
        RETURN;
    END IF;

    -- Use first user in clinic (for dentist_id and referring_user_id)
    SELECT id INTO uid FROM users WHERE clinic_id = cid LIMIT 1;
    IF uid IS NULL THEN
        -- Create one placeholder admin so we have a user for referrals/appointments
        INSERT INTO users (id, clinic_id, first_name, last_name, email, role, is_active)
        VALUES (uuid_generate_v4(), cid, 'Demo', 'Admin', 'demo-admin@demo.local', 'clinic_admin', true)
        RETURNING id INTO uid;
    END IF;

    -- Demo staff (display-only; they cannot log in unless you create auth users for them)
    INSERT INTO users (id, clinic_id, first_name, last_name, email, role, phone, is_active)
    SELECT demo_staff_1, cid, 'Jane', 'Wright', 'jane.wright@demo.local', 'dentist', '+1 876 555 1001', true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE clinic_id = cid AND email = 'jane.wright@demo.local');
    INSERT INTO users (id, clinic_id, first_name, last_name, email, role, phone, is_active)
    SELECT demo_staff_2, cid, 'Marcus', 'Chen', 'marcus.chen@demo.local', 'hygienist', '+1 876 555 1002', true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE clinic_id = cid AND email = 'marcus.chen@demo.local');
    INSERT INTO users (id, clinic_id, first_name, last_name, email, role, phone, is_active)
    SELECT demo_staff_3, cid, 'Sofia', 'Brown', 'sofia.brown@demo.local', 'receptionist', '+1 876 555 1003', true
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE clinic_id = cid AND email = 'sofia.brown@demo.local');

    -- Demo patients (run once; re-run may create duplicates)
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'Adrian', 'Pecco', '1985-03-12', 'male', '+1 876 555 2001', 'adrian.pecco@example.com', '12 King St, Kingston', 'Sagicor Life', 'Maria Pecco', '+1 876 555 2009'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'adrian.pecco@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'Sarah', 'Johnson', '1990-07-22', 'female', '+1 876 555 2002', 'sarah.j@example.com', '45 Hope Rd, Kingston', 'Guardian Life', 'Tom Johnson', '+1 876 555 2010'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'sarah.j@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'Michael', 'Williams', '1978-11-05', 'male', '+1 876 555 2003', 'mwilliams@example.com', '78 Main St, Montego Bay', NULL, 'Lisa Williams', '+1 876 555 2011'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'mwilliams@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'Emily', 'Davis', '1995-01-30', 'female', '+1 876 555 2004', 'emily.d@example.com', '3 Ocean Blvd, Ocho Rios', 'NCB Insurance', 'James Davis', '+1 876 555 2012'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'emily.d@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'David', 'Thompson', '1982-09-18', 'male', '+1 876 555 2005', 'dthompson@example.com', '22 Church St, Kingston', NULL, 'Anna Thompson', '+1 876 555 2013'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'dthompson@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'Olivia', 'Martinez', '1988-04-25', 'female', '+1 876 555 2006', 'olivia.m@example.com', '56 Harbour St, Kingston', 'Sagicor Life', 'Carlos Martinez', '+1 876 555 2014'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'olivia.m@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'James', 'Wilson', '1975-12-08', 'male', '+1 876 555 2007', 'jwilson@example.com', '9 Union St, Spanish Town', 'Guardian Life', 'Mary Wilson', '+1 876 555 2015'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'jwilson@example.com');
    INSERT INTO patients (clinic_id, first_name, last_name, date_of_birth, gender, phone, email, address, insurance_provider, emergency_contact_name, emergency_contact_phone)
    SELECT cid, 'Emma', 'Anderson', '1992-06-14', 'female', '+1 876 555 2008', 'emma.a@example.com', '34 Constant Spring Rd, Kingston', NULL, 'Peter Anderson', '+1 876 555 2016'
    WHERE NOT EXISTS (SELECT 1 FROM patients WHERE clinic_id = cid AND email = 'emma.a@example.com');

    -- Appointments (today + tomorrow; various statuses)
    INSERT INTO appointments (clinic_id, patient_id, dentist_id, treatment_type, start_time, end_time, status)
    SELECT cid, p.id, uid, COALESCE((SELECT name FROM treatments WHERE clinic_id = cid AND is_active = true LIMIT 1), 'Checkup'),
           date_trunc('day', now()) + 17 * interval '1 hour',
           date_trunc('day', now()) + 17 * interval '1 hour' + 45 * interval '1 minute',
           'confirmed'
    FROM (SELECT id FROM patients WHERE clinic_id = cid ORDER BY created_at LIMIT 1) p;

    INSERT INTO appointments (clinic_id, patient_id, dentist_id, treatment_type, start_time, end_time, status)
    SELECT cid, p.id, uid, 'Tooth Extraction',
           date_trunc('day', now()) + 9 * interval '1 hour',
           date_trunc('day', now()) + 9 * interval '1 hour' + 45 * interval '1 minute',
           'completed'
    FROM (SELECT id FROM patients WHERE clinic_id = cid ORDER BY created_at OFFSET 1 LIMIT 1) p;

    INSERT INTO appointments (clinic_id, patient_id, dentist_id, treatment_type, start_time, end_time, status)
    SELECT cid, p.id, uid, 'Root Canal',
           date_trunc('day', now()) + 10 * interval '1 hour' + 30 * interval '1 minute',
           date_trunc('day', now()) + 11 * interval '1 hour' + 30 * interval '1 minute',
           'scheduled'
    FROM (SELECT id FROM patients WHERE clinic_id = cid ORDER BY created_at OFFSET 2 LIMIT 1) p;

    INSERT INTO appointments (clinic_id, patient_id, dentist_id, treatment_type, start_time, end_time, status)
    SELECT cid, p.id, uid, 'Teeth Cleaning',
           date_trunc('day', now()) + 14 * interval '1 hour',
           date_trunc('day', now()) + 14 * interval '1 hour' + 30 * interval '1 minute',
           'unconfirmed'
    FROM (SELECT id FROM patients WHERE clinic_id = cid ORDER BY created_at OFFSET 3 LIMIT 1) p;

    INSERT INTO appointments (clinic_id, patient_id, dentist_id, treatment_type, start_time, end_time, status)
    SELECT cid, p.id, uid, 'Filling',
           date_trunc('day', now()) + 1 + 11 * interval '1 hour',
           date_trunc('day', now()) + 1 + 11 * interval '1 hour' + 30 * interval '1 minute',
           'pending'
    FROM (SELECT id FROM patients WHERE clinic_id = cid ORDER BY created_at OFFSET 4 LIMIT 1) p;

    -- Specialties (get IDs for specialists)
    SELECT id INTO spec_ortho FROM specialties WHERE name = 'Orthodontics' LIMIT 1;
    SELECT id INTO spec_endo FROM specialties WHERE name = 'Endodontics' LIMIT 1;
    SELECT id INTO spec_oral FROM specialties WHERE name = 'Oral Surgery' LIMIT 1;
    SELECT id INTO spec_perio FROM specialties WHERE name = 'Periodontics' LIMIT 1;

    -- Demo specialists (approved, no user link)
    IF spec_ortho IS NOT NULL THEN
        INSERT INTO specialists (name, specialty_id, clinic_name, city, parish, country, phone, email, status)
        VALUES ('Dr. Patricia Grant', spec_ortho, 'Grant Orthodontics', 'Kingston', 'St. Andrew', 'Jamaica', '+1 876 555 3001', 'grant.ortho@example.com', 'approved');
    END IF;
    IF spec_endo IS NOT NULL THEN
        INSERT INTO specialists (name, specialty_id, clinic_name, city, parish, country, phone, email, status)
        VALUES ('Dr. Robert Clarke', spec_endo, 'Clarke Endodontics', 'Montego Bay', 'St. James', 'Jamaica', '+1 876 555 3002', 'rclarke@example.com', 'approved');
    END IF;
    IF spec_oral IS NOT NULL THEN
        INSERT INTO specialists (name, specialty_id, clinic_name, city, parish, country, phone, email, status)
        VALUES ('Dr. Sandra Lee', spec_oral, 'Lee Oral Surgery', 'Kingston', 'St. Andrew', 'Jamaica', '+1 876 555 3003', 'slee.surgery@example.com', 'approved');
    END IF;
    IF spec_perio IS NOT NULL THEN
        INSERT INTO specialists (name, specialty_id, clinic_name, city, parish, country, phone, email, status)
        VALUES ('Dr. Paul Miller', spec_perio, 'Miller Periodontics', 'Ocho Rios', 'St. Ann', 'Jamaica', '+1 876 555 3004', 'pmiller@example.com', 'approved');
    END IF;

    -- Referrals (one per approved specialist; patient name from same row)
    INSERT INTO referrals (specialist_id, referring_user_id, referring_provider_name, referring_organization, patient_first_name, patient_last_name, dob, urgency, reason, status, consent_confirmed)
    SELECT s.id, uid,
        (SELECT first_name || ' ' || last_name FROM users WHERE id = uid),
        (SELECT name FROM clinics WHERE id = cid),
        pt.first_name, pt.last_name,
        CURRENT_DATE - (random() * 3650)::int,
        (ARRAY['routine','urgent','routine'])[1 + (random() * 2)::int],
        'Referral for specialist evaluation and treatment plan.',
        (ARRAY['sent','received','reviewed'])[1 + (random() * 2)::int],
        true
    FROM (SELECT id FROM specialists WHERE status = 'approved' ORDER BY created_at LIMIT 4) s
    CROSS JOIN LATERAL (SELECT first_name, last_name FROM patients WHERE clinic_id = cid ORDER BY random() LIMIT 1) pt;

    RAISE NOTICE 'Demo data seeded: patients, staff, appointments, specialists, and referrals.';
END $$;
