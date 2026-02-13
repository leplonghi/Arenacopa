import { useParams, useNavigate } from "react-router-dom";
import { boloes } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Share2, TrendingUp, TrendingDown, Minus, Trophy, Target, DollarSign, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

const BolaoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const bolao = boloes.find(b => b.id === id);

  if (!bolao) {
    return <EmptyState icon="🔍" title="Bolão não encontrado" description="Este bolão não existe ou foi removido." />;
  }

  const top3 = bolao.participants.slice(0, 3);
  const rest = bolao.participants.slice(3);

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{bolao.icon}</span>
        <div className="flex-1">
          <h2 className="text-lg font-black">{bolao.name}</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{bolao.participants.length} participantes</span>
            <span>•</span>
            <span>{bolao.progress}% concluído</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {bolao.totalContribution > 0 && (
          <div className="glass-card p-3 text-center">
            <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
            <span className="text-xs text-muted-foreground block">Pot Total</span>
            <span className="text-sm font-black">R$ {bolao.totalContribution}</span>
          </div>
        )}
        <div className="glass-card p-3 text-center">
          <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground block">Meu Rank</span>
          <span className="text-sm font-black">{bolao.myRank}º</span>
        </div>
        <div className="glass-card p-3 text-center">
          <Target className="w-4 h-4 text-primary mx-auto mb-1" />
          <span className="text-xs text-muted-foreground block">Pontos</span>
          <span className="text-sm font-black">{bolao.myPoints}</span>
        </div>
      </div>

      {/* Podium */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Pódio</h3>
        <div className="flex items-end justify-center gap-3 mb-4">
          {/* 2nd place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">{top3[1].avatar}</span>
              <div className="w-16 bg-secondary rounded-t-lg flex flex-col items-center py-3" style={{ height: 80 }}>
                <span className="text-xs font-bold">2º</span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center px-1">{top3[1].name}</span>
                <span className="text-xs font-black mt-auto">{top3[1].points}</span>
              </div>
            </div>
          )}
          {/* 1st place */}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <span className="text-sm mb-1">👑</span>
              <span className="text-3xl mb-1">{top3[0].avatar}</span>
              <div className="w-20 bg-primary/20 border border-primary/30 rounded-t-lg flex flex-col items-center py-3" style={{ height: 100 }}>
                <span className="text-xs font-bold text-primary">1º</span>
                <span className="text-[10px] text-foreground truncate w-full text-center px-1 font-semibold">{top3[0].name}</span>
                <span className="text-sm font-black mt-auto text-primary">{top3[0].points}</span>
              </div>
            </div>
          )}
          {/* 3rd place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1">{top3[2].avatar}</span>
              <div className="w-16 bg-secondary rounded-t-lg flex flex-col items-center py-3" style={{ height: 64 }}>
                <span className="text-xs font-bold">3º</span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center px-1">{top3[2].name}</span>
                <span className="text-xs font-black mt-auto">{top3[2].points}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Full leaderboard */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Ranking Completo</h3>
        <div className="glass-card overflow-hidden">
          {bolao.participants.map((p, i) => (
            <div key={p.name} className={cn(
              "flex items-center gap-3 px-3 py-2.5",
              i < bolao.participants.length - 1 && "border-b border-border/50",
              p.name === "Você" && "bg-primary/5"
            )}>
              <span className="text-xs font-black w-5 text-center">{p.rank}</span>
              <span className="text-lg">{p.avatar}</span>
              <span className={cn("text-sm flex-1 font-medium", p.name === "Você" && "font-bold text-primary")}>{p.name}</span>
              <div className="flex items-center gap-1">
                {p.delta > 0 && <TrendingUp className="w-3 h-3 text-copa-success" />}
                {p.delta < 0 && <TrendingDown className="w-3 h-3 text-copa-live" />}
                {p.delta === 0 && <Minus className="w-3 h-3 text-muted-foreground" />}
                <span className={cn(
                  "text-[10px] font-bold",
                  p.delta > 0 && "text-copa-success",
                  p.delta < 0 && "text-copa-live",
                )}>
                  {p.delta > 0 ? `+${p.delta}` : p.delta !== 0 ? p.delta : ""}
                </span>
              </div>
              <span className="text-sm font-black w-10 text-right">{p.points}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pending predictions placeholder */}
      <section className="glass-card p-4 text-center">
        <span className="text-2xl mb-2 block">📝</span>
        <h4 className="text-sm font-bold mb-1">Palpites Pendentes</h4>
        <p className="text-xs text-muted-foreground mb-3">Você tem 4 jogos sem palpite na rodada atual</p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold">
          Fazer Palpites
        </button>
      </section>

      {/* Share */}
      <button className="w-full glass-card-hover p-3 flex items-center justify-center gap-2 text-sm font-bold text-primary">
        <Share2 className="w-4 h-4" />
        Compartilhar minha posição
      </button>

      {/* Prize distribution */}
      {bolao.totalContribution > 0 && bolao.distribution.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Premiação</h3>
          <div className="glass-card p-4 space-y-2">
            {bolao.distribution.map(d => (
              <div key={d.label} className="flex items-center justify-between">
                <span className="text-sm font-bold">{d.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{d.pct}%</span>
                  <span className="text-sm font-black text-primary">R$ {Math.round(bolao.totalContribution * d.pct / 100)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default BolaoDetail;
