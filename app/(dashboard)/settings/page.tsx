"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Bell, Shield, Palette, Globe, CreditCard, Users, Mail, Save, Loader2, LogOut, CheckCircle2, LifeBuoy, Info, Lock, MessageSquare, FileText, ChevronRight, Camera, User, Copy, Key, Pencil, MoreVertical } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfilePictureUpload } from "@/components/patients/profile-picture-upload"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase"
import { format } from "date-fns"
import { useRevenueCat } from "@/lib/hooks/use-revenuecat"
import { useTrialLock } from "@/lib/hooks/use-trial-lock"
import { PRICING, getRevenueCatPurchases } from "@/lib/revenuecat"
import { ExternalLink } from "lucide-react"

type SettingsTab = "general" | "notifications" | "security" | "billing" | "team" | "support"

const SETTINGS_SECTIONS: { value: SettingsTab; label: string; icon: typeof Building2 }[] = [
    { value: "general", label: "General", icon: Building2 },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
    { value: "billing", label: "Billing", icon: CreditCard },
    { value: "team", label: "Team", icon: Users },
    { value: "support", label: "Support", icon: LifeBuoy },
]

export default function SettingsPage() {
    const { profile, user, refreshProfile } = useAuth()
    const { customerInfo, isPro, loading: rcLoading, refresh } = useRevenueCat(user?.id ?? profile?.id)
    const { isTrialActive, isTrialExpired, trialDaysLeft } = useTrialLock()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [purchasingPlan, setPurchasingPlan] = useState<"monthly" | "yearly" | "lifetime" | null>(null)
    const [activeTab, setActiveTab] = useState<SettingsTab>("general")

    useEffect(() => {
        setMounted(true)
    }, [])

    // Preferences State
    const [preferences, setPreferences] = useState({
        email_notifications: true,
        sms_notifications: false,
        appointment_reminders: true,
        marketing_emails: false,
        timezone: "EST",
        language: "en"
    })

    // Clinic State
    const [clinic, setClinic] = useState({
        id: "",
        name: "",
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        logo_url: "",
        business_hours: {
            weekday: "9:00 AM - 6:00 PM",
            weekend: "Closed"
        },
        require_consent_in_visit_flow: false,
        use_fullscreen: false
    })

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        if (clinic.id) {
            formData.append('clinicId', clinic.id)
        }

        setIsSaving(true)

        try {
            const res = await fetch('/api/settings/logo-upload', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || data.details || "Upload failed")
            }

            const publicUrl = data.publicUrl

            setClinic(prev => ({ ...prev, logo_url: publicUrl }))

            // Auto save the clinic setting
            const updateRes = await fetch('/api/settings/clinic', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...clinic, logo_url: publicUrl })
            })

            if (updateRes.ok) {
                toast.success("Logo uploaded and saved successfully!")
            } else {
                toast.success("Logo uploaded. Click 'Save Changes' to confirm if needed.")
            }
        } catch (error: any) {
            console.error("Error uploading logo:", error)
            toast.error(error.message || "Error uploading logo")
        } finally {
            setIsSaving(false)
        }
    }

    // Team State
    const [team, setTeam] = useState<any[]>([])
    const [canManageTeam, setCanManageTeam] = useState(false)
    const [billing, setBilling] = useState<any>(null)
    const [newMemberEmail, setNewMemberEmail] = useState("")
    const [newMemberFirstName, setNewMemberFirstName] = useState("")
    const [newMemberLastName, setNewMemberLastName] = useState("")
    const [newMemberRole, setNewMemberRole] = useState("receptionist")
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null)
    const [removingUserId, setRemovingUserId] = useState<string | null>(null)
    const [resettingPasswordUserId, setResettingPasswordUserId] = useState<string | null>(null)
    const [resetCredentials, setResetCredentials] = useState<{ email: string; temp_password: string; memberName: string } | null>(null)
    const [changeEmailMember, setChangeEmailMember] = useState<{ id: string; email: string; first_name?: string; last_name?: string } | null>(null)
    const [changeEmailValue, setChangeEmailValue] = useState("")
    const [changingEmail, setChangingEmail] = useState(false)

    // Security State
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    // Profile Picture State
    const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false)
    const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null)

    // Your Profile editable fields (synced from profile)
    const [profileFirstName, setProfileFirstName] = useState("")
    const [profileLastName, setProfileLastName] = useState("")
    const [savingProfile, setSavingProfile] = useState(false)
    useEffect(() => {
        if (profile) {
            setProfileFirstName(profile.first_name ?? "")
            setProfileLastName(profile.last_name ?? "")
        }
    }, [profile])

    // Support State
    const [suggestion, setSuggestion] = useState("")
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false)

    const handleSaveProfile = async () => {
        const first = profileFirstName.trim()
        const last = profileLastName.trim()
        if (!first && !last) {
            toast.error("Enter at least first or last name.")
            return
        }
        setSavingProfile(true)
        try {
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ first_name: first || undefined, last_name: last || undefined }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Profile updated!")
                await refreshProfile()
            } else {
                toast.error(data.error || "Failed to update profile")
            }
        } catch {
            toast.error("Failed to update profile")
        } finally {
            setSavingProfile(false)
        }
    }

    const handleSubmitSuggestion = async () => {
        const text = suggestion.trim()
        if (!text) {
            toast.error("Please enter a suggestion")
            return
        }
        setIsSubmittingSuggestion(true)
        try {
            const res = await fetch("/api/support/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                // Best-effort: also open the user's email client with the suggestion
                try {
                    if (typeof window !== "undefined") {
                        const subject = encodeURIComponent("New suggestion from Dental Clinic Pro")
                        const body = encodeURIComponent(text)
                        window.location.href = `mailto:socialkon10@gmail.com?subject=${subject}&body=${body}`
                    }
                } catch {
                    // ignore mailto failures and still show success toast
                }
                toast.success("Thank you for your feedback! We've received your suggestion.")
                setSuggestion("")
            } else {
                toast.error(data.error || "Failed to send suggestion")
            }
        } catch (error) {
            toast.error("Failed to send suggestion")
        } finally {
            setIsSubmittingSuggestion(false)
        }
    }

    const handlePurchasePlan = async (plan: "monthly" | "yearly" | "lifetime") => {
        try {
            const purchases = getRevenueCatPurchases()
            setPurchasingPlan(plan)

            const offerings = await purchases.getOfferings()
            const offering = offerings.current

            if (!offering) {
                toast.error("No active offering found in RevenueCat. Check your Web Billing setup.")
                return
            }

            // Try several common package identifiers so you don't need exact names.
            const candidateIds: string[] =
                plan === "monthly"
                    ? ["monthly", "$rc_monthly", "default", "month", "monthly_plan"]
                    : plan === "yearly"
                    ? ["yearly", "annual", "$rc_annual", "year", "yearly_plan"]
                    : ["lifetime", "$rc_lifetime", "lifetime_plan", "one_time"]

            let rcPackage = candidateIds
                .map((id) => offering.packagesById[id])
                .find((pkg) => !!pkg)

            // Fallback: first available package if nothing matched.
            if (!rcPackage && (offering as any).availablePackages?.length) {
                rcPackage = (offering as any).availablePackages[0]
            }

            if (!rcPackage) {
                toast.error(
                    `Plan '${plan}' is not configured in the current RevenueCat offering. Make sure the offering has a package for this plan (e.g. '${candidateIds.join(
                        "', '"
                    )}').`
                )
                return
            }

            await purchases.purchase({ rcPackage })
            toast.success("Subscription updated successfully")
            await refresh()
        } catch (error: any) {
            console.error("Purchase error", error)
            const message = error?.message || "Unable to complete purchase"
            toast.error(message)
        } finally {
            setPurchasingPlan(null)
        }
    }

    useEffect(() => {
        async function fetchUserProfile() {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data } = await supabase
                        .from("users")
                        .select("profile_picture_url")
                        .eq("id", user.id)
                        .single()
                    if (data?.profile_picture_url) {
                        setUserProfilePicture(data.profile_picture_url)
                    }
                }
            } catch { /* ignore */ }
        }
        fetchUserProfile()
    }, [])

    useEffect(() => {
        async function fetchSettings() {
            try {
                const [prefRes, clinicRes, teamRes, billingRes] = await Promise.all([
                    fetch('/api/settings/preferences'),
                    fetch('/api/settings/clinic'),
                    fetch('/api/settings/team'),
                    fetch('/api/settings/billing')
                ])

                if (prefRes.ok) {
                    const prefData = await prefRes.json()
                    setPreferences(prefData)
                }

                if (clinicRes.ok) {
                    const clinicData = await clinicRes.json()
                    setClinic({
                        ...clinicData,
                        require_consent_in_visit_flow: clinicData.require_consent_in_visit_flow ?? false,
                        use_fullscreen: clinicData.use_fullscreen ?? false
                    })
                }

                if (teamRes.ok) {
                    const teamData = await teamRes.json()
                    setTeam(teamData.team ?? teamData)
                    setCanManageTeam(!!teamData.canManageTeam)
                }

                if (billingRes.ok) {
                    const billingData = await billingRes.json()
                    setBilling(billingData)
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSettings()
    }, [])

    const handleInviteMember = async () => {
        if (!newMemberEmail.trim()) {
            toast.error("Please enter an email address")
            return
        }
        setIsSaving(true)
        setTempPassword(null)
        try {
            const res = await fetch('/api/staff/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: newMemberEmail.trim(),
                    first_name: newMemberFirstName.trim() || undefined,
                    last_name: newMemberLastName.trim() || undefined,
                    role: newMemberRole,
                })
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Team member added. Share the temporary password with them.")
                setTempPassword(data.temp_password ?? null)
                setTeam(prev => (data.user ? [...prev, data.user] : prev))
                setNewMemberEmail("")
                setNewMemberFirstName("")
                setNewMemberLastName("")
                if (!data.temp_password) setInviteDialogOpen(false)
            } else {
                toast.error(data.error || "Failed to invite")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        setUpdatingRoleUserId(userId)
        try {
            const res = await fetch('/api/settings/team', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            })
            const errData = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Role updated successfully")
                setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
            } else {
                toast.error(errData.error || "Failed to update role")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setUpdatingRoleUserId(null)
        }
    }

    const handleRemoveMember = async (member: { id: string; first_name?: string; last_name?: string }) => {
        if (!confirm(`Remove ${member.first_name || ""} ${member.last_name || ""} from the team? They will no longer be able to sign in.`)) return
        setRemovingUserId(member.id)
        try {
            const res = await fetch(`/api/settings/team?userId=${encodeURIComponent(member.id)}`, { method: "DELETE" })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Team member removed")
                setTeam(prev => prev.filter(m => m.id !== member.id))
            } else {
                toast.error(data.error || "Failed to remove member")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setRemovingUserId(null)
        }
    }

    const handleResetPassword = async (member: { id: string; first_name?: string; last_name?: string; email?: string }) => {
        setResettingPasswordUserId(member.id)
        setResetCredentials(null)
        try {
            const res = await fetch("/api/staff/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ staff_id: member.id }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                const name = [member.first_name, member.last_name].filter(Boolean).join(" ").trim() || "Staff"
                setResetCredentials({
                    email: data.email ?? member.email ?? "",
                    temp_password: data.temp_password ?? "",
                    memberName: name,
                })
                toast.success("Password reset. Share the new temporary password with them.")
            } else {
                toast.error(data.error || "Failed to reset password")
            }
        } catch {
            toast.error("Failed to reset password")
        } finally {
            setResettingPasswordUserId(null)
        }
    }

    const handleChangeEmail = async () => {
        if (!changeEmailMember || !changeEmailValue.trim()) return
        const trimmed = changeEmailValue.trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            toast.error("Enter a valid email address")
            return
        }
        setChangingEmail(true)
        try {
            const res = await fetch("/api/staff/change-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ staff_id: changeEmailMember.id, new_email: trimmed }),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok) {
                toast.success("Email updated. Share the new email with the staff member.")
                setTeam(prev => prev.map(m => m.id === changeEmailMember.id ? { ...m, email: trimmed } : m))
                setChangeEmailMember(null)
                setChangeEmailValue("")
            } else {
                toast.error(data.error || "Failed to update email")
            }
        } catch {
            toast.error("Failed to update email")
        } finally {
            setChangingEmail(false)
        }
    }

    const handleSavePreferences = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/settings/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            })

            if (res.ok) {
                toast.success("Preferences updated successfully")
            } else {
                toast.error("Failed to update preferences")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (!passwords.new || !passwords.confirm) {
            toast.error("Please fill in all password fields")
            return
        }

        if (passwords.new !== passwords.confirm) {
            toast.error("Passwords do not match")
            return
        }

        setIsSaving(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                password: passwords.new
            })

            if (error) throw error

            toast.success("Password updated successfully")
            setPasswords({ current: "", new: "", confirm: "" })
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveClinic = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/settings/clinic', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clinic)
            })

            if (res.ok) {
                const data = await res.json().catch(() => ({}))
                toast.success("Clinic settings updated successfully")
                if (data.warning) {
                    toast.info(data.warning, { duration: 8000 })
                }
            } else {
                const errData = await res.json()
                toast.error(errData.error || errData.details || "Failed to update clinic settings")
                console.error("Clinic update failed:", errData)
            }
        } catch (error) {
            toast.error("An error occurred while saving clinic settings")
            console.error("Clinic save error:", error)
        } finally {
            setIsSaving(false)
        }
    }

    // When trial has ended and user is not Pro, force Billing tab
    useEffect(() => {
        if (!rcLoading && !isPro && isTrialExpired && activeTab !== "billing") {
            setActiveTab("billing")
        }
    }, [rcLoading, isPro, isTrialExpired, activeTab])

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 bg-slate-50 min-h-screen min-w-0 w-full max-w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 truncate">Settings</h2>
                    <p className="text-slate-500 mt-1 text-xs sm:text-sm md:text-base truncate">Manage your practice settings and preferences</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => {
                const v = val as SettingsTab
                if (isTrialExpired && !isPro && v !== "billing") {
                    toast.error("Your 7‑day trial has ended. Please subscribe on the Billing tab to continue.")
                    return
                }
                setActiveTab(v)
            }} className="space-y-4 sm:space-y-6 min-w-0 max-w-full">
                {/* Section dropdown — single control, works on all screen sizes */}
                <div className="w-full min-w-0 max-w-sm">
                    <Select
                        value={activeTab}
                        onValueChange={(val) => {
                            const v = val as SettingsTab
                            if (isTrialExpired && !isPro && v !== "billing") {
                                toast.error("Your 7‑day trial has ended. Please subscribe on the Billing tab to continue.")
                                return
                            }
                            setActiveTab(v)
                        }}
                    >
                        <SelectTrigger className="h-11 w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-0">
                            {(() => {
                                const current = SETTINGS_SECTIONS.find((s) => s.value === activeTab) ?? SETTINGS_SECTIONS[0]
                                const Icon = current.icon
                                return (
                                    <>
                                        <Icon className="h-4 w-4 shrink-0 text-teal-600" />
                                        <span className="flex-1 text-left">{current.label}</span>
                                    </>
                                )
                            })()}
                        </SelectTrigger>
                        <SelectContent className="min-w-[12rem] rounded-xl border-slate-200 shadow-lg" align="start">
                            {SETTINGS_SECTIONS.map((section) => {
                                const Icon = section.icon
                                return (
                                    <SelectItem
                                        key={section.value}
                                        value={section.value}
                                        className="flex cursor-pointer items-center gap-2 rounded-lg py-2.5 focus:bg-teal-50 focus:text-teal-900"
                                    >
                                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                                        {section.label}
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* General (includes Your Profile + Practice Information + Regional) */}
                <TabsContent value="general" className="space-y-4 min-w-0 max-w-full overflow-x-hidden">
                    {/* Your Profile (Doctor Profile) - consolidated into General */}
                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Your Profile</CardTitle>
                            <CardDescription>Your account and profile picture</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <div className="relative shrink-0">
                                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-2 border-white shadow-md">
                                        <AvatarImage src={userProfilePicture || undefined} />
                                        <AvatarFallback className="text-xl sm:text-2xl bg-teal-100 text-teal-700">
                                            {profile?.first_name?.[0] || ''}{profile?.last_name?.[0] || ''}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        size="icon"
                                        onClick={() => setProfilePictureDialogOpen(true)}
                                        className="absolute bottom-0 right-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white border shadow text-teal-600 hover:bg-slate-50"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="text-center sm:text-left min-w-0 flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                                        {profile?.first_name} {profile?.last_name}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 capitalize">{profile?.role?.replace('_', ' ') || 'Staff'}</p>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{profile?.email}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 sm:mt-3"
                                        onClick={() => setProfilePictureDialogOpen(true)}
                                    >
                                        <Camera className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Change Photo
                                    </Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs sm:text-sm">First Name</Label>
                                    <Input
                                        value={profileFirstName}
                                        onChange={(e) => setProfileFirstName(e.target.value)}
                                        placeholder="First name"
                                        className="text-sm min-w-0"
                                        disabled={savingProfile}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs sm:text-sm">Last Name</Label>
                                    <Input
                                        value={profileLastName}
                                        onChange={(e) => setProfileLastName(e.target.value)}
                                        placeholder="Last name"
                                        className="text-sm min-w-0"
                                        disabled={savingProfile}
                                    />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs sm:text-sm">Email</Label>
                                    <Input value={profile?.email || ''} disabled className="bg-slate-50 text-sm min-w-0" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs sm:text-sm">Role</Label>
                                    <Input value={profile?.role?.replace('_', ' ') || ''} disabled className="bg-slate-50 capitalize text-sm min-w-0" />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={savingProfile || (profileFirstName === (profile?.first_name ?? '') && profileLastName === (profile?.last_name ?? ''))}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    {savingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save profile
                                </Button>
                            </div>
                            <p className="text-[11px] sm:text-xs text-slate-400">You can update your name above. Email and role are managed by your clinic administrator.</p>
                        </CardContent>
                    </Card>

                    <ProfilePictureUpload
                        open={profilePictureDialogOpen}
                        onOpenChange={setProfilePictureDialogOpen}
                        currentImageUrl={userProfilePicture}
                        onUploadComplete={(url) => {
                            setUserProfilePicture(url)
                            toast.success("Profile picture updated!")
                        }}
                        uploadEndpoint="/api/users/profile-picture"
                        title="Update Your Profile Picture"
                        description="Upload a photo or take one with your camera"
                    />

                    {/* Practice Information */}
                    <Card className="shadow-sm overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Practice Information</CardTitle>
                            <CardDescription>Update your practice details and contact information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
                                <div className="h-24 w-24 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 relative overflow-hidden">
                                    {clinic.logo_url ? (
                                        <img src={clinic.logo_url} alt="Clinic Logo" className="object-cover w-full h-full" />
                                    ) : (
                                        <Building2 className="h-8 w-8 text-slate-300" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="logo-upload" className="block font-medium">Clinic Logo</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            disabled={isSaving}
                                            className="w-full max-w-xs"
                                        />
                                        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-teal-600" />}
                                    </div>
                                    <p className="text-xs text-slate-500">Upload a square image for best results (PNG, JPG).</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                                    <Label htmlFor="practice-name" className="text-xs sm:text-sm">Practice Name</Label>
                                    <Input
                                        id="practice-name"
                                        value={clinic.name || ""}
                                        onChange={e => setClinic({ ...clinic, name: e.target.value })}
                                        className="min-w-0"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                                    <Label htmlFor="practice-email" className="text-xs sm:text-sm">Email Address</Label>
                                    <Input
                                        id="practice-email"
                                        type="email"
                                        value={clinic.email || ""}
                                        onChange={e => setClinic({ ...clinic, email: e.target.value })}
                                        className="min-w-0"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                                    <Label htmlFor="practice-phone" className="text-xs sm:text-sm">Phone Number</Label>
                                    <Input
                                        id="practice-phone"
                                        value={clinic.phone || ""}
                                        onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                                        className="min-w-0"
                                    />
                                </div>
                                <div className="space-y-1.5 sm:space-y-2 min-w-0">
                                    <Label htmlFor="practice-website" className="text-xs sm:text-sm">Website</Label>
                                    <Input
                                        id="practice-website"
                                        value={clinic.website || ""}
                                        onChange={e => setClinic({ ...clinic, website: e.target.value })}
                                        className="min-w-0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="practice-address">Address</Label>
                                <Input
                                    id="practice-address"
                                    value={clinic.address || ""}
                                    onChange={e => setClinic({ ...clinic, address: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={clinic.city || ""}
                                        onChange={e => setClinic({ ...clinic, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={clinic.state || ""}
                                        onChange={e => setClinic({ ...clinic, state: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zip">ZIP Code</Label>
                                    <Input
                                        id="zip"
                                        value={clinic.zip || ""}
                                        onChange={e => setClinic({ ...clinic, zip: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Business Hours</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="weekday-hours">Weekday Hours</Label>
                                        <Input
                                            id="weekday-hours"
                                            value={clinic.business_hours?.weekday || ""}
                                            onChange={e => setClinic({
                                                ...clinic,
                                                business_hours: {
                                                    ...(clinic.business_hours || { weekday: "9:00 AM - 6:00 PM", weekend: "Closed" }),
                                                    weekday: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="weekend-hours">Weekend Hours</Label>
                                        <Input
                                            id="weekend-hours"
                                            value={clinic.business_hours?.weekend || ""}
                                            onChange={e => setClinic({
                                                ...clinic,
                                                business_hours: {
                                                    ...(clinic.business_hours || { weekday: "9:00 AM - 6:00 PM", weekend: "Closed" }),
                                                    weekend: e.target.value
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                    <Label htmlFor="require-consent-visit-flow">Require consent acknowledgment before Check In</Label>
                                    <p className="text-sm text-slate-500">When on, staff must confirm consent in the visit flow before completing Check In.</p>
                                </div>
                                <Switch
                                    id="require-consent-visit-flow"
                                    checked={!!clinic.require_consent_in_visit_flow}
                                    onCheckedChange={checked => setClinic({ ...clinic, require_consent_in_visit_flow: !!checked })}
                                />
                            </div>

                            {canManageTeam && (
                                <div className="flex items-center justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="use-fullscreen">Fullscreen mode</Label>
                                        <p className="text-sm text-slate-500">When on, all staff can expand the app to fill the screen and hide the browser address bar. They use the fullscreen button in the top bar to enter or exit.</p>
                                    </div>
                                    <Switch
                                        id="use-fullscreen"
                                        checked={!!clinic.use_fullscreen}
                                        onCheckedChange={checked => setClinic({ ...clinic, use_fullscreen: !!checked })}
                                    />
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveClinic}
                                    disabled={isSaving}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Regional Settings</CardTitle>
                            <CardDescription>Configure timezone and language preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select
                                        value={preferences.timezone}
                                        onValueChange={val => setPreferences({ ...preferences, timezone: val })}
                                    >
                                        <SelectTrigger id="timezone">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                                            <SelectItem value="PST">Pacific Standard Time (PST)</SelectItem>
                                            <SelectItem value="EST">Eastern Standard Time (EST)</SelectItem>
                                            <SelectItem value="CST">Central Standard Time (CST)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select
                                        value={preferences.language}
                                        onValueChange={val => setPreferences({ ...preferences, language: val })}
                                    >
                                        <SelectTrigger id="language">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Spanish</SelectItem>
                                            <SelectItem value="fr">French</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSavePreferences}
                                    disabled={isSaving}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Settings */}
                <TabsContent value="notifications" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Manage how you receive notifications</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="email-notifications">Email Notifications</Label>
                                    <p className="text-sm text-slate-500">Receive notifications via email</p>
                                </div>
                                <Switch
                                    id="email-notifications"
                                    checked={preferences.email_notifications}
                                    onCheckedChange={checked => setPreferences({ ...preferences, email_notifications: checked })}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="sms-notifications">SMS Notifications</Label>
                                    <p className="text-sm text-slate-500">Receive notifications via text message</p>
                                </div>
                                <Switch
                                    id="sms-notifications"
                                    checked={preferences.sms_notifications}
                                    onCheckedChange={checked => setPreferences({ ...preferences, sms_notifications: checked })}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="appointment-reminders">Appointment Reminders</Label>
                                    <p className="text-sm text-slate-500">Send reminders for upcoming appointments</p>
                                </div>
                                <Switch
                                    id="appointment-reminders"
                                    checked={preferences.appointment_reminders}
                                    onCheckedChange={checked => setPreferences({ ...preferences, appointment_reminders: checked })}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="marketing-emails">Marketing Emails</Label>
                                    <p className="text-sm text-slate-500">Receive updates and promotional content</p>
                                </div>
                                <Switch
                                    id="marketing-emails"
                                    checked={preferences.marketing_emails}
                                    onCheckedChange={checked => setPreferences({ ...preferences, marketing_emails: checked })}
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleSavePreferences}
                                    disabled={isSaving}
                                    className="bg-teal-600 hover:bg-teal-700"
                                >
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Password & Authentication</CardTitle>
                            <CardDescription>Manage your password and security settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={passwords.current}
                                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={passwords.new}
                                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                                />
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                                    <p className="text-sm text-slate-500">Add an extra layer of security to your account</p>
                                </div>
                                <Button variant="outline">Enable</Button>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleUpdatePassword} disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Active Sessions</CardTitle>
                            <CardDescription>Manage your active login sessions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">MacBook Pro - Chrome</p>
                                        <p className="text-sm text-slate-500">San Francisco, CA • Active now</p>
                                    </div>
                                    <Button variant="outline" size="sm">Revoke</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Settings — RevenueCat */}
                <TabsContent value="billing" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Subscription Plan</CardTitle>
                            <CardDescription>Dental Clinic Pro — manage your subscription and billing</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Current plan status + 7‑day trial messaging */}
                            <div className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            {rcLoading
                                                ? "Loading…"
                                                : isPro
                                                    ? "Pro"
                                                    : isTrialActive
                                                        ? "Free Trial"
                                                        : "Free"}{" "}
                                            Plan
                                        </h3>
                                        <p className="text-slate-600 mt-1 text-sm sm:text-base">
                                            {rcLoading
                                                ? "Checking subscription…"
                                                : isPro
                                                    ? "You have access to all Pro features."
                                                    : isTrialActive && trialDaysLeft !== null
                                                        ? `7‑day free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left.`
                                                        : isTrialExpired
                                                            ? "Your 7‑day trial has ended. Subscribe to keep Pro features."
                                                            : "Start your 7‑day free trial of Pro features."}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                        <span className="inline-flex items-center justify-center px-2 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded uppercase whitespace-nowrap">
                                            {rcLoading
                                                ? "…"
                                                : isPro
                                                    ? "active"
                                                    : isTrialActive && trialDaysLeft !== null
                                                        ? `trial • ${trialDaysLeft}d left`
                                                        : isTrialExpired
                                                            ? "trial ended"
                                                            : "free"}
                                        </span>
                                        {isPro && customerInfo?.managementURL ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="w-full sm:w-auto"
                                            >
                                                <a href={customerInfo.managementURL} target="_blank" rel="noopener noreferrer">
                                                    Manage subscription <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                                </a>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePurchasePlan("monthly")}
                                                disabled={purchasingPlan !== null}
                                                className="w-full sm:w-auto"
                                            >
                                                {purchasingPlan === "monthly" ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : null}
                                                {isTrialExpired ? "Subscribe to continue" : "Upgrade to Pro"}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Pricing: Monthly $150, Yearly $1000, Lifetime $5000 */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Plans</h3>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                        <p className="font-semibold text-slate-900">Monthly</p>
                                        <p className="mt-1 text-2xl font-bold text-teal-600">{PRICING.monthly.label}<span className="text-sm font-normal text-slate-500">{PRICING.monthly.period}</span></p>
                                        <p className="mt-2 text-sm text-slate-500">Billed every month. Cancel anytime.</p>
                                        <Button
                                            className="mt-4 bg-teal-600 hover:bg-teal-700"
                                            onClick={() => handlePurchasePlan("monthly")}
                                            disabled={purchasingPlan === "monthly"}
                                        >
                                            {purchasingPlan === "monthly" ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Subscribe
                                        </Button>
                                    </div>
                                    <div className="rounded-lg border-2 border-teal-500 bg-teal-50/50 p-5 shadow-sm">
                                        <p className="font-semibold text-slate-900">Yearly</p>
                                        <p className="mt-1 text-2xl font-bold text-teal-600">{PRICING.yearly.label}<span className="text-sm font-normal text-slate-500">{PRICING.yearly.period}</span></p>
                                        <p className="mt-2 text-sm text-slate-500">Save vs monthly. Billed once per year.</p>
                                        <Button
                                            className="mt-4 bg-teal-600 hover:bg-teal-700"
                                            onClick={() => handlePurchasePlan("yearly")}
                                            disabled={purchasingPlan === "yearly"}
                                        >
                                            {purchasingPlan === "yearly" ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Subscribe
                                        </Button>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                                        <p className="font-semibold text-slate-900">Lifetime</p>
                                        <p className="mt-1 text-2xl font-bold text-teal-600">{PRICING.lifetime.label}<span className="text-sm font-normal text-slate-500">{PRICING.lifetime.period}</span></p>
                                        <p className="mt-2 text-sm text-slate-500">One-time payment. Access forever.</p>
                                        <Button
                                            className="mt-4 bg-teal-600 hover:bg-teal-700"
                                            onClick={() => handlePurchasePlan("lifetime")}
                                            disabled={purchasingPlan === "lifetime"}
                                        >
                                            {purchasingPlan === "lifetime" ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : null}
                                            Get lifetime
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {isPro && customerInfo?.managementURL && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h3 className="text-lg font-semibold">Customer Center</h3>
                                        <p className="text-sm text-slate-500">Update payment method, download invoices, or cancel from the customer portal.</p>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={customerInfo.managementURL} target="_blank" rel="noopener noreferrer">
                                                Open Customer Portal <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Team Settings */}
                <TabsContent value="team" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="min-w-0 overflow-hidden shadow-sm">
                        <CardHeader className="space-y-1.5">
                            <CardTitle className="text-lg">Team Members</CardTitle>
                            <CardDescription>Manage team access and permissions. Only clinic admins can invite, change roles, or remove members.</CardDescription>
                        </CardHeader>
                        <CardContent className="min-w-0 space-y-4 p-4 sm:p-6 pt-0">
                            {canManageTeam && (
                                <>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold">Invite Team Members</h3>
                                            <p className="text-sm text-slate-500">Add new members; they will receive a temporary password to sign in.</p>
                                        </div>
                                        <Button className="bg-teal-600 hover:bg-teal-700 shrink-0" onClick={() => { setInviteDialogOpen(true); setTempPassword(null); }}>
                                            <Mail className="mr-2 h-4 w-4" />
                                            Invite Member
                                        </Button>
                                    </div>
                                    <Separator />
                                </>
                            )}
                            {!canManageTeam && (
                                <p className="text-sm text-slate-500 rounded-lg bg-slate-50 p-3">Only clinic admins can manage team roles and invitations. Ask your admin to change your role if needed.</p>
                            )}

                            <div className="space-y-3">
                                {team.length > 0 ? (
                                    team
                                        .filter((m) => m.is_active !== false)
                                        .map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                            >
                                                <div className="flex min-w-0 flex-shrink-0 items-center gap-3 sm:min-w-0">
                                                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center text-sm font-semibold text-teal-700 ring-2 ring-white shadow-sm">
                                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-slate-900">{member.first_name} {member.last_name}</p>
                                                        <p className="truncate text-sm text-slate-500">{member.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:justify-end">
                                                    <Badge variant="secondary" className="shrink-0 capitalize font-medium">{member.role?.replace(/_/g, " ")}</Badge>
                                                    {canManageTeam && (
                                                        <>
                                                            <Select
                                                                value={member.role}
                                                                onValueChange={(val) => handleUpdateRole(member.id, val)}
                                                                disabled={updatingRoleUserId === member.id}
                                                            >
                                                                <SelectTrigger className="h-9 w-full min-w-0 max-w-[8rem] shrink-0 sm:max-w-[9rem]">
                                                                    {updatingRoleUserId === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="clinic_admin">Admin</SelectItem>
                                                                    <SelectItem value="dentist">Dentist</SelectItem>
                                                                    <SelectItem value="hygienist">Hygienist</SelectItem>
                                                                    <SelectItem value="receptionist">Staff</SelectItem>
                                                                    <SelectItem value="accountant">Accountant</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        className="h-9 w-9 shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                                        aria-label="Member actions"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-52">
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleResetPassword(member)}
                                                                        disabled={resettingPasswordUserId === member.id}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {resettingPasswordUserId === member.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                                                                        Reset password
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => { setChangeEmailMember({ id: member.id, email: member.email ?? "", first_name: member.first_name, last_name: member.last_name }); setChangeEmailValue(""); }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Change email
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleRemoveMember(member)}
                                                                        disabled={removingUserId === member.id || member.id === profile?.id}
                                                                        className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                                                    >
                                                                        {removingUserId === member.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" /> : null}
                                                                        Remove from team
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <div className="text-center py-12 text-slate-500">
                                        No team members found.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={inviteDialogOpen} onOpenChange={(open) => { setInviteDialogOpen(open); if (!open) setTempPassword(null); }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Invite team member</DialogTitle>
                                <DialogDescription>They will be created with a temporary password. Share it securely so they can sign in and set a new password.</DialogDescription>
                            </DialogHeader>
                            {tempPassword ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-600">Account created. Temporary password:</p>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 rounded bg-slate-100 px-3 py-2 text-sm font-mono break-all">{tempPassword}</code>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Copied to clipboard"); }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">User must change password on first login.</p>
                                    <DialogFooter>
                                        <Button onClick={() => { setInviteDialogOpen(false); setTempPassword(null); }}>Done</Button>
                                    </DialogFooter>
                                </div>
                            ) : (
                                <>
                                    <div className="grid gap-4 py-2">
                                        <div className="space-y-2">
                                            <Label>Email *</Label>
                                            <Input type="email" placeholder="colleague@practice.com" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>First name</Label>
                                                <Input placeholder="Jane" value={newMemberFirstName} onChange={(e) => setNewMemberFirstName(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Last name</Label>
                                                <Input placeholder="Doe" value={newMemberLastName} onChange={(e) => setNewMemberLastName(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="clinic_admin">Admin</SelectItem>
                                                    <SelectItem value="dentist">Dentist</SelectItem>
                                                    <SelectItem value="hygienist">Hygienist</SelectItem>
                                                    <SelectItem value="receptionist">Staff</SelectItem>
                                                    <SelectItem value="accountant">Accountant</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleInviteMember} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Create account
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Reset password credentials dialog */}
                    <Dialog open={!!resetCredentials} onOpenChange={(open) => { if (!open) setResetCredentials(null); }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Share new password</DialogTitle>
                                <DialogDescription>
                                    Share these credentials with {resetCredentials?.memberName}. They will be required to set a new password on next login.
                                </DialogDescription>
                            </DialogHeader>
                            {resetCredentials && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Email</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 rounded bg-slate-100 px-3 py-2 text-sm font-mono break-all">{resetCredentials.email}</code>
                                            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(resetCredentials.email); toast.success("Copied"); }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Temporary password</Label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 rounded bg-amber-50 px-3 py-2 text-sm font-mono break-all">{resetCredentials.temp_password}</code>
                                            <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(resetCredentials.temp_password); toast.success("Copied"); }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={() => setResetCredentials(null)}>Done</Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Change email dialog */}
                    <Dialog open={!!changeEmailMember} onOpenChange={(open) => { if (!open) { setChangeEmailMember(null); setChangeEmailValue(""); } }}>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Change email</DialogTitle>
                                <DialogDescription>
                                    Update this staff member&apos;s login email. They will need to use the new email to sign in. You can reset their password after to send them new credentials.
                                </DialogDescription>
                            </DialogHeader>
                            {changeEmailMember && (
                                <div className="space-y-4 py-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500">Current email</Label>
                                        <Input value={changeEmailMember.email} disabled className="bg-slate-50 text-sm" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>New email *</Label>
                                        <Input
                                            type="email"
                                            placeholder="newemail@practice.com"
                                            value={changeEmailValue}
                                            onChange={(e) => setChangeEmailValue(e.target.value)}
                                            disabled={changingEmail}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setChangeEmailMember(null); setChangeEmailValue(""); }}>Cancel</Button>
                                        <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleChangeEmail} disabled={changingEmail || !changeEmailValue.trim()}>
                                            {changingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Update email
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* Support & Legal */}
                <TabsContent value="support" className="space-y-6 min-w-0 overflow-x-hidden">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="shadow-sm border-l-4 border-l-teal-500">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-teal-600" />
                                    <CardTitle>Privacy Policy</CardTitle>
                                </div>
                                <CardDescription>How we handle and protect your clinic's data</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm text-slate-600 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    <p className="font-semibold text-slate-900 underline">Last Updated: February 2024</p>
                                    <p>At Antigravity Dental, your privacy and data security are our top priorities. This policy outlines how we collect, use, and safeguard the information you provide.</p>

                                    <h4 className="font-semibold text-slate-800">1. Data Collection</h4>
                                    <p>We collect practice information, patient records, and billing data necessary for the operation of the SaaS platform. All patient data is encrypted at rest.</p>

                                    <h4 className="font-semibold text-slate-800">2. HIPAA Compliance</h4>
                                    <p>Our platform is designed to be HIPAA compliant, ensuring that all Protected Health Information (PHI) is handled with the highest level of security.</p>

                                    <h4 className="font-semibold text-slate-800">3. Data Sharing</h4>
                                    <p>We never sell your data. We only share information with third-party providers (like Stripe for payments) essential to providing our services.</p>

                                    <h4 className="font-semibold text-slate-800">4. Your Rights</h4>
                                    <p>You retain full ownership of your data and can export or request deletion of your information at any time.</p>
                                </div>
                                <Button variant="outline" className="w-full mt-4 group">
                                    View Full Policy <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-l-4 border-l-blue-500">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                    <CardTitle>Terms & Conditions</CardTitle>
                                </div>
                                <CardDescription>Legal agreement between you and Antigravity Dental</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-sm text-slate-600 space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    <p className="font-semibold text-slate-900 underline">Version 2.1</p>
                                    <p>By using our services, you agree to the following terms and conditions regarding the use of our dental management platform.</p>

                                    <h4 className="font-semibold text-slate-800">1. License</h4>
                                    <p>We grant you a non-exclusive, non-transferable license to use the Antigravity Dental platform for your practice's internal business operations.</p>

                                    <h4 className="font-semibold text-slate-800">2. Account Responsibility</h4>
                                    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

                                    <h4 className="font-semibold text-slate-800">3. Service Availability</h4>
                                    <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. Maintenance is typically scheduled during off-peak hours.</p>

                                    <h4 className="font-semibold text-slate-800">4. Payment Terms</h4>
                                    <p>Subscriptions are billed in advance on a monthly or annual basis. Failure to pay may result in service suspension.</p>
                                </div>
                                <Button variant="outline" className="w-full mt-4 group">
                                    View Full Terms <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="shadow-lg border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-teal-600" />
                                <CardTitle>Suggestions & Feedback</CardTitle>
                            </div>
                            <CardDescription>Tell us how we can improve. We read every single suggestion.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="suggestion">Your Idea or Suggestion</Label>
                                <Textarea
                                    id="suggestion"
                                    placeholder="I wish the dashboard had..."
                                    className="min-h-[150px] bg-white border-teal-100 focus:border-teal-300 focus:ring-teal-200"
                                    value={suggestion}
                                    onChange={(e) => setSuggestion(e.target.value)}
                                />
                            </div>
                            <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-teal-100 bg-teal-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="min-w-0 italic text-sm text-teal-800">Suggestions help us prioritize our roadmap. Thank you for your partnership!</p>
                                <Button
                                    onClick={handleSubmitSuggestion}
                                    disabled={isSubmittingSuggestion}
                                    className="shrink-0 bg-teal-600 text-white shadow-md shadow-teal-500/20 hover:bg-teal-700 px-6 sm:px-8"
                                >
                                    {isSubmittingSuggestion ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        "Submit Suggestion"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                        <Button
                            asChild
                            variant="ghost"
                            className="h-auto min-w-0 py-4 flex flex-col gap-1.5 items-start text-left"
                        >
                            <Link href="/help-center" className="block w-full min-w-0 rounded-md p-1 -m-1">
                                <span className="block font-semibold text-teal-700">Help Center</span>
                                <span className="block text-xs text-slate-500 break-words">
                                    Guides, tutorials, and best practices for running your clinic on Dental Clinic Pro.
                                </span>
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            className="h-auto min-w-0 py-4 flex flex-col gap-1.5 items-start text-left"
                        >
                            <a href="mailto:support@antigravitydental.com" className="block w-full min-w-0 rounded-md p-1 -m-1">
                                <span className="block font-semibold text-blue-700">Contact Support</span>
                                <span className="block text-xs text-slate-500 break-words">
                                    Email our team anytime. We typically respond within one business day.
                                </span>
                            </a>
                        </Button>
                        <Button
                            asChild
                            variant="ghost"
                            className="h-auto min-w-0 py-4 flex flex-col gap-1.5 items-start text-left"
                        >
                            <Link href="/system-status" className="block w-full min-w-0 rounded-md p-1 -m-1">
                                <span className="block font-semibold text-purple-700">System Status</span>
                                <span className="block text-xs text-slate-500 break-words">
                                    Check current uptime, past incidents, and how to contact us if something looks off.
                                </span>
                            </Link>
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
