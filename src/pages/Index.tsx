import { Link } from "react-router-dom";
import { MatchCard } from "@/components/MatchCard";
import { getTodayMatches, getTeam, boloes, userProfile, matches } from "@/data/mockData";
import { ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const todayMatches = getTodayMatches();
  const favoriteTeam = getTeam(userProfile.favoriteTeam);
  const myBoloes = boloes.filter(b => b.status === "active").slice(0, 3);

  // Find next match for favorite team
  const nextFavMatch = matches.find(
    m => (m.homeTeam === userProfile.favoriteTeam || m.awayTeam === userProfile.favoriteTeam) && m.status !== "finished"
  );

  // Find last result for favorite team
  const lastFavMatch = [...matches].reverse().find(
    m => (m.homeTeam === userProfile.favoriteTeam || m.awayTeam === userProfile.favoriteTeam) && m.status === "finished"
  );

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Favorite Team */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Meu Time</h2>
          <Link to="/copa/grupos" className="text-xs text-primary font-medium flex items-center gap-0.5">
            Ver Grupo <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{favoriteTeam.flag}</span>
            <div>
              <h3 className="font-bold text-base">{favoriteTeam.name}</h3>
              <span className="text-xs text-muted-foreground">Grupo {favoriteTeam.group} • 1º lugar</span>
            </div>
          </div>

          {lastFavMatch && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-copa-success">Último</span>
              <span>{getTeam(lastFavMatch.homeTeam).flag} {lastFavMatch.homeScore} - {lastFavMatch.awayScore} {getTeam(lastFavMatch.awayTeam).flag}</span>
            </div>
          )}

          {nextFavMatch && (
            <Link to={`/copa/calendario`} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">Próximo</span>
                <span className="text-xs font-medium">
                  {getTeam(nextFavMatch.homeTeam).flag} {getTeam(nextFavMatch.homeTeam).code} vs {getTeam(nextFavMatch.awayTeam).code} {getTeam(nextFavMatch.awayTeam).flag}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </section>

      {/* My Bolões */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Meus Bolões</h2>
          <Link to="/boloes" className="text-xs text-primary font-medium flex items-center gap-0.5">
            Ver Todos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {myBoloes.map(bolao => (
            <Link
              key={bolao.id}
              to={`/boloes/${bolao.id}`}
              className="glass-card-hover p-3 min-w-[160px] shrink-0"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{bolao.icon}</span>
                <span className="text-xs font-bold truncate">{bolao.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black">{bolao.myRank}º</span>
                <div className="flex items-center gap-1">
                  {bolao.myDelta > 0 && <TrendingUp className="w-3 h-3 text-copa-success" />}
                  {bolao.myDelta < 0 && <TrendingDown className="w-3 h-3 text-copa-live" />}
                  {bolao.myDelta === 0 && <Minus className="w-3 h-3 text-muted-foreground" />}
                  <span className={cn(
                    "text-xs font-bold",
                    bolao.myDelta > 0 && "text-copa-success",
                    bolao.myDelta < 0 && "text-copa-live",
                    bolao.myDelta === 0 && "text-muted-foreground"
                  )}>
                    {bolao.myDelta > 0 ? `+${bolao.myDelta}` : bolao.myDelta === 0 ? "—" : bolao.myDelta}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">{bolao.myPoints} pts</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Matches */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Jogos de Hoje</h2>
          <Link to="/copa/calendario" className="text-xs text-primary font-medium flex items-center gap-0.5">
            Calendário <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {todayMatches.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <span className="text-2xl mb-2 block">😴</span>
              <p className="text-sm text-muted-foreground">Sem jogos hoje</p>
            </div>
          ) : (
            todayMatches.map(match => (
              <MatchCard key={match.id} match={match} compact />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
