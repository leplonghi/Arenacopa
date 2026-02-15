
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Building2, Users, MapPin, Hash, DollarSign, Calendar,
    Trophy, ArrowUpDown, ChevronRight, X, Plane, Star,
    Thermometer, Mountain, Navigation, Info, SortAsc, SortDesc,
    Construction
} from "lucide-react";
import { hostCountries, type HostCity } from "@/data/guiaData";
import { staggerContainer, staggerItem } from "@/components/copa/animations";

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
        let result = countryFilter === "all"
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
        // Normalize ID to match keys
        const key = Object.keys(stadiumImages).find(k => k === id || id.includes(k) || name.toLowerCase().includes(k));
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
            className="space-y-8 pb-24"
        >
            {/* Hero Stats Section */}
            <div className="relative overflow-hidden rounded-3xl bg-black p-6 border border-white/10 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80')] opacity-20 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-primary" />
                        Arenas da Copa 2026
                    </h2>
                    <div className="grid grid-cols-4 gap-4 w-full max-w-lg mx-auto">
                        <StatBox label="Estádios" value="16" sub="Sedes" accent="white" />
                        <StatBox label="Lugares" value={`${(totalCapacity / 1000000).toFixed(1)}M`} sub="Total" accent="primary" />
                        <StatBox label="Média" value={`${Math.round(avgCapacity / 1000)}k`} sub="Público" accent="emerald" />
                        <StatBox label="Jogos" value={String(totalMatches)} sub="Confirmados" accent="amber" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center px-1">
                {/* Country Filter */}
                <div className="flex gap-2 p-1 bg-secondary/30 rounded-full border border-white/5 backdrop-blur-sm">
                    {([
                        { id: "all" as CountryFilter, label: "Todos", flag: "🌎" },
                        { id: "USA" as CountryFilter, label: "EUA", flag: "🇺🇸" },
                        { id: "MEX" as CountryFilter, label: "México", flag: "🇲🇽" },
                        { id: "CAN" as CountryFilter, label: "Canadá", flag: "🇨🇦" },
                    ]).map(f => (
                        <button
                            key={f.id}
                            onClick={() => setCountryFilter(f.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                                countryFilter === f.id
                                    ? "bg-primary text-black shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            <span>{f.flag}</span>
                            <span className="hidden sm:inline">{f.label}</span>
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide w-full sm:w-auto">
                    {([
                        { id: "capacity" as SortField, label: "Capacidade" },
                        { id: "matches" as SortField, label: "Jogos" },
                    ]).map(s => (
                        <button
                            key={s.id}
                            onClick={() => handleSort(s.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 border",
                                sortField === s.id
                                    ? "bg-white/10 text-white border-white/20"
                                    : "bg-transparent text-muted-foreground border-transparent hover:text-white"
                            )}
                        >
                            {sortField === s.id && (
                                sortAsc ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />
                            )}
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stadium Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-1">
                {filtered.map((city, idx) => {
                    const bgImage = getStadiumImage(city.stadiumId, city.stadiumName);
                    return (
                        <motion.div
                            key={city.id}
                            variants={staggerItem}
                            custom={idx}
                            layoutId={`stadium-card-${city.id}`}
                            onClick={() => setSelectedStadium(city)}
                            className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-xl border border-white/5 active:scale-[0.98] transition-all"
                        >
                            {/* Background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                style={{ backgroundImage: `url('${bgImage}')` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />

                            {/* Floating Rank Badge */}
                            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center font-black text-xs text-white z-20">
                                {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                                            <MapPin className="w-3 h-3" />
                                            {city.name}
                                        </div>
                                        <span className="text-lg">{city.countryFlag}</span>
                                    </div>

                                    <h3 className="text-2xl font-black text-white leading-none mb-2 drop-shadow-xl">{city.stadiumName}</h3>

                                    <div className="grid grid-cols-3 gap-2 mt-3 opacity-90">
                                        <div className="bg-black/40 rounded-lg p-2 backdrop-blur-sm border border-white/5">
                                            <p className="text-[8px] uppercase text-white/50 font-bold mb-0.5">Capacidade</p>
                                            <p className="text-xs font-bold text-white">{Math.round(city.stadiumCapacity / 1000)}k</p>
                                        </div>
                                        {city.wcMatches && (
                                            <div className="bg-primary/20 rounded-lg p-2 backdrop-blur-sm border border-primary/20">
                                                <p className="text-[8px] uppercase text-primary/70 font-bold mb-0.5">Jogos</p>
                                                <p className="text-xs font-bold text-primary">{city.wcMatches}</p>
                                            </div>
                                        )}
                                        <div className="bg-black/40 rounded-lg p-2 backdrop-blur-sm border border-white/5 flex items-center justify-center">
                                            <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Comparison Chart */}
            <section className="glass-card p-6 border border-white/5 relative overflow-hidden bg-gradient-to-br from-secondary/20 to-black">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                    <ArrowUpDown className="w-32 h-32 text-white" />
                </div>

                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                    <ArrowUpDown className="w-4 h-4 text-primary" />
                    Comparativo de Capacidade
                </h3>

                <div className="space-y-3 relative z-10">
                    {[...allCities]
                        .sort((a, b) => b.stadiumCapacity - a.stadiumCapacity)
                        .slice(0, 5)
                        .map((city, idx) => (
                            <div key={city.id} className="flex items-center gap-3 group">
                                <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">{idx + 1}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-white/60 mb-1">
                                        <span>{city.stadiumName}</span>
                                        <span>{Math.round(city.stadiumCapacity / 1000)}k</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(city.stadiumCapacity / 87523) * 100}%` }} // Azteca max
                                            transition={{ delay: idx * 0.1, duration: 1 }}
                                            className={cn(
                                                "h-full rounded-full group-hover:brightness-125 transition-all",
                                                idx === 0 ? "bg-gradient-to-r from-yellow-500 to-amber-600" :
                                                    "bg-gradient-to-r from-primary to-emerald-600"
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
    const accentColors: Record<string, string> = {
        primary: "text-primary",
        white: "text-white",
        emerald: "text-emerald-400",
        amber: "text-yellow-500",
    };
    return (
        <div className="bg-white/5 p-3 rounded-2xl text-center border border-white/5 backdrop-blur-sm">
            <p className={cn("text-2xl font-black leading-none mb-1", accentColors[accent])}>{value}</p>
            <div className="flex flex-col">
                <p className="text-[7px] uppercase tracking-widest text-white/40 font-bold">{label}</p>
                <p className="text-[9px] font-bold text-white/70">{sub}</p>
            </div>
        </div>
    );
}

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
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                layoutId={`stadium-card-${city.id}`}
                className="w-full h-full sm:h-auto sm:max-w-2xl bg-[#0a0a0a] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero Header */}
                <div className="h-64 relative shrink-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-9 h-9 bg-black/50 hover:bg-black/80 rounded-full text-white flex items-center justify-center transition-all backdrop-blur-md z-20 border border-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        {city.wcRole && (
                            <div className="inline-block px-3 py-1 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-wider mb-2 shadow-lg">
                                {city.wcRole}
                            </div>
                        )}
                        <h2 className="text-4xl font-black text-white leading-none mb-2 drop-shadow-xl">{city.stadiumName}</h2>
                        <div className="flex items-center gap-2 text-white/80 font-medium">
                            <MapPin className="w-4 h-4 text-primary" />
                            {city.name}, {city.countryCode} {city.countryFlag}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#0a0a0a]">

                    {/* Primary Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-secondary/10 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Capacidade</p>
                                <p className="text-lg font-black text-white">{city.stadiumCapacity.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-secondary/10 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Inauguração</p>
                                <p className="text-lg font-black text-white">{city.stadiumYearBuilt}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section>
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Sobre a Arena</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {city.description} Um ícone moderno da arquitetura esportiva em {city.name}, preparado para receber as maiores estrelas do futebol mundial.
                            </p>
                        </section>

                        {/* Technical Details */}
                        <section className="bg-white/5 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Construction className="w-4 h-4 text-orange-400" />
                                Detalhes Técnicos
                            </h3>
                            <div className="grid grid-cols-2 gap-y-4">
                                {city.stadiumCost && (
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase">Custo de Construção</p>
                                        <p className="text-sm font-bold text-white">{city.stadiumCost}</p>
                                    </div>
                                )}
                                {city.wcMatches && (
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase">Partidas da Copa</p>
                                        <p className="text-sm font-bold text-primary">{city.wcMatches} confirmadas</p>
                                    </div>
                                )}
                                {city.altitude !== undefined && (
                                    <div>
                                        <p className="text-[9px] text-gray-500 uppercase">Altitude</p>
                                        <p className="text-sm font-bold text-white">{city.altitude}m</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Curiosities */}
                        <section>
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Curiosidades</h3>
                            <ul className="space-y-3">
                                {city.curiosities.map((c, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-400 bg-secondary/10 p-3 rounded-lg border border-white/5">
                                        <Star className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 pt-4 border-t border-white/10 flex gap-3">
                        {onViewOnMap && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onViewOnMap(city.id);
                                }}
                                className="flex-1 py-4 bg-secondary/20 hover:bg-secondary/40 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
                            >
                                <MapPin className="w-4 h-4" />
                                Localizar
                            </button>
                        )}
                        <button className="flex-[2] py-4 bg-primary hover:bg-primary/90 text-black rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                            <Plane className="w-4 h-4" />
                            Planejar Visita
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
