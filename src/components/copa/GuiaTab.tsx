
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Users, Trophy, Globe, TrendingUp, Info, ArrowRight, X,
    Maximize2, Thermometer, Mountain, DollarSign, Navigation, Plane, Star, Hash, Building2,
    Utensils, Camera, Bus, AlertTriangle, CloudRain, Clock, Train
} from "lucide-react";
import { hostCountries, generalCuriosities, type HostCity, type HostCountry } from "@/data/guiaData";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem, heroEnter, titleReveal } from "./animations";

interface CityStatusData {
    city_id: string;
    temperature: number;
    condition: string;
}

export function GuiaTab() {
    const [selectedCountryCode, setSelectedCountryCode] = useState<"USA" | "MEX" | "CAN">("USA");
    const [selectedCity, setSelectedCity] = useState<HostCity | null>(null);
    const [cityStatus, setCityStatus] = useState<Record<string, CityStatusData>>({});

    useEffect(() => {
        const fetchCityStatus = async () => {
            const { data } = await supabase.from('city_status').select('*');
            if (data) {
                const statusMap: Record<string, CityStatusData> = {};
                (data as unknown as CityStatusData[]).forEach((item) => {
                    statusMap[item.city_id] = item;
                });
                setCityStatus(statusMap);
            }
        };
        fetchCityStatus();
    }, []);

    const activeCountry = hostCountries.find(c => c.code === selectedCountryCode)!;

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-24"
        >
            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-3xl bg-black p-8 text-center shadow-2xl border border-white/10 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80')] opacity-30 bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

                <motion.div variants={heroEnter} className="relative z-10">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400 mb-3 drop-shadow-sm tracking-tight">
                        O Mundo Unido 2026
                    </h1>
                    <p className="text-white/80 max-w-lg mx-auto text-base leading-relaxed font-medium mb-6">
                        Explore os 3 países e as 16 cidades-sede que receberão o maior espetáculo da Terra.
                    </p>

                    <div className="inline-flex justify-center gap-6 px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-white">16</span>
                            <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Estádios</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-primary">104</span>
                            <span className="text-[9px] uppercase tracking-widest text-primary/50 font-bold">Jogos</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-black text-white">48</span>
                            <span className="text-[9px] uppercase tracking-widest text-white/50 font-bold">Seleções</span>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Country Selector */}
            <section className="px-1">
                <div className="flex justify-center gap-3 mb-8 overflow-x-auto py-2 scrollbar-hide">
                    {hostCountries.map((country) => (
                        <button
                            key={country.code}
                            onClick={() => {
                                setSelectedCountryCode(country.code);
                                setSelectedCity(null);
                            }}
                            className={cn(
                                "flex flex-col items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 border min-w-[100px]",
                                selectedCountryCode === country.code
                                    ? "bg-gradient-to-br from-secondary to-secondary/50 border-primary text-white shadow-lg shadow-primary/10 scale-105"
                                    : "bg-secondary/20 text-muted-foreground border-transparent hover:bg-secondary/40 hover:text-white"
                            )}
                        >
                            <span className="text-3xl drop-shadow-md transform transition-transform group-hover:scale-110">{country.flag}</span>
                            <span className="font-bold text-xs tracking-wide">{country.name}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedCountryCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-8"
                    >
                        {/* Cities Grid - Visual Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {activeCountry.cities.map((city, idx) => (
                                <CityCard
                                    key={city.id}
                                    city={city}
                                    idx={idx}
                                    onClick={() => setSelectedCity(city)}
                                    status={cityStatus[city.id]}
                                />
                            ))}
                        </div>

                        {/* Country Highlights */}
                        <div className="bg-gradient-to-br from-secondary/30 to-black rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                            <Globe className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12" />
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-primary" />
                                Sobre {activeCountry.name}
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed mb-4 relative z-10 max-w-2xl">
                                {activeCountry.description}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                                <InfoBadge icon={<Users className="w-4 h-4 text-blue-400" />} label="População" value={activeCountry.population} />
                                <InfoBadge icon={<DollarSign className="w-4 h-4 text-green-400" />} label="Moeda" value={activeCountry.currency} />
                                {activeCountry.gdp && <InfoBadge icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} label="PIB" value={activeCountry.gdp} />}
                                {activeCountry.wcParticipations && <InfoBadge icon={<Trophy className="w-4 h-4 text-yellow-400" />} label="Participações" value={`${activeCountry.wcParticipations} Copas`} />}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* Did You Know */}
            <section className="px-1">
                <motion.div variants={titleReveal} className="flex items-center gap-2 mb-4 px-1">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-black text-white">Curiosidade do Dia</h2>
                </motion.div>

                <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 rounded-r-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-20 h-20 text-amber-500 -rotate-12" />
                    </div>
                    <p className="text-sm font-medium text-amber-100/90 italic leading-relaxed max-w-2xl relative z-10">
                        "{generalCuriosities[0].description}"
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase tracking-wider relative z-10">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Fato Histórico
                    </div>
                </div>
            </section>

            {/* City Details Modal */}
            <AnimatePresence>
                {selectedCity && (
                    <CityDetailsModal
                        city={selectedCity}
                        dynamicStatus={cityStatus[selectedCity.id]}
                        onClose={() => setSelectedCity(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CityCard({ city, idx, onClick, status }: { city: HostCity, idx: number, onClick: () => void, status?: CityStatusData }) {
    // Fallback image if none provided in data
    const bgImage = city.image || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80";

    return (
        <motion.div
            variants={staggerItem}
            custom={idx}
            layoutId={`city-card-${city.id}`}
            onClick={onClick}
            className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer shadow-lg border border-white/5 active:scale-[0.98] transition-all"
        >
            {/* Background Image with Zoom Effect */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-70 transition-opacity" />

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-primary">
                            <MapPin className="w-3 h-3" />
                            {city.countryCode}
                        </div>
                        {status && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                <Thermometer className="w-3 h-3" />
                                {status.temperature}°C
                            </div>
                        )}
                    </div>

                    <h3 className="text-2xl font-black text-white leading-none mb-1 drop-shadow-lg">{city.name}</h3>

                    <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <p className="text-xs text-gray-200 line-clamp-2 mt-2 font-medium leading-relaxed">
                            {city.description}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-white/70">
                            <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                                <Building2 className="w-3 h-3" /> {city.stadiumName}
                            </span>
                            {city.wcMatches && (
                                <span className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-md">
                                    <Hash className="w-3 h-3" /> {city.wcMatches} Jogos
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function InfoBadge({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="bg-black/20 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">
                {icon}
                {label}
            </div>
            <div className="text-xs font-bold text-white truncate">{value}</div>
        </div>
    );
}

export function CityDetailsModal({ city, dynamicStatus, onClose }: { city: HostCity, dynamicStatus?: CityStatusData, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<"geral" | "turismo" | "gastronomia">("geral");

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                layoutId={`city-card-${city.id}`}
                className="w-full h-full sm:h-auto sm:max-w-2xl bg-[#0a0a0a] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero Header */}
                <div className="h-56 relative shrink-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${city.travelGuide?.heroImage || city.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full text-white flex items-center justify-center transition-all backdrop-blur-md z-20 border border-white/10"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                            <MapPin className="w-3 h-3" />
                            {city.countryCode} • Sede Oficial
                        </div>
                        <h2 className="text-4xl font-black text-white leading-none mb-2 drop-shadow-xl">{city.name}</h2>

                        {/* Quick Stats Tags */}
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                                <Users className="w-3 h-3" /> {city.population}
                            </span>
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
                                <Building2 className="w-3 h-3" /> {city.stadiumCapacity / 1000}k Lugares
                            </span>
                        </div>
                    </div>
                </div>

                {/* Internal Tabs */}
                {city.travelGuide && (
                    <div className="flex border-b border-white/5 px-6 shrink-0 bg-[#0a0a0a]">
                        <button
                            onClick={() => setActiveTab("geral")}
                            className={cn(
                                "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                                activeTab === "geral" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
                            )}
                        >
                            Geral
                        </button>
                        <button
                            onClick={() => setActiveTab("turismo")}
                            className={cn(
                                "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                                activeTab === "turismo" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
                            )}
                        >
                            Turismo & Lazer
                        </button>
                        <button
                            onClick={() => setActiveTab("gastronomia")}
                            className={cn(
                                "px-4 py-3 text-sm font-bold border-b-2 transition-colors",
                                activeTab === "gastronomia" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
                            )}
                        >
                            Gastronomia
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#0a0a0a]">
                    {activeTab === "geral" && (
                        <div className="space-y-6">
                            <p className="text-sm font-medium text-gray-300 leading-relaxed">
                                {city.description}
                            </p>

                            {/* Stadium Card Highlight */}
                            <div className="bg-secondary/20 rounded-xl p-4 border border-white/5 flex gap-4 items-center">
                                <div className="w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                                    <Trophy className="w-8 h-8 text-yellow-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white">{city.stadiumName}</h4>
                                    <p className="text-xs text-muted-foreground mb-1">Capacidade: {city.stadiumCapacity.toLocaleString()}</p>
                                    {city.wcMatches && (
                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                            {city.wcMatches} Jogos Confirmados
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Important Info Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {city.travelGuide?.safety && (
                                    <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">
                                            <AlertTriangle className="w-3 h-3" /> Segurança
                                        </div>
                                        <ul className="list-disc list-inside text-[10px] text-gray-400 space-y-1">
                                            {city.travelGuide.safety.tips.slice(0, 2).map((t, i) => <li key={i}>{t}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {city.travelGuide?.transport && (
                                    <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                                            <Bus className="w-3 h-3" /> Transporte
                                        </div>
                                        <p className="text-[10px] text-gray-400 leading-snug">
                                            {city.travelGuide.transport.publicTransport.split('.')[0]}.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "turismo" && city.travelGuide && (
                        <div className="space-y-6">
                            <section>
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Atrações Principais</h3>
                                <div className="space-y-3">
                                    {city.travelGuide.tourism.topAttractions.map((attraction, i) => (
                                        <div key={i} className="flex gap-3 bg-secondary/10 p-3 rounded-xl border border-white/5">
                                            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-500">
                                                <Camera className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white">{attraction.name}</h4>
                                                <p className="text-xs text-gray-400 leading-snug">{attraction.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Joias Escondidas</h3>
                                <div className="flex flex-wrap gap-2">
                                    {city.travelGuide.tourism.hiddenGems.map((gem, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-secondary/30 rounded-lg text-xs font-medium text-white/80 border border-white/5">
                                            💎 {gem}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === "gastronomia" && city.travelGuide && (
                        <div className="space-y-6">
                            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 mb-6">
                                <h3 className="text-lg font-black text-amber-500 mb-1">{city.travelGuide.gastronomy.title}</h3>
                                <p className="text-xs text-amber-200/70 italic">Experiências imperdíveis para seu paladar.</p>
                            </div>

                            <div className="space-y-4">
                                {city.travelGuide.gastronomy.dishes.map((dish, i) => (
                                    <div key={i} className="flex justify-between items-start border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">{dish.name}</h4>
                                            <p className="text-xs text-gray-400">{dish.description}</p>
                                        </div>
                                        <div className="shrink-0 flex gap-0.5">
                                            {[...Array(3)].map((_, idx) => (
                                                <DollarSign
                                                    key={idx}
                                                    className={cn(
                                                        "w-3 h-3",
                                                        idx < (dish.priceLevel === 'high' ? 3 : dish.priceLevel === 'medium' ? 2 : 1)
                                                            ? "text-green-400"
                                                            : "text-gray-700"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <section className="mt-6">
                                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Dicas de Local</h3>
                                <ul className="space-y-2">
                                    {city.travelGuide.gastronomy.tips.map((tip, i) => (
                                        <li key={i} className="text-xs text-gray-400 flex gap-2">
                                            <span className="text-amber-500 text-xs">●</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                    <button className="w-full py-4 bg-primary hover:bg-primary/90 text-black rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2">
                        <Plane className="w-4 h-4" />
                        Planejar Viagem para {city.name}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

