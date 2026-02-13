# Team Planner Module - Implementation Guide

## Overview
The Team Planner module is a comprehensive staff scheduling and workforce management system for your dental practice SaaS. It integrates seamlessly with your existing Next.js 15 + Supabase architecture.

## ✅ What's Been Implemented

### 1. Database Schema (`supabase/migrations/20260213_team_planner.sql`)
- **staff_schedules**: Recurring weekly schedules for staff members
- **staff_schedule_overrides**: One-time exceptions to recurring schedules
- **time_off_requests**: Staff time-off request and approval workflow
- **team_planner_audit_log**: Complete audit trail for all changes
- **Row Level Security (RLS)**: Clinic isolation and role-based access
- **Triggers**: Automatic `updated_at` timestamps and audit logging
- **Availability Function**: `check_staff_availability()` for appointment validation

### 2. API Routes
- `/api/staff-schedules` - CRUD operations for recurring schedules
- `/api/time-off-requests` - Time-off request management with approval workflow
- `/api/schedule-overrides` - One-time schedule exceptions

### 3. UI Components
- **Rota Management** (`components/team-planner/rota-management.tsx`)
  - Weekly schedule grid for each staff member
  - Time pickers for shift start/end times
  - Active/inactive toggle for schedules
  - Add/remove shifts per day
  
- **Time-Off Requests** (`components/team-planner/time-off-requests.tsx`)
  - Request submission dialog
  - Approval/rejection workflow
  - Status badges and filtering
  - Stats dashboard
  
- **Team Availability Calendar** (placeholder)
- **Workload Overview** (placeholder)

### 4. Navigation
- Added "Team Planner" to sidebar with UserCheck icon
- Teal-to-emerald gradient matching your design system

## 🔧 Next Steps to Complete Implementation

### 1. Run the Database Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: Copy SQL to Supabase Dashboard
# Go to: Supabase Dashboard > SQL Editor > New Query
# Paste contents of: supabase/migrations/20260213_team_planner.sql
# Run the query
```

### 2. Update Authentication Context
The time-off request submission needs the current user's staff ID. Update the request in `time-off-requests.tsx`:

```typescript
// In handleSubmitRequest function, replace:
staff_id: 'current-user-id'

// With:
staff_id: user.id  // or however you access the current user's ID
```

### 3. Integrate with Appointment Booking
Update your appointment booking logic to check staff availability:

```typescript
// In your appointment creation/update logic
const { data, error } = await supabase.rpc('check_staff_availability', {
  p_staff_id: staffId,
  p_date: appointmentDate,
  p_start_time: startTime,
  p_end_time: endTime
})

if (!data) {
  toast.error('Staff member is not available at this time')
  return
}
```

### 4. Implement Advanced Features (Optional)

#### A. Team Availability Calendar
Replace the placeholder with a full calendar view:
- Use `react-big-calendar` or similar
- Show all staff schedules in one view
- Color-code by staff member or availability status
- Click to add overrides or view details

#### B. Workload Overview Analytics
Implement charts using `recharts`:
- Appointments per staff member (bar chart)
- Hours booked vs. available (comparison chart)
- Utilization percentage (gauge/progress)
- Overtime alerts (conditional badges)

#### C. Bulk Operations
- Copy week functionality (duplicate schedules to another week)
- Bulk approve/reject time-off requests
- Import/export schedules (CSV)

#### D. Notifications
Integrate with your notification system:
- Notify staff when time-off is approved/rejected
- Alert admins of pending requests
- Remind staff of upcoming shifts

### 5. Permissions & Role-Based Access

The module respects your existing role structure:

```typescript
// Permissions already implemented in RLS policies:
{
  "super_admin": ["full_access"],
  "clinic_admin": ["manage_rotas", "approve_time_off", "view_team_calendar", "view_workload"],
  "dentist": ["view_own_schedule", "submit_time_off"],
  "hygienist": ["view_own_schedule", "submit_time_off"],
  "receptionist": ["view_team_calendar"],
  "accountant": [],
  "patient": []
}
```

To add UI-level permission checks:

```typescript
import { useAuth } from '@/lib/auth-context'

const { profile } = useAuth()
const canManageRotas = ['super_admin', 'clinic_admin'].includes(profile?.role)

{canManageRotas && (
  <Button onClick={saveSchedules}>Save Changes</Button>
)}
```

### 6. Subscription Gating (Optional)
Implement plan-based limits:

```typescript
// In rota-management.tsx
const { subscription } = useSubscription() // Your subscription hook

const maxStaff = {
  starter: 3,
  growth: 15,
  enterprise: Infinity
}[subscription?.plan || 'starter']

if (staff.length >= maxStaff) {
  toast.error(`Upgrade to add more than ${maxStaff} staff members`)
  return
}
```

## 📊 Database Schema Details

### staff_schedules
- Stores recurring weekly schedules
- `day_of_week`: 0 (Sunday) to 6 (Saturday)
- `is_active`: Toggle schedules on/off without deleting
- Unique constraint prevents duplicate shifts

### staff_schedule_overrides
- One-time exceptions (e.g., "Working 10-2 on Christmas Eve")
- `is_available: false` = Staff unavailable that day
- Overrides take precedence over recurring schedules

### time_off_requests
- Full approval workflow: pending → approved/rejected/cancelled
- Tracks who approved and when
- Date range validation (end >= start)

### Audit Logging
- Automatic logging of all create/update/delete operations
- Stores old and new values as JSONB
- Queryable for compliance and debugging

## 🎨 Design Consistency

All components follow your existing design patterns:
- **Teal/Slate color scheme**
- **Card-based layouts with shadows**
- **Consistent button styles and badges**
- **Responsive grid layouts**
- **Toast notifications for feedback**

## 🔒 Security Features

1. **Row Level Security**: Users can only access data from their clinic
2. **Clinic Isolation**: All queries filtered by `clinic_id`
3. **Role Enforcement**: RLS policies check user roles
4. **Audit Trail**: All changes logged with user ID and timestamp
5. **Validation**: Database constraints prevent invalid data

## 📈 Performance Optimizations

- **Indexes** on frequently queried columns (clinic_id, staff_id, dates)
- **Availability caching** recommended for high-traffic clinics
- **Efficient queries** using Supabase's query builder
- **Real-time updates** possible via Supabase subscriptions

## 🧪 Testing Checklist

- [ ] Run database migration successfully
- [ ] Create a staff schedule for a team member
- [ ] Submit a time-off request
- [ ] Approve/reject a time-off request
- [ ] Add a schedule override
- [ ] Verify appointment booking checks availability
- [ ] Test with different user roles
- [ ] Verify audit logs are created
- [ ] Test on mobile/tablet (responsive design)

## 🚀 Future Enhancements

1. **Shift Templates**: Save common shift patterns for quick application
2. **Recurring Time-Off**: Annual leave patterns
3. **Shift Swapping**: Staff can request to swap shifts
4. **Mobile App**: Native mobile scheduling
5. **AI Optimization**: Suggest optimal schedules based on appointment patterns
6. **Integration**: Sync with external calendar systems (Google Calendar, Outlook)

## 📝 Notes

- The module is multi-tenant ready with `clinic_id` on all tables
- All times are stored in TIME format (no timezone) - assumes clinic local time
- Dates use DATE format for clarity
- The `check_staff_availability()` function is ready for appointment integration
- Audit logs use JSONB for flexibility in storing change history

## Support

For questions or issues:
1. Check the database migration logs
2. Verify RLS policies are enabled
3. Check browser console for API errors
4. Review Supabase logs in the dashboard
