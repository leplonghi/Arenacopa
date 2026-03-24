
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Building2, Users, MapPin, Hash, DollarSign, Calendar,
    Trophy, ArrowUpDown, ChevronRight, X, Plane, Star,
    Thermometer, Mountain, Navigation, Info, SortAsc, SortDesc,
    Construction
} from "lucide-react";
import { Share } from "@capacitor/share";
import { Geolocation } from "@capacitor/geolocation";
import { useTranslation } from "react-i18next";
import { staggerContainer, staggerItem } from "@/components/copa/animations";
import { hostCountries, type HostCity } from "@/data/guiaData";

// Fallback images for stadiums until we have them all in the database
const stadiumImages: Record<string, string> = {
    "azteca": "https://images.unsplash.com/photo-1627407949390-348638686256?auto=format&fit=crop&w=800&q=80",
    "estadio-azteca": "https://images.unsplash.com/photo-1627407949390-348638686256?auto=format&fit=crop&w=800&q=80",
    "akron": "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80",
    "bbva": "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&w=800&q=80",
    "metlife": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    "sofi": "https://images.unsplash.com/photo-1647452327771-477543787766?auto=format&fit=crop&w=800&q=80",
    "att": "https://images.unsplash.com/photo-1504123924719-f559286d9904?auto=format&fit=crop&w=800&q=80",
    "mercedes-benz": "https://images.unsplash.com/photo-1599878144211-582773c683b7?auto=format&fit=crop&w=800&q=80",
    "hard-rock": "https://images.unsplash.com/photo-1549420084-25785bbd9b3d?auto=format&fit=crop&w=800&q=80",
    "bmo-field": "https://images.unsplash.com/photo-1563299796-b729d0af54a5?auto=format&fit=crop&w=800&q=80",
    "bc-place": "https://images.unsplash.com/photo-1566932769119-7a1fb6d7ce23?auto=format&fit=crop&w=800&q=80",
    "lumen-field": "https://images.unsplash.com/photo-1629215037416-5e04ca65853a?auto=format&fit=crop&w=800&q=80",
    "nrg": "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80",
    "lincoln-financial": "https://images.unsplash.com/photo-1576478950549-923f66f97d2b?auto=format&fit=crop&w=800&q=80",
    "arrowhead": "https://images.unsplash.com/photo-1632769061614-7227d8e63546?auto=format&fit=crop&w=800&q=80",
    "gillette": "https://images.unsplash.com/photo-1628892102875-c085ac35b2c7?auto=format&fit=crop&w=800&q=80",
    "levis": "https://images.unsplash.com/photo-1521406606869-7c858b97d19e?auto=format&fit=crop&w=800&q=80",
};

type SortField = "capacity" | "name" | "matches" | "year";
type CountryFilter = "all" | "USA" | "MEX" | "CAN";

const allCities: (HostCity & { countryName: string; countryFlag: string })[] = hostCountries.flatMap(c =>
    c.cities.map(city => ({ ...city, countryName: c.name, countryFlag: c.flag }))
);

export function EstadiosSection({ onViewOnMap }: { onViewOnMap?: (cityId: string) => void }) {
    const [countryFilter, setCountryFilter] = useState<CountryFilter>("all");
    const [sortField, setSortField] = useState<SortField>("capacity");
    const [sortAsc, setSortAsc] = useState(false);
    const [selectedStadium, setSelectedStadium] = useState<(typeof allCities)[0] | null>(null);

    const filtered = useMemo(() => {
        const result = countryFilter === "all"
            ? [...allCities]
            : allCities.filter(c => c.countryCode === countryFilter);

        result.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case "capacity": cmp = a.stadiumCapacity - b.stadiumCapacity; break;
                case "name": cmp = a.stadiumName.localeCompare(b.stadiumName); break;
                case "matches": cmp = (a.wcMatches || 0) - (b.wcMatches || 0); break;
                case "year": cmp = (a.stadiumYearBuilt || 0) - (b.stadiumYearBuilt || 0); break;
            }
            return sortAsc ? cmp : -cmp;
        });

        return result;
    }, [countryFilter, sortField, sortAsc]);

    // Use placeholder if specific stadium image not found
    const getStadiumImage = (id: string, name: string) => {
        const key = Object.keys(stadiumImages).find(k => k === id || id.includes(k) || name.toLowerCase().includes(k.toLowerCase()));
        return key ? stadiumImages[key] : "https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&w=800&q=80";
    };

    const totalCapacity = allCities.reduce((sum, c) => sum + c.stadiumCapacity, 0);
    const totalMatches = allCities.reduce((sum, c) => sum + (c.wcMatches || 0), 0);
    const avgCapacity = Math.round(totalCapacity / allCities.length);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    };

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-10 pb-24"
        >
            {/* Hero Stats Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-black p-8 border border-emerald-500/20 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80')] opacity-10 bg-cover bg-center group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-black to-black" />

                {/* Glow Effects */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600/10 blur-[80px] rounded-full" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-3 mb-8"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                            <Building2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
                            Arenas da Copa <span className="text-emerald-400">2026</span>
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                        <StatBox label="Estádios" value="16" sub="Sedes Oficiais" accent="emerald" />
                        <StatBox label="Capacidade" value={`${(totalCapacity / 1000000).toFixed(1)}M`} sub="Total Geral" accent="emerald" />
                        <StatBox label="Média" value={`${Math.round(avgCapacity / 1000)}k`} sub="Por Arena" accent="emerald" />
                        <StatBox label="Jogos" value={String(totalMatches)} sub="Total Confirmado" accent="emerald" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center px-2">
                {/* Country Filter */}
                <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                    {([
                        { id: "all" as CountryFilter, label: "Todos", flag: "🌎" },
                        { id: "USA" as CountryFilter, label: "EUA", flag: "🇺🇸" },
                        { id: "MEX" as CountryFilter, label: "MÉX", flag: "🇲🇽" },
                        { id: "CAN" as CountryFilter, label: "CAN", flag: "🇨🇦" },
                    ]).map(f => (
                        <button
                            key={f.id}
                            onClick={() => setCountryFilter(f.id)}
                            className={cn(
                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2",
                                countryFilter === f.id
                                    ? "bg-emerald-500 text-black shadow-xl shadow-emerald-500/30 scale-105"
                                    : "text-white/50 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <span className="text-sm">{f.flag}</span>
                            <span className="hidden sm:inline">{f.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {([
                        { id: "capacity" as SortField, label: "Capacidade" },
                        { id: "matches" as SortField, label: "Partidas" },
                    ]).map(s => (
                        <button
                            key={s.id}
                            onClick={() => handleSort(s.id)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 border",
                                sortField === s.id
                                    ? "bg-emerald-500/10 text-emerald-100 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                                    : "bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white"
                            )}
                        >
                            {sortField === s.id && (
                                <motion.div animate={{ rotate: sortAsc ? 0 : 180 }}>
                                    <ArrowUpDown className="w-3.5 h-3.5" />
                                </motion.div>
                            )}
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stadium Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2">
                {filtered.map((city, idx) => {
                    const bgImage = getStadiumImage(city.stadiumId, city.stadiumName);
                    return (
                        <motion.div
                            key={city.id}
                            variants={staggerItem}
                            custom={idx}
                            layoutId={`stadium-card-${city.id}`}
                            onClick={() => setSelectedStadium(city)}
                            className="group relative h-72 rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl border border-white/10 hover:border-emerald-500/40 transition-all duration-500"
                        >
                            {/* Background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                style={{ backgroundImage: `url('${bgImage}')` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                            {/* Glow on hover */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-emerald-500/10 via-transparent to-emerald-500/10" />

                            {/* Floating Rank Badge */}
                            <div className="absolute top-5 left-5 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center font-black text-sm text-white/70 z-20 group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition-all">
                                {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg backdrop-blur-md border border-emerald-500/20">
                                            <MapPin className="w-3 h-3" />
                                            {city.name}
                                        </div>
                                        <span className="text-xl shadow-lg">{city.countryFlag}</span>
                                    </div>

                                    <h3 className="text-3xl font-black text-white leading-none mb-4 drop-shadow-2xl group-hover:text-emerald-50 group-hover:scale-[1.02] origin-left transition-all">
                                        {city.stadiumName}
                                    </h3>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-black/40 rounded-xl p-3 backdrop-blur-md border border-white/10 group-hover:border-emerald-500/20 transition-colors">
                                            <p className="text-[8px] uppercase text-white/40 font-black tracking-widest mb-1">Capacidade</p>
                                            <p className="text-sm font-black text-white">{Math.round(city.stadiumCapacity / 1000)}k</p>
                                        </div>
                                        {city.wcMatches && (
                                            <div className="bg-emerald-500/10 rounded-xl p-3 backdrop-blur-md border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                                                <p className="text-[8px] uppercase text-emerald-400/70 font-black tracking-widest mb-1">Partidas</p>
                                                <p className="text-sm font-black text-emerald-400">{city.wcMatches}</p>
                                            </div>
                                        )}
                                        <div className="bg-black/40 rounded-xl p-3 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                            <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparison Chart */}
            <section className="mx-2 p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0a0a0a] to-black border border-emerald-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Trophy className="w-48 h-48 text-emerald-500" />
                </div>

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <Star className="w-6 h-6 text-emerald-400" />
                            Elite das Arenas
                        </h3>
                        <p className="text-xs text-white/40 font-bold mt-1">Comparativo de capacidade dos maiores estádios da Copa 2026</p>
                    </div>
                </div>

                <div className="space-y-6 relative z-10">
                    {[...allCities]
                        .sort((a, b) => b.stadiumCapacity - a.stadiumCapacity)
                        .slice(0, 6)
                        .map((city, idx) => (
                            <div key={city.id} className="flex items-center gap-4 group">
                                <span className="text-xs font-black text-white/20 w-6 text-right tabular-nums group-hover:text-emerald-500 transition-colors">{idx + 1}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] uppercase font-black tracking-widest text-white/60 mb-2 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="opacity-70">{city.countryFlag}</span>
                                            <span className="group-hover:text-white transition-colors">{city.stadiumName}</span>
                                        </div>
                                        <span className="text-emerald-400 tabular-nums">{city.stadiumCapacity.toLocaleString()} lugares</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(city.stadiumCapacity / 87523) * 100}%` }}
                                            transition={{ delay: idx * 0.1, duration: 1.5, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full group-hover:brightness-125 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]",
                                                idx === 0 ? "bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500" :
                                                    "bg-gradient-to-r from-emerald-600/80 to-emerald-400/80"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </section>

            {/* Stadium Detail Modal */}
            <AnimatePresence>
                {selectedStadium && (
                    <StadiumDetailModal
                        city={selectedStadium}
                        image={getStadiumImage(selectedStadium.stadiumId, selectedStadium.stadiumName)}
                        onClose={() => setSelectedStadium(null)}
                        onViewOnMap={onViewOnMap}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
    return (
        <div className="bg-white/5 p-5 rounded-[1.5rem] text-center border border-white/5 backdrop-blur-md hover:border-emerald-500/30 transition-all group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-3xl font-black leading-none mb-1 text-white group-hover:text-emerald-400 transition-colors">{value}</p>
            <div className="flex flex-col">
                <p className="text-[8px] uppercase tracking-[0.2em] text-white/40 font-black mb-1">{label}</p>
                <div className="h-[1px] w-8 bg-emerald-500/30 mx-auto mb-1 group-hover:w-16 transition-all" />
                <p className="text-[10px] font-bold text-white/60 tracking-tight">{sub}</p>
            </div>
        </div>
    );
}

const handleShare = async (title: string, text: string) => {
    try {
        await Share.share({
            title,
            text,
            url: "https://arenacup.app",
        });
    } catch (err) {
        console.log("Error sharing", err);
    }
};

const handleDirections = async (lat: number, lng: number, name: string) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(name)}&ll=${lat},${lng}`;
    try {
        window.open(url, "_system");
    } catch {
        window.open(url, "_blank");
    }
};

export function StadiumDetailModal({
    city,
    image,
    onClose,
    onViewOnMap
}: {
    city: (typeof allCities)[0];
    image: string;
    onClose: () => void;
    onViewOnMap?: (cityId: string) => void;
}) {
    const { t } = useTranslation('sedes');
    const [distance, setDistance] = useState<number | null>(null);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 5000 });
                const lat1 = position.coords.latitude;
                const lon1 = position.coords.longitude;
                const lat2 = city.geoCoordinates[0];
                const lon2 = city.geoCoordinates[1];

                // Haversine formula
                const R = 6371; // Earth's radius in km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                setDistance(Math.round(R * c));
            } catch (err) {
                console.log("Could not get user location", err);
            }
        };
        fetchLocation();
    }, [city]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div
                layoutId={`stadium-card-${city.id}`}
                className="w-full h-full sm:h-auto sm:max-w-2xl bg-black/95 sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-emerald-500/20"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero Header - Compact like City Modal */}
                <div className="h-56 relative shrink-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                        style={{ backgroundImage: `url('${image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-10 h-10 bg-black/60 hover:bg-black/90 rounded-full text-white flex items-center justify-center transition-all backdrop-blur-md z-20 border border-white/20 hover:border-emerald-500/50"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="flex items-center gap-3 mb-3">
                            {city.wcRole && (
                                <div className="px-3 py-1 bg-emerald-500 text-black rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                    {city.wcRole}
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-100/90 drop-shadow-lg">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                {city.name} {city.countryFlag}
                            </div>
                            {distance !== null && (
                                <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] text-white font-bold uppercase tracking-widest border border-white/10 shadow-lg">
                                    {distance} km
                                </div>
                            )}
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight mb-0 drop-shadow-2xl">{city.stadiumName}</h2>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-black/50">

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-emerald-500/5 rounded-2xl p-5 border border-emerald-500/10 flex items-center gap-4 group hover:bg-emerald-500/10 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-1">Capacidade</p>
                                <p className="text-xl font-black text-white leading-none">{city.stadiumCapacity.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                                <Calendar className="w-6 h-6 text-white/60" />
                            </div>
                            <div>
                                <p className="text-[9px] text-white/40 uppercase font-black tracking-widest mb-1">Inauguração</p>
                                <p className="text-xl font-black text-white leading-none">{city.stadiumYearBuilt}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Catedral do Futebol</h3>
                            </div>
                            <p className="text-sm text-white/60 leading-loose antialiased font-medium">
                                {city.description} Uma obra prima da arquitetura que simboliza a paixão pelo esporte em <span className="text-white font-bold">{city.name}</span>. O palco perfeito para receber as maiores estrelas do futebol mundial no maior evento da história em 2026.
                            </p>
                        </section>

                        {/* Technical Details Cards */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-black/40 rounded-[2rem] p-6 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                                <h3 className="text-[10px] font-black text-emerald-400/70 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Construction className="w-3.5 h-3.5" />
                                    Engenharia
                                </h3>
                                <div className="space-y-6">
                                    {city.stadiumCost && (
                                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                            <p className="text-[10px] text-white/30 uppercase font-bold">Investimento</p>
                                            <p className="text-xs font-black text-white">{city.stadiumCost}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                                        <p className="text-[10px] text-white/30 uppercase font-bold">Altitude</p>
                                        <p className="text-xs font-black text-white">{city.altitude || 0}m</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-500/[0.03] rounded-[2rem] p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group">
                                <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Trophy className="w-3.5 h-3.5" />
                                    Copa 2026
                                </h3>
                                <div className="space-y-6">
                                    {city.wcMatches && (
                                        <div className="flex justify-between items-end border-b border-emerald-500/10 pb-2">
                                            <p className="text-[10px] text-emerald-400/50 uppercase font-black">Jogos Confirmados</p>
                                            <p className="text-lg font-black text-emerald-400 leading-none">{city.wcMatches}</p>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end border-b border-emerald-500/10 pb-2">
                                        <p className="text-[10px] text-emerald-400/50 uppercase font-black">Gramado</p>
                                        <p className="text-xs font-black text-white">Tecnologia Híbrida</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Curiosities */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-5 bg-white/20 rounded-full" />
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Curiosidades</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {city.curiosities.map((c, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ x: -10, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-4 text-sm text-white/50 bg-white/[0.02] hover:bg-white/[0.04] p-5 rounded-2xl border border-white/5 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                            <Star className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <p className="text-[13px] leading-relaxed font-medium group-hover:text-white/70 transition-colors">{c}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4">
                        <button
                            onClick={() => handleDirections(city.geoCoordinates[0], city.geoCoordinates[1], city.stadiumName)}
                            className="flex-1 py-4.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-3 border border-emerald-500/20"
                        >
                            <Navigation className="w-4 h-4" />
                            Rotas
                        </button>
                        <button
                            onClick={() => handleShare(`ArenaCup - ${city.stadiumName}`, `Conheça o ${city.stadiumName}, palco de jogos em ${city.name} na Copa 2026! `)}
                            className="flex-1 py-4.5 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-3 border border-white/10"
                        >
                            Compartilhar
                        </button>
                        {onViewOnMap && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onViewOnMap(city.id);
                                }}
                                className="flex-[2] py-4.5 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] text-[10px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-3 border border-white/10"
                            >
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                Ver no Mapa
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
