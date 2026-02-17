"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Lock, 
  Unlock, 
  Info,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { DentalChart, NumberingSystem, Tooth, ToothStatus } from "@/lib/types/dental-chart"
import { universalToFDI, universalToPalmer } from "@/lib/types/dental-chart"
import { ToothDetailPanel } from "./tooth-detail-panel"
import { ToothRenderer, calculateToothPosition } from "./tooth-renderer"
import type { SurfaceName } from "./tooth-shapes"

interface InteractiveDentalChartProps {
  patientId: string
  initialChart?: DentalChart
  onChartUpdate?: (chart: DentalChart) => void
  readOnly?: boolean
}

// Color mapping for surface status (updated for realistic view)
const surfaceStatusColors = {
  healthy: '#f5f1e8',      // Natural enamel
  decay: '#ef4444',         // Red (cavity)
  filled: '#3b82f6',        // Blue (restoration)
  crown: '#8b5cf6',         // Purple
  fracture: '#f97316',      // Orange
  planned: '#eab308',       // Yellow
  missing: '#e5e7eb',       // Light gray
}

// Legacy status colors for backward compatibility
const statusColors: Record<ToothStatus, string> = {
  healthy: "#86efac",
  treated: "#93c5fd",
  problem: "#fca5a5",
  planned: "#fde047",
  missing: "#e5e7eb",
  extracted: "#d1d5db",
  impacted: "#fbbf24",
  implant: "#c084fc",
}

export function InteractiveDentalChart({ 
  patientId, 
  initialChart,
  onChartUpdate,
  readOnly = false 
}: InteractiveDentalChartProps) {
  const [chart, setChart] = useState<DentalChart | null>(initialChart || null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState<Tooth | null>(null)
  const [numberingSystem, setNumberingSystem] = useState<NumberingSystem>("universal")
  const [activeTool, setActiveTool] = useState<'select' | 'cavity' | 'restoration'>('select')

  // Load chart from API
  const loadChart = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/chart`)
      if (res.ok) {
        const data = await res.json()
        setChart(data)
        setNumberingSystem(data.numbering_system || "universal")
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("[DENTAL_CHART] Load failed:", res.status, errorData)
        if (res.status === 404 || res.status === 500) {
          toast.error("Dental chart unavailable. The migration may not be applied yet.")
        } else {
          toast.error(errorData.error || "Failed to load dental chart")
        }
      }
    } catch (error) {
      console.error("[DENTAL_CHART] Error:", error)
      toast.error("Error loading dental chart")
    } finally {
      setLoading(false)
    }
  }

  // Save chart changes
  const saveChart = async (updatedChart: Partial<DentalChart>, auditInfo?: any) => {
    if (!chart) return
    
    setSaving(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/chart`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedChart,
          ...auditInfo
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setChart(data)
        if (onChartUpdate) onChartUpdate(data)
        toast.success("Chart updated")
        return data
      } else if (res.status === 423) {
        toast.error("Chart is locked by another user")
      } else {
        toast.error("Failed to save chart")
      }
    } catch (error) {
      toast.error("Error saving chart")
    } finally {
      setSaving(false)
    }
  }

  // Toggle lock
  const toggleLock = async () => {
    if (!chart) return
    await saveChart(
      { is_locked: !chart.is_locked },
      { 
        audit_action: chart.is_locked ? "chart_unlocked" : "chart_locked",
        audit_entity_type: "dental_chart"
      }
    )
  }

  // Handle tooth update
  const handleToothUpdate = async (updatedTooth: Tooth) => {
    if (!chart) return
    
    const updatedTeeth = chart.teeth.map(t => 
      t.tooth_number === updatedTooth.tooth_number ? updatedTooth : t
    )
    
    const updated = await saveChart(
      { teeth: updatedTeeth },
      {
        audit_action: "tooth_updated",
        audit_entity_type: "tooth",
        audit_entity_id: updatedTooth.tooth_number,
        audit_previous_value: chart.teeth.find(t => t.tooth_number === updatedTooth.tooth_number),
        audit_new_value: updatedTooth
      }
    )
    
    // Update selected tooth with latest data
    if (updated && selectedTooth) {
      const refreshedTooth = updated.teeth.find((t: Tooth) => t.tooth_number === selectedTooth.tooth_number)
      if (refreshedTooth) setSelectedTooth(refreshedTooth)
    }
  }

  // Handle surface click (for marking cavities, restorations, etc.)
  const handleSurfaceClick = (tooth: Tooth, surfaceName: SurfaceName) => {
    if (isReadOnly || activeTool === 'select') return
    
    // Map surface name to surface code
    const surfaceCodeMap: Record<SurfaceName, string> = {
      mesial: 'M',
      distal: 'D',
      occlusal: 'O',
      buccal: 'B',
      lingual: 'L'
    }
    
    const surfaceCode = surfaceCodeMap[surfaceName] as any
    const surfaces = tooth.surfaces || []
    const existingSurface = surfaces.find(s => s.surface_code === surfaceCode)
    
    let updatedSurfaces
    if (activeTool === 'cavity') {
      if (existingSurface && existingSurface.status === 'decay') {
        // Remove cavity marking
        updatedSurfaces = surfaces.filter(s => s.surface_code !== surfaceCode)
      } else {
        // Add or update cavity marking
        updatedSurfaces = [
          ...surfaces.filter(s => s.surface_code !== surfaceCode),
          { surface_code: surfaceCode, status: 'decay' as const }
        ]
      }
    } else if (activeTool === 'restoration') {
      if (existingSurface && existingSurface.status === 'filled') {
        // Remove restoration marking
        updatedSurfaces = surfaces.filter(s => s.surface_code !== surfaceCode)
      } else {
        // Add or update restoration marking
        updatedSurfaces = [
          ...surfaces.filter(s => s.surface_code !== surfaceCode),
          { surface_code: surfaceCode, status: 'filled' as const }
        ]
      }
    } else {
      return
    }
    
    const updatedTooth = { ...tooth, surfaces: updatedSurfaces }
    handleToothUpdate(updatedTooth)
  }

  // Get display tooth number based on numbering system
  const getDisplayToothNumber = (toothNumber: string) => {
    const num = parseInt(toothNumber)
    if (numberingSystem === "FDI") return universalToFDI(num)
    if (numberingSystem === "palmer") return universalToPalmer(num)
    return toothNumber
  }

  // Load chart on mount
  useEffect(() => {
    if (!initialChart) {
      loadChart()
    }
  }, [patientId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-3 text-slate-500">Loading dental chart...</span>
        </CardContent>
      </Card>
    )
  }

  if (!chart) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Info className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 mb-1">Dental chart could not be loaded</p>
          <p className="text-xs text-slate-400 mb-4">The database table may not exist yet. Apply the migration first.</p>
          <Button onClick={loadChart}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const isLocked = !!(chart.is_locked && chart.locked_by)
  const isReadOnly = readOnly || (isLocked && chart.locked_by !== "current_user") // TODO: check actual current user

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Dental Chart</CardTitle>
              <Badge variant="outline">Version {chart.version}</Badge>
              {isLocked && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Numbering system selector */}
              <Select 
                value={numberingSystem} 
                onValueChange={(v) => setNumberingSystem(v as NumberingSystem)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="universal">Universal</SelectItem>
                  <SelectItem value="FDI">FDI</SelectItem>
                  <SelectItem value="palmer">Palmer</SelectItem>
                </SelectContent>
              </Select>

              {!readOnly && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleLock}
                  disabled={saving}
                >
                  {isLocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tooth Map */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <svg 
              viewBox="0 0 800 600" 
              className="w-full h-auto"
              style={{ maxHeight: "600px" }}
            >
              {/* Render all 32 teeth with realistic shapes */}
              {chart.teeth.map((tooth) => {
                const position = calculateToothPosition(
                  parseInt(tooth.tooth_number),
                  800,
                  600
                )
                return (
                  <ToothRenderer
                    key={tooth.tooth_number}
                    tooth={tooth}
                    isSelected={selectedTooth?.tooth_number === tooth.tooth_number}
                    onToothClick={() => setSelectedTooth(tooth)}
                    onSurfaceClick={(surface) => handleSurfaceClick(tooth, surface)}
                    displayNumber={getDisplayToothNumber(tooth.tooth_number)}
                    position={position}
                    scale={position.scale}
                    rotation={position.rotation}
                  />
                )
              })}
              
              {/* Center Line */}
              <line 
                x1="400" 
                y1="120" 
                x2="400" 
                y2="480" 
                stroke="#cbd5e1" 
                strokeWidth="2" 
                strokeDasharray="5,5" 
              />
              
              {/* Arch Labels */}
              <text x="40" y="180" className="text-sm font-medium fill-slate-500">Upper</text>
              <text x="40" y="420" className="text-sm font-medium fill-slate-500">Lower</text>
              <text x="730" y="180" className="text-sm font-medium fill-slate-500">Upper</text>
              <text x="730" y="420" className="text-sm font-medium fill-slate-500">Lower</text>
            </svg>

            {/* Tool Selection */}
            {!isReadOnly && (
              <div className="mt-4 flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
                <span className="text-xs font-medium text-slate-600">Tool:</span>
                <Button
                  size="sm"
                  variant={activeTool === 'select' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('select')}
                  className="h-7 text-xs"
                >
                  Select
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === 'cavity' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('cavity')}
                  className="h-7 text-xs"
                >
                  Mark Cavity
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === 'restoration' ? 'default' : 'outline'}
                  onClick={() => setActiveTool('restoration')}
                  className="h-7 text-xs"
                >
                  Mark Restoration
                </Button>
              </div>
            )}

            {/* Legend */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Surface Status Colors:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(surfaceStatusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded border border-slate-300"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs text-slate-600 capitalize">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tooth Detail Panel */}
        <ToothDetailPanel
          tooth={selectedTooth}
          onUpdate={handleToothUpdate}
          onClose={() => setSelectedTooth(null)}
          readOnly={isReadOnly}
          saving={saving}
        />
      </div>
    </div>
  )
}
