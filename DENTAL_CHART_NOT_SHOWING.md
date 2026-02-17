# Dental Chart Not Showing - Quick Fix Guide

## Problem
You're not seeing the dental chart section on the patient profile page.

## Most Likely Cause
**The database migration hasn't been applied yet.** The `dental_charts` table doesn't exist in your database.

---

## Solution: Apply the Migration

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click "SQL Editor" in the left sidebar

2. **Copy the migration SQL**
   - Open file: `supabase/migrations/20260223000001_dental_charts.sql`
   - Copy ALL the contents (88 lines)

3. **Run in SQL Editor**
   - Paste into a new query
   - Click "Run" or press `Ctrl+Enter`
   - Wait for "Success" message

4. **Verify it worked**
   - Run this query:
   ```sql
   SELECT EXISTS (
       SELECT FROM information_schema.tables 
       WHERE table_name = 'dental_charts'
   ) as table_exists;
   ```
   - Should return `table_exists: true`

5. **Refresh your app**
   - Go back to patient profile
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Dental chart section should now appear

---

### Option 2: Via npm Script (If Configured)

```bash
cd "/Volumes/Portable/Website/dental saas update /dentist-saas"
npm run db:migrate
```

If this fails, use Option 1 instead.

---

## How to Verify It's Working

### Step 1: Check the Database
Run in Supabase SQL Editor:
```sql
-- Should return true
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'dental_charts'
) as table_exists;
```

### Step 2: Check Browser Console
1. Open patient profile page
2. Press F12 to open DevTools
3. Go to "Console" tab
4. Look for any errors mentioning "dental" or "chart"

**Common errors:**
- ❌ "404 Not Found" on `/api/patients/[id]/chart` → Migration not applied
- ❌ "dental_charts does not exist" → Migration not applied
- ✅ No errors → Should be working!

### Step 3: Check Network Tab
1. In DevTools, go to "Network" tab
2. Reload the patient profile page
3. Look for request to `/api/patients/[id]/chart`

**What you should see:**
- ✅ Request appears → Component is trying to load
- ✅ Status 200 → Chart loaded successfully
- ❌ Status 404/500 → Database issue, check migration

### Step 4: Visual Check
On the patient profile page, you should see:
1. **Patient header** with photo
2. **AI Insights** cards
3. **Medical Images** section with tabs
4. **→ DENTAL CHART ←** (NEW SECTION)
5. Medical History and Insurance sections

If you don't see the Dental Chart section between Medical Images and Medical History, the component might not be rendering.

---

## Troubleshooting

### Issue: "Table dental_charts does not exist"

**Solution:**
Apply the migration (see Option 1 above). The table must be created before the feature works.

---

### Issue: Chart section appears but shows loading spinner forever

**Possible causes:**
1. API endpoint error
2. Authentication issue
3. RLS policy blocking access

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Run this in Supabase to check RLS:

```sql
-- Check if you can query the table
SELECT COUNT(*) FROM dental_charts;

-- If this fails, RLS might be blocking you
-- Check your user's clinic_id:
SELECT id, email, clinic_id, role FROM users WHERE id = auth.uid();
```

---

### Issue: "Unauthorized" error

**Solution:**
Make sure you're logged in:
1. Navigate to `/login`
2. Sign in with valid credentials
3. Go back to patient profile
4. Chart should load

---

### Issue: Chart appears but shows "No dental chart available"

This is actually **normal** on first load! 
- Click "Load Chart" button
- System will create a new chart with 32 healthy teeth
- Chart will appear

---

## What Happens When It Works

1. **First time viewing a patient's chart:**
   - API creates new chart automatically
   - 32 teeth initialized as "healthy"
   - Chart appears immediately

2. **After that:**
   - Chart loads from database
   - Shows saved data (tooth status, diagnoses, etc.)
   - You can click teeth to edit

3. **Visual appearance:**
   - Card with "Dental Chart" title
   - Toolbar with numbering system selector
   - SVG tooth map (32 teeth in upper/lower arches)
   - Color-coded by status
   - Click any tooth to open detail panel

---

## Quick Diagnostic Commands

### Check if migration was applied:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'dental_charts';
```

### Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'dental_charts';
```

### Try to manually create a test chart:
```sql
-- Replace UUIDs with real values from your database
INSERT INTO dental_charts (patient_id, clinic_id, teeth, version)
VALUES (
    'YOUR_PATIENT_ID'::uuid,
    'YOUR_CLINIC_ID'::uuid,
    '[]'::jsonb,
    1
);
```

If this INSERT fails, check the error message for clues.

---

## Still Not Working?

### Collect This Information:

1. **Browser Console Errors**
   - Press F12
   - Copy any red errors

2. **Network Tab**
   - Check if request to `/api/patients/[id]/chart` appears
   - Check response status and body

3. **Database Check**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT 
       EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dental_charts') as table_exists,
       COUNT(*) as existing_charts 
   FROM dental_charts;
   ```

4. **Server Logs**
   - Check terminal running `npm run dev`
   - Look for errors related to dental charts

### Common Fixes:

**90% of issues:** Migration not applied
- **Fix:** Apply the migration using Option 1 above

**5% of issues:** Browser cache
- **Fix:** Hard refresh (`Ctrl+Shift+R`)

**3% of issues:** Not logged in
- **Fix:** Go to `/login` and sign in

**2% of issues:** RLS policy blocking
- **Fix:** Verify user has `clinic_id` and patient belongs to same clinic

---

## File Locations

- **Migration**: `supabase/migrations/20260223000001_dental_charts.sql`
- **API Route**: `app/api/patients/[id]/chart/route.ts`
- **Component**: `components/dental-chart/interactive-dental-chart.tsx`
- **Integration**: `app/(dashboard)/patients/[id]/patient-profile-client.tsx` (line 788)

---

## Success Checklist

- [ ] Migration applied to database
- [ ] Table `dental_charts` exists
- [ ] Logged into the app
- [ ] Viewing a patient profile page
- [ ] Hard refresh performed
- [ ] Dental Chart section visible
- [ ] Can click teeth and see detail panel
- [ ] Changes save successfully

---

## Next Steps After Fix

Once the chart appears:
1. Click any tooth to open the detail panel
2. Change tooth status (e.g., to "problem")
3. Click "Save Changes"
4. Refresh page - change should persist
5. Try different numbering systems (Universal/FDI/Palmer)

Enjoy your new dental chart feature! 🦷
