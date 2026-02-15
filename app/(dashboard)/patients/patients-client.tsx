"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Filter, CalendarCheck, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ManagePatientDialog } from "./manage-patient-dialog"
import { NewInvoiceDialog } from "@/app/(dashboard)/invoices/new-invoice-dialog"
import { deletePatient } from "./actions"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { format } from "date-fns"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"

export interface TodayAppointment {
    id: string
    patient_id: string
    start_time: string
    end_time: string
    status: string
    treatment_type?: string
}

interface Patient {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    insurance_provider?: string
}

type FilterTab = "all" | "expected_today" | "checked_in"

export default function PatientsClient({
    initialPatients,
    todayAppointments = []
}: {
    initialPatients: Patient[]
    todayAppointments?: TodayAppointment[]
}) {
    const [searchTerm, setSearchTerm] = useState("")
    const [filterTab, setFilterTab] = useState<FilterTab>("all")
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)
    const router = useRouter()
    const searchParams = useSearchParams()

    const checkedInPatientIds = new Set(
        todayAppointments
            .filter((a) => a.status === "checked_in" || a.status === "in_treatment")
            .map((a) => a.patient_id)
    )
    const expectedTodayPatientIds = new Set(
        todayAppointments
            .filter((a) => ["pending", "unconfirmed", "scheduled", "confirmed"].includes(a.status))
            .map((a) => a.patient_id)
    )
    const expectedTodayCount = expectedTodayPatientIds.size
    const checkedInCount = checkedInPatientIds.size

    // Resolve actual calendar/appointment status for today (prefer most active first)
    const getPatientAppointmentStatus = (patientId: string): string | null => {
        const patientAppts = todayAppointments.filter(a => a.patient_id === patientId)
        if (patientAppts.length === 0) return null
        const order = ["in_treatment", "checked_in", "confirmed", "scheduled", "pending", "unconfirmed", "no_show", "cancelled"] as const
        for (const s of order) {
            const found = patientAppts.find(a => a.status === s)
            if (found) return found.status
        }
        return patientAppts[0]?.status ?? null
    }

    useEffect(() => {
        const query = searchParams.get("q")
        if (query) {
            setSearchTerm(query)
        }
    }, [searchParams])

    // Refetch when tab becomes visible so status updates from calendar/profile show up
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "visible") router.refresh()
        }
        document.addEventListener("visibilitychange", onVisibility)
        return () => document.removeEventListener("visibilitychange", onVisibility)
    }, [router])

    let filteredPatients = initialPatients.filter(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase()) ||
            (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    })

    if (filterTab === "expected_today") {
        filteredPatients = filteredPatients.filter((p) => expectedTodayPatientIds.has(p.id))
    } else if (filterTab === "checked_in") {
        filteredPatients = filteredPatients.filter((p) => checkedInPatientIds.has(p.id))
    }

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this patient?")) {
            try {
                await deletePatient(id)
                toast.success("Patient deleted")
                router.refresh()
            } catch (error) {
                toast.error("Failed to delete patient")
            }
        }
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Patients</h2>
                    <p className="text-slate-500">Manage your patient records and history.</p>
                </div>
                <ManagePatientDialog />
            </div>

            {/* Expected Today & Checked-In summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setFilterTab(filterTab === "expected_today" ? "all" : "expected_today")}
                    className={`flex items-center gap-4 p-4 rounded-xl border bg-white text-left transition-all hover:shadow-md ${
                        filterTab === "expected_today"
                            ? "border-teal-500 bg-teal-50/50 shadow-sm"
                            : "border-slate-200"
                    }`}
                >
                    <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center">
                        <CalendarCheck className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Expected Today</p>
                        <p className="text-2xl font-bold text-slate-900">{expectedTodayCount}</p>
                        <p className="text-xs text-slate-400">Patients with appointments today</p>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => setFilterTab(filterTab === "checked_in" ? "all" : "checked_in")}
                    className={`flex items-center gap-4 p-4 rounded-xl border bg-white text-left transition-all hover:shadow-md ${
                        filterTab === "checked_in"
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                            : "border-slate-200"
                    }`}
                >
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Checked In</p>
                        <p className="text-2xl font-bold text-slate-900">{checkedInCount}</p>
                        <p className="text-xs text-slate-400">Currently checked in</p>
                    </div>
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex rounded-lg border border-slate-200 bg-white p-1 w-fit">
                    {(["all", "expected_today", "checked_in"] as const).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setFilterTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                filterTab === tab
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {tab === "all" ? "All Patients" : tab === "expected_today" ? "Expected Today" : "Checked In"}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-0 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-x-auto overflow-hidden">
                <Table className="min-w-[600px]">
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Contact</TableHead>
                            <TableHead className="hidden md:table-cell">Insurance</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPatients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="py-16">
                                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                            <UserCheck className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {initialPatients.length === 0 ? "No patients yet" : "No patients found"}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {initialPatients.length === 0
                                                    ? "Add your first patient to get started."
                                                    : "Try adjusting your search or filters."}
                                            </p>
                                        </div>
                                        {initialPatients.length === 0 && (
                                            <ManagePatientDialog />
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPatients.map((patient) => (
                                <TableRow key={patient.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-teal-100 text-teal-700 font-medium">
                                                {patient.first_name[0]}{patient.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <Link href={`/patients/${patient.id}`} className="hover:underline text-slate-900">
                                            {patient.first_name} {patient.last_name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-slate-500">
                                        <div className="text-xs">{patient.email || "N/A"}</div>
                                        <div className="text-xs">{patient.phone || "N/A"}</div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{patient.insurance_provider || "None"}</TableCell>
                                    <TableCell>
                                        {(() => {
                                            const appt = todayAppointments.find((a) => a.patient_id === patient.id)
                                            return appt
                                                ? format(new Date(appt.start_time), "h:mm a")
                                                : "--"
                                        })()}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-slate-500">$0.00</span>
                                    </TableCell>
                                    <TableCell>
                                        {(() => {
                                            const status = getPatientAppointmentStatus(patient.id)
                                            if (!status) {
                                                return (
                                                    <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 shadow-none">
                                                        Active
                                                    </Badge>
                                                )
                                            }
                                            const label = getAppointmentStatusLabel(status)
                                            const variant =
                                                status === "in_treatment" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                                status === "checked_in" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" :
                                                status === "no_show" || status === "cancelled" ? "bg-rose-100 text-rose-800 hover:bg-rose-100" :
                                                status === "confirmed" || status === "unconfirmed" ? "bg-teal-100 text-teal-800 hover:bg-teal-100" :
                                                status === "scheduled" || status === "pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                                "bg-slate-100 text-slate-600 hover:bg-slate-100"
                                            return (
                                                <Badge className={`${variant} shadow-none`}>
                                                    {label}
                                                </Badge>
                                            )
                                        })()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => {
                                                    navigator.clipboard.writeText(patient.id)
                                                    toast.success("Patient ID copied to clipboard")
                                                }}>
                                                    Copy ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => router.push(`/patients/${patient.id}`)}>
                                                    View details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedPatientId(patient.id)
                                                    setIsInvoiceOpen(true)
                                                }}>
                                                    Create invoice
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(patient.id)} className="text-red-600 focus:text-red-600">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <NewInvoiceDialog
                open={isInvoiceOpen}
                onOpenChange={setIsInvoiceOpen}
                defaultPatientId={selectedPatientId}
                patients={filteredPatients}
            />
        </div >
    )
}
