-- Walk-ins: mark ad-hoc front-desk appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN NOT NULL DEFAULT false;

-- Optional queue number for walk-ins (front-desk ticket)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS queue_number INTEGER;

