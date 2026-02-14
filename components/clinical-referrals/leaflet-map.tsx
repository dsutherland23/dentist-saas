"use client"

import React from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { Button } from "@/components/ui/button"

// Helper component to update map view when specialists change
function SetBounds({ specialists }: { specialists: Specialist[] }) {
    const map = useMap()
    React.useEffect(() => {
        if (specialists.length > 0) {
            const bounds = L.latLngBounds(specialists.map(s => [Number(s.lat), Number(s.lng)]))
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 13,
                animate: true,
                duration: 1.5
            })
        }
    }, [specialists, map])
    return null
}

// Fix for Leaflet default icon issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Color mapping for specialties
const getSpecialtyColor = (specialtyName: string) => {
    const name = specialtyName.toLowerCase();
    if (name.includes('ortho')) return '#3b82f6'; // Blue
    if (name.includes('surgery')) return '#ef4444'; // Red
    if (name.includes('periodo')) return '#f59e0b'; // Amber
    if (name.includes('endo')) return '#8b5cf6'; // Purple
    if (name.includes('prosth')) return '#ec4899'; // Pink
    if (name.includes('pediatr')) return '#fb7185'; // Rose
    if (name.includes('cosmetic')) return '#10b981'; // Emerald
    if (name.includes('cardio')) return '#dc2626'; // Deep Red
    if (name.includes('dermato')) return '#6366f1'; // Indigo
    return '#14b8a6'; // Teal (Default)
};

// Custom marker styling with dynamic color
const createCustomIcon = (name: string, shouldAnimate: boolean, color: string) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div class="marker-container">
                ${shouldAnimate ? `<div class="marker-pulse" style="background: ${color}"></div>` : ''}
                <div class="marker-pin" style="background: ${color}">
                    <div class="marker-inner"></div>
                </div>
            </div>
            <style>
                .custom-div-icon {
                    background: none;
                    border: none;
                }
                .marker-container {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .marker-pin {
                    width: 24px;
                    height: 24px;
                    border-radius: 50% 50% 50% 0;
                    position: absolute;
                    transform: rotate(-45deg);
                    left: 50%;
                    top: 50%;
                    margin: -20px 0 0 -12px;
                    border: 2px solid white;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    z-index: 2;
                }
                .marker-inner {
                    width: 10px;
                    height: 10px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    margin: -5px 0 0 -5px;
                }
                .marker-pulse {
                    position: absolute;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    opacity: 0.4;
                    animation: pulse 2s infinite ease-out;
                    z-index: 1;
                }
                @keyframes pulse {
                    0% { transform: scale(0.5); opacity: 0.8; }
                    100% { transform: scale(2); opacity: 0; }
                }
            </style>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};

interface Specialist {
    id: string
    name: string
    specialty: { name: string; id: string }
    clinic_name?: string
    lat: number
    lng: number
    phone?: string
    email?: string
    website?: string
}

interface LeafletMapProps {
    specialists: Specialist[]
    onReferClick?: (specialist: Specialist) => void
    center: [number, number]
    zoom: number
    searchQuery?: string
}

export default function LeafletMap({ specialists, onReferClick, center, zoom, searchQuery }: LeafletMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <SetBounds specialists={specialists} />
            {specialists.filter((s) => s.lat != null && s.lng != null && !Number.isNaN(Number(s.lat)) && !Number.isNaN(Number(s.lng))).map((specialist) => {
                // Only animate if there's a search query and this specialist matches it
                const shouldAnimate = searchQuery ? (
                    specialist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    specialist.clinic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    specialist.specialty.name.toLowerCase().includes(searchQuery.toLowerCase())
                ) : false;

                const markerColor = getSpecialtyColor(specialist.specialty.name);

                return (
                    <Marker
                        key={specialist.id}
                        position={[Number(specialist.lat), Number(specialist.lng)]}
                        icon={createCustomIcon(specialist.name, shouldAnimate, markerColor)}
                    >
                        <Popup minWidth={240} className="custom-popup">
                            <div className="p-2">
                                <h3 className="font-bold text-slate-900 text-lg mb-0.5">{specialist.name}</h3>
                                <p className="text-sm font-semibold mb-3" style={{ color: markerColor }}>{specialist.specialty?.name}</p>

                                <div className="space-y-2 mb-4">
                                    {specialist.clinic_name && (
                                        <p className="text-xs text-slate-600 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                            {specialist.clinic_name}
                                        </p>
                                    )}

                                    {specialist.phone && (
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                            {specialist.phone}
                                        </p>
                                    )}
                                    {specialist.email && (
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                            {specialist.email}
                                        </p>
                                    )}
                                </div>

                                {onReferClick && (
                                    <Button
                                        onClick={() => onReferClick(specialist)}
                                        className="w-full text-white transition-colors duration-300 shadow-md font-medium"
                                        style={{ backgroundColor: markerColor }}
                                    >
                                        Quick Refer
                                    </Button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
