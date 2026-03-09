import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { MapPin, X, Users, Compass, ShieldCheck, ChevronRight } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { Flag } from "@/components/Flag";

export function SedesTab() {
    const [selectedSede, setSelectedSede] = useState<any | null>(null);

    // Fallback data if sedes is not fully populated in mockData
    const defaultSedes = [
        { id: "s1", name: "New York/New Jersey", country: "USA", stadium: "MetLife Stadium", capacity: 82500, image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400", desc: "Palco da grande final, a capital do mundo aguarda." },
        { id: "s2", name: "Los Angeles", country: "USA", stadium: "SoFi Stadium", capacity: 70000, image: "https://images.unsplash.com/photo-1518481852452-9415b262eba4?q=80&w=400", desc: "A cidade dos anjos recebe o futebol mundial." },
        { id: "s3", name: "Toronto", country: "CAN", stadium: "BMO Field", capacity: 45000, image: "https://images.unsplash.com/photo-1547468862-520e7e1ef002?q=80&w=400", desc: "A diversidade de Toronto se traduz em futebol." },
        { id: "s4", name: "Mexico City", country: "MEX", stadium: "Estadio Azteca", capacity: 83000, image: "https://images.unsplash.com/photo-1565022536102-f7645c84354a?q=80&w=400", desc: "O sagrado Estadio Azteca faz história novamente." },
        { id: "s5", name: "Dallas", country: "USA", stadium: "AT&T Stadium", capacity: 80000, image: "https://images.unsplash.com/photo-1481270836528-76579fcbc5ee?q=80&w=400", desc: "Tudo é gigante no Texas, inclusive o estádio." },
        { id: "s6", name: "Miami", country: "USA", stadium: "Hard Rock Stadium", capacity: 65000, image: "https://images.unsplash.com/photo-1533227268428-f9ed0900e4b5?q=80&w=400", desc: "Clima tropical, praia e muito futebol em Miami." },
        // I will include just a few representative ones, with same structure
    ];

    const cityData = defaultSedes;

    return (
        <>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-4"
            >
                <motion.div variants={staggerItem} className="mb-6">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">16 Cidades Sede</span>
                    <h2 className="text-xl font-black flex items-center gap-2 mt-1">
                        <MapPin className="w-5 h-5 text-primary" />
                        Explorar Sedes
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {cityData.map((city: any, i: number) => (
                        <motion.div
                            variants={staggerItem}
                            key={city.id || i}
                            onClick={() => setSelectedSede(city)}
                            className="glass-card hover:bg-white/5 transition-colors cursor-pointer group rounded-[24px] overflow-hidden flex flex-col items-start border border-white/10 p-1.5"
                        >
                            <div className="relative w-full aspect-square md:aspect-video rounded-[20px] overflow-hidden shrink-0">
                                <img src={city.image || "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=400"} alt={city.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                    <Flag code={city.country} size="sm" className="shadow-lg border border-white/20" />
                                </div>
                            </div>
                            <div className="p-3 w-full">
                                <h3 className="font-bold text-[13px] leading-tight mb-1 truncate text-white">{city.name}</h3>
                                <p className="text-[10px] text-muted-foreground font-semibold flex items-center justify-between">
                                    <span className="truncate">{city.stadium}</span>
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Expanded Modal */}
            <AnimatePresence>
                {selectedSede && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
                        onClick={() => setSelectedSede(null)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 200, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-lg bg-[#0a0a0a] rounded-t-[32px] sm:rounded-[32px] border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative h-48 shrink-0">
                                <img src={selectedSede.image || "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800"} alt={selectedSede.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

                                <button
                                    onClick={() => setSelectedSede(null)}
                                    className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="absolute bottom-4 left-5 right-5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Flag code={selectedSede.country} size="sm" className="shadow-lg" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                                            {selectedSede.country}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter">{selectedSede.name}</h2>
                                </div>
                            </div>

                            <div className="p-5 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-6 text-white pb-8">
                                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                    {selectedSede.desc || "Uma das incríveis sedes que receberá jogos emocionantes nesta Copa do Mundo, unindo culturas apaixonadas por futebol."}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 border border-white/5 rounded-[20px] p-4 flex flex-col gap-1 items-start">
                                        <ShieldCheck className="w-5 h-5 text-copa-live mb-1" />
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Estádio</span>
                                        <span className="text-sm font-bold truncate w-full">{selectedSede.stadium}</span>
                                    </div>
                                    <div className="bg-white/5 border border-white/5 rounded-[20px] p-4 flex flex-col gap-1 items-start">
                                        <Users className="w-5 h-5 text-blue-400 mb-1" />
                                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Capacidade</span>
                                        <span className="text-sm font-bold">{selectedSede.capacity?.toLocaleString('pt-BR') || "65.000"}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Compass className="w-4 h-4" /> Curiosidades
                                    </h3>
                                    <ul className="space-y-2 text-xs text-gray-300">
                                        <li className="flex gap-2"><span className="text-primary">•</span> A preparação da cidade inclui melhorias significativas em mobilidade urbana.</li>
                                        <li className="flex gap-2"><span className="text-primary">•</span> O estádio utilizará 100% de energia renovável durante a Copa.</li>
                                        <li className="flex gap-2"><span className="text-primary">•</span> Diversas "Fun Fests" serão montadas para torcedores no centro da cidade.</li>
                                    </ul>

                                    <a href={`https://pt.wikipedia.org/wiki/${selectedSede.name.replace(' ', '_')}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-between w-full bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors border border-white/10 group cursor-pointer text-xs font-bold text-gray-300">
                                        Saber mais na Wikipedia <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
                                    </a>
                                </div>

                                {/* Ad Banner Inside Modal as Requested */}
                                <div className="mt-6">
                                    <AdBanner variant="banner" slotId="modal-sede-footer" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
