// Dental Chart Types
// Mirrors the EnterpriseDentalChart JSON schema

export type NumberingSystem = "universal" | "FDI" | "palmer"
export type ChartType = "adult_permanent" | "mixed_dentition" | "primary"

export type ToothStatus =
  | "healthy"
  | "treated"
  | "problem"
  | "planned"
  | "missing"
  | "extracted"
  | "impacted"
  | "implant"

export type SurfaceCode = "M" | "D" | "O" | "I" | "B" | "L" | "F"

export type SurfaceStatus =
  | "healthy"
  | "decay"
  | "filled"
  | "crown"
  | "fracture"
  | "planned"
  | "missing"

export type DiagnosisSeverity = "mild" | "moderate" | "severe"

export type MobilityGrade = "0" | "1" | "2" | "3"

export type FurcationClass = "none" | "class_I" | "class_II" | "class_III"

export type FileType = "xray" | "intraoral" | "3d_scan" | "cbct" | "photo"

export type ImageType = "xray" | "panoramic" | "bitewing" | "intraoral" | "3d_scan" | "cbct"

export interface TreatmentHistoryItem {
  procedure_code: string
  procedure_id?: string
  performed_by?: string
  performed_at?: string
}

export interface ToothSurface {
  surface_code: SurfaceCode
  status: SurfaceStatus
  treatment_history?: TreatmentHistoryItem[]
}

export interface ToothDiagnosis {
  diagnosis_id?: string
  diagnosis_code: string
  description: string
  severity: DiagnosisSeverity
  created_by?: string
  created_at?: string
}

export interface ToothPeriodontal {
  probing_depth_mm?: number[]
  bleeding_on_probing?: boolean
  mobility_grade?: MobilityGrade
  furcation?: FurcationClass
}

export interface ToothAttachment {
  file_id: string
  file_type: FileType
  url: string
  uploaded_by?: string
  uploaded_at?: string
}

export interface Tooth {
  tooth_number: string
  arch?: "upper" | "lower"
  quadrant?: number
  status: ToothStatus
  notes?: string
  diagnoses?: ToothDiagnosis[]
  surfaces: ToothSurface[]
  periodontal?: ToothPeriodontal
  attachments?: ToothAttachment[]
}

export interface MedicalImage {
  image_id: string
  image_type: ImageType
  related_tooth_numbers?: string[]
  url: string
  captured_at?: string
  uploaded_by?: string
}

export interface AuditLogEntry {
  action: string
  entity_type?: string
  entity_id?: string
  previous_value?: any
  new_value?: any
  performed_by: string
  performed_at: string
}

export interface DentalChart {
  chart_id: string
  patient_id: string
  clinic_id: string
  numbering_system: NumberingSystem
  chart_type?: ChartType
  version: number
  is_locked?: boolean
  locked_by?: string | null
  locked_at?: string | null
  teeth: Tooth[]
  medical_images?: MedicalImage[]
  audit_log?: AuditLogEntry[]
  created_at: string
  updated_at: string
}

// Helper: Initialize a default tooth
export function createDefaultTooth(toothNumber: string, arch: "upper" | "lower", quadrant: number): Tooth {
  return {
    tooth_number: toothNumber,
    arch,
    quadrant,
    status: "healthy",
    surfaces: [
      { surface_code: "M", status: "healthy" },
      { surface_code: "D", status: "healthy" },
      { surface_code: "O", status: "healthy" },
      { surface_code: "I", status: "healthy" },
      { surface_code: "B", status: "healthy" },
      { surface_code: "L", status: "healthy" },
    ],
    diagnoses: [],
    attachments: [],
  }
}

// Helper: Initialize 32 adult permanent teeth (Universal numbering 1-32)
export function createDefaultTeeth(): Tooth[] {
  const teeth: Tooth[] = []
  
  // Upper right (quadrant 1): teeth 1-8
  for (let i = 1; i <= 8; i++) {
    teeth.push(createDefaultTooth(String(i), "upper", 1))
  }
  
  // Upper left (quadrant 2): teeth 9-16
  for (let i = 9; i <= 16; i++) {
    teeth.push(createDefaultTooth(String(i), "upper", 2))
  }
  
  // Lower left (quadrant 3): teeth 17-24
  for (let i = 17; i <= 24; i++) {
    teeth.push(createDefaultTooth(String(i), "lower", 3))
  }
  
  // Lower right (quadrant 4): teeth 25-32
  for (let i = 25; i <= 32; i++) {
    teeth.push(createDefaultTooth(String(i), "lower", 4))
  }
  
  return teeth
}

// Helper: Convert Universal (1-32) to FDI notation
export function universalToFDI(universal: number): string {
  if (universal >= 1 && universal <= 8) return `1${9 - universal}`
  if (universal >= 9 && universal <= 16) return `2${universal - 8}`
  if (universal >= 17 && universal <= 24) return `3${universal - 16}`
  if (universal >= 25 && universal <= 32) return `4${33 - universal}`
  return String(universal)
}

// Helper: Convert Universal (1-32) to Palmer notation
export function universalToPalmer(universal: number): string {
  if (universal >= 1 && universal <= 8) return `${9 - universal}⎤`
  if (universal >= 9 && universal <= 16) return `⎡${universal - 8}`
  if (universal >= 17 && universal <= 24) return `⎣${universal - 16}`
  if (universal >= 25 && universal <= 32) return `${33 - universal}⎦`
  return String(universal)
}
