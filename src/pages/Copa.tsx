import { useState } from "react";
import { cn } from "@/lib/utils";
import { MatchCard } from "@/components/MatchCard";
import { Flag } from "@/components/Flag";
import { EmptyState } from "@/components/EmptyState";
import {
  matches, groups, groupStandings, getGroupTeams, getTeam,
  bracketMatches, stadiums, getTodayMatches, getTomorrowMatches,
  formatMatchDate, type Match, type Stadium,
} from "@/data/mockData";
import { MapPin, Users, Globe, Thermometer } from "lucide-react";

type CopaTab = "calendario" | "grupos" | "chaves" | "mapa";

const Copa = () => {
  const [tab, setTab] = useState<CopaTab>("calendario");

  return (
    <div>
      {/* Sub-tabs - pill style */}
      <div className="flex gap-2 px-4 py-3 scrollbar-hide sticky top-14 z-20 backdrop-blur-md" style={{ background: 'rgba(5, 20, 16, 0.9)' }}>
        {(["calendario", "grupos", "chaves", "mapa"] as CopaTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            )}
          >
            {t === "calendario" ? "Calendário" : t.charAt(0).toUpperCase() + t.slice(1)}
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
  const todayMatches = getTodayMatches();
  const tomorrowMatches = getTomorrowMatches();

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="space-y-6">
      {/* Today */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">
            Hoje, {today.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
            {todayMatches.length} Jogos
          </span>
        </div>
        {todayMatches.length === 0 ? (
          <EmptyState icon="📅" title="Sem jogos hoje" description="Nenhum jogo agendado para hoje." />
        ) : (
          <div className="space-y-3">
            {todayMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>

      {/* Tomorrow */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">
            Amanhã, {tomorrow.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
          </h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
            {tomorrowMatches.length} Jogos
          </span>
        </div>
        {tomorrowMatches.length === 0 ? (
          <EmptyState icon="📅" title="Sem jogos amanhã" description="Nenhum jogo agendado." />
        ) : (
          <div className="space-y-3">
            {tomorrowMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// ===== GRUPOS TAB =====
function GruposTab() {
  const [viewMode, setViewMode] = useState<"real" | "projecao">("real");

  return (
    <div>
      {/* Toggle */}
      <div className="flex rounded-full bg-secondary p-1 mb-5">
        {(["real", "projecao"] as const).map(m => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={cn(
              "flex-1 py-2 rounded-full text-xs font-bold transition-colors",
              viewMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {m === "real" ? "Real" : "Projeção"}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        {groups.map(g => {
          const standings = groupStandings[g] || [];
          const status = standings.some(s => s.played > 0) ? "Em andamento" : "Seu Palpite";

          return (
            <div key={g} className="glass-card overflow-hidden border-l-2 border-l-copa-green">
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-base font-black">Grupo {g}</h3>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full",
                  standings.some(s => s.played > 0)
                    ? "bg-copa-success/20 text-copa-success"
                    : "bg-secondary text-secondary-foreground"
                )}>
                  {status}
                </span>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[auto_1fr_32px_32px_auto] gap-x-2 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                <span></span>
                <span>País</span>
                <span className="text-center">P</span>
                <span className="text-center">SG</span>
                <span className="text-right">Prob.</span>
              </div>

              {/* Rows */}
              {standings.map((s, i) => {
                const team = getTeam(s.teamCode);
                const gd = s.goalsFor - s.goalsAgainst;
                const qualifies = i < 2;
                return (
                  <div
                    key={s.teamCode}
                    className={cn(
                      "grid grid-cols-[auto_1fr_32px_32px_auto] gap-x-2 items-center px-4 py-2.5",
                      qualifies ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span className="text-xs font-medium w-4">{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <Flag code={team.code} size="sm" />
                      <span className={cn("text-sm", qualifies ? "font-bold" : "font-medium")}>{team.name}</span>
                    </div>
                    <span className={cn("text-center text-sm", qualifies && "font-black")}>{s.points}</span>
                    <span className="text-center text-sm">{gd >= 0 ? `+${gd}` : gd}</span>
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
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== CHAVES TAB =====
function ChavesTab() {
  const rounds = [
    { key: "Oitavas", label: "ROUND OF 16" },
  ];

  const oitavas = bracketMatches.filter(m => m.round === "Oitavas");

  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 text-center">Round of 16</h2>
      <div className="space-y-3">
        {oitavas.map(m => {
          const home = m.homeTeam ? getTeam(m.homeTeam) : null;
          const away = m.awayTeam ? getTeam(m.awayTeam) : null;
          const isFavorite = m.homeTeam === "BRA" || m.awayTeam === "BRA";

          return (
            <div
              key={m.id}
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
                <span className="text-sm font-bold flex-1">{home?.name || "TBD"}</span>
                {m.homeScore !== undefined && (
                  <span className="text-lg font-black text-primary">{m.homeScore}</span>
                )}
              </div>
              <div className="flex items-center gap-3 px-4 py-3 border-t border-border/30">
                <Flag code={away?.code || ""} size="sm" />
                <span className="text-sm font-bold flex-1">{away?.name || "TBD"}</span>
                {m.awayScore !== undefined && (
                  <span className="text-lg font-black">{m.awayScore}</span>
                )}
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
      {/* Map placeholder */}
      <div className="glass-card h-64 mb-4 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-copa-green/10 to-background/80" />
        <div className="text-center z-10">
          <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <span className="text-xs text-muted-foreground">Copa 2026 Map</span>
        </div>
        {/* Stadium dots */}
        {stadiums.slice(0, 5).map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSelectedStadium(s)}
            className={cn(
              "absolute w-8 h-8 rounded-full flex items-center justify-center transition-all",
              selectedStadium?.id === s.id
                ? "bg-primary scale-125 shadow-lg shadow-primary/30"
                : "bg-secondary/80"
            )}
            style={{ top: `${25 + i * 12}%`, left: `${20 + i * 14}%` }}
          >
            <MapPin className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Stadium detail card */}
      {selectedStadium ? (
        <div className="glass-card overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-b from-copa-green/20 to-transparent p-6 text-center">
            <h3 className="text-lg font-black">{selectedStadium.name}</h3>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 text-copa-success" />
              <span>{selectedStadium.city}, {selectedStadium.country}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4">
            <div className="glass-card p-3 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-copa-green-light" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Capacidade</span>
              <span className="text-sm font-black">{selectedStadium.capacity.toLocaleString("pt-BR")}</span>
            </div>
            <div className="glass-card p-3 text-center">
              <Globe className="w-4 h-4 mx-auto mb-1 text-primary" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Fuso</span>
              <span className="text-sm font-black">{selectedStadium.timezone.split("/").pop()}</span>
            </div>
            <div className="glass-card p-3 text-center">
              <Thermometer className="w-4 h-4 mx-auto mb-1 text-primary" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Clima</span>
              <span className="text-sm font-black">18°C</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {stadiums.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStadium(s)}
              className="glass-card-hover w-full p-3 text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate">{s.name}</h4>
                <p className="text-[11px] text-muted-foreground">{s.city}, {s.country}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{s.capacity.toLocaleString("pt-BR")}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Copa;
