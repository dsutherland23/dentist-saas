"use client"

import React from "react"
import { Sidebar } from "@/components/dashboard-layout/sidebar"
import { Topbar } from "@/components/dashboard-layout/topbar"
import { SidebarProvider, useSidebar } from "@/lib/hooks/use-sidebar-context"
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
                "flex-1 w-full min-h-screen bg-slate-50 transition-all duration-300 ease-in-out",
                isCollapsed && !isHovering ? "md:pl-20" : "md:pl-72"
            )}>
                <Topbar />
                <div className="md:p-0 p-4">
                    {children}
                </div>
            </main>
        </div>
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
