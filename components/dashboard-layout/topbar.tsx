"use client"

import { Bell, Search, Menu, User, Settings, LogOut, Sparkles, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { ManagePatientDialog } from "@/app/(dashboard)/patients/manage-patient-dialog"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Users, Calendar, FileText } from "lucide-react"
import { NotificationCenter } from "./notification-center"
import { useState, useEffect, useRef } from "react"
import { NewAppointmentDialog } from "@/app/(dashboard)/calendar/new-appointment-dialog"
import { NewInvoiceDialog } from "@/app/(dashboard)/invoices/new-invoice-dialog"
import { useSidebar } from "@/lib/hooks/use-sidebar-context"

const SEARCH_DEBOUNCE_MS = 350

export function Topbar() {
    const { signOut, profile, user } = useAuth()
    const { isCollapsed, toggle } = useSidebar()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [patients, setPatients] = useState<any[]>([])
    const [dentists, setDentists] = useState<any[]>([])
    const [searchValue, setSearchValue] = useState("")
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isPatientsPage = pathname === "/patients" || pathname?.startsWith("/patients")
    const isInvoicesPage = pathname === "/invoices" || pathname?.startsWith("/invoices")
    const qFromUrl = searchParams?.get("q") ?? ""
    const prevPathnameRef = useRef<string | null>(null)

    const looksLikeInvoiceNumber = (q: string) => /^INV-[\w-]*$/i.test(q.trim())

    useEffect(() => {
        const currentPath = pathname ?? ""
        const justNavigated = prevPathnameRef.current !== currentPath
        prevPathnameRef.current = currentPath
        if (justNavigated && (isPatientsPage || isInvoicesPage)) {
            setSearchValue(qFromUrl)
        }
    }, [pathname, isPatientsPage, isInvoicesPage, qFromUrl])

    const applySearch = (query: string) => {
        const trimmed = query.trim()
        const isInvoiceQuery = looksLikeInvoiceNumber(trimmed)

        if (trimmed) {
            if (isInvoiceQuery) {
                const url = `/invoices?q=${encodeURIComponent(trimmed)}`
                if (isInvoicesPage) router.replace(url)
                else router.push(url)
            } else {
                const url = `/patients?q=${encodeURIComponent(trimmed)}`
                if (isPatientsPage) router.replace(url)
                else router.push(url)
            }
        } else {
            if (isPatientsPage) router.replace("/patients")
            else if (isInvoicesPage) router.replace("/invoices")
        }
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearchValue(value)
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        searchDebounceRef.current = setTimeout(() => {
            applySearch(value)
        }, SEARCH_DEBOUNCE_MS)
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current)
            searchDebounceRef.current = null
        }
        applySearch(searchValue)
    }

    useEffect(() => {
        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
        }
    }, [])

    const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : "Loading..."
    const initial = profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"
    const role = profile?.role || "user"
    const formattedRole = role.replace('_', ' ')
    const userRole = formattedRole.charAt(0).toUpperCase() + formattedRole.slice(1)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsRes, dentistsRes] = await Promise.all([
                    fetch('/api/patients'),
                    fetch('/api/staff?role=dentist')
                ])
                if (patientsRes.ok) setPatients(await patientsRes.json())
                if (dentistsRes.ok) setDentists(await dentistsRes.json())
            } catch (error) {
                console.error("Error fetching Topbar data:", error)
            }
        }
        fetchData()
    }, [])

    return (
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm">
            <div className="flex h-16 items-center gap-4 px-6">
                {/* Sidebar Toggle (Desktop) */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggle}
                    className="hidden md:flex text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-all rounded-lg"
                >
                    {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                </Button>

                {/* Mobile Menu */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden text-slate-500">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-72 bg-[#0F172A] border-none">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Navigation Menu</SheetTitle>
                            <SheetDescription>
                                Access clinic dashboard, patients, calendar, and more.
                            </SheetDescription>
                        </SheetHeader>
                        <Sidebar className="w-full relative fixed-none" />
                    </SheetContent>
                </Sheet>

                {/* Search Bar */}
                <form className="flex-1 max-w-xl" onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <Input
                            name="search"
                            placeholder="Search patients, invoices, records..."
                            value={searchValue}
                            onChange={handleSearchChange}
                            className="pl-10 bg-white/50 backdrop-blur-sm border-slate-200/50 focus:border-teal-300 focus:ring-2 focus:ring-teal-500/20 transition-all h-10"
                        />
                    </div>
                </form>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    {/* Quick Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="hidden md:flex items-center gap-2 backdrop-blur-sm bg-white/50 border-slate-200/50 hover:bg-white/80 hover:border-teal-300 transition-all border shadow-sm"
                            >
                                <Sparkles className="h-4 w-4 text-teal-600" />
                                <span className="text-sm font-medium">Quick Add</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white/95 border-slate-200/50">
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ManagePatientDialog trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                    <Users className="mr-2 h-4 w-4 text-teal-600" />
                                    <span>Add Patient</span>
                                </DropdownMenuItem>
                            } />

                            <NewAppointmentDialog
                                patients={patients}
                                dentists={dentists}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                        <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                                        <span>New Appointment</span>
                                    </DropdownMenuItem>
                                }
                            />

                            <NewInvoiceDialog
                                patients={patients}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                        <FileText className="mr-2 h-4 w-4 text-amber-600" />
                                        <span>Create Invoice</span>
                                    </DropdownMenuItem>
                                }
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Notifications */}
                    <NotificationCenter />

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 gap-2 pl-2 pr-3 hover:bg-slate-100 transition-all">
                                <Avatar className="h-8 w-8 border-2 border-teal-500/20">
                                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-semibold">
                                        {initial}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:flex flex-col items-start text-left">
                                    <span className="text-sm font-semibold text-slate-900">{fullName}</span>
                                    <span className="text-xs text-slate-500">{userRole}</span>
                                </div>
                                <Menu className="h-4 w-4 text-slate-400 md:hidden" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white/95 border-slate-200/50">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings?tab=profile')}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}
