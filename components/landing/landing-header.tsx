"use client"

import { useState } from "react"
import Link from "next/link"
import { useScroll, useMotionValueEvent } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Smile, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLandingDemo } from "@/components/landing/landing-demo-provider"

const SCROLL_THRESHOLD = 60

const NAV_LINKS: Array<{ href: string; label: string; openDemo?: true }> = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#", label: "Demo", openDemo: true },
]

export function LandingHeader() {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { openDemo } = useLandingDemo()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > SCROLL_THRESHOLD)
  })

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "border-b border-white/10 bg-[hsl(222,47%,6%)]/80 shadow-lg backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div
          className={cn(
            "container flex items-center justify-between px-4 transition-[height] duration-300 sm:px-6",
            isScrolled ? "h-12" : "h-14"
          )}
        >
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <Smile className="h-6 w-6 text-primary" aria-hidden />
            <span>DentalCare Pro</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((item) =>
              item.openDemo ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => openDemo("header")}
                  className="text-sm text-[hsl(213,31%,92%)] hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm text-[hsl(213,31%,92%)] hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              )
            )}
            <Button variant="ghost" asChild size="sm" className="landing-btn-ghost text-white hover:bg-white/10">
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              size="sm"
              onClick={() => openDemo("header")}
              className="bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:bg-primary/90 hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
            >
              Book Demo
            </Button>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              size="sm"
              onClick={() => openDemo("header")}
              className="bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
            >
              Book Demo
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-[hsl(222,47%,6%)]/98 backdrop-blur-lg transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </Button>
          {NAV_LINKS.map((item) =>
            item.openDemo ? (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  openDemo("header")
                  setMobileOpen(false)
                }}
                className="text-lg font-medium text-white hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg font-medium text-white hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            )
          )}
          <Button variant="ghost" asChild size="lg" className="landing-btn-ghost text-white hover:bg-white/10">
            <Link href="/login" onClick={() => setMobileOpen(false)}>
              Log in
            </Link>
          </Button>
          <Button
            size="lg"
            onClick={() => {
              openDemo("header")
              setMobileOpen(false)
            }}
            className="bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          >
            Book Demo
          </Button>
        </div>
      </div>
    </>
  )
}
