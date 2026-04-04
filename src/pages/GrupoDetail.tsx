import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Share2, Trophy } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSiteUrl } from "@/utils/site-url";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

interface Grupo { id: string; name: string; emoji: string; description: string|null; invite_code: string; creator_id: string; }
interface BolaoRow { id: string; name: string; avatar_url: string|null; invite_code: string; memberCount: number; }
interface MemberRow { user_id: string; role: string; }
interface RankingRow { user_id: string; display_name: string; total_points: number; bolao_count: number; }

export default function GrupoDetail() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [ranking, setRanking] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"boloes" | "ranking" | "membros">("boloes");

  const loadData = useCallback(async () => {
    if (!grupoId) return;
    setLoading(true);
    try {
      const gSnap = await getDoc(doc(db, "grupos", grupoId));
      if (!gSnap.exists()) { setLoading(false); return; }
      setGrupo({ id: gSnap.id, ...(gSnap.data() as Omit<Grupo, "id">) });

      const [boloesSnap, membersSnap] = await Promise.all([
        getDocs(query(collection(db, "boloes"), where("grupo_id", "==", grupoId))),
        getDocs(query(collection(db, "grupo_members"), where("grupo_id", "==", grupoId))),
      ]);
      setBoloes(boloesSnap.docs.map(d => {
        const data = d.data();
        return { id: d.id, name: data.name, avatar_url: data.avatar_url ?? null, invite_code: data.invite_code, memberCount: 0 };
      }));
      setMembers(membersSnap.docs.map(d => ({ user_id: d.data().user_id, role: d.data().role })));

      // Build simple aggregate ranking from bolao_members scores
      const memberIds = membersSnap.docs.map(d => d.data().user_id as string);
      const rankMap: Record<string, { total: number; bolaoCount: number; name: string }> = {};
      for (const bid of boloesSnap.docs.map(d => d.id)) {
        const pSnap = await getDocs(query(collection(db, "bolao_members"), where("bolao_id", "==", bid), where("user_id", "in", memberIds.slice(0, 10))));
        pSnap.docs.forEach(d => {
          const uid = d.data().user_id; const pts = d.data().total_points ?? 0;
          if (!rankMap[uid]) rankMap[uid] = { total: 0, bolaoCount: 0, name: uid };
          rankMap[uid].total += pts; rankMap[uid].bolaoCount += 1;
        });
      }
      setRanking(Object.entries(rankMap).sort((a, b) => b[1].total - a[1].total).map(([uid, v]) => ({
        user_id: uid, display_name: v.name, total_points: v.total, bolao_count: v.bolaoCount,
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [grupoId]);

  useEffect(() => { loadData(); }, [loadData]);

  const isCreator = grupo?.creator_id === user?.id;

  const handleShare = () => {
    if (!grupo) return;
    const url = `${getSiteUrl()}/grupos/entrar/${grupo.invite_code}`;
    if (navigator.share) { navigator.share({ title: grupo.name, url }); }
    else { navigator.clipboard.writeText(url); toast({ title: "Link copiado!" }); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!grupo) return <EmptyState icon="👥" title="Grupo não encontrado" description="Verifique o link ou volte para a lista." />;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-6 text-white">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button aria-label="Voltar" onClick={() => navigate("/grupos")}
            className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-[20px]">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-2xl">{grupo.emoji}</div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Grupo</p>
            <h1 className="text-3xl font-black">{grupo.name}</h1>
            {grupo.description && <p className="text-sm text-zinc-400">{grupo.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <button onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20 transition-colors">
            <Share2 className="h-4 w-4 text-primary" /> Convidar
          </button>
          
          {isCreator && (
            <Link to={`/criar-bolao?grupoId=${grupo.id}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-black hover:bg-primary/90 transition-colors">
              + CRIAR BOLÃO
            </Link>
          )}
        </div>
      </div>

      {/* Stats chips */}
      <div className="mb-6 flex flex-wrap gap-3 text-sm text-zinc-300">
        <div className="surface-chip rounded-full px-4 py-2">{members.length} membros</div>
        <div className="surface-chip rounded-full px-4 py-2">{boloes.length} bolões</div>
        <div className="surface-chip rounded-full px-4 py-2">Código: {grupo.invite_code}</div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(["boloes", "ranking", "membros"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-black" : "surface-card-soft text-zinc-400")}>
            {tab === "boloes" ? "⚽ Bolões" : tab === "ranking" ? "🏆 Ranking" : "👥 Membros"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="surface-card-strong rounded-[32px] p-4 md:p-6">
        {/* Bolões */}
        {activeTab === "boloes" && (
          <div className="space-y-3">
            {boloes.length === 0 && <EmptyState icon="⚽" title="Nenhum bolão ainda" description="Crie um bolão e vincule a este grupo." />}
            {boloes.map((b) => (
              <Link key={b.id} to={`/boloes/${b.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">{b.avatar_url || "⚽"}</div>
                <div className="flex-1">
                  <p className="font-black">{b.name}</p>
                  <p className="text-xs text-zinc-400">Código: {b.invite_code}</p>
                </div>
                <Trophy className="h-4 w-4 text-zinc-600" />
              </Link>
            ))}
          </div>
        )}

        {/* Ranking agregado */}
        {activeTab === "ranking" && (
          <div>
            {ranking.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">Ranking disponível quando houver palpites.</p>}
            {ranking.map((r, i) => (
              <div key={r.user_id} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
                <span className={cn("w-7 text-center font-black",
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-500")}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{r.display_name}</p>
                  <p className="text-xs text-zinc-400">{r.bolao_count} bolões</p>
                </div>
                <span className="font-black text-primary">{r.total_points} pts</span>
              </div>
            ))}
          </div>
        )}

        {/* Membros */}
        {activeTab === "membros" && (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-sm font-bold">{m.user_id.substring(0, 8)}…</p>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-black uppercase",
                  m.role === "admin" ? "bg-primary/20 text-primary" : "bg-white/10 text-zinc-400")}>
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
