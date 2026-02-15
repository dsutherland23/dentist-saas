# Demo Data Seed

Load demo **patients**, **staff**, **appointments**, and **clinical referrals** into your clinic.

## When to run

- **After** you have signed up and completed onboarding (so you have one clinic and one user).
- Run once per clinic; safe to re-run (skips existing demo patients/staff by email).

## What gets added

| Data | Count | Notes |
|------|--------|--------|
| **Demo staff** | 3 | Jane Wright (dentist), Marcus Chen (hygienist), Sofia Brown (receptionist). Display-only (no login unless you create auth users). |
| **Demo patients** | 8 | Adrian Pecco, Sarah Johnson, Michael Williams, Emily Davis, David Thompson, Olivia Martinez, James Wilson, Emma Anderson. |
| **Appointments** | 5 | Mix for today/tomorrow: completed, confirmed, scheduled, unconfirmed, pending. |
| **Specialists** | 4 | Approved specialists (Orthodontics, Endodontics, Oral Surgery, Periodontics). |
| **Referrals** | 4 | One referral per specialist, from your clinic. |

## How to run

### Option 1: Supabase SQL Editor (recommended)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Paste the contents of `scripts/seed-demo-data.sql`.
4. Click **Run**.

You should see: `Demo data seeded: patients, staff, appointments, specialists, and referrals.`

### Option 2: psql

```bash
psql "YOUR_SUPABASE_DATABASE_URL" -f scripts/seed-demo-data.sql
```

Use the connection string from Supabase: Project Settings → Database → Connection string (URI).

## No clinic yet?

If you see *"No clinic found"*, sign up in the app and complete onboarding so a clinic and user exist, then run the seed again.
