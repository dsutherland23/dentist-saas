"use client"

import { useState, useEffect, useMemo } from "react"
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
import { savePatient } from "./actions"
import { toast } from "sonner"
import { Plus, UserPlus, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { DocumentScanFlow } from "@/components/patients/document-scan-flow"

type PatientOption = {
    id: string
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
}

interface ManagePatientDialogProps {
    trigger?: React.ReactNode
    /** Called when patient is successfully added; receives the new patient */
    onSuccess?: (patient: { id: string; first_name: string; last_name: string }) => void
}

function calculateAge(dob: string | null): string | null {
    if (!dob) return null
    const birth = new Date(dob)
    if (isNaN(birth.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    if (age < 0) return null
    return age === 1 ? "1 year" : `${age} years`
}

export function ManagePatientDialog({ trigger, onSuccess }: ManagePatientDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [dateOfBirth, setDateOfBirth] = useState("")

    const [patients, setPatients] = useState<PatientOption[]>([])
    const [patientQuery, setPatientQuery] = useState("")
    const [showNewForm, setShowNewForm] = useState(false)
    const [selectedExisting, setSelectedExisting] = useState<PatientOption | null>(null)
    const [newFirstName, setNewFirstName] = useState("")
    const [newLastName, setNewLastName] = useState("")
    const [newEmail, setNewEmail] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const [scanOpen, setScanOpen] = useState(false)

    useEffect(() => {
        if (!open) {
            setPatientQuery("")
            setShowNewForm(false)
            setSelectedExisting(null)
            setDateOfBirth("")
            setNewFirstName("")
            setNewLastName("")
            setNewEmail("")
            setNewPhone("")
            return
        }
        const fetchPatients = async () => {
            try {
                const res = await fetch("/api/patients")
                if (res.ok) {
                    const data = await res.json()
                    setPatients(Array.isArray(data) ? data : [])
                }
            } catch (e) {
                console.error("[ManagePatientDialog] fetch patients", e)
            }
        }
        fetchPatients()
    }, [open])

    const matches = useMemo(() => {
        const q = patientQuery.trim().toLowerCase()
        if (!q) return patients.slice(0, 10)
        return patients
            .filter((p) => {
                const name = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase()
                const phone = (p.phone ?? "").toLowerCase()
                return name.includes(q) || phone.includes(q)
            })
            .slice(0, 10)
    }, [patients, patientQuery])

    const hasQuery = patientQuery.trim().length >= 2
    const noMatches = hasQuery && matches.length === 0

    const openNewForm = (prefillFirst?: string, prefillLast?: string) => {
        setNewFirstName(prefillFirst ?? "")
        setNewLastName(prefillLast ?? "")
        setShowNewForm(true)
        setSelectedExisting(null)
    }

    const backToSearch = () => {
        setShowNewForm(false)
        setSelectedExisting(null)
        setPatientQuery("")
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        const form = event.currentTarget
        const formData = new FormData(form)

        try {
            const result = await savePatient(formData)
            toast.success("Patient added successfully")
            setOpen(false)
            if (result?.patient && onSuccess) onSuccess(result.patient)
        } catch (error) {
            toast.error("Failed to add patient")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleViewExisting = (p: PatientOption) => {
        setOpen(false)
        router.push(`/patients/${p.id}`)
    }

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-teal-600 hover:bg-teal-700">
                        <Plus className="mr-2 h-4 w-4" /> Add Patient
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Patient</DialogTitle>
                    <DialogDescription>
                        {showNewForm
                            ? "Add a new patient to your clinic's registry."
                            : "Search for an existing patient to avoid duplicates, or add a new one."}
                    </DialogDescription>
                </DialogHeader>

                {!showNewForm ? (
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Search by name or phone</Label>
                            <Input
                                placeholder="Type to search..."
                                value={patientQuery}
                                onChange={(e) => {
                                    setPatientQuery(e.target.value)
                                    setSelectedExisting(null)
                                }}
                                autoFocus
                            />
                        </div>

                        {selectedExisting ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                                <p className="text-sm font-medium text-amber-900">Patient already in registry</p>
                                <p className="text-sm text-slate-700">
                                    {[selectedExisting.first_name, selectedExisting.last_name].filter(Boolean).join(" ")}
                                    {selectedExisting.phone ? ` · ${selectedExisting.phone}` : ""}
                                </p>
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => handleViewExisting(selectedExisting)}>
                                        View profile
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedExisting(null)}>
                                        Search again
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {matches.length > 0 && patientQuery.trim().length > 0 && (
                                    <div className="max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white">
                                        <p className="text-xs font-medium text-slate-500 px-3 pt-2 pb-1">Existing patients</p>
                                        {matches.map((p) => {
                                            const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Unnamed"
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    className={cn(
                                                        "w-full flex flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50 border-t border-slate-100 first:border-t-0"
                                                    )}
                                                    onClick={() => setSelectedExisting(p)}
                                                >
                                                    <span className="font-medium text-slate-900">{name}</span>
                                                    {p.phone ? <span className="text-xs text-slate-500">{p.phone}</span> : null}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {noMatches && (
                                    <button
                                        type="button"
                                        className="w-full text-left text-sm text-teal-700 hover:text-teal-800 py-2 px-3 rounded-md border border-dashed border-teal-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
                                        onClick={() => {
                                            const parts = patientQuery.trim().split(/\s+/)
                                            openNewForm(parts[0] ?? "", parts.slice(1).join(" "))
                                        }}
                                    >
                                        + Add &quot;{patientQuery.trim()}&quot; as new patient
                                    </button>
                                )}

                                <div className="pt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        className="text-sm text-slate-600 hover:text-teal-600 flex items-center gap-2"
                                        onClick={() => openNewForm()}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Add as new patient (skip search)
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="flex justify-end">
                                <Button type="button" variant="outline" size="sm" onClick={() => setScanOpen(true)}>
                                    <ScanLine className="h-4 w-4 mr-2" />
                                    Scan ID to fill
                                </Button>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="firstName" className="text-right">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    className="col-span-3"
                                    value={newFirstName}
                                    onChange={(e) => setNewFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="lastName" className="text-right">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    className="col-span-3"
                                    value={newLastName}
                                    onChange={(e) => setNewLastName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" name="email" type="email" className="col-span-3" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">Phone</Label>
                                <Input id="phone" name="phone" type="tel" className="col-span-3" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="dateOfBirth" className="text-right">DOB</Label>
                                <div className="col-span-3 flex items-center gap-3">
                                    <Input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                    />
                                    {calculateAge(dateOfBirth) && (
                                        <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                                            Age: {calculateAge(dateOfBirth)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={backToSearch} disabled={isLoading}>
                                Back
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Saving..." : "Save Patient"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
        <DocumentScanFlow
            open={scanOpen}
            onOpenChange={setScanOpen}
            mode="id"
            onApplyId={(fields) => {
                if (fields.firstName) setNewFirstName(fields.firstName)
                if (fields.lastName) setNewLastName(fields.lastName)
                if (fields.dateOfBirth) setDateOfBirth(fields.dateOfBirth)
                if (fields.phone) setNewPhone(fields.phone)
                if (fields.email) setNewEmail(fields.email)
                toast.success("Form filled from scan. Review and save.")
            }}
        />
        </>
    )
}
