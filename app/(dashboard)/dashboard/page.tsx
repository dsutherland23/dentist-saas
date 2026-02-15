"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    DollarSign,
    Users,
    CalendarCheck,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Clock,
    Sparkles,
    Loader2,
    MessageSquare,
    ExternalLink,
    MoreVertical,
    Phone,
    Mail,
    PhoneCall,
    Filter
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { AppointmentReminderModal } from "@/components/dashboard/appointment-reminder-modal"
import { getAppointmentStatusLabel } from "@/lib/appointment-status"

interface DashboardStats {
    revenue: {
        total: number
        change: number
        changeAmount: number
    }
    patients: {
        total: number
        newThisMonth: number
    }
    appointments: {
        total: number
        today: number
    }
    completionRate: number
}

interface ActivityItem {
    name: string
    action: string
    time: string
    type: "success" | "warning" | "info"
}

interface ScheduleItem {
    id: string
    time: string
    patient: string
    treatment: string
    status: string
    type: 'appointment'
}

interface RotaItem {
    id: string
    staff_id: string
    time: string
    staff: string
    role: string
    type: 'shift'
}

interface FollowUpItem {
    id: string
    patient_id: string
    patient_name: string
    phone: string | null
    email: string | null
    status: string
    start_time: string
    treatment_type: string
}

export default function DashboardPage() {
    const { profile } = useAuth()
    const router = useRouter()
    const firstName = profile?.first_name || "Doctor"

    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [schedule, setSchedule] = useState<ScheduleItem[]>([])
    const [rota, setRota] = useState<RotaItem[]>([])
    const [followUps, setFollowUps] = useState<FollowUpItem[]>([])
    const [loading, setLoading] = useState(true)
    const [scheduleStatusFilter, setScheduleStatusFilter] = useState<string | null>(null)

    const SCHEDULE_STATUS_OPTIONS: (string | null)[] = [
        null,
        "pending",
        "unconfirmed",
        "scheduled",
        "confirmed",
        "checked_in",
        "in_treatment",
        "completed",
        "cancelled",
        "no_show",
    ]
    const filteredSchedule =
        scheduleStatusFilter == null
            ? schedule
            : schedule.filter((a) => a.status === scheduleStatusFilter)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [statsRes, activityRes, scheduleRes, followUpRes] = await Promise.all([
                fetch("/api/dashboard/stats"),
                fetch("/api/dashboard/activity"),
                fetch("/api/dashboard/schedule"),
                fetch("/api/dashboard/follow-up")
            ])

            if (statsRes.ok) {
                const data = await statsRes.json()
                setStats(data)
            }

            if (activityRes.ok) {
                const data = await activityRes.json()
                setActivity(data.activity || [])
            }

            if (scheduleRes.ok) {
                const data = await scheduleRes.json()
                setSchedule(data.schedule || [])
                setRota(data.rota || [])
            }

            if (followUpRes.ok) {
                const data = await followUpRes.json()
                setFollowUps(data.followUps || [])
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setLoading(false)
        }
    }

    const handleViewReports = () => {
        router.push("/reports")
    }

    const handleViewCalendar = () => {
        router.push("/calendar")
    }

    const handleViewAllActivity = () => {
        // Could navigate to an activity log page or open a modal
        toast.info("Activity log feature coming soon")
    }

    const handleTodayFilter = () => {
        // Refresh with today's filter
        fetchDashboardData()
        toast.success("Showing today's data")
    }

    return (
        <div className="min-h-screen gradient-mesh">
            <AppointmentReminderModal />
            <div className="p-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
                        <p className="text-slate-600 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-teal-600" />
                            Welcome back, {firstName}! Here's what's happening today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="backdrop-blur-sm bg-white/50 border-slate-200/50 hover:bg-white/80"
                            onClick={handleTodayFilter}
                        >
                            <Clock className="mr-2 h-4 w-4" />
                            Today
                        </Button>
                        <Button
                            className="gradient-primary text-white shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
                            onClick={handleViewReports}
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            View Reports
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {/* Revenue Card */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 shadow-xl shadow-teal-500/20 transition-all hover:shadow-2xl hover:shadow-teal-500/30 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-white" />
                                </div>
                                {stats && (
                                    <div className={`flex items-center gap-1 text-white/90 text-sm font-medium px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm`}>
                                        {stats.revenue.change >= 0 ? (
                                            <ArrowUpRight className="h-3 w-3" />
                                        ) : (
                                            <ArrowDownRight className="h-3 w-3" />
                                        )}
                                        {Math.abs(stats.revenue.change).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-teal-100 text-sm font-medium">Total Revenue</p>
                                <p className="text-3xl font-bold text-white">
                                    {loading ? "..." : stats ? `$${stats.revenue.total.toLocaleString()}` : "$0"}
                                </p>
                                <p className="text-teal-100 text-xs">
                                    {loading ? "Loading..." : stats ? `${stats.revenue.change >= 0 ? '+' : ''}$${Math.abs(stats.revenue.changeAmount).toLocaleString()} from last month` : "No data"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Patients Card */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Users className="h-6 w-6 text-white" />
                                </div>
                                {stats && stats.patients.total > 0 && (
                                    <div className="flex items-center gap-1 text-white/90 text-sm font-medium px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                                        <ArrowUpRight className="h-3 w-3" />
                                        {((stats.patients.newThisMonth / stats.patients.total) * 100).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="text-blue-100 text-sm font-medium">Active Patients</p>
                                <p className="text-3xl font-bold text-white">
                                    {loading ? "..." : stats ? stats.patients.total.toLocaleString() : "0"}
                                </p>
                                <p className="text-blue-100 text-xs">
                                    {loading ? "Loading..." : stats ? `+${stats.patients.newThisMonth} new this month` : "No data"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Appointments Card */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-xl shadow-purple-500/20 transition-all hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <CalendarCheck className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-white/90 text-sm font-medium px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                                    <ArrowUpRight className="h-3 w-3" />
                                    {loading ? "..." : "5.7%"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-purple-100 text-sm font-medium">Appointments</p>
                                <p className="text-3xl font-bold text-white">
                                    {loading ? "..." : stats ? stats.appointments.total : "0"}
                                </p>
                                <p className="text-purple-100 text-xs">
                                    {loading ? "Loading..." : stats ? `${stats.appointments.today} scheduled today` : "No data"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Completion Rate Card */}
                    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 shadow-xl shadow-amber-500/20 transition-all hover:shadow-2xl hover:shadow-amber-500/30 hover:-translate-y-1">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex items-center gap-1 text-white/90 text-sm font-medium px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm">
                                    <ArrowUpRight className="h-3 w-3" />
                                    2.1%
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-amber-100 text-sm font-medium">Completion Rate</p>
                                <p className="text-3xl font-bold text-white">
                                    {loading ? "..." : stats ? `${stats.completionRate.toFixed(1)}%` : "0%"}
                                </p>
                                <p className="text-amber-100 text-xs">
                                    {loading ? "Loading..." : stats && stats.completionRate >= 90 ? `Above target by ${(stats.completionRate - 90).toFixed(1)}%` : "Below target"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-7">
                    {/* Recent Activity */}
                    <Card className="lg:col-span-4 card-modern border-0">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-2xl">Recent Activity</CardTitle>
                                    <CardDescription className="mt-1">Latest patient interactions and updates</CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                    onClick={handleViewAllActivity}
                                >
                                    View All
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="text-center py-8 text-slate-500">Loading activity...</div>
                                    ) : activity.length === 0 ? (
                                        <div className="text-center py-8 text-slate-500">No recent activity</div>
                                    ) : (
                                        activity.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-slate-100 transition-all group cursor-pointer border border-transparent hover:border-slate-200"
                                            >
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item.type === "success" ? "bg-emerald-100 text-emerald-600" :
                                                    item.type === "warning" ? "bg-amber-100 text-amber-600" :
                                                        "bg-blue-100 text-blue-600"
                                                    }`}>
                                                    {item.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600">{item.action}</p>
                                                </div>
                                                <div className="text-xs text-slate-500 whitespace-nowrap">
                                                    {item.time}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Quick Stats — Today's Appointments + Calendar Preview */}
                    <Card className="lg:col-span-3 card-modern border-0">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Today's Appointments</CardTitle>
                                <span className="text-sm font-bold text-teal-600">
                                    {loading ? "…" : stats ? stats.appointments.today : schedule.length}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Compact stat */}
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    {schedule.filter((a) => a.status === "completed").length} completed
                                </span>
                                <span className="text-slate-700 font-medium">
                                    {schedule.length} total
                                </span>
                            </div>
                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all"
                                    style={{
                                        width:
                                            schedule.length > 0
                                                ? `${(schedule.filter((a) => a.status === "completed").length / schedule.length) * 100}%`
                                                : "0%",
                                    }}
                                />
                            </div>

                            {/* Calendar preview */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Today's schedule
                                    </p>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
                                            >
                                                <Filter className="h-3 w-3" />
                                                {scheduleStatusFilter == null
                                                    ? "All statuses"
                                                    : getAppointmentStatusLabel(scheduleStatusFilter)}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => setScheduleStatusFilter(null)}>
                                                All statuses
                                            </DropdownMenuItem>
                                            {SCHEDULE_STATUS_OPTIONS.filter((s): s is string => s != null).map((status) => (
                                                <DropdownMenuItem
                                                    key={status}
                                                    onClick={() => setScheduleStatusFilter(status)}
                                                >
                                                    {getAppointmentStatusLabel(status)}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                {loading ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                                    </div>
                                ) : filteredSchedule.length === 0 ? (
                                    <p className="text-sm text-slate-500 py-4 text-center">
                                        {schedule.length === 0
                                            ? "No appointments today"
                                            : `No ${scheduleStatusFilter ? getAppointmentStatusLabel(scheduleStatusFilter).toLowerCase() : ""} appointments`}
                                    </p>
                                ) : (
                                    <ScrollArea className="h-[200px] pr-2">
                                        <div className="space-y-2">
                                            {filteredSchedule.map((apt) => (
                                                <div
                                                    key={apt.id}
                                                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 hover:bg-teal-50 transition-colors"
                                                >
                                                    <span className="text-xs font-bold text-teal-600 shrink-0 w-16">
                                                        {apt.time}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 truncate">
                                                            {apt.patient}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {apt.treatment}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="outline"
                                                        className={`shrink-0 text-[10px] h-5 ${
                                                            apt.status === "completed"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : apt.status === "in_treatment"
                                                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                                                  : apt.status === "checked_in"
                                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                                        }`}
                                                    >
                                                        {apt.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full mt-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                    onClick={handleViewCalendar}
                                >
                                    <CalendarCheck className="mr-2 h-3.5 w-3.5" />
                                    Open full calendar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Follow-up Needed — No-Show, Canceled, Unconfirmed */}
                {followUps.length > 0 && (
                    <Card className="card-modern border-0 border-l-4 border-l-rose-400">
                        <CardHeader>
                            <div>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <PhoneCall className="h-6 w-6 text-rose-600" />
                                    Follow-up Needed
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Patients with No-Show, Canceled, or Unconfirmed appointments — suggest call back and reschedule
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[320px] pr-4">
                                <div className="space-y-4">
                                    {followUps.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 hover:bg-rose-50 transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <p className="font-semibold text-slate-900 truncate">
                                                            {item.patient_name}
                                                        </p>
                                                        <Badge
                                                            variant="outline"
                                                            className={`shrink-0 text-[10px] font-bold uppercase ${
                                                                item.status === "no_show"
                                                                    ? "bg-rose-100 text-rose-800 border-rose-200"
                                                                    : item.status === "cancelled"
                                                                        ? "bg-amber-100 text-amber-800 border-amber-200"
                                                                        : "bg-slate-100 text-slate-700 border-slate-200"
                                                            }`}
                                                        >
                                                            {item.status === "no_show" ? "No-Show" : item.status === "cancelled" ? "Canceled" : "Unconfirmed"}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-slate-600 mb-2">{item.treatment_type}</p>
                                                    <div className="flex flex-wrap gap-3 text-sm">
                                                        {item.phone ? (
                                                            <a
                                                                href={`tel:${item.phone}`}
                                                                className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium"
                                                            >
                                                                <Phone className="h-3.5 w-3.5" />
                                                                {item.phone}
                                                            </a>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-slate-400">
                                                                <Phone className="h-3.5 w-3.5" /> No phone
                                                            </span>
                                                        )}
                                                        {item.email ? (
                                                            <a
                                                                href={`mailto:${item.email}`}
                                                                className="flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium truncate"
                                                            >
                                                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">{item.email}</span>
                                                            </a>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-slate-400">
                                                                <Mail className="h-3.5 w-3.5 shrink-0" /> No email
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    {item.phone && (
                                                        <Button size="sm" variant="outline" className="text-xs font-bold" asChild>
                                                            <a href={`tel:${item.phone}`}>
                                                                <Phone className="h-3 w-3 mr-1" />
                                                                Call back
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <Button size="sm" className="text-xs font-bold bg-teal-600 hover:bg-teal-700" asChild>
                                                        <Link href={`/patients/${item.patient_id}`}>
                                                            <CalendarCheck className="h-3 w-3 mr-1" />
                                                            Reschedule
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}

                {/* Upcoming Appointments */}
                <Card className="card-modern border-0">
                    <CardHeader>
                        <div>
                            <CardTitle className="text-2xl font-bold font-outfit">Today's Practice Schedule</CardTitle>
                            <CardDescription className="mt-1">Overview of appointments and staff on duty</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="appointments" className="space-y-6">
                            <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                                <TabsTrigger value="appointments" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Appointments ({schedule.length})
                                </TabsTrigger>
                                <TabsTrigger value="rota" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Team on Duty ({rota.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="appointments">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                                    </div>
                                ) : schedule.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-100 rounded-2xl">
                                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        <p>No appointments scheduled for today</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                        {schedule.map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="group relative p-6 rounded-[24px] bg-white border border-slate-100 hover:border-teal-500/30 hover:shadow-[0_20px_50px_rgba(20,184,166,0.12)] transition-all duration-500 cursor-pointer overflow-hidden"
                                            >
                                                {/* Left Accent Bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-teal-500 to-emerald-600 opacity-80 group-hover:w-2.5 transition-all" />

                                                <div className="flex flex-col h-full pl-2">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-100/50">
                                                            <Clock className="h-3.5 w-3.5 text-teal-600" />
                                                            <span className="text-sm font-bold text-teal-900 tracking-tight">{appointment.time}</span>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] h-6 font-bold uppercase tracking-widest border-0 ${appointment.status === "confirmed"
                                                                    ? "bg-emerald-50 text-emerald-700"
                                                                    : "bg-amber-50 text-amber-700"
                                                                }`}
                                                        >
                                                            {appointment.status}
                                                        </Badge>
                                                    </div>

                                                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors mb-2 line-clamp-1 leading-tight">
                                                        {appointment.patient}
                                                    </h4>

                                                    <div className="flex items-center gap-3 mt-auto">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                                            <Activity className="h-4 w-4 text-slate-400 group-hover:text-teal-500 transition-colors" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Treatment</p>
                                                            <p className="text-sm text-slate-600 font-medium truncate">{appointment.treatment}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Subtle Background Pattern */}
                                                <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-teal-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="rota">
                                {loading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                                    </div>
                                ) : rota.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-100 rounded-2xl">
                                        <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                        <p>No staff shifts scheduled for today</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                        {rota.map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="group relative p-6 rounded-[24px] bg-slate-50/40 border border-slate-100 hover:border-blue-500/30 hover:bg-white hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] transition-all duration-500 cursor-pointer overflow-hidden backdrop-blur-md"
                                                onClick={() => router.push(`/staff/${shift.staff_id}`)}
                                            >
                                                <div className="flex flex-col h-full">
                                                    <div className="flex items-start justify-between mb-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20 group-hover:rotate-3 transition-transform">
                                                                    {shift.staff.split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-md">
                                                                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0 pr-8">
                                                                <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                                    {shift.staff}
                                                                </h4>
                                                                <Badge variant="secondary" className="bg-slate-200/50 text-slate-600 text-[10px] font-bold uppercase tracking-wider h-5 px-2 border-0">
                                                                    {shift.role.replace('_', ' ')}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-4 right-4 h-9 w-9 rounded-xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 hover:bg-blue-600 hover:text-white transition-all duration-300"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                router.push(`/messages?user=${shift.staff_id}`)
                                                            }}
                                                        >
                                                            <MessageSquare className="h-4.5 w-4.5" />
                                                        </Button>
                                                    </div>

                                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100/10">
                                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 rounded-lg border border-blue-100/50 group-hover:bg-blue-50 transition-colors">
                                                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                                                            <span className="text-xs font-bold text-blue-900 tracking-tight">{shift.time}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            Profile <ExternalLink className="h-2.5 w-2.5" />
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Sophisticated Glass Highlight */}
                                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
