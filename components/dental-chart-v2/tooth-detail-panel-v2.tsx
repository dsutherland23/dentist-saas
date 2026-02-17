"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Save, Loader2, AlertCircle, Link as LinkIcon } from "lucide-react"
import type { ChartTooth, ToothSurfaceV2, ConditionType, MaterialType, Severity } from "@/lib/types/dental-chart-v2"
import { getToothDisplayName } from "@/lib/utils/fdi-numbering"
import { toast } from "sonner"

interface ToothDetailPanelV2Props {
  tooth: ChartTooth | null
  onClose: () => void
  onUpdate: (updatedTooth: ChartTooth) => Promise<void>
  readOnly?: boolean
}

export function ToothDetailPanelV2({
  tooth,
  onClose,
  onUpdate,
  readOnly = false
}: ToothDetailPanelV2Props) {
  const [editedTooth, setEditedTooth] = useState<ChartTooth | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (tooth) {
      setEditedTooth({ ...tooth, surfaces: [...tooth.surfaces] })
      setHasChanges(false)
    }
  }, [tooth])

  const handleSave = async () => {
    if (!editedTooth || !hasChanges) return
    
    setSaving(true)
    try {
      await onUpdate(editedTooth)
      setHasChanges(false)
      toast.success("Tooth updated successfully")
    } catch (error) {
      toast.error("Failed to update tooth")
    } finally {
      setSaving(false)
    }
  }

  const updateSurface = async (surfaceId: string, updates: Partial<ToothSurfaceV2>) => {
    if (!editedTooth) return
    
    const updatedSurfaces = editedTooth.surfaces.map(s =>
      s.surface_id === surfaceId ? { ...s, ...updates } : s
    )
    
    setEditedTooth({ ...editedTooth, surfaces: updatedSurfaces })
    setHasChanges(true)
  }

  if (!tooth || !editedTooth) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Select a tooth to view details</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Tooth {tooth.tooth_number}</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {getToothDisplayName(tooth.tooth_number)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Tooth Status */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Tooth Status</Label>
          <Select
            value={editedTooth.status}
            onValueChange={(v: any) => {
              setEditedTooth({ ...editedTooth, status: v })
              setHasChanges(true)
            }}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="extracted">Extracted</SelectItem>
              <SelectItem value="impacted">Impacted</SelectItem>
              <SelectItem value="unerupted">Unerupted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobility & Furcation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Mobility</Label>
            <Select
              value={editedTooth.mobility_grade?.toString() || 'none'}
              onValueChange={(v) => {
                setEditedTooth({ ...editedTooth, mobility_grade: v === 'none' ? null : parseInt(v) })
                setHasChanges(true)
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="0">Grade 0</SelectItem>
                <SelectItem value="1">Grade 1</SelectItem>
                <SelectItem value="2">Grade 2</SelectItem>
                <SelectItem value="3">Grade 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Furcation</Label>
            <Select
              value={editedTooth.furcation_grade?.toString() || 'none'}
              onValueChange={(v) => {
                setEditedTooth({ ...editedTooth, furcation_grade: v === 'none' ? null : parseInt(v) })
                setHasChanges(true)
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="1">Grade 1</SelectItem>
                <SelectItem value="2">Grade 2</SelectItem>
                <SelectItem value="3">Grade 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Surfaces */}
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-xs font-semibold">Surface Conditions</Label>
          
          {editedTooth.surfaces.map((surface) => (
            <div key={surface.surface_id} className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm capitalize font-medium">{surface.surface_name}</Label>
                <div
                  className="w-4 h-4 rounded border border-slate-300"
                  style={{ backgroundColor: surface.color_code }}
                />
              </div>

              {/* Condition Type */}
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Condition</Label>
                <Select
                  value={surface.condition_type}
                  onValueChange={(v: ConditionType) => updateSurface(surface.surface_id, { condition_type: v })}
                  disabled={readOnly}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="decay">Decay/Cavity</SelectItem>
                    <SelectItem value="restoration">Restoration/Filling</SelectItem>
                    <SelectItem value="crown">Crown</SelectItem>
                    <SelectItem value="fracture">Fracture</SelectItem>
                    <SelectItem value="wear">Wear</SelectItem>
                    <SelectItem value="abrasion">Abrasion</SelectItem>
                    <SelectItem value="erosion">Erosion</SelectItem>
                    <SelectItem value="stain">Stain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Material Type (for restorations/crowns) */}
              {(surface.condition_type === 'restoration' || surface.condition_type === 'crown') && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Material</Label>
                  <Select
                    value={surface.material_type || 'none'}
                    onValueChange={(v) => updateSurface(surface.surface_id, { 
                      material_type: v === 'none' ? null : (v as MaterialType) 
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="amalgam">Amalgam</SelectItem>
                      <SelectItem value="composite">Composite</SelectItem>
                      <SelectItem value="ceramic">Ceramic</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="porcelain">Porcelain</SelectItem>
                      <SelectItem value="resin">Resin</SelectItem>
                      <SelectItem value="glass_ionomer">Glass Ionomer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Severity (for decay/fracture/wear) */}
              {['decay', 'fracture', 'wear', 'abrasion', 'erosion'].includes(surface.condition_type) && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Severity</Label>
                  <Select
                    value={surface.severity || 'none'}
                    onValueChange={(v) => updateSurface(surface.surface_id, { 
                      severity: v === 'none' ? null : (v as Severity)
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Surface notes */}
              {surface.condition_type !== 'healthy' && (
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Notes</Label>
                  <Textarea
                    value={surface.notes || ''}
                    onChange={(e) => updateSurface(surface.surface_id, { notes: e.target.value })}
                    placeholder="Add surface notes..."
                    rows={2}
                    disabled={readOnly}
                    className="text-xs"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        {!readOnly && hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
