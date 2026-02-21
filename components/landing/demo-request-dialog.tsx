"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

const ROLES = ["Owner", "Practice Manager", "Dentist", "Front Desk", "Other"] as const
const PMS_OPTIONS = ["None", "Dentrix", "Dentrix Ascend", "Eaglesoft", "Open Dental", "Other"] as const
const BEST_TIME_OPTIONS = ["Morning (8–12)", "Afternoon (12–4)", "Evening (4–7)"] as const

const schema = z.object({
    practice_name: z.string().min(1, "Practice name is required"),
    contact_name: z.string().min(1, "Your name is required"),
    role: z.enum(ROLES),
    email: z.string().email("Valid work email is required"),
    phone: z.string().min(5, "Phone number is required"),
    current_pms: z.string().optional(),
    best_time: z.string().optional(),
    opt_in_updates: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

type DemoRequestDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    source?: string
}

export function DemoRequestDialog({
    open,
    onOpenChange,
    source = "landing",
}: DemoRequestDialogProps) {
    const [submitted, setSubmitted] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            practice_name: "",
            contact_name: "",
            role: undefined,
            email: "",
            phone: "",
            current_pms: "",
            best_time: "",
            opt_in_updates: false,
        },
    })

    async function onSubmit(values: FormValues) {
        try {
            const res = await fetch("/api/demo-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practice_name: values.practice_name,
                    contact_name: values.contact_name,
                    role: values.role,
                    email: values.email,
                    phone: values.phone,
                    current_pms: values.current_pms || null,
                    best_time: values.best_time || null,
                    opt_in_updates: values.opt_in_updates ?? false,
                    source,
                }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                toast.error(data.error || "Failed to submit")
                return
            }
            toast.success("Request received! We’ll be in touch soon.")
            setSubmitted(true)
            form.reset()
            setTimeout(() => {
                onOpenChange(false)
                setSubmitted(false)
            }, 1500)
        } catch {
            toast.error("Something went wrong. Please try again.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px] rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule a Demo</DialogTitle>
                    <DialogDescription>
                        Tell us about your practice and we’ll reach out to set up a personalized walkthrough.
                    </DialogDescription>
                </DialogHeader>
                {submitted ? (
                    <p className="py-6 text-center text-muted-foreground">
                        Thank you! A team member will contact you shortly.
                    </p>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="practice_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Practice name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Bright Smile Dental"
                                                className="rounded-xl"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contact_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Your full name"
                                                className="rounded-xl"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Your role</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {ROLES.map((r) => (
                                                    <SelectItem key={r} value={r}>
                                                        {r}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Work email</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="you@practice.com"
                                                className="rounded-xl"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="tel"
                                                placeholder="(555) 000-0000"
                                                className="rounded-xl"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="current_pms"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current software (optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select if applicable" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PMS_OPTIONS.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {p}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="best_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Best time to call (optional)</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value || ""}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Select preference" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {BEST_TIME_OPTIONS.map((t) => (
                                                    <SelectItem key={t} value={t}>
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="opt_in_updates"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start gap-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-sm font-normal cursor-pointer">
                                                Send me product updates and tips
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl"
                                disabled={form.formState.isSubmitting}
                            >
                                {form.formState.isSubmitting
                                    ? "Submitting…"
                                    : "Request demo"}
                            </Button>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}
