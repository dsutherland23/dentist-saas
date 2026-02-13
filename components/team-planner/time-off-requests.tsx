"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2, CheckCircle2, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase"

interface TimeOffRequest {
    id: string
    staff_id: string
    start_date: string
    end_date: string
    reason: string
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    created_at: string
    staff: {
        first_name: string
        last_name: string
        role: string
        email: string
    }
    approver?: {
        first_name: string
        last_name: string
    }
}

export function TimeOffRequests() {
    const supabase = createClient()
    const [requests, setRequests] = useState<TimeOffRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>("all")

    const [newRequest, setNewRequest] = useState({
        start_date: "",
        end_date: "",
        reason: ""
    })

    useEffect(() => {
        fetchRequests()
    }, [filterStatus])

    const fetchRequests = async () => {
        setIsLoading(true)
        try {
            const url = filterStatus === "all"
                ? '/api/time-off-requests'
                : `/api/time-off-requests?status=${filterStatus}`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                setRequests(data)
            }
        } catch (error) {
            console.error('Error fetching time off requests:', error)
            toast.error('Failed to load requests')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitRequest = async () => {
        if (!newRequest.start_date || !newRequest.end_date) {
            toast.error('Please select start and end dates')
            return
        }

        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('You must be logged in to submit a request')
                return
            }

            const res = await fetch('/api/time-off-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: user.id,
                    ...newRequest
                })
            })

            if (res.ok) {
                toast.success('Time off request submitted')
                setIsDialogOpen(false)
                setNewRequest({ start_date: "", end_date: "", reason: "" })
                fetchRequests()
            } else {
                throw new Error('Failed to submit request')
            }
        } catch (error) {
            toast.error('Failed to submit request')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleApprove = async (id: string) => {
        try {
            const res = await fetch('/api/time-off-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'approved' })
            })

            if (res.ok) {
                toast.success('Request approved')
                fetchRequests()
            }
        } catch (error) {
            toast.error('Failed to approve request')
        }
    }

    const handleReject = async (id: string) => {
        try {
            const res = await fetch('/api/time-off-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'rejected' })
            })

            if (res.ok) {
                toast.success('Request rejected')
                fetchRequests()
            }
        } catch (error) {
            toast.error('Failed to reject request')
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            rejected: 'bg-rose-100 text-rose-700 border-rose-200',
            cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
        }
        return variants[status as keyof typeof variants] || variants.pending
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="shadow-sm border-l-4 border-l-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.status === 'pending').length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.status === 'approved').length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {requests.filter(r => r.status === 'rejected').length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-l-4 border-l-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{requests.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Requests Table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Time-Off Requests</CardTitle>
                            <CardDescription>Review and manage staff time-off requests</CardDescription>
                        </div>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Request Time Off
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request Time Off</DialogTitle>
                                    <DialogDescription>
                                        Submit a request for time off. Your manager will review and approve.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start-date">Start Date</Label>
                                        <Input
                                            id="start-date"
                                            type="date"
                                            value={newRequest.start_date}
                                            onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="end-date">End Date</Label>
                                        <Input
                                            id="end-date"
                                            type="date"
                                            value={newRequest.end_date}
                                            onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="reason">Reason (Optional)</Label>
                                        <Textarea
                                            id="reason"
                                            placeholder="Vacation, medical, personal..."
                                            value={newRequest.reason}
                                            onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmitRequest}
                                        disabled={isSubmitting}
                                        className="bg-teal-600 hover:bg-teal-700"
                                    >
                                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Submit Request
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((request) => {
                                const startDate = new Date(request.start_date)
                                const endDate = new Date(request.end_date)
                                const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

                                return (
                                    <TableRow key={request.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {request.staff?.first_name} {request.staff?.last_name}
                                                </span>
                                                <span className="text-xs text-slate-500">{request.staff?.role}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                                        <TableCell>{duration} day{duration !== 1 ? 's' : ''}</TableCell>
                                        <TableCell className="max-w-xs truncate">{request.reason || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusBadge(request.status)}>
                                                {request.status.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {request.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleApprove(request.id)}
                                                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleReject(request.id)}
                                                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                        No time-off requests found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
