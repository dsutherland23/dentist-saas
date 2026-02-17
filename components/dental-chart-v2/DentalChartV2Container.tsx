"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { InteractiveChartV2 } from "./interactive-chart-v2"
import { ToothDetailPanelV2 } from "./tooth-detail-panel-v2"
import {
  PeriodontalChartPanel,
  DiagnosisManager,
  TreatmentPlanBuilder,
  ClinicalNotesPanel,
  AttachmentsPanel
} from "./simple-panels"
import type { DentalChartV2, ChartTooth, SurfaceName, ConditionType } from "@/lib/types/dental-chart-v2"
import { toast } from "sonner"

interface DentalChartV2ContainerProps {
  patientId: string
}

export function DentalChartV2Container({ patientId }: DentalChartV2ContainerProps) {
  const [chart, setChart] = useState<DentalChartV2 | null>(null)
  const [selectedTooth, setSelectedTooth] = useState<ChartTooth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load chart data
  useEffect(() => {
    loadChart()
  }, [patientId])

  const loadChart = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/v2/patients/${patientId}/chart`)
      
      if (!response.ok) {
        throw new Error('Failed to load dental chart')
      }
      
      const data = await response.json()
      setChart(data)
    } catch (err) {
      console.error('[CHART_V2] Load error:', err)
      setError('Failed to load dental chart')
      toast.error('Failed to load dental chart')
    } finally {
      setLoading(false)
    }
  }

  const handleToothSelect = (tooth: ChartTooth) => {
    // Instant selection - no API call needed
    setSelectedTooth(tooth)
  }

  const handleSurfaceClick = async (tooth: ChartTooth, surfaceName: SurfaceName) => {
    // Find the surface to update
    const surface = tooth.surfaces.find(s => s.surface_name === surfaceName)
    if (!surface) return

    // Toggle between healthy and decay as a simple example
    const newCondition = surface.condition_type === 'healthy' ? 'decay' : 'healthy'
    const newColor = newCondition === 'healthy' ? '#4CAF50' : '#F44336'
    
    // Update local state immediately for instant visual feedback
    if (chart) {
      const updatedChart: DentalChartV2 = {
        ...chart,
        teeth: chart.teeth.map(t => {
          if (t.tooth_id === tooth.tooth_id) {
            return {
              ...t,
              surfaces: t.surfaces.map(s => {
                if (s.surface_id === surface.surface_id) {
                  return {
                    ...s,
                    condition_type: newCondition as ConditionType,
                    color_code: newColor,
                    severity: (newCondition === 'decay' ? 'moderate' : null) as 'mild' | 'moderate' | 'severe' | null
                  }
                }
                return s
              })
            }
          }
          return t
        })
      }
      setChart(updatedChart)
      
      // Update selected tooth if it's the one being modified
      if (selectedTooth?.tooth_id === tooth.tooth_id) {
        const updatedTooth = updatedChart.teeth.find(t => t.tooth_id === tooth.tooth_id)
        if (updatedTooth) setSelectedTooth(updatedTooth)
      }
    }

    // Save to backend in background (don't await)
    fetch(`/api/v2/patients/${patientId}/chart/surfaces/${surface.surface_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        condition_type: newCondition,
        color_code: newColor,
        severity: newCondition === 'decay' ? 'moderate' : null
      })
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to update surface')
      toast.success('Surface updated')
    })
    .catch(err => {
      console.error('[CHART_V2] Surface update error:', err)
      toast.error('Failed to update surface')
      // Reload chart to revert on error
      loadChart()
    })
  }

  const handleToothUpdate = async (updatedTooth: ChartTooth) => {
    // Update each modified surface
    try {
      for (const surface of updatedTooth.surfaces) {
        await fetch(
          `/api/v2/patients/${patientId}/chart/surfaces/${surface.surface_id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              condition_type: surface.condition_type,
              condition_status: surface.condition_status,
              severity: surface.severity,
              material_type: surface.material_type,
              color_code: surface.color_code,
              notes: surface.notes
            })
          }
        )
      }
      
      await loadChart()
      toast.success('Tooth updated successfully')
    } catch (err) {
      console.error('[CHART_V2] Tooth update error:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (error || !chart) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
          <p className="text-slate-600">{error || 'Failed to load chart'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="periodontal">Periodontal</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="attachments">Files</TabsTrigger>
        </TabsList>

        <TabsContent value="chart" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <InteractiveChartV2
                    chart={chart}
                    selectedTooth={selectedTooth}
                    onToothSelect={handleToothSelect}
                    onSurfaceClick={handleSurfaceClick}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-1">
              <ToothDetailPanelV2
                tooth={selectedTooth}
                onClose={() => setSelectedTooth(null)}
                onUpdate={handleToothUpdate}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="periodontal">
          <PeriodontalChartPanel
            chartId={chart.chart_id}
            patientId={patientId}
            records={chart.periodontal_records || []}
          />
        </TabsContent>

        <TabsContent value="diagnoses">
          <DiagnosisManager
            chartId={chart.chart_id}
            diagnoses={chart.diagnoses || []}
          />
        </TabsContent>

        <TabsContent value="treatments">
          <TreatmentPlanBuilder
            chartId={chart.chart_id}
            treatments={chart.treatment_plans || []}
          />
        </TabsContent>

        <TabsContent value="notes">
          <ClinicalNotesPanel
            chartId={chart.chart_id}
            notes={chart.clinical_notes || []}
          />
        </TabsContent>

        <TabsContent value="attachments">
          <AttachmentsPanel chartId={chart.chart_id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
