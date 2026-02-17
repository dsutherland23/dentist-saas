-- Add profile picture URL to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add profile picture URL to users table (for dentists/staff)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update patient_files type to support medical image categories
ALTER TABLE patient_files 
DROP CONSTRAINT IF EXISTS patient_files_type_check;

ALTER TABLE patient_files 
ADD CONSTRAINT patient_files_type_check 
CHECK (type IN ('document', 'xray', 'intraoral', '3d_scan', 'profile_picture', 'other'));
