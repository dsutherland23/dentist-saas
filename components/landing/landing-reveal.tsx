"use client"

import { motion } from "framer-motion"
import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

type LandingRevealProps = {
    children: ReactNode
    className?: string
    /** Stagger delay in seconds for child motion elements; use with staggerChildren on parent */
    delay?: number
    /** Amount of upward slide in px */
    y?: number
    /** Once revealed, don't animate again */
    once?: boolean
}

const defaultTransition = {
    duration: 0.5,
    ease: [0.25, 0.46, 0.45, 0.94] as const,
}

export function LandingReveal({
    children,
    className,
    delay = 0,
    y = 24,
    once = true,
}: LandingRevealProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once, margin: "-8% 0px -8% 0px" }}
            transition={{ ...defaultTransition, delay }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}

type LandingRevealStaggerProps = {
    children: ReactNode
    className?: string
    /** Delay between each child in seconds */
    staggerChildren?: number
    once?: boolean
}

export function LandingRevealStagger({
    children,
    className,
    staggerChildren = 0.08,
    once = true,
}: LandingRevealStaggerProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once, margin: "-5% 0px -5% 0px" }}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren,
                        delayChildren: 0.1,
                    },
                },
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}

/** Wrapper for a single stagger child; use with LandingRevealStagger by wrapping each item */
export function LandingRevealStaggerItem({
    children,
    className,
    y = 24,
}: {
    children: ReactNode
    className?: string
    y?: number
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: defaultTransition,
                },
            }}
            className={cn(className)}
        >
            {children}
        </motion.div>
    )
}
