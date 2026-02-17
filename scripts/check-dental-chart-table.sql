-- Quick check if dental_charts table exists
-- Run this in Supabase SQL Editor

SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dental_charts'
    ) as table_exists,
    
    -- If table exists, check if it has any data
    (SELECT COUNT(*) FROM dental_charts) as chart_count
FROM (VALUES (1)) AS dummy;

-- If table doesn't exist, you need to apply the migration:
-- File: supabase/migrations/20260223000001_dental_charts.sql
