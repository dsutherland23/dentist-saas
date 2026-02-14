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
import { MoreHorizontal, Search, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ManagePatientDialog } from "./manage-patient-dialog"
import { NewInvoiceDialog } from "@/app/(dashboard)/invoices/new-invoice-dialog"
import { deletePatient } from "./actions"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

interface Patient {
    id: string
    first_name: string
    last_name: string
    email?: string
    phone?: string
    insurance_provider?: string
}

export default function PatientsClient({ initialPatients }: { initialPatients: Patient[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false)
    const [selectedPatientId, setSelectedPatientId] = useState<string | undefined>(undefined)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const query = searchParams.get("q")
        if (query) {
            setSearchTerm(query)
        }
    }, [searchParams])

    const filteredPatients = initialPatients.filter(p => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase()) ||
            (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
    })

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

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
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

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
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
                                <TableCell colSpan={8} className="h-24 text-center">
                                    No patients found.
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
                                    <TableCell>--</TableCell>
                                    <TableCell>
                                        <span className="text-slate-500">$0.00</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none">
                                            Active
                                        </Badge>
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
