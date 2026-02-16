# Treatment Plan Creation - Error Fix

## Issue
"Internal server error" when creating treatment plans.

## Root Cause
The `treatments` table had RLS enabled but no policies were applied via migrations. The policies only existed in `scripts/full-database-setup.sql`, which means they weren't present if migrations were run individually.

## Solution

### 1. Created Missing Migration
**File**: `supabase/migrations/20260218000002_treatments_table_and_rls.sql`

This migration:
- Creates the `treatments` table (if not exists)
- Adds indexes for performance
- Enables RLS
- Creates RLS policies:
  - `"Clinic staff can view treatments"` - SELECT policy
  - `"Clinic staff can manage treatments"` - ALL operations policy
- Adds `updated_at` trigger

### 2. Improved Error Handling
**Files Updated**:
- `app/api/treatment-plans/route.ts` - Now returns detailed error messages
- `components/patients/new-treatment-plan-dialog.tsx` - Shows detailed errors in toast

## How to Apply the Fix

Run the new migration:

```bash
# Option 1: Using Supabase CLI
supabase db push

# Option 2: In Supabase Dashboard
# Go to SQL Editor → paste the migration contents → Run
```

## Testing
After applying the migration:
1. Navigate to any patient profile
2. Go to "Treatment Plans" tab
3. Click "New Plan"
4. Fill in plan details and select treatments
5. Submit - should now succeed

If you still see errors, check:
- Browser console for detailed error message
- Server logs for the `[TREATMENT_PLANS_POST]` error details
- Verify the migration ran successfully

## Related Files
- `/supabase/migrations/20260218000002_treatments_table_and_rls.sql` (NEW)
- `/app/api/treatment-plans/route.ts` (UPDATED)
- `/components/patients/new-treatment-plan-dialog.tsx` (UPDATED)
