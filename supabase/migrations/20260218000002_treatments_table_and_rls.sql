-- Treatments table and RLS policies
-- This table stores the catalog of procedures/treatments offered by each clinic

-- Create treatments table if not exists
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_treatments_clinic ON treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatments_active ON treatments(is_active);

-- Enable RLS
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Clinic staff can view treatments" ON treatments;
CREATE POLICY "Clinic staff can view treatments" 
ON treatments FOR SELECT
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Clinic staff can manage treatments" ON treatments;
CREATE POLICY "Clinic staff can manage treatments" 
ON treatments FOR ALL
USING (clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- Trigger for updated_at
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

COMMENT ON TABLE treatments IS 'Catalog of procedures and treatments offered by each clinic';
