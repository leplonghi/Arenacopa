import { useState, useMemo, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { MatchCard } from "@/components/MatchCard";
import { type Match } from "@/data/mockData";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MatchDetailsModal } from "./MatchDetailsModal";
import { useMatches } from "@/hooks/useMatches";
import { useTranslation } from "react-i18next";

// Copa 2026 opening match: June 11, 2026 21:00 UTC-3 (00:00 UTC June 12)
const COPA_START = new Date("2026-06-12T00:00:00Z");

function CopaCounting() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = COPA_START.getTime() - Date.now();
    return Math.max(0, diff);
  });

  useEffect(() => {
    const id = setInterval(() => {
      const diff = COPA_START.getTime() - Date.now();
      setTimeLeft(Math.max(0, diff));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const days    = Math.floor(timeLeft / 86400000);
  const hours   = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-8">
      <div className="flex flex-col items-center gap-2">
        <span className="text-5xl">⚽</span>
        <h2 className="text-xl font-black uppercase tracking-tight text-white text-center">
          Copa do Mundo 2026
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          O calendário será publicado em breve. A contagem regressiva para o apito inicial:
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { value: days,    label: "dias"    },
          { value: hours,   label: "horas"   },
          { value: minutes, label: "min"     },
          { value: seconds, label: "seg"     },
        ].map(({ value, label }) => (
          <motion.div
            key={label}
            className="flex flex-col items-center gap-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3 min-w-[64px]"
          >
            <motion.span
              key={value}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-2xl font-black text-primary tabular-nums"
            >
              {label === "dias" ? String(value) : pad(value)}
            </motion.span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center">
        Estreia: 11 de junho de 2026 · Estádio Azteca, Cidade do México
      </p>
    </div>
  );
}

export function CalendarioTab() {
  const { t } = useTranslation('copa');
  const { data: matchesData = [], isLoading } = useMatches();

  // Group matches by date
  const matchDays = useMemo(() => {
    if (!matchesData.length) return [];
    const grouped: Record<string, Match[]> = {};
    matchesData.forEach(m => {
      const dateKey = m.date.split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(m);
    });
    // Sort by date
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayMatches]) => ({ date, matches: dayMatches }));
  }, [matchesData]);

  const [dayIndex, setDayIndex] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'x',
    startIndex: dayIndex,
    loop: false,
    dragFree: false
  });

  useEffect(() => {
    if (emblaApi) emblaApi.scrollTo(dayIndex);
  }, [dayIndex, emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setDayIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentDay = matchDays[dayIndex];
  if (!currentDay) {
    return <CopaCounting />;
  }

  const dateObj = new Date(currentDay.date + "T12:00:00");
  const dateLabel = dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDayIndex(Math.max(0, dayIndex - 1))}
          disabled={dayIndex === 0}
          aria-label={t('calendario.prev_day')}
          className="p-2 rounded-lg bg-secondary disabled:opacity-30 transition-opacity"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <motion.div
          key={dayIndex}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-base font-black capitalize">{dateLabel}</h2>
          <span className="text-[10px] font-bold text-muted-foreground">
            {currentDay.matches.length} {currentDay.matches.length === 1 ? "jogo" : "jogos"} • Dia {dayIndex + 1}/{matchDays.length}
          </span>
        </motion.div>
        <button
          onClick={() => setDayIndex(Math.min(matchDays.length - 1, dayIndex + 1))}
          disabled={dayIndex === matchDays.length - 1}
          aria-label={t('calendario.next_day')}
          className="p-2 rounded-lg bg-secondary disabled:opacity-30 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Matches Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {matchDays.map((day, dIdx) => (
            <div key={day.date} className="min-w-0 flex-[0_0_100%] pr-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 pb-2"
              >
                {day.matches.map((m, i) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    index={i}
                    onClick={() => setSelectedMatch(m)}
                  />
                ))}
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <MatchDetailsModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
