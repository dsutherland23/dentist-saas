// Dental Chart V2 TypeScript Type Definitions
// Complete type system for the new comprehensive dental charting schema

// Enums
export type ChartType = 'adult_permanent' | 'mixed_dentition' | 'primary'
export type NumberingSystem = 'FDI' | 'universal' | 'palmer'
export type ChartStatus = 'active' | 'archived' | 'deleted'
export type ToothArch = 'upper' | 'lower'
export type ToothStatus = 'present' | 'missing' | 'extracted' | 'impacted' | 'unerupted' | 'partially_erupted' | 'exfoliated' | 'supernumerary' | 'implant'
export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar'
export type ToothTypeCategory = 'permanent' | 'primary' // Permanent (adult) vs Primary (baby) teeth
export type UniversalNumber = string // 1-32 for permanent, A-T for primary
export type SurfaceName = 'mesial' | 'distal' | 'buccal' | 'lingual' | 'occlusal' | 'incisal'
export type ConditionType = 'healthy' | 'decay' | 'restoration' | 'crown' | 'fracture' | 'wear' | 'abrasion' | 'erosion' | 'stain'
export type ConditionStatus = 'stable' | 'progressing' | 'arrested' | 'new'
export type Severity = 'mild' | 'moderate' | 'severe'
export type MaterialType = 'amalgam' | 'composite' | 'ceramic' | 'gold' | 'porcelain' | 'resin' | 'glass_ionomer'
export type DiagnosisStatus = 'active' | 'resolved' | 'monitoring'
export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type TreatmentPriority = 'urgent' | 'high' | 'medium' | 'low'
export type AttachmentType = 'xray' | 'photo' | 'document' | 'scan' | 'other'
export type LinkedEntityType = 'chart' | 'tooth' | 'surface' | 'treatment'
export type NoteType = 'progress' | 'followup' | 'treatment' | 'observation' | 'chief_complaint'

// Periodontal measurement structures
export interface ProbingDepths {
  mb: number  // Mesio-buccal
  b: number   // Buccal
  db: number  // Disto-buccal
  ml: number  // Mesio-lingual
  l: number   // Lingual
  dl: number  // Disto-lingual
}

export interface GingivalMargin {
  mb: number
  b: number
  db: number
  ml: number
  l: number
  dl: number
}

// Main chart interface
export interface DentalChartV2 {
  chart_id: string
  patient_id: string
  practice_id: string
  chart_type: ChartType
  numbering_system: NumberingSystem
  preferred_numbering_system?: 'FDI' | 'universal' // User's display preference
  version: number
  status: ChartStatus
  created_at: string
  updated_at: string
  created_by: string
  last_modified_by: string
  // Nested data
  teeth: ChartTooth[]
  periodontal_records?: PeriodontalRecord[]
  diagnoses?: ChartDiagnosis[]
  treatment_plans?: ChartTreatmentPlan[]
  attachments?: ChartAttachment[]
  clinical_notes?: ClinicalNote[]
}

// Individual tooth
export interface ChartTooth {
  tooth_id: string
  chart_id: string
  tooth_number: string // FDI format (e.g., "11", "21", "48")
  universal_number?: UniversalNumber // Universal format (1-32 or A-T)
  tooth_type_category?: ToothTypeCategory // permanent or primary
  arch: ToothArch
  quadrant: number // 1-4
  tooth_type: ToothType
  status: ToothStatus
  mobility_grade: number | null // 0-3
  furcation_grade: number | null // 0-3
  implant: boolean
  version: number
  last_modified_at: string
  last_modified_by: string
  // Nested surfaces
  surfaces: ToothSurfaceV2[]
}

// Surface-level condition
export interface ToothSurfaceV2 {
  surface_id: string
  tooth_id: string
  surface_name: SurfaceName
  condition_type: ConditionType
  condition_status: ConditionStatus
  severity: Severity | null
  material_type: MaterialType | null
  color_code: string // Hex color for UI rendering
  diagnosis_id: string | null
  treatment_plan_id: string | null
  placed_date: string | null
  provider_id: string | null
  notes: string
}

// Periodontal record
export interface PeriodontalRecord {
  record_id: string
  chart_id: string
  tooth_number: string
  probing_depths_mm: ProbingDepths
  bleeding_points: string[]
  gingival_margin_mm: GingivalMargin
  recession_mm: number
  attachment_loss_mm: number
  plaque_index: number | null // 0-3
  calculus_present: boolean
  recorded_by: string
  recorded_at: string
}

// Clinical diagnosis
export interface ChartDiagnosis {
  diagnosis_id: string
  chart_id: string
  tooth_number: string | null
  surface: string | null
  diagnosis_code: string // ICD-10 or ADA code
  description: string
  severity: Severity
  status: DiagnosisStatus
  created_by: string
  created_at: string
  updated_at: string
}

// Treatment plan item
export interface ChartTreatmentPlan {
  treatment_id: string
  chart_id: string
  procedure_code: string // ADA/CDT code (e.g., "D2392")
  tooth_number: string | null
  surfaces: string[] | null
  description: string
  status: TreatmentStatus
  priority: TreatmentPriority
  estimated_cost: number | null
  insurance_code: string | null
  linked_diagnosis_id: string | null
  scheduled_date: string | null
  completed_date: string | null
  created_by: string
  created_at: string
}

// File attachment
export interface ChartAttachment {
  attachment_id: string
  chart_id: string
  attachment_type: AttachmentType
  file_url: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  linked_entity_type: LinkedEntityType | null
  linked_entity_id: string | null
  uploaded_by: string
  uploaded_at: string
}

// Clinical note
export interface ClinicalNote {
  note_id: string
  chart_id: string
  note_type: NoteType
  content: string
  created_by: string
  created_at: string
  updated_at: string
}

// Audit log entry
export interface ChartAuditLog {
  log_id: string
  chart_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  before_state: any // JSONB
  after_state: any // JSONB
  timestamp: string
  ip_address: string | null
}

// API request/response types
export interface CreateChartRequest {
  patient_id: string
  practice_id: string
  chart_type?: ChartType
  numbering_system?: NumberingSystem
}

export interface UpdateSurfaceRequest {
  condition_type: ConditionType
  condition_status?: ConditionStatus
  severity?: Severity | null
  material_type?: MaterialType | null
  color_code?: string
  diagnosis_id?: string | null
  treatment_plan_id?: string | null
  placed_date?: string | null
  provider_id?: string | null
  notes?: string
}

export interface CreatePeriodontalRecordRequest {
  tooth_number: string
  probing_depths_mm: ProbingDepths
  bleeding_points?: string[]
  gingival_margin_mm: GingivalMargin
  recession_mm?: number
  plaque_index?: number
  calculus_present?: boolean
}

export interface CreateDiagnosisRequest {
  tooth_number?: string
  surface?: string
  diagnosis_code: string
  description: string
  severity: Severity
  status?: DiagnosisStatus
}

export interface CreateTreatmentPlanRequest {
  procedure_code: string
  tooth_number?: string
  surfaces?: string[]
  description: string
  priority?: TreatmentPriority
  estimated_cost?: number
  insurance_code?: string
  linked_diagnosis_id?: string
  scheduled_date?: string
}

export interface CreateClinicalNoteRequest {
  note_type: NoteType
  content: string
}

// Helper type guards
export function isFDINumber(toothNumber: string): boolean {
  return /^[1-4][1-8]$/.test(toothNumber)
}

export function isUniversalNumber(toothNumber: string | number): boolean {
  const num = typeof toothNumber === 'string' ? parseInt(toothNumber) : toothNumber
  return num >= 1 && num <= 32
}

// Surface validation
export function isValidSurfaceForTooth(toothType: ToothType, surfaceName: SurfaceName): boolean {
  if (toothType === 'incisor' || toothType === 'canine') {
    return ['mesial', 'distal', 'buccal', 'lingual', 'incisal'].includes(surfaceName)
  }
  return ['mesial', 'distal', 'buccal', 'lingual', 'occlusal'].includes(surfaceName)
}

// Condition validation
export function canHaveMaterial(conditionType: ConditionType): boolean {
  return ['restoration', 'crown'].includes(conditionType)
}

export function requiresSeverity(conditionType: ConditionType): boolean {
  return ['decay', 'fracture', 'wear', 'abrasion', 'erosion'].includes(conditionType)
}
