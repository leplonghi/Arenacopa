import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { bracketMatches, getTeam } from "@/data/mockData";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";

export function ChavesTab() {
  const oitavas = bracketMatches.filter(m => m.round === "Oitavas");

  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 text-center">Oitavas de Final</h2>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {oitavas.map(m => {
          const home = m.homeTeam ? getTeam(m.homeTeam) : null;
          const away = m.awayTeam ? getTeam(m.awayTeam) : null;
          const isFavorite = m.homeTeam === "BRA" || m.awayTeam === "BRA";

          return (
            <motion.div
              key={m.id}
              variants={staggerItem}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "glass-card overflow-hidden border-l-2",
                isFavorite ? "border-l-primary" : "border-l-copa-green"
              )}
            >
              <div className={cn(
                "flex items-center gap-3 px-4 py-3",
                isFavorite && "bg-primary/5"
              )}>
                <Flag code={home?.code || ""} size="sm" />
                <span className="text-sm font-bold flex-1">{home?.name || "A definir"}</span>
                {m.homeScore !== undefined && (
                  <span className="text-lg font-black text-primary">{m.homeScore}</span>
                )}
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-border/30">
                <Flag code={away?.code || ""} size="sm" />
                <span className="text-sm font-bold flex-1">{away?.name || "A definir"}</span>
                {m.awayScore !== undefined && (
                  <span className="text-lg font-black">{m.awayScore}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
