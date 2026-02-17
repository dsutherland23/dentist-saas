/**
 * Universal (National) Tooth Numbering System Utilities
 * Provides bidirectional conversion between FDI and Universal numbering systems
 */

import type { UniversalNumber } from '@/lib/types/dental-chart-v2'

/**
 * Convert FDI notation to Universal notation for permanent teeth
 * FDI: 11-48 (quadrant + position)
 * Universal: 1-32 (sequential)
 * 
 * @param fdi FDI tooth number (e.g., "11", "21", "48")
 * @returns Universal tooth number (e.g., "8", "9", "32")
 */
export function fdiToUniversal(fdi: string): UniversalNumber {
  const quadrant = parseInt(fdi[0])
  const position = parseInt(fdi[1])
  
  if (isNaN(quadrant) || isNaN(position)) {
    return fdi // Return original if invalid
  }
  
  // FDI to Universal mapping
  // Quadrant 1 (upper right 11-18): Universal 8-1
  // Quadrant 2 (upper left 21-28): Universal 9-16
  // Quadrant 3 (lower left 31-38): Universal 17-24
  // Quadrant 4 (lower right 41-48): Universal 25-32
  
  let universalNum: number
  
  switch (quadrant) {
    case 1: // Upper right
      universalNum = 9 - position
      break
    case 2: // Upper left
      universalNum = 8 + position
      break
    case 3: // Lower left
      universalNum = 16 + position
      break
    case 4: // Lower right
      universalNum = 33 - position
      break
    default:
      return fdi
  }
  
  return universalNum.toString()
}

/**
 * Convert Universal notation to FDI notation for permanent teeth
 * 
 * @param universal Universal tooth number (1-32)
 * @returns FDI tooth number (e.g., "11", "21", "48")
 */
export function universalToFdi(universal: string): string {
  const universalNum = parseInt(universal)
  
  if (isNaN(universalNum) || universalNum < 1 || universalNum > 32) {
    return universal // Return original if invalid
  }
  
  // Universal to FDI mapping
  let fdi: string
  
  if (universalNum >= 1 && universalNum <= 8) {
    // Upper right quadrant
    const position = 9 - universalNum
    fdi = `1${position}`
  } else if (universalNum >= 9 && universalNum <= 16) {
    // Upper left quadrant
    const position = universalNum - 8
    fdi = `2${position}`
  } else if (universalNum >= 17 && universalNum <= 24) {
    // Lower left quadrant
    const position = universalNum - 16
    fdi = `3${position}`
  } else {
    // Lower right quadrant (25-32)
    const position = 33 - universalNum
    fdi = `4${position}`
  }
  
  return fdi
}

/**
 * Get Universal notation for primary (baby) teeth
 * Universal primary: A-J (upper right to left), K-T (lower left to right)
 * 
 * @param position Position in quadrant (1-5 for primary teeth)
 * @param quadrant FDI quadrant (5-8 for primary)
 * @returns Universal letter (A-T)
 */
export function getPrimaryUniversal(position: number, quadrant: number): UniversalNumber {
  // FDI Primary quadrants: 5=UR, 6=UL, 7=LL, 8=LR
  // Universal Primary: A-J (upper), K-T (lower)
  
  const letterMap: Record<number, string[]> = {
    5: ['E', 'D', 'C', 'B', 'A'], // Upper right (51-55 -> E-A)
    6: ['F', 'G', 'H', 'I', 'J'], // Upper left (61-65 -> F-J)
    7: ['K', 'L', 'M', 'N', 'O'], // Lower left (71-75 -> K-O)
    8: ['T', 'S', 'R', 'Q', 'P']  // Lower right (81-85 -> T-P)
  }
  
  const letters = letterMap[quadrant]
  if (!letters || position < 1 || position > 5) {
    return '' // Invalid
  }
  
  return letters[position - 1]
}

/**
 * Convert primary FDI to Universal letter
 * 
 * @param fdi FDI primary tooth number (51-85)
 * @returns Universal letter (A-T)
 */
export function primaryFdiToUniversal(fdi: string): UniversalNumber {
  const quadrant = parseInt(fdi[0])
  const position = parseInt(fdi[1])
  
  if (isNaN(quadrant) || isNaN(position) || quadrant < 5 || quadrant > 8) {
    return fdi // Return original if invalid
  }
  
  return getPrimaryUniversal(position, quadrant)
}

/**
 * Convert Universal primary letter to FDI notation
 * 
 * @param letter Universal letter (A-T)
 * @returns FDI primary tooth number (51-85)
 */
export function universalPrimaryToFdi(letter: string): string {
  const upperLetter = letter.toUpperCase()
  
  // Map letters to FDI
  const letterToFdi: Record<string, string> = {
    'A': '55', 'B': '54', 'C': '53', 'D': '52', 'E': '51',
    'F': '61', 'G': '62', 'H': '63', 'I': '64', 'J': '65',
    'K': '71', 'L': '72', 'M': '73', 'N': '74', 'O': '75',
    'P': '85', 'Q': '84', 'R': '83', 'S': '82', 'T': '81'
  }
  
  return letterToFdi[upperLetter] || letter
}

/**
 * Check if a tooth number is valid Universal notation
 * 
 * @param toothNumber Tooth number to validate
 * @returns true if valid Universal notation
 */
export function isValidUniversal(toothNumber: string): boolean {
  // Check if it's a number 1-32
  const num = parseInt(toothNumber)
  if (!isNaN(num) && num >= 1 && num <= 32) {
    return true
  }
  
  // Check if it's a letter A-T
  const upperLetter = toothNumber.toUpperCase()
  return upperLetter.length === 1 && upperLetter >= 'A' && upperLetter <= 'T'
}

/**
 * Get all Universal permanent tooth numbers in order
 * 
 * @returns Array of Universal numbers 1-32
 */
export function getAllUniversalNumbers(): UniversalNumber[] {
  return Array.from({ length: 32 }, (_, i) => (i + 1).toString())
}

/**
 * Get all Universal primary tooth letters in order
 * 
 * @returns Array of Universal letters A-T
 */
export function getAllPrimaryUniversalLetters(): UniversalNumber[] {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
          'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
}

/**
 * Get tooth display name for Universal system
 * 
 * @param universal Universal tooth number/letter
 * @returns Display name (e.g., "Tooth #8", "Tooth A")
 */
export function getUniversalDisplayName(universal: UniversalNumber): string {
  const num = parseInt(universal)
  if (!isNaN(num)) {
    return `Tooth #${universal}`
  }
  return `Tooth ${universal}`
}
