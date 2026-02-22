-- PatientVisitWorkflow 2.0: new visit states (hygiene + billing path)
-- Migration: 20260230000004_visit_workflow_v2.sql
-- If you see "visits_status_check" violation for READY_FOR_BILLING etc., run this migration.

-- 1. Drop old constraint first so any current rows are allowed; we'll re-add with new list
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_status_check;

-- 2. Backfill existing visits to new state values (no-op if already migrated)
UPDATE visits SET status = 'CHECKED_IN'     WHERE status = 'ARRIVED';
UPDATE visits SET status = 'READY_FOR_EXAM' WHERE status = 'MEDICAL_REVIEWED';
UPDATE visits SET status = 'EXAM_IN_PROGRESS' WHERE status = 'IN_CHAIR';
UPDATE visits SET status = 'TREATMENT_PLANNED' WHERE status = 'EXAM_COMPLETED';
UPDATE visits SET status = 'READY_FOR_BILLING' WHERE status IN ('TREATED', 'CHECKOUT_PENDING');
UPDATE visits SET status = 'VISIT_COMPLETED' WHERE status = 'COMPLETED';

-- 3. Add new constraint with 14 states
ALTER TABLE visits ADD CONSTRAINT visits_status_check CHECK (status IN (
  'SCHEDULED', 'CHECKED_IN', 'READY_FOR_HYGIENE', 'HYGIENE_IN_PROGRESS', 'HYGIENE_COMPLETED',
  'READY_FOR_EXAM', 'EXAM_IN_PROGRESS', 'TREATMENT_PLANNED', 'READY_FOR_BILLING',
  'BILLED', 'PAYMENT_COMPLETED', 'VISIT_COMPLETED', 'CANCELLED'
));

COMMENT ON COLUMN visits.status IS 'Visit flow v2 state: SCHEDULED through VISIT_COMPLETED or CANCELLED';
