-- Fix: Allow users to register themselves as specialists
-- Drop conflicting policies and recreate with correct rules

-- Drop existing insert policies that might conflict
DROP POLICY IF EXISTS "Authenticated users can register as specialist" ON specialists;
DROP POLICY IF EXISTS "Users can register themselves as specialist" ON specialists;
DROP POLICY IF EXISTS "Admins can add specialists" ON specialists;

-- Recreate: Users can self-register (user_id = auth.uid(), status pending)
CREATE POLICY "Users can register themselves as specialist"
ON specialists FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Admins can add specialists (user_id null or any, status approved)
CREATE POLICY "Admins can add specialists"
ON specialists FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role IN ('clinic_admin', 'super_admin')
  )
);
