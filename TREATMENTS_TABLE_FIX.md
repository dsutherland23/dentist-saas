# ⚠️ IMPORTANT: Treatments Table Missing

## The Problem
The "error saving New treatment" issue was caused by a missing `treatments` table in your database.

## The Fix
I've added the `treatments` table to the full database setup SQL.

## What You Need To Do

### Option 1: Re-run the Full Migration (Recommended)
If you haven't run ANY migrations yet:

1. Visit: `http://localhost:3000/migrate`
2. Click "Copy Full Setup SQL"
3. Open Supabase SQL Editor
4. Paste and Run
5. Done!

### Option 2: Add Just the Treatments Table
If you already ran the migration and just need to add treatments:

1. Open Supabase SQL Editor
2. Copy and paste this SQL:

```sql
-- Add treatments table
CREATE TABLE IF NOT EXISTS treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    duration_minutes INTEGER DEFAULT 30,
    price NUMERIC(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_treatments_clinic ON treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatments_active ON treatments(is_active);

-- Enable RLS
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
DROP POLICY IF EXISTS "Clinic staff can view treatments" ON treatments;
CREATE POLICY "Clinic staff can view treatments" ON treatments FOR SELECT
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Clinic staff can manage treatments" ON treatments;
CREATE POLICY "Clinic staff can manage treatments" ON treatments FOR ALL
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
CREATE TRIGGER update_treatments_updated_at 
    BEFORE UPDATE ON treatments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

3. Click Run
4. Done!

## Test It
1. Go to: `http://localhost:3000/treatments`
2. Click "New Treatment"
3. Fill in the form
4. Click "Save Treatment"
5. Should work now! ✅

## What the Treatments Table Does
Stores your clinic's service catalog:
- Treatment/procedure names (e.g., "Tooth Extraction", "Cleaning")
- Categories (General, Cosmetic, Surgery, etc.)
- Duration in minutes
- Pricing
- Active/inactive status

This is used throughout the app for:
- Creating appointments
- Generating invoices
- Tracking services offered
