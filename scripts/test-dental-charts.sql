-- Test Script for Dental Charts Feature
-- Run this in Supabase SQL Editor after applying the migration
-- This script tests the entire dental chart implementation

-- ============================================
-- PART 1: Verify Table Structure
-- ============================================

-- Check if dental_charts table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dental_charts'
    ) THEN
        RAISE NOTICE '✓ dental_charts table exists';
    ELSE
        RAISE EXCEPTION '✗ dental_charts table NOT FOUND';
    END IF;
END $$;

-- Verify all required columns exist
DO $$
DECLARE
    missing_columns text[] := ARRAY[]::text[];
    required_columns text[] := ARRAY[
        'id', 'patient_id', 'clinic_id', 'numbering_system', 'chart_type',
        'version', 'is_locked', 'locked_by', 'locked_at', 'teeth',
        'medical_images', 'audit_log', 'created_at', 'updated_at'
    ];
    col text;
BEGIN
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'dental_charts' 
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) IS NULL THEN
        RAISE NOTICE '✓ All required columns exist';
    ELSE
        RAISE EXCEPTION '✗ Missing columns: %', missing_columns;
    END IF;
END $$;

-- Check JSONB columns have correct defaults
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'dental_charts' 
        AND column_name = 'teeth'
        AND data_type = 'jsonb'
        AND column_default = '''[]''::jsonb'
    ) THEN
        RAISE NOTICE '✓ teeth column configured correctly';
    ELSE
        RAISE WARNING '! teeth column may not have correct default';
    END IF;
END $$;

-- ============================================
-- PART 2: Verify Constraints
-- ============================================

-- Check unique constraint on patient_id
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE table_name = 'dental_charts'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%patient_id%'
    ) THEN
        RAISE NOTICE '✓ UNIQUE constraint on patient_id exists';
    ELSE
        RAISE WARNING '! UNIQUE constraint on patient_id may be missing';
    END IF;
END $$;

-- Check foreign key constraints
DO $$
DECLARE
    fk_count int;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'dental_charts'
    AND constraint_type = 'FOREIGN KEY';
    
    IF fk_count >= 3 THEN
        RAISE NOTICE '✓ Foreign key constraints exist (found %)', fk_count;
    ELSE
        RAISE WARNING '! Expected at least 3 foreign keys, found %', fk_count;
    END IF;
END $$;

-- ============================================
-- PART 3: Verify Indexes
-- ============================================

-- Check indexes
DO $$
DECLARE
    idx_count int;
BEGIN
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE tablename = 'dental_charts'
    AND indexname LIKE 'idx_dental_charts%';
    
    IF idx_count >= 3 THEN
        RAISE NOTICE '✓ Performance indexes created (found %)', idx_count;
    ELSE
        RAISE WARNING '! Expected at least 3 indexes, found %', idx_count;
    END IF;
END $$;

-- List all indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'dental_charts'
ORDER BY indexname;

-- ============================================
-- PART 4: Verify RLS
-- ============================================

-- Check RLS is enabled
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE tablename = 'dental_charts'
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✓ Row Level Security is enabled';
    ELSE
        RAISE EXCEPTION '✗ Row Level Security is NOT enabled';
    END IF;
END $$;

-- Check RLS policies exist
DO $$
DECLARE
    policy_count int;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'dental_charts';
    
    IF policy_count >= 4 THEN
        RAISE NOTICE '✓ RLS policies created (found %)', policy_count;
    ELSE
        RAISE WARNING '! Expected at least 4 policies, found %', policy_count;
    END IF;
END $$;

-- List all RLS policies
SELECT 
    policyname,
    cmd as operation,
    permissive
FROM pg_policies
WHERE tablename = 'dental_charts'
ORDER BY policyname;

-- ============================================
-- PART 5: Verify Trigger
-- ============================================

-- Check updated_at trigger function exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_proc
        WHERE proname = 'update_dental_charts_updated_at'
    ) THEN
        RAISE NOTICE '✓ Trigger function exists';
    ELSE
        RAISE WARNING '! Trigger function not found';
    END IF;
END $$;

-- Check trigger exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_trigger
        WHERE tgname = 'update_dental_charts_updated_at'
        AND tgrelid = 'dental_charts'::regclass
    ) THEN
        RAISE NOTICE '✓ UPDATE trigger configured';
    ELSE
        RAISE WARNING '! UPDATE trigger not found';
    END IF;
END $$;

-- ============================================
-- PART 6: Test Data Operations (Optional)
-- ============================================

-- NOTE: These tests require you to have actual patient and clinic data
-- Uncomment and modify with your actual UUIDs to test

/*
-- Test 1: Try to insert a sample chart (will fail if you don't have permission)
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
    '[
        {
            "tooth_number": "1",
            "arch": "upper",
            "quadrant": 1,
            "status": "healthy",
            "surfaces": [
                {"surface_code": "M", "status": "healthy"},
                {"surface_code": "D", "status": "healthy"}
            ]
        }
    ]'::jsonb,
    1
);

-- Test 2: Try to query the chart
SELECT 
    id,
    patient_id,
    numbering_system,
    version,
    jsonb_array_length(teeth) as tooth_count,
    created_at
FROM dental_charts
WHERE patient_id = 'YOUR_PATIENT_ID_HERE'::uuid;

-- Test 3: Try to update and verify version increments
UPDATE dental_charts
SET teeth = '[]'::jsonb
WHERE patient_id = 'YOUR_PATIENT_ID_HERE'::uuid;

-- Verify updated_at changed
SELECT 
    version,
    updated_at,
    updated_at > created_at as updated_after_creation
FROM dental_charts
WHERE patient_id = 'YOUR_PATIENT_ID_HERE'::uuid;

-- Test 4: Clean up test data
DELETE FROM dental_charts
WHERE patient_id = 'YOUR_PATIENT_ID_HERE'::uuid;
*/

-- ============================================
-- FINAL SUMMARY
-- ============================================

SELECT 
    '✓ DENTAL CHARTS MIGRATION VERIFICATION COMPLETE' as status,
    NOW() as verified_at;

-- Check overall table health
SELECT 
    schemaname,
    tablename,
    hasindexes,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'dental_charts') as policy_count
FROM pg_tables
WHERE tablename = 'dental_charts';
