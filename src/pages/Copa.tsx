import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { LayoutGrid, CalendarDays, Trophy, GitBranch, Sparkles, ScrollText, MoreHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ArenaPanel, ArenaTabPill } from "@/components/arena/ArenaPrimitives";

const CalendarioTab = lazy(() => import("@/components/copa/CalendarioTab").then((module) => ({ default: module.CalendarioTab })));
const GruposTab = lazy(() => import("@/components/copa/GruposTab").then((module) => ({ default: module.GruposTab })));
const ChavesTab = lazy(() => import("@/components/copa/ChavesTab").then((module) => ({ default: module.ChavesTab })));
const SimulacaoTab = lazy(() => import("@/components/copa/SimulacaoTab").then((module) => ({ default: module.SimulacaoTab })));
const CopaOverview = lazy(() => import("@/components/copa/CopaOverview").then((module) => ({ default: module.CopaOverview })));
const HistoriaTab = lazy(() => import("@/components/copa/HistoriaTab").then((module) => ({ default: module.HistoriaTab })));

type CopaTab = "overview" | "calendario" | "grupos" | "chaves" | "historia" | "simulacao";
const VALID_TABS: CopaTab[] = ["overview", "calendario", "grupos", "chaves", "historia", "simulacao"];

const TabLoadingState = ({ label }: { label?: string }) => (
  <ArenaPanel className="p-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
    {label ?? "Carregando..."}
  </ArenaPanel>
);

const Copa = () => {
  const { subtab } = useParams<{ subtab?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('copa');

  const initialTab = VALID_TABS.includes((subtab as CopaTab) || "overview")
    ? ((subtab as CopaTab) || "overview")
    : "overview";

  const [tab, setTab] = useState<CopaTab>(initialTab);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!subtab) {
      if (tab !== "overview") setTab("overview");
      return;
    }
    if (!VALID_TABS.includes(subtab as CopaTab)) {
      navigate("/copa", { replace: true });
      return;
    }
    if (subtab !== tab) setTab(subtab as CopaTab);
  }, [navigate, subtab, tab]);

  const handleTabChange = (newTab: CopaTab) => {
    setTab(newTab);
    setMoreOpen(false);
    navigate(newTab === "overview" ? "/copa" : `/copa/${newTab}`);
  };

  // Primary tabs stay visible; the two secondary ones (História, Simulação)
  // collapse behind a "Mais" toggle to reduce nav weight from 6 → 4 + overflow.
  const primaryTabs: { id: CopaTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",   label: t('tabs.overview'),   icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "calendario", label: t('tabs.calendario'), icon: <CalendarDays className="w-4 h-4" /> },
    { id: "grupos",     label: t('tabs.grupos'),     icon: <Trophy className="w-4 h-4" /> },
    { id: "chaves",     label: t('tabs.chaves'),     icon: <GitBranch className="w-4 h-4" /> },
  ];
  const secondaryTabs: { id: CopaTab; label: string; icon: React.ReactNode; highlight?: boolean }[] = [
    { id: "historia",   label: t('tabs.history'),    icon: <ScrollText className="w-4 h-4" /> },
    { id: "simulacao",  label: t('tabs.simulacao'),  icon: <Sparkles className="w-4 h-4" />, highlight: true },
  ];
  const isSecondaryActive = secondaryTabs.some((tabItem) => tabItem.id === tab);

  return (
    <SimulacaoProvider>
      <div className="arena-screen pb-24">
        <div className="sticky top-[calc(3.5rem+var(--safe-area-top,0px))] z-20 bg-[#05110b]/85 pb-3 pt-1 backdrop-blur-xl md:top-16">
          <ArenaPanel className="p-2 sm:p-3">
            <div className="grid grid-cols-5 gap-2">
              {primaryTabs.map((tabItem) => {
                const isActive = tab === tabItem.id;
                return (
                  <button
                    key={tabItem.id}
                    id={`tab-${tabItem.id}`}
                    onClick={() => handleTabChange(tabItem.id)}
                    aria-current={isActive ? "page" : undefined}
                    className="text-left"
                  >
                    <ArenaTabPill
                      active={isActive}
                      className={cn(
                        "relative flex min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 transition-all duration-200",
                        !isActive && "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <span className={cn("transition-transform duration-200", isActive && "scale-110")}>
                        {tabItem.icon}
                      </span>
                      <span className="text-[10px] font-bold leading-none whitespace-nowrap">
                        {tabItem.label}
                      </span>
                    </ArenaTabPill>
                  </button>
                );
              })}

              {/* Overflow toggle for secondary tabs */}
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                aria-label={t('tabs.more', { defaultValue: 'Mais' })}
                className="text-left"
              >
                <ArenaTabPill
                  active={isSecondaryActive}
                  className={cn(
                    "relative flex min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-[22px] px-1 py-2 transition-all duration-200",
                    !isSecondaryActive && "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {!isSecondaryActive && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black shadow-[0_0_12px_rgba(255,193,7,0.45)]">
                      ✦
                    </span>
                  )}
                  <span className={cn("transition-transform duration-200", (moreOpen || isSecondaryActive) && "scale-110")}>
                    <MoreHorizontal className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold leading-none whitespace-nowrap">
                    {t('tabs.more', { defaultValue: 'Mais' })}
                  </span>
                </ArenaTabPill>
              </button>
            </div>

            <AnimatePresence>
              {(moreOpen || isSecondaryActive) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {secondaryTabs.map((tabItem) => {
                      const isActive = tab === tabItem.id;
                      return (
                        <button
                          key={tabItem.id}
                          id={`tab-${tabItem.id}`}
                          onClick={() => handleTabChange(tabItem.id)}
                          aria-current={isActive ? "page" : undefined}
                          className="text-left"
                        >
                          <ArenaTabPill
                            active={isActive}
                            className={cn(
                              "relative flex min-h-[52px] w-full flex-row items-center justify-center gap-2 rounded-[18px] px-2 py-2 transition-all duration-200",
                              !isActive && tabItem.highlight && "border-amber-400/25 bg-amber-500/10 text-amber-300 hover:bg-amber-500/18",
                              !isActive && !tabItem.highlight && "hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                            )}
                          >
                            {tabItem.icon}
                            <span className="text-[11px] font-bold leading-none whitespace-nowrap">
                              {tabItem.label}
                            </span>
                          </ArenaTabPill>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </ArenaPanel>
        </div>

        <div className="pt-2 pb-4">
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
                {tab === "overview"   && <CopaOverview />}
                {tab === "calendario" && <CalendarioTab />}
                {tab === "grupos"     && <GruposTab />}
                {tab === "chaves"     && <ChavesTab />}
                {tab === "historia"   && <HistoriaTab />}
                {tab === "simulacao"  && <SimulacaoTab />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SimulacaoProvider>
  );
};

export default Copa;
