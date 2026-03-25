import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { tabContentVariants } from "@/components/copa/animations";
import { SimulacaoProvider } from "@/contexts/SimulacaoContext";
import { LayoutGrid, CalendarDays, Trophy, GitBranch, Sparkles } from "lucide-react";
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
        {/* Scrollable pill-style tab bar — no overlap */}
        <div className="sticky top-[calc(3.5rem+var(--safe-area-top,0px))] z-20 bg-[#03100a]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.5)] md:top-16">
          <div
            className="flex items-center gap-2 overflow-x-auto px-3 py-2.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tabs.map((tabItem) => {
              const isActive = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  id={`tab-${tabItem.id}`}
                  onClick={() => handleTabChange(tabItem.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200",
                    "min-w-[56px] px-3 py-2",
                    isActive
                      ? "text-primary-foreground"
                      : tabItem.highlight
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
                        : "bg-white/[0.05] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.1] hover:text-zinc-200"
                  )}
                >
                  {/* Active background with glow */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className={cn(
                        "absolute inset-0 rounded-2xl",
                        tabItem.highlight
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-[0_0_16px_rgba(245,158,11,0.5)]"
                          : "bg-gradient-to-br from-primary to-primary/70 shadow-[0_0_16px_rgba(34,197,94,0.35)]"
                      )}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Pulse ring for highlight tab */}
                  {tabItem.highlight && !isActive && (
                    <>
                      <span
                        className="absolute inset-0 rounded-2xl animate-ping opacity-10 bg-amber-400 pointer-events-none"
                        style={{ animationDuration: "2.8s" }}
                      />
                      <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[7px] font-black text-black shadow-sm shadow-amber-500/50">
                        ✦
                      </span>
                    </>
                  )}

                  {/* Icon */}
                  <span className={cn("relative z-10 transition-transform duration-200", isActive && "scale-110")}>
                    {tabItem.icon}
                  </span>

                  {/* Label — always visible, never clipped */}
                  <span className="relative z-10 text-[10px] font-bold leading-none whitespace-nowrap">
                    {tabItem.label}
                  </span>
                </button>
              );
            })}
          </div>
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
              <Suspense fallback={<TabLoadingState label={t('tabs.loading')} />}>
                {tab === "overview"   && <CopaOverview />}
                {tab === "calendario" && <CalendarioTab />}
                {tab === "grupos"     && <GruposTab />}
                {tab === "chaves"     && <ChavesTab />}
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
