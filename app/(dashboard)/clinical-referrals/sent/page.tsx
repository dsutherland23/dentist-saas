"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Eye, Calendar, User, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ReferralDetailsDialog } from "@/components/clinical-referrals/referral-details-dialog"

interface Referral {
    id: string
    patient_first_name: string
    patient_last_name: string
    dob: string | null
    urgency: string
    reason: string
    status: string
    created_at: string
    specialist: {
        id: string
        name: string
        clinic_name: string
        specialty: { name: string }
    }
}

export default function SentReferralsPage() {
    const router = useRouter()
    const [loading, setLoading] = React.useState(true)
    const [referrals, setReferrals] = React.useState<Referral[]>([])
    const [selectedReferral, setSelectedReferral] = React.useState<Referral | null>(null)
    const [detailsOpen, setDetailsOpen] = React.useState(false)

    React.useEffect(() => {
        fetch("/api/referrals?type=sent")
            .then((res) => res.json())
            .then((data) => setReferrals(data))
            .catch((error) => console.error("Failed to fetch referrals:", error))
            .finally(() => setLoading(false))
    }, [])

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case "emergency":
                return "bg-red-100 text-red-700 border-red-200"
            case "urgent":
                return "bg-orange-100 text-orange-700 border-orange-200"
            default:
                return "bg-slate-100 text-slate-700 border-slate-200"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-700"
            case "cancelled":
                return "bg-red-100 text-red-700"
            case "scheduled":
                return "bg-blue-100 text-blue-700"
            default:
                return "bg-slate-100 text-slate-700"
        }
    }

    const handleViewDetails = (referral: Referral) => {
        setSelectedReferral(referral)
        setDetailsOpen(true)
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/clinical-referrals")}
                        className="mb-4 hover:bg-slate-200"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Specialist Map
                    </Button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Sent Referrals</h1>
                            <p className="text-lg text-slate-600 mt-2">Track the status of patients you've referred</p>
                        </div>
                        <Button
                            onClick={() => router.push("/clinical-referrals")}
                            className="bg-teal-600 hover:bg-teal-700 shadow-lg"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            New Referral
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <Loader2 className="h-12 w-12 animate-spin text-teal-600 mb-4" />
                        <p className="text-slate-500 font-medium">Loading sent referrals...</p>
                    </div>
                ) : referrals.length === 0 ? (
                    <Card className="p-16 text-center bg-white rounded-3xl border-slate-100 shadow-sm">
                        <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No referrals sent yet</h3>
                        <p className="text-slate-500 max-w-sm mx-auto mb-8">Start referring patients to specialists in your network to track their progress here.</p>
                        <Button
                            onClick={() => router.push("/clinical-referrals")}
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Find a Specialist
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {referrals.map((referral) => (
                            <Card
                                key={referral.id}
                                className="group p-4 bg-white hover:shadow-lg transition-all duration-300 border-slate-100 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-teal-100 hover:bg-teal-50/20"
                                onClick={() => handleViewDetails(referral)}
                            >
                                {/* Urgency Indicator Column */}
                                <div className={`w-1.5 self-stretch rounded-full ${referral.urgency === 'emergency' ? 'bg-red-500' :
                                        referral.urgency === 'urgent' ? 'bg-orange-500' : 'bg-slate-200'
                                    } shadow-sm`} />

                                {/* Main Info Group */}
                                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                                    <div className="md:col-span-1">
                                        <h3 className="text-base font-bold text-slate-900 truncate">
                                            {referral.patient_first_name} {referral.patient_last_name}
                                        </h3>
                                        <div className="flex items-center text-xs text-teal-600 font-medium mt-0.5">
                                            To: <span className="ml-1">{referral.specialist.name}</span>
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</div>
                                        <Badge variant="secondary" className={`${getStatusColor(referral.status)} border-none text-[10px] h-5 py-0`}>
                                            {referral.status.toUpperCase()}
                                        </Badge>
                                    </div>

                                    <div className="hidden md:block overflow-hidden">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</div>
                                        <p className="text-xs text-slate-500 truncate italic">
                                            "{referral.reason}"
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-end gap-3 text-right">
                                        <div className="text-xs text-slate-400 font-medium">
                                            {format(new Date(referral.created_at), "MMM d")}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-teal-600 hover:bg-teal-50 bg-slate-50"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <ReferralDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                referral={selectedReferral as any}
                type="sent"
            />
        </div>
    )
}
