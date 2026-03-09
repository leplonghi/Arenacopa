import { useState, useEffect } from "react";
import { db } from "@/integrations/firebase/client";
import { collection, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    MapPin, Users, Trophy, Globe, TrendingUp, X,
    Thermometer, DollarSign, Plane, Star, Building2,
    Camera, Bus, AlertTriangle, Cloud, Zap
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { hostCountries, generalCuriosities, type HostCity } from "@/data/guiaData";
import { Flag } from "@/components/Flag";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "./animations";
import { Share } from "@capacitor/share";

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
        const fetchCityStatus = async () => {
            try {
                const statusRef = collection(db, 'city_status');
                const statusSnapshot = await getDocs(statusRef);
                if (!statusSnapshot.empty) {
                    const statusMap: Record<string, CityStatusData> = {};
                    statusSnapshot.docs.forEach((docSnap) => {
                        const item = docSnap.data() as CityStatusData;
                        statusMap[item.city_id] = item;
                    });
                    setCityStatus(statusMap);
                }
            } catch (err) {
                console.error("Error fetching city status", err);
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
                            <p className="text-sm text-gray-400 font-medium">
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
                                "text-[10px] font-black tracking-widest uppercase transition-colors",
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
                    {activeCountry.cities.map((city, idx) => (
                        <CityCard
                            key={`${selectedCountryCode}-${city.id}`}
                            city={city}
                            idx={idx}
                            onClick={() => setSelectedCity(city)}
                            status={cityStatus[city.id]}
                        />
                    ))}
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
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CityCard({ city, idx, onClick, status }: { city: HostCity, idx: number, onClick: () => void, status?: CityStatusData }) {
    const { t } = useTranslation('sedes');
    const bgImage = city.image || "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=800&q=80";

    return (
        <motion.div
            variants={staggerItem}
            custom={idx}
            onClick={onClick}
            className="group relative h-[180px] rounded-2xl overflow-hidden cursor-pointer bg-zinc-900 border border-white/5 active:scale-[0.98] transition-transform"
        >
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
            {/* Gradient for legibility - always visible on mobile */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-100" />

            <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                        {city.countryCode} Sede
                    </div>

                    {status && (
                        <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white border border-white/10 flex items-center gap-1">
                            <Thermometer className="w-3 h-3 text-emerald-400" />
                            {status.temperature}°C
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-display font-bold text-white leading-tight mb-2 drop-shadow-md">
                        {t(`cities.${city.id}.name`, { defaultValue: city.name })}
                    </h3>

                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-300">
                            <Users className="w-3 h-3" /> {city.population}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                            <Building2 className="w-3 h-3" /> {Math.round(city.stadiumCapacity / 1000)}k
                        </span>
                    </div>
                </div>
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

export function CityDetailsModal({ city, dynamicStatus, onClose }: { city: HostCity, dynamicStatus?: CityStatusData, onClose: () => void }) {
    const { t } = useTranslation('sedes');
    const [activeTab, setActiveTab] = useState<"geral" | "turismo" | "gastronomia">("geral");

    const cityData = t(`cities.${city.id}`, { returnObjects: true }) as TranslatedCityData;
    const translatedCity = { ...city, ...cityData };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-full sm:max-w-2xl bg-zinc-950 sm:rounded-2xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] border-t sm:border border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle for mobile feel */}
                <div className="w-full flex justify-center pt-3 pb-1 shrink-0 bg-zinc-950/80 backdrop-blur-sm absolute top-0 z-30 sm:hidden">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                </div>

                <div className="relative h-64 shrink-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${city.travelGuide?.heroImage || city.image}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="inline-flex bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/10 items-center gap-1.5 text-[9px] font-black uppercase text-white tracking-widest mb-2">
                            <Flag code={city.countryCode as any} size="sm" />
                            {city.countryCode} Sede
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mb-3">
                            {t(`cities.${city.id}.name`, { defaultValue: city.name })}
                        </h2>

                        <div className="flex flex-wrap gap-2">
                            <span className="bg-black/40 px-2 py-1 rounded border border-white/10 text-[10px] text-white flex gap-1 font-bold items-center">
                                <Building2 className="w-3 h-3 text-emerald-400" />
                                {city.stadiumCapacity / 1000}k
                            </span>
                            <span className="bg-black/40 px-2 py-1 rounded border border-white/10 text-[10px] text-white flex gap-1 font-bold items-center">
                                <Cloud className="w-3 h-3 text-amber-400" />
                                {translatedCity.weather || city.weather}
                            </span>
                        </div>
                    </div>
                </div>

                {city.travelGuide && (
                    <div className="flex border-b border-white/5 bg-zinc-950 shrink-0 sticky top-0 z-20">
                        {(["geral", "turismo", "gastronomia"] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2",
                                    activeTab === tab
                                        ? "text-emerald-400 border-emerald-400"
                                        : "text-gray-500 border-transparent hover:text-gray-300"
                                )}
                            >
                                {t(`ui.tabs.${tab === 'geral' ? 'general' : tab === 'turismo' ? 'tourism' : 'gastronomy'}`)}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-6 bg-zinc-950 space-y-8">
                    {activeTab === "geral" && (
                        <div className="space-y-6">
                            <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                {translatedCity.description}
                            </p>

                            <div className="bg-black rounded-2xl p-4 border border-white/5">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        <Trophy className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-white mb-0.5">{city.stadiumName}</h4>
                                        <p className="text-xs text-emerald-400/80 font-bold tracking-widest uppercase">
                                            {city.stadiumCapacity.toLocaleString()} Lugares
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {city.travelGuide?.safety && (
                                    <div className="p-4 bg-zinc-900 rounded-xl border border-white/5">
                                        <div className="flex gap-2 items-center text-[10px] font-black uppercase text-red-500 mb-2">
                                            <AlertTriangle className="w-3.5 h-3.5" /> Dicas de Segurança
                                        </div>
                                        {city.travelGuide.safety.tips.slice(0, 2).map((tip, i) => (
                                            <p key={i} className="text-xs text-gray-400 mb-1 leading-relaxed">• {tip}</p>
                                        ))}
                                    </div>
                                )}
                                {translatedCity.travel?.transport && (
                                    <div className="p-4 bg-zinc-900 rounded-xl border border-white/5">
                                        <div className="flex gap-2 items-center text-[10px] font-black uppercase text-blue-400 mb-2">
                                            <Bus className="w-3.5 h-3.5" /> Transporte Expresso
                                        </div>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            {translatedCity.travel.transport}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "turismo" && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 inline-flex items-center gap-2">
                                    <Camera className="w-4 h-4" /> Atrações Principais
                                </h3>
                                <div className="space-y-3">
                                    {(translatedCity.travel?.attractions || city.travelGuide?.tourism.topAttractions || []).map((attr, i) => (
                                        <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-white/5">
                                            <h4 className="text-sm font-black text-white mb-1">{attr.name}</h4>
                                            <p className="text-xs text-gray-400 leading-relaxed">{attr.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Segredos Locais</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(city.travelGuide?.tourism.hiddenGems || []).map((gem, i) => (
                                        <span key={i} className="bg-white/5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300">
                                            • {gem}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "gastronomia" && city.travelGuide && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 inline-flex items-center gap-2">
                                    Gastronomia Local
                                </h3>
                                <div className="space-y-3">
                                    {(translatedCity.travel?.dishes || city.travelGuide.gastronomy.dishes || []).map((dish, i) => (
                                        <div key={i} className="bg-zinc-900 p-4 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-black text-white">{dish.name}</h4>
                                                <div className="flex gap-0.5 opacity-50">
                                                    {[...Array(3)].map((_, idx) => (
                                                        <DollarSign
                                                            key={idx}
                                                            className={cn("w-3 h-3", idx < (dish.priceLevel === 'high' ? 3 : dish.priceLevel === 'medium' ? 2 : 1) ? "text-white" : "text-white/20")}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">{dish.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 p-4 bg-zinc-950 border-t border-white/5 grid grid-cols-3 gap-3">
                    <button
                        onClick={() => Share.share({
                            title: `ArenaCup - ${t(`cities.${city.id}.name`, { defaultValue: city.name })}`,
                            url: 'https://arenacup.app/guia',
                        })}
                        className="col-span-1 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white text-[11px] font-black tracking-widest uppercase flex items-center justify-center transition-colors"
                    >
                        Share
                    </button>
                    <button className="col-span-2 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-colors">
                        <Plane className="w-4 h-4" /> Plano
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
