"use client"

import { Tooth } from '@/lib/types/dental-chart'
import { 
  IncisiorShape, 
  CanineShape, 
  PremolarShape, 
  MolarShape, 
  getToothType,
  type SurfaceName 
} from './tooth-shapes'
import { useState } from 'react'

interface ToothRendererProps {
  tooth: Tooth
  isSelected: boolean
  onToothClick: () => void
  onSurfaceClick?: (surface: SurfaceName) => void
  displayNumber: string
  position: { x: number; y: number }
  scale?: number
  rotation?: number
}

/**
 * ToothRenderer - Renders a single tooth with appropriate shape and interactivity
 */
export function ToothRenderer({
  tooth,
  isSelected,
  onToothClick,
  onSurfaceClick,
  displayNumber,
  position,
  scale = 1,
  rotation = 0
}: ToothRendererProps) {
  const [hoveredSurface, setHoveredSurface] = useState<SurfaceName | null>(null)
  
  const toothType = getToothType(parseInt(tooth.tooth_number))
  const { x, y } = position

  // Determine base color based on overall tooth status
  const getBaseColor = () => {
    if (tooth.status === 'missing' || tooth.status === 'extracted') return '#e5e7eb'
    if (tooth.status === 'implant') return '#c084fc'
    return '#f5f1e8' // Natural enamel color
  }

  const baseColor = getBaseColor()

  // Handle surface click with wrapper
  const handleSurfaceClick = (surface: SurfaceName) => {
    onSurfaceClick?.(surface)
  }

  // Select appropriate shape component
  const ShapeComponent = {
    incisor: IncisiorShape,
    canine: CanineShape,
    premolar: PremolarShape,
    molar: MolarShape
  }[toothType]

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale}) rotate(${rotation}, 20, 20)`}
      className="tooth-group"
      onMouseEnter={() => {}}
      onMouseLeave={() => setHoveredSurface(null)}
    >
      {/* Render tooth shape */}
      <ShapeComponent
        type={toothType}
        surfaces={tooth.surfaces || []}
        isSelected={isSelected}
        onToothClick={onToothClick}
        onSurfaceClick={handleSurfaceClick}
        baseColor={baseColor}
      />
      
      {/* Tooth number label */}
      <text
        x="20"
        y="48"
        textAnchor="middle"
        className="text-[8px] font-semibold fill-slate-600 pointer-events-none select-none"
        style={{ fontSize: '8px' }}
      >
        {displayNumber}
      </text>
      
      {/* Selection highlight ring */}
      {isSelected && (
        <circle
          cx="20"
          cy="20"
          r="25"
          fill="none"
          stroke="#0d9488"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
          className="pointer-events-none animate-pulse"
        />
      )}
      
      {/* Problem indicator (if tooth has issues) */}
      {tooth.status === 'problem' && (
        <circle
          cx="35"
          cy="8"
          r="4"
          fill="#ef4444"
          stroke="#fff"
          strokeWidth="1"
          className="pointer-events-none"
        />
      )}
      
      {/* Planned treatment indicator */}
      {tooth.status === 'planned' && (
        <circle
          cx="35"
          cy="8"
          r="4"
          fill="#eab308"
          stroke="#fff"
          strokeWidth="1"
          className="pointer-events-none"
        />
      )}
      
      {/* Tooltip for hovered surface */}
      {hoveredSurface && (
        <g className="surface-tooltip pointer-events-none">
          <rect
            x="5"
            y="-10"
            width="30"
            height="14"
            fill="#1e293b"
            rx="3"
            opacity="0.9"
          />
          <text
            x="20"
            y="0"
            textAnchor="middle"
            className="text-[7px] fill-white font-medium"
            style={{ fontSize: '7px' }}
          >
            {hoveredSurface}
          </text>
        </g>
      )}
    </g>
  )
}

/**
 * Calculate tooth position in curved arch layout
 * Returns x, y coordinates and rotation for natural arch appearance
 */
export function calculateToothPosition(
  toothNumber: number,
  svgWidth: number,
  svgHeight: number
): { x: number; y: number; rotation: number; scale: number } {
  const num = parseInt(String(toothNumber))
  
  // Determine quadrant
  // 1-8: Upper right, 9-16: Upper left
  // 17-24: Lower left, 25-32: Lower right
  
  const isUpper = num <= 16
  const isRight = (num >= 1 && num <= 8) || (num >= 25 && num <= 32)
  
  // Position within quadrant (1-8)
  let position: number
  if (num <= 8) position = num
  else if (num <= 16) position = num - 8
  else if (num <= 24) position = num - 16
  else position = num - 24
  
  // Base positions for arch curve
  const centerX = svgWidth / 2
  const upperY = svgHeight * 0.3
  const lowerY = svgHeight * 0.7
  
  // Tooth spacing (wider for molars, narrower for incisors)
  const toothType = getToothType(num)
  const baseSpacing = {
    molar: 55,
    premolar: 48,
    canine: 42,
    incisor: 35
  }[toothType]
  
  // Calculate horizontal offset from center
  let xOffset: number
  const distanceFromCenter = position - 4.5 // Center between tooth 4 and 5
  
  // Slight curve using quadratic formula
  const curveFactor = 0.3
  const curveOffset = Math.abs(distanceFromCenter) * curveFactor
  
  if (isRight) {
    // Right side (teeth 1-8, 25-32)
    xOffset = -(position - 1) * baseSpacing
  } else {
    // Left side (teeth 9-16, 17-24)
    xOffset = (position - 1) * baseSpacing
  }
  
  const x = centerX + xOffset
  const y = (isUpper ? upperY : lowerY) + curveOffset
  
  // Slight rotation for natural arch appearance
  const maxRotation = 8
  const rotation = (distanceFromCenter / 4) * maxRotation * (isRight ? 1 : -1)
  
  // Scale (molars slightly larger)
  const scale = toothType === 'molar' ? 1.1 : toothType === 'incisor' ? 0.9 : 1.0
  
  return { x, y, rotation, scale }
}
