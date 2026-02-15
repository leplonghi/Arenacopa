
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, MapPin, Building2, Globe, ArrowRight, X, Maximize2,
    Thermometer, CloudRain, Star, Info, Layers, Filter
} from "lucide-react";
import { hostCountries, type HostCity } from "@/data/guiaData";
import { CityDetailsModal } from "./GuiaTab";
import { StadiumDetailModal } from "@/components/guia/EstadiosSection";

// --- Leaflet Icons Setup ---
const createIcon = (color: string) => L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const cityIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const stadiumIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// --- Helper Components ---
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
    }, [center, zoom, map]);
    return null;
}

// Flatten cities data
const allLocations = hostCountries.flatMap(c => c.cities.map(city => ({
    ...city,
    type: "city" as const, // Default type, can be filtered later
    countryName: c.name,
    countryFlag: c.flag
})));

type LocationType = "all" | "city" | "stadium";

export function GuiaMapExplorer({ initialLocationId, initialFilter = "all" }: { initialLocationId?: string | null, initialFilter?: LocationType }) {
    const [selectedLocation, setSelectedLocation] = useState<typeof allLocations[0] | null>(null);
    const [filterType, setFilterType] = useState<LocationType>(initialFilter);
    const [mapView, setMapView] = useState<{ center: [number, number], zoom: number }>({ center: [35, -95], zoom: 4 });
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Initialize with prop if provided
    useEffect(() => {
        if (initialLocationId) {
            const found = allLocations.find(l => l.id === initialLocationId);
            if (found) {
                handleSelectLocation(found);
            }
        }
    }, [initialLocationId]);

    const handleSelectLocation = (loc: typeof allLocations[0]) => {
        setSelectedLocation(loc);
        setMapView({ center: loc.geoCoordinates, zoom: 6 });
    };

    const toggleFilter = (type: LocationType) => {
        if (filterType === type) setFilterType("all");
        else setFilterType(type);
    };

    // Filter markers based on selection
    // In this robust implementation, we treat "city" and "stadium" as the same 'location' entity but visualize differently if needed.
    // However, the user might want to see ONLY stadiums.
    // Since our data structure has 1 city = 1 stadium, let's just toggle the Icon/Label.

    return (
        <div className="relative w-full h-full bg-[#121212] overflow-hidden flex flex-col">

            {/* 1. Map Layer (Background) */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[35, -95]}
                    zoom={4}
                    style={{ height: "100%", width: "100%", background: "#121212" }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <MapController center={mapView.center} zoom={mapView.zoom} />

                    {allLocations.map(loc => (
                        <Marker
                            key={loc.id}
                            position={loc.geoCoordinates}
                            icon={filterType === "stadium" ? stadiumIcon : cityIcon}
                            eventHandlers={{
                                click: () => handleSelectLocation(loc),
                            }}
                        >
                            {/* Optional Popup on hover could go here */}
                        </Marker>
                    ))}
                </MapContainer>

                {/* Gradient Overlays for better text visibility */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-[400]" />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-[400]" />
            </div>

            {/* 2. Top Controls (Filters) */}
            <div className="absolute top-4 left-0 right-0 z-[500] px-4 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto flex gap-2 overflow-x-auto scrollbar-hide pb-2 max-w-[80vw]">
                    <FilterChip
                        label="Tudo"
                        active={filterType === "all"}
                        onClick={() => setFilterType("all")}
                        icon={<Layers className="w-3 h-3" />}
                    />
                    <FilterChip
                        label="Sedes"
                        active={filterType === "city"}
                        onClick={() => setFilterType("city")}
                        icon={<MapPin className="w-3 h-3" />}
                    />
                    <FilterChip
                        label="Estádios"
                        active={filterType === "stadium"}
                        onClick={() => setFilterType("stadium")}
                        icon={<Building2 className="w-3 h-3" />}
                    />
                </div>
            </div>

            {/* 3. Bottom Card (Selection Context) */}
            <AnimatePresence mode="wait">
                {selectedLocation ? (
                    <motion.div
                        key="selected-card"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute bottom-6 left-4 right-4 z-[500]"
                    >
                        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-2xl relative overflow-hidden group">
                            {/* Quick Action Close */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedLocation(null); }}
                                className="absolute top-2 right-2 p-2 rounded-full bg-black/20 hover:bg-black/50 text-white/50 hover:text-white transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex gap-4 items-center cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
                                {/* Image Thumbnail */}
                                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 relative border border-white/10 shadow-lg">
                                    <img
                                        src={
                                            filterType === "stadium"
                                                ? (selectedLocation.stadiumImage || selectedLocation.image || "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&w=800&q=80")
                                                : (selectedLocation.image || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80")
                                        }
                                        alt={selectedLocation.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Text Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-lg">{selectedLocation.countryFlag}</span>
                                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                                            {filterType === "stadium" ? "Arena Oficial" : "Cidade Sede"}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-black text-white leading-tight truncate">
                                        {filterType === "stadium" ? selectedLocation.stadiumName : selectedLocation.name}
                                    </h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {filterType === "stadium"
                                            ? `Capacidade: ${Math.round(selectedLocation.stadiumCapacity / 1000)}k • ${selectedLocation.name}`
                                            : `${selectedLocation.weather || '24°C'} • ${selectedLocation.population}`}
                                    </p>
                                </div>

                                {/* Arrow Action */}
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                    <ArrowRight className="w-5 h-5 text-black" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="explore-hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[500] pointer-events-none"
                    >
                        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                            <Layers className="w-4 h-4 text-primary animate-pulse" />
                            <span className="text-xs font-bold text-white">Explore o mapa para descobrir</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Full Detail Modals */}
            <AnimatePresence>
                {isDetailsOpen && selectedLocation && (
                    filterType === "stadium" ? (
                        <StadiumDetailModal
                            city={selectedLocation}
                            image={selectedLocation.stadiumImage || selectedLocation.image || "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&w=800&q=80"}
                            onClose={() => setIsDetailsOpen(false)}
                            onViewOnMap={(id) => {
                                setIsDetailsOpen(false);
                                const target = allLocations.find(l => l.id === id);
                                if (target) handleSelectLocation(target);
                            }}
                        />
                    ) : (
                        <CityDetailsModal
                            city={selectedLocation}
                            onClose={() => setIsDetailsOpen(false)}
                        />
                    )
                )}
            </AnimatePresence>

        </div>
    );
}

function FilterChip({ label, active, onClick, icon }: { label: string, active: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-lg backdrop-blur-md border",
                active
                    ? "bg-white text-black border-white scale-105"
                    : "bg-black/40 text-white border-white/10 hover:bg-black/60"
            )}
        >
            {icon}
            {label}
        </button>
    );
}
