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
import { SpecialistList } from "@/components/clinical-referrals/specialist-list"
import { ReferPatientDialog } from "@/components/clinical-referrals/refer-patient-dialog"
import { AddSpecialistDialog } from "@/components/clinical-referrals/add-specialist-dialog"
import { AddSpecialistChoiceDialog } from "@/components/clinical-referrals/add-specialist-choice-dialog"
import { AddYourselfSpecialistDialog } from "@/components/clinical-referrals/add-yourself-specialist-dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { UserPlus } from "lucide-react"

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

    const openReferFlow = (specialist: Specialist) => {
        setSelectedSpecialist(specialist)
        setSelectSpecialistDialogOpen(false)
        setReferDialogOpen(true)
    }

    const openWithLink = (intakeLink: string, channel: "email" | "whatsapp") => {
        if (channel === "email") {
            const subject = encodeURIComponent("Referral intake – please confirm your practice details")
            const body = encodeURIComponent(
                `Please use the link below to confirm your practice details and location for the referral.\n\n${intakeLink}\n\nThis link expires in 48 hours and can only be used once.`
            )
            window.location.href = `mailto:?subject=${subject}&body=${body}`
        } else {
            const text = encodeURIComponent(
                `Please confirm your practice details for the referral using this link (expires in 48 hours, one-time use):\n${intakeLink}`
            )
            window.open(`https://wa.me/?text=${text}`, "_blank")
        }
    }

    const handleChooseEmail = async () => {
        setSendLinkLoading("email")
        try {
            const res = await fetch("/api/referrals/generate-intake-link", { method: "POST" })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to generate link")
            setSendLinkChoiceOpen(false)
            openWithLink(data.intake_link, "email")
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
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to generate link")
            setSendLinkChoiceOpen(false)
            openWithLink(data.intake_link, "whatsapp")
            toast.success("WhatsApp opening with link")
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to generate link")
        } finally {
            setSendLinkLoading(null)
        }
    }

    // Fetch specialties
    React.useEffect(() => {
        fetch("/api/specialties")
            .then((res) => res.json())
            .then((data) => setSpecialties(data))
            .catch((error) => console.error("Failed to fetch specialties:", error))
    }, [])

    // Fetch specialists
    React.useEffect(() => {
        setLoading(true)
        fetch("/api/specialists")
            .then((res) => res.json())
            .then((data) => {
                setSpecialists(data)
                setFilteredSpecialists(data)
            })
            .catch((error) => console.error("Failed to fetch specialists:", error))
            .finally(() => setLoading(false))
    }, [])

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

    const handleRefreshData = () => {
        setLoading(true)
        fetch("/api/specialists")
            .then((res) => res.json())
            .then((data) => {
                setSpecialists(data)
                setFilteredSpecialists(data)
            })
            .catch((error) => console.error("Failed to fetch specialists:", error))
            .finally(() => setLoading(false))
    }

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold text-slate-900">Clinical Referrals</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            onClick={() => setAddSpecialistChoiceOpen(true)}
                            variant="outline"
                            className="border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Specialist
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="find" className="w-full">
                    <TabsList className="bg-slate-100">
                        <TabsTrigger value="find">Find Specialist</TabsTrigger>
                        <TabsTrigger value="received" onClick={() => router.push("/clinical-referrals/received")}>
                            Received
                        </TabsTrigger>
                        <TabsTrigger value="sent" onClick={() => router.push("/clinical-referrals/sent")}>
                            Sent
                        </TabsTrigger>
                        <TabsTrigger value="settings" onClick={() => router.push("/clinical-referrals/settings")}>
                            Settings
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Search and Filters */}
            <div className="px-8 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex gap-4">
                    <SpecialistSearch value={searchQuery} onChange={setSearchQuery} />
                    <SpecialtyFilter
                        specialties={specialties}
                        value={selectedSpecialty}
                        onChange={setSelectedSpecialty}
                    />
                </div>
                <p className="text-sm text-slate-500 mt-2">
                    {filteredSpecialists.length} specialist{filteredSpecialists.length !== 1 ? "s" : ""} found
                </p>
            </div>

            {/* Map and List Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {/* Map - 75% on desktop */}
                <div className="w-full md:w-3/4 h-[400px] md:h-auto border-b md:border-b-0 md:border-r border-slate-200 order-2 md:order-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-full bg-slate-50">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                        </div>
                    ) : (
                        <SpecialistMap
                            specialists={filteredSpecialists}
                            onReferClick={handleReferClick}
                            className="h-full w-full"
                            searchQuery={searchQuery}
                        />
                    )}
                </div>

                {/* List - 25% on desktop */}
                <div className="w-full md:w-1/4 bg-slate-50 order-1 md:order-2 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 p-4 md:p-6 overflow-hidden">
                        <SpecialistList
                            specialists={filteredSpecialists}
                            loading={loading}
                            onReferClick={handleReferClick}
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
                onSuccess={handleRefreshData}
            />

            <Dialog open={sendLinkChoiceOpen} onOpenChange={setSendLinkChoiceOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Send Referrals link</DialogTitle>
                        <DialogDescription>
                            Choose how to send the intake link. Your email or WhatsApp will open with the link ready to send.
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
            />
        </div>
    )
}
