import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { LayoutGrid, CalendarDays, Trophy, GitBranch, Calculator } from "lucide-react";
import { useTranslation } from "react-i18next";

const CalendarioTab = lazy(() => import("@/components/copa/CalendarioTab").then((module) => ({ default: module.CalendarioTab })));
const GruposTab = lazy(() => import("@/components/copa/GruposTab").then((module) => ({ default: module.GruposTab })));
const ChavesTab = lazy(() => import("@/components/copa/ChavesTab").then((module) => ({ default: module.ChavesTab })));
const SimulacaoTab = lazy(() => import("@/components/copa/SimulacaoTab").then((module) => ({ default: module.SimulacaoTab })));
const CopaOverview = lazy(() => import("@/components/copa/CopaOverview").then((module) => ({ default: module.CopaOverview })));
type CopaTab = "overview" | "calendario" | "grupos" | "chaves" | "simulacao";
const VALID_TABS: CopaTab[] = ["overview", "calendario", "grupos", "chaves", "simulacao"];

const TabLoadingState = () => (
  <div className="surface-card rounded-[28px] p-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
    Loading...
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
  ];

  return (
    <SimulacaoProvider>
      <div>
        <div className="sticky top-14 z-20 bg-background/95 px-4 py-3 backdrop-blur-xl md:top-16">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {tabs.map(t => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              onClick={() => handleTabChange(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "relative flex min-h-[46px] items-center justify-center gap-2 rounded-2xl px-4 py-2 text-center text-[11px] font-bold transition-colors",
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

              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SimulacaoProvider>
  );
};

export default Copa;
