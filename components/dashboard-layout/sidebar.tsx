"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Calendar,
    LayoutDashboard,
    Users,
    FileText,
    CreditCard,
    MessageSquare,
    BarChart3,
    Settings,
    Stethoscope,
    LogOut,
    Sparkles,
    UserCircle,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    Search,
    UserCheck
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/hooks/use-sidebar-context"
import { getSectionByPath } from "@/lib/access-config"
import { canAccessSection } from "@/lib/permissions"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    /** When true (e.g. inside mobile sheet), always show expanded and ignore collapse state */
    forceExpanded?: boolean
    /** Optional callback to close mobile menu when a nav link is clicked */
    onCloseMenu?: () => void
}

export function Sidebar({ className, forceExpanded = false, onCloseMenu }: SidebarProps) {
    const pathname = usePathname()
    const { signOut, profile } = useAuth()
    const { isCollapsed, isHovering, setIsHovering, toggle } = useSidebar()
    const clinicName = profile?.clinic?.name || "DentalCare Pro"

    const isActualCollapsed = !forceExpanded && isCollapsed && !isHovering

    const allRoutes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/dashboard",
            gradient: "from-sky-500 to-blue-600",
            key: "dashboard"
        },
        {
            label: "Calendar",
            icon: Calendar,
            href: "/calendar",
            gradient: "from-violet-500 to-purple-600",
            key: "calendar"
        },
        {
            label: "Patients",
            icon: Users,
            href: "/patients",
            gradient: "from-pink-500 to-rose-600",
            key: "patients"
        },
        {
            label: "Treatments",
            icon: Stethoscope,
            href: "/treatments",
            gradient: "from-orange-500 to-amber-600",
            key: "treatments"
        },
        {
            label: "Clinical Referrals",
            icon: Stethoscope,
            href: "/clinical-referrals",
            gradient: "from-purple-500 to-pink-600",
            key: "clinical-referrals"
        },
        {
            label: "Invoices",
            icon: FileText,
            href: "/invoices",
            gradient: "from-emerald-500 to-teal-600",
            key: "invoices"
        },
        {
            label: "Insurance Claims",
            icon: ShieldCheck,
            href: "/insurance-claims",
            gradient: "from-blue-500 to-indigo-600",
            key: "insurance-claims"
        },
        {
            label: "Payments",
            icon: CreditCard,
            href: "/payments",
            gradient: "from-green-500 to-emerald-600",
            key: "payments"
        },
        {
            label: "Messages",
            icon: MessageSquare,
            href: "/messages",
            gradient: "from-blue-500 to-cyan-600",
            key: "messages"
        },
        {
            label: "Reports",
            icon: BarChart3,
            href: "/reports",
            gradient: "from-indigo-500 to-purple-600",
            key: "reports"
        },
        {
            label: "Staff",
            icon: UserCircle,
            href: "/staff",
            gradient: "from-teal-500 to-cyan-600",
            key: "staff"
        },
        {
            label: "Team Planner",
            icon: UserCheck,
            href: "/team-planner",
            gradient: "from-teal-500 to-emerald-600",
            key: "team-planner"
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
            gradient: "from-slate-500 to-gray-600",
            key: "settings"
        },
    ]

    // Filter routes based on user's allowed_sections; show all routes when profile is loading or list would be empty
    const filtered = allRoutes.filter(route => canAccessSection(profile, route.key))
    const routes = filtered.length > 0 ? filtered : allRoutes

    return (
        <div
            className={cn(
                "pb-12 bg-[#0F172A] text-white border-r border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ease-in-out",
                forceExpanded ? "h-full min-h-0" : "h-screen",
                isActualCollapsed ? "w-20" : "w-72",
                className
            )}
            onMouseEnter={() => isCollapsed && setIsHovering(true)}
            onMouseLeave={() => isCollapsed && setIsHovering(false)}
        >
            <div className="space-y-4 py-4 flex flex-col h-full">
                {/* Logo Section */}
                <div className={cn(
                    "px-6 py-6 flex items-center gap-3 relative group transition-all duration-300",
                    isActualCollapsed ? "px-4 justify-center" : "px-6"
                )}>
                    <div className="h-10 w-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                        <Stethoscope className="h-6 w-6 text-white" />
                    </div>
                    {!isActualCollapsed && (
                        <div className="flex flex-col overflow-hidden animate-in fade-in duration-500">
                            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate">
                                {clinicName}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Practice OS</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="px-3 flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className={cn(
                            "space-y-1 transition-all duration-300",
                            isActualCollapsed ? "pr-0" : "pr-4"
                        )}>
                            {routes.map((route) => {
                                const isActive = pathname === route.href || pathname?.startsWith(route.href + '/')
                                return (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={onCloseMenu}
                                        className={cn(
                                            "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all relative overflow-hidden",
                                            isActualCollapsed ? "justify-center px-0" : "px-4",
                                            isActive
                                                ? "bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white shadow-lg shadow-teal-500/10"
                                                : "text-slate-400 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-9 w-9 rounded-lg flex items-center justify-center transition-all relative z-10 flex-shrink-0",
                                            isActive
                                                ? `bg-gradient-to-br ${route.gradient} shadow-lg shadow-${route.gradient.split('-')[1]}-500/20`
                                                : "bg-slate-800 group-hover:bg-slate-700"
                                        )}>
                                            <route.icon className={cn(
                                                "h-5 w-5 transition-all outline-none",
                                                isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                            )} />
                                        </div>
                                        {!isActualCollapsed && (
                                            <span className="relative z-10 animate-in fade-in slide-in-from-left-2 duration-300">{route.label}</span>
                                        )}
                                        {isActive && !isActualCollapsed && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>

                {/* Collapse Toggle (Desktop only; hide when force expanded e.g. mobile) */}
                <div className={cn("px-3 mb-2", (forceExpanded ? "hidden" : "hidden md:block"))}>
                    <Button
                        onClick={toggle}
                        variant="ghost"
                        className="w-full justify-center h-10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Logout Button */}
                <div className="px-3 mt-auto pt-4 border-t border-slate-800/50">
                    <Button
                        onClick={signOut}
                        variant="ghost"
                        className={cn(
                            "w-full gap-3 h-14 text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all group rounded-xl",
                            isActualCollapsed ? "justify-center p-0" : "justify-start px-4"
                        )}
                    >
                        <div className="h-9 w-9 rounded-lg bg-slate-800 group-hover:bg-red-500/20 flex items-center justify-center transition-all flex-shrink-0">
                            <LogOut className="h-5 w-5" />
                        </div>
                        {!isActualCollapsed && <span className="font-semibold animate-in fade-in duration-300">Logout</span>}
                    </Button>
                </div>
            </div>
        </div>
    )
}
