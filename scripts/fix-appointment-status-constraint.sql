-- Fix: Add pending and unconfirmed to appointments status constraint
-- Run this if "failed to update status to unconfirmed" occurs.
-- The initial schema only allowed: scheduled, confirmed, checked_in, in_treatment, completed, cancelled, no_show
-- This adds: pending, unconfirmed

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN (
    'pending', 'unconfirmed', 'scheduled', 'confirmed',
    'checked_in', 'in_treatment', 'completed', 'cancelled', 'no_show'
  ));
