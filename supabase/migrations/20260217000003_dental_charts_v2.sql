-- Dental Chart V2 Comprehensive Schema Migration
-- Complete rebuild with FDI numbering, surface-level tracking, periodontal, diagnoses, treatment planning

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE chart_type_enum AS ENUM ('adult_permanent', 'mixed_dentition', 'primary');
CREATE TYPE numbering_system_enum AS ENUM ('FDI', 'universal', 'palmer');
CREATE TYPE chart_status_enum AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE tooth_arch_enum AS ENUM ('upper', 'lower');
CREATE TYPE tooth_status_enum AS ENUM ('present', 'missing', 'extracted', 'impacted', 'unerupted');
CREATE TYPE tooth_type_enum AS ENUM ('incisor', 'canine', 'premolar', 'molar');
CREATE TYPE surface_name_enum AS ENUM ('mesial', 'distal', 'buccal', 'lingual', 'occlusal', 'incisal');
CREATE TYPE condition_type_enum AS ENUM ('healthy', 'decay', 'restoration', 'crown', 'fracture', 'wear', 'abrasion', 'erosion', 'stain');
CREATE TYPE condition_status_enum AS ENUM ('stable', 'progressing', 'arrested', 'new');
CREATE TYPE severity_enum AS ENUM ('mild', 'moderate', 'severe');
CREATE TYPE material_type_enum AS ENUM ('amalgam', 'composite', 'ceramic', 'gold', 'porcelain', 'resin', 'glass_ionomer');
CREATE TYPE diagnosis_status_enum AS ENUM ('active', 'resolved', 'monitoring');
CREATE TYPE treatment_status_enum AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE treatment_priority_enum AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE attachment_type_enum AS ENUM ('xray', 'photo', 'document', 'scan', 'other');
CREATE TYPE linked_entity_type_enum AS ENUM ('chart', 'tooth', 'surface', 'treatment');
CREATE TYPE note_type_enum AS ENUM ('progress', 'followup', 'treatment', 'observation', 'chief_complaint');

-- 1. Main dental charts table
CREATE TABLE dental_charts_v2 (
  chart_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  practice_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  chart_type chart_type_enum NOT NULL DEFAULT 'adult_permanent',
  numbering_system numbering_system_enum NOT NULL DEFAULT 'FDI',
  version INTEGER NOT NULL DEFAULT 1,
  status chart_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  last_modified_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_dental_charts_v2_patient ON dental_charts_v2(patient_id);
CREATE INDEX idx_dental_charts_v2_practice ON dental_charts_v2(practice_id);
CREATE INDEX idx_dental_charts_v2_status ON dental_charts_v2(status);
CREATE UNIQUE INDEX idx_dental_charts_v2_active_patient ON dental_charts_v2(patient_id, status) WHERE status = 'active';

-- 2. Individual tooth records
CREATE TABLE chart_teeth (
  tooth_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  tooth_number VARCHAR(3) NOT NULL, -- FDI format: 11-18, 21-28, 31-38, 41-48
  arch tooth_arch_enum NOT NULL,
  quadrant INTEGER NOT NULL CHECK (quadrant BETWEEN 1 AND 4),
  tooth_type tooth_type_enum NOT NULL,
  status tooth_status_enum NOT NULL DEFAULT 'present',
  mobility_grade INTEGER CHECK (mobility_grade BETWEEN 0 AND 3),
  furcation_grade INTEGER CHECK (furcation_grade BETWEEN 0 AND 3),
  implant BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_modified_by UUID NOT NULL REFERENCES users(id),
  UNIQUE(chart_id, tooth_number)
);

CREATE INDEX idx_chart_teeth_chart ON chart_teeth(chart_id);
CREATE INDEX idx_chart_teeth_number ON chart_teeth(tooth_number);

-- 3. Surface-level conditions
CREATE TABLE tooth_surfaces (
  surface_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tooth_id UUID NOT NULL REFERENCES chart_teeth(tooth_id) ON DELETE CASCADE,
  surface_name surface_name_enum NOT NULL,
  condition_type condition_type_enum NOT NULL DEFAULT 'healthy',
  condition_status condition_status_enum NOT NULL DEFAULT 'stable',
  severity severity_enum,
  material_type material_type_enum,
  color_code VARCHAR(7) NOT NULL DEFAULT '#4CAF50',
  diagnosis_id UUID,
  treatment_plan_id UUID,
  placed_date TIMESTAMPTZ,
  provider_id UUID REFERENCES users(id),
  notes TEXT,
  UNIQUE(tooth_id, surface_name)
);

CREATE INDEX idx_tooth_surfaces_tooth ON tooth_surfaces(tooth_id);
CREATE INDEX idx_tooth_surfaces_condition ON tooth_surfaces(condition_type);

-- 4. Periodontal records (gum health)
CREATE TABLE periodontal_records (
  record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  tooth_number VARCHAR(3) NOT NULL,
  probing_depths_mm JSONB NOT NULL, -- {mb, b, db, ml, l, dl}
  bleeding_points TEXT[],
  gingival_margin_mm JSONB NOT NULL, -- {mb, b, db, ml, l, dl}
  recession_mm INTEGER NOT NULL DEFAULT 0,
  attachment_loss_mm INTEGER NOT NULL DEFAULT 0,
  plaque_index INTEGER CHECK (plaque_index BETWEEN 0 AND 3),
  calculus_present BOOLEAN NOT NULL DEFAULT FALSE,
  recorded_by UUID NOT NULL REFERENCES users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_periodontal_records_chart ON periodontal_records(chart_id);
CREATE INDEX idx_periodontal_records_tooth ON periodontal_records(tooth_number);
CREATE INDEX idx_periodontal_records_date ON periodontal_records(recorded_at DESC);

-- 5. Clinical diagnoses
CREATE TABLE chart_diagnoses (
  diagnosis_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  tooth_number VARCHAR(3),
  surface VARCHAR(20),
  diagnosis_code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  severity severity_enum NOT NULL,
  status diagnosis_status_enum NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chart_diagnoses_chart ON chart_diagnoses(chart_id);
CREATE INDEX idx_chart_diagnoses_tooth ON chart_diagnoses(tooth_number);
CREATE INDEX idx_chart_diagnoses_status ON chart_diagnoses(status);

-- 6. Treatment plans
CREATE TABLE chart_treatment_plans (
  treatment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  procedure_code VARCHAR(20) NOT NULL,
  tooth_number VARCHAR(3),
  surfaces TEXT[],
  description TEXT NOT NULL,
  status treatment_status_enum NOT NULL DEFAULT 'planned',
  priority treatment_priority_enum NOT NULL DEFAULT 'medium',
  estimated_cost DECIMAL(10, 2),
  insurance_code VARCHAR(20),
  linked_diagnosis_id UUID REFERENCES chart_diagnoses(diagnosis_id),
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chart_treatment_plans_chart ON chart_treatment_plans(chart_id);
CREATE INDEX idx_chart_treatment_plans_tooth ON chart_treatment_plans(tooth_number);
CREATE INDEX idx_chart_treatment_plans_status ON chart_treatment_plans(status);
CREATE INDEX idx_chart_treatment_plans_diagnosis ON chart_treatment_plans(linked_diagnosis_id);

-- 7. Attachments (files, x-rays, photos)
CREATE TABLE chart_attachments (
  attachment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  attachment_type attachment_type_enum NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  linked_entity_type linked_entity_type_enum,
  linked_entity_id UUID,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chart_attachments_chart ON chart_attachments(chart_id);
CREATE INDEX idx_chart_attachments_type ON chart_attachments(attachment_type);
CREATE INDEX idx_chart_attachments_linked ON chart_attachments(linked_entity_type, linked_entity_id);

-- 8. Clinical notes
CREATE TABLE chart_clinical_notes (
  note_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  note_type note_type_enum NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chart_clinical_notes_chart ON chart_clinical_notes(chart_id);
CREATE INDEX idx_chart_clinical_notes_type ON chart_clinical_notes(note_type);
CREATE INDEX idx_chart_clinical_notes_date ON chart_clinical_notes(created_at DESC);

-- 9. Audit log
CREATE TABLE chart_audit_log (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chart_id UUID NOT NULL REFERENCES dental_charts_v2(chart_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET
);

CREATE INDEX idx_chart_audit_log_chart ON chart_audit_log(chart_id);
CREATE INDEX idx_chart_audit_log_user ON chart_audit_log(user_id);
CREATE INDEX idx_chart_audit_log_date ON chart_audit_log(timestamp DESC);
CREATE INDEX idx_chart_audit_log_entity ON chart_audit_log(entity_type, entity_id);

-- Add foreign key constraints for diagnosis_id and treatment_plan_id in tooth_surfaces
ALTER TABLE tooth_surfaces
  ADD CONSTRAINT fk_tooth_surfaces_diagnosis 
  FOREIGN KEY (diagnosis_id) REFERENCES chart_diagnoses(diagnosis_id) ON DELETE SET NULL;

ALTER TABLE tooth_surfaces
  ADD CONSTRAINT fk_tooth_surfaces_treatment 
  FOREIGN KEY (treatment_plan_id) REFERENCES chart_treatment_plans(treatment_id) ON DELETE SET NULL;

-- Database Functions

-- Function to initialize teeth for a new chart
CREATE OR REPLACE FUNCTION initialize_chart_teeth(
  p_chart_id UUID,
  p_numbering_system VARCHAR,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_tooth_numbers TEXT[];
  v_tooth_number TEXT;
  v_tooth_id UUID;
  v_arch tooth_arch_enum;
  v_quadrant INTEGER;
  v_tooth_type tooth_type_enum;
  v_surfaces surface_name_enum[];
BEGIN
  -- FDI numbering: 11-18, 21-28 (upper), 31-38, 41-48 (lower)
  v_tooth_numbers := ARRAY[
    '18','17','16','15','14','13','12','11',
    '21','22','23','24','25','26','27','28',
    '48','47','46','45','44','43','42','41',
    '31','32','33','34','35','36','37','38'
  ];
  
  FOREACH v_tooth_number IN ARRAY v_tooth_numbers
  LOOP
    -- Determine arch and quadrant from FDI number
    CASE SUBSTRING(v_tooth_number, 1, 1)
      WHEN '1' THEN v_arch := 'upper'; v_quadrant := 1;
      WHEN '2' THEN v_arch := 'upper'; v_quadrant := 2;
      WHEN '3' THEN v_arch := 'lower'; v_quadrant := 3;
      WHEN '4' THEN v_arch := 'lower'; v_quadrant := 4;
    END CASE;
    
    -- Determine tooth type from position
    CASE SUBSTRING(v_tooth_number, 2, 1)
      WHEN '1', '2' THEN v_tooth_type := 'incisor';
      WHEN '3' THEN v_tooth_type := 'canine';
      WHEN '4', '5' THEN v_tooth_type := 'premolar';
      WHEN '6', '7', '8' THEN v_tooth_type := 'molar';
    END CASE;
    
    -- Determine surfaces (incisors/canines have incisal, others have occlusal)
    IF v_tooth_type IN ('incisor', 'canine') THEN
      v_surfaces := ARRAY['mesial'::surface_name_enum, 'distal'::surface_name_enum, 
                          'buccal'::surface_name_enum, 'lingual'::surface_name_enum, 'incisal'::surface_name_enum];
    ELSE
      v_surfaces := ARRAY['mesial'::surface_name_enum, 'distal'::surface_name_enum, 
                          'buccal'::surface_name_enum, 'lingual'::surface_name_enum, 'occlusal'::surface_name_enum];
    END IF;
    
    -- Insert tooth
    INSERT INTO chart_teeth (
      chart_id, tooth_number, arch, quadrant, tooth_type, status, last_modified_by
    ) VALUES (
      p_chart_id, v_tooth_number, v_arch, v_quadrant, v_tooth_type, 'present', p_user_id
    ) RETURNING tooth_id INTO v_tooth_id;
    
    -- Insert surfaces for this tooth
    INSERT INTO tooth_surfaces (tooth_id, surface_name, condition_type, condition_status, color_code)
    SELECT v_tooth_id, unnest(v_surfaces), 'healthy', 'stable', '#4CAF50';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get complete chart with all nested data
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
                  WHEN 'incisal' THEN 5
                END
            ), '[]'::jsonb)
            FROM tooth_surfaces s
            WHERE s.tooth_id = t.tooth_id
          )
        ) ORDER BY t.tooth_number
      ), '[]'::jsonb)
      FROM chart_teeth t
      WHERE t.chart_id = c.chart_id
    ),
    'periodontal_records', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'record_id', p.record_id,
          'tooth_number', p.tooth_number,
          'probing_depths_mm', p.probing_depths_mm,
          'bleeding_points', p.bleeding_points,
          'gingival_margin_mm', p.gingival_margin_mm,
          'recession_mm', p.recession_mm,
          'attachment_loss_mm', p.attachment_loss_mm,
          'plaque_index', p.plaque_index,
          'calculus_present', p.calculus_present,
          'recorded_by', p.recorded_by,
          'recorded_at', p.recorded_at
        ) ORDER BY p.recorded_at DESC
      ), '[]'::jsonb)
      FROM periodontal_records p
      WHERE p.chart_id = c.chart_id
    ),
    'diagnoses', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'diagnosis_id', d.diagnosis_id,
          'tooth_number', d.tooth_number,
          'surface', d.surface,
          'diagnosis_code', d.diagnosis_code,
          'description', d.description,
          'severity', d.severity,
          'status', d.status,
          'created_by', d.created_by,
          'created_at', d.created_at
        ) ORDER BY d.created_at DESC
      ), '[]'::jsonb)
      FROM chart_diagnoses d
      WHERE d.chart_id = c.chart_id
    ),
    'treatment_plans', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'treatment_id', t.treatment_id,
          'procedure_code', t.procedure_code,
          'tooth_number', t.tooth_number,
          'surfaces', t.surfaces,
          'description', t.description,
          'status', t.status,
          'priority', t.priority,
          'estimated_cost', t.estimated_cost,
          'insurance_code', t.insurance_code,
          'linked_diagnosis_id', t.linked_diagnosis_id,
          'scheduled_date', t.scheduled_date,
          'completed_date', t.completed_date,
          'created_by', t.created_by,
          'created_at', t.created_at
        ) ORDER BY 
          CASE t.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          t.created_at DESC
      ), '[]'::jsonb)
      FROM chart_treatment_plans t
      WHERE t.chart_id = c.chart_id
    )
  ) INTO v_result
  FROM dental_charts_v2 c
  WHERE c.chart_id = p_chart_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

ALTER TABLE dental_charts_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_teeth ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_surfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodontal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for dental_charts_v2
CREATE POLICY "Users can view charts from their clinic"
  ON dental_charts_v2 FOR SELECT
  USING (practice_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create charts for their clinic"
  ON dental_charts_v2 FOR INSERT
  WITH CHECK (practice_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update charts from their clinic"
  ON dental_charts_v2 FOR UPDATE
  USING (practice_id IN (SELECT clinic_id FROM users WHERE id = auth.uid()));

-- RLS policies for chart_teeth (inherit from parent chart)
CREATE POLICY "Users can view teeth from their clinic charts"
  ON chart_teeth FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage teeth in their clinic charts"
  ON chart_teeth FOR ALL
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

-- Similar policies for other tables
CREATE POLICY "Users can view surfaces from their clinic"
  ON tooth_surfaces FOR SELECT
  USING (tooth_id IN (SELECT tooth_id FROM chart_teeth WHERE chart_id IN 
    (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
      (SELECT clinic_id FROM users WHERE id = auth.uid()))));

CREATE POLICY "Users can manage surfaces in their clinic"
  ON tooth_surfaces FOR ALL
  USING (tooth_id IN (SELECT tooth_id FROM chart_teeth WHERE chart_id IN 
    (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
      (SELECT clinic_id FROM users WHERE id = auth.uid()))));

CREATE POLICY "Users can view periodontal records from their clinic"
  ON periodontal_records FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage periodontal records in their clinic"
  ON periodontal_records FOR ALL
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view diagnoses from their clinic"
  ON chart_diagnoses FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage diagnoses in their clinic"
  ON chart_diagnoses FOR ALL
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view treatment plans from their clinic"
  ON chart_treatment_plans FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage treatment plans in their clinic"
  ON chart_treatment_plans FOR ALL
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view attachments from their clinic"
  ON chart_attachments FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage attachments in their clinic"
  ON chart_attachments FOR ALL
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view clinical notes from their clinic"
  ON chart_clinical_notes FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can manage clinical notes in their clinic"
  ON chart_clinical_notes FOR ALL
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can view audit logs from their clinic"
  ON chart_audit_log FOR SELECT
  USING (chart_id IN (SELECT chart_id FROM dental_charts_v2 WHERE practice_id IN 
    (SELECT clinic_id FROM users WHERE id = auth.uid())));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dental_charts_v2_updated_at
  BEFORE UPDATE ON dental_charts_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_diagnoses_updated_at
  BEFORE UPDATE ON chart_diagnoses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_clinical_notes_updated_at
  BEFORE UPDATE ON chart_clinical_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE dental_charts_v2 IS 'Main dental chart records with FDI numbering support';
COMMENT ON TABLE chart_teeth IS 'Individual tooth records with status and metadata';
COMMENT ON TABLE tooth_surfaces IS 'Surface-level conditions for each tooth';
COMMENT ON TABLE periodontal_records IS 'Gum health measurements with probing depths';
COMMENT ON TABLE chart_diagnoses IS 'Clinical diagnoses linked to teeth/surfaces';
COMMENT ON TABLE chart_treatment_plans IS 'Planned treatments with cost and scheduling';
COMMENT ON TABLE chart_attachments IS 'Files, x-rays, photos linked to chart entities';
COMMENT ON TABLE chart_clinical_notes IS 'Progress notes and clinical observations';
COMMENT ON TABLE chart_audit_log IS 'Complete audit trail of all chart changes';
