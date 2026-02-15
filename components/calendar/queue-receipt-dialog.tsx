"use client"

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Printer } from "lucide-react"
import { APP_NAME, CREATED_BY, type ClinicBranding } from "@/lib/branding"

export interface QueueReceiptData {
    queueNumber: number
    patientName: string
    dateOfBirth: string | null
    doctorName: string
    dateTime: string
}

interface QueueReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data: QueueReceiptData | null
    /** Clinic branding for header (logo, name, website) and footer */
    clinic?: ClinicBranding | null
}

export function QueueReceiptDialog({ open, onOpenChange, data, clinic }: QueueReceiptDialogProps) {
    const dobFormatted = data?.dateOfBirth
        ? format(new Date(data.dateOfBirth), "MMM d, yyyy")
        : "—"

    const handlePrint = () => {
        if (!data) return
        const logoHtml = clinic?.logo_url
            ? `<img src="${clinic.logo_url.replace(/"/g, "&quot;")}" alt="Logo" style="height:28px;max-width:120px;object-fit:contain;margin-bottom:6px;" />`
            : ""
        const headerHtml = clinic
            ? `<div class="receipt-header" style="text-align:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">
  ${logoHtml}
  <div style="font-size:12px;font-weight:700;color:#0f172a;">${(clinic.name || "").replace(/</g, "&lt;")}</div>
  ${clinic.phone ? `<div style="font-size:9px;color:#64748b;">${String(clinic.phone).replace(/</g, "&lt;")}</div>` : ""}
  ${clinic.website ? `<div style="font-size:9px;color:#0d9488;"><a href="${String(clinic.website).replace(/"/g, "&quot;")}" style="color:inherit;">${String(clinic.website).replace(/</g, "&lt;")}</a></div>` : ""}
</div>`
            : ""
        const footerHtml = `<div class="receipt-footer" style="margin-top:12px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:8px;color:#94a3b8;text-align:center;">
  ${APP_NAME} — ${CREATED_BY}
</div>`
        const printWindow = window.open("", "_blank")
        if (!printWindow) return
        printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Queue Receipt - ${data.patientName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 0.25in; }
    @page { size: 2in 3.5in; margin: 0.15in; }
    .receipt { width: 1.7in; min-height: 3.2in; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px; }
    .queue { font-size: 42px; font-weight: 800; line-height: 1; color: #0f766e; }
    .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
    .name { font-size: 16px; font-weight: 700; color: #0f172a; }
    .detail { font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="receipt">
    ${headerHtml}
    <span class="label">Your Queue #</span>
    <span class="queue">${data.queueNumber}</span>
    <hr style="width:100%;border:none;border-top:1px solid #cbd5e1;margin:4px 0" />
    <span class="name">${data.patientName}</span>
    <span class="detail">DOB: ${dobFormatted}</span>
    <span class="detail">${data.doctorName}</span>
    <span class="detail">${data.dateTime}</span>
    ${footerHtml}
  </div>
</body>
</html>`)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 250)
    }

    if (!data) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-xs sm:max-w-xs">
                <DialogHeader>
                    <DialogTitle>Queue Receipt</DialogTitle>
                    <DialogDescription>
                        Print this receipt for the patient.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center py-4">
                    <div
                        className="receipt-preview w-[200px] min-h-[320px] rounded-lg border-2 border-slate-200 bg-slate-50 flex flex-col items-center justify-between gap-2 p-4 text-center"
                    >
                        {clinic && (
                            <div className="w-full border-b border-slate-200 pb-2 mb-1 space-y-1">
                                {clinic.logo_url && (
                                    <img src={clinic.logo_url} alt="" className="h-7 max-w-[120px] object-contain mx-auto" />
                                )}
                                <p className="text-xs font-bold text-slate-900">{clinic.name}</p>
                                {clinic.phone && <p className="text-[10px] text-slate-500">{clinic.phone}</p>}
                                {clinic.website && (
                                    <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-teal-600 block truncate">
                                        {clinic.website.replace(/^https?:\/\//, "")}
                                    </a>
                                )}
                            </div>
                        )}
                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Your Queue #</p>
                            <p className="text-4xl font-extrabold text-teal-700 leading-none">{data.queueNumber}</p>
                            <div className="w-full border-t border-slate-200 my-1" />
                            <p className="text-sm font-bold text-slate-900">{data.patientName}</p>
                            <p className="text-xs text-slate-600">DOB: {dobFormatted}</p>
                            <p className="text-xs text-slate-600">{data.doctorName}</p>
                            <p className="text-xs text-slate-600">{data.dateTime}</p>
                        </div>
                        <div className="w-full border-t border-slate-200 pt-2 mt-1 text-[9px] text-slate-400 text-center">
                            {APP_NAME} — {CREATED_BY}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    <Button
                        className="bg-teal-600 hover:bg-teal-700"
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
