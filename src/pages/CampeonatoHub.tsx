import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  BarChart3,
  Newspaper,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tabContentVariants } from "@/components/copa/animations";

// Hook & Components
import { useChampionshipHub, HubTab } from "@/features/championships/hooks/useChampionshipHub";
import { ChampionshipHubHeader } from "@/features/championships/components/ChampionshipHubHeader";
import { JogosTab } from "@/features/championships/components/tabs/JogosTab";
import { ClassificacaoTab } from "@/features/championships/components/tabs/ClassificacaoTab";
import { NoticiasTab } from "@/features/championships/components/tabs/NoticiasTab";
import { BolõesTab } from "@/features/championships/components/tabs/BolõesTab";

export default function CampeonatoHub() {
  const {
    championship, tab, setTab, t, navigate, statusLabel, statusColor, formatLabel,
    countdownDays, timelineLabel, color
  } = useChampionshipHub();

  if (!championship) {
    return (
      <div className="min-h-screen bg-background px-4 pt-24 pb-32 text-white">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
            <AlertTriangle className="h-7 w-7 text-amber-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight">
              {t("championships:hub.not_found_title", { defaultValue: "Campeonato não encontrado" })}
            </h2>
            <p className="text-sm leading-relaxed text-white/60">
              {t("championships:hub.not_found_desc", { defaultValue: "Esse link não está mais disponível ou o campeonato ainda não foi publicado nesta área." })}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/campeonatos", { replace: true })}
              className="flex-1 rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-black"
            >
              {t("championships:hub.not_found_cta", { defaultValue: "Ver campeonatos" })}
            </button>
            <button
              onClick={() => navigate("/", { replace: true })}
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white"
            >
              {t("common:common.back")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (championship.id === "wc2026") return null;

  const tabs: { id: HubTab; label: string; icon: React.ReactNode }[] = [
    { id: "jogos",         label: t("championships:hub.tabs.games", { defaultValue: "Jogos" }), icon: <CalendarDays className="w-4 h-4" /> },
    { id: "classificacao", label: t("championships:hub.tabs.table", { defaultValue: "Tabela" }), icon: <BarChart3 className="w-4 h-4" /> },
    { id: "noticias",      label: t("championships:hub.tabs.news", { defaultValue: "Notícias" }), icon: <Newspaper className="w-4 h-4" /> },
    { id: "boloes",        label: t("championships:hub.tabs.pools", { defaultValue: "Bolões" }), icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="arena-screen pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-0">
        <ChampionshipHubHeader
          championship={championship} onBack={() => navigate("/campeonatos")} onSetTab={setTab}
          statusLabel={statusLabel} statusColor={statusColor} formatLabel={formatLabel}
          countdownDays={countdownDays} timelineLabel={timelineLabel}
        />

        <div
          className="sticky z-10 -mx-4 border-y border-white/[0.06] bg-[#050505]/90 px-4 py-2 backdrop-blur-xl sm:-mx-0 sm:mt-5 sm:rounded-2xl sm:border sm:border-white/[0.08]"
          style={{ top: "calc(4.6rem + var(--safe-area-top, 0px))" }}
        >
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {tabs.map((tabItem) => {
              const isActive = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  onClick={() => setTab(tabItem.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all sm:gap-2 sm:px-4 sm:py-3 sm:text-xs",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300",
                  )}
                >
                  <span className={cn("transition-transform duration-200", isActive && "scale-110")}>
                    {tabItem.icon}
                  </span>
                  <span className="hidden sm:inline">{tabItem.label}</span>
                  <span className="sm:hidden">
                    {tabItem.id === "classificacao" ? "Tab." : tabItem.id === "noticias" ? "Not." : tabItem.label}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-primary sm:w-8" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 pb-4">
          <AnimatePresence mode="wait">
            <motion.div key={tab} variants={tabContentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeInOut" }}>
              <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
                {tab === "jogos"         && <JogosTab         championshipId={championship.id} color={color} />}
                {tab === "classificacao" && <ClassificacaoTab championshipId={championship.id} color={color} />}
                {tab === "noticias"      && <NoticiasTab      championshipId={championship.id} color={color} />}
                {tab === "boloes"        && <BolõesTab        championshipId={championship.id} championship={championship} color={color} />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
