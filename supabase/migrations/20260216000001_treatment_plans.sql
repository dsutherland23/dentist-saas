-- Treatment Plans and Treatment Plan Items Tables
-- Migration: 20260216000001_treatment_plans.sql

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    dentist_id UUID REFERENCES users(id),
    plan_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')),
    total_estimated_cost NUMERIC(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Treatment Plan Items
CREATE TABLE IF NOT EXISTS treatment_plan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE NOT NULL,
    treatment_id UUID REFERENCES treatments(id),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    appointment_id UUID REFERENCES appointments(id),
    invoice_id UUID REFERENCES invoices(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_treatment_plans_clinic ON treatment_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_plan ON treatment_plan_items(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_appointment ON treatment_plan_items(appointment_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_invoice ON treatment_plan_items(invoice_id);

-- Enable RLS
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for treatment_plans
CREATE POLICY "Users can view treatment plans from their clinic"
    ON treatment_plans FOR SELECT
    USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Staff can create treatment plans"
    ON treatment_plans FOR INSERT
    WITH CHECK (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('clinic_admin', 'dentist', 'hygienist')
        )
    );

CREATE POLICY "Staff can update treatment plans from their clinic"
    ON treatment_plans FOR UPDATE
    USING (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete treatment plans"
    ON treatment_plans FOR DELETE
    USING (
        clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('clinic_admin')
        )
    );

-- RLS Policies for treatment_plan_items
CREATE POLICY "Users can view treatment plan items from their clinic"
    ON treatment_plan_items FOR SELECT
    USING (
        treatment_plan_id IN (
            SELECT id FROM treatment_plans 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Staff can create treatment plan items"
    ON treatment_plan_items FOR INSERT
    WITH CHECK (
        treatment_plan_id IN (
            SELECT id FROM treatment_plans 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('clinic_admin', 'dentist', 'hygienist')
        )
    );

CREATE POLICY "Staff can update treatment plan items"
    ON treatment_plan_items FOR UPDATE
    USING (
        treatment_plan_id IN (
            SELECT id FROM treatment_plans 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
    );

CREATE POLICY "Admins can delete treatment plan items"
    ON treatment_plan_items FOR DELETE
    USING (
        treatment_plan_id IN (
            SELECT id FROM treatment_plans 
            WHERE clinic_id IN (SELECT clinic_id FROM users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('clinic_admin')
        )
    );

-- Comments
COMMENT ON TABLE treatment_plans IS 'Treatment plans proposed to patients with acceptance tracking';
COMMENT ON TABLE treatment_plan_items IS 'Individual procedures/treatments within a treatment plan';
