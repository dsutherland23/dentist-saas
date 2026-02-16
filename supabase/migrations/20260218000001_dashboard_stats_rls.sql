-- Add missing RLS policies so dashboard stats (payments, invoice_items, treatment_records) return data
-- These tables had RLS enabled but no policies, causing empty results and $0 / 0% stats
-- Uses DROP IF EXISTS so migration is idempotent if policies already exist

-- Payments: clinic staff can manage payments for their clinic
DROP POLICY IF EXISTS "Clinic staff can manage payments" ON payments;
CREATE POLICY "Clinic staff can manage payments"
ON payments FOR ALL
USING (clinic_id = get_my_clinic_id());

-- Invoice items: clinic staff can manage items for invoices in their clinic
DROP POLICY IF EXISTS "Clinic staff can manage invoice items" ON invoice_items;
CREATE POLICY "Clinic staff can manage invoice items"
ON invoice_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.clinic_id = get_my_clinic_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM invoices
    WHERE invoices.id = invoice_items.invoice_id
    AND invoices.clinic_id = get_my_clinic_id()
  )
);

-- Treatment records: clinic staff can manage records for their clinic
DROP POLICY IF EXISTS "Clinic staff can manage treatment records" ON treatment_records;
CREATE POLICY "Clinic staff can manage treatment records"
ON treatment_records FOR ALL
USING (clinic_id = get_my_clinic_id());
