# Visit Flow – How It Works

## Overview

The **Visit Flow** adds a structured in-clinic journey (Arrived → Checked In → … → Completed) on top of appointments. The calendar can show either:

1. **Legacy flow** – Check in / Start treatment / Complete (PATCH appointment status).
2. **Visit flow** – “Mark arrived” then a **Visit Progress Panel** with step-by-step transitions (POST /api/visits/transition).

- If an appointment **has no visit**, the calendar shows **“Mark arrived”** and the **legacy buttons** (Check in, Start treatment, Complete). You can use either “Mark arrived” to start the visit flow or “Check in” for the old flow.
- If an appointment **has a visit**, the calendar shows the **Visit Progress Panel** only (no legacy buttons). You advance with “Complete” on each step; role and requirements are enforced by the backend.

## Flow

1. **Open an appointment** (desktop popover or mobile sheet)  
   → Calendar fetches GET `/api/visits?appointmentId=...`  
   → If the **visits** table is missing or the request fails, the API returns `{ visit: null }` so the calendar still works and shows legacy actions.

2. **No visit**  
   → “Mark arrived” + legacy Check in / Start treatment / Complete.  
   → “Mark arrived” → POST `/api/visits/transition` with `nextState: "ARRIVED"` creates a visit; then the panel appears.

3. **Visit exists**  
   → Visit Progress Panel with steps (Arrived, Checked In, Medical Reviewed, …).  
   → “Complete” on the current step → POST `/api/visits/transition` with `nextState` and optional `flags`.  
   → Backend checks: allowed transition, your role, and required flags. On COMPLETED/CANCELLED it updates `appointments.status` so the rest of the app stays in sync.

## If the calendar “stops working”

- **Visits table not created**  
  Run the migration: `supabase/migrations/20260225000001_visits.sql`.  
  Until then, GET /api/visits returns `{ visit: null }` (no 500), so the calendar still loads and you can use the **legacy Check in / Start treatment / Complete** buttons.

- **Wrong data in the panel**  
  If you open another appointment before the first visit fetch finishes, the panel is updated only for the appointment that is currently open (race condition is handled).

- **“Mark arrived” or “Complete” returns an error**  
  The visit flow needs the **visits** table. Run the migration above. After that, if you still get errors, check the browser network tab and server logs for the real message.

## Summary

| Scenario              | What you see in the calendar                          |
|-----------------------|--------------------------------------------------------|
| No visit, API ok      | “Mark arrived” + legacy Check in / Start treatment / Complete |
| No visit, API fails   | Same (we treat as “no visit”)                         |
| Visit exists          | Visit Progress Panel only                              |

The calendar is built so that **even without the visits table**, the legacy flow (Check in, Start treatment, Complete) still works.
