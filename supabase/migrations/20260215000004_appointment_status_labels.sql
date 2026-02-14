-- Add pending and unconfirmed to appointment status (for dropdown labels: Pending, Unconfirmed, Checked-In, No-Show, Canceled)
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending', 'unconfirmed', 'scheduled', 'confirmed',
    'checked_in', 'in_treatment', 'completed', 'cancelled', 'no_show'
  ));
