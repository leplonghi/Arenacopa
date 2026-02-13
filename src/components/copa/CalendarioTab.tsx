import { useState, useMemo } from "react";
import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";
import { matches, formatMatchDate } from "@/data/mockData";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarioTab() {
  // Group matches by date
  const matchDays = useMemo(() => {
    const grouped: Record<string, typeof matches> = {};
    matches.forEach(m => {
      const dateKey = m.date.split("T")[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(m);
    });
    // Sort by date
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, dayMatches]) => ({ date, matches: dayMatches }));
  }, []);

  const [dayIndex, setDayIndex] = useState(0);

  const currentDay = matchDays[dayIndex];
  if (!currentDay) {
    return <EmptyState icon="📅" title="Sem jogos" description="Nenhum jogo agendado." />;
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
          className="p-2 rounded-lg bg-secondary disabled:opacity-30 transition-opacity"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Matches */}
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
