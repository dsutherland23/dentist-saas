-- Migration: Restrict plan status to 5 acceptance states + add item-level acceptance_status
-- Date: 2026-02-20

-- 1. Migrate existing plan statuses before constraint change
UPDATE treatment_plans SET status = 'accepted' WHERE status IN ('in_progress', 'completed');
UPDATE treatment_plans SET status = 'declined' WHERE status = 'cancelled';

-- 2. Drop and recreate treatment_plans status constraint (5 statuses only)
ALTER TABLE treatment_plans DROP CONSTRAINT IF EXISTS treatment_plans_status_check;

ALTER TABLE treatment_plans 
ADD CONSTRAINT treatment_plans_status_check 
CHECK (status IN ('draft', 'presented', 'accepted', 'partially_accepted', 'declined'));

COMMENT ON COLUMN treatment_plans.status IS 'Plan acceptance status only: draft, presented, accepted, partially_accepted, declined';

-- 3. Add acceptance_status to treatment_plan_items
ALTER TABLE treatment_plan_items 
ADD COLUMN IF NOT EXISTS acceptance_status VARCHAR(20) DEFAULT 'pending' 
CHECK (acceptance_status IN ('pending', 'accepted', 'declined'));

-- Set default for existing rows
UPDATE treatment_plan_items SET acceptance_status = 'pending' WHERE acceptance_status IS NULL;

COMMENT ON COLUMN treatment_plan_items.acceptance_status IS 'Patient acceptance of this item: pending, accepted, declined';
