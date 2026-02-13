import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/Flag";
import { groups as allGroupsList, getTeam } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "./animations";
import {
  RotateCcw, Trophy, ChevronDown, ChevronUp, Plus, ArrowLeft,
  Trash2, Share2, MessageCircle, Link2, X, Pencil, Check
} from "lucide-react";
import { useSimulacao, calcStandings } from "@/contexts/SimulacaoContext";
import { KnockoutPhase } from "./KnockoutPhase";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

function ScoreInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      min={0}
      max={20}
      value={value ?? ""}
      onChange={e => {
        const v = e.target.value;
        onChange(v === "" ? null : Math.max(0, Math.min(20, parseInt(v) || 0)));
      }}
      className="w-10 h-10 rounded-lg bg-secondary border border-border text-center text-sm font-black focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      placeholder="–"
    />
  );
}

/* ───────── Share Sheet ───────── */
function SimShareSheet({ open, onClose, sim }: {
  open: boolean;
  onClose: () => void;
  sim: { name: string; standings: Record<string, { teamCode: string; points: number; gf: number; ga: number }[]> };
}) {
  const { toast } = useToast();

  const buildShareText = () => {
    let text = `⚽ Minha simulação "${sim.name}" - Copa 2026\n\n`;
    Object.entries(sim.standings).forEach(([g, teams]) => {
      text += `📊 Grupo ${g}:\n`;
      teams.slice(0, 2).forEach((t, i) => {
        const team = getTeam(t.teamCode);
        text += `  ${i + 1}. ${team.name} (${t.points}pts)\n`;
      });
      text += "\n";
    });
    text += "🏆 Feito no ArenaCopa!";
    return text;
  };

  const shareText = buildShareText();
  const encoded = encodeURIComponent(shareText);

  const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encoded}`, "_blank"); onClose(); };
  const copyText = () => {
    navigator.clipboard.writeText(shareText);
    toast({ title: "Copiado!", description: "Simulação copiada para a área de transferência" });
    onClose();
  };
  const nativeShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Simulação: ${sim.name}`, text: shareText }); onClose(); } catch {}
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border/50 safe-bottom"
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
            <div className="px-5 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black">Compartilhar Simulação</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Envie sua simulação para amigos</p>
            </div>
            <div className="px-5 pb-6 space-y-2">
              <button onClick={shareWhatsApp} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shrink-0"><MessageCircle className="w-5 h-5 text-white" /></div>
                <div className="text-left"><span className="text-sm font-bold block">WhatsApp</span><span className="text-[10px] text-muted-foreground">Enviar via mensagem</span></div>
              </button>
              <button onClick={copyText} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors border border-border/30">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0"><Link2 className="w-5 h-5 text-accent-foreground" /></div>
                <div className="text-left"><span className="text-sm font-bold block">Copiar Texto</span><span className="text-[10px] text-muted-foreground">Copiar simulação</span></div>
              </button>
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={nativeShare} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0"><Share2 className="w-5 h-5 text-primary-foreground" /></div>
                  <div className="text-left"><span className="text-sm font-bold block">Mais opções</span><span className="text-[10px] text-muted-foreground">Compartilhar via outros apps</span></div>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ───────── Create Simulation Modal ───────── */
function CreateSimModal({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, groups: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(allGroupsList));

  const toggleGroup = (g: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(g)) { if (next.size > 1) next.delete(g); } else next.add(g);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allGroupsList));
  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), Array.from(selected).sort());
    setName("");
    setSelected(new Set(allGroupsList));
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border/50 safe-bottom max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
            <div className="px-5 pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black">Nova Simulação</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary"><X className="w-4 h-4" /></button>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Nome</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Brasil campeão"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={50}
                />
              </div>

              {/* Group selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Grupos</label>
                  <button onClick={selectAll} className="text-[10px] font-bold text-primary">Selecionar todos</button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {allGroupsList.map(g => (
                    <button
                      key={g}
                      onClick={() => toggleGroup(g)}
                      className={cn(
                        "h-10 rounded-lg text-xs font-black transition-all",
                        selected.has(g)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 transition-opacity"
              >
                Criar Simulação
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ───────── Simulation List ───────── */
function SimulationList() {
  const { simulations, loading, selectSimulation, deleteSimulation, createSimulation } = useSimulacao();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (name: string, groups: string[]) => {
    const id = await createSimulation(name, groups);
    if (id) toast({ title: "Simulação criada!" });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSimulation(id);
    toast({ title: "Simulação excluída" });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card p-6 text-center">
        <span className="text-2xl mb-2 block">🔒</span>
        <p className="text-sm font-bold">Faça login para simular</p>
        <p className="text-[11px] text-muted-foreground">Crie simulações e compartilhe com amigos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black">Simulações</h2>
          <p className="text-[11px] text-muted-foreground">Crie e gerencie suas simulações</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova
        </button>
      </div>

      {simulations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center"
        >
          <span className="text-3xl mb-2 block">⚽</span>
          <p className="text-sm font-bold">Nenhuma simulação ainda</p>
          <p className="text-[11px] text-muted-foreground mb-4">Simule os resultados da Copa e compartilhe!</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Criar primeira simulação
          </button>
        </motion.div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {simulations.map(sim => {
            const groupCount = sim.selectedGroups.length;
            const totalM = Object.values(sim.matches || {}).reduce((s, ms) => s + (ms?.length || 0), 0);
            const filled = Object.values(sim.matches || {}).reduce(
              (s, ms) => s + (ms?.filter(m => m.homeScore !== null && m.awayScore !== null).length || 0), 0
            );
            const progress = totalM > 0 ? Math.round((filled / totalM) * 100) : 0;

            return (
              <motion.div
                key={sim.id}
                variants={staggerItem}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectSimulation(sim.id)}
                className="glass-card p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black truncate flex-1">{sim.name}</h3>
                  <button
                    onClick={(e) => handleDelete(sim.id, e)}
                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors ml-2 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                  <span>{groupCount} grupo{groupCount > 1 ? "s" : ""}</span>
                  <span>•</span>
                  <span>{filled}/{totalM} jogos</span>
                  <span>•</span>
                  <span>{new Date(sim.updatedAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CreateSimModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}

/* ───────── Simulation Editor ───────── */
function SimulationEditor() {
  const {
    currentSim, allMatches, standings, filledCount, totalMatches,
    updateScore, resetAll, goBackToList, renameSimulation,
    isGroupsComplete,
  } = useSimulacao();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [phase, setPhase] = useState<"groups" | "knockout">("groups");

  if (!currentSim) return null;

  const toggleGroup = (g: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  };

  const progress = totalMatches > 0 ? Math.round((filledCount / totalMatches) * 100) : 0;
  const selectedGroups = currentSim.selectedGroups;

  const startEdit = () => { setEditName(currentSim.name); setEditing(true); };
  const saveEdit = () => {
    if (editName.trim()) renameSimulation(currentSim.id, editName.trim());
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={goBackToList} className="p-1.5 rounded-lg bg-secondary shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 text-lg font-black bg-secondary px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
                onKeyDown={e => e.key === "Enter" && saveEdit()}
                maxLength={50}
              />
              <button onClick={saveEdit} className="p-1.5 rounded-lg bg-primary text-primary-foreground">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black truncate">{currentSim.name}</h2>
              <button onClick={startEdit} className="p-1 rounded-md hover:bg-secondary transition-colors shrink-0">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            {selectedGroups.length} grupo{selectedGroups.length > 1 ? "s" : ""} selecionado{selectedGroups.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShareOpen(true)}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <Share2 className="w-4 h-4 text-primary" />
          </button>
          <button
            onClick={resetAll}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progresso</span>
          <span className="text-xs font-black text-primary">{filledCount}/{totalMatches} jogos</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Phase Toggle (only when all 12 groups selected) */}
      {currentSim.selectedGroups.length === 12 && (
        <div className="flex gap-2">
          <button
            onClick={() => setPhase("groups")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors",
              phase === "groups" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}
          >
            Fase de Grupos
          </button>
          <button
            onClick={() => setPhase("knockout")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors relative",
              phase === "knockout" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              !isGroupsComplete && "opacity-50"
            )}
            disabled={!isGroupsComplete}
          >
            Eliminatórias
            {isGroupsComplete && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-copa-success rounded-full" />
            )}
          </button>
        </div>
      )}

      {/* Groups */}
      {phase === "groups" && (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
        {selectedGroups.map(g => {
          const groupMatches = allMatches[g];
          if (!groupMatches) return null;
          const expanded = expandedGroups.has(g);
          const groupStandings = standings[g] || [];
          const groupFilled = groupMatches.filter(m => m.homeScore !== null && m.awayScore !== null).length;
          const groupComplete = groupFilled === groupMatches.length;

          return (
            <motion.div key={g} variants={staggerItem} className="glass-card overflow-hidden">
              <button onClick={() => toggleGroup(g)} className="w-full flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-black">Grupo {g}</h3>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    groupComplete ? "bg-copa-success/20 text-copa-success" :
                    groupFilled > 0 ? "bg-primary/20 text-primary" :
                    "bg-secondary text-muted-foreground"
                  )}>
                    {groupComplete ? "Completo" : `${groupFilled}/${groupMatches.length}`}
                  </span>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {expanded && (
                <div className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    {groupMatches.map((m, idx) => {
                      const home = getTeam(m.home);
                      const away = getTeam(m.away);
                      return (
                        <div key={`${m.home}-${m.away}`} className="flex items-center gap-2 py-2">
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <span className="text-xs font-bold truncate max-w-[60px]">{home.name}</span>
                            <Flag code={home.code} size="sm" />
                          </div>
                          <ScoreInput value={m.homeScore} onChange={v => updateScore(g, idx, "home", v)} />
                          <span className="text-xs font-bold text-muted-foreground">×</span>
                          <ScoreInput value={m.awayScore} onChange={v => updateScore(g, idx, "away", v)} />
                          <div className="flex items-center gap-1.5 flex-1">
                            <Flag code={away.code} size="sm" />
                            <span className="text-xs font-bold truncate max-w-[60px]">{away.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {groupFilled > 0 && (
                    <div className="border-t border-border/30 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 block">Classificação</span>
                      <div className="grid grid-cols-[16px_1fr_24px_24px_24px_24px] gap-x-1.5 px-1 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>#</span><span>País</span>
                        <span className="text-center">J</span><span className="text-center">V</span>
                        <span className="text-center">SG</span><span className="text-center">P</span>
                      </div>
                      {groupStandings.map((s, i) => {
                        const team = getTeam(s.teamCode);
                        const qualifies = i < 2;
                        const gd = s.gf - s.ga;
                        return (
                          <div key={s.teamCode} className={cn(
                            "grid grid-cols-[16px_1fr_24px_24px_24px_24px] gap-x-1.5 items-center px-1 py-2 rounded-md",
                            qualifies && "bg-copa-success/10"
                          )}>
                            <span className={cn("text-xs font-bold", qualifies ? "text-copa-success" : "text-muted-foreground")}>
                              {qualifies && <Trophy className="w-3 h-3 inline" />}
                              {!qualifies && (i + 1)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Flag code={team.code} size="sm" />
                              <span className={cn("text-xs", qualifies ? "font-black" : "font-medium")}>{team.name}</span>
                            </div>
                            <span className="text-center text-xs">{s.played}</span>
                            <span className="text-center text-xs">{s.won}</span>
                            <span className="text-center text-xs">{gd >= 0 ? `+${gd}` : gd}</span>
                            <span className={cn("text-center text-xs", qualifies && "font-black text-copa-success")}>{s.points}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
      )}

      {/* Knockout Phase */}
      {phase === "knockout" && <KnockoutPhase />}

      {/* Share Sheet */}
      <SimShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        sim={{ name: currentSim.name, standings }}
      />
    </div>
  );
}

/* ───────── Main Tab ───────── */
export function SimulacaoTab() {
  const { currentSim } = useSimulacao();

  return currentSim ? <SimulationEditor /> : <SimulationList />;
}
