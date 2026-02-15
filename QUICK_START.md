# Quick Start: Multi-User System

## 🚀 Get Started in 3 Steps

### Step 1: Apply Database Migration

1. Open Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to your project → SQL Editor
3. Copy and paste this SQL:

```sql
-- Add allowed_sections and limits columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS allowed_sections text[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS limits jsonb DEFAULT '{}';

COMMENT ON COLUMN users.allowed_sections IS 'Array of section keys user can access. NULL or empty = full access. Example: [''dashboard'', ''calendar'', ''patients'']';
COMMENT ON COLUMN users.limits IS 'Usage limits per user. Example: {"patients": 500, "appointments_per_month": 200}. Missing keys = unlimited.';
```

4. Click "Run" or press Cmd+Enter

✅ **Done!** The database is now ready.

---

### Step 2: Test the Invite System

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Login as admin** (your current account)

3. **Navigate to Staff page**

4. **Click "Add Staff"** and fill in:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com (use a real email you can access)
   - Role: Receptionist
   - Phone: (optional)

5. **Click "Advanced: Access Control & Limits"**:
   - Check "Restrict access"
   - Select only: Dashboard, Patients
   - Set "Max Patients": 2

6. **Click "Send Invitation"**

7. **Check the email inbox** for test@example.com
   - You'll receive a "Complete your signup" email
   - Click the link and set a password

8. **Login as the test user**:
   - Should only see Dashboard and Patients in sidebar
   - Try navigating to `/calendar` → should redirect to `/dashboard`
   - Create 2 patients → should work
   - Try to create a 3rd patient → should show error "Patient limit reached (2/2)"

✅ **Success!** The system is working.

---

### Step 3: Manage Users

**To Edit a User**:
1. Go to Staff page
2. Click on a staff member
3. Click "Edit"
4. Change sections or limits
5. Click "Save Changes"

**To Remove Restrictions**:
1. Edit user
2. Uncheck "Restrict access"
3. Clear limit fields (or set to 0)
4. Save

**To Delete a User**:
1. Go to Staff page
2. Click on user → Delete button
3. Confirm

---

## 📖 Full Documentation

For detailed information, see:
- **MULTI_USER_SYSTEM.md** - Complete architecture and usage guide
- **IMPLEMENTATION_SUMMARY.md** - What was implemented

---

## 🎯 Available Sections

You can grant/restrict access to these sections:
- Dashboard
- Calendar
- Patients
- Treatments
- Clinical Referrals
- Invoices
- Insurance Claims
- Payments
- Messages
- Reports
- Staff
- Team Planner
- Settings

---

## 📊 Available Limits

You can set these usage limits:
- **Max Patients**: Total patients user can create
- **Appointments Per Month**: Max appointments per calendar month

*More limit types can be added in `lib/access-config.ts`*

---

## 🔧 Troubleshooting

**Migration fails?**
- Make sure you're logged into Supabase Dashboard
- Use the SQL Editor, not the migration tools
- Copy the SQL exactly as shown

**Invite email not received?**
- Check spam folder
- Verify email address is correct
- Check Supabase Auth logs in Dashboard

**User can't login?**
- Verify they set their password via the invite email
- Check if user exists in Supabase Auth (Dashboard → Authentication)

**Restrictions not working?**
- Clear browser cache and reload
- Check if `allowed_sections` is set in database
- Verify you're logged in as the restricted user (not admin)

---

## 🎉 You're All Set!

The multi-user system is ready to use. Invite your team and start managing access and limits!

**Need Help?** Check the full documentation in MULTI_USER_SYSTEM.md
