-- Quick verification script for dental_charts table
-- Run this in Supabase SQL Editor after applying the migration

-- Check if dental_charts table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dental_charts'
) as dental_charts_exists;

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dental_charts'
ORDER BY ordinal_position;

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'dental_charts'::regclass;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'dental_charts';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'dental_charts';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'dental_charts';

-- Test creating a sample chart (will fail if RLS blocks, which is expected)
-- This is just to verify the table structure
-- Run this only after you have an authenticated user and patient
/*
INSERT INTO dental_charts (
    patient_id,
    clinic_id,
    numbering_system,
    chart_type,
    teeth,
    version
) VALUES (
    'YOUR_PATIENT_ID_HERE'::uuid,
    'YOUR_CLINIC_ID_HERE'::uuid,
    'universal',
    'adult_permanent',
    '[]'::jsonb,
    1
);
*/
