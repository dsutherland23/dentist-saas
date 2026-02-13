"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import { SpecialistMap } from "@/components/clinical-referrals/specialist-map"
import { SpecialistSearch } from "@/components/clinical-referrals/specialist-search"
import { SpecialtyFilter } from "@/components/clinical-referrals/specialty-filter"
import { SpecialistList } from "@/components/clinical-referrals/specialist-list"
import { RegisterSpecialistDialog } from "@/components/clinical-referrals/register-specialist-dialog"
import { ReferPatientDialog } from "@/components/clinical-referrals/refer-patient-dialog"
import { useRouter } from "next/navigation"

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
    const [loading, setLoading] = React.useState(true)
    const [specialists, setSpecialists] = React.useState<Specialist[]>([])
    const [specialties, setSpecialties] = React.useState<Specialty[]>([])
    const [filteredSpecialists, setFilteredSpecialists] = React.useState<Specialist[]>([])

    // Filters
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedSpecialty, setSelectedSpecialty] = React.useState("all")

    // Dialogs
    const [registerDialogOpen, setRegisterDialogOpen] = React.useState(false)
    const [referDialogOpen, setReferDialogOpen] = React.useState(false)
    const [selectedSpecialist, setSelectedSpecialist] = React.useState<Specialist | null>(null)

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
                    <Button
                        onClick={() => setRegisterDialogOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Yourself as a Specialist
                    </Button>
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
            <RegisterSpecialistDialog
                open={registerDialogOpen}
                onOpenChange={setRegisterDialogOpen}
                specialties={specialties}
                onSuccess={handleRefreshData}
            />

            <ReferPatientDialog
                open={referDialogOpen}
                onOpenChange={setReferDialogOpen}
                specialist={selectedSpecialist}
                onSuccess={() => { }}
            />
        </div>
    )
}
