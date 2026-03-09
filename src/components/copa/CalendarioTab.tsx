import { useState, useMemo } from "react";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";
import { matches, formatMatchDate } from "@/data/mockData";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function CalendarioTab() {
  // Group all matches by date
  const matchDays = useMemo(() => {
    const grouped: Record<string, typeof matches> = {};
    matches.forEach(m => {
      const dateKey = m.date.split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(m);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayMatches]) => ({ date, matches: dayMatches }));
  }, []);

  // ✅ Fixed: start at today's matchday or the nearest future date
  const initialIndex = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    // Find today's matches
    const todayIdx = matchDays.findIndex(d => d.date === today);
    if (todayIdx !== -1) return todayIdx;
    // Find the next upcoming matchday
    const futureIdx = matchDays.findIndex(d => d.date > today);
    if (futureIdx !== -1) return futureIdx;
    // Copa hasn't started and no future dates — default to first day
    return 0;
  }, [matchDays]);

  const [dayIndex, setDayIndex] = useState(initialIndex);

  const currentDay = matchDays[dayIndex];
  if (!currentDay) {
    return <EmptyState icon="📅" title="Sem jogos" description="Nenhum jogo agendado." />;
  }

  const dateObj = new Date(currentDay.date + "T12:00:00");
  const today = new Date().toISOString().split("T")[0];
  const isToday = currentDay.date === today;
  const isFuture = currentDay.date > today;

  const dateLabel = dateObj.toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setDayIndex(Math.max(0, dayIndex - 1))}
          disabled={dayIndex === 0}
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
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-base font-black capitalize">{dateLabel}</h2>
            {isToday && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-copa-live text-white font-black uppercase">Hoje</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-muted-foreground">
            <CalendarDays className="w-3 h-3" />
            <span>{currentDay.matches.length} {currentDay.matches.length === 1 ? "jogo" : "jogos"} · Dia {dayIndex + 1}/{matchDays.length}</span>
          </div>
        </motion.div>

        <button
          onClick={() => setDayIndex(Math.min(matchDays.length - 1, dayIndex + 1))}
          disabled={dayIndex === matchDays.length - 1}
          className="p-2 rounded-lg bg-secondary disabled:opacity-30 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick jump to today / first match */}
      {!isToday && dayIndex !== initialIndex && (
        <button
          onClick={() => setDayIndex(initialIndex)}
          className="w-full text-[10px] font-bold text-primary py-1.5 rounded-lg bg-primary/10 border border-primary/20"
        >
          {isFuture ? "Ir para o próximo jogo" : "Ir para hoje"}
        </button>
      )}

      {/* Match list */}
      <motion.div
        key={dayIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3"
      >
        {currentDay.matches.map((m, i) => (
          <MatchCard key={m.id} match={m} index={i} />
        ))}
      </motion.div>
    </div>
  );
}
