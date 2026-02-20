"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { DocumentScanFlow } from "@/components/patients/document-scan-flow"

type NewWalkInDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPatientId?: string
}

type Patient = {
  id: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
}

type Staff = {
  id: string
  first_name?: string | null
  last_name?: string | null
  role?: string | null
}

export function NewWalkInDialog({ open, onOpenChange, defaultPatientId }: NewWalkInDialogProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  const [patientQuery, setPatientQuery] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const [showCreatePatient, setShowCreatePatient] = useState(false)
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [creatingPatient, setCreatingPatient] = useState(false)

  const [dentistQuery, setDentistQuery] = useState("")
  const [selectedDentist, setSelectedDentist] = useState<Staff | null>(null)

  const [reason, setReason] = useState("")
  const [duration, setDuration] = useState(30)
  const [submitting, setSubmitting] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const fetchData = async () => {
      try {
        const [patientsRes, staffRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/staff"),
        ])

        if (patientsRes.ok) {
          const data = await patientsRes.json()
          setPatients(Array.isArray(data) ? data : [])
        }
        if (staffRes.ok) {
          const data = await staffRes.json()
          setStaff(Array.isArray(data) ? data : [])
        }
      } catch (e) {
        console.error("[NEW_WALK_IN_DIALOG_FETCH]", e)
      }
    }

    fetchData()
  }, [open])

  useEffect(() => {
    if (!defaultPatientId || !patients.length) return
    const match = patients.find((p) => p.id === defaultPatientId)
    if (match) {
      setSelectedPatient(match)
      setPatientQuery("")
    }
  }, [defaultPatientId, patients])

  const patientOptions = useMemo(() => {
    const q = patientQuery.trim().toLowerCase()
    if (!q) return patients.slice(0, 10)
    return patients
      .filter((p) => {
        const name = `${p.first_name || ""} ${p.last_name || ""}`.toLowerCase()
        const phone = (p.phone || "").toLowerCase()
        return name.includes(q) || phone.includes(q)
      })
      .slice(0, 10)
  }, [patients, patientQuery])

  const dentistOptions = useMemo(() => {
    const dentistsOnly = staff.filter((s) => {
      const r = (s.role || "").toLowerCase()
      return r === "dentist" || r === "clinic_admin" || r === "hygienist"
    })
    const q = dentistQuery.trim().toLowerCase()
    if (!q) return dentistsOnly.slice(0, 10)
    return dentistsOnly
      .filter((s) => {
        const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase()
        const role = (s.role || "").toLowerCase()
        return name.includes(q) || role.includes(q)
      })
      .slice(0, 10)
  }, [staff, dentistQuery])

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Select a patient")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/walk-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          dentist_id: selectedDentist?.id ?? null,
          treatment_type: reason || "Walk-in",
          duration_minutes: duration,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to create walk-in")
        return
      }
      toast.success("Walk-in added to today’s queue")
      onOpenChange(false)
    } catch (e) {
      console.error("[NEW_WALK_IN_DIALOG_SUBMIT]", e)
      toast.error("Could not create walk-in")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreatePatient = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      toast.error("First and last name are required")
      return
    }
    setCreatingPatient(true)
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: newFirstName.trim(),
          last_name: newLastName.trim(),
          phone: newPhone.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "Failed to create patient")
        return
      }
      // Add to local list and select
      setPatients((prev) => [data, ...prev])
      setSelectedPatient(data)
      setPatientQuery("")
      setShowCreatePatient(false)
      toast.success("Patient created")
    } catch (e) {
      console.error("[NEW_WALK_IN_CREATE_PATIENT]", e)
      toast.error("Could not create patient")
    } finally {
      setCreatingPatient(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New walk-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Patient</Label>
            {selectedPatient && (
              <p className="text-xs text-slate-500 mb-1">
                Selected:{" "}
                <span className="font-medium text-slate-900">
                  {(selectedPatient.first_name || "") + " " + (selectedPatient.last_name || "")}
                </span>{" "}
                {selectedPatient.phone ? `· ${selectedPatient.phone}` : null}
              </p>
            )}
            <Input
              placeholder="Search by name or phone"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
            {patientOptions.length > 0 && patientQuery.trim().length > 0 && (
              <div className="mt-1 max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
                {patientOptions.map((p) => {
                  const name = `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unnamed patient"
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={cn(
                        "w-full flex flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50",
                        selectedPatient?.id === p.id && "bg-teal-50"
                      )}
                      onClick={() => {
                        setSelectedPatient(p)
                        setPatientQuery("")
                      }}
                    >
                      <span className="font-medium text-slate-900">{name}</span>
                      {p.phone ? (
                        <span className="text-xs text-slate-500">{p.phone}</span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}

            {patientOptions.length === 0 && patientQuery.trim().length >= 2 && !selectedPatient && (
              <button
                type="button"
                className="mt-1 text-xs text-teal-700 hover:text-teal-800"
                onClick={() => {
                  const parts = patientQuery.trim().split(/\s+/)
                  const first = parts[0] || ""
                  const last = parts.slice(1).join(" ")
                  setNewFirstName(first)
                  setNewLastName(last)
                  setShowCreatePatient(true)
                }}
              >
                + Add “{patientQuery.trim()}” as new patient
              </button>
            )}

            {showCreatePatient && (
              <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-700">New patient details</p>
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setScanOpen(true)}>
                    Scan ID to fill
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">First name</Label>
                    <Input
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Last name</Label>
                    <Input
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone (optional)</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowCreatePatient(false)}
                    disabled={creatingPatient}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs bg-teal-600 hover:bg-teal-700"
                    onClick={handleCreatePatient}
                    disabled={creatingPatient}
                  >
                    {creatingPatient ? "Creating…" : "Add patient"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Dentist (optional)</Label>
            {selectedDentist && (
              <p className="text-xs text-slate-500 mb-1">
                Selected:{" "}
                <span className="font-medium text-slate-900">
                  {(selectedDentist.first_name || "") + " " + (selectedDentist.last_name || "")}
                </span>{" "}
                {selectedDentist.role ? `· ${(selectedDentist.role || "").replace("_", " ")}` : null}
              </p>
            )}
            <Input
              placeholder="Search by name or role"
              value={dentistQuery}
              onChange={(e) => setDentistQuery(e.target.value)}
            />
            {dentistOptions.length > 0 && dentistQuery.trim().length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm">
                {dentistOptions.map((s) => {
                  const name = `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Unnamed staff"
                  const role = (s.role || "").replace("_", " ")
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={cn(
                        "w-full flex flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50",
                        selectedDentist?.id === s.id && "bg-teal-50"
                      )}
                      onClick={() => {
                        setSelectedDentist(s)
                        setDentistQuery("")
                      }}
                    >
                      <span className="font-medium text-slate-900">{name}</span>
                      {role ? <span className="text-xs text-slate-500 capitalize">{role}</span> : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Input
              placeholder="Emergency, hygiene, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min={10}
              max={240}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 30)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
            {submitting ? "Creating…" : "Create walk-in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <DocumentScanFlow
      open={scanOpen}
      onOpenChange={setScanOpen}
      mode="id"
      onApplyId={(fields) => {
        if (fields.firstName) setNewFirstName(fields.firstName)
        if (fields.lastName) setNewLastName(fields.lastName)
        if (fields.phone) setNewPhone(fields.phone)
        toast.success("Form filled from scan. Review and add patient.")
      }}
    />
    </>
  )
}

