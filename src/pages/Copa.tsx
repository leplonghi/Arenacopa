import { useState } from "react";
import { cn } from "@/lib/utils";
import { MatchCard } from "@/components/MatchCard";
import { FilterSheet, FilterChips } from "@/components/FilterSheet";
import { EmptyState } from "@/components/EmptyState";
import {
  matches, groups, groupStandings, getGroupTeams, getTeam,
  bracketMatches, stadiums, getTodayMatches, getTomorrowMatches,
  formatMatchDate, type Match, type Stadium,
} from "@/data/mockData";
import { Filter, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

type CopaTab = "calendario" | "grupos" | "chaves" | "mapa";

const Copa = () => {
  const [tab, setTab] = useState<CopaTab>("calendario");

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex border-b border-border px-1 sticky top-14 z-20 bg-background/95 backdrop-blur-md">
        {(["calendario", "grupos", "chaves", "mapa"] as CopaTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors relative",
              tab === t ? "text-primary" : "text-muted-foreground"
            )}
          >
            {t === "calendario" ? "Calendário" : t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && <span className="absolute bottom-0 inset-x-2 h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === "calendario" && <CalendarioTab />}
        {tab === "grupos" && <GruposTab />}
        {tab === "chaves" && <ChavesTab />}
        {tab === "mapa" && <MapaTab />}
      </div>
    </div>
  );
};

// ===== CALENDARIO TAB =====
function CalendarioTab() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [dayFilter, setDayFilter] = useState<string[]>(["today"]);

  const getFilteredMatches = (): Match[] => {
    if (dayFilter.includes("today")) return getTodayMatches();
    if (dayFilter.includes("tomorrow")) return getTomorrowMatches();
    return matches;
  };

  const filtered = getFilteredMatches();

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          {["today", "tomorrow", "all"].map(d => (
            <button
              key={d}
              onClick={() => setDayFilter([d])}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                dayFilter.includes(d) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {d === "today" ? "Hoje" : d === "tomorrow" ? "Amanhã" : "Todos"}
            </button>
          ))}
        </div>
        <button onClick={() => setFilterOpen(true)} className="p-2 rounded-lg bg-secondary">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📅" title="Sem jogos" description="Nenhum jogo encontrado para este período." />
      ) : (
        <div className="space-y-3">
          {filtered.map(m => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrar Jogos"
        filters={[
          {
            label: "Fase",
            options: [
              { id: "groups", label: "Fase de Grupos" },
              { id: "round-of-16", label: "Oitavas" },
              { id: "quarter", label: "Quartas" },
              { id: "semi", label: "Semifinal" },
              { id: "final", label: "Final" },
            ],
            selected: [],
            onSelect: () => {},
          },
          {
            label: "Status",
            options: [
              { id: "live", label: "Ao Vivo" },
              { id: "scheduled", label: "Agendado" },
              { id: "finished", label: "Encerrado" },
            ],
            selected: [],
            onSelect: () => {},
          },
        ]}
      />
    </>
  );
}

// ===== GRUPOS TAB =====
function GruposTab() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  if (selectedGroup) {
    return <GroupDetail group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {groups.map(g => {
        const teamsList = getGroupTeams(g);
        return (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            className="glass-card-hover p-3 text-center"
          >
            <span className="text-xs font-bold text-primary mb-2 block">Grupo {g}</span>
            <div className="flex justify-center gap-1">
              {teamsList.map(t => (
                <span key={t.code} className="text-base" title={t.name}>{t.flag}</span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GroupDetail({ group, onBack }: { group: string; onBack: () => void }) {
  const standings = groupStandings[group] || [];
  const groupMatches = matches.filter(m => m.group === group);

  return (
    <div>
      <button onClick={onBack} className="text-xs text-primary font-medium mb-3 block">← Voltar aos Grupos</button>
      <h2 className="text-lg font-black mb-4">Grupo {group}</h2>

      {/* Standings table */}
      <div className="glass-card overflow-hidden mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Seleção</th>
              <th className="p-2 text-center">J</th>
              <th className="p-2 text-center">V</th>
              <th className="p-2 text-center">E</th>
              <th className="p-2 text-center">D</th>
              <th className="p-2 text-center">SG</th>
              <th className="p-2 text-center font-bold">Pts</th>
              <th className="p-2 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const team = getTeam(s.teamCode);
              return (
                <tr key={s.teamCode} className={cn("border-b border-border/50", i < 2 && "bg-copa-success/5")}>
                  <td className="p-2 font-bold">{i + 1}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{team.flag}</span>
                      <span className="font-semibold">{team.code}</span>
                    </div>
                  </td>
                  <td className="p-2 text-center text-muted-foreground">{s.played}</td>
                  <td className="p-2 text-center">{s.won}</td>
                  <td className="p-2 text-center">{s.drawn}</td>
                  <td className="p-2 text-center">{s.lost}</td>
                  <td className="p-2 text-center">{s.goalsFor - s.goalsAgainst}</td>
                  <td className="p-2 text-center font-black">{s.points}</td>
                  <td className="p-2 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <div className="w-10 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-copa-success rounded-full" style={{ width: `${s.probability}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{s.probability}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Group matches */}
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Jogos do Grupo</h3>
      <div className="space-y-2">
        {groupMatches.length === 0 ? (
          <p className="text-xs text-muted-foreground">Jogos ainda não definidos.</p>
        ) : (
          groupMatches.map(m => <MatchCard key={m.id} match={m} compact />)
        )}
      </div>
    </div>
  );
}

// ===== CHAVES TAB =====
function ChavesTab() {
  const rounds = ["Oitavas", "Quartas", "Semi", "Final"];

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-6 min-w-[600px] py-2">
        {rounds.map(round => {
          const roundMatches = bracketMatches.filter(m => m.round === round);
          return (
            <div key={round} className="flex-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 text-center">{round}</h3>
              <div className="space-y-3 flex flex-col justify-around h-full">
                {roundMatches.map(m => {
                  const home = m.homeTeam ? getTeam(m.homeTeam) : null;
                  const away = m.awayTeam ? getTeam(m.awayTeam) : null;
                  const isFavorite = m.homeTeam === "BRA" || m.awayTeam === "BRA";
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "glass-card p-2 text-xs",
                        isFavorite && "ring-1 ring-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{home?.flag || "🏳️"}</span>
                        <span className="font-semibold flex-1">{home?.code || "TBD"}</span>
                        {m.homeScore !== undefined && <span className="font-black">{m.homeScore}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{away?.flag || "🏳️"}</span>
                        <span className="font-semibold flex-1">{away?.code || "TBD"}</span>
                        {m.awayScore !== undefined && <span className="font-black">{m.awayScore}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== MAPA TAB =====
function MapaTab() {
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);

  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Estádios da Copa 2026</h3>
      <div className="space-y-2">
        {stadiums.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStadium(selectedStadium?.id === s.id ? null : s)}
            className={cn(
              "glass-card-hover w-full p-3 text-left transition-all",
              selectedStadium?.id === s.id && "ring-1 ring-primary"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate">{s.name}</h4>
                <p className="text-xs text-muted-foreground">{s.city}, {s.country}</p>
                {selectedStadium?.id === s.id && (
                  <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                    <p className="text-xs"><span className="text-muted-foreground">Capacidade:</span> <span className="font-semibold">{s.capacity.toLocaleString("pt-BR")}</span></p>
                    <p className="text-xs"><span className="text-muted-foreground">Fuso:</span> <span className="font-semibold">{s.timezone}</span></p>
                    <p className="text-xs"><span className="text-muted-foreground">Clima:</span> <span className="font-semibold">{s.climaHint}</span></p>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{s.capacity.toLocaleString("pt-BR")}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Copa;
