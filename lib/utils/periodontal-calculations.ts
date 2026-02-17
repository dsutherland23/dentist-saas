// Periodontal Health Calculations
// Clinical calculations for gum health assessment

import type { ProbingDepths, GingivalMargin } from '@/lib/types/dental-chart-v2'

/**
 * Calculate attachment loss
 * Attachment Loss = Probing Depth + Gingival Recession
 * (If gingival margin is below CEJ, it's negative recession)
 */
export function calculateAttachmentLoss(probingDepth: number, gingivalMargin: number): number {
  return probingDepth + Math.abs(gingivalMargin)
}

/**
 * Calculate average probing depth for a tooth (all 6 sites)
 */
export function calculatePocketDepthAverage(depths: ProbingDepths): number {
  const values = [depths.mb, depths.b, depths.db, depths.ml, depths.l, depths.dl]
  const sum = values.reduce((acc, val) => acc + val, 0)
  return Math.round((sum / values.length) * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate maximum probing depth for a tooth
 */
export function getMaxProbingDepth(depths: ProbingDepths): number {
  return Math.max(depths.mb, depths.b, depths.db, depths.ml, depths.l, depths.dl)
}

/**
 * Calculate minimum probing depth for a tooth
 */
export function getMinProbingDepth(depths: ProbingDepths): number {
  return Math.min(depths.mb, depths.b, depths.db, depths.ml, depths.l, depths.dl)
}

/**
 * Get health status based on probing depth
 */
export function getPocketHealthStatus(depth: number): 'healthy' | 'moderate' | 'severe' {
  if (depth < 3) return 'healthy'    // 1-2mm: Healthy
  if (depth <= 5) return 'moderate'  // 3-5mm: Gingivitis / Early periodontitis
  return 'severe'                     // 6+mm: Moderate to advanced periodontitis
}

/**
 * Get overall periodontal health status for a tooth
 */
export function getToothPeriodontalStatus(depths: ProbingDepths): 'healthy' | 'moderate' | 'severe' {
  const maxDepth = getMaxProbingDepth(depths)
  return getPocketHealthStatus(maxDepth)
}

/**
 * Calculate bleeding percentage from bleeding points
 * Total possible sites per tooth: 6 (MB, B, DB, ML, L, DL)
 */
export function getBleedingPercentage(bleedingPoints: string[]): number {
  const totalSites = 6
  const bleedingSites = bleedingPoints.length
  return Math.round((bleedingSites / totalSites) * 100)
}

/**
 * Determine if bleeding is significant
 */
export function hasSignificantBleeding(bleedingPoints: string[]): boolean {
  // More than 30% bleeding is considered significant
  return getBleedingPercentage(bleedingPoints) > 30
}

/**
 * Calculate average gingival margin position
 */
export function calculateGingivalMarginAverage(margin: GingivalMargin): number {
  const values = [margin.mb, margin.b, margin.db, margin.ml, margin.l, margin.dl]
  const sum = values.reduce((acc, val) => acc + val, 0)
  return Math.round((sum / values.length) * 10) / 10
}

/**
 * Calculate recession severity
 * Positive values indicate recession (gum loss)
 * Negative values indicate gingival overgrowth/hyperplasia
 */
export function getRecessionSeverity(recessionMm: number): 'none' | 'mild' | 'moderate' | 'severe' {
  if (recessionMm <= 0) return 'none'
  if (recessionMm <= 2) return 'mild'      // 1-2mm
  if (recessionMm <= 3) return 'moderate'  // 3mm
  return 'severe'                          // 4+mm
}

/**
 * Calculate CAL (Clinical Attachment Loss) for each site
 * Returns object with CAL values for all 6 sites
 */
export function calculateCALForAllSites(
  depths: ProbingDepths,
  margins: GingivalMargin
): Record<keyof ProbingDepths, number> {
  return {
    mb: calculateAttachmentLoss(depths.mb, margins.mb),
    b: calculateAttachmentLoss(depths.b, margins.b),
    db: calculateAttachmentLoss(depths.db, margins.db),
    ml: calculateAttachmentLoss(depths.ml, margins.ml),
    l: calculateAttachmentLoss(depths.l, margins.l),
    dl: calculateAttachmentLoss(depths.dl, margins.dl)
  }
}

/**
 * Get periodontal diagnosis recommendation based on measurements
 */
export function getPeriodontalDiagnosis(
  maxDepth: number,
  bleedingPercentage: number,
  attachmentLoss: number
): string {
  if (maxDepth <= 3 && bleedingPercentage < 10 && attachmentLoss <= 1) {
    return 'Healthy periodontium'
  }
  
  if (maxDepth <= 3 && bleedingPercentage >= 10) {
    return 'Gingivitis'
  }
  
  if (maxDepth <= 4 && attachmentLoss <= 2) {
    return 'Slight chronic periodontitis'
  }
  
  if (maxDepth <= 6 && attachmentLoss <= 4) {
    return 'Moderate chronic periodontitis'
  }
  
  return 'Severe chronic periodontitis'
}

/**
 * Validate probing depth value
 * Typical range: 0-12mm (depths over 12mm are rare and may indicate measurement error)
 */
export function isValidProbingDepth(depth: number): boolean {
  return depth >= 0 && depth <= 12 && Number.isFinite(depth)
}

/**
 * Validate all probing depths in a measurement
 */
export function validateProbingDepths(depths: ProbingDepths): boolean {
  return (
    isValidProbingDepth(depths.mb) &&
    isValidProbingDepth(depths.b) &&
    isValidProbingDepth(depths.db) &&
    isValidProbingDepth(depths.ml) &&
    isValidProbingDepth(depths.l) &&
    isValidProbingDepth(depths.dl)
  )
}

/**
 * Calculate PSR (Periodontal Screening and Recording) score for a sextant
 * PSR Codes:
 * 0: Colored area of probe visible, no calculus, no defective margins, no bleeding
 * 1: Colored area visible, no calculus, no defective margins, bleeding on probing
 * 2: Colored area visible, supragingival or subgingival calculus or defective margins
 * 3: Colored area partly visible (probing depth 3.5-5.5mm)
 * 4: Colored area completely hidden (probing depth >5.5mm)
 */
export function calculatePSRScore(
  maxDepth: number,
  hasCalculus: boolean,
  hasBleeding: boolean
): number {
  if (maxDepth > 5.5) return 4
  if (maxDepth >= 3.5) return 3
  if (hasCalculus) return 2
  if (hasBleeding) return 1
  return 0
}

/**
 * Determine treatment urgency based on periodontal status
 */
export function getTreatmentUrgency(
  maxDepth: number,
  bleedingPercentage: number,
  attachmentLoss: number
): 'routine' | 'moderate' | 'urgent' {
  if (maxDepth >= 7 || attachmentLoss >= 5) {
    return 'urgent' // Severe periodontitis requires immediate attention
  }
  
  if (maxDepth >= 5 || bleedingPercentage > 50 || attachmentLoss >= 3) {
    return 'moderate' // Moderate periodontitis needs timely treatment
  }
  
  return 'routine' // Healthy or mild gingivitis
}

/**
 * Format probing depth for display (rounds to nearest 0.5mm)
 */
export function formatProbingDepth(depth: number): string {
  const rounded = Math.round(depth * 2) / 2
  return `${rounded}mm`
}

/**
 * Get color indicator for probing depth (for UI)
 */
export function getProbingDepthColor(depth: number): string {
  if (depth < 3) return '#4CAF50'    // Green
  if (depth <= 5) return '#FFC107'   // Amber
  return '#F44336'                   // Red
}
