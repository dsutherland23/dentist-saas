// Default Chart Data Templates
// Functions to generate initial chart structures with default healthy values

import type {
  DentalChartV2,
  ChartTooth,
  ToothSurfaceV2,
  NumberingSystem,
  ChartType
} from '@/lib/types/dental-chart-v2'
import {
  getAllFDINumbers,
  getArch,
  getQuadrant,
  getToothType,
  getSurfacesForTooth
} from '@/lib/utils/fdi-numbering'
import { fdiToUniversal } from '@/lib/utils/universal-numbering'
import { CONDITION_COLORS } from '@/lib/utils/dental-colors'

/**
 * Create a complete default chart for a patient
 * Initializes with all 32 teeth and healthy surfaces
 */
export function createDefaultChart(
  patientId: string,
  practiceId: string,
  userId: string
): Partial<DentalChartV2> {
  return {
    patient_id: patientId,
    practice_id: practiceId,
    chart_type: 'adult_permanent',
    numbering_system: 'FDI',
    version: 1,
    status: 'active',
    created_by: userId,
    last_modified_by: userId
  }
}

/**
 * Create default teeth for a chart
 * Generates all 32 adult permanent teeth with both FDI and Universal numbering
 */
export function createDefaultTeeth(chartId: string, userId: string): Partial<ChartTooth>[] {
  const fdiNumbers = getAllFDINumbers()
  
  return fdiNumbers.map(fdi => ({
    chart_id: chartId,
    tooth_number: fdi,
    universal_number: fdiToUniversal(fdi),
    tooth_type_category: 'permanent' as const,
    arch: getArch(fdi),
    quadrant: getQuadrant(fdi),
    tooth_type: getToothType(fdi),
    status: 'present',
    mobility_grade: null,
    furcation_grade: null,
    implant: false,
    version: 1,
    last_modified_by: userId
  }))
}

/**
 * Create default surfaces for a specific tooth
 * Returns 5 surfaces with healthy status
 */
export function createDefaultSurfaces(toothId: string, fdiNumber: string): Partial<ToothSurfaceV2>[] {
  const surfaces = getSurfacesForTooth(fdiNumber)
  
  return surfaces.map(surfaceName => ({
    tooth_id: toothId,
    surface_name: surfaceName,
    condition_type: 'healthy',
    condition_status: 'stable',
    severity: null,
    material_type: null,
    color_code: CONDITION_COLORS.healthy,
    diagnosis_id: null,
    treatment_plan_id: null,
    placed_date: null,
    provider_id: null,
    notes: ''
  }))
}

/**
 * Create a default chart structure matching the spec JSON format
 * This is useful for testing and initial setup
 */
export function createDefaultChartJSON(
  patientId: string,
  practiceId: string,
  userId: string
): any {
  const fdiNumbers = getAllFDINumbers()
  
  return {
    patient_id: patientId,
    practice_id: practiceId,
    chart_type: 'adult_permanent',
    numbering_system: 'FDI',
    version: 1,
    status: 'active',
    created_by: userId,
    last_modified_by: userId,
    teeth: fdiNumbers.map(fdi => ({
      tooth_number: fdi,
      arch: getArch(fdi),
      quadrant: getQuadrant(fdi),
      tooth_type: getToothType(fdi),
      status: 'present',
      mobility_grade: null,
      furcation_grade: null,
      implant: false,
      surfaces: getSurfacesForTooth(fdi).map(surfaceName => ({
        surface_name: surfaceName,
        condition_type: 'healthy',
        condition_status: 'stable',
        severity: null,
        material_type: null,
        color_code: CONDITION_COLORS.healthy,
        diagnosis_id: null,
        treatment_plan_id: null,
        placed_date: null,
        provider_id: null,
        notes: ''
      }))
    })),
    periodontal_records: [],
    diagnoses: [],
    treatment_plans: [],
    attachments: [],
    clinical_notes: []
  }
}

/**
 * Create default probing depths (all 2mm - healthy)
 */
export function createDefaultProbingDepths() {
  return {
    mb: 2,
    b: 2,
    db: 2,
    ml: 2,
    l: 2,
    dl: 2
  }
}

/**
 * Create default gingival margin (all 0mm - at CEJ)
 */
export function createDefaultGingivalMargin() {
  return {
    mb: 0,
    b: 0,
    db: 0,
    ml: 0,
    l: 0,
    dl: 0
  }
}

/**
 * Sample chart data for testing
 * Creates a chart with various conditions for demonstration
 */
export function createSampleChartWithConditions(
  patientId: string,
  practiceId: string,
  userId: string
): any {
  const baseChart = createDefaultChartJSON(patientId, practiceId, userId)
  
  // Add some sample conditions
  // Tooth 16 (Upper right first molar) - occlusal decay
  const tooth16 = baseChart.teeth.find((t: any) => t.tooth_number === '16')
  if (tooth16) {
    const occlusalSurface = tooth16.surfaces.find((s: any) => s.surface_name === 'occlusal')
    if (occlusalSurface) {
      occlusalSurface.condition_type = 'decay'
      occlusalSurface.condition_status = 'new'
      occlusalSurface.severity = 'moderate'
      occlusalSurface.color_code = '#F44336'
    }
  }
  
  // Tooth 21 (Upper left central incisor) - mesial restoration
  const tooth21 = baseChart.teeth.find((t: any) => t.tooth_number === '21')
  if (tooth21) {
    const mesialSurface = tooth21.surfaces.find((s: any) => s.surface_name === 'mesial')
    if (mesialSurface) {
      mesialSurface.condition_type = 'restoration'
      mesialSurface.condition_status = 'stable'
      mesialSurface.material_type = 'composite'
      mesialSurface.color_code = '#2196F3'
      mesialSurface.placed_date = new Date().toISOString()
    }
  }
  
  // Tooth 46 (Lower left first molar) - crown
  const tooth46 = baseChart.teeth.find((t: any) => t.tooth_number === '46')
  if (tooth46) {
    tooth46.surfaces.forEach((surface: any) => {
      surface.condition_type = 'crown'
      surface.condition_status = 'stable'
      surface.material_type = 'porcelain'
      surface.color_code = '#9C27B0'
    })
  }
  
  return baseChart
}

/**
 * Tooth templates by FDI number for specific conditions
 */
export const TOOTH_TEMPLATES = {
  // Wisdom teeth (3rd molars)
  wisdom_teeth: ['18', '28', '38', '48'],
  
  // Front teeth (incisors)
  incisors: ['11', '12', '21', '22', '31', '32', '41', '42'],
  
  // Canines
  canines: ['13', '23', '33', '43'],
  
  // Premolars
  premolars: ['14', '15', '24', '25', '34', '35', '44', '45'],
  
  // Molars
  molars: ['16', '17', '18', '26', '27', '28', '36', '37', '38', '46', '47', '48']
}

/**
 * Common diagnosis codes
 */
export const COMMON_DIAGNOSIS_CODES = {
  dental_caries: 'K02.9',
  chronic_periodontitis: 'K05.3',
  acute_periodontitis: 'K05.2',
  gingivitis: 'K05.1',
  fractured_tooth: 'S02.5',
  tooth_wear: 'K03.0',
  tooth_abrasion: 'K03.1',
  tooth_erosion: 'K03.2'
}

/**
 * Common procedure (CDT) codes
 */
export const COMMON_PROCEDURE_CODES = {
  // Restorations
  amalgam_1_surface: 'D2140',
  amalgam_2_surface: 'D2150',
  amalgam_3_surface: 'D2160',
  composite_1_surface: 'D2330',
  composite_2_surface: 'D2331',
  composite_3_surface: 'D2332',
  
  // Crowns
  porcelain_crown: 'D2740',
  gold_crown: 'D2790',
  ceramic_crown: 'D2740',
  
  // Endodontics
  root_canal_anterior: 'D3310',
  root_canal_premolar: 'D3320',
  root_canal_molar: 'D3330',
  
  // Extractions
  simple_extraction: 'D7140',
  surgical_extraction: 'D7210',
  
  // Periodontal
  scaling_root_planing_quad: 'D4341',
  perio_maintenance: 'D4910'
}
