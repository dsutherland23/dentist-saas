-- Operatory/Chair Utilization Tracking
-- Migration: 20260216000003_operatory_tracking.sql

-- Create view for daily chair utilization
-- Uses the existing 'room' field in appointments table as the operatory identifier
CREATE OR REPLACE VIEW daily_chair_utilization AS
SELECT 
    clinic_id,
    DATE(start_time) as appointment_date,
    room as operatory,
    dentist_id,
    COUNT(*) as total_appointments,
    SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as total_hours,
    -- Assuming 8 hour work day (can be made configurable)
    ROUND((SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) / 8.0 * 100)::numeric, 2) as utilization_percent
FROM appointments
WHERE status IN ('scheduled', 'confirmed', 'checked_in', 'in_treatment', 'completed')
    AND room IS NOT NULL
    AND room != ''
GROUP BY clinic_id, DATE(start_time), room, dentist_id;

-- Create view for monthly operatory performance
CREATE OR REPLACE VIEW monthly_operatory_performance AS
SELECT 
    clinic_id,
    DATE_TRUNC('month', start_time) as month_start,
    room as operatory,
    COUNT(*) as total_appointments,
    SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as total_hours,
    COUNT(DISTINCT dentist_id) as unique_providers,
    COUNT(DISTINCT DATE(start_time)) as days_utilized,
    -- Average utilization per work day
    ROUND((SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) / NULLIF(COUNT(DISTINCT DATE(start_time)), 0) / 8.0 * 100)::numeric, 2) as avg_daily_utilization
FROM appointments
WHERE status IN ('scheduled', 'confirmed', 'checked_in', 'in_treatment', 'completed')
    AND room IS NOT NULL
    AND room != ''
GROUP BY clinic_id, DATE_TRUNC('month', start_time), room;

-- Create view for today's schedule summary
CREATE OR REPLACE VIEW todays_schedule_summary AS
SELECT 
    clinic_id,
    COUNT(*) as total_appointments,
    SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as booked_hours,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    COUNT(*) FILTER (WHERE status = 'no_show') as no_show_count,
    COUNT(DISTINCT room) as operatories_in_use,
    COUNT(DISTINCT dentist_id) as providers_scheduled
FROM appointments
WHERE DATE(start_time) = CURRENT_DATE
GROUP BY clinic_id;

-- Create index on room field for faster operatory queries
CREATE INDEX IF NOT EXISTS idx_appointments_room ON appointments(room) WHERE room IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date_room ON appointments(DATE(start_time), room);

-- Comments
COMMENT ON VIEW daily_chair_utilization IS 'Daily chair/operatory utilization metrics by provider';
COMMENT ON VIEW monthly_operatory_performance IS 'Monthly operatory performance and utilization statistics';
COMMENT ON VIEW todays_schedule_summary IS 'Summary of today''s appointments and operatory usage';
