-- Insurance Module: insurance_providers, insurance_policies, claims, era_payments
-- Uses clinic_id (tenant); RLS via get_my_clinic_id()

-- 1. Insurance providers (payer directory per clinic)
CREATE TABLE insurance_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    payer_id VARCHAR(50),
    supports_electronic_claims BOOLEAN DEFAULT TRUE,
    supports_era BOOLEAN DEFAULT FALSE,
    eligibility_endpoint TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_insurance_providers_clinic ON insurance_providers(clinic_id);

-- 2. Insurance policies (per patient, linked to provider)
CREATE TABLE insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES insurance_providers(id) ON DELETE SET NULL,
    member_id VARCHAR(255),
    group_number VARCHAR(100),
    subscriber_name VARCHAR(255),
    relationship VARCHAR(50),
    plan_type VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_status VARCHAR(50),
    eligibility_snapshot JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_insurance_policies_clinic ON insurance_policies(clinic_id);
CREATE INDEX idx_insurance_policies_patient ON insurance_policies(patient_id);

-- 3. Claims (linked to policy and invoice)
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES insurance_policies(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    claim_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'paid', 'denied', 'resubmitted', 'partially_paid')),
    clearinghouse_id VARCHAR(255),
    payer_claim_id VARCHAR(255),
    total_amount NUMERIC(12,2),
    insurance_estimate NUMERIC(12,2),
    patient_responsibility NUMERIC(12,2),
    submitted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_claims_clinic ON claims(clinic_id);
CREATE INDEX idx_claims_patient ON claims(patient_id);
CREATE INDEX idx_claims_status ON claims(status);

-- 4. ERA payments (posting from 835)
CREATE TABLE era_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    adjustment_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_era_payments_claim ON era_payments(claim_id);

-- RLS
ALTER TABLE insurance_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE era_payments ENABLE ROW LEVEL SECURITY;

-- insurance_providers: clinic-scoped
CREATE POLICY "Clinic staff can manage insurance_providers"
ON insurance_providers FOR ALL
USING (clinic_id = get_my_clinic_id());

-- insurance_policies: clinic-scoped
CREATE POLICY "Clinic staff can manage insurance_policies"
ON insurance_policies FOR ALL
USING (clinic_id = get_my_clinic_id());

-- claims: clinic-scoped
CREATE POLICY "Clinic staff can manage claims"
ON claims FOR ALL
USING (clinic_id = get_my_clinic_id());

-- era_payments: via claim's clinic (no direct clinic_id on era_payments)
CREATE POLICY "Clinic staff can view era_payments for their claims"
ON era_payments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM claims c
        WHERE c.id = era_payments.claim_id AND c.clinic_id = get_my_clinic_id()
    )
);

-- Grant to authenticated (RLS enforces clinic)
GRANT SELECT, INSERT, UPDATE, DELETE ON insurance_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON insurance_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON claims TO authenticated;
GRANT SELECT, INSERT ON era_payments TO authenticated;
GRANT UPDATE ON era_payments TO authenticated;

-- Allow clinic staff to insert audit_logs (for insurance actions)
CREATE POLICY "Clinic staff can insert audit_logs"
ON audit_logs FOR INSERT
WITH CHECK (clinic_id = get_my_clinic_id());
