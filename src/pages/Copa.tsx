import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { LayoutGrid, CalendarDays, Trophy, GitBranch, Calculator, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

const CalendarioTab = lazy(() => import("@/components/copa/CalendarioTab").then((module) => ({ default: module.CalendarioTab })));
const GruposTab = lazy(() => import("@/components/copa/GruposTab").then((module) => ({ default: module.GruposTab })));
const ChavesTab = lazy(() => import("@/components/copa/ChavesTab").then((module) => ({ default: module.ChavesTab })));
const SimulacaoTab = lazy(() => import("@/components/copa/SimulacaoTab").then((module) => ({ default: module.SimulacaoTab })));
const CopaOverview = lazy(() => import("@/components/copa/CopaOverview").then((module) => ({ default: module.CopaOverview })));
type CopaTab = "overview" | "calendario" | "grupos" | "chaves" | "simulacao";
const VALID_TABS: CopaTab[] = ["overview", "calendario", "grupos", "chaves", "simulacao"];


const TabLoadingState = ({ label }: { label?: string }) => (
  <div className="surface-card rounded-[28px] p-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
    {label ?? "Carregando..."}
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

  const tabs: { id: CopaTab; label: string; icon: React.ReactNode; highlight?: boolean }[] = [
    { id: "overview",   label: t('tabs.overview'),   icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "simulacao",  label: t('tabs.simulacao'),  icon: <Sparkles className="w-4 h-4" />, highlight: true },
    { id: "calendario", label: t('tabs.calendario'), icon: <CalendarDays className="w-4 h-4" /> },
    { id: "grupos",     label: t('tabs.grupos'),     icon: <Trophy className="w-4 h-4" /> },
    { id: "chaves",     label: t('tabs.chaves'),     icon: <GitBranch className="w-4 h-4" /> },
  ];

  return (
    <SimulacaoProvider>
      <div>
        <div className="sticky top-14 z-20 bg-[#03100a]/60 px-4 py-3 backdrop-blur-xl md:top-16 border-b border-white/[0.1] shadow-lg">
          <div className="grid grid-cols-5 gap-1">
          {tabs.map(tabItem => (
            <button
              key={tabItem.id}
              id={`tab-${tabItem.id}`}
              onClick={() => handleTabChange(tabItem.id)}
              aria-current={tab === tabItem.id ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-[10px] font-bold transition-colors w-full",
                tab === tabItem.id
                  ? "text-primary-foreground min-h-[52px]"
                  : tabItem.highlight
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25 min-h-[52px]"
                    : "bg-secondary text-secondary-foreground min-h-[52px]"
              )}
            >
              {tab === tabItem.id && (
                <motion.div
                  layoutId="activeTab"
                  className={cn(
                    "absolute inset-0 rounded-2xl",
                    tabItem.highlight ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-primary"
                  )}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex flex-col items-center gap-0.5">
                {tabItem.highlight && tab !== tabItem.id && (
                  <>
                    <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-amber-400 pointer-events-none" style={{ animationDuration: '2.5s' }} />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-black text-black shadow-sm shadow-amber-500/50">
                      ✦
                    </span>
                  </>
                )}
                {tabItem.icon}
                <span className="leading-none truncate w-full text-center">{tabItem.label}</span>
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
              <Suspense fallback={<TabLoadingState label={t('tabs.loading')} />}>
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
