"use client"

import { useState, useMemo } from "react"
import type { DentalChartV2, ChartTooth, SurfaceName } from "@/lib/types/dental-chart-v2"
import { DentalArchSvg } from "./DentalArchSvg"
import { getConditionLegend, getConditionColor } from "@/lib/utils/dental-colors"

interface InteractiveChartV2Props {
  chart: DentalChartV2
  selectedTooth: ChartTooth | null
  onToothSelect: (tooth: ChartTooth) => void
  onSurfaceClick: (tooth: ChartTooth, surface: SurfaceName) => void
}

/**
 * Get dominant condition color for a tooth based on its surfaces
 * Priority: decay/fracture > restoration > healthy
 */
function getToothColor(tooth: ChartTooth): string {
  const conditions = tooth.surfaces.map(s => s.condition_type)
  
  // Priority order
  if (conditions.includes('decay')) return getConditionColor('decay')
  if (conditions.includes('fracture')) return getConditionColor('fracture')
  if (conditions.includes('restoration')) return getConditionColor('restoration')
  if (conditions.includes('crown')) return getConditionColor('crown')
  if (conditions.includes('wear')) return getConditionColor('wear')
  if (conditions.includes('erosion')) return getConditionColor('erosion')
  if (conditions.includes('stain')) return getConditionColor('stain')
  
  return getConditionColor('healthy')
}

/**
 * Main Interactive Chart Component V2
 */
export function InteractiveChartV2({
  chart,
  selectedTooth,
  onToothSelect,
  onSurfaceClick
}: InteractiveChartV2Props) {
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null)
  const [numberingSystem, setNumberingSystem] = useState<'FDI' | 'universal'>(
    chart.preferred_numbering_system || 'FDI'
  )

  // Determine tooth type from chart data
  const toothType = useMemo(() => {
    // Check if any tooth has tooth_type_category field
    const firstTooth = chart.teeth[0]
    if (firstTooth?.tooth_type_category) {
      return firstTooth.tooth_type_category
    }
    // Default to permanent
    return 'permanent' as const
  }, [chart.teeth])

  // Map chart teeth to SVG tooth data
  const svgTeeth = useMemo(() => {
    return chart.teeth.map(tooth => ({
      fdi: tooth.tooth_number,
      universal: tooth.universal_number,
      fill: getToothColor(tooth),
      isSelected: selectedTooth?.tooth_id === tooth.tooth_id,
      isHovered: hoveredTooth === tooth.tooth_number
    }))
  }, [chart.teeth, selectedTooth, hoveredTooth])

  // Handle tooth click - find tooth by FDI number
  const handleToothClick = (fdi: string) => {
    const tooth = chart.teeth.find(t => t.tooth_number === fdi)
    if (tooth) {
      onToothSelect(tooth)
    }
  }

  return (
    <div className="w-full">
      {/* Numbering System Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Tooth Numbering:</span>
        <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1">
          <button
            onClick={() => setNumberingSystem('FDI')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              numberingSystem === 'FDI'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FDI (11-48)
          </button>
          <button
            onClick={() => setNumberingSystem('universal')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              numberingSystem === 'universal'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Universal (1-32)
          </button>
        </div>
      </div>

      <DentalArchSvg
        teeth={svgTeeth}
        numberingSystem={numberingSystem}
        toothType={toothType}
        onToothClick={handleToothClick}
        onToothHover={setHoveredTooth}
      />

      {/* Legend */}
      <div className="mt-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700">Condition Legend:</p>
          <p className="text-xs text-slate-500">
            {chart.teeth.length} teeth displayed
          </p>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {getConditionLegend().map(({ condition, color, label }) => (
            <div key={condition} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded border border-slate-300 shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
