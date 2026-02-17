"use client"

import { Tooth } from '@/lib/types/dental-chart'

interface PeriodontalChartProps {
  teeth: Tooth[]
  visible: boolean
}

/**
 * Periodontal overlay showing gum lines and pocket depths
 * Color coded: Green (<3mm), Yellow (3-5mm), Red (>5mm)
 */
export function PeriodontalChart({ teeth, visible }: PeriodontalChartProps) {
  if (!visible) return null

  // Get pocket depth color based on measurement
  const getPocketColor = (depth?: number): string => {
    if (!depth) return '#10b981' // Green - healthy
    if (depth < 3) return '#10b981' // Green - healthy
    if (depth <= 5) return '#eab308' // Yellow - moderate
    return '#ef4444' // Red - severe
  }

  // Helper to draw gum line path
  const getGumLinePath = (isUpper: boolean, startX: number, endX: number, y: number): string => {
    const controlY = isUpper ? y + 15 : y - 15
    const midX = (startX + endX) / 2
    
    return `M ${startX} ${y} Q ${midX} ${controlY} ${endX} ${y}`
  }

  return (
    <g className="periodontal-overlay">
      {/* Upper gum line */}
      <path
        d={getGumLinePath(true, 100, 700, 180)}
        fill="none"
        stroke="#f472b6"
        strokeWidth="2"
        opacity="0.6"
        strokeDasharray="3,3"
      />
      
      {/* Lower gum line */}
      <path
        d={getGumLinePath(false, 100, 700, 420)}
        fill="none"
        stroke="#f472b6"
        strokeWidth="2"
        opacity="0.6"
        strokeDasharray="3,3"
      />
      
      {/* Pocket depth indicators */}
      {teeth.map((tooth) => {
        const num = parseInt(tooth.tooth_number)
        const isUpper = num <= 16
        
        // Get average pocket depth from periodontal data
        const perioData = tooth.periodontal
        let avgDepth = 3
        
        if (perioData && perioData.probing_depth_mm && perioData.probing_depth_mm.length > 0) {
          const depths = perioData.probing_depth_mm
          avgDepth = depths.reduce((a, b) => a + b, 0) / depths.length
        }
        
        const color = getPocketColor(avgDepth)
        
        // Calculate position (simplified - use actual tooth position in real implementation)
        let x = 100 + ((num % 16) * 40)
        if (num > 16) x = 100 + ((32 - num) * 40)
        
        const y = isUpper ? 185 : 415
        
        // Only show indicator if there's actual periodontal data
        if (!perioData) return null
        
        return (
          <g key={tooth.tooth_number}>
            {/* Pocket depth indicator line */}
            <line
              x1={x}
              y1={y}
              x2={x}
              y2={y + (isUpper ? 8 : -8)}
              stroke={color}
              strokeWidth="3"
              opacity="0.8"
            />
            
            {/* Depth value label (on hover) */}
            {avgDepth >= 4 && (
              <text
                x={x}
                y={y + (isUpper ? 20 : -15)}
                textAnchor="middle"
                className="text-xs fill-slate-600"
                fontSize="8"
              >
                {avgDepth.toFixed(1)}mm
              </text>
            )}
          </g>
        )
      })}
      
      {/* Legend */}
      <g transform="translate(650, 50)">
        <text x="0" y="0" className="text-xs fill-slate-700 font-medium" fontSize="10">
          Gum Health:
        </text>
        <circle cx="5" cy="12" r="4" fill="#10b981" />
        <text x="12" y="15" className="text-xs fill-slate-600" fontSize="9">&lt;3mm</text>
        
        <circle cx="5" cy="25" r="4" fill="#eab308" />
        <text x="12" y="28" className="text-xs fill-slate-600" fontSize="9">3-5mm</text>
        
        <circle cx="5" cy="38" r="4" fill="#ef4444" />
        <text x="12" y="41" className="text-xs fill-slate-600" fontSize="9">&gt;5mm</text>
      </g>
    </g>
  )
}
