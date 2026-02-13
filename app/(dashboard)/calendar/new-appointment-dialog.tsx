"use client"

import { useState } from "react"
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
import { saveAppointment } from "./actions"
import { toast } from "sonner"
import { Plus } from "lucide-react"

interface NewAppointmentDialogProps {
    patients: { id: string; first_name: string; last_name: string }[]
    dentists: { id: string; last_name: string }[]
    trigger?: React.ReactNode
}

export function NewAppointmentDialog({ patients, dentists, trigger }: NewAppointmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

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

        const startDate = new Date(startLocal)
        const endDate = new Date(startDate.getTime() + duration * 60000)

        formData.set("start", startDate.toISOString())
        formData.set("end", endDate.toISOString())

        try {
            await saveAppointment(formData)
            toast.success("Appointment scheduled successfully")
            setOpen(false)
        } catch (error) {
            toast.error("Failed to schedule appointment")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="mr-2 h-4 w-4" /> New Appointment
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>New Appointment</DialogTitle>
                    <DialogDescription>
                        Schedule a new appointment for a patient.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patientId" className="text-right">
                                Patient
                            </Label>
                            <div className="col-span-3">
                                <select
                                    name="patientId"
                                    id="patientId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                                    required
                                >
                                    <option value="">Select a patient</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dentistId" className="text-right">
                                Dentist
                            </Label>
                            <div className="col-span-3">
                                <select
                                    name="dentistId"
                                    id="dentistId"
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

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="treatmentType" className="text-right">
                                Treatment
                            </Label>
                            <Input id="treatmentType" name="treatmentType" placeholder="e.g. Checkup" className="col-span-3" required />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="startLocal" className="text-right">
                                Time
                            </Label>
                            <Input
                                id="startLocal"
                                name="startLocal"
                                type="datetime-local"
                                className="col-span-3"
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
                                defaultValue="30"
                                min="15"
                                step="15"
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Scheduling..." : "Book Appointment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
