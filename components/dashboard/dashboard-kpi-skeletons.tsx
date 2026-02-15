"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { DollarSign, TrendingUp, Activity } from "lucide-react"

export function DashboardKPISkeletons() {
    return (
        <>
            {/* Today's Production Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 shadow-xl shadow-teal-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-white/20" />
                        <Skeleton className="h-8 w-24 bg-white/20" />
                        <Skeleton className="h-3 w-28 bg-white/20" />
                    </div>
                </div>
            </div>

            {/* MTD Production Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 shadow-xl shadow-emerald-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 bg-white/20" />
                        <Skeleton className="h-8 w-28 bg-white/20" />
                        <Skeleton className="h-3 w-32 bg-white/20" />
                    </div>
                </div>
            </div>

            {/* Collected Today Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-xl shadow-blue-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 bg-white/20" />
                        <Skeleton className="h-8 w-20 bg-white/20" />
                        <Skeleton className="h-3 w-32 bg-white/20" />
                    </div>
                </div>
            </div>

            {/* Collection Rate Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-xl shadow-purple-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28 bg-white/20" />
                        <Skeleton className="h-8 w-16 bg-white/20" />
                        <Skeleton className="h-3 w-24 bg-white/20" />
                    </div>
                </div>
            </div>

            {/* Outstanding Claims Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 shadow-xl shadow-amber-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Activity className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-white/20" />
                        <Skeleton className="h-8 w-20 bg-white/20" />
                        <Skeleton className="h-3 w-24 bg-white/20" />
                    </div>
                </div>
            </div>

            {/* AR Total Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-6 shadow-xl shadow-rose-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32 bg-white/20" />
                        <Skeleton className="h-8 w-24 bg-white/20" />
                        <Skeleton className="h-3 w-36 bg-white/20" />
                    </div>
                </div>
            </div>
        </>
    )
}
