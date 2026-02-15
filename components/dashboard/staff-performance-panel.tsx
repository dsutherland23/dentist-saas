"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Users, TrendingUp, Loader2, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/financial-utils"

interface StaffMember {
    id: string
    name: string
    role: string
    appointments: number
    production: number
    collection: number
    avgProcedureValue: number
}

export function StaffPerformancePanel() {
    const [staffData, setStaffData] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            // This would call a dedicated staff performance API
            // For now, we'll use placeholder data
            // TODO: Implement /api/dashboard/staff-performance
            setStaffData([])
        } catch (error) {
            console.error("Error fetching staff performance:", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="card-modern border-0">
                <CardHeader>
                    <CardTitle className="text-2xl">Staff Performance</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="card-modern border-0">
            <CardHeader>
                <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Users className="h-6 w-6 text-teal-600" />
                        Staff Performance
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Provider productivity and performance metrics
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {staffData.length === 0 ? (
                    <div className="p-12 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                        <p className="text-sm font-medium text-slate-700 mb-1">
                            Staff Performance Coming Soon
                        </p>
                        <p className="text-xs text-slate-500">
                            Provider productivity metrics will be available in the next update
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead className="text-right">Appointments</TableHead>
                                <TableHead className="text-right">Production</TableHead>
                                <TableHead className="text-right">Collection</TableHead>
                                <TableHead className="text-right">Avg Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staffData.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-slate-900">{member.name}</p>
                                            <p className="text-xs text-slate-500">{member.role}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {member.appointments}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(member.production)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(member.collection)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(member.avgProcedureValue)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
