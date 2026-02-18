"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, UserPlus, Calendar, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewWalkInDialog } from "@/components/walkins/new-walk-in-dialog"

const actions = [
    { label: "Add Patient", icon: UserPlus, href: "/patients?new=1" },
    { label: "Book Appointment", icon: Calendar, href: "/calendar" },
    { label: "Create Claim", icon: FileText, href: "/insurance-claims" },
]

export function QuickActionsFab() {
    const [open, setOpen] = useState(false)
    const [walkInOpen, setWalkInOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
                {open && (
                    <div
                        className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
                        role="menu"
                        aria-label="Quick actions"
                    >
                        {actions.map(({ label, icon: Icon, href }) => (
                            <Button
                                key={label}
                                variant="outline"
                                size="sm"
                                className="h-auto py-2.5 px-4 rounded-xl bg-white border-slate-200 shadow-md hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                                onClick={() => {
                                    router.push(href)
                                    setOpen(false)
                                }}
                                role="menuitem"
                            >
                                <Icon className="h-4 w-4 mr-2 text-teal-600" aria-hidden />
                                {label}
                            </Button>
                        ))}

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-auto py-2.5 px-4 rounded-xl bg-white border-slate-200 shadow-md hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                            onClick={() => {
                                setWalkInOpen(true)
                                setOpen(false)
                            }}
                            role="menuitem"
                        >
                            <Users className="h-4 w-4 mr-2 text-teal-600" aria-hidden />
                            New walk-in
                        </Button>
                    </div>
                )}
                <Button
                    type="button"
                    aria-expanded={open}
                    aria-haspopup="true"
                    aria-label={open ? "Close quick actions" : "Open quick actions"}
                    className="h-12 w-12 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/25 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
                    onClick={() => setOpen((o) => !o)}
                >
                    <Plus
                        className={`h-6 w-6 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
                        aria-hidden
                    />
                </Button>
            </div>

            <NewWalkInDialog open={walkInOpen} onOpenChange={setWalkInOpen} />
        </>
    )
}

