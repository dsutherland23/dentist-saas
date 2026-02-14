"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { saveAppointment } from "./actions"
import { toast } from "sonner"
import { Plus, UserPlus, Ban } from "lucide-react"
import { ManagePatientDialog } from "@/app/(dashboard)/patients/manage-patient-dialog"

interface NewAppointmentDialogProps {
    patients: { id: string; first_name: string; last_name: string }[]
    dentists: { id: string; first_name?: string; last_name: string }[]
    trigger?: React.ReactNode
    /** When set (e.g. from patient profile), this patient is pre-selected */
    defaultPatientId?: string
    /** Controlled open state - when set, dialog can be opened programmatically */
    open?: boolean
    onOpenChange?: (open: boolean) => void
    /** Pre-fill date/time when opening from calendar slot click */
    initialStartDate?: Date
}

export function NewAppointmentDialog({
    patients,
    dentists,
    trigger,
    defaultPatientId,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    initialStartDate,
}: NewAppointmentDialogProps) {
    const router = useRouter()
    const [internalOpen, setInternalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [treatments, setTreatments] = useState<{ id: string; name: string; duration_minutes?: number }[]>([])
    const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId ?? "")
    const [selectedDentistId, setSelectedDentistId] = useState("")
    const [localPatients, setLocalPatients] = useState(patients)
    const [duration, setDuration] = useState(30)
    const [blockTimeSlot, setBlockTimeSlot] = useState(false)
    const [blockReason, setBlockReason] = useState("")

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen

    useEffect(() => {
        setLocalPatients(patients)
    }, [patients])

    useEffect(() => {
        setSelectedPatientId(defaultPatientId ?? "")
    }, [defaultPatientId, open])

    useEffect(() => {
        if (open) {
            setDuration(30)
            setBlockTimeSlot(false)
            setBlockReason("")
        }
    }, [open])

    useEffect(() => {
        fetch("/api/treatments")
            .then((res) => res.ok ? res.json() : [])
            .then((data) => setTreatments(data || []))
            .catch(() => setTreatments([]))
    }, [])

    const formatDateTimeLocal = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, "0")
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const formData = new FormData(event.currentTarget)

        // Convert datetime-local to ISO string
        const startLocal = formData.get("startLocal") as string
        const duration = parseInt(formData.get("duration") as string) || 30 // minutes

        if (!startLocal) {
            toast.error("Please select a start time")
            setIsLoading(false)
            return
        }

        if (!selectedDentistId) {
            toast.error("Please select a dentist")
            setIsLoading(false)
            return
        }

        if (!blockTimeSlot && !selectedPatientId) {
            toast.error("Please select a patient")
            setIsLoading(false)
            return
        }

        const startDate = new Date(startLocal)
        if (startDate.getTime() < Date.now()) {
            toast.error("Appointments cannot be scheduled in the past")
            setIsLoading(false)
            return
        }

        const endDate = new Date(startDate.getTime() + duration * 60000)

        formData.set("start", startDate.toISOString())
        formData.set("end", endDate.toISOString())
        if (selectedPatientId) formData.set("patientId", selectedPatientId)
        if (selectedDentistId) formData.set("dentistId", selectedDentistId)

        try {
            if (blockTimeSlot) {
                const res = await fetch("/api/blocked-slots", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        staff_id: selectedDentistId,
                        start_time: startDate.toISOString(),
                        end_time: endDate.toISOString(),
                        reason: blockReason.trim() || null,
                    }),
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    throw new Error(err.error || "Failed to block time slot")
                }
                toast.success("Time slot blocked successfully")
            } else {
                await saveAppointment(formData)
                toast.success("Appointment scheduled successfully")
            }
            setOpen(false)
            router.refresh()
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : "Unknown error"
            toast.error(blockTimeSlot ? (errMsg || "Failed to block time slot") : (errMsg || "Failed to schedule appointment"))
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {(trigger || !isControlled) && (
                <DialogTrigger asChild>
                    {trigger || (
                        <Button className="bg-teal-600 hover:bg-teal-700">
                            <Plus className="mr-2 h-4 w-4" /> New Appointment
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a new appointment for a patient.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                            <div className="col-span-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Ban className="h-4 w-4 text-slate-500" />
                                        <Label htmlFor="blockTimeSlot" className="text-sm font-medium cursor-pointer">
                                            Block this time slot (no appointments)
                                        </Label>
                                    </div>
                                    <Switch
                                        id="blockTimeSlot"
                                        checked={blockTimeSlot}
                                        onCheckedChange={setBlockTimeSlot}
                                    />
                                </div>
                                {blockTimeSlot && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="blockReason" className="text-right">
                                            Reason
                                        </Label>
                                        <Input
                                            id="blockReason"
                                            value={blockReason}
                                            onChange={(e) => setBlockReason(e.target.value)}
                                            placeholder="e.g. Lunch break, Meeting, Personal"
                                            className="col-span-3"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {!blockTimeSlot && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patientId" className="text-right">
                                Patient
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <select
                                    name="patientId"
                                    id="patientId"
                                    value={selectedPatientId}
                                    onChange={(e) => setSelectedPatientId(e.target.value)}
                                    className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    required
                                >
                                    <option value="">Select a patient</option>
                                    {localPatients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name}
                                        </option>
                                    ))}
                                </select>
                                <ManagePatientDialog
                                    trigger={
                                        <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" title="New Patient">
                                            <UserPlus className="h-4 w-4 text-teal-600" />
                                        </Button>
                                    }
                                    onSuccess={(newPatient) => {
                                        setLocalPatients(prev => [...prev, newPatient])
                                        setSelectedPatientId(newPatient.id)
                                        router.refresh()
                                    }}
                                />
                            </div>
                        </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dentistId" className="text-right">
                                Dentist
                            </Label>
                            <div className="col-span-3">
                                <select
                                    name="dentistId"
                                    id="dentistId"
                                    value={selectedDentistId}
                                    onChange={(e) => setSelectedDentistId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    required
                                >
                                    <option value="">Select a dentist</option>
                                    {dentists.map(d => (
                                        <option key={d.id} value={d.id}>
                                            Dr. {d.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {!blockTimeSlot && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="treatmentType" className="text-right">
                                Treatment
                            </Label>
                            <div className="col-span-3">
                                {treatments.length > 0 ? (
                                    <select
                                        name="treatmentType"
                                        id="treatmentType"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                        required
                                        onChange={(e) => {
                                            const val = e.target.value
                                            const t = treatments.find(tr => tr.name === val)
                                            if (t?.duration_minutes) setDuration(t.duration_minutes)
                                        }}
                                    >
                                        <option value="">Select treatment</option>
                                        {treatments.map(t => (
                                            <option key={t.id} value={t.name}>
                                                {t.name} {t.duration_minutes ? `(${t.duration_minutes} min)` : ""}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <Input id="treatmentType" name="treatmentType" placeholder="e.g. Checkup" className="col-span-3" required />
                                )}
                            </div>
                        </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startLocal" className="text-right">
                                Time
                            </Label>
                            <Input
                                key={initialStartDate ? initialStartDate.toISOString() : "empty"}
                                id="startLocal"
                                name="startLocal"
                                type="datetime-local"
                                className="col-span-3"
                                min={formatDateTimeLocal(new Date())}
                                defaultValue={
                                    initialStartDate
                                        ? formatDateTimeLocal(initialStartDate.getTime() >= Date.now() ? initialStartDate : new Date())
                                        : undefined
                                }
                                required
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="duration" className="text-right">
                                Duration (min)
                            </Label>
                            <Input
                                id="duration"
                                name="duration"
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                                min="15"
                                step="15"
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading
                                ? blockTimeSlot ? "Blocking..." : "Scheduling..."
                                : blockTimeSlot ? "Block Time" : "Book Appointment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
