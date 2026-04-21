import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Share2, Trophy } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSiteUrl } from "@/utils/site-url";
import { cn } from "@/lib/utils";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { EmptyState } from "@/components/EmptyState";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { useTranslation } from "react-i18next";
import { BolaoEntryGuidance } from "@/features/boloes/shared/BolaoEntryGuidance";

interface Grupo { id: string; name: string; emoji: string; description: string|null; invite_code: string; creator_id: string; }
interface BolaoRow { id: string; name: string; avatar_url: string|null; invite_code: string; memberCount: number; }
interface MemberRow { user_id: string; role: string; display_name: string; }
interface RankingRow { user_id: string; display_name: string; total_points: number; bolao_count: number; }

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

export default function GrupoDetail() {
  const { t } = useTranslation(["bolao", "common"]);
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
      const memberIds = membersSnap.docs.map((memberDoc) => memberDoc.data().user_id as string);
      const profilesMap = await getPublicProfilesByIds(memberIds);
      setBoloes(boloesSnap.docs.map(d => {
        const data = d.data();
        return { id: d.id, name: data.name, avatar_url: data.avatar_url ?? null, invite_code: data.invite_code, memberCount: 0 };
      }));
      setMembers(membersSnap.docs.map((memberDoc) => {
        const userId = memberDoc.data().user_id as string;
        const profile = profilesMap.get(userId);
        return {
          user_id: userId,
          role: memberDoc.data().role,
          display_name: profile?.nickname || profile?.name || userId,
        };
      }));

      // Firestore only allows up to 10 values in an "in" filter, so we batch members.
      const rankMap: Record<string, { total: number; bolaoCount: number; name: string }> = {};
      const bolaoIds = boloesSnap.docs.map(d => d.id);
      const memberIdChunks = chunkArray(memberIds, 10);

      if (bolaoIds.length > 0 && memberIdChunks.length > 0) {
        const rankingSnapshots = await Promise.all(
          bolaoIds.flatMap((bolaoId) =>
            memberIdChunks.map((memberChunk) =>
              getDocs(
                query(
                  collection(db, "bolao_rankings"),
                  where("bolao_id", "==", bolaoId),
                  where("user_id", "in", memberChunk),
                ),
              ),
            ),
          ),
        );

        rankingSnapshots.forEach((snapshot) => {
          snapshot.docs.forEach((rankingDoc) => {
            const uid = rankingDoc.data().user_id;
            const pts = rankingDoc.data().total_points ?? 0;

            if (!rankMap[uid]) rankMap[uid] = { total: 0, bolaoCount: 0, name: uid };
            rankMap[uid].total += pts;
            rankMap[uid].bolaoCount += 1;
            rankMap[uid].name = profilesMap.get(uid)?.nickname || profilesMap.get(uid)?.name || uid;
          });
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
    else { navigator.clipboard.writeText(url); toast({ title: t("common:actions.link_copied", { defaultValue: "Link copiado!" }) }); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!grupo) return <EmptyState icon="👥" title={t("bolao:grupos.not_found_title", { defaultValue: "Grupo não encontrado" })} description={t("bolao:grupos.not_found_desc", { defaultValue: "Verifique o link ou volte para a lista." })} />;

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
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t("bolao:grupos.group_label", { defaultValue: "Grupo" })}</p>
            <h1 className="text-3xl font-black">{grupo.name}</h1>
            {grupo.description && <p className="text-sm text-zinc-400">{grupo.description}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
          <button onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20 transition-colors">
            <Share2 className="h-4 w-4 text-primary" /> {t("bolao:grupos.invite_action", { defaultValue: "Convidar" })}
          </button>
          
          {isCreator && (
            <Link to={`/boloes/criar?grupoId=${grupo.id}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-black hover:bg-primary/90 transition-colors">
              {t("bolao:grupos.create_pool_action", { defaultValue: "Criar bolão" })}
            </Link>
          )}
        </div>
      </div>

      {/* Stats chips */}
      <div className="mb-6 flex flex-wrap gap-3 text-sm text-zinc-300">
        <div className="surface-chip rounded-full px-4 py-2">{t("bolao:grupos.members_count", { count: members.length })}</div>
        <div className="surface-chip rounded-full px-4 py-2">{t("bolao:grupos.pools_count", { count: boloes.length })}</div>
        <div className="surface-chip rounded-full px-4 py-2">{t("bolao:page.code_label", { code: grupo.invite_code })}</div>
      </div>

      <div className="mb-6">
        <BolaoEntryGuidance groupId={grupo.id} groupName={grupo.name} />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        {(["boloes", "ranking", "membros"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-black" : "surface-card-soft text-zinc-400")}>
            {tab === "boloes" ? `⚽ ${t("bolao:page.tabs_boloes")}` : tab === "ranking" ? `🏆 ${t("bolao:page.tabs_ranking")}` : `👥 ${t("bolao:bolao_detail.members_tab", { defaultValue: "Membros" })}`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="surface-card-strong rounded-[32px] p-4 md:p-6">
        {/* Bolões */}
        {activeTab === "boloes" && (
          <div className="space-y-3">
            {boloes.length === 0 && <EmptyState icon="⚽" title={t("bolao:grupos.no_pools_title", { defaultValue: "Nenhum bolão ainda" })} description={t("bolao:grupos.no_pools_desc", { defaultValue: "Crie um bolão e vincule a este grupo." })} />}
            {boloes.map((b) => (
              <Link key={b.id} to={`/boloes/${b.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 hover:bg-white/10 transition-colors">
                <BolaoAvatar
                  avatarUrl={b.avatar_url}
                  fallback="⚽"
                  alt={b.name}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl"
                />
                <div className="flex-1">
                  <p className="font-black">{b.name}</p>
                  <p className="text-xs text-zinc-400">{t("bolao:page.code_label", { code: b.invite_code })}</p>
                </div>
                <Trophy className="h-4 w-4 text-zinc-600" />
              </Link>
            ))}
          </div>
        )}

        {/* Ranking agregado */}
        {activeTab === "ranking" && (
          <div>
            {ranking.length === 0 && <p className="py-8 text-center text-sm text-zinc-500">{t("bolao:grupos.ranking_empty", { defaultValue: "Ranking disponível quando houver palpites." })}</p>}
            {ranking.map((r, i) => (
              <div key={r.user_id} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
                <span className={cn("w-7 text-center font-black",
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-orange-400" : "text-zinc-500")}>
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{r.display_name}</p>
                  <p className="text-xs text-zinc-400">{t("bolao:grupos.pools_count", { count: r.bolao_count })}</p>
                </div>
                <span className="font-black text-primary">{r.total_points} {t("bolao:ranking.points_abbr")}</span>
              </div>
            ))}
          </div>
        )}

        {/* Membros */}
        {activeTab === "membros" && (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{m.display_name}</p>
                  <p className="text-xs text-zinc-500">{m.user_id.substring(0, 8)}…</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-black uppercase",
                  m.role === "admin" ? "bg-primary/20 text-primary" : "bg-white/10 text-zinc-400")}>
                  {m.role === "admin"
                    ? t("bolao:members.role.admin", { defaultValue: "Administrador" })
                    : t("bolao:members.role.member", { defaultValue: "Membro" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
