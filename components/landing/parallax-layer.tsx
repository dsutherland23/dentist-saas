"use client"

import { useScroll, useTransform, motion } from "framer-motion"
import { type ReactNode, useRef } from "react"
import { cn } from "@/lib/utils"

type ParallaxLayerProps = {
    children: ReactNode
    className?: string
    /** Max vertical movement in px as user scrolls through the section. Positive = layer moves down, so it appears to scroll up slower (parallax). */
    offset?: number
}

export function ParallaxLayer({
    children,
    className,
    offset = 80,
}: ParallaxLayerProps) {
    const ref = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    })
    const y = useTransform(scrollYProgress, [0, 1], [0, offset])

    return (
        <motion.div ref={ref} style={{ y }} className={cn(className)}>
            {children}
        </motion.div>
    )
}
