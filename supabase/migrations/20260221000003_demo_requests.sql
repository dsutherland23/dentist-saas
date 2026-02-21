-- Demo request intake from landing page (Schedule a Demo)
CREATE TABLE IF NOT EXISTS demo_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    current_pms TEXT,
    best_time TEXT,
    opt_in_updates BOOLEAN DEFAULT false,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_created ON demo_requests(created_at DESC);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert for landing page form; no SELECT so only service role can read
CREATE POLICY "Allow anonymous insert for demo requests"
ON demo_requests FOR INSERT
TO anon
WITH CHECK (true);
