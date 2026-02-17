"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MessageSquare, X } from "lucide-react"

interface Annotation {
  toothNumber: string
  note: string
  timestamp: string
}

interface ToothAnnotationsProps {
  annotations: Annotation[]
  onAddAnnotation: (toothNumber: string, note: string) => void
  onRemoveAnnotation: (toothNumber: string) => void
}

/**
 * Simple annotation system for adding notes to specific teeth
 * Annotations appear as numbered markers on the chart
 */
export function ToothAnnotations({ 
  annotations, 
  onAddAnnotation, 
  onRemoveAnnotation 
}: ToothAnnotationsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState<string>("")
  const [noteText, setNoteText] = useState("")

  const handleSaveNote = () => {
    if (selectedTooth && noteText.trim()) {
      onAddAnnotation(selectedTooth, noteText.trim())
      setNoteText("")
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      {/* Annotation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Annotation</DialogTitle>
            <DialogDescription>
              Add a note or reminder for tooth #{selectedTooth}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={!noteText.trim()}>
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Annotations List */}
      {annotations.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-500" />
            <Label className="text-sm font-medium">Annotations</Label>
          </div>
          
          <div className="space-y-2">
            {annotations.map((annotation, idx) => (
              <div 
                key={`${annotation.toothNumber}-${idx}`}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        Tooth #{annotation.toothNumber}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(annotation.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{annotation.note}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemoveAnnotation(annotation.toothNumber)}
                    className="h-7 w-7 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Annotation marker component for rendering on the SVG chart
 */
export function AnnotationMarker({ 
  x, 
  y, 
  number 
}: { 
  x: number
  y: number
  number: number 
}) {
  return (
    <g className="annotation-marker pointer-events-none">
      <circle
        cx={x}
        cy={y}
        r="8"
        fill="#3b82f6"
        stroke="#fff"
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-white font-bold"
        style={{ fontSize: '10px' }}
      >
        {number}
      </text>
    </g>
  )
}
