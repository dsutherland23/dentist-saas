"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    Save,
    MapPin,
    Stethoscope,
    Globe,
    Phone,
    Mail,
    Info,
    ExternalLink,
    Briefcase,
    ShieldCheck,
    Loader2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Specialty {
    id: string
    name: string
}

interface SpecialistProfile {
    id: string
    name: string
    specialty_id: string
    clinic_name: string
    address: string
    city: string
    parish: string
    phone: string
    email: string
    website: string
    bio: string
    status: string
    active: boolean
}

export default function ClinicalReferralsSettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [specialties, setSpecialties] = React.useState<Specialty[]>([])
    const [profile, setProfile] = React.useState<SpecialistProfile | null>(null)
    const [formData, setFormData] = React.useState({
        name: "",
        specialty_id: "",
        clinic_name: "",
        address: "",
        city: "",
        parish: "",
        phone: "",
        email: "",
        website: "",
        bio: "",
        active: true
    })

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch specialties
                const specRes = await fetch("/api/specialties")
                const specData = await specRes.json()
                setSpecialties(specData)

                // Fetch my specialist profile
                const profileRes = await fetch("/api/specialists?myProfile=true")
                const profileData = await profileRes.json()

                if (profileData && profileData.length > 0) {
                    const myProfile = profileData[0]
                    setProfile(myProfile)
                    setFormData({
                        name: myProfile.name || "",
                        specialty_id: myProfile.specialty_id || "",
                        clinic_name: myProfile.clinic_name || "",
                        address: myProfile.address || "",
                        city: myProfile.city || "",
                        parish: myProfile.parish || "",
                        phone: myProfile.phone || "",
                        email: myProfile.email || "",
                        website: myProfile.website || "",
                        bio: myProfile.bio || "",
                        active: myProfile.status === 'approved' // Simplified logic for now
                    })
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error)
                toast.error("Failed to load settings")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleSave = async () => {
        if (!profile) {
            toast.error("Please register as a specialist first")
            return
        }

        setSaving(true)
        try {
            const response = await fetch("/api/specialists", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: profile.id,
                    ...formData
                }),
            })

            if (!response.ok) throw new Error("Failed to save settings")

            toast.success("Settings saved successfully")
        } catch (error) {
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-teal-600 mb-4" />
                <p className="text-slate-500 font-medium">Loading settings...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/clinical-referrals")}
                            className="mb-4 -ml-2 text-slate-500 hover:text-teal-600"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Map
                        </Button>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Referral Settings</h1>
                        <p className="text-lg text-slate-600 mt-2">Manage your clinical profile and referral preferences</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!profile && (
                            <Button
                                onClick={() => router.push("/clinical-referrals")}
                                className="bg-teal-600 hover:bg-teal-700 shadow-md"
                            >
                                Register as Specialist
                            </Button>
                        )}
                        {profile && (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-slate-900 hover:bg-slate-800 shadow-lg px-8 py-6 h-auto text-lg font-bold transition-all hover:scale-[1.02]"
                            >
                                {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Save Changes
                            </Button>
                        )}
                    </div>
                </div>

                {!profile ? (
                    <Card className="p-12 text-center bg-white rounded-3xl border-slate-100 shadow-sm">
                        <div className="mx-auto w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6">
                            <Stethoscope className="h-10 w-10 text-teal-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Not Registered as a Specialist</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                            To appear in the specialist discovery map and receive referrals, you need to register your professional profile first.
                        </p>
                        <Button
                            onClick={() => router.push("/clinical-referrals")}
                            className="bg-teal-600 hover:bg-teal-700 h-12 px-8 rounded-xl text-lg"
                        >
                            Complete Registration
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Core Settings */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Professional Info */}
                            <Card className="p-8 rounded-3xl border-slate-100 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-teal-50 rounded-lg">
                                        <Briefcase className="h-6 w-6 text-teal-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Professional Identity</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Your Full Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="h-12 border-slate-200 rounded-xl focus:ring-teal-500"
                                            placeholder="Dr. Jane Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Specialty</Label>
                                        <Select
                                            value={formData.specialty_id}
                                            onValueChange={(v) => setFormData({ ...formData, specialty_id: v })}
                                        >
                                            <SelectTrigger className="h-12 border-slate-200 rounded-xl">
                                                <SelectValue placeholder="Select specialty" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {specialties.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-slate-700 font-semibold">Professional Bio / Introduction</Label>
                                        <Textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            className="min-h-[120px] border-slate-200 rounded-xl focus:ring-teal-500 leading-relaxed"
                                            placeholder="Tell other dentists about your expertise and focus areas..."
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Practice Info */}
                            <Card className="p-8 rounded-3xl border-slate-100 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <MapPin className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Clinic Visibility</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-slate-700 font-semibold">Clinic Name</Label>
                                        <Input
                                            value={formData.clinic_name}
                                            onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                                            className="h-12 border-slate-200 rounded-xl"
                                            placeholder="Emerald Dental Arts"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-slate-700 font-semibold">Full Address</Label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="h-12 border-slate-200 rounded-xl"
                                            placeholder="123 Hope Road"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">City</Label>
                                        <Input
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="h-12 border-slate-200 rounded-xl"
                                            placeholder="Kingston"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Parish / State</Label>
                                        <Input
                                            value={formData.parish}
                                            onChange={(e) => setFormData({ ...formData, parish: e.target.value })}
                                            className="h-12 border-slate-200 rounded-xl"
                                            placeholder="St. Andrew"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column: Preferences & Status */}
                        <div className="space-y-8">
                            {/* Status Card */}
                            <Card className="p-6 rounded-3xl border-slate-100 shadow-sm bg-white overflow-hidden">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Profile Status</div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${profile?.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            profile?.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {profile?.status}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 mb-4">
                                    <Switch
                                        checked={profile?.status === 'approved'}
                                        disabled={profile?.status !== 'approved'}
                                    />
                                    <div>
                                        <Label className="font-bold text-slate-900 block">Appear in Map</Label>
                                        <span className="text-xs text-slate-500">Only available when approved</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-100 border-dashed border-2 border-slate-200 rounded-2xl flex items-center gap-4 grayscale opacity-60">
                                    <Switch disabled />
                                    <div>
                                        <Label className="font-bold text-slate-400 block tracking-tight">Accept Referrals</Label>
                                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Coming Soon</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Contact Card */}
                            <Card className="p-6 rounded-3xl border-slate-100 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                                    <Phone className="h-4 w-4 text-slate-400" />
                                    Contact for Referrals
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Practice Phone</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="h-10 border-slate-200 rounded-lg bg-slate-50"
                                            placeholder="(876) 000-0000"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Practice Email</Label>
                                        <Input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="h-10 border-slate-200 rounded-lg bg-slate-50"
                                            placeholder="clinic@example.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 uppercase ml-1">Website</Label>
                                        <Input
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            className="h-10 border-slate-200 rounded-lg bg-slate-50"
                                            placeholder="www.yourclinic.com"
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Portfolio Tip */}
                            <Card className="p-6 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg border-none relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <ExternalLink className="h-24 w-24" />
                                </div>
                                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5" />
                                    Portfolio Power
                                </h3>
                                <p className="text-teal-50 text-xs leading-relaxed mb-4">
                                    Dentists are 74% more likely to refer to specialists who showcase verified clinical cases.
                                </p>
                                <Button
                                    className="w-full bg-white text-teal-700 hover:bg-teal-50 border-none font-bold"
                                    onClick={() => toast.info("Portfolio builder coming soon!")}
                                >
                                    Build Portfolio
                                </Button>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
