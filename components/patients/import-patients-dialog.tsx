"use client"

import { useState, useRef } from "react"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PatientRow {
    first_name: string
    last_name: string
    email?: string
    phone?: string
    date_of_birth?: string
    gender?: string
    address?: string
    insurance_provider?: string
    insurance_policy_number?: string
    emergency_contact_name?: string
    emergency_contact_phone?: string
    valid: boolean
    error?: string
}

export function ImportPatientsDialog() {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<PatientRow[]>([])
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()

        try {
            if (fileExtension === 'csv') {
                Papa.parse(selectedFile, {
                    header: true,
                    complete: (results) => {
                        const validated = validateAndMapData(results.data)
                        setParsedData(validated)
                    },
                    error: (error) => {
                        toast.error(`CSV parsing error: ${error.message}`)
                    }
                })
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                const reader = new FileReader()
                reader.onload = (event) => {
                    const data = new Uint8Array(event.target?.result as ArrayBuffer)
                    const workbook = XLSX.read(data, { type: 'array' })
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet)
                    const validated = validateAndMapData(jsonData)
                    setParsedData(validated)
                }
                reader.readAsArrayBuffer(selectedFile)
            } else {
                toast.error("Unsupported file format. Please use CSV or Excel files.")
            }
        } catch (error) {
            toast.error("Error parsing file")
            console.error(error)
        }
    }

    const validateAndMapData = (data: any[]): PatientRow[] => {
        return data.map((row: any) => {
            // Flexible column mapping (handles different naming conventions)
            const firstName = row['First Name'] || row['first_name'] || row['firstName'] || ''
            const lastName = row['Last Name'] || row['last_name'] || row['lastName'] || ''
            
            const valid = !!firstName && !!lastName
            const error = !valid ? 'Missing required fields (First Name, Last Name)' : undefined

            return {
                first_name: firstName,
                last_name: lastName,
                email: row['Email'] || row['email'] || '',
                phone: row['Phone'] || row['phone'] || '',
                date_of_birth: row['Date of Birth'] || row['date_of_birth'] || row['dob'] || '',
                gender: row['Gender'] || row['gender'] || '',
                address: row['Address'] || row['address'] || '',
                insurance_provider: row['Insurance Provider'] || row['insurance_provider'] || '',
                insurance_policy_number: row['Insurance Policy'] || row['insurance_policy_number'] || row['policy_number'] || '',
                emergency_contact_name: row['Emergency Contact'] || row['emergency_contact_name'] || '',
                emergency_contact_phone: row['Emergency Phone'] || row['emergency_contact_phone'] || '',
                valid,
                error
            }
        }).filter(row => row.first_name || row.last_name) // Remove completely empty rows
    }

    const handleImport = async () => {
        const validRows = parsedData.filter(row => row.valid)
        
        if (validRows.length === 0) {
            toast.error("No valid patients to import")
            return
        }

        setImporting(true)

        try {
            const response = await fetch('/api/patients/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ patients: validRows }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Import failed')
            }

            toast.success(`Successfully imported ${result.imported} patient(s)`)
            setOpen(false)
            setFile(null)
            setParsedData([])
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Failed to import patients')
        } finally {
            setImporting(false)
        }
    }

    const validCount = parsedData.filter(row => row.valid).length
    const invalidCount = parsedData.filter(row => !row.valid).length

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Patients</DialogTitle>
                    <DialogDescription>
                        Upload a CSV or Excel file with patient data. Required fields: First Name, Last Name.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 flex-1 min-h-0 flex flex-col">
                    {!file ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-lg">
                            <FileSpreadsheet className="h-12 w-12 text-slate-400 mb-4" />
                            <p className="text-sm text-slate-600 mb-2">Upload CSV or Excel file</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                Choose File
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                                    <span className="text-sm font-medium">{file.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {validCount} Valid
                                    </Badge>
                                    {invalidCount > 0 && (
                                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                                            <XCircle className="h-3 w-3 mr-1" />
                                            {invalidCount} Invalid
                                        </Badge>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setFile(null)
                                            setParsedData([])
                                            if (fileInputRef.current) fileInputRef.current.value = ''
                                        }}
                                    >
                                        Change File
                                    </Button>
                                </div>
                            </div>

                            {parsedData.length > 0 && (
                                <ScrollArea className="flex-1 border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">Status</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Phone</TableHead>
                                                <TableHead>Insurance</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {parsedData.slice(0, 100).map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {row.valid ? (
                                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 text-rose-600" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {row.first_name} {row.last_name}
                                                    </TableCell>
                                                    <TableCell className="text-xs">{row.email || '—'}</TableCell>
                                                    <TableCell className="text-xs">{row.phone || '—'}</TableCell>
                                                    <TableCell className="text-xs">{row.insurance_provider || '—'}</TableCell>
                                                    <TableCell className="text-xs text-rose-600">{row.error || '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {parsedData.length > 100 && (
                                        <div className="p-4 text-center text-sm text-slate-500">
                                            Showing first 100 of {parsedData.length} rows
                                        </div>
                                    )}
                                </ScrollArea>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || validCount === 0 || importing}
                    >
                        {importing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            `Import ${validCount} Patient${validCount !== 1 ? 's' : ''}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
