"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  X, 
  Plus, 
  Trash2, 
  Save,
  Loader2,
  AlertCircle
} from "lucide-react"
import { 
  Tooth, 
  ToothStatus, 
  ToothSurface,
  SurfaceCode,
  SurfaceStatus,
  ToothDiagnosis,
  DiagnosisSeverity
} from "@/lib/types/dental-chart"

interface ToothDetailPanelProps {
  tooth: Tooth | null
  onUpdate: (tooth: Tooth) => Promise<void>
  onClose: () => void
  readOnly?: boolean
  saving?: boolean
}

const surfaceCodes: SurfaceCode[] = ["M", "D", "O", "I", "B", "L", "F"]

const surfaceLabels: Record<SurfaceCode, string> = {
  M: "Mesial",
  D: "Distal",
  O: "Occlusal",
  I: "Incisal",
  B: "Buccal",
  L: "Lingual",
  F: "Facial"
}

export function ToothDetailPanel({ 
  tooth, 
  onUpdate, 
  onClose, 
  readOnly = false,
  saving = false
}: ToothDetailPanelProps) {
  const [editedTooth, setEditedTooth] = useState<Tooth | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Update edited tooth when tooth prop changes
  useEffect(() => {
    if (tooth) {
      setEditedTooth({ ...tooth })
      setHasChanges(false)
    } else {
      setEditedTooth(null)
    }
  }, [tooth])

  const handleSave = async () => {
    if (editedTooth && hasChanges) {
      await onUpdate(editedTooth)
      setHasChanges(false)
    }
  }

  const updateField = <K extends keyof Tooth>(field: K, value: Tooth[K]) => {
    if (editedTooth) {
      setEditedTooth({ ...editedTooth, [field]: value })
      setHasChanges(true)
    }
  }

  const updateSurface = (surfaceCode: SurfaceCode, status: SurfaceStatus) => {
    if (!editedTooth) return
    
    const surfaces = editedTooth.surfaces.map(s => 
      s.surface_code === surfaceCode ? { ...s, status } : s
    )
    
    setEditedTooth({ ...editedTooth, surfaces })
    setHasChanges(true)
  }

  const addDiagnosis = () => {
    if (!editedTooth) return
    
    const newDiagnosis: ToothDiagnosis = {
      diagnosis_code: "",
      description: "",
      severity: "mild",
      created_at: new Date().toISOString()
    }
    
    setEditedTooth({
      ...editedTooth,
      diagnoses: [...(editedTooth.diagnoses || []), newDiagnosis]
    })
    setHasChanges(true)
  }

  const updateDiagnosis = (index: number, field: keyof ToothDiagnosis, value: any) => {
    if (!editedTooth || !editedTooth.diagnoses) return
    
    const diagnoses = [...editedTooth.diagnoses]
    diagnoses[index] = { ...diagnoses[index], [field]: value }
    
    setEditedTooth({ ...editedTooth, diagnoses })
    setHasChanges(true)
  }

  const removeDiagnosis = (index: number) => {
    if (!editedTooth || !editedTooth.diagnoses) return
    
    const diagnoses = editedTooth.diagnoses.filter((_, i) => i !== index)
    setEditedTooth({ ...editedTooth, diagnoses })
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
          <CardTitle>Tooth #{tooth.tooth_number}</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {tooth.arch} arch, Quadrant {tooth.quadrant}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={editedTooth.status}
            onValueChange={(v) => updateField("status", v as ToothStatus)}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="treated">Treated</SelectItem>
              <SelectItem value="problem">Problem</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="missing">Missing</SelectItem>
              <SelectItem value="extracted">Extracted</SelectItem>
              <SelectItem value="impacted">Impacted</SelectItem>
              <SelectItem value="implant">Implant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={editedTooth.notes || ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Add notes..."
            rows={3}
            disabled={readOnly}
          />
        </div>

        {/* Surfaces with Visual Selector */}
        <div className="space-y-3">
          <Label>Surfaces</Label>
          
          {/* Mini tooth diagram for visual reference */}
          <div className="bg-slate-50 p-4 rounded-lg border">
            <svg viewBox="0 0 100 100" className="w-full h-32">
              {/* Simple tooth outline */}
              <rect x="30" y="20" width="40" height="50" rx="8" fill="#f5f1e8" stroke="#64748b" strokeWidth="2" />
              
              {/* Surface labels */}
              <text x="10" y="48" className="text-xs fill-slate-600" fontSize="10">M</text>
              <text x="85" y="48" className="text-xs fill-slate-600" fontSize="10">D</text>
              <text x="50" y="15" textAnchor="middle" className="text-xs fill-slate-600" fontSize="10">O</text>
              <text x="50" y="50" textAnchor="middle" className="text-xs fill-slate-600" fontSize="10">B/F</text>
              <text x="50" y="95" textAnchor="middle" className="text-xs fill-slate-600" fontSize="10">L</text>
              
              {/* Surface status indicators */}
              {editedTooth.surfaces.map((surface) => {
                const statusColor = surface.status === 'decay' ? '#ef4444' : 
                                  surface.status === 'filled' ? '#3b82f6' : 
                                  surface.status === 'crown' ? '#8b5cf6' :
                                  surface.status === 'fracture' ? '#f97316' : '#10b981'
                const surfaceCode = surface.surface_code
                let cx = 50, cy = 50
                if (surfaceCode === 'M') cx = 35
                if (surfaceCode === 'D') cx = 65
                if (surfaceCode === 'O' || surfaceCode === 'I') cy = 30
                if (surfaceCode === 'B' || surfaceCode === 'F') cy = 45
                if (surfaceCode === 'L') cy = 60
                
                return surface.status !== 'healthy' ? (
                  <circle key={surface.surface_code} cx={cx} cy={cy} r="4" fill={statusColor} />
                ) : null
              })}
            </svg>
            <p className="text-xs text-slate-500 text-center mt-2">
              M=Mesial, D=Distal, O=Occlusal, B/F=Buccal/Facial, L=Lingual
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {editedTooth.surfaces.map((surface) => (
              <div key={surface.surface_code} className="space-y-1">
                <Label className="text-xs text-slate-500">
                  {surfaceLabels[surface.surface_code]}
                </Label>
                <Select
                  value={surface.status}
                  onValueChange={(v) => updateSurface(surface.surface_code, v as SurfaceStatus)}
                  disabled={readOnly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="decay">Cavity/Decay</SelectItem>
                    <SelectItem value="filled">Filled/Restoration</SelectItem>
                    <SelectItem value="crown">Crown</SelectItem>
                    <SelectItem value="fracture">Fracture</SelectItem>
                    <SelectItem value="planned">Planned Treatment</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Treatment Planning */}
        <div className="space-y-2 pt-2 border-t">
          <Label>Planned Treatment</Label>
          <Select
            value={editedTooth.status === 'planned' ? 'planned' : 'none'}
            onValueChange={(v) => {
              if (v !== 'none') {
                updateField("status", "planned")
              }
            }}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select treatment..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No planned treatment</SelectItem>
              <SelectItem value="filling">Filling/Restoration</SelectItem>
              <SelectItem value="crown">Crown</SelectItem>
              <SelectItem value="root_canal">Root Canal</SelectItem>
              <SelectItem value="extraction">Extraction</SelectItem>
              <SelectItem value="implant">Implant</SelectItem>
              <SelectItem value="veneer">Veneer</SelectItem>
              <SelectItem value="onlay">Onlay/Inlay</SelectItem>
            </SelectContent>
          </Select>
          {editedTooth.status === 'planned' && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Treatment planned
            </Badge>
          )}
        </div>

        {/* Diagnoses */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Diagnoses</Label>
            {!readOnly && (
              <Button
                size="sm"
                variant="outline"
                onClick={addDiagnosis}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            )}
          </div>

          {(!editedTooth.diagnoses || editedTooth.diagnoses.length === 0) && (
            <p className="text-sm text-slate-500 italic">No diagnoses recorded</p>
          )}

          {editedTooth.diagnoses && editedTooth.diagnoses.map((diagnosis, idx) => (
            <div key={idx} className="p-3 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Input
                  placeholder="Diagnosis code"
                  value={diagnosis.diagnosis_code}
                  onChange={(e) => updateDiagnosis(idx, "diagnosis_code", e.target.value)}
                  disabled={readOnly}
                  className="text-sm"
                />
                {!readOnly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeDiagnosis(idx)}
                    className="h-8 w-8 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <Input
                placeholder="Description"
                value={diagnosis.description}
                onChange={(e) => updateDiagnosis(idx, "description", e.target.value)}
                disabled={readOnly}
                className="text-sm"
              />
              
              <Select
                value={diagnosis.severity}
                onValueChange={(v) => updateDiagnosis(idx, "severity", v as DiagnosisSeverity)}
                disabled={readOnly}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Save Button */}
        {!readOnly && hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
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
