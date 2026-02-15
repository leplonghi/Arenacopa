import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { groups, groupStandings, getTeam } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import { useSimulacao } from "@/contexts/SimulacaoContext";
import { Trophy } from "lucide-react";
import { GroupDetails } from "./GroupDetails";

export function GruposTab() {
  const { t } = useTranslation('copa');
  const [viewMode, setViewMode] = useState<"real" | "simulacao">("real");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const { standings: simStandings, filledCount } = useSimulacao();
  const navigate = useNavigate();

  return (
    <>
      <AnimatePresence>
        {selectedGroup && (
          <GroupDetails
            groupId={selectedGroup}
            onClose={() => setSelectedGroup(null)}
            viewMode={viewMode}
          />
        )}
      </AnimatePresence>

      <div>
        <div className="flex rounded-full bg-secondary p-1 mb-5">
          {(["real", "simulacao"] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={cn(
                "flex-1 py-2 rounded-full text-xs font-bold transition-colors relative",
                viewMode === m ? "text-primary-foreground" : "text-muted-foreground"
              )}
            >
              {viewMode === m && (
                <motion.div
                  layoutId="gruposToggle"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t(`groups.mode.${m}`)}</span>
            </button>
          ))}
        </div>

        {viewMode === "simulacao" && filledCount === 0 && (
          <div className="glass-card p-4 mb-4 text-center">
            <span className="text-2xl mb-2 block">📊</span>
            <p className="text-xs text-muted-foreground">
              <Trans i18nKey="groups.simulation_hint" t={t} components={{ 1: <span className="text-primary font-bold" /> }} />
            </p>
          </div>
        )}

        <motion.div
          key={viewMode}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-5 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5"
        >
          {groups.map(g => {
            const useSimData = viewMode === "simulacao" && simStandings[g]?.some(s => s.played > 0);
            const realStandings = groupStandings[g] || [];

            const displayStandings = useSimData
              ? simStandings[g].map(s => ({
                teamCode: s.teamCode,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                goalsFor: s.gf,
                goalsAgainst: s.ga,
                points: s.points,
                probability: 0,
              }))
              : realStandings;

            const status = useSimData
              ? "simulated"
              : displayStandings.some(s => s.played > 0) ? "in_progress" : "pending";

            return (
              <motion.div
                key={g}
                variants={staggerItem}
                onClick={() => setSelectedGroup(g)}
                className="glass-card overflow-hidden border-l-2 border-l-copa-green cursor-pointer transition-all hover:bg-white/5 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between p-4 pb-2">
                  <h3 className="text-base font-black">{t('match_details.group_label', { group: g })}</h3>
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full",
                    status === "simulated" ? "bg-primary/20 text-primary" :
                      status === "in_progress" ? "bg-copa-success/20 text-copa-success" :
                        "bg-secondary text-secondary-foreground"
                  )}>
                    {t(`groups.status.${status}`)}
                  </span>
                </div>

                <div className="grid grid-cols-[auto_1fr_32px_32px_auto] md:grid-cols-[auto_1fr_48px_48px_auto] gap-x-2 px-4 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary">
                  <span></span>
                  <span>{t('groups.table.country')}</span>
                  <span className="text-center">{t('groups.table.p')}</span>
                  <span className="text-center">{t('groups.table.gd')}</span>
                  {viewMode === "real" ? (
                    <span className="text-right">{t('groups.table.prob')}</span>
                  ) : (
                    <span className="text-right">{t('groups.table.j')}</span>
                  )}
                </div>

                {displayStandings.map((s, i) => {
                  const team = getTeam(s.teamCode);
                  const gd = s.goalsFor - s.goalsAgainst;
                  const qualifies = i < 2;
                  return (
                    <div
                      key={s.teamCode}
                      className={cn(
                        "grid grid-cols-[auto_1fr_32px_32px_auto] md:grid-cols-[auto_1fr_48px_48px_auto] gap-x-2 items-center px-4 py-2.5",
                        qualifies ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <span className="text-xs font-medium w-4">
                        {qualifies ? <Trophy className="w-3 h-3 text-copa-success inline" /> : (i + 1)}
                      </span>
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/team/${team.code}`);
                        }}
                      >
                        <Flag code={team.code} size="sm" />
                        <span className={cn("text-sm", qualifies ? "font-bold" : "font-medium")}>{team.name}</span>
                      </div>
                      <span className={cn("text-center text-sm", qualifies && "font-black")}>{s.points}</span>
                      <span className="text-center text-sm">{gd >= 0 ? `+${gd}` : gd}</span>
                      {viewMode === "real" ? (
                        <div className="flex items-center gap-1.5 justify-end min-w-[60px]">
                          <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full",
                                s.probability >= 60 ? "bg-copa-success" :
                                  s.probability >= 30 ? "bg-primary" : "bg-copa-live"
                              )}
                              style={{ width: `${s.probability}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-right text-sm min-w-[60px]">{s.played}</span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </>
  );
}
