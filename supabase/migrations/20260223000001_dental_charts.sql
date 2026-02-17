-- Dental Charts Migration
-- Stores per-patient dental chart with 32 teeth, surfaces, diagnoses, and periodontal data

-- Create dental_charts table
CREATE TABLE IF NOT EXISTS dental_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL UNIQUE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    numbering_system VARCHAR(20) DEFAULT 'universal' CHECK (numbering_system IN ('universal', 'FDI', 'palmer')),
    chart_type VARCHAR(30) DEFAULT 'adult_permanent' CHECK (chart_type IN ('adult_permanent', 'mixed_dentition', 'primary')),
    version INTEGER DEFAULT 1 NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP WITH TIME ZONE,
    teeth JSONB NOT NULL DEFAULT '[]'::jsonb,
    medical_images JSONB DEFAULT '[]'::jsonb,
    audit_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dental_charts_patient ON dental_charts(patient_id);
CREATE INDEX IF NOT EXISTS idx_dental_charts_clinic ON dental_charts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_dental_charts_locked_by ON dental_charts(locked_by);

-- Enable RLS
ALTER TABLE dental_charts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view/manage charts for patients in their clinic
CREATE POLICY "Users can view dental charts from their clinic"
    ON dental_charts FOR SELECT
    USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Staff can create dental charts"
    ON dental_charts FOR INSERT
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('clinic_admin', 'dentist', 'hygienist')
        )
    );

CREATE POLICY "Staff can update dental charts from their clinic"
    ON dental_charts FOR UPDATE
    USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    )
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Admins can delete dental charts"
    ON dental_charts FOR DELETE
    USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('clinic_admin')
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_dental_charts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dental_charts_updated_at ON dental_charts;
CREATE TRIGGER update_dental_charts_updated_at 
    BEFORE UPDATE ON dental_charts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_dental_charts_updated_at();

-- Comments
COMMENT ON TABLE dental_charts IS 'Per-patient dental charts with tooth-level clinical state, surfaces, diagnoses, and periodontal data';
COMMENT ON COLUMN dental_charts.teeth IS 'Array of 32 teeth with status, surfaces, diagnoses, periodontal data, and attachments';
COMMENT ON COLUMN dental_charts.medical_images IS 'Array of medical images with related tooth numbers';
COMMENT ON COLUMN dental_charts.audit_log IS 'Audit trail of chart changes';
