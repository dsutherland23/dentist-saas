"use client"

import { LandingReveal, LandingRevealStagger, LandingRevealStaggerItem } from "@/components/landing/landing-reveal"

const STEPS = [
  { title: "Patient Arrives", description: "Check-in at front desk or kiosk" },
  { title: "Check-in & Verify", description: "Insurance and demographics verified" },
  { title: "Treatment", description: "Clinical workflow in the operatory" },
  { title: "Clinical Notes", description: "Notes and charting in one place" },
  { title: "Billing & Checkout", description: "Collect payment and schedule follow-up" },
]

export function LandingWorkflow() {
  return (
    <section className="relative min-h-[420px] border-y border-white/5 py-20 lg:py-28" id="workflow">
      <LandingReveal className="container mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
          From Check-In to Checkout
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[hsl(213,31%,85%)]">
          One workflow for the whole practice.
        </p>
      </LandingReveal>
      <div className="container relative mx-auto max-w-6xl px-4 pt-14 sm:px-6">
        {/* Connecting line on desktop - behind content */}
        <div
          className="absolute left-8 right-8 top-[4.5rem] z-0 hidden h-0.5 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 lg:block"
          aria-hidden
        />
        <LandingRevealStagger className="relative z-10 flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-2" staggerChildren={0.1}>
          {STEPS.map((step, i) => (
            <LandingRevealStaggerItem key={step.title} className="flex flex-1 flex-col items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                <span className="text-sm font-bold text-primary">{i + 1}</span>
              </div>
              <div className="mt-3 text-center">
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-[hsl(213,31%,82%)]">{step.description}</p>
              </div>
            </LandingRevealStaggerItem>
          ))}
        </LandingRevealStagger>
      </div>
    </section>
  )
}
