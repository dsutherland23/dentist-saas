# Notifications – Structure & Design

## Current state

- **UI**: Bell icon in the topbar opens a dropdown (**NotificationCenter**). Each item shows title, message, type icon (info/success/warning/error), relative time, and optional link. Click marks as read and navigates to link. Polling every 30s.
- **API**: `GET /api/notifications` returns rows from `notifications` filtered by **clinic_id** only. So every user in the clinic sees the same list. `PATCH` marks one notification as read (no check that it belongs to the current user).
- **Data**: Seed script inserts by `clinic_id` (no `user_id`). The table is referenced in code but not created in migrations; it may exist from a one-off setup.

To support “who did what for whom” (e.g. “Your time off was approved”), notifications must be **per recipient**, not per clinic.

---

## 1. Data model

### Table: `notifications`

| Column        | Type      | Purpose |
|---------------|-----------|--------|
| `id`          | uuid      | PK |
| `clinic_id`   | uuid      | Tenant scope, indexing |
| **`user_id`** | uuid      | **Recipient** (who sees this) – FK to `users(id)` |
| `type`        | text      | Semantic type for styling and routing (see list below) |
| `title`       | text      | Short headline in the dropdown |
| `message`     | text      | Body (1–2 lines in UI) |
| `link`        | text      | Optional path to open on click (e.g. `/team-planner`, `/clinical-referrals`) |
| `is_read`     | boolean   | Default false |
| `actor_id`    | uuid (nullable) | User who triggered the action (e.g. admin who approved) – optional, for “John approved…” |
| `entity_type` | text (nullable) | e.g. `time_off_request`, `referral`, `appointment` – for future grouping/deep links |
| `entity_id`   | uuid (nullable) | ID of that entity |
| `created_at`  | timestamptz | For ordering and “X minutes ago” |

- **Index**: `(user_id, created_at DESC)` so “my notifications” is fast.
- **RLS**: Users can only `SELECT`/`UPDATE` rows where `user_id = auth.uid()` (or via service role when creating).

Important: **All notifications are addressed to one user** (`user_id`). Clinic-wide “broadcasts” can be implemented by inserting one row per recipient when needed.

---

## 2. Notification types (what you get, from who, where it shows)

Types are used for:
- **Icon and color** in the dropdown (success = green check, warning = amber, etc.).
- **Optional** grouping or filtering on a future “All notifications” page.

### 2.1 Team planner / time off

| Type (value)        | Triggered by              | Recipient(s)        | Example title / message | Link |
|---------------------|---------------------------|---------------------|--------------------------|------|
| `time_off_requested` | Employee submits request  | Clinic admins       | “Time off requested” / “Jane Doe requested 3–5 Mar” | `/team-planner` |
| `time_off_approved`  | Admin approves            | That employee       | “Time off approved” / “Your request for 3–5 Mar was approved” | `/team-planner` |
| `time_off_rejected`   | Admin rejects             | That employee       | “Time off not approved” / “Your request for 3–5 Mar was declined” | `/team-planner` |
| `time_off_granted`    | Admin grants (no request) | That employee       | “Time off granted” / “You were granted time off 3–5 Mar” | `/team-planner` |

**From who**: The **actor** is the admin (or system). Shown in dropdown as the notification title/message; optional “By Dr. Smith” later via `actor_id`.

### 2.2 Clinical referrals

| Type (value)      | Triggered by           | Recipient(s)     | Example | Link |
|-------------------|------------------------|------------------|--------|------|
| `referral_received` | Referral created       | Specialist (if in-app user) or clinic | “New referral” / “Patient X referred to you for Root canal” | `/clinical-referrals` or referral detail |
| `referral_status_updated` | Status changed (e.g. accepted) | Referring user / clinic | “Referral update” / “Referral for Patient X was accepted” | `/clinical-referrals` |
| `referral_intake_submitted` | Patient submitted intake | Referring clinic / assigned staff | “Intake received” / “Intake form submitted for Patient X” | `/clinical-referrals` |

**From who**: “System” or the user who performed the action (referring dentist, specialist, or admin).

### 2.3 Appointments / calendar

| Type (value)           | Triggered by        | Recipient(s) | Example | Link |
|------------------------|---------------------|--------------|--------|------|
| `appointment_assigned`  | New appointment with dentist | That dentist | “New appointment” / “Sarah Johnson – Cleaning, tomorrow 10:00” | `/calendar` |
| `appointment_cancelled` | Appointment cancelled | Dentist (and optionally receptionist) | “Appointment cancelled” / “Sarah Johnson – Cleaning was cancelled” | `/calendar` |
| `appointment_rescheduled` | Time/date changed  | Dentist (and optionally patient contact) | “Appointment rescheduled” / “Sarah Johnson – new time 2:00 PM” | `/calendar` |

**From who**: Usually “system” or the staff member who created/cancelled/rescheduled.

### 2.4 Staff / invites

| Type (value)   | Triggered by     | Recipient(s) | Example | Link |
|----------------|------------------|--------------|--------|------|
| `staff_invited` | Admin sends invite | Invitee (when they have an account) | “You’re invited” / “You were invited to join [Clinic Name]” | `/settings` or invite accept flow |
| `staff_joined`   | User accepts invite | Admins who manage staff | “New team member” / “Jane Doe joined as Hygienist” | `/staff` |

**From who**: Admin (invite) or the new user (joined).

### 2.5 Invoices (optional)

| Type (value)    | Triggered by      | Recipient(s) | Example | Link |
|----------------|-------------------|--------------|--------|------|
| `invoice_paid`  | Invoice marked paid | Accountant / admin | “Payment received” / “INV-2024-001 paid ($450)” | `/invoices` |
| `invoice_overdue` | Due date passed  | Accountant / admin | “Overdue invoice” / “INV-2024-012 is 3 days overdue” | `/invoices` |

**From who**: System (scheduled job or on status change).

### 2.6 Messages (if used)

| Type (value) | Triggered by | Recipient(s) | Example | Link |
|--------------|--------------|--------------|--------|------|
| `new_message` | Someone sends message | `receiver_id` | “New message” / “Dr. Smith: Can you cover tomorrow?” | `/messages` |

**From who**: Sender (`actor_id`).

---

## 3. How it shows in the “notification section”

- **Where**: Same as now – **topbar bell** → **dropdown** (NotificationCenter).
  - Optional later: “View all” → dedicated **/notifications** page (list + mark all read, filter by type).
- **What’s shown per item**:
  - Icon by `type` (success / warning / error / info or custom per type).
  - **Title** (bold if unread).
  - **Message** (1–2 lines).
  - Relative time (“5 min ago”).
  - Unread indicator (e.g. dot or background).
- **Interaction**:
  - Click → mark as read (PATCH) + navigate to `link` if present.
  - Optional: “Mark all as read” in dropdown footer.
- **Order**: Newest first (`created_at DESC`), limit 20 in dropdown; pagination on full page if added.
- **Badge**: Bell shows a count of **unread** notifications for the current user.

So: **same place (bell + dropdown), same look; content is per-user and driven by the types above.**

---

## 4. Implementation summary

1. **Schema**
   - Add `notifications` table with `user_id` (recipient), plus `actor_id`, `entity_type`, `entity_id` for traceability and future features.
   - Add migration and RLS: user can only read/update their own rows.

2. **API**
   - **GET** `/api/notifications`: Filter by **current user’s id** (and optionally `clinic_id` for safety). Order by `created_at DESC`, limit 20.
   - **PATCH**: Only allow updating `is_read` for notifications where `user_id = current user`.

3. **Creating notifications**
   - Whenever an action happens (time-off approved, referral created, etc.), insert one or more rows into `notifications` with the right `user_id`, `type`, `title`, `message`, `link`, and optional `actor_id` / `entity_*`.
   - Prefer a small helper or API (e.g. `createNotification({ userId, clinicId, type, title, message, link, actorId?, entityType?, entityId? })`) used from the relevant API routes or server actions.

4. **UI**
   - NotificationCenter already shows title, message, type, time, link. Ensure it only receives the current user’s notifications (API change above). Optionally add type-specific icons for `time_off_*`, `referral_*`, etc., and a “Mark all as read” action.

5. **Optional**
   - “View all activity” → `/notifications` page.
   - User preferences (e.g. in `user_preferences`) to turn off certain in-app notification types (email/SMS already exist).

This structure keeps notifications **per user**, **from a clear actor/system**, and **visible in the existing notification section** (bell + dropdown), with a single place to add new types and links as you add features.
