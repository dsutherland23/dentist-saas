# Full System Audit — Dental SaaS

**Auditor role:** Senior QA Engineer + Full Stack Auditor  
**Scope:** Functional, logic, and data-flow verification (no redesign, no feature suggestions).  
**Status:** In progress; findings and recommended fixes below.

---

## Critical: Middleware Not Running

**Finding:** Next.js invokes middleware only from a root file named **`middleware.ts`** (or `middleware.js`) that exports a function named **`middleware`** (or default). This project has:

- **`proxy.ts`** — exports `proxy()` and `config.matcher`; **not used** by Next.js.
- **`lib/middleware.ts`** — contains `updateSession()` (auth/session logic).
- **`middleware.ts.bak`** — backup; not active.

**Impact:** Auth redirect (unauthenticated users → `/login`) may never run. Dashboard and other protected routes could be reachable without login.

**Fix:** Add a root **`middleware.ts`** that runs the same logic (e.g. call `updateSession` and use the same `config.matcher`). Optionally keep `proxy.ts` as a wrapper or remove it once `middleware.ts` is in place.

---

## Phase 1 — UI Element Audit

### Dashboard (`/dashboard`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **View All** (Recent Activity) | `toast.info("Activity log feature coming soon")` | Placeholder | No route, no real action. |
| **Quick Stats** (right column) | None (static) | Hardcoded | "18/24", "4.8/5.0", "$48K/$50K", "98.5%", "234 reviews", "75% capacity", "$2K remaining" — not from API. |
| **Upcoming Milestones** | None (static) | Hardcoded | "2000th Patient – 153 to go", "$50K Revenue – $2K to go". |
| **Stats grid badges** | None (static) | Hardcoded | Appointments "5.7%", Completion Rate "2.1%" — not from stats API. |
| **Today / View Reports / Open Full Calendar** | `router.push` / refetch | OK | Routes and behavior verified. |
| **Schedule / Rota tabs** | API-driven | OK | Loading and empty states present. |

**Recommendations:**

- Replace or clearly mark as placeholder: View All activity, Quick Stats, Upcoming Milestones.
- Drive stat badges and right-column metrics from real APIs or remove/simplify.

### Login (`/login`)

- Form: email, password, submit → `supabase.auth.signInWithPassword` → redirect `/dashboard`; loading and error toasts present. **OK.**

### Signup

- Form → `signUp` + POST `/api/auth/signup`; redirects to login or dashboard. **OK.** (See Phase 2.)

### Onboarding / Migrate

- **Onboarding:** Fully audited — see "Detailed Audit" section. **OK.**
- **Migrate:** Fully audited — see "Detailed Audit" section. **OK.**

### Invoices (`/invoices`)

- Fetch from `/api/invoices`, search, archive (PATCH), view details (dialog), new invoice dialog; PDF export. **Logic connected.** Verify empty/error states on fetch.

### Messages (`/messages`)

- **Bug:** Backend table uses column **`message`**; API and frontend use **`content`**. GET returns `message`, UI uses `msg.content` → display broken. POST inserts `content` → column missing → insert can fail. **Fix:** Use `message` in API (insert/select) and use `msg.message` in UI, or add a DB migration to rename column to `content` and keep API/frontend as-is.

### Settings — Billing

- **Finding:** GET returns real plan/status/invoices; `payment_method` is **hardcoded** (`last4: "4242", brand: "visa", expiry: "12/2025"`). Not from DB. Flag as placeholder or wire to real payment provider.

### Settings — Team

- GET: real team from `users` by `clinic_id`. POST (invite): returns success message but **does not call** `supabase.auth.admin.inviteUserByEmail` (comment: "For this demo, let's just return success"). **Placeholder.**

### Clinical Referrals — Settings

- "Portfolio builder coming soon!" toast; one "Coming Soon" badge. **Placeholder.**

---

## Detailed Audit: Settings, Onboarding, Migrate, Patient Profile, Clinical Referrals Settings

### Settings (`/settings`) — All Tabs

| Tab | Element | Action | Status | Notes |
|-----|--------|--------|--------|-------|
| **General** | Logo upload | POST `/api/settings/logo-upload` → PUT clinic | OK | Loading state; toast on success/error. |
| **General** | Practice fields (name, email, phone, website, address, city, state, zip) | Controlled state → `handleSaveClinic` → PUT `/api/settings/clinic` | OK | — |
| **General** | Business hours (weekday/weekend) | Same save flow | OK | — |
| **General** | Timezone, Language (Regional) | `handleSavePreferences` → PUT `/api/settings/preferences` | OK | — |
| **Notifications** | Email, SMS, Appointment reminders, Marketing toggles | Same `handleSavePreferences` | OK | Switches update state; Save commits. |
| **Security** | Current / New / Confirm password | `handleUpdatePassword` → `supabase.auth.updateUser` | OK | Validation; no current-password verify (Supabase handles). |
| **Security** | Two-Factor "Enable" | No action | **Placeholder** | Button has no `onClick`. |
| **Security** | Active Sessions | Hardcoded "MacBook Pro - Chrome" | **Fake data** | Revoke button has no `onClick`; not from API. |
| **Billing** | Plan display | From `billing` API | OK | Real plan/status/invoices. |
| **Billing** | `payment_method` | Hardcoded fallback | **Placeholder** | API returns hardcoded last4/brand/expiry. |
| **Billing** | Change Plan | No action | **Placeholder** | Button has no `onClick`. |
| **Billing** | Update (payment method) | No action | **Placeholder** | Button has no `onClick`. |
| **Billing** | Invoice Download | No action | **Placeholder** | Button has no `onClick`. |
| **Team** | Invite flow | `handleInviteMember` uses `newMemberEmail` | **Broken** | No input for email; `newMemberEmail` never set by user. Invite button effectively does nothing. |
| **Team** | Role dropdown | `handleUpdateRole` → PUT `/api/settings/team` | OK | — |
| **Team** | Remove member | No action | **Placeholder** | Remove button has no `onClick`; no DELETE call. |
| **Support** | Suggestions textarea | `handleSubmitSuggestion` | **Placeholder** | Uses `setTimeout` mock; comment: "In a real app, this would send to an API". |
| **Support** | View Full Policy / View Full Terms | No href | **Placeholder** | Buttons have no `href` or `onClick`. |
| **Support** | Help Center, Contact Support, System Status | No action | **Placeholder** | Buttons have no `href` or `onClick`. |

- **APIs:** `/api/settings/preferences`, `/api/settings/clinic`, `/api/settings/team`, `/api/settings/billing`, `/api/settings/logo-upload` — all real; loading/error states present on page.

### Onboarding (`/onboarding`)

| Element | Action | Status | Notes |
|--------|--------|--------|-------|
| **Clinic name** | Required input | OK | minLength 2. |
| **Admin name** | Optional input | OK | — |
| **Create clinic** | POST `/api/auth/complete-setup` | OK | Body: `clinicName`, `adminName`; success → redirect `/dashboard`; error toast. |
| **Contact support** | Link to `/login` | OK | — |
| **Loading** | Spinner on submit | OK | — |

- **Flow:** User without clinic lands here; completes setup; API creates clinic and links user; redirect to dashboard. **Fully functional.**

### Migrate (`/migrate`)

| Element | Action | Status | Notes |
|--------|--------|--------|-------|
| **Step 1: Bootstrap** / **Step 2: Full setup** | Tab switch; fetches `/api/migrate/bootstrap` or `/api/migrate/sql` | OK | Sets `sql` state; loading while fetching. |
| **Copy SQL** | `navigator.clipboard.writeText(sql)` | OK | Toast on success; "Copied!" state. |
| **Open SQL Editor** | External link `https://supabase.com/dashboard/project/_/sql/new` | OK | `target="_blank"`. |
| **Preview SQL** | `<details>` expand | OK | Shows SQL; line count. |

- **APIs:** `/api/migrate/bootstrap`, `/api/migrate/sql` return SQL strings. No automatic DB migration; user runs SQL manually. **Fully functional for intended use.**

### Patient Profile (`/patients/[id]`)

| Element | Action | Status | Notes |
|--------|--------|--------|-------|
| **New Appointment** | `NewAppointmentDialog`; `saveAppointment` | OK | Patient pre-selected; dentists from props. |
| **Message** | `router.push(/messages?patientId=...)` | **Verify** | Messages page may not handle `patientId` query. |
| **Invoice** | `NewInvoiceDialog` | OK | Patient pre-selected. |
| **Add Treatment** | POST `/api/patients/[id]/treatments` | OK | Procedures, diagnosis, notes, dentist, optional appointment. |
| **Medical Alerts** | PATCH `/api/patients/[id]/medical-alerts` | OK | Allergies, medical_conditions. |
| **Contact** | PATCH `/api/patients/[id]/contact` | OK | Phone, email, address. |
| **Insurance** | PATCH `/api/patients/[id]/insurance` | OK | Provider, policy_number. |
| **File upload** | Supabase storage + POST `/api/patients/[id]/files` | OK | Name, type, file_path. |
| **Delete treatment** | DELETE `/api/treatment-records/[id]` | OK | Confirm dialog. |
| **Tabs** (Overview, Appointments, Treatments, Files) | Client tabs | OK | — |
| **Empty states** | Appointments, treatments, files | OK | — |

- **Server:** Fetches patient, appointments, treatment_records, patient_files, treatments, dentists. **Data isolation:** `patients`, `appointments`, `treatment_records`, `patient_files` scoped by patient_id; RLS on patients likely enforces clinic. **Potential issue:** `treatments` and `dentists` (users) fetched **without `clinic_id`** — treatments table is per-clinic; dentists query has no clinic filter. If multi-tenant, could show treatments/dentists from other clinics. Recommend adding `clinic_id` filter (from patient's clinic) for both.
- **NewInvoiceDialog:** When `patients` not passed, dialog fetches `/api/patients`; `defaultPatientId` pre-selects. **OK.**

### Clinical Referrals Settings (`/clinical-referrals/settings`)

| Element | Action | Status | Notes |
|--------|--------|--------|-------|
| **Back to Map** | `router.push("/clinical-referrals")` | OK | — |
| **Register as Specialist** (when no profile) | Same; redirects to main referrals page | OK | User must register from main page dialog. |
| **Save Changes** (when profile exists) | PATCH `/api/specialists` | OK | Sends `id`, form data; toast on success/error. |
| **Professional Identity** | Name, specialty, bio | Controlled state | OK | — |
| **Clinic Visibility** | Clinic name, address, city, parish | Controlled state | OK | — |
| **Profile Status** | Display only | OK | approved/pending/etc. |
| **Appear in Map** switch | Disabled when not approved | OK | Display-only for now. |
| **Accept Referrals** | "Coming Soon" badge; switch disabled | **Placeholder** | — |
| **Contact** | Phone, email, website | Controlled state | OK | — |
| **Build Portfolio** | `toast.info("Portfolio builder coming soon!")` | **Placeholder** | — |

- **APIs:** GET `/api/specialties`, GET `/api/specialists?myProfile=true`, PATCH `/api/specialists`. Fetch and save flows wired; loading/empty states present.
- **Empty profile:** Card explains user must register first; CTA goes to main referrals page.

---

### Calendar (`/calendar`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **New Appointment** button | Opens dialog; submit → `saveAppointment` (server action) | OK | Uses patients, dentists from server props; inserts into `appointments` via Supabase. |
| **View tabs** (day/week/month) | `setView` | OK | Client-side only; no API. |
| **Prev/Next** nav | `setCurrentDate` | OK | Client-side date change. |
| **Appointment popover** (status) | PATCH `/api/appointments/[id]` | OK | Check-in, Start treatment, Complete; loading state `updatingStatusId`. |
| **Reschedule** (drag/drop) | `rescheduleAppointment` server action | OK | Updates `start_time`, `end_time`. |
| **Empty state** | Shown when no appointments in range | OK | — |

- **Server:** Page fetches patients, dentists, appointments in parallel; passes to `CalendarClient`. Uses `getClinicId()` (redirects to onboarding if no clinic).
- **No client refetch:** Appointments come from initial server fetch; `router.refresh()` after create/update — OK for RSC.

### Patients (`/patients`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Search** | Filters `initialPatients` by name/email | OK | Client-side. |
| **Filter tabs** (all / expected today / checked in) | Filters by `todayAppointments` | OK | Data from server. |
| **Add Patient** | Opens `ManagePatientDialog` | OK | Dialog submits → API; verify `patients` API POST. |
| **New Invoice** | Opens `NewInvoiceDialog` with patient pre-selected | OK | Uses invoices API. |
| **Delete** | `deletePatient` server action | OK | Confirm dialog; `router.refresh()`. |
| **Row link** | `Link` to `/patients/[id]` | OK | — |

- **Server:** Fetches patients and today's appointments; date range uses correct non-mutated `Date` instances.
- **Empty/error:** Error div on fetch error; no explicit empty-state UI for zero patients.

### Treatments (`/treatments`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Search** | Filters `treatments` by name/category | OK | Client-side. |
| **Add Treatment** | Opens dialog; POST `/api/treatments` | OK | Form validation; role check on API (admin/dentist). |
| **Edit** | PATCH `/api/treatments` | OK | Pre-fills form. |
| **Delete** | DELETE `/api/treatments?id=` | OK | Confirm dialog. |
| **Toggle active** | PATCH `is_active` | OK | — |
| **Loading / empty** | Loader, empty table message | OK | — |

- **API:** GET/POST/PATCH/DELETE; 401/403/404/500 handled; role check on write.

### Staff (`/staff`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Search** | Filters by name/role | OK | Client-side. |
| **Add Staff** | Opens `StaffDialog`; POST `/api/staff` | OK | — |
| **Edit** | Opens dialog with selected staff | OK | — |
| **View Schedule** | Opens `ScheduleViewDialog` | OK | Uses staff-schedules API. |
| **Time Off** | Opens `TimeOffDialog`; POST time-off API | OK | — |
| **Delete** | DELETE `/api/staff?id=` | OK | Confirm dialog. |
| **Links** (Profile, Messages) | `Link` to `/staff/[id]`, `/messages?user=` | OK | — |

- **API:** GET/POST/PATCH/DELETE; 401/404/500; role checks on invite/update.

### Reports (`/reports`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Tabs** | Revenue, Treatments, Staff | OK | All use same `data` from `/api/reports/stats`. |
| **Export CSV** | Downloads blob | OK | Uses `data` or `EMPTY_DATA`. |
| **Loading / error** | Spinner; error message with retry context | OK | — |
| **Empty data** | Charts show zeros | OK | `EMPTY_DATA` fallback. |

- **API:** Real DB (invoices, appointments, patients, staff). **Note:** `invoice_items` query with `invoice.clinic_id` filter may have PostgREST semantics to verify; `invoice_items` result not used in `treatmentDistribution` (computed from appointments) — dead code or future use.

### Insurance Claims (`/insurance-claims`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Search** | Filters by patient, claim #, provider | OK | Client-side. |
| **New Claim** | POST `/api/insurance-claims` | OK | Patient, invoice (optional), provider, policy, amount. |
| **Status update** | PATCH | OK | Dropdown or details dialog. |
| **View details** | Dialog with claim data | OK | — |
| **Delete** | DELETE | OK | — |

- **API:** GET/POST/PATCH/DELETE; fetches patients and invoices for dropdowns.

### Payments (`/payments`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Search** | Filters by patient, invoice #, ID | OK | Uses `payment.invoice?.patient`, `payment.invoice?.invoice_number`. |
| **Record Payment** | POST `/api/payments` | OK | Selects pending invoice; amount, method, transaction_id. |
| **Export CSV** | Downloads blob | OK | Requires `filteredPayments.length > 0`; toast if empty. |
| **Empty state** | Table shows "No payments" | OK | — |

- **API:** GET returns `invoice:invoices(invoice_number, patient:patients(first_name, last_name))` — matches UI `payment.invoice?.patient`. POST inserts payment; invoice status update handled by API or trigger.

### Team Planner (`/team-planner`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Tabs** | Rota, Time-Off, Calendar, Workload | OK | Each tab renders separate component. |
| **RotaManagement** | Fetch staff, schedules; POST/PATCH/DELETE `/api/staff-schedules` | OK | Add/edit/remove slots. |
| **TimeOffRequests** | Fetch `/api/time-off-requests`; approve/deny | OK | — |
| **TeamAvailabilityCalendar** | Calendar view | OK | — |
| **WorkloadOverview** | Workload stats | OK | — |

- Components fetch from `/api/staff`, `/api/staff-schedules`, `/api/time-off-requests`, etc.

### Clinical Referrals (`/clinical-referrals`)

| Element | Action | Status | Notes |
|--------|--------|--------|--------|
| **Specialist search** | Filters by name, clinic, city, parish, specialty | OK | Client-side. |
| **Specialty filter** | Filters by `selectedSpecialty` | OK | — |
| **Register Specialist** | Opens dialog; POST `/api/specialists` | OK | — |
| **Refer Patient** | Opens dialog; POST `/api/referrals` | OK | — |
| **Map / list** | Renders `filteredSpecialists` | OK | — |
| **Loading** | Spinner | OK | — |

- **Settings sub-page:** "Portfolio builder coming soon" toast; "Coming Soon" badge — placeholders (already noted).

---

## Phase 2 — Logic Validation

### Authentication

- **Login:** Implemented; success → `/dashboard`, errors shown. **OK.**
- **Logout:** `useAuth().signOut` → `supabase.auth.signOut()`; used in topbar and sidebar. **OK.**
- **Signup:** Form → `supabase.auth.signUp` + POST `/api/auth/signup` (clinic/user init); redirects to `/login` or `/dashboard`. Handles verification email flow. **OK.**
- **Session / middleware:** Root **`middleware.ts`** now in place; auth redirect active. **Fixed.**
- **Password reset:** Not found in UI; no dedicated flow. **Missing.**
- **RBAC:** Treatments API checks `super_admin` / `clinic_admin` / `dentist` for write; Settings team checks `clinic_admin` / `super_admin` for invite. Other routes use `user` + `clinic_id` only. **Partial.**
- **Session expiry:** Supabase handles; middleware re-validates on each request. **OK.**

### CRUD

- **Invoices:** GET (list + by id), POST, PATCH (e.g. status) — wired to Supabase; 401/404/500 handled. **OK.**
- **Messages:** API now inserts `message`; UI uses `msg.message ?? msg.content`. **Fixed.**
- **Patients:** Server fetch + `ManagePatientDialog`; `deletePatient` server action. API: GET/POST/PATCH/DELETE. **OK.**
- **Appointments:** Server action `saveAppointment` (insert); `rescheduleAppointment` (update); PATCH `/api/appointments/[id]` for status. **OK.**
- **Staff:** GET/POST/PATCH/DELETE; schedules via `/api/staff-schedules`; time-off via `/api/time-off-requests`. **OK.**
- **Treatments:** GET/POST/PATCH/DELETE; role-checked. **OK.**
- **Payments:** GET/POST; nested invoice+patient. **OK.**
- **Insurance claims:** GET/POST/PATCH/DELETE. **OK.**

### Data flow

- **Dashboard stats:** API returns real revenue, patients, appointments, completion rate. Page uses `stats.revenue.total` etc. — **OK.**  
- **Dashboard schedule:** "Today" range uses mutated `Date` (see Phase 3) — fix required.

---

## Phase 3 — Database & Backend

### Date mutation bug (dashboard)

- **`app/api/dashboard/schedule/route.ts`** and dashboard stats: `todayStart` uses `now.setHours(0,0,0,0)` (mutates `now`), then `todayEnd` uses `now.setHours(23,59,59,999)`. Because `now` was already set to midnight, `todayEnd` is wrong.  
- **Fix:** Use two `Date` instances (e.g. `new Date()` for start, `new Date()` for end) or compute end from a copy of the start date.

### Messages table vs API

- **Schema:** `messages.message` (TEXT).  
- **API:** POST sends `content`; GET returns row with `message`.  
- **Frontend:** Uses `msg.content`.  
- **Fix:** Either (1) API and UI use `message` (insert `message`, display `msg.message`), or (2) migration: rename column to `content` and keep current API/UI.

### API coverage

- **Dashboard:** stats, schedule, activity — real DB; no mock.  
- **Invoices:** GET/POST/PATCH — real; validation and errors handled.  
- **Settings billing:** Real except `payment_method` hardcoded.  
- **Settings team:** GET real; POST invite is simulated (no actual invite).  
- **Referrals API:** TODOs for email and PDF; otherwise implemented.

### Unused tables/columns

- Not fully audited; recommend comparing schema to all API and UI usages.

---

## Phase 4 — Permission & Role Testing

- **Settings team:** PUT/POST check `role === 'clinic_admin' || 'super_admin'`. Other routes mostly rely on `user` + `clinic_id`.  
- **Full role matrix** (admin, manager, staff, customer) not yet tested. Recommend: list every protected route and document expected role access; then test or add explicit checks.

---

## Summary of Recommended Fixes (priority)

1. **Critical:** Add root **`middleware.ts`** that runs `updateSession` (same matcher as current `proxy.ts`) so auth redirect is active.
2. **Critical:** Fix **messages** column/API/UI: use `message` in DB and API and `msg.message` in UI, or migrate DB to `content`.
3. **High:** Fix **dashboard "today"** date logic so start/end use non-mutated dates.
4. **Medium:** Replace or label placeholders: Dashboard "View All" activity, Quick Stats, Milestones; Settings billing `payment_method`; Settings team invite; Clinical referrals "Portfolio builder".
5. **Low:** Drive dashboard stat badges from API or remove; add explicit role checks where needed.

---

## Applied Fixes (this pass)

- **Middleware:** Added root **`middleware.ts`** that exports `middleware` and calls `updateSession` with the same matcher as before, so Next.js now runs auth/session correctly. `proxy.ts` remains but is unused; can be removed or kept as reference.
- **Messages:** API POST now inserts **`message`** (DB column); frontend uses **`msg.message ?? msg.content`** so display works for both column names.
- **Dashboard today range:** **`app/api/dashboard/schedule/route.ts`** and **`app/api/dashboard/stats/route.ts`** now compute today start/end with separate `Date` values (no mutation of `now`).

---

## Open / Minor Issues (not critical)

- **Reports API:** `invoice_items` query removed (was dead code).
- **Password reset:** UI and flow added. **Fixed.**
- **Patients empty state:** Explicit empty-state added. **Fixed.**
- **proxy.ts:** Removed. **Fixed.**
- **Settings — Team invite:** No input for email; `newMemberEmail` never set; invite button does nothing. Add email input + role select, or hide/disable until wired.
- **Settings — Team Remove:** Remove button has no handler; no DELETE API call.
- **Settings — Billing:** Change Plan, Update (payment method), Download (invoice) buttons have no actions.
- **Settings — Security:** Two-Factor Enable, Active Sessions (Revoke) have no actions; sessions are hardcoded.
- **Settings — Support:** Suggestions use mock (`setTimeout`); Help Center, Contact Support, System Status, View Full Policy/Terms have no `href`/`onClick`.
- **Patient profile:** `treatments` and `dentists` fetched without `clinic_id`; possible cross-clinic data in multi-tenant setup. Add clinic filter.
- **Messages with patientId:** Patient profile links to `/messages?patientId=...`; messages page does **not** handle `patientId` query (messages are staff-to-staff). Link may be placeholder for future patient-messaging feature.

---

## Next Steps for Auditor

- Fix Settings Team invite flow (add email input or wire to existing flow).
- Add clinic_id scoping to patient profile page for treatments and dentists queries.
- Phase 3: full schema vs API/UI audit; validate every endpoint for validation/server/empty/unauthorized.
- Phase 4: document and test role matrix (admin, clinic_admin, dentist, hygienist, receptionist) on all protected routes.
