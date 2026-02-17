/**
 * Anatomically accurate SVG tooth shapes for V2 dental charting
 * Supports FDI numbering and new surface condition schema
 */

import type { ToothSurfaceV2, SurfaceName } from '@/lib/types/dental-chart-v2'
import { getConditionColor } from '@/lib/utils/dental-colors'

interface ToothShapeProps {
  surfaces: ToothSurfaceV2[]
  isSelected: boolean
  onSurfaceClick?: (surfaceName: SurfaceName) => void
  onToothClick?: () => void
}

/**
 * Helper to get surface color from V2 surface data
 */
function getSurfaceColorV2(surfaces: ToothSurfaceV2[], surfaceName: SurfaceName): string {
  const surface = surfaces.find(s => s.surface_name === surfaceName)
  return surface?.color_code || getConditionColor('healthy')
}

/**
 * Incisor - Narrow front tooth (FDI: 11, 12, 21, 22, 31, 32, 41, 42)
 */
export function IncisiorShapeV2({ surfaces, isSelected, onSurfaceClick, onToothClick }: ToothShapeProps) {
  const mesialColor = getSurfaceColorV2(surfaces, 'mesial')
  const distalColor = getSurfaceColorV2(surfaces, 'distal')
  const incisalColor = getSurfaceColorV2(surfaces, 'incisal')
  const buccalColor = getSurfaceColorV2(surfaces, 'buccal')
  const lingualColor = getSurfaceColorV2(surfaces, 'lingual')

  return (
    <g className="tooth-incisor" onClick={onToothClick}>
      {/* Crown outline */}
      <path
        d="M 15 5 Q 20 2 25 5 L 28 25 Q 25 30 20 30 Q 15 30 12 25 Z"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
      />
      
      {/* Mesial surface */}
      <path
        d="M 15 5 Q 20 2 20 15 L 15 25 L 12 25 Z"
        fill={mesialColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('mesial'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal surface */}
      <path
        d="M 25 5 Q 20 2 20 15 L 25 25 L 28 25 Z"
        fill={distalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('distal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Incisal surface (cutting edge) */}
      <path
        d="M 20 2 Q 15 5 12 12 L 28 12 Q 25 5 20 2 Z"
        fill={incisalColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('incisal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Root shadow */}
      <ellipse cx="20" cy="32" rx="6" ry="3" fill="#d1d5db" opacity="0.4" />
      
      {/* Surface division line */}
      <line x1="20" y1="2" x2="20" y2="30" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />
    </g>
  )
}

/**
 * Canine - Pointed tooth (FDI: 13, 23, 33, 43)
 */
export function CanineShapeV2({ surfaces, isSelected, onSurfaceClick, onToothClick }: ToothShapeProps) {
  const mesialColor = getSurfaceColorV2(surfaces, 'mesial')
  const distalColor = getSurfaceColorV2(surfaces, 'distal')
  const incisalColor = getSurfaceColorV2(surfaces, 'incisal')

  return (
    <g className="tooth-canine" onClick={onToothClick}>
      {/* Crown outline */}
      <path
        d="M 20 3 L 28 12 L 28 28 Q 24 32 20 32 Q 16 32 12 28 L 12 12 Z"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
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
      
      {/* Incisal surface (pointed tip) */}
      <path
        d="M 20 3 L 12 12 L 28 12 Z"
        fill={incisalColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('incisal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Root shadow */}
      <ellipse cx="20" cy="34" rx="7" ry="3" fill="#d1d5db" opacity="0.4" />
      
      {/* Central ridge */}
      <line x1="20" y1="3" x2="20" y2="32" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3" />
    </g>
  )
}

/**
 * Premolar - Two cusps (FDI: 14, 15, 24, 25, 34, 35, 44, 45)
 */
export function PremolarShapeV2({ surfaces, isSelected, onSurfaceClick, onToothClick }: ToothShapeProps) {
  const mesialColor = getSurfaceColorV2(surfaces, 'mesial')
  const distalColor = getSurfaceColorV2(surfaces, 'distal')
  const occlusalColor = getSurfaceColorV2(surfaces, 'occlusal')
  const buccalColor = getSurfaceColorV2(surfaces, 'buccal')
  const lingualColor = getSurfaceColorV2(surfaces, 'lingual')

  return (
    <g className="tooth-premolar" onClick={onToothClick}>
      {/* Crown outline */}
      <path
        d="M 12 8 Q 10 12 10 20 Q 10 28 15 32 Q 20 34 25 32 Q 30 28 30 20 Q 30 12 28 8 Q 25 5 20 6 Q 15 5 12 8 Z"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
      />
      
      {/* Buccal cusp */}
      <path
        d="M 12 8 Q 10 12 10 20 L 20 20 L 20 6 Q 15 5 12 8 Z"
        fill={buccalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('buccal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Lingual cusp */}
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
      
      {/* Occlusal surface */}
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
 * Molar - Large grinding tooth (FDI: 16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48)
 */
export function MolarShapeV2({ surfaces, isSelected, onSurfaceClick, onToothClick }: ToothShapeProps) {
  const mesialColor = getSurfaceColorV2(surfaces, 'mesial')
  const distalColor = getSurfaceColorV2(surfaces, 'distal')
  const occlusalColor = getSurfaceColorV2(surfaces, 'occlusal')
  const buccalColor = getSurfaceColorV2(surfaces, 'buccal')
  const lingualColor = getSurfaceColorV2(surfaces, 'lingual')

  return (
    <g className="tooth-molar" onClick={onToothClick}>
      {/* Crown outline */}
      <rect
        x="8" y="6" width="34" height="30" rx="4"
        fill="none"
        stroke={isSelected ? '#0d9488' : '#64748b'}
        strokeWidth={isSelected ? '2' : '1.5'}
      />
      
      {/* Mesial-Buccal cusp */}
      <path
        d="M 8 6 L 8 20 L 20 20 L 20 6 Q 14 8 8 6 Z"
        fill={buccalColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('buccal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal-Buccal cusp */}
      <path
        d="M 30 6 L 30 20 L 20 20 L 20 6 Q 25 8 30 6 Z"
        fill={buccalColor}
        opacity={0.88}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('buccal'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Mesial-Lingual cusp */}
      <path
        d="M 8 26 L 8 36 Q 14 34 20 36 L 20 20 L 8 20 Z"
        fill={lingualColor}
        opacity={0.9}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('lingual'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal-Lingual cusp */}
      <path
        d="M 30 26 L 30 36 Q 25 34 20 36 L 20 20 L 30 20 Z"
        fill={lingualColor}
        opacity={0.88}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('lingual'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Mesial surface */}
      <path
        d="M 8 6 L 8 36 L 11 36 L 11 6 Z"
        fill={mesialColor}
        opacity={0.85}
        onClick={(e) => { e.stopPropagation(); onSurfaceClick?.('mesial'); }}
        className="tooth-surface hover:opacity-100 cursor-pointer"
      />
      
      {/* Distal surface */}
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
      
      {/* Fissure pattern */}
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
      
      {/* Root shadows (multiple roots) */}
      <ellipse cx="15" cy="38" rx="5" ry="2.5" fill="#d1d5db" opacity="0.4" />
      <ellipse cx="30" cy="38" rx="5" ry="2.5" fill="#d1d5db" opacity="0.4" />
    </g>
  )
}
