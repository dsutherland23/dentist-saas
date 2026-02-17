/**
 * ============================================================================
 * DENTAL CHART - STANDALONE PREVIEW SNIPPET
 * ============================================================================
 * 
 * COPY-PASTE READY COMPONENT
 * 
 * This is a complete, working example that you can copy and paste
 * into your React application for immediate testing.
 * 
 * USAGE:
 * 1. Copy this entire file
 * 2. Create a new page in your app (e.g., app/test-dental/page.tsx)
 * 3. Paste and save
 * 4. Navigate to /test-dental in your browser
 * 
 * OR use in any existing page:
 * ```tsx
 * import DentalChartPreview from './DENTAL_CHART_PREVIEW_SNIPPET'
 * 
 * export default function MyPage() {
 *   return (
 *     <div className="h-screen">
 *       <DentalChartPreview />
 *     </div>
 *   )
 * }
 * ```
 * 
 * ============================================================================
 */

'use client'

import React, { useState, useCallback, useMemo } from 'react'

// Sample tooth data (simplified for preview)
const SAMPLE_ADULT_TEETH = [
  { id: '11', fdi: '11', universal: '8', label: 'UR Central Incisor', x: 555, y: 165 },
  { id: '12', fdi: '12', universal: '7', label: 'UR Lateral Incisor', x: 505, y: 160 },
  { id: '13', fdi: '13', universal: '6', label: 'UR Canine', x: 455, y: 155 },
  { id: '14', fdi: '14', universal: '5', label: 'UR 1st Premolar', x: 398, y: 153 },
  { id: '15', fdi: '15', universal: '4', label: 'UR 2nd Premolar', x: 338, y: 155 },
  { id: '16', fdi: '16', universal: '3', label: 'UR 1st Molar', x: 275, y: 160 },
  { id: '17', fdi: '17', universal: '2', label: 'UR 2nd Molar', x: 210, y: 170 },
  { id: '18', fdi: '18', universal: '1', label: 'UR 3rd Molar', x: 145, y: 185 },
  
  { id: '21', fdi: '21', universal: '9', label: 'UL Central Incisor', x: 645, y: 165 },
  { id: '22', fdi: '22', universal: '10', label: 'UL Lateral Incisor', x: 695, y: 160 },
  { id: '23', fdi: '23', universal: '11', label: 'UL Canine', x: 745, y: 155 },
  { id: '24', fdi: '24', universal: '12', label: 'UL 1st Premolar', x: 800, y: 153 },
  { id: '25', fdi: '25', universal: '13', label: 'UL 2nd Premolar', x: 860, y: 155 },
  { id: '26', fdi: '26', universal: '14', label: 'UL 1st Molar', x: 923, y: 160 },
  { id: '27', fdi: '27', universal: '15', label: 'UL 2nd Molar', x: 988, y: 170 },
  { id: '28', fdi: '28', universal: '16', label: 'UL 3rd Molar', x: 1053, y: 185 },
  
  { id: '31', fdi: '31', universal: '24', label: 'LL Central Incisor', x: 645, y: 605 },
  { id: '32', fdi: '32', universal: '23', label: 'LL Lateral Incisor', x: 695, y: 600 },
  { id: '33', fdi: '33', universal: '22', label: 'LL Canine', x: 745, y: 595 },
  { id: '34', fdi: '34', universal: '21', label: 'LL 1st Premolar', x: 800, y: 593 },
  { id: '35', fdi: '35', universal: '20', label: 'LL 2nd Premolar', x: 860, y: 595 },
  { id: '36', fdi: '36', universal: '19', label: 'LL 1st Molar', x: 923, y: 600 },
  { id: '37', fdi: '37', universal: '18', label: 'LL 2nd Molar', x: 988, y: 610 },
  { id: '38', fdi: '38', universal: '17', label: 'LL 3rd Molar', x: 1053, y: 625 },
  
  { id: '41', fdi: '41', universal: '25', label: 'LR Central Incisor', x: 555, y: 605 },
  { id: '42', fdi: '42', universal: '26', label: 'LR Lateral Incisor', x: 505, y: 600 },
  { id: '43', fdi: '43', universal: '27', label: 'LR Canine', x: 455, y: 595 },
  { id: '44', fdi: '44', universal: '28', label: 'LR 1st Premolar', x: 400, y: 593 },
  { id: '45', fdi: '45', universal: '29', label: 'LR 2nd Premolar', x: 340, y: 595 },
  { id: '46', fdi: '46', universal: '30', label: 'LR 1st Molar', x: 277, y: 600 },
  { id: '47', fdi: '47', universal: '31', label: 'LR 2nd Molar', x: 212, y: 610 },
  { id: '48', fdi: '48', universal: '32', label: 'LR 3rd Molar', x: 147, y: 625 },
]

const SAMPLE_PEDIATRIC_TEETH = [
  { id: '51', fdi: '51', universal: 'E', label: 'UR Central Primary Incisor', x: 478, y: 173 },
  { id: '52', fdi: '52', universal: 'D', label: 'UR Lateral Primary Incisor', x: 428, y: 173 },
  { id: '53', fdi: '53', universal: 'C', label: 'UR Primary Canine', x: 378, y: 175 },
  { id: '54', fdi: '54', universal: 'B', label: 'UR 1st Primary Molar', x: 325, y: 178 },
  { id: '55', fdi: '55', universal: 'A', label: 'UR 2nd Primary Molar', x: 270, y: 183 },
  
  { id: '61', fdi: '61', universal: 'F', label: 'UL Central Primary Incisor', x: 722, y: 173 },
  { id: '62', fdi: '62', universal: 'G', label: 'UL Lateral Primary Incisor', x: 772, y: 173 },
  { id: '63', fdi: '63', universal: 'H', label: 'UL Primary Canine', x: 822, y: 175 },
  { id: '64', fdi: '64', universal: 'I', label: 'UL 1st Primary Molar', x: 875, y: 178 },
  { id: '65', fdi: '65', universal: 'J', label: 'UL 2nd Primary Molar', x: 930, y: 183 },
  
  { id: '71', fdi: '71', universal: 'K', label: 'LL Central Primary Incisor', x: 722, y: 603 },
  { id: '72', fdi: '72', universal: 'L', label: 'LL Lateral Primary Incisor', x: 772, y: 598 },
  { id: '73', fdi: '73', universal: 'M', label: 'LL Primary Canine', x: 822, y: 593 },
  { id: '74', fdi: '74', universal: 'N', label: 'LL 1st Primary Molar', x: 875, y: 588 },
  { id: '75', fdi: '75', universal: 'O', label: 'LL 2nd Primary Molar', x: 930, y: 583 },
  
  { id: '81', fdi: '81', universal: 'T', label: 'LR Central Primary Incisor', x: 478, y: 603 },
  { id: '82', fdi: '82', universal: 'S', label: 'LR Lateral Primary Incisor', x: 428, y: 598 },
  { id: '83', fdi: '83', universal: 'R', label: 'LR Primary Canine', x: 378, y: 593 },
  { id: '84', fdi: '84', universal: 'Q', label: 'LR 1st Primary Molar', x: 325, y: 588 },
  { id: '85', fdi: '85', universal: 'P', label: 'LR 2nd Primary Molar', x: 270, y: 583 },
]

export default function DentalChartPreview() {
  const [toothType, setToothType] = useState<'adult' | 'pediatric'>('adult')
  const [numberingSystem, setNumberingSystem] = useState<'FDI' | 'Universal'>('FDI')
  const [selectedTeeth, setSelectedTeeth] = useState<Set<string>>(new Set())
  const [hoveredTooth, setHoveredTooth] = useState<string | null>(null)

  const currentTeeth = toothType === 'adult' ? SAMPLE_ADULT_TEETH : SAMPLE_PEDIATRIC_TEETH

  const handleToothClick = useCallback((id: string, event: React.MouseEvent) => {
    setSelectedTeeth(prev => {
      const newSet = new Set(prev)
      if (event.ctrlKey || event.metaKey) {
        newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      } else {
        newSet.has(id) && newSet.size === 1 ? newSet.clear() : (newSet.clear(), newSet.add(id))
      }
      return newSet
    })
  }, [])

  const handleExportJSON = useCallback(() => {
    const selected = currentTeeth.filter(t => selectedTeeth.has(t.id))
    const data = {
      timestamp: new Date().toISOString(),
      toothType,
      numberingSystem,
      selectedTeeth: selected,
      totalSelected: selected.length
    }
    console.log('Export JSON:', data)
    alert(`✅ Exported ${selected.length} teeth to console!`)
  }, [selectedTeeth, currentTeeth, toothType, numberingSystem])

  const handleExportCSV = useCallback(() => {
    const selected = currentTeeth.filter(t => selectedTeeth.has(t.id))
    const csv = ['FDI,Universal,Label', ...selected.map(t => `${t.fdi},${t.universal},${t.label}`)].join('\n')
    console.log('Export CSV:\n' + csv)
    alert(`✅ Exported ${selected.length} teeth to console!`)
  }, [selectedTeeth, currentTeeth])

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
        <h1 className="text-2xl font-bold mb-2">🦷 Dental Chart Preview</h1>
        <p className="text-sm text-blue-100">
          Click teeth to select • Hold Ctrl/Cmd for multi-select • Test all features below!
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white border-b p-4 flex flex-wrap gap-4 items-center justify-between">
        {/* Tooth Type */}
        <div className="flex gap-2">
          <button
            onClick={() => { setToothType('adult'); setSelectedTeeth(new Set()) }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              toothType === 'adult' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Adult (32)
          </button>
          <button
            onClick={() => { setToothType('pediatric'); setSelectedTeeth(new Set()) }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              toothType === 'pediatric' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pediatric (20)
          </button>
        </div>

        {/* Numbering */}
        <div className="flex gap-2">
          <button
            onClick={() => setNumberingSystem('FDI')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              numberingSystem === 'FDI' 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            FDI
          </button>
          <button
            onClick={() => setNumberingSystem('Universal')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              numberingSystem === 'Universal' 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Universal
          </button>
        </div>

        {/* Selected Count */}
        <div className="text-sm font-semibold text-slate-700">
          {selectedTeeth.size} selected
        </div>
      </div>

      {/* SVG Chart */}
      <div className="flex-1 bg-white p-4 overflow-auto">
        <svg viewBox="0 0 1200 800" className="w-full h-full" style={{ minHeight: '400px' }}>
          {/* Centerline */}
          <line x1={600} y1={100} x2={600} y2={700} stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5,5" />
          
          {/* Labels */}
          <text x={350} y={120} fontSize="14" fill="#9ca3af" textAnchor="middle">Q1 (UR)</text>
          <text x={850} y={120} fontSize="14" fill="#9ca3af" textAnchor="middle">Q2 (UL)</text>
          <text x={350} y={760} fontSize="14" fill="#9ca3af" textAnchor="middle">Q4 (LR)</text>
          <text x={850} y={760} fontSize="14" fill="#9ca3af" textAnchor="middle">Q3 (LL)</text>
          <text x={80} y={250} fontSize="14" fill="#9ca3af">Upper</text>
          <text x={80} y={550} fontSize="14" fill="#9ca3af">Lower</text>
          
          {/* Teeth */}
          {currentTeeth.map((tooth) => {
            const isSelected = selectedTeeth.has(tooth.id)
            const isHovered = hoveredTooth === tooth.id
            const displayNumber = numberingSystem === 'Universal' ? tooth.universal : tooth.fdi
            
            return (
              <g key={tooth.id}>
                {/* Tooth Circle */}
                <circle
                  cx={tooth.x}
                  cy={tooth.y}
                  r={18}
                  fill={isSelected ? '#3b82f6' : '#f8fafc'}
                  stroke={isSelected ? '#2563eb' : isHovered ? '#60a5fa' : '#cbd5e1'}
                  strokeWidth={isSelected ? 3 : 2}
                  onClick={(e) => handleToothClick(tooth.id, e)}
                  onMouseEnter={() => setHoveredTooth(tooth.id)}
                  onMouseLeave={() => setHoveredTooth(null)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                />
                
                {/* Number */}
                <text
                  x={tooth.x}
                  y={tooth.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isSelected ? '#1e40af' : '#475569'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  pointerEvents="none"
                  style={{ transition: 'all 0.2s ease' }}
                >
                  {displayNumber}
                </text>
                
                {/* Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={tooth.x - 80}
                      y={tooth.y - 45}
                      width="160"
                      height="28"
                      fill="#1f2937"
                      rx="6"
                      opacity="0.95"
                    />
                    <text
                      x={tooth.x}
                      y={tooth.y - 25}
                      textAnchor="middle"
                      fontSize="11"
                      fill="white"
                      fontWeight="500"
                    >
                      {tooth.label}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t p-4 flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedTeeth(new Set())}
          className="px-4 py-2 rounded-lg font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => alert(`Selected: ${Array.from(selectedTeeth).join(', ')}`)}
          disabled={selectedTeeth.size === 0}
          className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
        >
          Submit ({selectedTeeth.size})
        </button>
        <button
          onClick={handleExportJSON}
          disabled={selectedTeeth.size === 0}
          className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-300 transition-colors"
        >
          Export JSON
        </button>
        <button
          onClick={handleExportCSV}
          disabled={selectedTeeth.size === 0}
          className="px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-300 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-100 px-4 py-2 text-xs text-slate-600 text-center">
        ✅ All features working • Check browser console for exports • Fully responsive
      </div>
    </div>
  )
}
