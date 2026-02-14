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
import { UserPlus, Building2, Send } from "lucide-react"

interface AddSpecialistChoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isAdmin: boolean
    onChooseSendLink: () => void
    onChooseOther: () => void
    onChooseYourself: () => void
}

export function AddSpecialistChoiceDialog({
    open,
    onOpenChange,
    isAdmin,
    onChooseSendLink,
    onChooseOther,
    onChooseYourself,
}: AddSpecialistChoiceDialogProps) {
    const handleSendLink = () => {
        onOpenChange(false)
        onChooseSendLink()
    }
    const handleOther = () => {
        onOpenChange(false)
        onChooseOther()
    }
    const handleYourself = () => {
        onOpenChange(false)
        onChooseYourself()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md mx-4">
                <DialogHeader>
                    <DialogTitle className="text-lg">Add Specialist</DialogTitle>
                    <DialogDescription className="text-sm">
                        Add another practice or add yourself using your practice information.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-[3.5rem] py-3 px-3 justify-start gap-3 border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-left w-full"
                        onClick={handleSendLink}
                    >
                        <Send className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                        <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                            <span className="font-medium text-sm leading-tight">Send Referrals link</span>
                            <span className="text-xs text-slate-500 font-normal leading-tight">Share intake link via Email or WhatsApp</span>
                        </div>
                    </Button>
                    {isAdmin && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-auto min-h-[3.5rem] py-3 px-3 justify-start gap-3 border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-left w-full"
                            onClick={handleOther}
                        >
                            <UserPlus className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                            <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                                <span className="font-medium text-sm leading-tight">Add another specialist</span>
                                <span className="text-xs text-slate-500 font-normal leading-tight">Enter details and pin on map</span>
                            </div>
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-[3.5rem] py-3 px-3 justify-start gap-3 border-teal-200 hover:bg-teal-50 hover:border-teal-300 text-left w-full"
                        onClick={handleYourself}
                    >
                        <Building2 className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />
                        <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                            <span className="font-medium text-sm leading-tight">Add yourself</span>
                            <span className="text-xs text-slate-500 font-normal leading-tight">Use info from Settings, capture location</span>
                        </div>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
