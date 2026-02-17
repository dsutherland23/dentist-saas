/**
 * Anatomically accurate SVG tooth shapes for dental charting
 * Each tooth type has realistic occlusal (top-down) view with surface divisions
 */

import { ToothSurface } from '@/lib/types/dental-chart'

export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar'
export type SurfaceName = 'mesial' | 'distal' | 'occlusal' | 'buccal' | 'lingual'

interface ToothShapeProps {
  type: ToothType
  surfaces: ToothSurface[]
  isSelected: boolean
  onSurfaceClick?: (surface: SurfaceName) => void
  onToothClick?: () => void
  baseColor?: string
}

// Map surface names to surface codes
const surfaceNameToCode: Record<SurfaceName, string> = {
  mesial: 'M',
  distal: 'D',
  occlusal: 'O',
  buccal: 'B',
  lingual: 'L'
}

// Helper to get surface color based on status
function getSurfaceColor(surfaces: ToothSurface[], surfaceName: SurfaceName, baseColor: string): string {
  const surfaceCode = surfaceNameToCode[surfaceName]
  const surface = surfaces.find(s => s.surface_code === surfaceCode)
  if (!surface || surface.status === 'healthy') return baseColor
  
  const statusColors: Record<string, string> = {
    decay: '#ef4444',
    filled: '#3b82f6',
    crown: '#8b5cf6',
    fracture: '#f97316',
    planned: '#eab308',
    missing: '#e5e7eb'
  }
  
  return statusColors[surface.status] || baseColor
}

/**
 * Incisor - Narrow, chisel-shaped front tooth
 */
export function IncisiorShape({ surfaces, isSelected, onSurfaceClick, onToothClick, baseColor = '#f5f1e8' }: ToothShapeProps) {
  const mesialColor = getSurfaceColor(surfaces, 'mesial', baseColor)
  const distalColor = getSurfaceColor(surfaces, 'distal', baseColor)
  const occlusalColor = getSurfaceColor(surfaces, 'occlusal', baseColor)
  const buccalColor = getSurfaceColor(surfaces, 'buccal', baseColor)
  const lingualColor = getSurfaceColor(surfaces, 'lingual', baseColor)

  return (
    <g className="tooth-incisor" onClick={onToothClick}>
      {/* Crown outline */}
      <path
        d="M 15 5 Q 20 2 25 5 L 28 25 Q 25 30 20 30 Q 15 30 12 25 Z"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
        className="tooth-outline"
      />
      
      {/* Mesial surface (left side) */}
      <path
        d="M 15 5 Q 20 2 20 15 L 15 25 L 12 25 Z"
        fill={mesialColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('mesial'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal surface (right side) */}
      <path
        d="M 25 5 Q 20 2 20 15 L 25 25 L 28 25 Z"
        fill={distalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('distal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Occlusal surface (cutting edge - top) */}
      <path
        d="M 20 2 Q 15 5 12 12 L 28 12 Q 25 5 20 2 Z"
        fill={occlusalColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('occlusal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Root indication (subtle shadow) */}
      <ellipse cx="20" cy="32" rx="6" ry="3" fill="#d1d5db" opacity="0.4" />
      
      {/* Surface division lines */}
      <line x1="20" y1="2" x2="20" y2="30" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />
    </g>
  )
}

/**
 * Canine - Pointed, triangular tooth
 */
export function CanineShape({ surfaces, isSelected, onSurfaceClick, onToothClick, baseColor = '#f5f1e8' }: ToothShapeProps) {
  const mesialColor = getSurfaceColor(surfaces, 'mesial', baseColor)
  const distalColor = getSurfaceColor(surfaces, 'distal', baseColor)
  const occlusalColor = getSurfaceColor(surfaces, 'occlusal', baseColor)

  return (
    <g className="tooth-canine" onClick={onToothClick}>
      {/* Crown outline - pointed */}
      <path
        d="M 20 3 L 28 12 L 28 28 Q 24 32 20 32 Q 16 32 12 28 L 12 12 Z"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
        className="tooth-outline"
      />
      
      {/* Mesial surface */}
      <path
        d="M 20 3 L 12 12 L 12 28 Q 16 32 20 28 Z"
        fill={mesialColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('mesial'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal surface */}
      <path
        d="M 20 3 L 28 12 L 28 28 Q 24 32 20 28 Z"
        fill={distalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('distal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Occlusal surface (pointed tip) */}
      <path
        d="M 20 3 L 12 12 L 28 12 Z"
        fill={occlusalColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('occlusal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Root shadow */}
      <ellipse cx="20" cy="34" rx="7" ry="3" fill="#d1d5db" opacity="0.4" />
      
      {/* Central ridge line */}
      <line x1="20" y1="3" x2="20" y2="32" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />
    </g>
  )
}

/**
 * Premolar - Two cusps with central groove
 */
export function PremolarShape({ surfaces, isSelected, onSurfaceClick, onToothClick, baseColor = '#f5f1e8' }: ToothShapeProps) {
  const mesialColor = getSurfaceColor(surfaces, 'mesial', baseColor)
  const distalColor = getSurfaceColor(surfaces, 'distal', baseColor)
  const occlusalColor = getSurfaceColor(surfaces, 'occlusal', baseColor)
  const buccalColor = getSurfaceColor(surfaces, 'buccal', baseColor)
  const lingualColor = getSurfaceColor(surfaces, 'lingual', baseColor)

  return (
    <g className="tooth-premolar" onClick={onToothClick}>
      {/* Crown outline - oval with two cusps */}
      <path
        d="M 12 8 Q 10 12 10 20 Q 10 28 15 32 Q 20 34 25 32 Q 30 28 30 20 Q 30 12 28 8 Q 25 5 20 6 Q 15 5 12 8 Z"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
        className="tooth-outline"
      />
      
      {/* Buccal cusp (outer/cheek side - top half) */}
      <path
        d="M 12 8 Q 10 12 10 20 L 20 20 L 20 6 Q 15 5 12 8 Z"
        fill={buccalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('buccal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Lingual cusp (inner/tongue side - top half) */}
      <path
        d="M 28 8 Q 30 12 30 20 L 20 20 L 20 6 Q 25 5 28 8 Z"
        fill={lingualColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('lingual'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Mesial surface */}
      <path
        d="M 12 8 L 10 20 Q 10 28 15 32 L 20 28 L 20 6 Z"
        fill={mesialColor}
        opacity={0.88}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('mesial'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal surface */}
      <path
        d="M 28 8 L 30 20 Q 30 28 25 32 L 20 28 L 20 6 Z"
        fill={distalColor}
        opacity={0.88}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('distal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Occlusal surface (central groove area) */}
      <ellipse
        cx="20" cy="17" rx="8" ry="5"
        fill={occlusalColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('occlusal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Central groove */}
      <line x1="15" y1="17" x2="25" y2="17" stroke="#94a3b8" strokeWidth="1" opacity="0.4" />
      
      {/* Root shadow */}
      <ellipse cx="20" cy="35" rx="8" ry="3" fill="#d1d5db" opacity="0.4" />
    </g>
  )
}

/**
 * Molar - Large grinding tooth with 3-4 cusps
 */
export function MolarShape({ surfaces, isSelected, onSurfaceClick, onToothClick, baseColor = '#f5f1e8' }: ToothShapeProps) {
  const mesialColor = getSurfaceColor(surfaces, 'mesial', baseColor)
  const distalColor = getSurfaceColor(surfaces, 'distal', baseColor)
  const occlusalColor = getSurfaceColor(surfaces, 'occlusal', baseColor)
  const buccalColor = getSurfaceColor(surfaces, 'buccal', baseColor)
  const lingualColor = getSurfaceColor(surfaces, 'lingual', baseColor)

  return (
    <g className="tooth-molar" onClick={onToothClick}>
      {/* Crown outline - rectangular with rounded corners */}
      <rect
        x="8" y="6" width="34" height="30" rx="4"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
        className="tooth-outline"
      />
      
      {/* Mesial-Buccal cusp (front-outer) */}
      <path
        d="M 8 6 L 8 20 L 20 20 L 20 6 Q 14 8 8 6 Z"
        fill={buccalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('buccal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal-Buccal cusp (back-outer) */}
      <path
        d="M 30 6 L 30 20 L 20 20 L 20 6 Q 25 8 30 6 Z"
        fill={buccalColor}
        opacity={0.88}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('buccal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Mesial-Lingual cusp (front-inner) */}
      <path
        d="M 8 26 L 8 36 Q 14 34 20 36 L 20 20 L 8 20 Z"
        fill={lingualColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('lingual'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal-Lingual cusp (back-inner) */}
      <path
        d="M 30 26 L 30 36 Q 25 34 20 36 L 20 20 L 30 20 Z"
        fill={lingualColor}
        opacity={0.88}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('lingual'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Mesial surface (left edge) */}
      <path
        d="M 8 6 L 8 36 L 11 36 L 11 6 Z"
        fill={mesialColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('mesial'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal surface (right edge) */}
      <path
        d="M 37 6 L 37 36 L 40 36 L 40 6 Z"
        fill={distalColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('distal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Occlusal surface (central fossa) */}
      <ellipse
        cx="25" cy="21" rx="10" ry="8"
        fill={occlusalColor}
        opacity={0.82}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('occlusal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Fissure pattern (realistic grooves) */}
      <path
        d="M 15 21 Q 20 18 25 21 Q 30 24 35 21"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
        opacity="0.4"
      />
      <path
        d="M 25 10 Q 23 15 25 21 Q 27 27 25 32"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
        opacity="0.4"
      />
      
      {/* Root shadows (molars have multiple roots) */}
      <ellipse cx="15" cy="38" rx="5" ry="2.5" fill="#d1d5db" opacity="0.4" />
      <ellipse cx="30" cy="38" rx="5" ry="2.5" fill="#d1d5db" opacity="0.4" />
    </g>
  )
}

/**
 * Get appropriate tooth shape component based on tooth number
 */
export function getToothType(toothNumber: number): ToothType {
  const num = toothNumber % 100 // Handle FDI notation
  const position = num > 16 ? num - 16 : num
  
  // Incisors: positions 1-2 (central and lateral)
  if (position <= 2) return 'incisor'
  
  // Canines: position 3
  if (position === 3) return 'canine'
  
  // Premolars: positions 4-5
  if (position <= 5) return 'premolar'
  
  // Molars: positions 6-8
  return 'molar'
}
