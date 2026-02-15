# Multi-User Access Control & Limits System

This document describes the multi-user architecture implemented for the dental SaaS application, following modern 2026 best practices.

## Overview

The system enables one clinic admin to invite multiple users with granular control over:
- **Section Access**: Which parts of the webapp each user can access
- **Usage Limits**: Per-user caps on resources (patients, appointments per month)

## Architecture

### Single Source of Truth

All permissions and limits are stored on the `users` table:
- `role`: Coarse-grained role (clinic_admin, dentist, receptionist, etc.)
- `allowed_sections`: Array of section keys or null for full access
- `limits`: JSON object with usage caps (e.g., `{"patients": 500}`)

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│  users: role, allowed_sections, limits                  │
│  RLS policies for tenant isolation                       │
└─────────────────────────────────────────────────────────┘
                            ↑
                            │
┌─────────────────────────────────────────────────────────┐
│                    Library Layer                         │
│  - access-config.ts: Section definitions                │
│  - permissions.ts: canAccessSection, getLimit           │
│  - limit-enforcement.ts: checkLimit (server-side)       │
└─────────────────────────────────────────────────────────┘
                            ↑
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
┌─────────────────────┐           ┌──────────────────────┐
│    UI Layer         │           │    API Layer         │
│  - Sidebar          │           │  - /api/staff/invite │
│  - RouteGuard       │           │  - /api/staff PATCH  │
│  - Staff Dialog     │           │  - Limit checks      │
└─────────────────────┘           └──────────────────────┘
```

## File Structure

| File | Purpose |
|------|---------|
| `supabase/migrations/20260215000005_user_access_and_limits.sql` | DB migration adding `allowed_sections` and `limits` columns |
| `lib/access-config.ts` | Section definitions (keys, labels, paths) |
| `lib/permissions.ts` | Client & server permission helpers |
| `lib/limit-enforcement.ts` | Server-side limit checking |
| `lib/auth-context.tsx` | Profile type extended with new fields |
| `app/api/staff/invite/route.ts` | Invite API using Supabase Auth Admin |
| `app/api/staff/route.ts` | PATCH updated to accept `allowed_sections` and `limits` |
| `app/(dashboard)/staff/staff-dialog.tsx` | UI for setting access & limits |
| `components/dashboard-layout/sidebar.tsx` | Filters nav by `allowed_sections` |
| `components/route-guard.tsx` | Redirects if user accesses restricted path |
| `app/(dashboard)/layout.tsx` | Wraps dashboard with RouteGuard |
| `app/(dashboard)/patients/actions.ts` | Enforces patient limit |
| `app/(dashboard)/calendar/actions.ts` | Enforces appointments_per_month limit |

## How It Works

### 1. Inviting Users

**Admin Flow:**
1. Admin opens Staff page → "Add Staff" button
2. Fills in: name, email, role, phone
3. (Optional) Opens "Advanced" section:
   - Checks "Restrict access" and selects sections
   - Sets usage limits (patients, appointments per month)
4. Clicks "Send Invitation"

**Backend:**
- `POST /api/staff/invite`:
  - Uses `createAdminClient()` (service role)
  - Calls `auth.admin.inviteUserByEmail(email, options)`
  - Inserts row in `users` with invited user's ID
  - Stores `allowed_sections` and `limits`
- Invitee receives email with password setup link
- After setting password, they're redirected to `/dashboard`

### 2. Section Access Control

**Client-Side (UX):**
- **Sidebar** (`components/dashboard-layout/sidebar.tsx`):
  - Filters `routes` using `canAccessSection(profile, sectionKey)`
  - User only sees links they're allowed to access
- **RouteGuard** (`components/route-guard.tsx`):
  - Checks `canAccessPath(profile, pathname)`
  - Redirects to `/dashboard` if user navigates to restricted URL

**Logic:**
```typescript
// null or empty = full access (backward compatible)
if (!profile.allowed_sections || profile.allowed_sections.length === 0) {
  return true // all sections allowed
}

// Check if section is in allowed list
return profile.allowed_sections.includes(sectionKey)
```

### 3. Usage Limits

**Server-Side Enforcement:**
- In create actions (patients, appointments):
  1. Get current user ID
  2. Call `checkLimit(userId, limitKey, additionalCount)`
  3. If limit exceeded, throw error with message
  4. Otherwise, proceed with creation

**Example:**
```typescript
// In saveAppointment action
const limitCheck = await checkLimit(user.id, "appointments_per_month", 1)
if (!limitCheck.allowed) {
  throw new Error(limitCheck.message) // "Monthly appointment limit reached (50/50)"
}
```

**Supported Limits:**
- `patients`: Total patients in clinic
- `appointments_per_month`: Appointments created in current calendar month

## Design Principles (2026-style)

1. **Invite-only, no shared accounts**: Every user has their own Supabase Auth account
2. **RLS as the backbone**: Database enforces tenant isolation even if app code forgets
3. **Single source of truth**: `users` table contains all permission data
4. **Fail closed**: Unknown section or missing profile → no access
5. **Server is the authority**: UI hides for UX, but APIs enforce limits
6. **Minimal surface area**: No extra permission tables; role + sections + limits is enough

## Adding New Sections

1. Add to `SECTIONS` array in `lib/access-config.ts`:
```typescript
{
  key: "new-feature",
  label: "New Feature",
  path: "/new-feature",
  description: "Description of the feature"
}
```

2. Add route to sidebar in `components/dashboard-layout/sidebar.tsx`:
```typescript
{
  label: "New Feature",
  icon: SomeIcon,
  href: "/new-feature",
  gradient: "from-color-500 to-color-600",
  key: "new-feature"
}
```

3. Create the page at `app/(dashboard)/new-feature/page.tsx`

The section will automatically:
- Appear in Staff dialog for admin to control
- Be filtered in sidebar based on user's `allowed_sections`
- Be protected by RouteGuard

## Adding New Limits

1. Add to `LIMIT_TYPES` in `lib/access-config.ts`:
```typescript
{
  key: "new_limit",
  label: "New Limit Label",
  description: "What this limit controls"
}
```

2. Add enforcement in `lib/limit-enforcement.ts` `checkLimit()` switch:
```typescript
case "new_limit": {
  const { count, error } = await supabase
    .from("resource_table")
    .select("*", { count: "exact", head: true })
    .eq("clinic_id", profile.clinic_id)
  
  currentCount = count || 0
  break
}
```

3. Add check in the relevant create action:
```typescript
const limitCheck = await checkLimit(user.id, "new_limit", 1)
if (!limitCheck.allowed) {
  throw new Error(limitCheck.message)
}
```

## Testing

### Test Section Access

1. **Create a test user with restrictions:**
   - Login as admin
   - Go to Staff page
   - Add user with email `test@example.com`
   - Open "Advanced" → Check "Restrict access"
   - Select only "Dashboard" and "Patients"
   - Send invitation

2. **Login as restricted user:**
   - Should see only Dashboard and Patients in sidebar
   - Trying to navigate to `/calendar` should redirect to `/dashboard`

### Test Usage Limits

1. **Set a low limit:**
   - Edit a user
   - Set "Max Patients" to 2
   - Save

2. **Login as that user:**
   - Create 2 patients successfully
   - Try to create a 3rd → should see error "Patient limit reached (2/2)"

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is required for invite API (already used for referral links)
- Service role bypasses RLS; use only in trusted server routes
- RLS policies remain the ultimate authority for data access
- Section access is enforced in UI and (optionally) in sensitive API routes
- Limits are enforced server-side only (no client-side bypass possible)

## Migration Path

**For existing users:**
- `allowed_sections` defaults to `null` → full access (backward compatible)
- `limits` defaults to `{}` → no limits
- No disruption to existing functionality

**To restrict an existing user:**
1. Admin edits the user in Staff dialog
2. Enables restrictions and selects sections
3. Sets limits if desired
4. Saves → restrictions apply immediately on next page load

## Future Enhancements

Possible extensions (not implemented):
- Per-role default permissions
- Action-level permissions (e.g., "can delete patients")
- Audit log for permission changes
- Time-based access (temporary access)
- API-level section enforcement for extra security layer
- Limit notifications (e.g., "80% of patient limit used")

## Troubleshooting

**User can't access any sections:**
- Check `allowed_sections` in database (should be null or contain section keys)
- Verify section keys match those in `lib/access-config.ts`

**Invite email not sending:**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
- Verify Supabase email templates are configured
- Check Supabase Auth logs for errors

**Limit not enforcing:**
- Verify user has `limits` object with the key set
- Check console logs in limit enforcement for errors
- Ensure `checkLimit()` is called before insert/create

**Sidebar not filtering:**
- Ensure routes in sidebar have `key` property matching section keys
- Check `canAccessSection()` is being called
- Verify profile is loaded (check auth context)
