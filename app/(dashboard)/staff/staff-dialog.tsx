"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, ChevronDown, ChevronUp, Copy, CheckCircle2, Key } from "lucide-react"
import { SECTIONS, LIMIT_TYPES } from "@/lib/access-config"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface StaffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staff?: any // If present, we're editing
    onSuccess: () => void
}

export function StaffDialog({ open, onOpenChange, staff, onSuccess }: StaffDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        role: "receptionist",
        phone: "",
    })
    const [allowedSections, setAllowedSections] = useState<string[]>([])
    const [hasRestrictions, setHasRestrictions] = useState(false)
    const [limits, setLimits] = useState<Record<string, number | undefined>>({})

    useEffect(() => {
        if (!open) {
            setTempCredentials(null)
            setCopied(false)
            setIsResetting(false)
        }
        if (staff) {
            setFormData({
                first_name: staff.first_name || "",
                last_name: staff.last_name || "",
                email: staff.email || "",
                role: staff.role || "receptionist",
                phone: staff.phone || "",
            })
            
            // Set allowed sections
            if (staff.allowed_sections && staff.allowed_sections.length > 0) {
                setAllowedSections(staff.allowed_sections)
                setHasRestrictions(true)
            } else {
                setAllowedSections([])
                setHasRestrictions(false)
            }
            
            // Set limits
            setLimits(staff.limits || {})
        } else {
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                role: "receptionist",
                phone: "",
            })
            setAllowedSections([])
            setHasRestrictions(false)
            setLimits({})
        }
    }, [staff, open])

    const toggleSection = (sectionKey: string) => {
        setAllowedSections(prev => {
            if (prev.includes(sectionKey)) {
                return prev.filter(k => k !== sectionKey)
            } else {
                return [...prev, sectionKey]
            }
        })
    }

    const toggleAllSections = () => {
        if (allowedSections.length === SECTIONS.length) {
            setAllowedSections([])
        } else {
            setAllowedSections(SECTIONS.map(s => s.key))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            // Prepare body
            const body: any = { ...formData }
            
            // Add allowed_sections (null if no restrictions)
            body.allowed_sections = hasRestrictions && allowedSections.length > 0 
                ? allowedSections 
                : null
            
            // Add limits (filter out undefined/empty values)
            const filteredLimits: Record<string, number> = {}
            Object.entries(limits).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value > 0) {
                    filteredLimits[key] = value
                }
            })
            body.limits = filteredLimits

            let res: Response
            
            if (staff) {
                // Edit existing staff
                res = await fetch('/api/staff', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...body, id: staff.id })
                })
            } else {
                // Invite new staff
                res = await fetch('/api/staff/invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })
            }

            if (res.ok) {
                const result = await res.json()
                console.log("[STAFF_INVITE_RESPONSE]", result) // Debug log
                if (staff) {
                    toast.success("Staff updated successfully")
                    onSuccess()
                    onOpenChange(false)
                } else {
                    toast.success(result.message || "Account created successfully")
                    onSuccess()
                    if (result.temp_password) {
                        console.log("[SETTING_TEMP_CREDENTIALS]", { email: formData.email, password: result.temp_password })
                        setTempCredentials({ email: formData.email, password: result.temp_password })
                    } else {
                        console.warn("[NO_TEMP_PASSWORD_IN_RESPONSE]", result)
                        onOpenChange(false)
                    }
                }
            } else {
                const err = await res.json()
                const msg = err.detail ? `${err.error}: ${err.detail}` : (err.error || "Something went wrong")
                toast.error(msg)
            }
        } catch (error) {
            toast.error("Failed to save staff member")
        } finally {
            setIsSaving(false)
        }
    }

    const handleCopyCredentials = () => {
        if (!tempCredentials) return
        const text = `Email: ${tempCredentials.email}\nTemporary Password: ${tempCredentials.password}\n\nPlease log in and change your password immediately.`
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            toast.success("Credentials copied to clipboard")
            setTimeout(() => setCopied(false), 3000)
        })
    }

    if (tempCredentials) {
        console.log("[RENDERING_TEMP_CREDENTIALS_DIALOG]", tempCredentials)
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            Staff Account Created
                        </DialogTitle>
                        <DialogDescription>
                            Share these temporary credentials with the new staff member. They will be required to change their password on first login.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Temporary Login Credentials</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-amber-700">Email:</span>
                                    <span className="text-sm font-mono font-semibold text-amber-900">{tempCredentials.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-amber-700">Password:</span>
                                    <span className="text-sm font-mono font-semibold text-amber-900">{tempCredentials.password}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            This password is shown only once and cannot be retrieved later. The staff member will be required to set a new password on their first login.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-2">
                        <Button type="button" variant="outline" onClick={handleCopyCredentials} className="gap-2">
                            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy credentials"}
                        </Button>
                        <Button type="button" onClick={() => onOpenChange(false)} className="bg-teal-600 hover:bg-teal-700">
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {staff ? "Edit Staff Member" : "Invite Staff Member"}
                        </DialogTitle>
                        <DialogDescription>
                            {staff 
                                ? "Update the details, access, and limits for this team member." 
                                : "Send an invitation email with access controls and limits."}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={!!staff}
                            />
                            {staff && (
                                <p className="text-xs text-muted-foreground">
                                    Email cannot be changed after invitation
                                </p>
                            )}
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dentist">Dentist</SelectItem>
                                    <SelectItem value="hygienist">Hygienist</SelectItem>
                                    <SelectItem value="receptionist">Receptionist</SelectItem>
                                    <SelectItem value="accountant">Accountant</SelectItem>
                                    <SelectItem value="clinic_admin">Administrator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Access Control Section */}
                        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                            <CollapsibleTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full justify-between p-0 hover:bg-transparent"
                                >
                                    <span className="text-sm font-semibold">Advanced: Access Control & Limits</span>
                                    {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="space-y-4 pt-4">
                                {/* Section Access */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Section Access</Label>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="hasRestrictions"
                                                checked={hasRestrictions}
                                                onCheckedChange={(checked) => setHasRestrictions(!!checked)}
                                            />
                                            <label
                                                htmlFor="hasRestrictions"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                Restrict access
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {!hasRestrictions && (
                                        <p className="text-xs text-muted-foreground">
                                            User has full access to all sections
                                        </p>
                                    )}
                                    
                                    {hasRestrictions && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Select which sections this user can access
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="link"
                                                    size="sm"
                                                    onClick={toggleAllSections}
                                                    className="h-auto p-0 text-xs"
                                                >
                                                    {allowedSections.length === SECTIONS.length ? "Deselect All" : "Select All"}
                                                </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                                {SECTIONS.map((section) => (
                                                    <div key={section.key} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`section-${section.key}`}
                                                            checked={allowedSections.includes(section.key)}
                                                            onCheckedChange={() => toggleSection(section.key)}
                                                        />
                                                        <label
                                                            htmlFor={`section-${section.key}`}
                                                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {section.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Usage Limits */}
                                <div className="space-y-3">
                                    <Label>Usage Limits</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Leave blank or 0 for unlimited
                                    </p>
                                    
                                    <div className="space-y-3">
                                        {LIMIT_TYPES.map((limitType) => (
                                            <div key={limitType.key} className="space-y-1">
                                                <Label htmlFor={`limit-${limitType.key}`} className="text-sm">
                                                    {limitType.label}
                                                </Label>
                                                <Input
                                                    id={`limit-${limitType.key}`}
                                                    type="number"
                                                    min="0"
                                                    placeholder="Unlimited"
                                                    value={limits[limitType.key] || ""}
                                                    onChange={(e) => setLimits({
                                                        ...limits,
                                                        [limitType.key]: e.target.value ? parseInt(e.target.value) : undefined
                                                    })}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    {limitType.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </div>
                    
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        {staff && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={async () => {
                                    setIsResetting(true)
                                    try {
                                        const res = await fetch("/api/staff/reset-password", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ staff_id: staff.id }),
                                        })
                                        if (res.ok) {
                                            const result = await res.json()
                                            toast.success("Password reset successfully")
                                            setTempCredentials({ email: result.email, password: result.temp_password })
                                        } else {
                                            const err = await res.json()
                                            toast.error(err.error || "Failed to reset password")
                                        }
                                    } catch (error) {
                                        toast.error("Failed to reset password")
                                    } finally {
                                        setIsResetting(false)
                                    }
                                }}
                                disabled={isResetting || isSaving}
                                className="gap-2"
                            >
                                {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                                Reset Password & Get Credentials
                            </Button>
                        )}
                        <div className="flex gap-2 sm:ml-auto">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {staff ? "Save Changes" : "Send Invitation"}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
