# Dental Practice Management SaaS

A modern, white-label dental practice management system built with Next.js 15, Supabase, and Stripe.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (RBAC)
- **Payments:** Stripe

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Copy `.env.example` to `.env.local` and fill in your keys.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Features Implemented
- **Dashboard:** Revenue metrics, activity feed, and KPIs.
- **Calendar:** Interactive weekly view with drag-and-drop support.
- **Patients:** Searchable patient list and profiles.
- **Authentication:** Login UI ready for Supabase integration.
- **UI System:** 2026-standard Teal/Slate theme with dark mode support.

## Project Structure
- `app/(dashboard)`: Authenticated routes
- `app/(auth)`: Public authentication routes
- `components/dashboard-layout`: Sidebar and Topbar
- `lib/supabase.ts`: Database client
- `types/`: Type definitions

## Next Steps
- Connect Supabase backend
- Implement real Drag-and-Drop logic
- Connect Stripe Webhooks
