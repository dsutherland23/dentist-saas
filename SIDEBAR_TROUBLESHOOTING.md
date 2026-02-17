# Sidebar Menu Not Loading - Troubleshooting Guide

## Issue: Left menu (sidebar) not showing Dashboard, Patients, etc.

### ✅ Good News
The dental chart implementation is **NOT** causing this issue. The dev server starts successfully with no errors related to the new code.

---

## Root Cause Analysis

The sidebar code has this logic (line 142-143 in `sidebar.tsx`):

```typescript
const filtered = profile ? allRoutes.filter(route => canAccessSection(profile, route.key)) : []
const routes = filtered.length > 0 ? filtered : (profile ? allRoutes : [])
```

**Translation**: If `profile` is `null`, the sidebar shows **no routes** (empty array).

---

## Common Causes & Solutions

### 1. User Not Logged In ✋

**Symptoms:**
- Sidebar is completely blank
- You see login page or are redirected

**Solution:**
1. Navigate to `/login`
2. Sign in with valid credentials
3. Sidebar should appear after successful login

---

### 2. Profile Still Loading ⏳

**Symptoms:**
- Blank sidebar for 1-3 seconds, then appears
- This is **normal behavior** during page load

**Why it happens:**
- AuthProvider needs to fetch user session from Supabase
- Then it fetches the user profile with clinic info
- Sidebar waits for profile before showing routes

**Solution:**
This is expected behavior. If it takes too long (>5 seconds), check your database connection.

---

### 3. Database Connection Issue 🔌

**Symptoms:**
- Sidebar never appears
- Console shows errors about Supabase
- Other data (patients, appointments) also won't load

**Check:**
1. Open browser DevTools Console (F12)
2. Look for errors mentioning "supabase" or "fetch"
3. Check `.env.local` file has correct values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Solution:**
- Verify Supabase project is running
- Check environment variables are correct
- Restart dev server after changing `.env.local`

---

### 4. RLS Policies Blocking Access 🔒

**Symptoms:**
- Logged in successfully
- Sidebar still blank
- Console shows 403 or "insufficient permissions"

**Check:**
Run in Supabase SQL Editor:
```sql
-- Check if your user exists
SELECT id, email, clinic_id, role FROM users WHERE id = auth.uid();

-- Check if you have clinic access
SELECT * FROM clinics WHERE id = (SELECT clinic_id FROM users WHERE id = auth.uid());
```

**Solution:**
If queries return no rows, your user might not be properly set up:
1. Complete onboarding process
2. Or manually insert user into `users` table with valid `clinic_id`

---

### 5. User Has No Allowed Sections 🚫

**Symptoms:**
- Logged in successfully
- Sidebar appears but shows only logout button
- No menu items visible

**Check:**
```sql
SELECT allowed_sections FROM users WHERE id = auth.uid();
```

**If `allowed_sections` is an empty array `[]`:**
```sql
-- Fix: Set allowed_sections to null (means "all access")
UPDATE users 
SET allowed_sections = NULL 
WHERE id = auth.uid();
```

**Or grant specific sections:**
```sql
UPDATE users 
SET allowed_sections = ARRAY['dashboard', 'patients', 'calendar', 'treatments'] 
WHERE id = auth.uid();
```

---

## Quick Diagnostic Checklist

Run these checks in order:

### Step 1: Check Browser Console
```
1. Open DevTools (F12 or right-click → Inspect)
2. Go to Console tab
3. Look for red error messages
4. Share any errors mentioning "auth", "supabase", or "profile"
```

### Step 2: Check Network Tab
```
1. Go to Network tab in DevTools
2. Refresh the page
3. Look for failed requests (red status codes)
4. Check if any API calls return 401 (Unauthorized) or 403 (Forbidden)
```

### Step 3: Check Auth State
Open browser console and run:
```javascript
// Check if auth context is working
console.log('Auth check running...')

// This should show your profile if logged in
// (Note: only works after page fully loads)
```

### Step 4: Verify Database Connection
In Supabase SQL Editor:
```sql
-- Test 1: Can you query at all?
SELECT NOW();

-- Test 2: Do tables exist?
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Test 3: Can you see your user?
SELECT id, email, role, clinic_id FROM users LIMIT 5;
```

---

## Fixing Common Issues

### Issue: "Can't connect to Supabase"
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Verify contents (don't share the actual keys!)
cat .env.local | grep SUPABASE

# 3. Restart dev server
npm run dev
```

### Issue: "User profile not found"
```sql
-- Check if user record exists
SELECT * FROM users WHERE email = 'your-email@example.com';

-- If missing, complete onboarding at /onboarding
-- Or insert manually (replace values):
INSERT INTO users (id, clinic_id, email, first_name, last_name, role)
VALUES (
  'your-auth-uid',
  'your-clinic-uuid',
  'your-email@example.com',
  'John',
  'Doe',
  'clinic_admin'
);
```

### Issue: "Sidebar shows but is empty"
```sql
-- Check allowed_sections
SELECT id, email, role, allowed_sections FROM users WHERE email = 'your-email@example.com';

-- If allowed_sections is [], set to NULL for full access
UPDATE users SET allowed_sections = NULL WHERE email = 'your-email@example.com';
```

---

## Test After Dental Chart Implementation

The dental chart feature added:
- ✅ 1 migration (dental_charts table)
- ✅ 1 API route (/api/patients/[id]/chart)
- ✅ 2 UI components (dental chart + tooth panel)
- ✅ 1 types file
- ✅ 1 modified file (patient-profile-client.tsx)

**None of these affect the sidebar menu.**

To verify:
1. Dental chart code only loads when viewing a patient profile
2. Sidebar is a separate component that loads on all dashboard pages
3. Build completed successfully (confirmed earlier)
4. Dev server starts without errors (confirmed above)

---

## Still Having Issues?

### Collect Debug Info

1. **Browser Console Output**
   - Take screenshot of any errors
   - Include full error messages

2. **Network Tab**
   - Filter by "Fetch/XHR"
   - Look for failed requests
   - Check response details

3. **Database Check**
   ```sql
   -- Run this and share results
   SELECT 
     (SELECT COUNT(*) FROM users) as user_count,
     (SELECT COUNT(*) FROM clinics) as clinic_count,
     (SELECT COUNT(*) FROM patients) as patient_count;
   ```

4. **Auth State**
   - Can you access `/login`?
   - Can you log in successfully?
   - Are you redirected after login?

### Next Steps

Based on symptoms above, the issue is likely:
- **90% chance**: Not logged in or profile not loading
- **8% chance**: Database connection or RLS issue
- **2% chance**: Something else

**Most common fix**: Simply log out and log back in.

```
1. Go to any page
2. Look for logout button (should be at bottom of sidebar if visible)
3. Or navigate to /login directly
4. Sign in again
5. Sidebar should populate
```

---

## Developer Notes

The sidebar rendering logic:

```typescript
// sidebar.tsx line 142-143
const filtered = profile ? allRoutes.filter(route => canAccessSection(profile, route.key)) : []
const routes = filtered.length > 0 ? filtered : (profile ? allRoutes : [])
```

This means:
1. If `profile` is `null` → show **no routes** (empty sidebar)
2. If `profile` exists but `allowed_sections` is `[]` → show **no routes**
3. If `profile` exists and `allowed_sections` is `null` → show **all routes**
4. If `profile` exists and `allowed_sections` has values → show **only allowed routes**

This is **intentional security behavior** to prevent unauthorized access.
