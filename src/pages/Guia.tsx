
import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2, Globe, Map as MapIcon, ScrollText,
    ArrowLeft, Info
} from "lucide-react";

import { HistoriaTab } from "@/components/copa/HistoriaTab";
import { GuiaMapExplorer } from "@/components/copa/GuiaMapExplorer";

// Define sections for routing purposes
type GuiaSection = "descubra" | "estadios" | "historia";

export default function Guia() {
    const { subtab } = useParams<{ subtab?: string }>();
    const navigate = useNavigate();

    // Determine initial state based on URL
    const isHistoryInitial = subtab === "historia";
    const [isHistoryMode, setIsHistoryMode] = useState(isHistoryInitial);

    // Sync URL with state
    useEffect(() => {
        if (subtab === "historia") setIsHistoryMode(true);
        else setIsHistoryMode(false);
    }, [subtab]);

    const handleModeToggle = (mode: "map" | "history") => {
        setIsHistoryMode(mode === "history");
        if (mode === "history") navigate("/guia/historia");
        else navigate("/guia");
    };

    return (
        <div className="relative w-full overflow-hidden bg-black" style={{ height: "calc(100vh - 64px)" }}>

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                {isHistoryMode ? (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full overflow-y-auto custom-scrollbar bg-black"
                    >
                        <div className="container mx-auto px-4 py-6 pb-24">
                            <HistoriaTab />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="map"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full absolute inset-0"
                    >
                        <GuiaMapExplorer
                            initialFilter={subtab === "estadios" ? "stadium" : "all"}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Switch (Bottom Center) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-2 p-1 bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
                <button
                    onClick={() => handleModeToggle("map")}
                    className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all z-10
                        ${!isHistoryMode
                            ? "text-black scale-105"
                            : "text-white/60 hover:text-white hover:bg-white/10"}
                    `}
                >
                    <Globe className="w-4 h-4" />
                    <span className="relative z-10">Explorar</span>
                    {!isHistoryMode && (
                        <motion.div
                            layoutId="active-tab-bg"
                            className="absolute inset-0 bg-white rounded-full -z-0 shadow-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>

                <button
                    onClick={() => handleModeToggle("history")}
                    className={`
                        relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all z-10
                        ${isHistoryMode
                            ? "text-black scale-105"
                            : "text-white/60 hover:text-white hover:bg-white/10"}
                    `}
                >
                    <ScrollText className="w-4 h-4" />
                    <span className="relative z-10">Histórico</span>
                    {isHistoryMode && (
                        <motion.div
                            layoutId="active-tab-bg"
                            className="absolute inset-0 bg-white rounded-full -z-0 shadow-lg"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                </button>
            </div>

            {/* Optional Floating "Back" button if deep in history to quickly go to map? 
                Not needed with the toggle. 
            */}
        </div>
    );
}
