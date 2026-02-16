-- Migration: Update treatment plan status enum to support acceptance tracking
-- Date: 2026-02-19

-- Drop existing CHECK constraint on treatment_plans.status
ALTER TABLE treatment_plans 
DROP CONSTRAINT IF EXISTS treatment_plans_status_check;

-- Migrate existing data BEFORE adding new constraint
UPDATE treatment_plans SET status = 'draft' WHERE status = 'proposed';

-- Add new CHECK constraint with updated status values
ALTER TABLE treatment_plans 
ADD CONSTRAINT treatment_plans_status_check 
CHECK (status IN (
    'draft',              -- Plan created, not yet shown to patient
    'presented',          -- Plan shown to patient; awaiting response
    'accepted',           -- Patient accepted entire plan
    'partially_accepted', -- Patient accepted some items, declined others
    'declined',           -- Patient declined entire plan
    'in_progress',        -- At least one item scheduled/in progress
    'completed',          -- All accepted items completed
    'cancelled'           -- Plan cancelled
));

-- Update default value
ALTER TABLE treatment_plans 
ALTER COLUMN status SET DEFAULT 'draft';

-- Add comment
COMMENT ON COLUMN treatment_plans.status IS 'Treatment plan status: draft -> presented -> accepted/partially_accepted/declined -> in_progress -> completed';
