"use client"

import Image from "next/image"
import { useState } from "react"
import { Calendar, Users, CreditCard, BarChart3 } from "lucide-react"
import { LandingReveal } from "@/components/landing/landing-reveal"
import { cn } from "@/lib/utils"

const SHOWCASE_BLOCKS = [
    {
        id: "scheduling",
        title: "Scheduling & calendar",
        description:
            "One calendar for your whole practice. Appointments, blocked slots, and team visibility in a single view.",
        imagePath: "/images/landing/screenshots/calendar.webp",
        icon: Calendar,
        gradient: "from-violet-500 to-purple-600",
        imageLeft: false,
    },
    {
        id: "patients",
        title: "Patients & records",
        description:
            "Patient records, contact info, and ID scan to capture name and DOB from a photo—all in one place.",
        imagePath: "/images/landing/screenshots/patients.webp",
        icon: Users,
        gradient: "from-pink-500 to-rose-600",
        imageLeft: true,
    },
    {
        id: "billing",
        title: "Billing & insurance",
        description:
            "Invoices, insurance claims, and payments without the paperwork. Track what’s submitted and what’s paid.",
        imagePath: "/images/landing/screenshots/insurance-claims.webp",
        icon: CreditCard,
        gradient: "from-emerald-500 to-teal-600",
        imageLeft: false,
    },
    {
        id: "reports",
        title: "Reports & analytics",
        description:
            "Reports and analytics for your practice. Staff management and team planner so everyone stays in sync.",
        imagePath: "/images/landing/screenshots/dashboard.webp",
        icon: BarChart3,
        gradient: "from-orange-500 to-amber-600",
        imageLeft: true,
    },
] as const

function ShowcaseBlock({
    title,
    description,
    imagePath,
    icon: Icon,
    gradient,
    imageLeft,
}: {
    title: string
    description: string
    imagePath: string
    icon: React.ComponentType<{ className?: string }>
    gradient: string
    imageLeft: boolean
}) {
    const [imgFailed, setImgFailed] = useState(false)

    const mediaBlock = (
        <div className="relative overflow-hidden rounded-2xl bg-[hsl(var(--card))] shadow-xl ring-1 ring-white/8">
            {/* Browser chrome: three dots + URL bar */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2.5 rounded-t-2xl">
                <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="ml-4 flex-1 rounded-md border border-white/10 bg-white/5 py-1.5 px-3">
                    <span className="text-xs text-[hsl(213,31%,70%)]">app.dentalcarepro.com</span>
                </div>
            </div>
            {!imgFailed ? (
                <div className="relative aspect-video w-full">
                    <Image
                        src={imagePath}
                        alt=""
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        onError={() => setImgFailed(true)}
                    />
                </div>
            ) : (
                <div
                    className={cn(
                        "flex aspect-video w-full items-center justify-center rounded-b-2xl bg-gradient-to-br text-white",
                        gradient
                    )}
                >
                    <Icon className="h-16 w-16 opacity-90" />
                </div>
            )}
        </div>
    )

    const copyBlock = (
        <div className="flex flex-col justify-center">
            <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {title}
            </h3>
            <p className="mt-2 text-[hsl(213,31%,85%)]">{description}</p>
        </div>
    )

    return (
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
            {imageLeft ? (
                <>
                    {mediaBlock}
                    {copyBlock}
                </>
            ) : (
                <>
                    {copyBlock}
                    {mediaBlock}
                </>
            )}
        </div>
    )
}

export function LandingFeatureShowcase() {
    return (
        <section id="showcase" className="border-b border-white/5 px-4 py-16 sm:px-6 sm:py-24">
            <div className="container mx-auto max-w-6xl">
                <LandingReveal className="mb-14 border-t border-primary/30 pt-14 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        See the platform in action
                    </h2>
                    <p className="mt-2 text-[hsl(213,31%,85%)] max-w-2xl mx-auto">
                        Everything your practice needs—scheduling, patients, billing, and team—in one place.
                    </p>
                </LandingReveal>
                <div className="space-y-20 lg:space-y-28">
                    {SHOWCASE_BLOCKS.map((block) => (
                        <LandingReveal key={block.id}>
                            <ShowcaseBlock
                                title={block.title}
                                description={block.description}
                                imagePath={block.imagePath}
                                icon={block.icon}
                                gradient={block.gradient}
                                imageLeft={block.imageLeft}
                            />
                        </LandingReveal>
                    ))}
                </div>
            </div>
        </section>
    )
}
