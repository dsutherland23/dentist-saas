-- Clinic-wide setting: when true, staff can use fullscreen mode to hide browser URL bar
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS use_fullscreen BOOLEAN DEFAULT false;

COMMENT ON COLUMN clinics.use_fullscreen IS 'When true, fullscreen mode is offered to all staff so the app can fill the screen and hide the browser address bar.';
