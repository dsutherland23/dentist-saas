"use client"

import React, { useMemo, useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix Leaflet default icon
if (typeof window !== "undefined") {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    })
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        map.setView(center, map.getZoom())
    }, [center, map])
    return null
}

interface AddressMapInnerProps {
    lat: number
    lng: number
    onPositionChange: (lat: number, lng: number) => void
    className?: string
}

export function AddressMapInner({ lat, lng, onPositionChange, className }: AddressMapInnerProps) {
    const center: [number, number] = [lat, lng]

    const eventHandlers = useMemo(
        () => ({
            dragend(e: L.LeafletEvent) {
                const marker = e.target as L.Marker
                const ll = marker.getLatLng()
                onPositionChange(ll.lat, ll.lng)
            },
        }),
        [onPositionChange]
    )

    return (
        <MapContainer
            center={center}
            zoom={14}
            className={`h-[220px] w-full rounded-lg border border-slate-200 z-0 ${className || ""}`}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={center} />
            <Marker position={center} draggable={true} eventHandlers={eventHandlers} />
        </MapContainer>
    )
}
