"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { ParallaxLayer } from "@/components/landing/parallax-layer"
import { useLandingDemo } from "@/components/landing/landing-demo-provider"

const HERO_IMAGE_SRC =
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&q=80"

const HEADLINE_WORDS = ["Run", "your", "practice", "from", "one", "place"]

export function LandingHero() {
  const { openDemo } = useLandingDemo()

  return (
    <section className="relative min-h-screen overflow-hidden border-b bg-[hsl(222,47%,6%)]">
      {/* Radial glows */}
      <div
        className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-teal-500/20 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-500/15 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[80px]"
        aria-hidden
      />

      <div className="container relative mx-auto flex min-h-screen flex-col px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:items-center lg:gap-12 lg:py-20">
        {/* Left: copy (60%) */}
        <div className="flex flex-1 flex-col justify-center lg:max-w-[60%]">
          <div className="text-center lg:text-left">
            <h1 className="flex flex-wrap justify-center gap-x-2 font-bold tracking-tight text-white lg:justify-start sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              {HEADLINE_WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 + i * 0.06,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mt-5 text-lg text-[hsl(213,31%,92%)] sm:text-xl"
            >
              Scheduling, patients, billing, and insurance—without the paperwork.
              Modern practice management built for dental teams.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Button
                size="lg"
                className="gap-2 bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:bg-primary/90 hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
                onClick={() => openDemo("hero")}
              >
                Book Demo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
              <Button variant="outline" size="lg" asChild className="landing-btn-outline border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link href="/signup">Start free</Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Right: 3D floating mockup (40%) */}
        <div className="relative mt-12 flex flex-1 justify-center lg:mt-0 lg:max-w-[40%]">
          <ParallaxLayer offset={60} className="relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="rotate-[2deg] animate-float rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/30"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src={HERO_IMAGE_SRC}
                  alt="Modern dental practice — clean, professional environment for patient care"
                  width={1200}
                  height={800}
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="h-auto w-full object-cover"
                />
                <div className="absolute inset-0 rounded-2xl ring-inset ring-white/10" aria-hidden />
              </div>
            </motion.div>
          </ParallaxLayer>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <a
          href="#features"
          className="flex flex-col items-center gap-1 text-[hsl(213,31%,85%)] transition-colors hover:text-white"
          aria-label="Scroll to features"
        >
          <ChevronDown className="h-8 w-8 animate-bounce" aria-hidden />
        </a>
      </motion.div>
    </section>
  )
}
