import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, ScrollText,
    List
} from "lucide-react";
import { cn } from "@/lib/utils";

const HistoriaTab = lazy(() => import("@/components/copa/HistoriaTab").then((module) => ({ default: module.HistoriaTab })));
const SedesTab = lazy(() => import("@/components/copa/SedesTab").then((module) => ({ default: module.SedesTab })));
const GuiaTab = lazy(() => import("@/components/copa/GuiaTab").then((module) => ({ default: module.GuiaTab })));

type GuiaViewMode = "list" | "map" | "history";
const VALID_SUBTABS = new Set(["historia", "mapa", "estadios"]);

const GuiaLoadingState = () => (
    <div className="surface-card rounded-[28px] p-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
        Carregando guia...
    </div>
);

export default function Guia() {
    const { subtab } = useParams<{ subtab?: string }>();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<GuiaViewMode>(() => {
        if (subtab === "historia") return "history";
        if (subtab === "mapa" || subtab === "estadios") return "map";
        return "list";
    });

    useEffect(() => {
        if (!subtab) {
            setViewMode("list");
            return;
        }

        if (!VALID_SUBTABS.has(subtab)) {
            navigate("/guia", { replace: true });
            return;
        }

        if (subtab === "historia") setViewMode("history");
        else if (subtab === "mapa" || subtab === "estadios") setViewMode("map");
        else setViewMode("list");
    }, [navigate, subtab]);

    const handleModeToggle = (mode: GuiaViewMode) => {
        setViewMode(mode);
        if (mode === "history") navigate("/guia/historia");
        else if (mode === "map") navigate("/guia/mapa");
        else navigate("/guia");
    };

    return (
        <div className="surface-card-strong relative flex min-h-[calc(100vh-140px)] w-full flex-col rounded-[2.5rem] border-emerald-500/10 md:min-h-[calc(100vh-100px)]">
            {/* Background Texture/glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />

            {/* Top Toggle Bar - Moved from bottom to solve overlapping */}
            <div className="shrink-0 z-[1000] flex justify-center border-b border-white/[0.05] bg-black/20 p-4 backdrop-blur-xl">
                <div className="surface-card-soft flex max-w-full gap-1 overflow-x-auto rounded-full p-1 scrollbar-none">
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
            <div className="relative flex-1">
                <AnimatePresence mode="wait">
                    {viewMode === "history" ? (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 w-full bg-transparent"
                        >
                            <div className="container mx-auto px-6 py-6 pb-20">
                                <Suspense fallback={<GuiaLoadingState />}>
                                    <HistoriaTab />
                                </Suspense>
                            </div>
                        </motion.div>
                    ) : viewMode === "map" ? (
                        <motion.div
                            key="map"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="relative z-10 w-full bg-transparent p-6"
                        >
                            <Suspense fallback={<GuiaLoadingState />}>
                                <SedesTab />
                            </Suspense>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 w-full bg-transparent"
                        >
                            <div className="container mx-auto px-6 py-6 pb-20">
                                <Suspense fallback={<GuiaLoadingState />}>
                                    <GuiaTab />
                                </Suspense>
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
            aria-pressed={isActive}
            className={cn(
                "relative z-10 flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all group",
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

