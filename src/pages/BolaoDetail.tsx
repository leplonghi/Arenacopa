import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Share2, Users, Trophy, MessageCircle, Mail, Link2, X,
  ChevronRight, Crown, Calendar, TrendingUp, BarChart3,
  LogOut, UserPlus, Star
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Flag } from "@/components/Flag";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { matches, getTeam, teams, type Match } from "@/data/mockData";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ───
interface BolaoData {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  creator_id: string;
  created_at: string;
  champion_winner?: string | null;
}

interface MemberData {
  user_id: string;
  role: string;
  joined_at: string;
  profile: { name: string; avatar_url: string | null } | null;
}

interface Palpite {
  id: string;
  match_id: string;
  user_id: string;
  home_score: number;
  away_score: number;
  champion_team?: string | null;
}

// ─── Share Sheet ───
function ShareSheet({ open, onClose, bolao }: { open: boolean; onClose: () => void; bolao: BolaoData }) {
  const { toast } = useToast();
  const shareText = `🏆 Entre no meu bolão "${bolao.name}" da Copa do Mundo 2026!\n\n📋 Código de convite: ${bolao.invite_code}\n\n⚽ Baixe o ArenaCopa e use o código para participar!`;
  const shareTextEncoded = encodeURIComponent(shareText);

  const options = [
    { label: "WhatsApp", desc: "Enviar convite via mensagem", icon: MessageCircle, color: "bg-[#25D366]", bgClass: "bg-[#25D366]/10 border-[#25D366]/20", action: () => { window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank"); onClose(); } },
    { label: "E-mail", desc: "Enviar convite por e-mail", icon: Mail, color: "bg-accent", bgClass: "bg-secondary border-border/30", action: () => { window.open(`mailto:?subject=${encodeURIComponent(`Convite: ${bolao.name}`)}&body=${shareTextEncoded}`, "_blank"); onClose(); } },
    { label: "Copiar Convite", desc: "Copiar texto de convite", icon: Link2, color: "bg-accent", bgClass: "bg-secondary border-border/30", action: () => { navigator.clipboard.writeText(`Código: ${bolao.invite_code}`); toast({ title: "Copiado!" }); onClose(); } },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 400 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-card border-t border-border/50 safe-bottom">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
            <div className="px-5 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-black">Compartilhar Bolão</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg bg-secondary"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Convide amigos para "{bolao.name}"</p>
            </div>
            <div className="mx-5 mb-4 p-3 rounded-xl bg-secondary/80 border border-border/30">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary block mb-1">Código de Convite</span>
              <span className="text-xl font-black tracking-[0.3em]">{bolao.invite_code}</span>
            </div>
            <div className="px-5 pb-6 space-y-2">
              {options.map(o => (
                <button key={o.label} onClick={o.action} className={cn("w-full flex items-center gap-3 p-3.5 rounded-xl border transition-colors", o.bgClass)}>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", o.color)}>
                    <o.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold block">{o.label}</span>
                    <span className="text-[10px] text-muted-foreground">{o.desc}</span>
                  </div>
                </button>
              ))}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button onClick={async () => { try { await navigator.share({ title: bolao.name, text: shareText }); onClose(); } catch {} }} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-primary/10 border border-primary/20">
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

// ─── Score Input ───
function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(0, value - 1))} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold active:bg-secondary/70">−</button>
      <span className="w-7 text-center text-base font-black">{value}</span>
      <button onClick={() => onChange(Math.min(20, value + 1))} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold active:bg-secondary/70">+</button>
    </div>
  );
}

// ─── Champion Picker ───
function ChampionPicker({
  bolaoId, userId, palpites, setPalpites, bolaoChampionWinner,
}: {
  bolaoId: string; userId: string; palpites: Palpite[];
  setPalpites: (p: Palpite[]) => void; bolaoChampionWinner?: string | null;
}) {
  const { toast } = useToast();
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const myChampionPalpite = palpites.find(p => p.user_id === userId && p.match_id === "champion_pick");
  const selectedTeam = myChampionPalpite?.champion_team || null;
  const selectedTeamData = selectedTeam ? getTeam(selectedTeam) : null;
  const isCorrect = bolaoChampionWinner && selectedTeam === bolaoChampionWinner;
  const isWrong = bolaoChampionWinner && selectedTeam && selectedTeam !== bolaoChampionWinner;

  const saveChampion = async (teamCode: string) => {
    setSaving(true);
    try {
      if (myChampionPalpite) {
        const { error } = await supabase
          .from("bolao_palpites")
          .update({ champion_team: teamCode } as any)
          .eq("id", myChampionPalpite.id);
        if (error) throw error;
        setPalpites(palpites.map(p => p.id === myChampionPalpite.id ? { ...p, champion_team: teamCode } : p));
      } else {
        const { data, error } = await supabase
          .from("bolao_palpites")
          .insert({
            bolao_id: bolaoId, user_id: userId,
            match_id: "champion_pick", home_score: 0, away_score: 0, champion_team: teamCode,
          } as any)
          .select().single();
        if (error) throw error;
        if (data) setPalpites([...palpites, data as Palpite]);
      }
      const t = getTeam(teamCode);
      toast({ title: `Campeão: ${t.name} ${t.flag} ✅` });
      setShowPicker(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(
      "glass-card p-4 border",
      isCorrect ? "border-copa-gold/50 bg-copa-gold/5" :
      isWrong ? "border-destructive/20" : "border-copa-gold/20"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-copa-gold/20 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-copa-gold" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-black">Palpite de Campeão</span>
          <span className="text-[10px] text-copa-gold font-black ml-2">+20 pts</span>
        </div>
        {isCorrect && <span className="text-[10px] font-black text-copa-gold px-2 py-0.5 rounded-full bg-copa-gold/20">+20 PTS ✓</span>}
        {isWrong && <span className="text-[10px] font-black text-destructive/70 px-2 py-0.5 rounded-full bg-destructive/10">0 PTS ✗</span>}
      </div>

      {selectedTeamData ? (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-copa-gold/30 flex items-center justify-center bg-secondary shrink-0">
            <Flag code={selectedTeamData.code} size="lg" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-black block">{selectedTeamData.name}</span>
            <span className="text-[10px] text-muted-foreground">Grupo {selectedTeamData.group} · {selectedTeamData.confederation}</span>
          </div>
          <button
            onClick={() => setShowPicker(!showPicker)}
            disabled={saving}
            className="text-[10px] font-bold text-primary border border-primary/30 px-3 py-1.5 rounded-lg shrink-0"
          >
            Mudar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-3 rounded-xl border border-dashed border-copa-gold/40 flex items-center justify-center gap-2 text-xs font-bold text-copa-gold"
        >
          <Star className="w-4 h-4" /> Escolher Campeão da Copa
        </button>
      )}

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 max-h-52 overflow-y-auto rounded-xl bg-secondary/50 p-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-2">
                Quem vai levantar a taça?
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {teams.map(t => (
                  <button
                    key={t.code}
                    onClick={() => saveChampion(t.code)}
                    disabled={saving}
                    className={cn(
                      "flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors",
                      selectedTeam === t.code ? "bg-copa-gold/20 ring-1 ring-copa-gold" : "hover:bg-secondary"
                    )}
                  >
                    <Flag code={t.code} size="sm" />
                    <span className="text-[7px] font-bold">{t.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-muted-foreground mt-2 text-center">
        Pode ser alterado até o início da Copa · 11/06/2026
      </p>
    </div>
  );
}

// ─── Overview Tab ───
function OverviewTab({ bolao, members, isCreator, palpites, userId, onShare }: {
  bolao: BolaoData; members: MemberData[]; isCreator: boolean;
  palpites: Palpite[]; userId: string; onShare: () => void;
}) {
  const groupMatches = matches.filter(m => m.phase === "groups");
  const myGroupPalpites = palpites.filter(p => p.user_id === userId && p.match_id !== "champion_pick");
  const myChampion = palpites.find(p => p.user_id === userId && p.match_id === "champion_pick");
  const totalItems = groupMatches.length + 1;
  const progress = Math.round(((myGroupPalpites.length + (myChampion ? 1 : 0)) / totalItems) * 100);

  const nextMatches = groupMatches
    .filter(m => m.status === "scheduled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <span className="text-lg font-black block">{members.length}</span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Membros</span>
        </div>
        <div className="glass-card p-3 text-center">
          <BarChart3 className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <span className="text-lg font-black block">{myGroupPalpites.length}</span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Palpites</span>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
          <span className="text-lg font-black block">{progress}%</span>
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Progresso</span>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold">Seus Palpites</span>
          <span className="text-[10px] text-muted-foreground">
            {myGroupPalpites.length}/{groupMatches.length} jogos · {myChampion ? "✓" : "—"} campeão
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-[hsl(var(--copa-gold-light))] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        {!myChampion && (
          <p className="text-[10px] text-copa-gold mt-2 font-bold">
            ⚠️ Não esqueça do Palpite de Campeão (+20 pts) na aba Palpites!
          </p>
        )}
      </div>

      {nextMatches.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Próximos Jogos</h3>
          <div className="space-y-2">
            {nextMatches.map(m => {
              const home = getTeam(m.homeTeam);
              const away = getTeam(m.awayTeam);
              const hasPalpite = myGroupPalpites.some(p => p.match_id === m.id);
              return (
                <div key={m.id} className={cn("glass-card p-3 flex items-center gap-3", hasPalpite && "border-[hsl(var(--copa-success))]/30")}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <span>{home?.flag}</span><span className="text-xs">{home?.code}</span>
                      <span className="text-muted-foreground text-xs">vs</span>
                      <span className="text-xs">{away?.code}</span><span>{away?.flag}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(m.date), "dd MMM · HH:mm", { locale: ptBR })} · Grupo {m.group}
                    </span>
                  </div>
                  {hasPalpite
                    ? <span className="text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--copa-success))]/20 text-[hsl(var(--copa-success))] font-bold">✓</span>
                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold block">Convide mais amigos</span>
            <span className="text-[10px] text-muted-foreground">Código: <span className="font-black text-foreground tracking-wider">{bolao.invite_code}</span></span>
          </div>
        </div>
        <button onClick={onShare} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>

      <div className="glass-card p-3 border-dashed border-muted-foreground/20">
        <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
          ⚠️ O ArenaCopa <span className="font-bold">não realiza</span> processamento de pagamentos. Eventuais valores devem ser combinados entre os participantes, fora do aplicativo.
        </p>
      </div>
    </div>
  );
}

// ─── Palpites Tab ───
function PalpitesTab({ bolaoId, palpites, setPalpites, userId, bolaoChampionWinner }: {
  bolaoId: string; palpites: Palpite[]; setPalpites: (p: Palpite[]) => void;
  userId: string; bolaoChampionWinner?: string | null;
}) {
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [saving, setSaving] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<Record<string, { home: number; away: number }>>({});

  const groups = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  const groupMatches = matches.filter(m => m.phase === "groups" && m.group === selectedGroup);
  const myGroupPalpites = palpites.filter(p => p.user_id === userId && p.match_id !== "champion_pick");

  useEffect(() => {
    const scores: Record<string, { home: number; away: number }> = {};
    myGroupPalpites.forEach(p => { scores[p.match_id] = { home: p.home_score, away: p.away_score }; });
    setLocalScores(scores);
  }, [palpites, userId]);

  const savePalpite = async (matchId: string, home: number, away: number) => {
    setSaving(matchId);
    try {
      const existing = palpites.find(p => p.match_id === matchId && p.user_id === userId);
      if (existing) {
        const { error } = await supabase.from("bolao_palpites").update({ home_score: home, away_score: away }).eq("id", existing.id);
        if (error) throw error;
        setPalpites(palpites.map(p => p.id === existing.id ? { ...p, home_score: home, away_score: away } : p));
      } else {
        const { data, error } = await supabase.from("bolao_palpites").insert({ bolao_id: bolaoId, user_id: userId, match_id: matchId, home_score: home, away_score: away }).select().single();
        if (error) throw error;
        if (data) setPalpites([...palpites, data as Palpite]);
      }
      toast({ title: "Palpite salvo! ✅" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally { setSaving(null); }
  };

  const updateLocal = (matchId: string, field: "home" | "away", value: number) => {
    setLocalScores(prev => ({ ...prev, [matchId]: { home: prev[matchId]?.home ?? 0, away: prev[matchId]?.away ?? 0, [field]: value } }));
  };

  return (
    <div className="space-y-4">
      <ChampionPicker bolaoId={bolaoId} userId={userId} palpites={palpites} setPalpites={setPalpites} bolaoChampionWinner={bolaoChampionWinner} />

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {groups.map(g => {
          const ids = matches.filter(m => m.group === g && m.phase === "groups").map(m => m.id);
          const done = myGroupPalpites.filter(p => ids.includes(p.match_id)).length;
          return (
            <button key={g} onClick={() => setSelectedGroup(g)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors relative", selectedGroup === g ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
              {g}
              {done === ids.length && ids.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[hsl(var(--copa-success))] text-[7px] text-background font-black flex items-center justify-center">✓</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {groupMatches.map(m => {
          const home = getTeam(m.homeTeam);
          const away = getTeam(m.awayTeam);
          const scores = localScores[m.id] ?? { home: 0, away: 0 };
          const existingPalpite = palpites.find(p => p.match_id === m.id && p.user_id === userId);
          const hasChanged = existingPalpite ? existingPalpite.home_score !== scores.home || existingPalpite.away_score !== scores.away : true;

          return (
            <div key={m.id} className={cn("glass-card p-3", existingPalpite && !hasChanged && "border-[hsl(var(--copa-success))]/20")}>
              <div className="text-[9px] text-muted-foreground mb-2 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {format(new Date(m.date), "dd MMM · HH:mm", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="text-xs font-bold">{home?.code}</span>
                  <span className="text-lg">{home?.flag}</span>
                </div>
                <ScoreInput value={scores.home} onChange={v => updateLocal(m.id, "home", v)} />
                <span className="text-muted-foreground text-xs font-bold">×</span>
                <ScoreInput value={scores.away} onChange={v => updateLocal(m.id, "away", v)} />
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-lg">{away?.flag}</span>
                  <span className="text-xs font-bold">{away?.code}</span>
                </div>
              </div>
              {hasChanged && (
                <button onClick={() => savePalpite(m.id, scores.home, scores.away)} disabled={saving === m.id}
                  className="w-full mt-2 py-2 rounded-lg bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider disabled:opacity-50">
                  {saving === m.id ? "Salvando..." : existingPalpite ? "Atualizar Palpite" : "Salvar Palpite"}
                </button>
              )}
              {existingPalpite && !hasChanged && (
                <div className="text-center mt-1"><span className="text-[9px] text-[hsl(var(--copa-success))] font-bold">✓ Palpite salvo</span></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scoring logic ───
function calculatePoints(palpite: Palpite, match: Match | undefined, championWinner?: string | null): { points: number; label: string } {
  if (palpite.match_id === "champion_pick") {
    if (!championWinner) return { points: 0, label: "pendente" };
    return palpite.champion_team === championWinner ? { points: 20, label: "campeão" } : { points: 0, label: "errou campeão" };
  }
  if (!match || match.status !== "finished" || match.homeScore == null || match.awayScore == null) return { points: 0, label: "" };
  const ph = palpite.home_score, pa = palpite.away_score, mh = match.homeScore, ma = match.awayScore;
  if (ph === mh && pa === ma) return { points: 5, label: "exato" };
  const pr = ph > pa ? "home" : ph < pa ? "away" : "draw";
  const mr = mh > ma ? "home" : mh < ma ? "away" : "draw";
  if (pr === mr) return mr === "draw" ? { points: 2, label: "empate" } : { points: 3, label: "vencedor" };
  return { points: 0, label: "errou" };
}

// ─── Ranking Tab ───
function RankingTab({ members, palpites, championWinner }: { members: MemberData[]; palpites: Palpite[]; championWinner?: string | null }) {
  const finishedMatches = useMemo(() => matches.filter(m => m.status === "finished"), []);

  const ranking = useMemo(() => {
    return members.map(m => {
      const memberPalpites = palpites.filter(p => p.user_id === m.user_id);
      let points = 0, exactCount = 0, winnerCount = 0, drawCount = 0, championPoints = 0;
      let championTeam: string | null = null;
      memberPalpites.forEach(p => {
        if (p.match_id === "champion_pick") {
          championTeam = p.champion_team || null;
          const r = calculatePoints(p, undefined, championWinner);
          points += r.points; championPoints = r.points;
          return;
        }
        const match = finishedMatches.find(fm => fm.id === p.match_id);
        const r = calculatePoints(p, match, championWinner);
        points += r.points;
        if (r.label === "exato") exactCount++;
        else if (r.label === "vencedor") winnerCount++;
        else if (r.label === "empate") drawCount++;
      });
      return { ...m, palpiteCount: memberPalpites.filter(p => p.match_id !== "champion_pick").length, points, exactCount, winnerCount, drawCount, championTeam, championPoints };
    }).sort((a, b) => b.points - a.points || b.palpiteCount - a.palpiteCount);
  }, [members, palpites, finishedMatches, championWinner]);

  if (ranking.length === 0) return <EmptyState icon="🏆" title="Sem participantes" description="Convide amigos para competir!" />;

  return (
    <div className="space-y-2">
      {ranking.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-4 pt-4">
          {[ranking[1], ranking[0], ranking[2]].map((r, i) => {
            const pos = i === 0 ? 2 : i === 1 ? 1 : 3;
            const heights: Record<number,string> = { 1: "h-20", 2: "h-14", 3: "h-10" };
            const name = r.profile?.name || "Usuário";
            return (
              <div key={r.user_id} className="flex flex-col items-center gap-1">
                {r.championTeam && <div className="w-5 h-5 rounded-full overflow-hidden border border-copa-gold/30 mb-0.5"><Flag code={r.championTeam} size="sm" /></div>}
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-black overflow-hidden">
                  {r.profile?.avatar_url ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[10px] font-bold truncate max-w-[60px]">{name.split(" ")[0]}</span>
                <div className={cn("w-16 rounded-t-lg flex items-start justify-center pt-2", heights[pos], pos === 1 ? "bg-primary/30" : pos === 2 ? "bg-secondary" : "bg-secondary/60")}>
                  <span className={cn("text-sm font-black", pos === 1 && "text-primary")}>{pos}º</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {ranking.map((r, i) => {
          const name = r.profile?.name || "Usuário";
          return (
            <div key={r.user_id} className={cn("flex items-center gap-3 px-4 py-3", i < ranking.length - 1 && "border-b border-border/30")}>
              <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-primary/50 text-primary-foreground" : i === 2 ? "bg-primary/30 text-foreground" : "bg-secondary text-muted-foreground"
              )}>{i + 1}</span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                {r.profile?.avatar_url ? <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold block truncate">{name}</span>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                  <span>{r.palpiteCount} palpites</span>
                  {(r.exactCount > 0 || r.winnerCount > 0 || r.drawCount > 0) && <span>· 🎯{r.exactCount} ✓{r.winnerCount} ={r.drawCount}</span>}
                  {r.championTeam && (
                    <span className="flex items-center gap-0.5">
                      · <Flag code={r.championTeam} size="sm" className="inline-block" />
                      {r.championPoints === 20 && <span className="text-copa-gold font-bold">+20🏆</span>}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-black text-primary shrink-0">{r.points} pts</span>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-3">
        <p className="text-[10px] font-bold text-muted-foreground mb-1.5">Pontuação</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span>🎯 Exato = <span className="font-black text-foreground">5 pts</span></span>
          <span>✓ Vencedor = <span className="font-black text-foreground">3 pts</span></span>
          <span>= Empate = <span className="font-black text-foreground">2 pts</span></span>
          <span>🏆 Campeão = <span className="font-black text-copa-gold">20 pts</span></span>
        </div>
        {finishedMatches.length === 0 && (
          <p className="text-[10px] text-muted-foreground mt-1.5">Nenhum jogo encerrado ainda. Pontuação atualiza automaticamente.</p>
        )}
      </div>
    </div>
  );
}

// ─── Members Tab ───
function MembrosTab({ members, userId, isCreator, bolaoId, onRefresh }: {
  members: MemberData[]; userId: string; isCreator: boolean; bolaoId: string; onRefresh: () => void;
}) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const memberToRemove = members.find(m => m.user_id === confirmRemove);

  const doLeave = async () => {
    const { error } = await supabase.from("bolao_members").delete().eq("bolao_id", bolaoId).eq("user_id", userId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Você saiu do bolão" });
    navigate("/boloes");
  };

  const doRemove = async () => {
    if (!confirmRemove) return;
    const { error } = await supabase.from("bolao_members").delete().eq("bolao_id", bolaoId).eq("user_id", confirmRemove);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Membro removido" });
    setConfirmRemove(null);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      <div className="glass-card overflow-hidden">
        {members.map((m, i) => {
          const name = m.profile?.name || "Usuário";
          const isMe = m.user_id === userId;
          return (
            <div key={m.user_id} className={cn("flex items-center gap-3 px-4 py-3", i < members.length - 1 && "border-b border-border/30", isMe && "bg-primary/5")}>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-black shrink-0 overflow-hidden">
                {m.profile?.avatar_url ? <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn("text-sm font-bold block truncate", isMe && "text-primary")}>{name}{isMe && " (Você)"}</span>
                <span className="text-[10px] text-muted-foreground">{m.role === "admin" ? "Administrador" : "Membro"}</span>
              </div>
              {m.role === "admin" && <Crown className="w-4 h-4 text-primary" />}
              {isCreator && !isMe && m.role !== "admin" && (
                <button onClick={() => setConfirmRemove(m.user_id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!isCreator && (
        <button onClick={() => setConfirmLeave(true)} className="w-full glass-card p-3 flex items-center justify-center gap-2 text-sm font-bold text-destructive">
          <LogOut className="w-4 h-4" /> Sair do Bolão
        </button>
      )}

      <ConfirmDialog open={confirmLeave} onClose={() => setConfirmLeave(false)} onConfirm={doLeave}
        title="Sair do bolão?" description="Você perderá todos os seus palpites e não poderá mais ver o ranking. Esta ação não pode ser desfeita."
        confirmLabel="Sair mesmo assim" destructive />
      <ConfirmDialog open={confirmRemove !== null} onClose={() => setConfirmRemove(null)} onConfirm={doRemove}
        title="Remover membro?" description={`Deseja remover ${memberToRemove?.profile?.name || "este membro"} do bolão? Todos os palpites deles serão excluídos.`}
        confirmLabel="Remover" destructive />
    </div>
  );
}

// ─── Main Component ───
const tabs = [
  { id: "overview", label: "Visão Geral", icon: BarChart3 },
  { id: "palpites", label: "Palpites", icon: Trophy },
  { id: "ranking", label: "Ranking", icon: TrendingUp },
  { id: "membros", label: "Membros", icon: Users },
];

const BolaoDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [bolao, setBolao] = useState<BolaoData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { if (!id || !user) return; loadBolao(); }, [id, user]);

  const loadBolao = async () => {
    if (!id || !user) return;
    const [bolaoRes, membersRes, palpitesRes] = await Promise.all([
      supabase.from("boloes").select("*").eq("id", id).single(),
      supabase.from("bolao_members").select("user_id, role, joined_at, profiles(name, avatar_url)").eq("bolao_id", id),
      supabase.from("bolao_palpites").select("*").eq("bolao_id", id),
    ]);
    if (bolaoRes.data) setBolao(bolaoRes.data as BolaoData);
    if (membersRes.data) setMembers(membersRes.data.map((m: any) => ({ ...m, profile: m.profiles })));
    if (palpitesRes.data) setPalpites(palpitesRes.data as Palpite[]);
    setLoading(false);
  };

  if (loading) return (
    <div className="px-4 py-4 space-y-4">
      <Skeleton className="h-8 w-3/4" /><Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-9 flex-1 rounded-lg" />)}</div>
      <Skeleton className="h-40 rounded-xl" /><Skeleton className="h-32 rounded-xl" />
    </div>
  );

  if (!bolao) return <EmptyState icon="🔍" title="Bolão não encontrado" description="Este bolão não existe ou foi removido." />;

  const isCreator = bolao.creator_id === user?.id;

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--copa-success))]/20 text-[hsl(var(--copa-success))] font-bold uppercase">Copa 2026</span>
          {isCreator && <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold uppercase">Admin</span>}
        </div>
        <h1 className="text-xl font-black">{bolao.name}</h1>
        {bolao.description && <p className="text-xs text-muted-foreground mt-0.5">{bolao.description}</p>}
      </div>

      <div className="flex gap-1 bg-secondary/50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1",
              activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden min-[380px]:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {activeTab === "overview" && <OverviewTab bolao={bolao} members={members} isCreator={isCreator} palpites={palpites} userId={user!.id} onShare={() => setShareOpen(true)} />}
          {activeTab === "palpites" && <PalpitesTab bolaoId={bolao.id} palpites={palpites} setPalpites={setPalpites} userId={user!.id} bolaoChampionWinner={(bolao as any).champion_winner} />}
          {activeTab === "ranking" && <RankingTab members={members} palpites={palpites} championWinner={(bolao as any).champion_winner} />}
          {activeTab === "membros" && <MembrosTab members={members} userId={user!.id} isCreator={isCreator} bolaoId={bolao.id} onRefresh={loadBolao} />}
        </motion.div>
      </AnimatePresence>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} bolao={bolao} />
    </div>
  );
};

export default BolaoDetail;
