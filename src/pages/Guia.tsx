
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Map as MapIcon, ScrollText,
    List
} from "lucide-react";
import { cn } from "@/lib/utils";

import { HistoriaTab } from "@/components/copa/HistoriaTab";
import { SedesTab } from "@/components/copa/SedesTab";
import { GuiaTab } from "@/components/copa/GuiaTab";

type GuiaViewMode = "list" | "map" | "history";

export default function Guia() {
    const { subtab } = useParams<{ subtab?: string }>();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<GuiaViewMode>(() => {
        if (subtab === "historia") return "history";
        if (subtab === "mapa" || subtab === "estadios") return "map";
        return "list";
    });

    useEffect(() => {
        if (subtab === "historia") setViewMode("history");
        else if (subtab === "mapa" || subtab === "estadios") setViewMode("map");
        else setViewMode("list");
    }, [subtab]);

    const handleModeToggle = (mode: GuiaViewMode) => {
        setViewMode(mode);
        if (mode === "history") navigate("/guia/historia");
        else if (mode === "map") navigate("/guia/mapa");
        else navigate("/guia");
    };

    return (
        <div className="relative w-full h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col overflow-hidden rounded-[2.5rem] bg-[#050505] border border-emerald-500/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
            {/* Background Texture/glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Toggle Bar - Moved from bottom to solve overlapping */}
            <div className="shrink-0 z-[1000] flex justify-center p-4 border-b border-white/[0.05] bg-black/20 backdrop-blur-xl">
                <div className="flex gap-1 p-1 bg-white/5 rounded-full border border-white/10 overflow-x-auto scrollbar-none max-w-full">
                    <ToggleButton
                        isActive={viewMode === "list"}
                        onClick={() => handleModeToggle("list")}
                        icon={<List className="w-3.5 h-3.5" />}
                        label="Cidades"
                    />

                    <ToggleButton
                        isActive={viewMode === "map"}
                        onClick={() => handleModeToggle("map")}
                        icon={<Globe className="w-3.5 h-3.5" />}
                        label="Mapa"
                    />

                    <ToggleButton
                        isActive={viewMode === "history"}
                        onClick={() => handleModeToggle("history")}
                        icon={<ScrollText className="w-3.5 h-3.5" />}
                        label="História da Copa"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {viewMode === "history" ? (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full overflow-y-auto custom-scrollbar bg-transparent relative z-10"
                        >
                            <div className="container mx-auto px-6 py-6 pb-20">
                                <HistoriaTab />
                            </div>
                        </motion.div>
                    ) : viewMode === "map" ? (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full overflow-y-auto custom-scrollbar bg-transparent relative z-10 p-6"
                        >
                            <SedesTab />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full h-full overflow-y-auto custom-scrollbar bg-transparent relative z-10"
                        >
                            <div className="container mx-auto px-6 py-6 pb-20">
                                <GuiaTab />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ToggleButton({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all z-10 whitespace-nowrap group",
                isActive
                    ? "text-black"
                    : "text-white/40 hover:text-white"
            )}
        >
            <div className={cn(
                "relative z-10 flex items-center gap-2 transition-transform duration-300",
                isActive ? "scale-105" : "group-hover:scale-105"
            )}>
                {icon}
                <span>{label}</span>
            </div>

            {isActive && (
                <motion.div
                    layoutId="active-tab-bg-guia"
                    className="absolute inset-0 bg-emerald-400 rounded-full -z-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
        </button>
    );
}

