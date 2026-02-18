-- Support feedback from Settings > Support (suggestions and feedback)
CREATE TABLE IF NOT EXISTS support_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_feedback_clinic ON support_feedback(clinic_id);
CREATE INDEX IF NOT EXISTS idx_support_feedback_created ON support_feedback(created_at DESC);

-- RLS: users can insert their own clinic's feedback
ALTER TABLE support_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit feedback for their clinic"
ON support_feedback FOR INSERT
WITH CHECK (
    clinic_id = (SELECT clinic_id FROM users WHERE id = auth.uid())
    AND user_id = auth.uid()
);

-- No SELECT policy: only backend with service role can read feedback.
