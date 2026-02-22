-- Dynamic Patient Visit Workflow + audit log spec fields
-- Migration: 20260230000005_dynamic_workflow_and_audit.sql

-- 1. Clinic workflow template selection (default_clinic_workflow | full_clinic_workflow)
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS workflow_template VARCHAR(80) NOT NULL DEFAULT 'full_clinic_workflow';

COMMENT ON COLUMN clinics.workflow_template IS 'Visit workflow template: default_clinic_workflow (linear, no hygiene) or full_clinic_workflow (with hygiene path).';

-- 2. Audit log: before_value / after_value for status_change tracking
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS before_value TEXT,
ADD COLUMN IF NOT EXISTS after_value TEXT;

COMMENT ON COLUMN audit_logs.before_value IS 'Value before change (e.g. visit status).';
COMMENT ON COLUMN audit_logs.after_value IS 'Value after change (e.g. visit status).';
