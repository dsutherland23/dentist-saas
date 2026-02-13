-- Clinical Referrals Module: Core Schema
-- Creates specialties, specialists, and referrals tables

-- 1. Specialties (Master List)
CREATE TABLE specialties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Specialists (Registered Medical/Dental Professionals)
CREATE TABLE specialists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to user if they're also a platform user
    name VARCHAR(255) NOT NULL,
    specialty_id UUID REFERENCES specialties(id) ON DELETE RESTRICT NOT NULL,
    license_number VARCHAR(100),
    clinic_name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    parish VARCHAR(100), -- Jamaica-specific, can be repurposed for state/province
    country VARCHAR(100) DEFAULT 'Jamaica',
    lat DECIMAL(10, 8), -- Latitude for map markers
    lng DECIMAL(11, 8), -- Longitude for map markers
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    bio TEXT,
    credentials_url TEXT, -- Path to uploaded credentials in storage
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Referrals (Patient Referral Records)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialist_id UUID REFERENCES specialists(id) ON DELETE CASCADE NOT NULL,
    referring_user_id UUID REFERENCES users(id) ON DELETE SET NULL NOT NULL, -- Who sent the referral
    referring_provider_name VARCHAR(255), -- Name of referring provider
    referring_organization VARCHAR(255), -- Clinic/practice name
    referring_contact VARCHAR(255), -- Contact info
    patient_first_name VARCHAR(100) NOT NULL,
    patient_last_name VARCHAR(100) NOT NULL,
    dob DATE,
    urgency VARCHAR(50) DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'emergency')),
    reason TEXT NOT NULL,
    attachments JSONB, -- Array of file paths: ["path1.pdf", "path2.jpg"]
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'reviewed', 'scheduled', 'completed', 'cancelled')),
    consent_confirmed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Specialties
-- Everyone can read active specialties
CREATE POLICY "Anyone can view active specialties"
    ON specialties FOR SELECT
    USING (active = true);

-- Only admins can insert/update/delete specialties
CREATE POLICY "Admins can manage specialties"
    ON specialties FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'clinic_admin')
        )
    );

-- RLS Policies for Specialists
-- Everyone can view approved specialists
CREATE POLICY "Anyone can view approved specialists"
    ON specialists FOR SELECT
    USING (status = 'approved');

-- Authenticated users can insert their own specialist registration (pending)
CREATE POLICY "Authenticated users can register as specialist"
    ON specialists FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own pending registrations
CREATE POLICY "Users can update their own specialist profile"
    ON specialists FOR UPDATE
    USING (user_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM users WHERE role IN ('super_admin', 'clinic_admin')
    ));

-- Only admins can delete specialists
CREATE POLICY "Admins can delete specialists"
    ON specialists FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'clinic_admin')
        )
    );

-- RLS Policies for Referrals
-- Authenticated users can create referrals
CREATE POLICY "Authenticated users can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND referring_user_id = auth.uid());

-- Users can view referrals they sent
CREATE POLICY "Users can view referrals they sent"
    ON referrals FOR SELECT
    USING (referring_user_id = auth.uid());

-- Specialists can view referrals sent to them
CREATE POLICY "Specialists can view their received referrals"
    ON referrals FOR SELECT
    USING (
        specialist_id IN (
            SELECT id FROM specialists WHERE user_id = auth.uid()
        )
    );

-- Specialists can update status of referrals sent to them
CREATE POLICY "Specialists can update referral status"
    ON referrals FOR UPDATE
    USING (
        specialist_id IN (
            SELECT id FROM specialists WHERE user_id = auth.uid()
        )
    );

-- Indexes for Performance
CREATE INDEX idx_specialists_specialty ON specialists(specialty_id);
CREATE INDEX idx_specialists_status ON specialists(status);
CREATE INDEX idx_specialists_location ON specialists(city, parish, country);
CREATE INDEX idx_specialists_user ON specialists(user_id);

CREATE INDEX idx_referrals_specialist ON referrals(specialist_id);
CREATE INDEX idx_referrals_referring_user ON referrals(referring_user_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_created ON referrals(created_at);

-- Seed Initial Specialties (Dental Focus with Medical Expansion)
INSERT INTO specialties (name, active) VALUES
    ('General Dentistry', true),
    ('Orthodontics', true),
    ('Periodontics', true),
    ('Endodontics', true),
    ('Prosthodontics', true),
    ('Oral Surgery', true),
    ('Pediatric Dentistry', true),
    ('Oral Medicine', true),
    ('Restorative Dentistry', true),
    ('Cosmetic Dentistry', true),
    -- Medical Specialties for Global Expansion
    ('Cardiologist', true),
    ('Pediatrician', true),
    ('Dermatologist', true),
    ('Neurologist', true),
    ('Psychiatrist', true),
    ('Orthopedic Surgeon', true),
    ('OB/GYN', true),
    ('General Practitioner', true),
    ('Ophthalmologist', true),
    ('ENT Specialist', true);
