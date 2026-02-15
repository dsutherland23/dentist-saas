-- Invoice Enhancements for AR Aging and Payment Tracking
-- Migration: 20260216000002_invoice_enhancements.sql

-- Add fields to track payments and aging
ALTER TABLE invoices 
    ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_due NUMERIC(10,2) DEFAULT 0;

-- Update existing records to set balance_due = total_amount for non-paid invoices
UPDATE invoices 
SET balance_due = total_amount - COALESCE(amount_paid, 0)
WHERE status NOT IN ('paid', 'cancelled');

-- Create function to calculate days past due
CREATE OR REPLACE FUNCTION calculate_days_past_due(due_date DATE, status VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    IF status IN ('paid', 'cancelled') THEN
        RETURN 0;
    END IF;
    
    IF due_date IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN GREATEST(0, EXTRACT(DAY FROM (CURRENT_DATE - due_date))::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for AR aging buckets
CREATE OR REPLACE VIEW invoice_ar_aging AS
SELECT 
    i.id,
    i.clinic_id,
    i.patient_id,
    i.invoice_number,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.due_date,
    i.status,
    i.created_at,
    calculate_days_past_due(i.due_date, i.status) as days_past_due,
    CASE 
        WHEN calculate_days_past_due(i.due_date, i.status) = 0 THEN 'current'
        WHEN calculate_days_past_due(i.due_date, i.status) <= 30 THEN '0-30'
        WHEN calculate_days_past_due(i.due_date, i.status) <= 60 THEN '31-60'
        WHEN calculate_days_past_due(i.due_date, i.status) <= 90 THEN '61-90'
        ELSE '90+'
    END as aging_bucket,
    p.first_name || ' ' || p.last_name as patient_name,
    p.phone as patient_phone,
    p.email as patient_email
FROM invoices i
LEFT JOIN patients p ON i.patient_id = p.id
WHERE i.status NOT IN ('paid', 'cancelled');

-- Create function to update invoice balance when payment is added
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the invoice's amount_paid and balance_due
    UPDATE invoices
    SET 
        amount_paid = COALESCE(amount_paid, 0) + NEW.amount_paid,
        balance_due = total_amount - (COALESCE(amount_paid, 0) + NEW.amount_paid),
        status = CASE 
            WHEN total_amount <= (COALESCE(amount_paid, 0) + NEW.amount_paid) THEN 'paid'
            WHEN (COALESCE(amount_paid, 0) + NEW.amount_paid) > 0 THEN 'partially_paid'
            ELSE status
        END
    WHERE id = NEW.invoice_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update invoice balance on payment
DROP TRIGGER IF EXISTS trigger_update_invoice_balance ON payments;
CREATE TRIGGER trigger_update_invoice_balance
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_balance();

-- Create index on balance_due for faster AR queries
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(balance_due) WHERE balance_due > 0;
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');

-- Comments
COMMENT ON COLUMN invoices.amount_paid IS 'Total amount paid towards this invoice';
COMMENT ON COLUMN invoices.balance_due IS 'Remaining balance on invoice (total_amount - amount_paid)';
COMMENT ON VIEW invoice_ar_aging IS 'AR aging report view with aging buckets and patient details';
COMMENT ON FUNCTION calculate_days_past_due IS 'Calculates number of days an invoice is past due';
