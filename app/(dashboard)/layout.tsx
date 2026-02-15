"use client"

import React from "react"
import { Sidebar } from "@/components/dashboard-layout/sidebar"
import { Topbar } from "@/components/dashboard-layout/topbar"
import { SidebarProvider, useSidebar } from "@/lib/hooks/use-sidebar-context"
import { RouteGuard } from "@/components/route-guard"
import { cn } from "@/lib/utils"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed, isHovering } = useSidebar()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="min-h-screen bg-slate-50" />
    }

    return (
        <RouteGuard>
            <div className="h-full relative flex">
                {/* Desktop Sidebar Container */}
                <div className={cn(
                    "hidden md:flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300 ease-in-out",
                    isCollapsed && !isHovering ? "w-20" : "w-72"
                )}>
                    <Sidebar />
                </div>

                {/* Main Content */}
                <main className={cn(
                    "flex-1 w-full min-w-0 min-h-screen bg-slate-50 transition-all duration-300 ease-in-out overflow-x-hidden",
                    isCollapsed && !isHovering ? "md:pl-20" : "md:pl-72"
                )}>
                    <Topbar />
                    <div className="p-3 sm:p-4 md:p-6 max-w-[100vw]">
                        {children}
                    </div>
                </main>
            </div>
        </RouteGuard>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <DashboardContent>
                {children}
            </DashboardContent>
        </SidebarProvider>
    )
}
