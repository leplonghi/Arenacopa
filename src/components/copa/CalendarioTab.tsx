import { MatchCard } from "@/components/MatchCard";
import { EmptyState } from "@/components/EmptyState";
import { getTodayMatches, getTomorrowMatches } from "@/data/mockData";
import { motion } from "framer-motion";

export function CalendarioTab() {
  const todayMatches = getTodayMatches();
  const tomorrowMatches = getTomorrowMatches();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="space-y-6">
      <section>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-3"
        >
          <h2 className="text-lg font-black">
            Hoje, {today.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
            {todayMatches.length} Jogos
          </span>
        </motion.div>
        {todayMatches.length === 0 ? (
          <EmptyState icon="📅" title="Sem jogos hoje" description="Nenhum jogo agendado para hoje." />
        ) : (
          <div className="space-y-3">
            {todayMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
          </div>
        )}
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-3"
        >
          <h2 className="text-lg font-black">
            Amanhã, {tomorrow.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
            {tomorrowMatches.length} Jogos
          </span>
        </motion.div>
        {tomorrowMatches.length === 0 ? (
          <EmptyState icon="📅" title="Sem jogos amanhã" description="Nenhum jogo agendado." />
        ) : (
          <div className="space-y-3">
            {tomorrowMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i + todayMatches.length} />)}
          </div>
        )}
      </section>
    </div>
  );
}
