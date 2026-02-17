-- Migration: Add Universal Numbering System Support
-- Description: Extends dental chart V2 to support both FDI and Universal numbering systems

-- 1. Create tooth_type enum
CREATE TYPE tooth_type_enum AS ENUM ('permanent', 'primary');

-- 2. Add new columns to chart_teeth table
ALTER TABLE chart_teeth 
  ADD COLUMN universal_number VARCHAR(3),
  ADD COLUMN tooth_type tooth_type_enum DEFAULT 'permanent';

-- 3. Add preferred numbering system to dental_charts_v2
ALTER TABLE dental_charts_v2 
  ADD COLUMN preferred_numbering_system VARCHAR(20) DEFAULT 'fdi';

-- 4. Create FDI to Universal conversion function
CREATE OR REPLACE FUNCTION fdi_to_universal(fdi_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  quadrant INTEGER;
  position INTEGER;
  universal_num INTEGER;
BEGIN
  -- Parse FDI number (e.g., '11' -> quadrant 1, position 1)
  quadrant := CAST(SUBSTRING(fdi_number FROM 1 FOR 1) AS INTEGER);
  position := CAST(SUBSTRING(fdi_number FROM 2 FOR 1) AS INTEGER);
  
  -- Map FDI to Universal (1-32)
  -- Quadrant 1 (upper right 11-18): Universal 8-1
  -- Quadrant 2 (upper left 21-28): Universal 9-16
  -- Quadrant 3 (lower left 31-38): Universal 17-24
  -- Quadrant 4 (lower right 41-48): Universal 25-32
  
  CASE quadrant
    WHEN 1 THEN universal_num := 9 - position;
    WHEN 2 THEN universal_num := 8 + position;
    WHEN 3 THEN universal_num := 16 + position;
    WHEN 4 THEN universal_num := 33 - position;
    ELSE universal_num := NULL;
  END CASE;
  
  RETURN universal_num::TEXT;
END;
$$;

-- 5. Create Universal to FDI conversion function
CREATE OR REPLACE FUNCTION universal_to_fdi(universal_number TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  universal_num INTEGER;
  fdi_result TEXT;
BEGIN
  universal_num := CAST(universal_number AS INTEGER);
  
  -- Map Universal to FDI
  CASE
    WHEN universal_num BETWEEN 1 AND 8 THEN
      fdi_result := '1' || (9 - universal_num)::TEXT;
    WHEN universal_num BETWEEN 9 AND 16 THEN
      fdi_result := '2' || (universal_num - 8)::TEXT;
    WHEN universal_num BETWEEN 17 AND 24 THEN
      fdi_result := '3' || (universal_num - 16)::TEXT;
    WHEN universal_num BETWEEN 25 AND 32 THEN
      fdi_result := '4' || (33 - universal_num)::TEXT;
    ELSE
      fdi_result := NULL;
  END CASE;
  
  RETURN fdi_result;
END;
$$;

-- 6. Populate universal_number for existing teeth
UPDATE chart_teeth 
SET universal_number = fdi_to_universal(tooth_number)
WHERE universal_number IS NULL 
  AND tooth_number SIMILAR TO '[1-4][1-8]';

-- 7. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chart_teeth_universal_number 
  ON chart_teeth(universal_number);

CREATE INDEX IF NOT EXISTS idx_chart_teeth_tooth_type 
  ON chart_teeth(tooth_type);

-- 8. Update get_chart_with_full_details function to include new fields
CREATE OR REPLACE FUNCTION get_chart_with_full_details(p_chart_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'chart_id', c.chart_id,
    'patient_id', c.patient_id,
    'practice_id', c.practice_id,
    'chart_type', c.chart_type,
    'numbering_system', c.numbering_system,
    'preferred_numbering_system', c.preferred_numbering_system,
    'version', c.version,
    'status', c.status,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'created_by', c.created_by,
    'last_modified_by', c.last_modified_by,
    'teeth', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'tooth_id', t.tooth_id,
          'tooth_number', t.tooth_number,
          'universal_number', t.universal_number,
          'tooth_type_category', t.tooth_type,
          'arch', t.arch,
          'quadrant', t.quadrant,
          'tooth_type', t.tooth_type,
          'status', t.status,
          'mobility_grade', t.mobility_grade,
          'furcation_grade', t.furcation_grade,
          'implant', t.implant,
          'surfaces', (
            SELECT COALESCE(jsonb_agg(
              jsonb_build_object(
                'surface_id', s.surface_id,
                'surface_name', s.surface_name,
                'condition_type', s.condition_type,
                'condition_status', s.condition_status,
                'severity', s.severity,
                'material_type', s.material_type,
                'color_code', s.color_code,
                'diagnosis_id', s.diagnosis_id,
                'treatment_plan_id', s.treatment_plan_id,
                'placed_date', s.placed_date,
                'provider_id', s.provider_id,
                'notes', s.notes
              ) ORDER BY 
                CASE s.surface_name
                  WHEN 'mesial' THEN 1
                  WHEN 'distal' THEN 2
                  WHEN 'buccal' THEN 3
                  WHEN 'lingual' THEN 4
                  WHEN 'occlusal' THEN 5
                  WHEN 'incisal' THEN 6
                END
            ), '[]'::jsonb)
            FROM tooth_surfaces s
            WHERE s.tooth_id = t.tooth_id
          )
        ) ORDER BY t.tooth_number
      ), '[]'::jsonb)
      FROM chart_teeth t
      WHERE t.chart_id = c.chart_id
    )
  ) INTO v_result
  FROM dental_charts_v2 c
  WHERE c.chart_id = p_chart_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Update initialize_chart_teeth function to include universal numbers
CREATE OR REPLACE FUNCTION initialize_chart_teeth(
  p_chart_id UUID,
  p_numbering_system TEXT,
  p_user_id UUID
)
RETURNS void AS $$
DECLARE
  v_fdi_numbers TEXT[] := ARRAY[
    '11','12','13','14','15','16','17','18',
    '21','22','23','24','25','26','27','28',
    '31','32','33','34','35','36','37','38',
    '41','42','43','44','45','46','47','48'
  ];
  v_fdi TEXT;
BEGIN
  FOREACH v_fdi IN ARRAY v_fdi_numbers
  LOOP
    INSERT INTO chart_teeth (
      chart_id,
      tooth_number,
      universal_number,
      tooth_type,
      arch,
      quadrant,
      tooth_type,
      status,
      implant,
      version,
      last_modified_by
    ) VALUES (
      p_chart_id,
      v_fdi,
      fdi_to_universal(v_fdi),
      'permanent',
      CASE WHEN SUBSTRING(v_fdi FROM 1 FOR 1)::INTEGER <= 2 THEN 'upper' ELSE 'lower' END,
      SUBSTRING(v_fdi FROM 1 FOR 1)::INTEGER,
      CASE SUBSTRING(v_fdi FROM 2 FOR 1)::INTEGER
        WHEN 1, 2 THEN 'incisor'
        WHEN 3 THEN 'canine'
        WHEN 4, 5 THEN 'premolar'
        ELSE 'molar'
      END,
      'present',
      false,
      1,
      p_user_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 10. Add comment documentation
COMMENT ON COLUMN chart_teeth.universal_number IS 'Universal/National tooth numbering (1-32 for permanent, A-T for primary)';
COMMENT ON COLUMN chart_teeth.tooth_type IS 'Type of tooth: permanent (adult) or primary (baby)';
COMMENT ON COLUMN dental_charts_v2.preferred_numbering_system IS 'User preference for tooth numbering display: fdi or universal';
COMMENT ON FUNCTION fdi_to_universal(TEXT) IS 'Converts FDI notation (11-48) to Universal notation (1-32)';
COMMENT ON FUNCTION universal_to_fdi(TEXT) IS 'Converts Universal notation (1-32) to FDI notation (11-48)';
