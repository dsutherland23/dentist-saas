// FDI Tooth Numbering System Utilities
// FDI (Fédération Dentaire Internationale) uses two-digit notation
// Format: [quadrant][position] where quadrant 1-4, position 1-8

import type { ToothType, ToothArch, SurfaceName } from '@/lib/types/dental-chart-v2'

/**
 * Convert FDI number to Universal number (1-32)
 * FDI: 11-18 (UR), 21-28 (UL), 31-38 (LL), 41-48 (LR)
 * Universal: 1-16 (upper R-L), 17-32 (lower L-R)
 */
export function fdiToUniversal(fdi: string): number {
  const quadrant = parseInt(fdi[0])
  const position = parseInt(fdi[1])
  
  switch (quadrant) {
    case 1: // Upper right: FDI 11-18 → Universal 1-8
      return position
    case 2: // Upper left: FDI 21-28 → Universal 9-16
      return 8 + position
    case 3: // Lower left: FDI 31-38 → Universal 17-24
      return 16 + position
    case 4: // Lower right: FDI 41-48 → Universal 25-32
      return 24 + position
    default:
      throw new Error(`Invalid FDI quadrant: ${quadrant}`)
  }
}

/**
 * Convert Universal number (1-32) to FDI notation
 */
export function universalToFDI(universal: number): string {
  if (universal < 1 || universal > 32) {
    throw new Error(`Invalid universal number: ${universal}`)
  }
  
  if (universal <= 8) {
    // Upper right: Universal 1-8 → FDI 11-18
    return `1${universal}`
  } else if (universal <= 16) {
    // Upper left: Universal 9-16 → FDI 21-28
    return `2${universal - 8}`
  } else if (universal <= 24) {
    // Lower left: Universal 17-24 → FDI 31-38
    return `3${universal - 16}`
  } else {
    // Lower right: Universal 25-32 → FDI 41-48
    return `4${universal - 24}`
  }
}

/**
 * Get tooth type based on FDI position number
 * Position 1-2: Incisors
 * Position 3: Canine
 * Position 4-5: Premolars
 * Position 6-8: Molars
 */
export function getToothType(fdi: string): ToothType {
  const position = parseInt(fdi[1])
  
  if (position <= 2) return 'incisor'
  if (position === 3) return 'canine'
  if (position <= 5) return 'premolar'
  return 'molar'
}

/**
 * Get quadrant from FDI number (1-4)
 * 1: Upper right
 * 2: Upper left
 * 3: Lower left
 * 4: Lower right
 */
export function getQuadrant(fdi: string): number {
  return parseInt(fdi[0])
}

/**
 * Get arch from FDI number
 */
export function getArch(fdi: string): ToothArch {
  const quadrant = parseInt(fdi[0])
  return quadrant <= 2 ? 'upper' : 'lower'
}

/**
 * Get appropriate surfaces for a tooth based on its type
 * Incisors and canines have "incisal" instead of "occlusal"
 */
export function getSurfacesForTooth(fdi: string): SurfaceName[] {
  const toothType = getToothType(fdi)
  
  if (toothType === 'incisor' || toothType === 'canine') {
    return ['mesial', 'distal', 'buccal', 'lingual', 'incisal']
  }
  
  return ['mesial', 'distal', 'buccal', 'lingual', 'occlusal']
}

/**
 * Generate all FDI tooth numbers for adult permanent dentition (32 teeth)
 * Returns in visual order: Upper R-L, Lower L-R
 */
export function getAllFDINumbers(): string[] {
  return [
    // Upper arch: Right to Left
    '18', '17', '16', '15', '14', '13', '12', '11', // Upper right (quadrant 1)
    '21', '22', '23', '24', '25', '26', '27', '28', // Upper left (quadrant 2)
    // Lower arch: Left to Right (reversed visually)
    '48', '47', '46', '45', '44', '43', '42', '41', // Lower right (quadrant 4)
    '31', '32', '33', '34', '35', '36', '37', '38'  // Lower left (quadrant 3)
  ]
}

/**
 * Validate FDI tooth number
 */
export function isValidFDI(fdi: string): boolean {
  if (!/^[1-4][1-8]$/.test(fdi)) return false
  
  const quadrant = parseInt(fdi[0])
  const position = parseInt(fdi[1])
  
  return quadrant >= 1 && quadrant <= 4 && position >= 1 && position <= 8
}

/**
 * Get tooth display name (e.g., "Upper Right Central Incisor")
 */
export function getToothDisplayName(fdi: string): string {
  const quadrant = getQuadrant(fdi)
  const position = parseInt(fdi[1])
  const arch = getArch(fdi)
  const side = quadrant === 1 || quadrant === 4 ? 'Right' : 'Left'
  const toothType = getToothType(fdi)
  
  const positionNames: Record<number, string> = {
    1: toothType === 'incisor' ? 'Central Incisor' : 'First',
    2: toothType === 'incisor' ? 'Lateral Incisor' : 'Second',
    3: 'Canine',
    4: 'First Premolar',
    5: 'Second Premolar',
    6: 'First Molar',
    7: 'Second Molar',
    8: 'Third Molar (Wisdom Tooth)'
  }
  
  const archName = arch === 'upper' ? 'Upper' : 'Lower'
  const positionName = positionNames[position] || `Position ${position}`
  
  return `${archName} ${side} ${positionName}`
}

/**
 * Convert FDI to Palmer notation
 * Palmer uses quadrant symbols: ⏌⏋⏊⏉ with numbers 1-8
 */
export function fdiToPalmer(fdi: string): string {
  const quadrant = getQuadrant(fdi)
  const position = fdi[1]
  
  const palmerSymbols = {
    1: '⏌', // Upper right
    2: '⏋', // Upper left
    3: '⏊', // Lower left
    4: '⏉'  // Lower right
  }
  
  return `${palmerSymbols[quadrant as keyof typeof palmerSymbols]}${position}`
}

/**
 * Get FDI numbers for a specific quadrant
 */
export function getFDIForQuadrant(quadrant: number): string[] {
  if (quadrant < 1 || quadrant > 4) {
    throw new Error(`Invalid quadrant: ${quadrant}`)
  }
  
  return Array.from({ length: 8 }, (_, i) => `${quadrant}${i + 1}`)
}

/**
 * Get neighboring teeth (mesial and distal)
 */
export function getNeighboringTeeth(fdi: string): { mesial: string | null; distal: string | null } {
  const quadrant = getQuadrant(fdi)
  const position = parseInt(fdi[1])
  
  let mesial: string | null = null
  let distal: string | null = null
  
  // Mesial is toward midline, distal is away from midline
  if (quadrant === 1 || quadrant === 4) {
    // Right side: mesial is higher number, distal is lower
    mesial = position < 8 ? `${quadrant}${position + 1}` : null
    distal = position > 1 ? `${quadrant}${position - 1}` : null
  } else {
    // Left side: mesial is lower number, distal is higher
    mesial = position > 1 ? `${quadrant}${position - 1}` : null
    distal = position < 8 ? `${quadrant}${position + 1}` : null
  }
  
  return { mesial, distal }
}
