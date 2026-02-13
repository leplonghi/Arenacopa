import { useState } from "react";
import { Link } from "react-router-dom";
import { boloes, type Bolao } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Plus, TrendingUp, TrendingDown, Minus, Filter, Users } from "lucide-react";
import { FilterSheet } from "@/components/FilterSheet";
import { EmptyState } from "@/components/EmptyState";

const Boloes = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>(["active"]);

  const activeBoloes = boloes.filter(b => b.status === "active");
  const finishedBoloes = boloes.filter(b => b.status === "finished");
  const createdByMe = activeBoloes.filter(b => b.createdByMe);
  const participating = activeBoloes.filter(b => !b.createdByMe);

  const showActive = statusFilter.length === 0 || statusFilter.includes("active");
  const showFinished = statusFilter.includes("finished");

  return (
    <div className="px-4 py-4">
      {/* Header with filter + CTA */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {["active", "finished"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter([s])}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                statusFilter.includes(s) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}
            >
              {s === "active" ? "Ativos" : "Finalizados"}
            </button>
          ))}
        </div>
        <button onClick={() => setFilterOpen(true)} className="p-2 rounded-lg bg-secondary">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* CTA */}
      <Link
        to="/boloes/criar"
        className="glass-card-hover p-4 flex items-center gap-3 mb-5 border-dashed border-primary/30"
      >
        <div className="p-2.5 rounded-xl bg-primary/15">
          <Plus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Criar Bolão</h3>
          <p className="text-xs text-muted-foreground">Monte seu bolão e convide amigos</p>
        </div>
      </Link>

      {showActive && (
        <>
          {/* Created by me */}
          {createdByMe.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Criados por mim</h2>
              <div className="space-y-2">
                {createdByMe.map(b => <BolaoCard key={b.id} bolao={b} />)}
              </div>
            </section>
          )}

          {/* Participating */}
          {participating.length > 0 && (
            <section className="mb-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Participando</h2>
              <div className="space-y-2">
                {participating.map(b => <BolaoCard key={b.id} bolao={b} />)}
              </div>
            </section>
          )}
        </>
      )}

      {showFinished && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Finalizados</h2>
          {finishedBoloes.length === 0 ? (
            <EmptyState icon="🏆" title="Nenhum bolão finalizado" description="Seus bolões finalizados aparecerão aqui." />
          ) : (
            <div className="space-y-2">
              {finishedBoloes.map(b => <BolaoCard key={b.id} bolao={b} />)}
            </div>
          )}
        </section>
      )}

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrar Bolões"
        filters={[
          {
            label: "Tipo",
            options: [
              { id: "social", label: "Social (sem grana)" },
              { id: "contribution", label: "Com contribuição" },
            ],
            selected: [],
            onSelect: () => {},
          },
          {
            label: "Ordenar",
            options: [
              { id: "recent", label: "Mais recentes" },
              { id: "participants", label: "Mais participantes" },
              { id: "contribution", label: "Maior contribuição" },
            ],
            selected: [],
            onSelect: () => {},
          },
        ]}
      />
    </div>
  );
};

function BolaoCard({ bolao }: { bolao: Bolao }) {
  return (
    <Link to={`/boloes/${bolao.id}`} className="glass-card-hover p-3 flex items-center gap-3 block">
      <span className="text-2xl">{bolao.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold truncate">{bolao.name}</span>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase",
            bolao.type === "official" ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
          )}>
            {bolao.type === "official" ? "Oficial" : "Privado"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {bolao.participants.length}</span>
          {bolao.totalContribution > 0 && (
            <span>R$ {bolao.totalContribution}</span>
          )}
          <span>{bolao.progress}% concluído</span>
        </div>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className="text-lg font-black">{bolao.myRank}º</span>
        <div className="flex items-center gap-0.5">
          {bolao.myDelta > 0 && <TrendingUp className="w-3 h-3 text-copa-success" />}
          {bolao.myDelta < 0 && <TrendingDown className="w-3 h-3 text-copa-live" />}
          {bolao.myDelta === 0 && <Minus className="w-3 h-3 text-muted-foreground" />}
          <span className="text-xs font-bold text-muted-foreground">{bolao.myPoints} pts</span>
        </div>
      </div>
    </Link>
  );
}

export default Boloes;
