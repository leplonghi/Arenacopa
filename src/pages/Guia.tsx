import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe,
    List,
    ScrollText,
    Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";

const SedesTab = lazy(() => import("@/components/copa/SedesTab").then((module) => ({ default: module.SedesTab })));
const GuiaTab = lazy(() => import("@/components/copa/GuiaTab").then((module) => ({ default: module.GuiaTab })));
const HistoriaTab = lazy(() => import("@/components/copa/HistoriaTab").then((module) => ({ default: module.HistoriaTab })));
const NoticiasTab = lazy(() => import("@/components/copa/NoticiasTab").then((module) => ({ default: module.NoticiasTab })));

type GuiaViewMode = "list" | "map" | "historia" | "noticias";
const VALID_SUBTABS = new Set(["mapa", "estadios", "historia", "noticias"]);

const GuiaLoadingState = () => (
    <div className="surface-card rounded-[28px] p-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
        Carregando guia...
    </div>
);

export default function Guia() {
    const { subtab } = useParams<{ subtab?: string }>();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState<GuiaViewMode>(() => {
        if (subtab === "mapa" || subtab === "estadios") return "map";
        if (subtab === "historia") return "historia";
        if (subtab === "noticias") return "noticias";
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
        if (subtab === "mapa" || subtab === "estadios") setViewMode("map");
        else if (subtab === "historia") setViewMode("historia");
        else if (subtab === "noticias") setViewMode("noticias");
        else setViewMode("list");
    }, [navigate, subtab]);

    const handleModeToggle = (mode: GuiaViewMode) => {
        setViewMode(mode);
        if (mode === "map") navigate("/guia/mapa");
        else if (mode === "historia") navigate("/guia/historia");
        else if (mode === "noticias") navigate("/guia/noticias");
        else navigate("/guia");
    };

    return (
        <div className="surface-card-strong relative flex min-h-[calc(100vh-140px)] w-full flex-col rounded-[2.5rem] border-emerald-500/10 md:min-h-[calc(100vh-100px)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)] pointer-events-none" />
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
                        label="Sedes"
                    />
                    <ToggleButton
                        isActive={viewMode === "historia"}
                        onClick={() => handleModeToggle("historia")}
                        icon={<ScrollText className="w-3.5 h-3.5" />}
                        label="História"
                    />
                    <ToggleButton
                        isActive={viewMode === "noticias"}
                        onClick={() => handleModeToggle("noticias")}
                        icon={<Newspaper className="w-3.5 h-3.5" />}
                        label="Notícias"
                    />
                </div>
            </div>

            <div className="relative flex-1">
                <AnimatePresence mode="wait">
                    {viewMode === "map" ? (
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
                    ) : viewMode === "historia" ? (
                        <motion.div
                            key="historia"
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
                    ) : viewMode === "noticias" ? (
                        <motion.div
                            key="noticias"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="relative z-10 w-full bg-transparent"
                        >
                            <div className="container mx-auto px-6 py-6 pb-20">
                                <Suspense fallback={<GuiaLoadingState />}>
                                    <NoticiasTab />
                                </Suspense>
                            </div>
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
                isActive ? "text-black" : "text-white/40 hover:text-white"
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
