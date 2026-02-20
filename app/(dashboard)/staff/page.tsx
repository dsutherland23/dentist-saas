"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, MoreHorizontal, Mail, Phone, Calendar, Shield, Loader2, UserCircle, Users, TrendingUp, Trash2, Edit2, User, Clock } from "lucide-react"
import { StaffDialog } from "./staff-dialog"
import { TimeOffDialog } from "./time-off-dialog"
import { ScheduleViewDialog } from "./schedule-view-dialog"
import { StaffActivityFeed } from "./staff-activity-feed"
import { LoginActivityPanel } from "./login-activity-panel"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
    Dialog as ConfirmDialog,
    DialogContent as ConfirmDialogContent,
    DialogDescription as ConfirmDialogDescription,
    DialogFooter as ConfirmDialogFooter,
    DialogHeader as ConfirmDialogHeader,
    DialogTitle as ConfirmDialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"
import { format } from "date-fns"

export default function StaffPage() {
    const { profile } = useAuth()
    const isAdmin = profile?.role === "clinic_admin" || profile?.role === "super_admin"
    const [searchQuery, setSearchQuery] = useState("")
    const [staff, setStaff] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<any>(null)
    const [isScheduleOpen, setIsScheduleOpen] = useState(false)
    const [viewingStaff, setViewingStaff] = useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [staffToDelete, setStaffToDelete] = useState<any>(null)
    const [isTimeOffOpen, setIsTimeOffOpen] = useState(false)
    const [timeOffStaff, setTimeOffStaff] = useState<any>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        fetchStaff()
    }, [])

    const fetchStaff = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/staff')
            if (res.ok) {
                const data = await res.json()
                setStaff(data)
            }
        } catch (error) {
            console.error("Error fetching staff:", error)
            toast.error("Failed to load staff members")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredStaff = staff.filter(member => {
        const firstName = member.first_name || ""
        const lastName = member.last_name || ""
        const role = member.role || ""
        const query = searchQuery.toLowerCase()

        return (
            firstName.toLowerCase().includes(query) ||
            lastName.toLowerCase().includes(query) ||
            role.toLowerCase().includes(query)
        )
    })

    const stats = {
        total: staff.length,
        active: staff.filter(m => m.is_active).length,
        dentists: staff.filter(m => m.role === 'dentist').length,
        admins: staff.filter(m => m.role === 'clinic_admin').length
    }

    const handleDeleteStaff = async () => {
        if (!staffToDelete) return

        try {
            const res = await fetch(`/api/staff?id=${staffToDelete.id}`, {
                method: 'DELETE'
            })

            const data = await res.json().catch(() => ({}))

            if (res.ok) {
                toast.success("Staff member removed")
                if (data.warning) toast.info(data.warning)
                fetchStaff()
            } else {
                toast.error(data.error || "Failed to remove staff member")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsDeleteDialogOpen(false)
            setStaffToDelete(null)
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
            case 'receptionist':
                return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'accountant':
                return 'bg-pink-100 text-pink-700 border-pink-200'
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200'
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-outfit truncate">Staff Management</h1>
                    <p className="text-slate-500 mt-1 text-sm">Manage your team members and their roles</p>
                </div>
                <Button
                    onClick={() => {
                        setSelectedStaff(null)
                        setIsDialogOpen(true)
                    }}
                    className="bg-teal-600 hover:bg-teal-700 shadow-teal-100 shadow-lg"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Staff Member
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-teal-500 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-slate-500 mt-1">{stats.active} currently active</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Dentists</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.dentists}</div>
                        <p className="text-xs text-slate-500 mt-1">Certified practitioners</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                        <UserCircle className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.admins}</div>
                        <p className="text-xs text-slate-500 mt-1">System management</p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500 bg-white/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Growth</CardTitle>
                        <TrendingUp className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+5</div>
                        <p className="text-xs text-slate-500 mt-1">Demo staff added</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 min-w-0">
                <div className="lg:col-span-2 space-y-6 min-w-0">
                    <Card className="shadow-sm border-none bg-white min-w-0 overflow-hidden">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="min-w-0">
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>A complete list of your practice staff</CardDescription>
                                </div>
                                <div className="relative w-full sm:w-72 min-w-0">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search staff..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-slate-50/50 border-slate-100 w-full min-w-0"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto min-w-0">
                            <Table className="min-w-[500px]">
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead className="font-semibold">Staff Member</TableHead>
                                        <TableHead className="font-semibold">Role</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead className="font-semibold">Join Date</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStaff.map((member) => (
                                        <TableRow key={member.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 font-medium">
                                                            {member.first_name[0]}{member.last_name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{member.first_name} {member.last_name}</div>
                                                        <div className="text-xs text-slate-500">{member.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${getRoleBadgeColor(member.role)} font-medium px-2 py-0.5`}>
                                                    {member.role.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Mail className="h-3 w-3 opacity-70" />
                                                        {member.email}
                                                    </div>
                                                    {member.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Phone className="h-3 w-3 opacity-70" />
                                                            {member.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-3 w-3 opacity-70" />
                                                    {mounted ? format(new Date(member.created_at), 'MMM d, yyyy') : '...'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={member.is_active ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>
                                                    {member.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/staff/${member.id}`} className="flex items-center cursor-pointer">
                                                                <User className="mr-2 h-4 w-4" />
                                                                View Profile
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedStaff(member)
                                                            setIsDialogOpen(true)
                                                        }} className="cursor-pointer">
                                                            <Edit2 className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setViewingStaff(member)
                                                            setIsScheduleOpen(true)
                                                        }} className="cursor-pointer">
                                                            <Calendar className="mr-2 h-4 w-4" />
                                                            View Schedule
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setTimeOffStaff(member)
                                                            setIsTimeOffOpen(true)
                                                        }} className="cursor-pointer">
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            Manage Time Off
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setStaffToDelete(member)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove Staff
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {filteredStaff.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                                                No team members match your search criteria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <StaffActivityFeed />

                    <Card className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Tip</CardTitle>
                        </CardHeader>
                        <CardContent className="text-teal-50/90 text-sm leading-relaxed">
                            Use the **Team Planner** to manage shifts visually. Roles can be adjusted anytime by editing a staff member's details.
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Admin-only Login Activity Section */}
            {isAdmin && <LoginActivityPanel />}

            <StaffDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                staff={selectedStaff}
                onSuccess={fetchStaff}
            />

            <ConfirmDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <ConfirmDialogContent>
                    <ConfirmDialogHeader>
                        <ConfirmDialogTitle>Are you absolutely sure?</ConfirmDialogTitle>
                        <ConfirmDialogDescription>
                            This will remove {staffToDelete?.first_name} {staffToDelete?.last_name} from your practice records. This action cannot be undone.
                        </ConfirmDialogDescription>
                    </ConfirmDialogHeader>
                    <ConfirmDialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteStaff}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Remove Staff Member
                        </Button>
                    </ConfirmDialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>

            <ScheduleViewDialog
                open={isScheduleOpen}
                onOpenChange={setIsScheduleOpen}
                staff={viewingStaff}
            />

            {timeOffStaff && (
                <TimeOffDialog
                    open={isTimeOffOpen}
                    onOpenChange={setIsTimeOffOpen}
                    staffId={timeOffStaff.id}
                    staffName={`${timeOffStaff.first_name} ${timeOffStaff.last_name}`}
                    onSuccess={() => { }} // No refresh needed for staff list usually
                />
            )}
        </div>
    )
}
