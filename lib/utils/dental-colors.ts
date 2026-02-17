// Dental Chart Color Management
// Professional color palette for dental conditions and materials

import type { ConditionType, MaterialType } from '@/lib/types/dental-chart-v2'

/**
 * Standard condition colors matching professional dental software
 */
export const CONDITION_COLORS: Record<ConditionType, string> = {
  healthy: '#4CAF50',      // Green - healthy tissue
  decay: '#F44336',        // Red - caries/cavities
  restoration: '#2196F3',  // Blue - existing fillings
  crown: '#9C27B0',        // Purple - crowns
  fracture: '#FF9800',     // Orange - fractures
  wear: '#795548',         // Brown - attrition
  abrasion: '#8D6E63',     // Light brown - abrasion
  erosion: '#FFEB3B',      // Yellow - chemical erosion
  stain: '#9E9E9E'         // Gray - staining
}

/**
 * Material-specific colors for restorations
 */
export const MATERIAL_COLORS: Record<MaterialType, string> = {
  amalgam: '#616161',        // Dark gray - silver filling
  composite: '#90CAF9',      // Light blue - tooth-colored
  ceramic: '#FFFDE7',        // Off-white - porcelain
  gold: '#FFD700',           // Gold
  porcelain: '#FFF8E1',      // Cream - porcelain
  resin: '#81C784',          // Light green - resin
  glass_ionomer: '#B2EBF2'   // Cyan - glass ionomer
}

/**
 * Severity-based color intensity
 */
export const SEVERITY_OPACITY: Record<string, number> = {
  mild: 0.4,
  moderate: 0.7,
  severe: 1.0
}

/**
 * Get color for a specific condition
 */
export function getConditionColor(condition: ConditionType): string {
  return CONDITION_COLORS[condition] || CONDITION_COLORS.healthy
}

/**
 * Get color for a specific material type
 */
export function getMaterialColor(material: MaterialType): string {
  return MATERIAL_COLORS[material] || MATERIAL_COLORS.composite
}

/**
 * Get color with severity-adjusted opacity
 */
export function getColorWithSeverity(
  baseColor: string,
  severity: 'mild' | 'moderate' | 'severe' | null
): string {
  if (!severity) return baseColor
  
  const opacity = SEVERITY_OPACITY[severity]
  
  // Convert hex to rgba
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * SVG pattern definitions for different materials
 * Returns SVG pattern markup for use in tooth rendering
 */
export function getMaterialPattern(material: MaterialType): string {
  const patterns: Record<MaterialType, string> = {
    amalgam: `
      <pattern id="pattern-amalgam" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="${MATERIAL_COLORS.amalgam}"/>
        <path d="M 0,4 L 4,0 M 2,4 L 4,2 M 0,2 L 2,0" 
              stroke="#9E9E9E" stroke-width="0.5" opacity="0.5"/>
      </pattern>
    `,
    composite: `
      <pattern id="pattern-composite" width="2" height="2" patternUnits="userSpaceOnUse">
        <rect width="2" height="2" fill="${MATERIAL_COLORS.composite}"/>
        <circle cx="1" cy="1" r="0.5" fill="#64B5F6" opacity="0.3"/>
      </pattern>
    `,
    ceramic: `
      <pattern id="pattern-ceramic" width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="${MATERIAL_COLORS.ceramic}"/>
        <circle cx="1.5" cy="1.5" r="0.5" fill="#FFF" opacity="0.6"/>
      </pattern>
    `,
    gold: `
      <pattern id="pattern-gold" width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="${MATERIAL_COLORS.gold}"/>
        <path d="M 0,3 L 3,0" stroke="#FFD54F" stroke-width="0.5" opacity="0.7"/>
      </pattern>
    `,
    porcelain: `
      <pattern id="pattern-porcelain" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="4" fill="${MATERIAL_COLORS.porcelain}"/>
        <circle cx="2" cy="2" r="1" fill="#FFF" opacity="0.4"/>
      </pattern>
    `,
    resin: `
      <pattern id="pattern-resin" width="2" height="2" patternUnits="userSpaceOnUse">
        <rect width="2" height="2" fill="${MATERIAL_COLORS.resin}"/>
        <rect x="0.5" y="0.5" width="1" height="1" fill="#66BB6A" opacity="0.3"/>
      </pattern>
    `,
    glass_ionomer: `
      <pattern id="pattern-glass-ionomer" width="3" height="3" patternUnits="userSpaceOnUse">
        <rect width="3" height="3" fill="${MATERIAL_COLORS.glass_ionomer}"/>
        <circle cx="1.5" cy="1.5" r="0.8" fill="#80DEEA" opacity="0.4"/>
      </pattern>
    `
  }
  
  return patterns[material] || patterns.composite
}

/**
 * Get all SVG pattern definitions as a single string
 * Include this in your SVG defs section
 */
export function getAllMaterialPatterns(): string {
  return Object.keys(MATERIAL_COLORS)
    .map(material => getMaterialPattern(material as MaterialType))
    .join('\n')
}

/**
 * Periodontal health colors based on pocket depth
 */
export function getPocketDepthColor(depthMm: number): string {
  if (depthMm < 3) return '#4CAF50'    // Green - healthy
  if (depthMm <= 5) return '#FFC107'   // Amber - moderate
  return '#F44336'                      // Red - severe
}

/**
 * Bleeding on probing indicator color
 */
export const BLEEDING_COLOR = '#E53935' // Red

/**
 * Treatment status colors
 */
export const TREATMENT_STATUS_COLORS = {
  planned: '#FFC107',       // Amber
  in_progress: '#2196F3',   // Blue
  completed: '#4CAF50',     // Green
  cancelled: '#9E9E9E'      // Gray
}

/**
 * Diagnosis severity colors
 */
export const DIAGNOSIS_SEVERITY_COLORS = {
  mild: '#4CAF50',      // Green
  moderate: '#FF9800',  // Orange
  severe: '#F44336'     // Red
}

/**
 * Priority colors for treatment plans
 */
export const PRIORITY_COLORS = {
  urgent: '#F44336',    // Red
  high: '#FF9800',      // Orange
  medium: '#FFC107',    // Amber
  low: '#4CAF50'        // Green
}

/**
 * Generate color legend data for UI display
 */
export function getConditionLegend(): Array<{ condition: ConditionType; color: string; label: string }> {
  return [
    { condition: 'healthy', color: CONDITION_COLORS.healthy, label: 'Healthy' },
    { condition: 'decay', color: CONDITION_COLORS.decay, label: 'Cavity/Decay' },
    { condition: 'restoration', color: CONDITION_COLORS.restoration, label: 'Restoration' },
    { condition: 'crown', color: CONDITION_COLORS.crown, label: 'Crown' },
    { condition: 'fracture', color: CONDITION_COLORS.fracture, label: 'Fracture' },
    { condition: 'wear', color: CONDITION_COLORS.wear, label: 'Wear' },
    { condition: 'abrasion', color: CONDITION_COLORS.abrasion, label: 'Abrasion' },
    { condition: 'erosion', color: CONDITION_COLORS.erosion, label: 'Erosion' },
    { condition: 'stain', color: CONDITION_COLORS.stain, label: 'Stain' }
  ]
}

/**
 * Generate material legend data for UI display
 */
export function getMaterialLegend(): Array<{ material: MaterialType; color: string; label: string }> {
  return [
    { material: 'amalgam', color: MATERIAL_COLORS.amalgam, label: 'Amalgam (Silver)' },
    { material: 'composite', color: MATERIAL_COLORS.composite, label: 'Composite (Resin)' },
    { material: 'ceramic', color: MATERIAL_COLORS.ceramic, label: 'Ceramic' },
    { material: 'gold', color: MATERIAL_COLORS.gold, label: 'Gold' },
    { material: 'porcelain', color: MATERIAL_COLORS.porcelain, label: 'Porcelain' },
    { material: 'resin', color: MATERIAL_COLORS.resin, label: 'Resin' },
    { material: 'glass_ionomer', color: MATERIAL_COLORS.glass_ionomer, label: 'Glass Ionomer' }
  ]
}
