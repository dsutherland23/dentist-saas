-- Visit Flow Engine: visits table (one per appointment, in-clinic state machine)
-- Migration: 20260225000001_visits.sql

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    timestamps JSONB NOT NULL DEFAULT '{}',
    flags JSONB NOT NULL DEFAULT '{}',
    room VARCHAR(50),
    dentist_id UUID REFERENCES users(id),
    assistant_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(appointment_id),
    CONSTRAINT visits_status_check CHECK (status IN (
        'SCHEDULED', 'ARRIVED', 'CHECKED_IN', 'MEDICAL_REVIEWED', 'IN_CHAIR',
        'EXAM_COMPLETED', 'TREATMENT_PLANNED', 'TREATED', 'CHECKOUT_PENDING',
        'COMPLETED', 'CANCELLED'
    ))
);

CREATE INDEX IF NOT EXISTS idx_visits_appointment_id ON visits(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visits_clinic_id ON visits(clinic_id);
CREATE INDEX IF NOT EXISTS idx_visits_clinic_status ON visits(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_visits_clinic_created ON visits(clinic_id, created_at DESC);

COMMENT ON TABLE visits IS 'In-clinic visit state per appointment; status follows visit flow state machine';

-- RLS: clinic staff can manage visits for their clinic
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can manage visits"
ON visits FOR ALL
USING (clinic_id = get_my_clinic_id())
WITH CHECK (clinic_id = get_my_clinic_id());
