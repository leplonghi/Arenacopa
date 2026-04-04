import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Users, Trophy, Globe, TrendingUp, X,
    Thermometer, DollarSign, Plane, Star, Building2,
    Camera, Bus, AlertTriangle, Cloud, Zap, Search
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { hostCountries, generalCuriosities, type HostCity } from "@/data/guiaData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "./animations";
/** Web Share API helper — falls back to clipboard copy */
async function shareCity(title: string, url: string) {
  if (navigator.share) {
    try { await navigator.share({ title, url }); } catch { /* user cancelled */ }
  } else {
    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
  }
}

interface CityStatusData {
    city_id: string;
    temperature: number;
    condition: string;
}

export function GuiaTab() {
    const { t } = useTranslation('sedes');
    const [selectedCountryCode, setSelectedCountryCode] = useState<"USA" | "MEX" | "CAN">("USA");
    const [selectedCity, setSelectedCity] = useState<HostCity | null>(null);
    const [cityStatus, setCityStatus] = useState<Record<string, CityStatusData>>({});

    useEffect(() => {
        const derivedStatus = hostCountries.flatMap((country) => country.cities).reduce<Record<string, CityStatusData>>((acc, city) => {
            const temperatureMatch = city.weather.match(/(\d+)[°º]C/);
            acc[city.id] = {
                city_id: city.id,
                temperature: temperatureMatch ? Number(temperatureMatch[1]) : 24,
                condition: city.weather.split(".")[0] || "Condição estável",
            };
            return acc;
        }, {});

        setCityStatus(derivedStatus);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");

    const activeCountry = hostCountries.find(c => c.code === selectedCountryCode)!;

    const filteredCities = activeCountry.cities.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        city.stadiumName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-32"
        >
            {/* Header Redesigned: Sleek UI sem peso visual forte */}
            <section className="px-4 pt-4">
                <div className="bg-gradient-to-br from-zinc-900 to-black rounded-2xl p-5 border border-white/5 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-display font-bold text-white tracking-tight mb-1">
                                {t('ui.title')}
                            </h1>
                            <p className="max-w-xl text-sm leading-relaxed text-gray-300 font-medium">
                                {t('ui.subtitle')}
                            </p>
                        </div>
                        <div className="flex bg-white/5 rounded-xl border border-white/5 divide-x divide-white/5">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-xs font-bold text-white tracking-wider">16</span>
                            </div>
                            <div className="px-4 py-2 flex items-center gap-2">
                                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-xs font-bold text-white tracking-wider">48</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Search - Sleek Design */}
                <div className="mt-4 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/60 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar cidade ou estádio..."
                        className="w-full bg-zinc-900/80 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-xs font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/10 transition-all backdrop-blur-sm"
                    />
                </div>
            </section>

            {/* Country Tabs: Mobile-first Approach */}
            <section className="px-4">
                <div className="bg-zinc-900/50 p-1 rounded-xl border border-white/5 flex">
                    {hostCountries.map((country) => (
                        <button
                            key={country.code}
                            onClick={() => {
                                setSelectedCountryCode(country.code);
                                setSelectedCity(null);
                            }}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-all duration-300 relative",
                                selectedCountryCode === country.code
                                    ? "bg-zinc-800 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-300"
                            )}
                        >
                            <Flag
                                code={country.code}
                                size="md"
                                className={cn(
                                    "transition-all duration-300",
                                    selectedCountryCode === country.code ? "scale-110 shadow-lg" : "scale-90 opacity-70"
                                )}
                            />
                            <span className={cn(
                                "text-[11px] font-black tracking-[0.16em] uppercase transition-colors",
                                selectedCountryCode === country.code ? "text-emerald-400" : ""
                            )}>
                                {country.code}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Content area: Sem animate presence bloqueante para ser mais leve e imediato */}
            <motion.div
                key={selectedCountryCode}
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="px-4 space-y-8"
            >
                {/* Cities Grid: Cards limpos e diretos para o mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCities.map((city, idx) => (
                        <CityCard
                            key={`${selectedCountryCode}-${city.id}`}
                            city={city}
                            idx={idx}
                            onClick={() => setSelectedCity(city)}
                            status={cityStatus[city.id]}
                            t={t}
                        />
                    ))}
                    {filteredCities.length === 0 && (
                        <div className="col-span-full py-12 text-center">
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Nenhuma cidade encontrada</p>
                        </div>
                    )}
                </div>

                {/* Country Stats Mini-Card */}
                <div className="bg-zinc-900/80 rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Flag code={activeCountry.code} size="lg" className="shrink-0" />
                        <div>
                            <h3 className="font-display font-bold text-white leading-tight">{activeCountry.name}</h3>
                            <p className="text-[11px] text-gray-400 uppercase tracking-widest">{t('ui.exploring')}</p>
                        </div>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed mb-5">
                        {activeCountry.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <InfoBadge icon={<Users className="w-3 h-3 text-blue-400" />} title={t('ui.population')} value={activeCountry.population} />
                        <InfoBadge icon={<DollarSign className="w-3 h-3 text-emerald-400" />} title={t('ui.currency')} value={activeCountry.currency} />
                    </div>
                </div>
            </motion.div>

            {/* Curiosities */}
            <section className="px-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <Star className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">{t('ui.curiosity')}</h4>
                        <p className="text-sm font-medium text-amber-100/80 leading-relaxed">
                            "{generalCuriosities[0].description}"
                        </p>
                    </div>
                </div>
            </section>

            {/* City Details Bottom Sheet Modal */}
            <AnimatePresence>
                {selectedCity && (
                    <CityDetailsModal
                        city={selectedCity}
                        dynamicStatus={cityStatus[selectedCity.id]}
                        onClose={() => setSelectedCity(null)}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CityCard({ city, idx, onClick, status, t }: { city: HostCity, idx: number, onClick: () => void, status?: CityStatusData, t: TFunction<"sedes"> }) {
    const bgImage = city.image || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80";

    return (
        <motion.div
            variants={staggerItem}
            custom={idx}
            onClick={onClick}
            className="glass-card hover:bg-white/[0.06] transition-all duration-300 cursor-pointer group rounded-[24px] overflow-hidden border border-white/10 active:scale-[0.98] flex flex-col"
        >
            {/* Image area */}
            <div className="relative h-[160px] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${bgImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Country badge + temp */}
                <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                    <div className="flex items-center gap-1.5 rounded-full bg-black/50 border border-white/10 px-2.5 py-1 backdrop-blur-sm">
                        <Flag code={city.countryCode} size="sm" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{city.countryCode}</span>
                    </div>
                    {status && (
                        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                            <Thermometer className="w-3 h-3 text-emerald-400" />
                            {status.temperature}°C
                        </div>
                    )}
                </div>

                {/* City name over image */}
                <div className="absolute bottom-3 left-3">
                    <h3 className="text-[17px] font-black text-white leading-tight drop-shadow-md">
                        {t(`cities.${city.id}.name`, { defaultValue: city.name })}
                    </h3>
                </div>
            </div>

            {/* Info row */}
            <div className="p-3 flex items-center justify-between gap-3">
                <span className="text-[11px] text-gray-400 font-semibold truncate">{city.stadiumName}</span>
                <span className="flex items-center gap-1 shrink-0 text-[11px] font-black text-emerald-400">
                    <Building2 className="w-3 h-3" />{Math.round(city.stadiumCapacity / 1000)}k
                </span>
            </div>
        </motion.div>
    );
}

function InfoBadge({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) {
    return (
        <div className="bg-black/30 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
                {icon} {title}
            </div>
            <div className="text-sm font-black text-white">{value}</div>
        </div>
    );
}

// Interfaces e Helpers Modal
interface TranslatedCityData {
    name?: string;
    description?: string;
    highlights?: string[];
    stadium?: { name: string; historicFact: string; };
    travel?: {
        airport: string;
        transport: string;
        dishes: { name: string; description: string; priceLevel?: string }[];
        attractions: { name: string; description: string }[];
    };
    trivia?: string[];
    weather?: string;
}

export function CityDetailsModal({ city, dynamicStatus, onClose, t }: { city: HostCity, dynamicStatus?: CityStatusData, onClose: () => void, t: TFunction<"sedes"> }) {
    const [activeTab, setActiveTab] = useState<"geral" | "turismo" | "gastronomia">("geral");

    const cityData = t(`cities.${city.id}`, { returnObjects: true }) as TranslatedCityData;
    const translatedCity = { ...city, ...cityData };
    const heroImg = city.travelGuide?.heroImage || city.image || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full sm:max-w-2xl sm:mx-auto bg-zinc-950 sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-[93vh] sm:h-[88vh] border-t sm:border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle */}
                <div className="w-full flex justify-center pt-3 pb-1 shrink-0 absolute top-0 z-30 sm:hidden">
                    <div className="w-10 h-1 bg-white/25 rounded-full" />
                </div>

                {/* Hero image */}
                <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden">
                    <img
                        src={heroImg}
                        alt={city.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white backdrop-blur-md"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="inline-flex bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 items-center gap-1.5 text-[9px] font-black uppercase text-white tracking-widest mb-2">
                            <Flag code={city.countryCode} size="sm" />
                            {city.countryCode} • Copa 2026
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                            {t(`cities.${city.id}.name`, { defaultValue: city.name })}
                        </h2>
                    </div>
                </div>

                {/* Quick-facts strip */}
                <div className="shrink-0 flex gap-0 divide-x divide-white/[0.06] bg-zinc-900/60 border-b border-white/[0.06]">
                    <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Estádio</span>
                        <span className="text-xs font-black text-white text-center leading-tight px-1">{city.stadiumName}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Capacidade</span>
                        <span className="text-xs font-black text-emerald-400">{(city.stadiumCapacity / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Clima</span>
                        <span className="text-xs font-black text-amber-400">
                            {dynamicStatus ? `${dynamicStatus.temperature}°C` : city.avgTempSummer || "–"}
                        </span>
                    </div>
                    {city.wcMatches && (
                        <div className="flex-1 flex flex-col items-center py-3 gap-0.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Jogos</span>
                            <span className="text-xs font-black text-white">{city.wcMatches}</span>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.06] bg-zinc-950 shrink-0">
                    {(["geral", "turismo", "gastronomia"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            aria-pressed={activeTab === tab}
                            className={cn(
                                "flex-1 py-3.5 text-[10px] font-black uppercase tracking-[0.16em] transition-colors border-b-2",
                                activeTab === tab
                                    ? "text-emerald-400 border-emerald-400"
                                    : "text-gray-500 border-transparent"
                            )}
                        >
                            {tab === 'geral' ? 'Geral' : tab === 'turismo' ? 'Turismo' : 'Gastronomia'}
                        </button>
                    ))}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-950 px-4 py-5 space-y-6">

                    {/* ── GERAL ── */}
                    {activeTab === "geral" && (
                        <>
                            {/* Description */}
                            <p className="text-sm text-gray-300 leading-relaxed">{translatedCity.description || city.description}</p>

                            {/* Stadium card */}
                            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex gap-4 items-center">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                                    <Trophy className="w-6 h-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Estádio Sede</p>
                                    <h4 className="font-black text-white leading-tight">{city.stadiumName}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{city.stadiumCapacity.toLocaleString('pt-BR')} lugares
                                        {city.stadiumYearBuilt ? ` • Inaugurado em ${city.stadiumYearBuilt}` : ""}
                                        {city.stadiumCost ? ` • ${city.stadiumCost}` : ""}
                                    </p>
                                    {city.historicFact && (
                                        <p className="text-xs text-emerald-300/70 mt-1 italic">"{city.historicFact}"</p>
                                    )}
                                </div>
                            </div>

                            {/* Curiosities */}
                            {city.curiosities?.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5" /> Curiosidades
                                    </h3>
                                    <div className="space-y-2">
                                        {city.curiosities.map((c, i) => (
                                            <div key={i} className="flex gap-3 items-start bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
                                                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-[9px] font-black text-amber-400">{i + 1}</span>
                                                <p className="text-xs text-gray-300 leading-relaxed">{c}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Transport + Safety 2-col */}
                            <div className="grid grid-cols-2 gap-3">
                                {city.travelGuide?.transport && (
                                    <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-400 tracking-widest mb-2">
                                            <Plane className="w-3 h-3" /> Aeroporto
                                        </div>
                                        <p className="text-xs font-bold text-white">{city.travelGuide.transport.airport}</p>
                                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{city.travelGuide.transport.publicTransport}</p>
                                    </div>
                                )}
                                {city.travelGuide?.safety && (
                                    <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-3">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-red-400 tracking-widest mb-2">
                                            <AlertTriangle className="w-3 h-3" /> Segurança
                                        </div>
                                        {city.travelGuide.safety.tips.slice(0, 2).map((tip, i) => (
                                            <p key={i} className="text-[11px] text-gray-400 leading-relaxed mb-0.5">• {tip}</p>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Accommodation prices */}
                            {city.travelGuide?.accommodation && (
                                <div className="bg-zinc-900 rounded-xl border border-white/[0.06] p-4">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Hospedagem estimada (Copa)</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold mb-0.5">Hotel</p>
                                            <p className="text-sm font-black text-white">{city.travelGuide.accommodation.avgHotelPrice}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold mb-0.5">Airbnb</p>
                                            <p className="text-sm font-black text-white">{city.travelGuide.accommodation.avgAirbnbPrice}</p>
                                        </div>
                                    </div>
                                    {city.travelGuide.accommodation.bestAreas?.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/[0.06]">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Melhores bairros</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {city.travelGuide.accommodation.bestAreas.map((area, i) => (
                                                    <span key={i} className="bg-white/[0.06] text-[10px] font-medium text-gray-300 px-2 py-0.5 rounded-full border border-white/[0.06]">{area}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Population + timezone + altitude */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-zinc-900/60 rounded-xl p-3 border border-white/[0.05] text-center">
                                    <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Popul.</p>
                                    <p className="text-xs font-black text-white mt-0.5">{city.population}</p>
                                </div>
                                {city.timezone && (
                                    <div className="bg-zinc-900/60 rounded-xl p-3 border border-white/[0.05] text-center">
                                        <Globe className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Fuso</p>
                                        <p className="text-xs font-black text-white mt-0.5">{city.timezone}</p>
                                    </div>
                                )}
                                {city.altitude && (
                                    <div className="bg-zinc-900/60 rounded-xl p-3 border border-white/[0.05] text-center">
                                        <TrendingUp className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Alt.</p>
                                        <p className="text-xs font-black text-white mt-0.5">{city.altitude}m</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── TURISMO ── */}
                    {activeTab === "turismo" && (
                        <>
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Principais Atrações
                                </h3>
                                <div className="space-y-3">
                                    {(city.travelGuide?.tourism.topAttractions || []).map((attr, i) => (
                                        <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.07] bg-zinc-900">
                                            {attr.image && (
                                                <img
                                                    src={`${attr.image}?auto=format&fit=crop&w=600&q=75`}
                                                    alt={attr.name}
                                                    className="w-full h-36 object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="p-4">
                                                <h4 className="text-sm font-black text-white mb-1">{attr.name}</h4>
                                                <p className="text-xs text-gray-400 leading-relaxed">{attr.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {city.travelGuide?.tourism.hiddenGems?.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Segredos Locais</h3>
                                    <div className="space-y-2">
                                        {city.travelGuide.tourism.hiddenGems.map((gem, i) => (
                                            <div key={i} className="flex items-start gap-2 bg-white/[0.03] rounded-xl p-3 border border-white/[0.05]">
                                                <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                                                <p className="text-xs text-gray-300 leading-relaxed">{gem}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Highlights from HostCity */}
                            {city.highlights?.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Destaques</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {city.highlights.map((h, i) => (
                                            <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">
                                                {h}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── GASTRONOMIA ── */}
                    {activeTab === "gastronomia" && city.travelGuide && (
                        <>
                            <div className="space-y-3">
                                {city.travelGuide.gastronomy.dishes.map((dish, i) => (
                                    <div key={i} className="bg-zinc-900 p-4 rounded-2xl border border-white/[0.07]">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <h4 className="text-sm font-black text-white">{dish.name}</h4>
                                            <div className="flex gap-0.5">
                                                {[...Array(3)].map((_, idx) => (
                                                    <DollarSign
                                                        key={idx}
                                                        className={cn("w-3.5 h-3.5",
                                                            idx < (dish.priceLevel === 'high' ? 3 : dish.priceLevel === 'medium' ? 2 : 1)
                                                                ? "text-emerald-400"
                                                                : "text-white/15"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">{dish.description}</p>
                                    </div>
                                ))}
                            </div>

                            {city.travelGuide.gastronomy.tips?.length > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                                        <Star className="w-3.5 h-3.5" /> Dicas Locais
                                    </h3>
                                    {city.travelGuide.gastronomy.tips.map((tip, i) => (
                                        <p key={i} className="text-xs text-amber-100/70 leading-relaxed mb-1">• {tip}</p>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-4 py-3 bg-zinc-950 border-t border-white/[0.06] flex gap-3">
                    <button
                        onClick={() => shareCity(
                            `Arena CUP - ${city.name}`,
                            `https://arenacopa-web-2026.web.app/guia`,
                        )}
                        className="flex-1 h-11 flex items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.08] text-[11px] font-black uppercase tracking-widest text-white"
                    >
                        Compartilhar
                    </button>
                    <button
                        onClick={() => setActiveTab("turismo")}
                        className="flex-[2] h-11 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-[11px] font-black uppercase tracking-widest text-black"
                    >
                        <Plane className="w-4 h-4" /> Ver Roteiro
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
