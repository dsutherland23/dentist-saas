-- Helper function to get current user's clinic_id
CREATE OR REPLACE FUNCTION get_my_clinic_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT clinic_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Clinics Policy
CREATE POLICY "Users can view their own clinic"
ON clinics FOR SELECT
USING (id = get_my_clinic_id());

-- 2. Users Policy
CREATE POLICY "Users can view members of their own clinic"
ON users FOR SELECT
USING (clinic_id = get_my_clinic_id());

-- 3. Patients Policy
CREATE POLICY "Clinic staff can view/edit their patients"
ON patients FOR ALL
USING (clinic_id = get_my_clinic_id());

-- 4. Appointments Policy
CREATE POLICY "Clinic staff can manage appointments"
ON appointments FOR ALL
USING (clinic_id = get_my_clinic_id());

-- 5. Messages Policy
CREATE POLICY "Users can see messages sent to or by them"
ON messages FOR ALL
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 6. Invoices Policy
CREATE POLICY "Clinic staff can manage invoices"
ON invoices FOR ALL
USING (clinic_id = get_my_clinic_id());

-- 7. Audit Logs (Read Only for Admins)
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  clinic_id = get_my_clinic_id() 
  AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('clinic_admin', 'super_admin'))
);
