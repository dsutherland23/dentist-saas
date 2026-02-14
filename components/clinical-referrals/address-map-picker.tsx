"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin } from "lucide-react"

const AddressMapInner = dynamic(() => import("./address-map-inner").then((m) => ({ default: m.AddressMapInner })), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[220px] bg-slate-50 border border-slate-200 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
    ),
})

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
    address?: {
        road?: string
        suburb?: string
        neighbourhood?: string
        city?: string
        town?: string
        village?: string
        hamlet?: string
        municipality?: string
        county?: string
        state?: string
        postcode?: string
        country?: string
    }
}

interface AddressMapPickerProps {
    address: string
    city: string
    parish: string
    lat: number
    lng: number
    onUpdate: (updates: Partial<{ address: string; city: string; parish: string; lat: number; lng: number }>) => void
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
const DEBOUNCE_MS = 450

export function AddressMapPicker({ address, city, parish, lat, lng, onUpdate }: AddressMapPickerProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
    const [loading, setLoading] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSuggestions([])
            return
        }
        setLoading(true)
        try {
            const params = new URLSearchParams({
                q: query,
                format: "json",
                limit: "5",
                addressdetails: "1",
            })
            const res = await fetch(`${NOMINATIM_URL}?${params}`, {
                headers: {
                    "User-Agent": "DentistSaaS-ReferralDirectory/1.0",
                },
            })
            const data: NominatimResult[] = await res.json()
            setSuggestions(data)
        } catch {
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (!searchQuery.trim()) {
            setSuggestions([])
            return
        }
        debounceRef.current = setTimeout(() => {
            fetchSuggestions(searchQuery)
        }, DEBOUNCE_MS)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [searchQuery, fetchSuggestions])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selectSuggestion = (r: NominatimResult) => {
        const latNum = parseFloat(r.lat)
        const lngNum = parseFloat(r.lon)
        const addr = r.address || {}
        const cityVal = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.neighbourhood || ""
        const parishVal = addr.state || addr.county || addr.municipality || ""
        onUpdate({
            address: r.display_name,
            city: cityVal,
            parish: parishVal,
            lat: latNum,
            lng: lngNum,
        })
        setSearchQuery(r.display_name)
        setSuggestions([])
        setShowDropdown(false)
    }

    const handlePositionChange = useCallback(
        (newLat: number, newLng: number) => {
            onUpdate({ lat: newLat, lng: newLng })
        },
        [onUpdate]
    )

    return (
        <div className="space-y-3">
            <div>
                <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Search address
                </Label>
                <div className="relative" ref={dropdownRef}>
                    <Input
                        placeholder="Search for an address..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setShowDropdown(true)
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="mt-1"
                    />
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        </div>
                    )}
                    {showDropdown && suggestions.length > 0 && (
                        <ul className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-48 overflow-auto">
                            {suggestions.map((r, i) => (
                                <li
                                    key={i}
                                    className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0"
                                    onClick={() => selectSuggestion(r)}
                                >
                                    {r.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <AddressMapInner
                lat={lat}
                lng={lng}
                onPositionChange={handlePositionChange}
                className="mt-2"
            />
        </div>
    )
}
