import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { CalendarioTab } from "@/components/copa/CalendarioTab";
import { GruposTab } from "@/components/copa/GruposTab";
import { ChavesTab } from "@/components/copa/ChavesTab";
import { MapaTab } from "@/components/copa/MapaTab";

type CopaTab = "calendario" | "grupos" | "chaves" | "mapa";

const Copa = () => {
  const [tab, setTab] = useState<CopaTab>("calendario");

  return (
    <div>
      <div className="flex gap-2 px-4 py-3 scrollbar-hide sticky top-14 z-20 backdrop-blur-md" style={{ background: 'rgba(5, 20, 16, 0.9)' }}>
        {(["calendario", "grupos", "chaves", "mapa"] as CopaTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 relative",
              tab === t
                ? "text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {tab === t && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {t === "calendario" ? "Calendário" : t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
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
            {tab === "mapa" && <MapaTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Copa;
