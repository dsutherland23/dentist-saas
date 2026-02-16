-- Check if treatments table exists and has RLS policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('treatments', 'treatment_plans', 'treatment_plan_items')
ORDER BY tablename, policyname;

-- Check if treatments table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'treatments'
) as treatments_exists;

-- Check treatment_plans and items tables
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'treatment_plans'
) as treatment_plans_exists;

SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'treatment_plan_items'
) as treatment_plan_items_exists;
