"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Calendar, User, FileText, AlertCircle, Phone, Mail, Building } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Referral {
    id: string
    patient_first_name: string
    patient_last_name: string
    dob: string | null
    urgency: string
    reason: string
    status: string
    created_at: string
    referring_user?: {
        first_name: string
        last_name: string
        email: string
    }
    referring_provider_name?: string
    referring_organization?: string
    referring_contact?: string
    specialist?: {
        name: string
        clinic_name: string
        specialty: { name: string }
        email?: string
        phone?: string
    }
}

interface ReferralDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    referral: Referral | null
    type: "sent" | "received"
    onStatusUpdate?: () => void
}

export function ReferralDetailsDialog({
    open,
    onOpenChange,
    referral,
    type,
    onStatusUpdate,
}: ReferralDetailsDialogProps) {
    const [updating, setUpdating] = React.useState(false)

    if (!referral) return null

    const handleStatusChange = async (newStatus: string) => {
        setUpdating(true)
        try {
            const response = await fetch("/api/referrals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: referral.id, status: newStatus }),
            })

            if (!response.ok) throw new Error("Failed to update status")

            toast.success("Status updated successfully")
            onStatusUpdate?.()
        } catch (error) {
            toast.error("Failed to update status")
        } finally {
            setUpdating(false)
        }
    }

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
                return "bg-green-100 text-green-700 border-green-200"
            case "cancelled":
                return "bg-red-100 text-red-700 border-red-200"
            case "scheduled":
                return "bg-blue-100 text-blue-700 border-blue-200"
            case "reviewed":
                return "bg-purple-100 text-purple-700 border-purple-200"
            default:
                return "bg-slate-100 text-slate-700 border-slate-200"
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <div>
                            <DialogTitle className="text-2xl">Referral Details</DialogTitle>
                            <DialogDescription>
                                {type === "sent" ? "Sent to specialist" : "Received from provider"}
                            </DialogDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={getUrgencyColor(referral.urgency)}>
                                {referral.urgency.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(referral.status)}>
                                {referral.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    {/* Left Column: Patient & Referral Info */}
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                Patient Information
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-lg font-bold text-slate-900">
                                    {referral.patient_first_name} {referral.patient_last_name}
                                </p>
                                {referral.dob && (
                                    <p className="text-sm text-slate-600 mt-1">
                                        DOB: {format(new Date(referral.dob), "PPP")}
                                    </p>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Clinical Reason
                            </h3>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm min-h-[120px]">
                                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {referral.reason}
                                </p>
                            </div>
                        </section>

                        {type === "received" && (
                            <section>
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Actions
                                </h3>
                                <div className="space-y-3">
                                    <Label htmlFor="status-update">Update Status</Label>
                                    <Select
                                        defaultValue={referral.status}
                                        onValueChange={handleStatusChange}
                                        disabled={updating}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Update status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sent">Sent</SelectItem>
                                            <SelectItem value="received">Received</SelectItem>
                                            <SelectItem value="reviewed">Reviewed</SelectItem>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {updating && (
                                        <div className="flex items-center text-xs text-slate-500 mt-1">
                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                            Updating...
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right Column: Provider/Specialist Info */}
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                                {type === "sent" ? <Building className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                                {type === "sent" ? "Recipient Specialist" : "Referring Provider"}
                            </h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                {type === "sent" ? (
                                    <>
                                        <div>
                                            <p className="font-bold text-slate-900">{referral.specialist?.name}</p>
                                            <p className="text-sm text-teal-600 font-medium">{referral.specialist?.specialty.name}</p>
                                        </div>
                                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Building className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                {referral.specialist?.clinic_name}
                                            </div>
                                            {referral.specialist?.email && (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                    {referral.specialist.email}
                                                </div>
                                            )}
                                            {referral.specialist?.phone && (
                                                <div className="flex items-center text-sm text-slate-600">
                                                    <Phone className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                    {referral.specialist.phone}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {referral.referring_provider_name ||
                                                    `${referral.referring_user?.first_name} ${referral.referring_user?.last_name}`}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-0.5">
                                                {referral.referring_organization}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                            <div className="flex items-center text-sm text-slate-600">
                                                <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                                {referral.referring_contact || referral.referring_user?.email}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                Timeline
                            </h3>
                            <div className="space-y-4 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                <div className="pl-8 relative">
                                    <div className="absolute left-1 top-1.5 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-white" />
                                    <p className="text-xs font-semibold text-slate-500 uppercase">Referral Sent</p>
                                    <p className="text-sm text-slate-900 font-medium">
                                        {format(new Date(referral.created_at), "PPP p")}
                                    </p>
                                </div>
                                {referral.status !== "sent" && (
                                    <div className="pl-8 relative">
                                        <div className="absolute left-1 top-1.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Current Status: {referral.status}</p>
                                        <p className="text-sm text-slate-900 font-medium whitespace-pre-wrap">
                                            The referral is currently in the "{referral.status}" stage.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => window.print()}
                        className="bg-slate-900 hover:bg-slate-800"
                    >
                        Print Referral
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
