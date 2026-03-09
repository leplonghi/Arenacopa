import { useState, lazy, Suspense, useEffect } from "react";
import { useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { CalendarioTab } from "@/components/copa/CalendarioTab";
import { GruposTab } from "@/components/copa/GruposTab";
import { ChavesTab } from "@/components/copa/ChavesTab";
import { SimulacaoTab } from "@/components/copa/SimulacaoTab";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { Loader2, Map } from "lucide-react";

// ✅ Lazy-load MapaTab: Leaflet is ~1MB and only needed when user opens the tab
const MapaTab = lazy(() =>
  import("@/components/copa/MapaTab").then(m => ({ default: m.MapaTab }))
);

type CopaTab = "calendario" | "grupos" | "chaves" | "simulacao" | "mapa";

const tabLabels: Record<CopaTab, string> = {
  calendario: "Calendário",
  grupos: "Grupos",
  chaves: "Chaves",
  simulacao: "Simulação",
  mapa: "Mapa",
};

function MapaFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Map className="w-10 h-10 animate-pulse" />
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando mapa dos estádios…
      </div>
    </div>
  );
}

const Copa = () => {
  const { subtab } = useParams<{ subtab?: string }>();
  const [tab, setTab] = useState<CopaTab>(() => {
    const valid: CopaTab[] = ["calendario", "grupos", "chaves", "simulacao", "mapa"];
    return valid.includes(subtab as CopaTab) ? (subtab as CopaTab) : "calendario";
  });

  // Sync tab if user navigates directly via URL
  useEffect(() => {
    const valid: CopaTab[] = ["calendario", "grupos", "chaves", "simulacao", "mapa"];
    if (subtab && valid.includes(subtab as CopaTab)) {
      setTab(subtab as CopaTab);
    }
  }, [subtab]);

  return (
    <SimulacaoProvider>
      <div>
        {/* Tab bar */}
        <div
          className="flex gap-2 px-4 py-3 scrollbar-hide sticky top-0 z-20 backdrop-blur-xl overflow-x-auto"
          style={{ background: "rgba(5, 20, 16, 0.95)" }}
        >
          {(["calendario", "grupos", "chaves", "simulacao", "mapa"] as CopaTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 relative",
                tab === t ? "text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {tab === t && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tabLabels[t]}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 pt-2 pb-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              variants={tabContentVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {tab === "calendario" && <CalendarioTab />}
              {tab === "grupos" && <GruposTab />}
              {tab === "chaves" && <ChavesTab />}
              {tab === "simulacao" && <SimulacaoTab />}
              {tab === "mapa" && (
                <Suspense fallback={<MapaFallback />}>
                  <MapaTab />
                </Suspense>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SimulacaoProvider>
  );
};

export default Copa;
