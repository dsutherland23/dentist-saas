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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

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

interface StaffOption {
    id: string
    first_name: string
    last_name: string
    role: string
}

export function TimeOffRequests() {
    const supabase = createClient()
    const { profile } = useAuth()
    const isAdmin = profile?.role === "clinic_admin" || profile?.role === "super_admin"

    const [requests, setRequests] = useState<TimeOffRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isGrantDialogOpen, setIsGrantDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [staffList, setStaffList] = useState<StaffOption[]>([])

    const [newRequest, setNewRequest] = useState({
        start_date: "",
        end_date: "",
        reason: ""
    })
    const [grantRequest, setGrantRequest] = useState({
        staff_id: "",
        start_date: "",
        end_date: "",
        reason: ""
    })

    useEffect(() => {
        fetchRequests()
    }, [filterStatus])

    useEffect(() => {
        if (isAdmin && isGrantDialogOpen) {
            fetch("/api/staff")
                .then((res) => res.ok ? res.json() : [])
                .then((data) => setStaffList(Array.isArray(data) ? data.filter((u: { role: string }) => u.role !== "patient") : []))
                .catch(() => setStaffList([]))
        }
    }, [isAdmin, isGrantDialogOpen])

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
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to approve')
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
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to reject')
            }
        } catch (error) {
            toast.error('Failed to reject request')
        }
    }

    const handleCancel = async (id: string) => {
        try {
            const res = await fetch('/api/time-off-requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'cancelled' })
            })
            if (res.ok) {
                toast.success('Request cancelled')
                fetchRequests()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to cancel')
            }
        } catch (error) {
            toast.error('Failed to cancel request')
        }
    }

    const handleGrantTimeOff = async () => {
        if (!grantRequest.staff_id || !grantRequest.start_date || !grantRequest.end_date) {
            toast.error('Please select staff and dates')
            return
        }
        if (new Date(grantRequest.end_date) < new Date(grantRequest.start_date)) {
            toast.error('End date must be on or after start date')
            return
        }
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/time-off-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: grantRequest.staff_id,
                    start_date: grantRequest.start_date,
                    end_date: grantRequest.end_date,
                    reason: grantRequest.reason,
                    status: 'approved'
                })
            })
            if (res.ok) {
                toast.success('Time off granted')
                setIsGrantDialogOpen(false)
                setGrantRequest({ staff_id: "", start_date: "", end_date: "", reason: "" })
                fetchRequests()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to grant time off')
            }
        } catch (error) {
            toast.error('Failed to grant time off')
        } finally {
            setIsSubmitting(false)
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
        <div className="space-y-6 min-w-0">
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
            <Card className="shadow-sm min-w-0 overflow-hidden">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="min-w-0">
                            <CardTitle>Time-Off Requests</CardTitle>
                            <CardDescription>
                                {isAdmin
                                    ? "Review and manage staff time-off requests. Grant time off or approve/reject requests."
                                    : "Your time-off requests. Submit a request for your manager to review."}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="border-teal-600 text-teal-700 hover:bg-teal-50">
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
                            {isAdmin && (
                                <Dialog open={isGrantDialogOpen} onOpenChange={setIsGrantDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-teal-600 hover:bg-teal-700">
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Grant Time Off
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Grant time off</DialogTitle>
                                            <DialogDescription>
                                                Create approved time off for a staff member. They will not need to request it.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>Staff member *</Label>
                                                <Select
                                                    value={grantRequest.staff_id}
                                                    onValueChange={(v) => setGrantRequest({ ...grantRequest, staff_id: v })}
                                                    required
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select staff" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staffList.map((s) => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                {s.first_name} {s.last_name} ({s.role})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="grant-start">Start date *</Label>
                                                <Input
                                                    id="grant-start"
                                                    type="date"
                                                    value={grantRequest.start_date}
                                                    onChange={(e) => setGrantRequest({ ...grantRequest, start_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="grant-end">End date *</Label>
                                                <Input
                                                    id="grant-end"
                                                    type="date"
                                                    value={grantRequest.end_date}
                                                    onChange={(e) => setGrantRequest({ ...grantRequest, end_date: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="grant-reason">Reason (optional)</Label>
                                                <Textarea
                                                    id="grant-reason"
                                                    placeholder="e.g. Annual leave, Conference..."
                                                    value={grantRequest.reason}
                                                    onChange={(e) => setGrantRequest({ ...grantRequest, reason: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsGrantDialogOpen(false)}>
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleGrantTimeOff}
                                                disabled={isSubmitting}
                                                className="bg-teal-600 hover:bg-teal-700"
                                            >
                                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                                Grant time off
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(isAdmin || requests.length > 0) && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-slate-600 text-sm">Filter:</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="overflow-x-auto min-w-0 -mx-6 sm:mx-0">
                        <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow>
                                {isAdmin && <TableHead>Staff Member</TableHead>}
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
                                        {isAdmin && (
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {request.staff?.first_name} {request.staff?.last_name}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{request.staff?.role}</span>
                                                </div>
                                            </TableCell>
                                        )}
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
                                                <div className="flex justify-end gap-2 flex-wrap">
                                                    {isAdmin && (
                                                        <>
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
                                                        </>
                                                    )}
                                                    {(isAdmin || request.staff_id === profile?.id) && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleCancel(request.id)}
                                                            className="text-slate-600 hover:bg-slate-100"
                                                        >
                                                            Cancel request
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 7 : 6} className="h-24 text-center text-slate-500">
                                        {isAdmin ? "No time-off requests found." : "You have no time-off requests. Use \"Request time off\" to submit one."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
