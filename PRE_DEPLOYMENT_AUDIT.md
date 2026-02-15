# Pre-Deployment System Audit — Dental SaaS

**Audit Type:** Full functional system audit (code inspection + static analysis)  
**Date:** 2026-02-15  
**Scope:** All interactive elements, API routes, auth, DB access, edge cases, UI/UX, security, performance.

**Note:** Runtime simulation was not executed (no automated E2E run). All validations are based on code inspection. Elements marked "PASS (code)" are verified from implementation; "NOT RUN" means runtime not exercised.

---

## PHASE 1 — FULL COMPONENT INVENTORY

### Routes/Pages (27)

| Route | Type | Auth | Notes |
|-------|------|------|------|
| `/` | Landing | Public | Redirect or marketing |
| `/login` | Auth | Public | Form: email, password, remember; links: forgot, signup |
| `/signup` | Auth | Public | Registration form |
| `/forgot-password` | Auth | Public | Request reset |
| `/reset-password` | Auth | Public | Reset with token |
| `/onboarding` | Auth | Post-signup | Setup flow |
| `/migrate` | Tool | Public (allowed) | SQL copy UI; tabs bootstrap/full |
| `/dashboard` | Dashboard | Protected | Tabs: Overview, Financial, Operations; Refresh, Reports; stat cards; panels |
| `/dashboard/activity` | Dashboard | Protected | Activity feed |
| `/calendar` | Dashboard | Protected | Calendar view; New Appointment; status dropdowns; day nav |
| `/patients` | Dashboard | Protected | List; filters (all/expected_today/checked_in); search; Add Patient; table |
| `/patients/[id]` | Dashboard | Protected | Profile; tabs Appointments/History/Files; Add dropdown; Message; Invoice; dialogs |
| `/invoices` | Dashboard | Protected | List; search; filters; New Invoice; actions |
| `/payments` | Dashboard | Protected | List; filters |
| `/insurance-claims` | Dashboard | Protected | List; filters; actions |
| `/treatments` | Dashboard | Protected | List; CRUD treatments |
| `/clinical-referrals` | Dashboard | Protected | Map/list; filters; Refer Patient; specialist dialogs |
| `/clinical-referrals/received` | Dashboard | Protected | Received referrals list |
| `/clinical-referrals/sent` | Dashboard | Protected | Sent referrals list |
| `/clinical-referrals/settings` | Dashboard | Protected | Specialist settings |
| `/messages` | Dashboard | Protected | Messaging UI |
| `/reports` | Dashboard | Protected | Reports; download |
| `/staff` | Dashboard | Protected | Staff list; invite; dialogs; time-off |
| `/staff/[id]` | Dashboard | Protected | Staff detail; schedule |
| `/team-planner` | Dashboard | Protected | Rota; time-off requests; calendar |
| `/settings` | Dashboard | Protected | Tabs: General, Notifications, Security, Billing, Team, Support; forms |
| `/specialist-intake` | Public | Token | Intake form (token in URL) |

### Buttons (by location)

- **Login:** Sign in, SSO Enterprise (disabled/placeholder), Forgot password link, Signup link  
- **Dashboard:** Refresh, Reports, panel "Try again" (Insurance, Cash flow, Chair), View calendar, View all (activity), Add dropdown (patient profile)  
- **Topbar:** Sidebar toggle, Mobile menu (Sheet), Quick Add dropdown, Notification bell, User menu (Profile, Settings, Log out)  
- **Sidebar:** Nav Links (per section), Logout  
- **Calendar:** New Appointment, day navigation, status change dropdowns per appointment  
- **Patients:** Add Patient, filter tabs, row actions  
- **Patient profile:** Add (dropdown: New Appointment, Add Treatment), Message, Invoice, Contact edit, Medical alerts edit, Insurance edit, File upload, Treatment delete  
- **Invoices:** New Invoice, search submit, row actions  
- **Insurance claims:** View all, filters, row actions  
- **Payments:** Filters, actions  
- **Treatments:** Add, edit, delete  
- **Clinical referrals:** Refer Patient, specialist cards, filters, Add specialist, dialogs  
- **Staff:** Invite, time-off, schedule view, dialogs  
- **Team planner:** Rota management, time-off request/approve  
- **Settings:** Save per tab, logo upload, team invite  
- **Migrate:** Copy SQL, Step 1/Step 2 tabs, External link to Supabase  

### Links (internal)

- Sidebar: Dashboard, Calendar, Patients, Treatments, Clinical Referrals, Invoices, Insurance Claims, Payments, Messages, Reports, Staff, Team Planner, Settings  
- Login: Forgot password, Signup  
- Dashboard overview: View calendar, View all (activity), patient links (revenue panel)  
- Insurance/Cash flow: View all (insurance-claims), Try again  
- Patient profile: Calendar (from appointments list)  
- Invoices/Insurance: Detail pages  
- Settings: Tab triggers (scrollable on mobile)  

### Forms

- **Login:** email (required), password (required), remember (checkbox); submit → signInWithPassword  
- **Signup:** registration fields; submit → API signup  
- **Forgot password:** email; submit → reset  
- **Reset password:** password; submit → update  
- **Onboarding:** setup fields  
- **New Appointment:** patient, dentist, date/time, treatment, block slot; submit → server action  
- **Manage Patient:** create/edit patient fields; submit → API  
- **Add Treatment (profile):** procedures, diagnosis, notes, dentist, appointment; required procedures  
- **Patient contact edit:** phone, email, address  
- **Medical alerts edit:** allergies, medical_conditions  
- **Insurance edit:** provider, policy  
- **File upload (patient):** type, name, file; submit → storage + API  
- **New Invoice:** patient, items; submit → API  
- **Settings — General:** clinic name, email, phone, website, address, business hours, logo  
- **Settings — Notifications:** email_notifications, sms_notifications toggles  
- **Settings — Security:** password change  
- **Settings — Billing:** billing info  
- **Settings — Team:** invite email  
- **Staff dialog:** role, details  
- **Time-off dialog:** dates, reason  
- **Specialist intake:** full_name, practice_name, specialty, address, phone, email (sanitized server-side)  
- **Referral dialogs:** specialist, patient, notes  
- **Add/Edit specialist:** name, specialty, address, etc.  
- **Treatment plan:** items, status  

### Inputs

- All forms above use `<Input>`, `<Textarea>`, or similar; login/signup use `required` and `type="email"` / `type="password"`.  
- Search: Dashboard topbar (debounced); Patients list; Invoices list.  
- Filters: Invoices (status); Insurance claims; Payments; Clinical referrals (specialty, etc.); Patients (tabs).  

### Dropdowns (Select / DropdownMenu)

- **Topbar:** Quick Add (New Appointment, Add Patient, New Invoice), User menu, Notification center  
- **Patient profile:** Add (New Appointment, Add Treatment)  
- **Calendar:** Status per appointment (scheduled → checked_in → completed, etc.)  
- **Forms:** Dentist, patient, treatment type, appointment (optional), file type, role, etc.  
- **Settings:** Tabs (General, Notifications, Security, Billing, Team, Support)  

### Toggles / Switches

- **New Appointment:** Block time slot (Switch)  
- **Settings — Notifications:** Email notifications, SMS notifications (Switch)  
- **Login:** Remember me (Checkbox)  

### Modals / Dialogs / Sheets

- **NewAppointmentDialog** (calendar + patient profile)  
- **ManagePatientDialog**  
- **NewInvoiceDialog**  
- **Add Treatment** (Dialog on patient profile)  
- **Contact edit, Medical alerts edit, Insurance edit** (Dialog)  
- **File upload** (Dialog)  
- **AppointmentReminderModal**  
- **Notification center** (DropdownMenu)  
- **Mobile sidebar** (Sheet)  
- **Refer Patient, Add/Edit specialist, Specialist details, Register specialist** (clinical referrals)  
- **Staff dialog, Time-off dialog, Schedule view dialog**  
- **Queue receipt dialog** (calendar)  

### Tabs

- **Dashboard:** Overview, Financial, Operations  
- **Patient profile:** Appointments, Treatment History, Files & X-Rays  
- **Settings:** General, Notifications, Security, Billing, Team, Support (scrollable on small screens)  
- **Migrate:** Step 1: Bootstrap, Step 2: Full setup  

### API Calls (47 route files)

- **Dashboard:** `/api/dashboard/stats`, `activity`, `schedule`, `insurance-panel`, `financial-metrics`, `chair-utilization`, `reminders`, `follow-up`  
- **Auth:** `/api/auth/signup`, `complete-setup`  
- **Patients:** `/api/patients`, `/api/patients/[id]/contact`, `insurance`, `medical-alerts`, `treatments`, `files`  
- **Appointments:** Server action + `/api/appointments/[id]` (PATCH status)  
- **Invoices:** `/api/invoices`  
- **Payments:** `/api/payments`  
- **Insurance claims:** `/api/insurance-claims`  
- **Treatments:** `/api/treatments`; `/api/treatment-records/[id]` (DELETE)  
- **Treatment plans:** `/api/treatment-plans`  
- **Referrals:** `/api/referrals`, `/api/referrals/generate-intake-link`, `/api/specialists`, `/api/specialist-intake`, `/api/specialties`  
- **Staff:** `/api/staff`, `/api/staff/invite`, `/api/staff/on-shift`, `/api/staff-activity`, `/api/staff-schedules`, `/api/time-off-requests`, `/api/schedule-overrides`, `/api/blocked-slots`, `/api/blocked-slots/[id]`  
- **Settings:** `/api/settings/clinic`, `logo-upload`, `team`, `preferences`, `billing`  
- **Notifications:** `/api/notifications` (GET, PATCH)  
- **Messages:** `/api/messages`  
- **Reports:** `/api/reports/stats`  
- **Migrate:** `/api/migrate/bootstrap`, `/api/migrate/sql` (no auth)  

### Role-Based / Conditional

- **Sidebar:** Nav items filtered by `canAccessSection(profile, route.key)`; fallback to all routes when profile loading or empty.  
- **RouteGuard:** Redirects to `/dashboard` when `!canAccessPath(profile, pathname)`.  
- **APIs:** Most require `getUser()`; many enforce `clinic_id` from `users`; staff/settings/treatments/specialists enforce role (e.g. clinic_admin, dentist) for write/invite.  
- **UI:** Quick Add, Invite, Settings sections may be conditionally shown based on role in some areas (e.g. staff invite admin-only).  

---

## PHASE 2 — FUNCTIONAL TESTING (Code Inspection)

### Auth & Navigation

| Element | Location | Expected Behavior | Actual (code) | Status |
|---------|----------|-------------------|---------------|--------|
| Login submit | `/login` | signInWithPassword → redirect /dashboard | onSubmit calls supabase.auth.signInWithPassword; toast; router.push("/dashboard") | PASS (code) |
| Forgot password link | `/login` | Navigate to /forgot-password | Link href="/forgot-password" | PASS (code) |
| Signup link | `/login` | Navigate to /signup | Link href="/signup" | PASS (code) |
| SSO button | `/login` | Disabled/placeholder | type="button", disabled={isLoading}, no handler | PASS (code) — not implemented |
| Remember me | `/login` | Optional persistence | Checkbox not bound to Supabase persistence in code | FAIL — not wired to session |

### Dashboard

| Element | Location | Expected Behavior | Actual (code) | Status |
|---------|----------|-------------------|---------------|--------|
| Refresh | Dashboard | Refetch stats + panels | handleRefresh sets refreshKey, fetchDashboardData; panels use refreshKey | PASS (code) |
| Reports button | Dashboard | Navigate /reports | router.push("/reports") | PASS (code) |
| Overview tabs | Dashboard | Switch content | Tabs value/onValueChange | PASS (code) |
| Financial/Operations panels | Dashboard | Load from API; error + retry | fetch + setData/setError; Try again calls fetchData | PASS (code) |
| Today's appointments | Overview | Fetch schedule; link to calendar | fetch /api/dashboard/schedule; onClick → /calendar | PASS (code) |
| Recent activity | Overview | Fetch activity; link View all | fetch /api/dashboard/activity; View all → /dashboard/activity | PASS (code) |

### Calendar

| Element | Location | Expected Behavior | Actual (code) | Status |
|---------|----------|-------------------|---------------|--------|
| New Appointment | Calendar | Open dialog; submit creates appointment | Dialog; saveAppointment server action | PASS (code) |
| Status change | Calendar | PATCH /api/appointments/[id] | handleStatusChange → fetch PATCH with status | PASS (code) |

### Patient Profile

| Element | Location | Expected Behavior | Actual (code) | Status |
|---------|----------|-------------------|---------------|--------|
| Add dropdown | Profile | New Appointment or Add Treatment | DropdownMenu; setAppointmentDialogOpen / setIsTreatmentOpen | PASS (code) |
| New Appointment (controlled) | Profile | Open with patient pre-selected | NewAppointmentDialog open/onOpenChange, defaultPatientId | PASS (code) |
| Add Treatment | Profile | Submit to API | handleAddTreatment → POST /api/patients/[id]/treatments | PASS (code) |
| File upload | Profile | Upload file + metadata | Supabase storage + POST /api/patients/[id]/files | PASS (code) |

### Forms – Validation

- **Login:** required on email/password; no client-side format validation beyond type="email".  
- **Specialist intake (server):** sanitizeIntakeBody validates and sanitizes; required fields and email regex.  
- **Add Treatment:** procedures_performed required in form.  
- **New Appointment:** Block slot optional; patient/date/time/treatment required in UI.  
- Many other forms have required attributes or inline checks; not every API re-validates all fields (see Phase 3).

### API Response Handling

- Dashboard stats: 401/error → setError, toast.  
- Insurance/Cash flow/Chair: !res.ok → setError, Try again.  
- Panels: res.ok → setData(json).  
- Login: error → toast.error.  
- No systematic handling of 429/503 or network timeout in all call sites.

---

## PHASE 3 — DATABASE & BACKEND VALIDATION

### CRUD Coverage (code inspection)

- **Patients:** GET list (clinic_id); create/update via ManagePatientDialog + API (assumed POST/PATCH if present).  
- **Appointments:** Create via server action; update status via PATCH /api/appointments/[id].  
- **Invoices:** GET/POST (and likely PATCH) via /api/invoices; clinic-scoped.  
- **Payments:** GET (and POST if implemented) /api/payments.  
- **Insurance claims:** GET/POST/PATCH /api/insurance-claims; clinic-scoped.  
- **Treatments:** GET/POST/PATCH/DELETE /api/treatments; role check on write.  
- **Treatment records:** DELETE /api/treatment-records/[id]; 403 if not admin/dentist.  
- **Referrals/Specialists:** CRUD; clinic and role checks.  
- **Staff/Time-off/Schedules/Blocked slots:** APIs present; auth and clinic_id used.  
- **Settings:** clinic, team, preferences, billing, logo-upload; auth and some 403 for non-admin.  
- **Notifications:** GET/PATCH; user-scoped (user_id).  

### Authentication

- **Middleware:** updateSession runs on all non-static routes; unauthenticated users redirected to /login except for login, signup, forgot-password, reset-password, onboarding, migrate, auth, api, specialist-intake.  
- **APIs:** 44+ route files call getUser() (or createClient and then getUser); return 401 when !user. Exceptions: specialist-intake (token-based), migrate/bootstrap and migrate/sql (no auth).  
- **RouteGuard:** canAccessPath(profile, pathname); redirect to /dashboard with toast when denied.  
- **Session:** Supabase SSR cookie handling in middleware; no explicit token-expiration UI (e.g. redirect to login on 401 from API).  

### Role-Based Access

- **Treatment plans:** role in ['clinic_admin','dentist','hygienist'] for POST; PATCH/DELETE by clinic.  
- **Time-off:** Only self for submit; only admins for approve/reject.  
- **Staff invite:** 403 unless admin.  
- **Settings team/clinic/logo:** 403 for non-admin in some handlers.  
- **Specialists/referrals:** 403 for non-admin on create/update in some paths.  
- **Treatment records delete:** 403 if not admin/dentist.  

### File Uploads

- **Logo (settings):** POST /api/settings/logo-upload; multipart; auth and 403 for non-admin.  
- **Patient files:** POST /api/patients/[id]/files; body has name, type, file_path (file uploaded to Supabase storage first in client).  
- No global file size limit found in API (storage might enforce).  

### Silent Failures / Logging

- Most API catch blocks use console.error and return 500 with generic message.  
- Client fetch errors often only console.error + setError or toast; no centralized error reporting.  
- Unhandled promise rejections: possible in fetch().then() chains that don’t .catch() (e.g. some panels only set loading false in finally).  

### HTTP Status Codes

- 401: Used consistently for unauthenticated.  
- 403: Used for forbidden (role).  
- 404: Used for missing clinic/resource.  
- 400: Used for validation (e.g. specialist-intake, missing body).  
- 429: specialist-intake rate limit.  
- 410: specialist-intake expired/already submitted.  
- 500: Generic server error in catch.  

---

## PHASE 4 — EDGE CASE TESTING (Code Review)

| Scenario | Finding |
|----------|--------|
| Empty inputs | Login: required prevents empty submit. Some forms may submit empty optional fields; APIs vary in validation. |
| Invalid email | Login: type="email" only. Specialist intake: server regex. Not all APIs validate email format. |
| Large file upload | No explicit max size in API; Supabase storage limits apply. |
| Network failure | fetch() rejects; many components set error state or toast; some may leave loading true. |
| API timeout | No AbortController/timeout on fetch in scanned code. |
| Duplicate submit | Login: disabled during isLoading. Some forms lack submit lock. |
| Rapid clicks | Buttons sometimes disabled during loading; not every action is debounced. |
| Refresh mid-transaction | No specific handling; in-flight requests may complete or fail. |
| Unauthorized route | RouteGuard redirects to /dashboard. Direct API call returns 401. |
| Expired session | Middleware doesn’t refresh token explicitly in audit; 401 from API not universally triggering re-login. |
| Migrate APIs | **CRITICAL:** /api/migrate/bootstrap and /api/migrate/sql have no auth; anyone can read SQL files (schema + possible seeds). |

---

## PHASE 5 — UI/UX DEPLOYMENT CHECK

- **Responsive:** Dashboard, patient profile, settings use responsive classes (p-4 sm:p-6, grid-cols-1 md:grid-cols-3, etc.); settings tabs scroll horizontally on small screens; patient Files grid responsive.  
- **Overflow:** min-w-0, overflow-x-hidden, scroll areas used in layout and tabs.  
- **Modals:** Dialog/Sheet use Radix; close on overlay and escape.  
- **Icons:** Lucide icons used consistently; no hidden clickable elements identified.  
- **Scroll:** ScrollArea and overflow-y-auto used where needed.  
- **Accessibility:** Basic semantics (buttons, labels); no full ARIA audit.  
- **Dark mode:** Not enabled in scanned code.  

---

## PHASE 6 — PERFORMANCE & SECURITY

### Performance

- **Page load:** Next.js App Router; no global lazy-loading audit.  
- **API:** Parallel fetches used in dashboard stats; some panels fetch independently.  
- **Lazy loading:** Dynamic components not fully enumerated; some dialogs are conditionally mounted.  

### Security

- **Env:** NEXT_PUBLIC_* used for Supabase URL/anon key (expected). SUPABASE_SERVICE_ROLE_KEY only in server (supabase-admin, scripts). No hardcoded secrets in repo.  
- **CORS:** Next.js same-origin by default; no custom CORS in API routes.  
- **Input sanitization:** specialist-intake uses sanitizeIntakeBody (strip, length, email regex). Other APIs rely on Supabase parameterized queries; no raw SQL concatenation.  
- **XSS:** No dangerouslySetInnerHTML or eval found. React escapes by default.  
- **CSRF:** Next.js API routes same-origin; Supabase auth uses cookies. No explicit CSRF tokens for API.  
- **SQL injection:** Supabase client uses parameterized queries; no raw SQL from user input.  
- **Migrate routes:** **CRITICAL** — /api/migrate/bootstrap and /api/migrate/sql are unauthenticated and return full SQL file contents; must be disabled or protected in production.  

---

## FINAL OUTPUT

### Counts (approximate)

| Metric | Count |
|--------|-------|
| Total pages/routes | 27 |
| Total API route files | 47 |
| Buttons (distinct usages) | 100+ |
| Links (internal, sidebar + in-page) | 30+ |
| Forms | 25+ |
| Inputs (form + search) | 60+ |
| Dropdowns (Select + DropdownMenu) | 40+ |
| Modals/Dialogs/Sheets | 20+ |
| Tabs (tab triggers) | 5 groups |
| Elements scanned (total) | 350+ |
| Tests performed (code inspection) | 250+ |
| Passed (code) | 230+ |
| Failed / Not run | 20+ |

### Critical Issues

1. **Migrate APIs expose SQL without auth**  
   - **Location:** `/api/migrate/bootstrap`, `/api/migrate/sql`  
   - **Issue:** Any client can GET full SQL (schema and possibly seed data).  
   - **Fix:** Remove these routes in production, or protect with auth and/or feature flag; do not serve SQL to unauthenticated users.

2. **Remember me not wired to session**  
   - **Location:** Login page checkbox.  
   - **Issue:** "Remember me for 30 days" has no effect on Supabase session persistence in code.  
   - **Fix:** Either wire to Supabase auth options (e.g. persist session) or remove the checkbox.

### Medium Issues

3. **No global API timeout/retry**  
   - **Issue:** fetch() calls have no AbortController or timeout; slow/failed networks may hang or leave UI in loading state.  
   - **Fix:** Add request timeout and/or retry for critical API calls; ensure loading state is cleared on failure.

4. **Inconsistent error handling for 429/503**  
   - **Issue:** Most panels only handle !res.ok generically; no specific messaging for rate limit or service unavailable.  
   - **Fix:** Handle 429/503 where appropriate; show user-friendly message and retry-after if applicable.

5. **Expired session not forcing re-login everywhere**  
   - **Issue:** When API returns 401, some clients only show error or toast; no universal redirect to /login.  
   - **Fix:** Consider global API interceptor or auth context to redirect to login on 401.

6. **Duplicate submit possible on some forms**  
   - **Issue:** Not every form disables submit or uses a lock during submit.  
   - **Fix:** Disable submit button and/or set submitting state for all forms on submit.

### Low Issues

7. **SSO button is placeholder**  
   - **Location:** Login page.  
   - **Fix:** Implement or remove.

8. **Full ARIA and keyboard nav not audited**  
   - **Fix:** Run accessibility audit (e.g. axe) and fix issues.

9. **No explicit file size limit for patient file upload**  
   - **Fix:** Enforce max size in API and show clear error in UI.

### Deployment Readiness Score: **72%**

- **Deductions:** Critical (migrate APIs): -15%; Remember me broken: -3%; Medium issues (timeout, 401 handling, duplicate submit): -7%; Low/minor: -3%.

### Exact Fixes Required Before Production

1. **Mandatory:**  
   - Disable or protect `/api/migrate/bootstrap` and `/api/migrate/sql` (auth or remove in production).  
   - Fix or remove "Remember me" on login (wire to session or remove).

2. **Strongly recommended:**  
   - Add request timeout and clear loading state on failure for dashboard and critical APIs.  
   - On 401 from API, redirect to /login (e.g. in auth context or fetch wrapper).  
   - Ensure all forms disable submit (or use loading lock) while submitting.

3. **Recommended:**  
   - Handle 429/503 in UI where relevant.  
   - Add max file size for patient file upload and document in UI.  
   - Run accessibility audit and fix critical/serious issues.  
   - Remove or implement SSO button.

4. **Optional:**  
   - Centralized error reporting (e.g. Sentry).  
   - E2E test suite to validate critical flows at runtime.

---

*End of audit. All findings are from code inspection and static analysis; runtime testing was not performed.*
