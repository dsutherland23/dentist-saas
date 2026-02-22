-- Admin Workflow Builder: custom visit flow templates per clinic
-- Migration: 20260230000006_workflow_templates.sql

CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL DEFAULT 'Custom flow',
    config JSONB NOT NULL DEFAULT '{"nodes":[]}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_workflow_templates_clinic ON workflow_templates(clinic_id);

COMMENT ON TABLE workflow_templates IS 'Custom visit workflow templates; config.nodes = ordered list of { state, label?, assigned_role }';

ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can read workflow_templates"
ON workflow_templates FOR SELECT
USING (clinic_id = get_my_clinic_id());

CREATE POLICY "Clinic admins can manage workflow_templates"
ON workflow_templates FOR ALL
USING (clinic_id = get_my_clinic_id())
WITH CHECK (clinic_id = get_my_clinic_id());

-- Clinics: which template is active (null = use workflow_template preset)
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS active_workflow_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL;

COMMENT ON COLUMN clinics.active_workflow_id IS 'When set, use this custom workflow template; else use workflow_template preset.';

CREATE INDEX IF NOT EXISTS idx_clinics_active_workflow ON clinics(active_workflow_id) WHERE active_workflow_id IS NOT NULL;
