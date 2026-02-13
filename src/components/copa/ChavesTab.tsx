import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { getTeam, groups } from "@/data/mockData";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { useSimulacao } from "@/contexts/SimulacaoContext";
import { Trophy, ArrowRight } from "lucide-react";

// FIFA 2026 Round of 32 matchups: 1st vs 2nd crossover between groups
const r32Matchups: [string, number, string, number][] = [
  // [groupHome, posHome, groupAway, posAway]
  ["A", 0, "B", 1],
  ["B", 0, "A", 1],
  ["C", 0, "D", 1],
  ["D", 0, "C", 1],
  ["E", 0, "F", 1],
  ["F", 0, "E", 1],
  ["G", 0, "H", 1],
  ["H", 0, "G", 1],
  ["I", 0, "J", 1],
  ["J", 0, "I", 1],
  ["K", 0, "L", 1],
  ["L", 0, "K", 1],
];

interface R32Match {
  homeCode: string | null;
  homeLabel: string;
  awayCode: string | null;
  awayLabel: string;
}

export function ChavesTab() {
  const { standings, filledCount } = useSimulacao();

  const hasSimData = filledCount > 0;

  const r32 = useMemo<R32Match[]>(() => {
    return r32Matchups.map(([gH, pH, gA, pA]) => {
      const homeStandings = standings[gH];
      const awayStandings = standings[gA];
      const homeHasData = homeStandings?.some(s => s.played > 0);
      const awayHasData = awayStandings?.some(s => s.played > 0);

      return {
        homeCode: homeHasData ? homeStandings[pH]?.teamCode : null,
        homeLabel: `${pH + 1}º Grupo ${gH}`,
        awayCode: awayHasData ? awayStandings[pA]?.teamCode : null,
        awayLabel: `${pA + 1}º Grupo ${gA}`,
      };
    });
  }, [standings]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black">Chaves</h2>
        <p className="text-[11px] text-muted-foreground">
          {hasSimData
            ? "Baseado na sua simulação"
            : "Preencha placares na aba Simulação para ver os confrontos"}
        </p>
      </div>

      <div className="text-sm font-black uppercase tracking-widest text-muted-foreground text-center">
        Oitavas de Final
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {r32.map((m, idx) => {
          const home = m.homeCode ? getTeam(m.homeCode) : null;
          const away = m.awayCode ? getTeam(m.awayCode) : null;
          const isBrasil = m.homeCode === "BRA" || m.awayCode === "BRA";

          return (
            <motion.div
              key={idx}
              variants={staggerItem}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "glass-card overflow-hidden border-l-2",
                isBrasil ? "border-l-primary" : "border-l-copa-green"
              )}
            >
              {/* Home team */}
              <div className={cn(
                "flex items-center gap-3 px-4 py-3",
                isBrasil && m.homeCode === "BRA" && "bg-primary/5"
              )}>
                {home ? (
                  <>
                    <Flag code={home.code} size="sm" />
                    <span className="text-sm font-bold flex-1">{home.name}</span>
                    {home.code === "BRA" && <Trophy className="w-3.5 h-3.5 text-primary" />}
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-secondary border border-dashed border-border/50" />
                    <span className="text-sm font-medium text-muted-foreground flex-1">{m.homeLabel}</span>
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center px-4">
                <div className="flex-1 border-t border-border/30" />
                <span className="text-[9px] font-bold text-muted-foreground px-2 uppercase">vs</span>
                <div className="flex-1 border-t border-border/30" />
              </div>

              {/* Away team */}
              <div className={cn(
                "flex items-center gap-3 px-4 py-3",
                isBrasil && m.awayCode === "BRA" && "bg-primary/5"
              )}>
                {away ? (
                  <>
                    <Flag code={away.code} size="sm" />
                    <span className="text-sm font-bold flex-1">{away.name}</span>
                    {away.code === "BRA" && <Trophy className="w-3.5 h-3.5 text-primary" />}
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-secondary border border-dashed border-border/50" />
                    <span className="text-sm font-medium text-muted-foreground flex-1">{m.awayLabel}</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
