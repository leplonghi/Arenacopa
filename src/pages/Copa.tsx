import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { CalendarioTab } from "@/components/copa/CalendarioTab";
import { GruposTab } from "@/components/copa/GruposTab";
import { ChavesTab } from "@/components/copa/ChavesTab";
import { SimulacaoTab } from "@/components/copa/SimulacaoTab";
import { CopaOverview } from "@/components/copa/CopaOverview";
import { NoticiasTab } from "@/components/copa/NoticiasTab";
import { SedesTab } from "@/components/copa/SedesTab";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { LayoutGrid, CalendarDays, Trophy, GitBranch, Calculator, Newspaper, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

type CopaTab = "overview" | "calendario" | "grupos" | "chaves" | "simulacao" | "sedes" | "noticias";

const Copa = () => {
  const { subtab } = useParams<{ subtab?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('copa');
  const [tab, setTab] = useState<CopaTab>((subtab as CopaTab) || "overview");

  useEffect(() => {
    if (subtab && subtab !== tab) {
      setTab(subtab as CopaTab);
    }
  }, [subtab, tab]);

  const handleTabChange = (newTab: CopaTab) => {
    setTab(newTab);
    navigate(newTab === "overview" ? "/copa" : `/copa/${newTab}`);
  };

  const tabs: { id: CopaTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t('tabs.overview'), icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: "calendario", label: t('tabs.calendar'), icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "grupos", label: t('tabs.groups'), icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "chaves", label: t('tabs.bracket'), icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: "simulacao", label: t('tabs.simulator'), icon: <Calculator className="w-3.5 h-3.5" /> },
    { id: "sedes", label: "Sedes", icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: "noticias", label: t('tabs.news'), icon: <Newspaper className="w-3.5 h-3.5" /> },
  ];

  return (
    <SimulacaoProvider>
      <div>
        <div className="flex gap-2 px-4 py-3 scrollbar-hide sticky top-14 md:top-16 z-20 backdrop-blur-xl overflow-x-auto bg-background/95">
          {tabs.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => handleTabChange(t.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 relative flex items-center gap-2",
                tab === t.id
                  ? "text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </div>

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
              {tab === "overview" && <CopaOverview />}
              {tab === "calendario" && <CalendarioTab />}
              {tab === "grupos" && <GruposTab />}
              {tab === "chaves" && <ChavesTab />}
              {tab === "simulacao" && <SimulacaoTab />}
              {tab === "sedes" && <SedesTab />}
              {tab === "noticias" && <NoticiasTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SimulacaoProvider>
  );
};

export default Copa;
