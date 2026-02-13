import { Link } from "react-router-dom";
import { MatchCard } from "@/components/MatchCard";
import { getTodayMatches, getTeam, boloes, userProfile, matches, formatMatchTime } from "@/data/mockData";
import { ChevronRight, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const Index = () => {
  const todayMatches = getTodayMatches();
  const favoriteTeam = getTeam(userProfile.favoriteTeam);
  const myBoloes = boloes.filter(b => b.status === "active").slice(0, 3);

  const nextFavMatch = matches.find(
    m => (m.homeTeam === userProfile.favoriteTeam || m.awayTeam === userProfile.favoriteTeam) && m.status !== "finished"
  );

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Meu Time */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meu Time</h2>
          <Link to="/copa/grupos" className="text-xs text-primary font-semibold">Detalhes</Link>
        </div>
        <div className="glass-card p-4 border-l-2 border-l-copa-green">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center text-3xl border-2 border-copa-green/30">
              {favoriteTeam.flag}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-lg">{favoriteTeam.name}</h3>
              {nextFavMatch && (
                <span className="text-xs text-muted-foreground">
                  Próximo Jogo: <span className="text-primary font-semibold">Hoje, {formatMatchTime(nextFavMatch.date)}</span>
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Grupo {favoriteTeam.group}</span>
              <span className="text-2xl font-black">1º</span>
            </div>
          </div>
        </div>
      </section>

      {/* Meus Bolões */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meus Bolões</h2>
          <Link to="/boloes" className="text-xs text-primary font-semibold">Ranking</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {myBoloes.map(bolao => (
            <Link
              key={bolao.id}
              to={`/boloes/${bolao.id}`}
              className="glass-card p-4 min-w-[160px] shrink-0 border-l-2 border-l-copa-green relative"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-copa-green/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-copa-green-light" />
                </div>
                {bolao.myDelta > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-copa-success/20 text-copa-success ml-auto">
                    +{bolao.myDelta > 0 ? `${bolao.myDelta * 3}pts` : ""}
                  </span>
                )}
                {bolao.myRank === 1 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary ml-auto">
                    Líder
                  </span>
                )}
              </div>
              <span className="text-xs font-bold block truncate mb-1">{bolao.name}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black">{bolao.myRank}º</span>
                <span className="text-xs text-muted-foreground">/ {bolao.participants.length}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Jogos de Hoje */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Jogos de Hoje</h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
            {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).toUpperCase()}
          </span>
        </div>
        <div className="space-y-3">
          {todayMatches.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <span className="text-2xl mb-2 block">😴</span>
              <p className="text-sm text-muted-foreground">Sem jogos hoje</p>
            </div>
          ) : (
            todayMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
