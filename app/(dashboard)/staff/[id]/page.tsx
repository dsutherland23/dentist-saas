"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Mail,
    Phone,
    Calendar,
    ArrowLeft,
    Loader2,
    Clock,
    FileText,
    Activity,
    Edit2,
    Plus
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { StaffDialog } from "../staff-dialog"
import { TimeOffDialog } from "../time-off-dialog"

interface StaffMember {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    role: string
    is_active: boolean
    created_at: string
}

interface Schedule {
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
}

interface TimeOffRequest {
    id: string
    start_date: string
    end_date: string
    reason: string
    status: string
    created_at: string
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function StaffProfilePage() {
    const params = useParams()
    const router = useRouter()
    const staffId = params.id as string

    const [staff, setStaff] = useState<StaffMember | null>(null)
    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isEditStaffOpen, setIsEditStaffOpen] = useState(false)
    const [isTimeOffOpen, setIsTimeOffOpen] = useState(false)

    useEffect(() => {
        if (staffId) {
            fetchStaffProfile()
            fetchSchedules()
            fetchTimeOffRequests()
        }
    }, [staffId])

    const fetchStaffProfile = async () => {
        try {
            const res = await fetch(`/api/staff?id=${staffId}`)
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            } else {
                toast.error("Staff member not found")
                router.push('/staff')
            }
        } catch (error) {
            console.error("Error fetching staff:", error)
            toast.error("Failed to load staff profile")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSchedules = async () => {
        try {
            const res = await fetch(`/api/staff-schedules?staff_id=${staffId}`)
            if (res.ok) {
                const data = await res.json()
                setSchedules(data)
            }
        } catch (error) {
            console.error("Error fetching schedules:", error)
        }
    }

    const fetchTimeOffRequests = async () => {
        try {
            const res = await fetch(`/api/time-off-requests?staff_id=${staffId}`)
            if (res.ok) {
                const data = await res.json()
                setTimeOffRequests(data)
            }
        } catch (error) {
            console.error("Error fetching time off requests:", error)
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'clinic_admin':
                return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'dentist':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'hygienist':
                return 'bg-teal-100 text-teal-700 border-teal-200'
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200'
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
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    if (!staff) return null

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/staff')}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Staff
                    </Button>
                    <div className="h-8 w-px bg-slate-300" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            {staff.first_name} {staff.last_name}
                        </h1>
                        <p className="text-slate-500 mt-1">Staff Profile</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 border-slate-200"
                        onClick={() => setIsEditStaffOpen(true)}
                    >
                        <Edit2 className="h-4 w-4 text-slate-500" />
                        Edit Profile
                    </Button>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 shadow-sm">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-24 w-24 border-4 border-slate-200">
                                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl">
                                    {staff.first_name[0]}{staff.last_name[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="text-xl">
                            {staff.first_name} {staff.last_name}
                        </CardTitle>
                        <CardDescription>
                            <Badge variant="outline" className={getRoleBadgeColor(staff.role)}>
                                {staff.role.replace('_', ' ')}
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">{staff.email}</span>
                        </div>
                        {staff.phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span className="text-slate-600">{staff.phone}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-slate-600">
                                Joined {format(new Date(staff.created_at), 'MMM d, yyyy')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Activity className="h-4 w-4 text-slate-400" />
                            <Badge className={staff.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}>
                                {staff.is_active ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 shadow-sm">
                    <Tabs defaultValue="schedule" className="w-full">
                        <CardHeader>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="schedule">
                                    Team Rota
                                </TabsTrigger>
                                <TabsTrigger value="time-off">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Time Off Management
                                </TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent>
                            <TabsContent value="schedule" className="space-y-4 mt-0">
                                {schedules.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                                        <p>No schedule set for this staff member</p>
                                        <p className="text-sm mt-1">Visit Team Planner to set up their schedule</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {DAYS_OF_WEEK.map((day, index) => {
                                            const daySchedules = schedules.filter(s => s.day_of_week === index && s.is_active)

                                            return (
                                                <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <span className="font-medium text-slate-700 w-32">{day}</span>
                                                    <div className="flex-1">
                                                        {daySchedules.length === 0 ? (
                                                            <span className="text-sm text-slate-400">Not scheduled</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-2">
                                                                {daySchedules.map((schedule) => (
                                                                    <Badge key={schedule.id} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                                                                        {schedule.start_time} - {schedule.end_time}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="time-off" className="space-y-4 mt-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-slate-900">Leave Requests</h3>
                                    <Button
                                        size="sm"
                                        className="bg-teal-600 hover:bg-teal-700 h-8 gap-1.5"
                                        onClick={() => setIsTimeOffOpen(true)}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Request Leave
                                    </Button>
                                </div>
                                {timeOffRequests.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <FileText className="h-12 w-12 mx-auto mb-4 text-slate-200" />
                                        <p className="font-medium">No time-off records found</p>
                                        <p className="text-xs text-slate-400 mt-1">Submit a request to see it listed here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {timeOffRequests.map((request) => (
                                            <div key={request.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <div className="font-medium text-slate-900">
                                                            {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                                                        </div>
                                                        {request.reason && (
                                                            <p className="text-sm text-slate-600 mt-1">{request.reason}</p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline" className={getStatusBadge(request.status)}>
                                                        {request.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Requested {format(new Date(request.created_at), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </CardContent>
                    </Tabs>
                </Card>
            </div>

            {/* Dialogs */}
            <StaffDialog
                open={isEditStaffOpen}
                onOpenChange={setIsEditStaffOpen}
                staff={staff}
                onSuccess={fetchStaffProfile}
            />
            <TimeOffDialog
                open={isTimeOffOpen}
                onOpenChange={setIsTimeOffOpen}
                staffId={staff.id}
                staffName={`${staff.first_name} ${staff.last_name}`}
                onSuccess={fetchTimeOffRequests}
            />
        </div>
    )
}
