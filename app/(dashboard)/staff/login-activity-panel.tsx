"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Activity, Clock, Eye, Loader2, LogIn, Monitor, Smartphone } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface StaffLoginEntry {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    is_active: boolean
    login_count: number
    last_login: string | null
    recent_logins: Array<{
        logged_at: string
        ip_address: string | null
        user_agent: string | null
    }>
}

function parseDeviceType(userAgent: string | null): "desktop" | "mobile" | "unknown" {
    if (!userAgent) return "unknown"
    const ua = userAgent.toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "mobile"
    return "desktop"
}

function parseBrowser(userAgent: string | null): string {
    if (!userAgent) return "Unknown"
    const ua = userAgent.toLowerCase()
    if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome"
    if (ua.includes("firefox")) return "Firefox"
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari"
    if (ua.includes("edg")) return "Edge"
    return "Other"
}

export function LoginActivityPanel() {
    const [data, setData] = useState<StaffLoginEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [detailUser, setDetailUser] = useState<StaffLoginEntry | null>(null)

    useEffect(() => {
        fetchLoginHistory()
    }, [])

    const fetchLoginHistory = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/staff/login-history")
            if (res.ok) {
                const json = await res.json()
                setData(json.staff || [])
            }
        } catch (error) {
            console.error("Failed to load login history:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <Card className="shadow-sm border-none bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-teal-600" />
                        Login Activity
                    </CardTitle>
                    <CardDescription>Staff login history and session details</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                </CardContent>
            </Card>
        )
    }

    const totalLogins = data.reduce((sum, s) => sum + s.login_count, 0)
    const activeToday = data.filter(s => {
        if (!s.last_login) return false
        const lastLogin = new Date(s.last_login)
        const today = new Date()
        return lastLogin.toDateString() === today.toDateString()
    }).length

    return (
        <>
            <Card className="shadow-sm border-none bg-white">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-teal-600" />
                                Login Activity
                            </CardTitle>
                            <CardDescription>Staff login history and session details (admin only)</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-1.5">
                                <LogIn className="h-3.5 w-3.5 text-teal-600" />
                                <span className="font-semibold">{totalLogins}</span>
                                <span className="text-slate-400">total</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600 bg-emerald-50 rounded-lg px-3 py-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="font-semibold">{activeToday}</span>
                                <span className="text-slate-400">today</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table className="min-w-[500px]">
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="font-semibold">Staff Member</TableHead>
                                <TableHead className="font-semibold">Role</TableHead>
                                <TableHead className="font-semibold">Last Login</TableHead>
                                <TableHead className="font-semibold text-center">Total Logins</TableHead>
                                <TableHead className="font-semibold text-center">Device</TableHead>
                                <TableHead className="text-right font-semibold">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((member) => {
                                const lastDevice = member.recent_logins.length > 0
                                    ? parseDeviceType(member.recent_logins[0].user_agent)
                                    : "unknown"
                                return (
                                    <TableRow key={member.id} className="hover:bg-slate-50/80 transition-colors border-slate-100">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white shadow-sm">
                                                    <AvatarFallback className="bg-gradient-to-br from-teal-50 to-teal-100 text-teal-700 text-xs font-medium">
                                                        {(member.first_name?.[0] || "")}{(member.last_name?.[0] || "")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-slate-900 text-sm">{member.first_name} {member.last_name}</div>
                                                    <div className="text-xs text-slate-500">{member.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs font-medium capitalize">
                                                {member.role.replace("_", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.last_login ? (
                                                <div>
                                                    <div className="text-sm text-slate-700">
                                                        {format(new Date(member.last_login), "MMM d, yyyy")}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {format(new Date(member.last_login), "h:mm a")}
                                                        {" "}({formatDistanceToNow(new Date(member.last_login), { addSuffix: true })})
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Never logged in</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-slate-100 text-slate-700 text-sm font-semibold px-2 py-0.5">
                                                {member.login_count}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {lastDevice === "mobile" ? (
                                                <Smartphone className="h-4 w-4 text-slate-500 mx-auto" />
                                            ) : lastDevice === "desktop" ? (
                                                <Monitor className="h-4 w-4 text-slate-500 mx-auto" />
                                            ) : (
                                                <span className="text-xs text-slate-400">--</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 gap-1 text-xs"
                                                onClick={() => setDetailUser(member)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500 italic">
                                        No staff login activity recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail dialog */}
            <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
                <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-teal-600" />
                            Login History - {detailUser?.first_name} {detailUser?.last_name}
                        </DialogTitle>
                        <DialogDescription>
                            Recent login sessions for this staff member
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        {/* Account Status Card */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700">Account Status</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-slate-500">Status:</span>
                                    <span className={`ml-2 font-medium ${detailUser?.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                                        {detailUser?.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Total Logins:</span>
                                    <span className="ml-2 font-semibold text-slate-700">{detailUser?.login_count || 0}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="ml-2 font-mono text-xs text-slate-700">{detailUser?.email}</span>
                                </div>
                            </div>
                            {detailUser?.login_count === 0 && (
                                <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200">
                                    <p className="text-xs text-amber-800">
                                        <strong>Note:</strong> This staff member hasn't logged in yet. Make sure they received their temporary credentials.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Login History */}
                        {detailUser && detailUser.login_count > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-700">Recent Login Sessions</h4>
                                <div className="space-y-2">
                                    {detailUser.recent_logins.map((login, index) => {
                                        const device = parseDeviceType(login.user_agent)
                                        const browser = parseBrowser(login.user_agent)
                                        return (
                                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                                <div className="mt-0.5">
                                                    {device === "mobile" ? (
                                                        <Smartphone className="h-4 w-4 text-slate-500" />
                                                    ) : (
                                                        <Monitor className="h-4 w-4 text-slate-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-medium text-slate-800">
                                                            {format(new Date(login.logged_at), "MMM d, yyyy 'at' h:mm a")}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {formatDistanceToNow(new Date(login.logged_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span>{browser}</span>
                                                        <span className="text-slate-300">|</span>
                                                        <span className="capitalize">{device}</span>
                                                        {login.ip_address && login.ip_address !== "unknown" && (
                                                            <>
                                                                <span className="text-slate-300">|</span>
                                                                <span className="font-mono">{login.ip_address}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
