"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface TimeOffDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staffId: string
    staffName: string
    onSuccess: () => void
}

export function TimeOffDialog({ open, onOpenChange, staffId, staffName, onSuccess }: TimeOffDialogProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState({
        start_date: "",
        end_date: "",
        reason: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.start_date || !formData.end_date) {
            toast.error("Please select both start and end dates")
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch('/api/time-off-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    staff_id: staffId,
                    ...formData
                })
            })

            if (res.ok) {
                toast.success(`Time off requested for ${staffName}`)
                onSuccess()
                onOpenChange(false)
                setFormData({ start_date: "", end_date: "", reason: "" })
            } else {
                const error = await res.json()
                throw new Error(error.error || "Failed to submit request")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to submit time off request")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Request Time Off</DialogTitle>
                        <DialogDescription>
                            Schedule leave for {staffName}. Requests are set to pending by default.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason / Note</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g. Annual Leave, Conference, Medical..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving} className="bg-teal-600 hover:bg-teal-700">
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
