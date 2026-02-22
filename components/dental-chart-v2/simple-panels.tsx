"use client"

/**
 * Simplified implementations of specialized panels for V2 dental chart
 * These can be enhanced later with full functionality
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Save, FileText, Upload, Activity } from "lucide-react"
import { toast } from "sonner"
import type { 
  PeriodontalRecord, 
  ChartDiagnosis, 
  ChartTreatmentPlan, 
  ClinicalNote 
} from "@/lib/types/dental-chart-v2"

// ==================== Periodontal Chart Panel ====================
interface PeriodontalPanelProps {
  chartId: string
  patientId: string
  records: PeriodontalRecord[]
}

export function PeriodontalChartPanel({ chartId, patientId, records }: PeriodontalPanelProps) {
  const [selectedTooth, setSelectedTooth] = useState('')
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Periodontal Charting</CardTitle>
        <CardDescription>Track gum health with 6-point probing depths</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <>
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Record New Measurements
            </Button>
            
            {records.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Recent Records</Label>
                {records.slice(0, 5).map((record) => (
                  <div key={record.record_id} className="p-3 bg-slate-50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Tooth {record.tooth_number}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(record.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Depths: {record.probing_depths_mm.mb}, {record.probing_depths_mm.b}, {record.probing_depths_mm.db} | 
                      {record.probing_depths_mm.ml}, {record.probing_depths_mm.l}, {record.probing_depths_mm.dl} mm
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                No periodontal records yet
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Tooth Number (FDI)</Label>
              <Input
                value={selectedTooth}
                onChange={(e) => setSelectedTooth(e.target.value)}
                placeholder="e.g., 16"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">MB</Label>
                <Input type="number" placeholder="mm" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">B</Label>
                <Input type="number" placeholder="mm" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DB</Label>
                <Input type="number" placeholder="mm" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">ML</Label>
                <Input type="number" placeholder="mm" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">L</Label>
                <Input type="number" placeholder="mm" className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">DL</Label>
                <Input type="number" placeholder="mm" className="h-8" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Record
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Diagnosis Manager ====================
interface DiagnosisManagerProps {
  chartId: string
  diagnoses: ChartDiagnosis[]
}

export function DiagnosisManager({ chartId, diagnoses }: DiagnosisManagerProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnoses</CardTitle>
        <CardDescription>Clinical diagnoses with ICD-10/ADA codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <>
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Diagnosis
            </Button>
            
            {diagnoses.length > 0 ? (
              <div className="space-y-2">
                {diagnoses.map((diagnosis) => (
                  <div key={diagnosis.diagnosis_id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{diagnosis.diagnosis_code}</Badge>
                          {diagnosis.tooth_number && (
                            <span className="text-xs text-slate-500">Tooth {diagnosis.tooth_number}</span>
                          )}
                        </div>
                        <p className="text-sm mt-1">{diagnosis.description}</p>
                      </div>
                      <Badge variant={diagnosis.status === 'active' ? 'destructive' : 'secondary'}>
                        {diagnosis.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No diagnoses recorded</p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Diagnosis Code</Label>
              <Input placeholder="e.g., K02.9" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the diagnosis..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tooth (optional)</Label>
                <Input placeholder="FDI number" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Diagnosis
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Treatment Plan Builder ====================
interface TreatmentPlanBuilderProps {
  chartId: string
  treatments: ChartTreatmentPlan[]
}

export function TreatmentPlanBuilder({ chartId, treatments }: TreatmentPlanBuilderProps) {
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Plans</CardTitle>
        <CardDescription>Planned procedures with CDT codes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <>
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Treatment
            </Button>
            
            {treatments.length > 0 ? (
              <div className="space-y-2">
                {treatments.map((treatment) => (
                  <div key={treatment.treatment_id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{treatment.procedure_code}</Badge>
                          {treatment.tooth_number && (
                            <span className="text-xs text-slate-500">Tooth {treatment.tooth_number}</span>
                          )}
                          <Badge variant={
                            treatment.priority === 'urgent' ? 'destructive' :
                            treatment.priority === 'high' ? 'default' : 'secondary'
                          }>
                            {treatment.priority}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{treatment.description}</p>
                        {treatment.estimated_cost && (
                          <p className="text-xs text-slate-500 mt-1">
                            Est: ${treatment.estimated_cost.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Badge variant={treatment.status === 'completed' ? 'default' : 'secondary'}>
                        {treatment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No treatments planned</p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Procedure Code (CDT)</Label>
              <Input placeholder="e.g., D2392" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe the procedure..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Est. Cost ($)</Label>
                <Input type="number" placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Add Treatment
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Clinical Notes Panel ====================
const NOTE_TYPES = [
  { value: "progress", label: "Progress Note" },
  { value: "followup", label: "Follow-up" },
  { value: "treatment", label: "Treatment Note" },
  { value: "observation", label: "Observation" },
  { value: "chief_complaint", label: "Chief Complaint" },
] as const

interface ClinicalNotesPanelProps {
  patientId: string
  chartId: string
  notes: ClinicalNote[]
  onNotesChange?: () => void
}

export function ClinicalNotesPanel({ patientId, chartId, notes: initialNotes, onNotesChange }: ClinicalNotesPanelProps) {
  const [showForm, setShowForm] = useState(false)
  const [noteType, setNoteType] = useState<string>(NOTE_TYPES[0].value)
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState<ClinicalNote[]>(initialNotes)

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  useEffect(() => {
    if (!patientId) return
    fetch(`/api/v2/patients/${patientId}/chart/notes`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => Array.isArray(data) && setNotes(data))
      .catch(() => {})
  }, [patientId])

  const handleSaveNote = async () => {
    if (!content.trim()) {
      toast.error("Enter note content")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/v2/patients/${patientId}/chart/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_type: noteType, content: content.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save note")
      }
      const saved = await res.json()
      setNotes((prev) => [saved, ...prev])
      toast.success("Note saved")
      setContent("")
      setShowForm(false)
      onNotesChange?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save note")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Notes</CardTitle>
        <CardDescription>Progress notes and observations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showForm ? (
          <>
            <Button onClick={() => setShowForm(true)} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            
            {notes.length > 0 ? (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.note_id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline">{note.note_type}</Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">No clinical notes</p>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Enter clinical notes..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={handleSaveNote} disabled={saving}>
                {saving ? "Saving..." : null}
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==================== Attachments Panel ====================
interface AttachmentsPanelProps {
  chartId: string
}

export function AttachmentsPanel({ chartId }: AttachmentsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
        <CardDescription>X-rays, photos, and documents</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
        <p className="text-sm text-slate-500 text-center py-8">
          No files uploaded yet
        </p>
      </CardContent>
    </Card>
  )
}
