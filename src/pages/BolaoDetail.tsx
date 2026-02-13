import { useParams, useNavigate } from "react-router-dom";
import { boloes } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Share2, TrendingUp, TrendingDown, Minus, Trophy, Target, DollarSign, Users, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useState } from "react";

const BolaoDetail = () => {
  const { id } = useParams();
  const bolao = boloes.find(b => b.id === id);
  const [showAll, setShowAll] = useState(false);

  if (!bolao) {
    return <EmptyState icon="🔍" title="Bolão não encontrado" description="Este bolão não existe ou foi removido." />;
  }

  const top3 = bolao.participants.slice(0, 3);
  const rest = bolao.participants.slice(3);

  return (
    <div className="px-4 py-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black">{bolao.name}</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className="w-2 h-2 rounded-full bg-copa-success" />
          <span>Copa do Mundo 2026</span>
          <span>•</span>
          <span>{bolao.participants.length} Participantes</span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {bolao.totalContribution > 0 && (
          <div className="glass-card p-3 text-center">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">Prêmio</span>
            <span className="text-base font-black text-primary">R${bolao.totalContribution}</span>
          </div>
        )}
        <div className={cn("glass-card p-3 text-center border border-primary/30 bg-primary/5", !bolao.totalContribution && "col-span-1")}>
          <span className="text-[9px] uppercase tracking-wider text-primary block mb-1">Meu Rank</span>
          <span className="text-base font-black">#{bolao.myRank}</span>
        </div>
        <div className="glass-card p-3 text-center">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block mb-1">Pontos</span>
          <span className="text-base font-black">{bolao.myPoints}</span>
        </div>
      </div>

      {/* Podium */}
      <section>
        <div className="flex items-end justify-center gap-4 pt-4 pb-2">
          {/* 2nd place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-muted-foreground/30 flex items-center justify-center text-2xl relative mb-2">
                {top3[1].avatar}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-muted-foreground text-[10px] font-black flex items-center justify-center text-background">2</span>
              </div>
              <span className="text-xs font-bold truncate max-w-[80px]">{top3[1].name}</span>
              <span className="text-[10px] text-muted-foreground">{top3[1].points.toLocaleString()} pts</span>
              <div className="w-20 h-16 bg-secondary/60 rounded-t-lg mt-2" />
            </div>
          )}
          {/* 1st place */}
          {top3[0] && (
            <div className="flex flex-col items-center -mt-4">
              <Trophy className="w-5 h-5 text-primary mb-1" />
              <div className="w-20 h-20 rounded-full bg-secondary border-3 border-primary flex items-center justify-center text-3xl relative mb-2 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                {top3[0].avatar}
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-[11px] font-black flex items-center justify-center text-primary-foreground">1</span>
              </div>
              <span className="text-sm font-black">{top3[0].name}</span>
              <span className="text-xs text-primary font-bold">{top3[0].points.toLocaleString()} pts</span>
              <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-t-lg mt-2" />
            </div>
          )}
          {/* 3rd place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-secondary border-2 border-copa-green/30 flex items-center justify-center text-2xl relative mb-2">
                {top3[2].avatar}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-copa-green text-[10px] font-black flex items-center justify-center text-background">3</span>
              </div>
              <span className="text-xs font-bold truncate max-w-[80px]">{top3[2].name}</span>
              <span className="text-[10px] text-muted-foreground">{top3[2].points.toLocaleString()} pts</span>
              <div className="w-20 h-12 bg-secondary/40 rounded-t-lg mt-2" />
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard table */}
      <section>
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[24px_1fr_auto] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/50">
            <span>#</span>
            <span>Jogador</span>
            <span>Pts</span>
          </div>
          {/* Rows */}
          {(showAll ? bolao.participants : rest).slice(0, showAll ? undefined : 4).map((p) => (
            <div key={p.name} className={cn(
              "grid grid-cols-[24px_1fr_auto] gap-3 items-center px-4 py-3 border-b border-border/30",
              p.name === "Você" && "bg-primary/5"
            )}>
              <span className="text-sm font-bold text-muted-foreground">{p.rank}</span>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-lg">
                  {p.avatar}
                </div>
                <div>
                  <span className={cn("text-sm font-bold block", p.name === "Você" && "text-primary")}>{p.name}</span>
                  <div className="flex items-center gap-1">
                    {p.delta > 0 && <TrendingUp className="w-3 h-3 text-copa-success" />}
                    {p.delta < 0 && <TrendingDown className="w-3 h-3 text-copa-live" />}
                    {p.delta === 0 && <Minus className="w-3 h-3 text-muted-foreground" />}
                    <span className={cn(
                      "text-[10px] font-bold",
                      p.delta > 0 && "text-copa-success",
                      p.delta < 0 && "text-copa-live",
                      p.delta === 0 && "text-muted-foreground"
                    )}>
                      {p.delta > 0 ? `↑ ${p.delta}` : p.delta < 0 ? `↓ ${Math.abs(p.delta)}` : "—"}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-base font-black">{p.points.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {rest.length > 4 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full mt-3 py-2.5 flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground"
          >
            Ver Tabela Completa <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </section>

      {/* Share */}
      <button className="w-full glass-card-hover p-3 flex items-center justify-center gap-2 text-sm font-bold text-primary">
        <Share2 className="w-4 h-4" />
        Compartilhar
      </button>
    </div>
  );
};

export default BolaoDetail;
