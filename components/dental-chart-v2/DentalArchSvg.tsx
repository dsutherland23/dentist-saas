"use client"

import React from 'react'
import { PERMANENT_TOOTH_PATHS, PRIMARY_TOOTH_PATHS } from './static-tooth-paths'

interface DentalArchSvgProps {
  teeth: Array<{
    fdi: string
    universal?: string
    fill: string
    isSelected?: boolean
    isHovered?: boolean
  }>
  numberingSystem?: 'FDI' | 'universal'
  toothType?: 'permanent' | 'primary'
  onToothClick?: (fdi: string) => void
  onToothHover?: (fdi: string | null) => void
}

export const DentalArchSvg: React.FC<DentalArchSvgProps> = ({
  teeth,
  numberingSystem = 'FDI',
  toothType = 'permanent',
  onToothClick,
  onToothHover
}) => {
  // Select appropriate path set
  const pathDefinitions = toothType === 'primary' 
    ? PRIMARY_TOOTH_PATHS 
    : PERMANENT_TOOTH_PATHS

  return (
    <svg
      viewBox="0 0 1200 800"
      className="w-full h-auto"
      style={{ maxHeight: '700px' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Centerline */}
      <line
        x1={600}
        y1={100}
        x2={600}
        y2={700}
        stroke="#e5e7eb"
        strokeWidth={2}
        strokeDasharray="5,5"
      />
      
      {/* Quadrant labels */}
      <text x={350} y={120} fontSize="14" fill="#9ca3af" textAnchor="middle">Q1 (UR)</text>
      <text x={850} y={120} fontSize="14" fill="#9ca3af" textAnchor="middle">Q2 (UL)</text>
      <text x={350} y={760} fontSize="14" fill="#9ca3af" textAnchor="middle">Q4 (LR)</text>
      <text x={850} y={760} fontSize="14" fill="#9ca3af" textAnchor="middle">Q3 (LL)</text>
      
      <text x={80} y={250} fontSize="14" fill="#9ca3af">Upper</text>
      <text x={80} y={550} fontSize="14" fill="#9ca3af">Lower</text>
      
      {/* Render all teeth using static paths */}
      {teeth.map((tooth) => {
        // Find matching path definition
        const pathDef = pathDefinitions.find(p => p.fdi === tooth.fdi)
        if (!pathDef) return null
        
        const strokeWidth = tooth.isSelected ? 3 : tooth.isHovered ? 2 : 1
        const stroke = tooth.isSelected ? '#2563eb' : tooth.isHovered ? '#60a5fa' : '#1f2937'
        const displayNumber = numberingSystem === 'universal' 
          ? pathDef.universal 
          : pathDef.fdi
        
        return (
          <g key={tooth.fdi}>
            <path
              d={pathDef.path}
              fill={tooth.fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              onClick={() => onToothClick?.(tooth.fdi)}
              onMouseEnter={() => onToothHover?.(tooth.fdi)}
              onMouseLeave={() => onToothHover?.(null)}
              style={{ cursor: 'pointer' }}
              className="tooth-path"
              data-fdi={tooth.fdi}
            />
            {/* Tooth number label */}
            <text
              x={pathDef.centerX}
              y={pathDef.centerY}
              textAnchor="middle"
              fontSize="10"
              fill="#666"
              pointerEvents="none"
            >
              {displayNumber}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
