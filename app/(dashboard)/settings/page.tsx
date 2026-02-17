"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Building2, Bell, Shield, Palette, Globe, CreditCard, Users, Mail, Save, Loader2, LogOut, CheckCircle2, LifeBuoy, Info, Lock, MessageSquare, FileText, ChevronRight, Camera, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfilePictureUpload } from "@/components/patients/profile-picture-upload"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase"
import { format } from "date-fns"

export default function SettingsPage() {
    const { profile } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [mounted, setMounted] = useState(false)

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
        }
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
    const [billing, setBilling] = useState<any>(null)
    const [newMemberEmail, setNewMemberEmail] = useState("")

    // Security State
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: ""
    })

    // Profile Picture State
    const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false)
    const [userProfilePicture, setUserProfilePicture] = useState<string | null>(null)

    // Support State
    const [suggestion, setSuggestion] = useState("")
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false)

    const handleSubmitSuggestion = async () => {
        if (!suggestion.trim()) {
            toast.error("Please enter a suggestion")
            return
        }
        setIsSubmittingSuggestion(true)
        try {
            // In a real app, this would send to an API
            await new Promise(resolve => setTimeout(resolve, 1000))
            toast.success("Thank you for your feedback! We've received your suggestion.")
            setSuggestion("")
        } catch (error) {
            toast.error("Failed to send suggestion")
        } finally {
            setIsSubmittingSuggestion(false)
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
                    setClinic(clinicData)
                }

                if (teamRes.ok) {
                    const teamData = await teamRes.json()
                    setTeam(teamData)
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
        if (!newMemberEmail) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/settings/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newMemberEmail, role: 'staff' })
            })

            if (res.ok) {
                toast.success("Invitation sent successfully")
                setNewMemberEmail("")
            } else {
                toast.error("Failed to send invitation")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/settings/team', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            })

            if (res.ok) {
                toast.success("Role updated successfully")
                setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
            } else {
                toast.error("Failed to update role")
            }
        } catch (error) {
            toast.error("An error occurred")
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
                toast.success("Clinic settings updated successfully")
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

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-50 min-h-screen min-w-0 w-full overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 truncate">Settings</h2>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage your practice settings and preferences</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6 min-w-0">
                {/* Scrollable tab list on small screens so all sections are reachable */}
                <div className="w-full min-w-0 overflow-x-auto scrollbar-thin -mx-1 px-1 pb-1">
                    <TabsList className="inline-flex h-10 w-max min-h-[2.5rem] items-center justify-start gap-0.5 bg-white border border-slate-200 p-1 rounded-md">
                        <TabsTrigger value="profile" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <User className="h-4 w-4 shrink-0" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="general" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <Building2 className="h-4 w-4 shrink-0" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="notifications" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <Bell className="h-4 w-4 shrink-0" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <Shield className="h-4 w-4 shrink-0" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <CreditCard className="h-4 w-4 shrink-0" />
                            Billing
                        </TabsTrigger>
                        <TabsTrigger value="team" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <Users className="h-4 w-4 shrink-0" />
                            Team
                        </TabsTrigger>
                        <TabsTrigger value="support" className="gap-1.5 sm:gap-2 shrink-0 rounded-md px-2.5 sm:px-3 whitespace-nowrap">
                            <LifeBuoy className="h-4 w-4 shrink-0" />
                            Support
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Profile Settings */}
                <TabsContent value="profile" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Your Profile</CardTitle>
                            <CardDescription>Update your personal information and profile picture</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                        <AvatarImage src={userProfilePicture || undefined} />
                                        <AvatarFallback className="text-3xl bg-teal-100 text-teal-700">
                                            {profile?.first_name?.[0] || ''}{profile?.last_name?.[0] || ''}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        size="icon"
                                        onClick={() => setProfilePictureDialogOpen(true)}
                                        className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-white hover:bg-slate-50 text-teal-600 shadow-lg"
                                    >
                                        <Camera className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="text-center sm:text-left">
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {profile?.first_name} {profile?.last_name}
                                    </h3>
                                    <p className="text-sm text-slate-500 capitalize">{profile?.role?.replace('_', ' ') || 'Staff'}</p>
                                    <p className="text-sm text-slate-500 mt-1">{profile?.email}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => setProfilePictureDialogOpen(true)}
                                    >
                                        <Camera className="mr-2 h-4 w-4" />
                                        Change Photo
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input value={profile?.first_name || ''} disabled className="bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input value={profile?.last_name || ''} disabled className="bg-slate-50" />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input value={profile?.email || ''} disabled className="bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Input value={profile?.role?.replace('_', ' ') || ''} disabled className="bg-slate-50 capitalize" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">To update your name or email, please contact your clinic administrator.</p>
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
                </TabsContent>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Practice Information</CardTitle>
                            <CardDescription>Update your practice details and contact information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
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
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="practice-name">Practice Name</Label>
                                    <Input
                                        id="practice-name"
                                        value={clinic.name || ""}
                                        onChange={e => setClinic({ ...clinic, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="practice-email">Email Address</Label>
                                    <Input
                                        id="practice-email"
                                        type="email"
                                        value={clinic.email || ""}
                                        onChange={e => setClinic({ ...clinic, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="practice-phone">Phone Number</Label>
                                    <Input
                                        id="practice-phone"
                                        value={clinic.phone || ""}
                                        onChange={e => setClinic({ ...clinic, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="practice-website">Website</Label>
                                    <Input
                                        id="practice-website"
                                        value={clinic.website || ""}
                                        onChange={e => setClinic({ ...clinic, website: e.target.value })}
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

                {/* Billing Settings */}
                <TabsContent value="billing" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Subscription Plan</CardTitle>
                            <CardDescription>Manage your subscription and billing</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900 capitalize">{billing?.plan || "Starter"} Plan</h3>
                                        <p className="text-slate-600 mt-1">
                                            {billing?.plan === 'pro' ? '$199' : billing?.plan === 'growth' ? '$99' : '$49'}/month • Billed monthly
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded uppercase">
                                            {billing?.status || "active"}
                                        </span>
                                        <Button variant="outline" size="sm">Change Plan</Button>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Payment Method</h3>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <CreditCard className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium">•••• •••• •••• {billing?.payment_method?.last4 || "4242"}</p>
                                            <p className="text-sm text-slate-500">Expires {billing?.payment_method?.expiry || "12/2025"}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">Update</Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Billing History</h3>
                                <div className="space-y-2">
                                    {billing?.invoices?.length > 0 ? (
                                        billing.invoices.map((invoice: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b last:border-0 border-slate-100">
                                                <div>
                                                    <p className="font-medium">
                                                        {mounted ? format(new Date(invoice.issue_date), 'MMM d, yyyy') : 'Loading...'}
                                                    </p>
                                                    <p className="text-sm text-slate-500">{invoice.invoice_number}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="font-semibold text-right">${invoice.total_amount}</p>
                                                        <p className="text-xs text-slate-400 text-right capitalize">{invoice.status}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm">Download</Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg">
                                            No billing history found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Team Settings */}
                <TabsContent value="team" className="space-y-4 min-w-0 overflow-x-hidden">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>Manage team access and permissions</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">Invite Team Members</h3>
                                    <p className="text-sm text-slate-500">Add new members to your practice</p>
                                </div>
                                <Button className="bg-teal-600 hover:bg-teal-700">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Invite
                                </Button>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                {team.length > 0 ? (
                                    team.map((member, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.first_name} {member.last_name}</p>
                                                    <p className="text-sm text-slate-500">{member.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                                                <Select
                                                    defaultValue={member.role}
                                                    onValueChange={(val) => handleUpdateRole(member.id, val)}
                                                >
                                                    <SelectTrigger className="w-32 h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="clinic_admin">Admin</SelectItem>
                                                        <SelectItem value="dentist">Dentist</SelectItem>
                                                        <SelectItem value="hygienist">Hygienist</SelectItem>
                                                        <SelectItem value="receptionist">Staff</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    Remove
                                                </Button>
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
                            <div className="flex justify-between items-center bg-teal-50/50 p-4 rounded-lg border border-teal-100 italic text-sm text-teal-800">
                                <p>Suggestions help us prioritize our roadmap. Thank you for your partnership!</p>
                                <Button
                                    onClick={handleSubmitSuggestion}
                                    disabled={isSubmittingSuggestion}
                                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-500/20 px-8"
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

                    <div className="grid gap-4 md:grid-cols-3">
                        <Button variant="ghost" className="h-auto py-4 flex flex-col gap-1 items-start">
                            <span className="font-semibold text-teal-700">Help Center</span>
                            <span className="text-xs text-slate-500">Guides and tutorials</span>
                        </Button>
                        <Button variant="ghost" className="h-auto py-4 flex flex-col gap-1 items-start">
                            <span className="font-semibold text-blue-700">Contact Support</span>
                            <span className="text-xs text-slate-500">Talk to a human (24/7)</span>
                        </Button>
                        <Button variant="ghost" className="h-auto py-4 flex flex-col gap-1 items-start">
                            <span className="font-semibold text-purple-700">System Status</span>
                            <span className="text-xs text-slate-500">All systems operational</span>
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
