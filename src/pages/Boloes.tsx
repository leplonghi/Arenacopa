import { useState } from "react";
import { Link } from "react-router-dom";
import { boloes, type Bolao } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Plus, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

const Boloes = () => {
  const [statusFilter, setStatusFilter] = useState<"active" | "finished">("active");

  const activeBoloes = boloes.filter(b => b.status === "active");
  const finishedBoloes = boloes.filter(b => b.status === "finished");
  const currentList = statusFilter === "active" ? activeBoloes : finishedBoloes;

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">Minhas Ligas</span>
          <h1 className="text-2xl font-black">Bolões</h1>
        </div>
        <Link
          to="/boloes/criar"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Create
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["active", "finished"] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-colors",
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            {s === "active" ? "Ativos" : "Finalizados"}
          </button>
        ))}
      </div>

      {/* Bolão cards */}
      {currentList.length === 0 ? (
        <EmptyState icon="🏆" title="Nenhum bolão" description="Crie seu primeiro bolão!" />
      ) : (
        <div className="space-y-4">
          {currentList.map(b => <BolaoCard key={b.id} bolao={b} />)}
        </div>
      )}
    </div>
  );
};

function BolaoCard({ bolao }: { bolao: Bolao }) {
  const deltaColor = bolao.myDelta > 0 ? "text-copa-success bg-copa-success/15" : bolao.myDelta < 0 ? "text-copa-live bg-copa-live/15" : "text-muted-foreground bg-secondary";

  return (
    <Link to={`/boloes/${bolao.id}`} className="glass-card p-4 block border-l-2 border-l-copa-green">
      {/* Top row */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
          bolao.type === "official" ? "bg-copa-green/20" : "bg-secondary"
        )}>
          {bolao.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black truncate">{bolao.name}</h3>
          <span className={cn(
            "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-0.5",
            bolao.type === "official" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            {bolao.type === "official" ? "Liga Oficial" : "Grupo Privado"}
          </span>
        </div>
        <div className="flex flex-col items-center shrink-0">
          {bolao.myDelta !== 0 ? (
            <>
              {bolao.myDelta > 0 ? <TrendingUp className="w-4 h-4 text-copa-success" /> : <TrendingDown className="w-4 h-4 text-copa-live" />}
              <span className={cn("text-[10px] font-bold", deltaColor.split(" ")[0])}>
                {Math.abs(bolao.myDelta)} POS
              </span>
            </>
          ) : (
            <>
              <Minus className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground">0 POS</span>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      {bolao.totalContribution > 0 ? (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex -space-x-2">
            {bolao.participants.slice(0, 3).map((p, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs">
                {p.avatar}
              </div>
            ))}
            <div className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground">
              +{bolao.participants.length - 3}
            </div>
          </div>
          <div className="ml-auto text-right">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Total Pot</span>
            <span className="text-sm font-black text-primary">R$ {bolao.totalContribution.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="glass-card p-2 text-center">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Meu Rank</span>
            <span className="text-lg font-black">#{bolao.myRank}</span>
            <span className="text-xs text-muted-foreground"> / {bolao.participants.length}</span>
          </div>
          <div className="glass-card p-2 text-center">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Pontos</span>
            <span className="text-lg font-black">{bolao.myPoints}</span>
            <span className="text-xs text-muted-foreground"> pts</span>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{bolao.progress}%</span>
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${bolao.progress}%` }} />
      </div>
    </Link>
  );
}

export default Boloes;
