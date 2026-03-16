import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { LayoutGrid, CalendarDays, Trophy, GitBranch, Calculator, Newspaper, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const CalendarioTab = lazy(() => import("@/components/copa/CalendarioTab").then((module) => ({ default: module.CalendarioTab })));
const GruposTab = lazy(() => import("@/components/copa/GruposTab").then((module) => ({ default: module.GruposTab })));
const ChavesTab = lazy(() => import("@/components/copa/ChavesTab").then((module) => ({ default: module.ChavesTab })));
const SimulacaoTab = lazy(() => import("@/components/copa/SimulacaoTab").then((module) => ({ default: module.SimulacaoTab })));
const CopaOverview = lazy(() => import("@/components/copa/CopaOverview").then((module) => ({ default: module.CopaOverview })));
const NoticiasTab = lazy(() => import("@/components/copa/NoticiasTab").then((module) => ({ default: module.NoticiasTab })));
const SedesTab = lazy(() => import("@/components/copa/SedesTab").then((module) => ({ default: module.SedesTab })));

type CopaTab = "overview" | "calendario" | "grupos" | "chaves" | "simulacao" | "sedes" | "noticias";
const VALID_TABS: CopaTab[] = ["overview", "calendario", "grupos", "chaves", "simulacao", "sedes", "noticias"];

const TabLoadingState = () => (
  <div className="surface-card rounded-[28px] p-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
    Carregando painel...
  </div>
);

const Copa = () => {
  const { subtab } = useParams<{ subtab?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('copa');
  const initialTab = VALID_TABS.includes((subtab as CopaTab) || "overview")
    ? ((subtab as CopaTab) || "overview")
    : "overview";
  const [tab, setTab] = useState<CopaTab>(initialTab);

  useEffect(() => {
    if (!subtab) {
      if (tab !== "overview") {
        setTab("overview");
      }
      return;
    }

    if (!VALID_TABS.includes(subtab as CopaTab)) {
      navigate("/copa", { replace: true });
      return;
    }

    if (subtab !== tab) {
      setTab(subtab as CopaTab);
    }
  }, [navigate, subtab, tab]);

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
              aria-current={tab === t.id ? "page" : undefined}
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
              <Suspense fallback={<TabLoadingState />}>
                {tab === "overview" && <CopaOverview />}
                {tab === "calendario" && <CalendarioTab />}
                {tab === "grupos" && <GruposTab />}
                {tab === "chaves" && <ChavesTab />}
                {tab === "simulacao" && <SimulacaoTab />}
                {tab === "sedes" && <SedesTab />}
                {tab === "noticias" && <NoticiasTab />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SimulacaoProvider>
  );
};

export default Copa;
