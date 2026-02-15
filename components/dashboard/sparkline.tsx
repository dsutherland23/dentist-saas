"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface SparklineProps {
    data: number[]
    color?: string
    className?: string
}

export function Sparkline({ data, color = "#14b8a6", className = "" }: SparklineProps) {
    if (!data || data.length === 0) {
        return null
    }

    const chartData = data.map((value, index) => ({
        index,
        value
    }))

    return (
        <div className={`h-12 w-full ${className}`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id={`sparkline-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#sparkline-${color})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
