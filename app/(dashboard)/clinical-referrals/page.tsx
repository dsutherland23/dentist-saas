"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Send, Mail, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import { SpecialistMap } from "@/components/clinical-referrals/specialist-map"
import { SpecialistSearch } from "@/components/clinical-referrals/specialist-search"
import { SpecialtyFilter } from "@/components/clinical-referrals/specialty-filter"
import { SpecialtyLegend } from "@/components/clinical-referrals/specialty-legend"
import { SpecialistList } from "@/components/clinical-referrals/specialist-list"
import { ReferPatientDialog } from "@/components/clinical-referrals/refer-patient-dialog"
import { AddSpecialistDialog } from "@/components/clinical-referrals/add-specialist-dialog"
import { AddSpecialistChoiceDialog } from "@/components/clinical-referrals/add-specialist-choice-dialog"
import { AddYourselfSpecialistDialog } from "@/components/clinical-referrals/add-yourself-specialist-dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { UserPlus } from "lucide-react"
import { buildReferralIntakeEmailContent, REFERRAL_INTAKE_EMAIL_SUBJECT, type ClinicBranding } from "@/lib/branding"

interface Specialist {
    id: string
    name: string
    specialty: { name: string; id: string }
    clinic_name?: string
    city?: string
    parish?: string
    lat: number
    lng: number
    phone?: string
    email?: string
    website?: string
    bio?: string
    user_id?: string | null
}

interface Specialty {
    id: string
    name: string
}

export default function ClinicalReferralsPage() {
    const router = useRouter()
    const { profile } = useAuth()
    const isAdmin = profile?.role === "clinic_admin" || profile?.role === "super_admin"
    const [loading, setLoading] = React.useState(true)
    const [specialists, setSpecialists] = React.useState<Specialist[]>([])
    const [specialties, setSpecialties] = React.useState<Specialty[]>([])
    const [filteredSpecialists, setFilteredSpecialists] = React.useState<Specialist[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedSpecialty, setSelectedSpecialty] = React.useState("all")

    // Dialogs
    const [addSpecialistChoiceOpen, setAddSpecialistChoiceOpen] = React.useState(false)
    const [addSpecialistDialogOpen, setAddSpecialistDialogOpen] = React.useState(false)
    const [addYourselfDialogOpen, setAddYourselfDialogOpen] = React.useState(false)
    const [referDialogOpen, setReferDialogOpen] = React.useState(false)
    const [selectSpecialistDialogOpen, setSelectSpecialistDialogOpen] = React.useState(false)
    const [sendLinkChoiceOpen, setSendLinkChoiceOpen] = React.useState(false)
    const [sendLinkLoading, setSendLinkLoading] = React.useState<"email" | "whatsapp" | null>(null)
    const [selectedSpecialist, setSelectedSpecialist] = React.useState<Specialist | null>(null)
    const [preferredShareChannel, setPreferredShareChannel] = React.useState<"email" | "whatsapp" | null>(null)
    const [clinic, setClinic] = React.useState<ClinicBranding | null>(null)

    const openReferFlow = (specialist: Specialist) => {
        setSelectedSpecialist(specialist)
        setSelectSpecialistDialogOpen(false)
        setReferDialogOpen(true)
    }

    const openWithLink = (intakeLink: string, channel: "email" | "whatsapp") => {
        if (channel === "email") {
            const body = buildReferralIntakeEmailContent(intakeLink, clinic)
            const subject = encodeURIComponent(REFERRAL_INTAKE_EMAIL_SUBJECT)
            window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`
        } else {
            const text = [
                "We’d like to connect regarding a patient referral. Please use this secure link to enter your practice details and pin your location on the map. Link expires in 48 hours (one-time use).",
                "",
                intakeLink,
            ].join("\n")
            const header = clinic?.name ? `${clinic.name}\n\n` : ""
            window.open(`https://wa.me/?text=${encodeURIComponent(header + text)}`, "_blank")
        }
    }

    const handleChooseEmail = async () => {
        setSendLinkLoading("email")
        try {
            const res = await fetch("/api/referrals/generate-intake-link", { method: "POST" })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(typeof data?.error === "string" ? data.error : "Failed to generate link")
            }
            const link = data?.intake_link
            if (typeof link !== "string" || !link.trim()) {
                toast.error("Link not generated. Set NEXT_PUBLIC_APP_URL in your server environment (e.g. Render).")
                return
            }
            setSendLinkChoiceOpen(false)
            openWithLink(link.trim(), "email")
            toast.success("Email app opening with link")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to generate link")
        } finally {
            setSendLinkLoading(null)
        }
    }

    const handleChooseWhatsApp = async () => {
        setSendLinkLoading("whatsapp")
        try {
            const res = await fetch("/api/referrals/generate-intake-link", { method: "POST" })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(typeof data?.error === "string" ? data.error : "Failed to generate link")
            }
            const link = data?.intake_link
            if (typeof link !== "string" || !link.trim()) {
                toast.error("Link not generated. Set NEXT_PUBLIC_APP_URL in your server environment (e.g. Render).")
                return
            }
            setSendLinkChoiceOpen(false)
            openWithLink(link.trim(), "whatsapp")
            toast.success("WhatsApp opening with link")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to generate link")
        } finally {
            setSendLinkLoading(null)
        }
    }

    // Fetch clinic for branding (receipt/referral header & footer)
    React.useEffect(() => {
        fetch("/api/settings/clinic")
            .then((res) => res.json())
            .then((data) => {
                if (data?.name) setClinic({ name: data.name, logo_url: data.logo_url, phone: data.phone, website: data.website, address: data.address, email: data.email })
            })
            .catch(() => {})
    }, [])

    // Fetch specialties
    React.useEffect(() => {
        fetch("/api/specialties")
            .then((res) => res.json())
            .then((data) => setSpecialties(data))
            .catch((error) => console.error("Failed to fetch specialties:", error))
    }, [])

    // Fetch specialists
    const fetchSpecialists = React.useCallback(() => {
        setLoading(true)
        fetch("/api/specialists")
            .then((res) => res.json())
            .then((data) => {
                setSpecialists(Array.isArray(data) ? data : [])
                setFilteredSpecialists(Array.isArray(data) ? data : [])
            })
            .catch((error) => console.error("Failed to fetch specialists:", error))
            .finally(() => setLoading(false))
    }, [])

    React.useEffect(() => {
        fetchSpecialists()
    }, [fetchSpecialists])

    // Refetch when user returns to tab (e.g. after confirming referral link in WhatsApp)
    React.useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "visible") fetchSpecialists()
        }
        document.addEventListener("visibilitychange", onVisibility)
        return () => document.removeEventListener("visibilitychange", onVisibility)
    }, [fetchSpecialists])

    // Apply filters
    React.useEffect(() => {
        let filtered = specialists

        // Filter by specialty
        if (selectedSpecialty !== "all") {
            filtered = filtered.filter((s) => s.specialty?.id === selectedSpecialty)
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (s) =>
                    s.name.toLowerCase().includes(query) ||
                    s.clinic_name?.toLowerCase().includes(query) ||
                    s.city?.toLowerCase().includes(query) ||
                    s.parish?.toLowerCase().includes(query) ||
                    s.specialty?.name.toLowerCase().includes(query)
            )
        }

        setFilteredSpecialists(filtered)
    }, [specialists, selectedSpecialty, searchQuery])

    const handleReferClick = (specialist: Specialist) => {
        setSelectedSpecialist(specialist)
        setReferDialogOpen(true)
    }

    const handleRefreshData = () => fetchSpecialists()

    return (
        <div className="min-h-[50vh] h-[calc(100vh-4rem)] sm:h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden max-w-full w-full min-w-0">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white px-3 sm:px-6 md:px-8 py-4 sm:py-6 shrink-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 truncate">Clinical Referrals</h1>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <Button
                            onClick={() => setAddSpecialistChoiceOpen(true)}
                            variant="outline"
                            size="sm"
                            className="border-teal-600 text-teal-600 hover:bg-teal-50 text-sm"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Specialist
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="find" className="w-full min-w-0">
                    <TabsList className="bg-slate-100 w-full flex flex-wrap h-auto gap-1 p-1">
                        <TabsTrigger value="find" className="text-xs sm:text-sm flex-1 sm:flex-none">Find Specialist</TabsTrigger>
                        <TabsTrigger value="received" onClick={() => router.push("/clinical-referrals/received")} className="text-xs sm:text-sm flex-1 sm:flex-none">
                            Received
                        </TabsTrigger>
                        <TabsTrigger value="sent" onClick={() => router.push("/clinical-referrals/sent")} className="text-xs sm:text-sm flex-1 sm:flex-none">
                            Sent
                        </TabsTrigger>
                        <TabsTrigger value="settings" onClick={() => router.push("/clinical-referrals/settings")} className="text-xs sm:text-sm flex-1 sm:flex-none">
                            Settings
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Search and Filters */}
            <div className="px-3 sm:px-6 md:px-8 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 shrink-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 min-w-0">
                    <SpecialistSearch value={searchQuery} onChange={setSearchQuery} />
                    <SpecialtyFilter
                        specialties={specialties}
                        value={selectedSpecialty}
                        onChange={setSelectedSpecialty}
                    />
                </div>
                <div className="mt-2 flex flex-col gap-2">
                    <p className="text-xs sm:text-sm text-slate-500">
                        {filteredSpecialists.length} specialist{filteredSpecialists.length !== 1 ? "s" : ""} found
                    </p>
                    <SpecialtyLegend specialties={specialties} />
                </div>
            </div>

            {/* Map and List Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
                {/* Map - 75% on desktop */}
                <div className="w-full md:w-3/4 h-[280px] sm:h-[360px] md:h-auto min-h-[200px] border-b md:border-b-0 md:border-r border-slate-200 order-2 md:order-1 shrink-0 md:shrink">
                    {loading ? (
                        <div className="flex items-center justify-center h-full bg-slate-50">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                        </div>
                    ) : (
                        <SpecialistMap
                            specialists={filteredSpecialists}
                            specialties={specialties}
                            onReferClick={handleReferClick}
                            className="h-full w-full"
                            searchQuery={searchQuery}
                        />
                    )}
                </div>

                {/* List - 25% on desktop */}
                <div className="w-full md:w-1/4 bg-slate-50 order-1 md:order-2 flex flex-col overflow-hidden min-h-0 min-w-0">
                    <div className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 overflow-auto">
                        <SpecialistList
                            specialists={filteredSpecialists}
                            loading={loading}
                            onReferClick={handleReferClick}
                            currentUserId={profile?.id}
                            isAdmin={isAdmin}
                            specialties={specialties}
                            onEditSuccess={handleRefreshData}
                        />
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AddSpecialistChoiceDialog
                open={addSpecialistChoiceOpen}
                onOpenChange={setAddSpecialistChoiceOpen}
                isAdmin={isAdmin}
                onChooseSendLink={() => setSendLinkChoiceOpen(true)}
                onChooseOther={() => setAddSpecialistDialogOpen(true)}
                onChooseYourself={() => setAddYourselfDialogOpen(true)}
            />

            <AddYourselfSpecialistDialog
                open={addYourselfDialogOpen}
                onOpenChange={setAddYourselfDialogOpen}
                specialties={specialties}
                userDisplayName={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || ""}
                isAdmin={isAdmin}
                onSuccess={handleRefreshData}
            />

            <Dialog open={sendLinkChoiceOpen} onOpenChange={setSendLinkChoiceOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Send Referrals link</DialogTitle>
                        <DialogDescription>
                            Send a professional message with the secure intake link. The recipient can enter their practice details and pin their location on a map. Your email or WhatsApp app will open with the message ready to send.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="h-14 justify-start gap-3 border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-left"
                            onClick={handleChooseEmail}
                            disabled={sendLinkLoading !== null}
                        >
                            {sendLinkLoading === "email" ? (
                                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-teal-600" />
                            ) : (
                                <Mail className="h-5 w-5 shrink-0 text-teal-600" />
                            )}
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">Email</span>
                                <span className="text-xs text-slate-500 font-normal">Opens your mail app with pre-filled message</span>
                            </div>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-14 justify-start gap-3 border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-left"
                            onClick={handleChooseWhatsApp}
                            disabled={sendLinkLoading !== null}
                        >
                            {sendLinkLoading === "whatsapp" ? (
                                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-teal-600" />
                            ) : (
                                <MessageCircle className="h-5 w-5 shrink-0 text-teal-600" />
                            )}
                            <div className="flex flex-col items-start gap-0.5">
                                <span className="font-medium">WhatsApp</span>
                                <span className="text-xs text-slate-500 font-normal">Opens WhatsApp with pre-filled message</span>
                            </div>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={selectSpecialistDialogOpen} onOpenChange={setSelectSpecialistDialogOpen}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Refer Patient</DialogTitle>
                        <DialogDescription>
                            Choose a specialist to refer to. Then fill in the referral form and get a link to share.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 min-h-0 overflow-hidden mt-4">
                        <SpecialistList
                            specialists={filteredSpecialists}
                            loading={loading}
                            onReferClick={openReferFlow}
                            currentUserId={profile?.id}
                            isAdmin={isAdmin}
                            specialties={specialties}
                            onEditSuccess={handleRefreshData}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <AddSpecialistDialog
                open={addSpecialistDialogOpen}
                onOpenChange={setAddSpecialistDialogOpen}
                specialties={specialties}
                onSuccess={handleRefreshData}
            />

            <ReferPatientDialog
                open={referDialogOpen}
                onOpenChange={setReferDialogOpen}
                specialist={selectedSpecialist}
                preferredShareChannel={preferredShareChannel}
                onSuccess={() => setPreferredShareChannel(null)}
                clinic={clinic}
            />
        </div>
    )
}
