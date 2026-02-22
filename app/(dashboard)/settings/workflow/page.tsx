"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, GripVertical, Plus, Trash2, Loader2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import { getStepsForTemplate, validateCustomConfig, type WorkflowTemplateConfig, type WorkflowTemplateNode, type WorkflowStep } from "@/lib/workflow-templates"
import type { VisitState, TransitionRole } from "@/lib/visit-state-machine"

type StageLibraryItem = { state: VisitState; label: string; defaultRole: string }

/** Convert preset steps to editable nodes (no duplicate states: merge consecutive same-state steps). */
function presetStepsToNodes(
  steps: WorkflowStep[],
  stageLibrary: StageLibraryItem[]
): WorkflowTemplateNode[] {
  const nodes: WorkflowTemplateNode[] = []
  const seenStates = new Set<VisitState>()
  for (const step of steps) {
    const state = step.state
    const role = stageLibrary.find((s) => s.state === state)?.defaultRole as TransitionRole | undefined
    if (seenStates.has(state)) continue
    seenStates.add(state)
    nodes.push({
      state,
      label: step.label,
      assigned_role: role ?? "FRONT_DESK",
    })
  }
  return nodes
}

export default function SettingsWorkflowPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templates, setTemplates] = useState<{ id: string; name: string; config: WorkflowTemplateConfig }[]>([])
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)
  const [presetTemplate, setPresetTemplate] = useState<string>("full_clinic_workflow")
  const [stageLibrary, setStageLibrary] = useState<StageLibraryItem[]>([])
  const [nodes, setNodes] = useState<WorkflowTemplateNode[]>([])
  const [templateName, setTemplateName] = useState("Custom flow")

  useEffect(() => {
    let cancelled = false
    async function fetchWorkflow() {
      try {
        const res = await fetch("/api/settings/workflow")
        if (!res.ok) throw new Error("Failed to load workflow")
        const data = await res.json()
        if (cancelled) return
        setTemplates(data.templates ?? [])
        setActiveWorkflowId(data.activeWorkflowId ?? null)
        const preset = data.presetTemplate ?? "full_clinic_workflow"
        setPresetTemplate(preset)
        const library = (data.stageLibrary ?? []) as StageLibraryItem[]
        setStageLibrary(library)
        const active = (data.templates ?? []).find((t: { id: string }) => t.id === data.activeWorkflowId)
        if (active?.config?.nodes?.length) {
          setNodes(active.config.nodes)
          setTemplateName(active.name || "Custom flow")
        } else {
          const steps = getStepsForTemplate(preset)
          setNodes(presetStepsToNodes(steps, library))
          setTemplateName(preset === "default_clinic_workflow" ? "Default (no hygiene)" : "Full (with hygiene)")
        }
      } catch (e) {
        if (!cancelled) toast.error("Failed to load workflow settings")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchWorkflow()
    return () => { cancelled = true }
  }, [])

  const usedStates = new Set(nodes.map((n) => n.state))
  const availableStages = stageLibrary.filter((s) => !usedStates.has(s.state))

  const handleMove = (index: number, dir: "up" | "down") => {
    const newNodes = [...nodes]
    const i = dir === "up" ? index - 1 : index
    if (i < 0 || i >= newNodes.length - 1) return
    ;[newNodes[i], newNodes[i + 1]] = [newNodes[i + 1], newNodes[i]]
    setNodes(newNodes)
  }

  const handleRemove = (index: number) => {
    const newNodes = nodes.filter((_, i) => i !== index)
    setNodes(newNodes)
  }

  const handleAddStage = (state: VisitState) => {
    const stage = stageLibrary.find((s) => s.state === state)
    if (!stage) return
    setNodes((prev) => [...prev, { state: stage.state, label: stage.label, assigned_role: stage.defaultRole as WorkflowTemplateNode["assigned_role"] }])
  }

  const handleSave = async () => {
    const config: WorkflowTemplateConfig = { nodes }
    const validation = validateCustomConfig(config)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }
    setSaving(true)
    try {
      if (activeWorkflowId) {
        const res = await fetch(`/api/settings/workflow/${activeWorkflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: templateName, config }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || "Failed to update")
        }
        toast.success("Workflow updated")
      } else {
        const res = await fetch("/api/settings/workflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: templateName, config }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || "Failed to save")
        }
        const data = await res.json()
        setActiveWorkflowId(data.activeWorkflowId ?? data.template?.id)
        setTemplates((prev) => [...prev, data.template || { id: data.activeWorkflowId, name: templateName, config }])
        toast.success("Workflow saved and set as active")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const workflowSelectorValue = activeWorkflowId
    ? `custom:${activeWorkflowId}`
    : `preset:${presetTemplate}`

  const handleWorkflowSelect = async (value: string) => {
    if (value.startsWith("preset:")) {
      const preset = value.slice(7) as "default_clinic_workflow" | "full_clinic_workflow"
      setSaving(true)
      try {
        const res = await fetch("/api/settings/clinic", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active_workflow_id: null, workflow_template: preset }),
        })
        if (!res.ok) throw new Error("Failed to switch preset")
        setActiveWorkflowId(null)
        setPresetTemplate(preset)
        const steps = getStepsForTemplate(preset)
        setNodes(presetStepsToNodes(steps, stageLibrary))
        setTemplateName(preset === "default_clinic_workflow" ? "Default (no hygiene)" : "Full (with hygiene)")
        toast.success(preset === "default_clinic_workflow" ? "Using default workflow (no hygiene)" : "Using full workflow (with hygiene)")
      } catch {
        toast.error("Failed to switch to preset")
      } finally {
        setSaving(false)
      }
    } else if (value.startsWith("custom:")) {
      const id = value.slice(7)
      const template = templates.find((t) => t.id === id)
      if (!template) return
      setSaving(true)
      try {
        const res = await fetch("/api/settings/clinic", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active_workflow_id: id }),
        })
        if (!res.ok) throw new Error("Failed to switch workflow")
        setActiveWorkflowId(id)
        setPresetTemplate("full_clinic_workflow")
        setNodes(template.config?.nodes ?? [])
        setTemplateName(template.name || "Custom flow")
        toast.success("Using custom workflow")
      } catch {
        toast.error("Failed to switch to custom workflow")
      } finally {
        setSaving(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50 min-h-screen max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/settings" className="hover:text-teal-600">Settings</Link>
        <span>/</span>
        <span className="text-slate-700 font-medium">Visit workflow</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-900">Visit workflow</h1>
        <p className="text-sm text-slate-500 mt-1">
          Build the order of stages for patient visits. Use presets or create a custom flow (e.g. dentist + front desk only).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active workflow</CardTitle>
          <CardDescription>Choose a preset or a custom template. The flow below is editable for all.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={workflowSelectorValue} onValueChange={handleWorkflowSelect} disabled={saving}>
            <SelectTrigger className="w-full max-w-sm">
              <SelectValue placeholder="Select workflow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preset:default_clinic_workflow">Default (no hygiene)</SelectItem>
              <SelectItem value="preset:full_clinic_workflow">Full (with hygiene)</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={`custom:${t.id}`}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom workflow</CardTitle>
          <CardDescription>
            {activeWorkflowId ? "Reorder or edit stages below, then Save." : "Add or remove stages and reorder. Save to create and activate your custom flow."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value.slice(0, 255))}
              className="h-9 rounded-md border border-slate-200 px-3 text-sm w-48"
              placeholder="Template name"
            />
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Flow (order of stages)</p>
            {nodes.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">No stages. Add one below.</p>
            ) : (
              <ul className="space-y-2">
                {nodes.map((node, index) => (
                  <li
                    key={`${node.state}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    <GripVertical className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
                    <span className="flex-1 text-sm font-medium text-slate-900">{node.label || node.state}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                      {node.assigned_role.replace("_", " ")}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleMove(index, "down")}
                        disabled={index === nodes.length - 1}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {availableStages.length > 0 && (
              <div className="pt-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                      <Plus className="h-4 w-4" />
                      Add stage
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {availableStages.map((s) => (
                      <DropdownMenuItem key={s.state} onClick={() => handleAddStage(s.state)}>
                        {s.label} ({s.defaultRole.replace("_", " ")})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {nodes.length > 0 && (
            <p className="text-xs text-slate-500">
              First stage must be Check-In, last must be Visit completed. Reorder with arrows, then Save to apply.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="text-sm text-slate-500">
        <Link href="/settings" className="inline-flex items-center gap-1 text-teal-600 hover:underline">
          <ChevronLeft className="h-4 w-4" />
          Back to Settings
        </Link>
      </div>
    </div>
  )
}
