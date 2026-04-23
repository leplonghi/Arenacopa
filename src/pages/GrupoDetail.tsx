import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, LogOut, Share2, Star, UserMinus } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getSiteUrl } from "@/utils/site-url";
import { EmptyState } from "@/components/EmptyState";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { FeaturedBolaoCard } from "@/features/groups/FeaturedBolaoCard";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import {
  approveGroupJoin,
  leaveGroup,
  rejectGroupJoin,
  removeGroupMember,
  setFeaturedGroupBolao,
} from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";

type GroupData = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  invite_code: string;
  creator_id: string;
  visibility: "private" | "public";
  featured_bolao_id: string | null;
};

type BolaoRow = {
  id: string;
  name: string;
  avatar_url: string | null;
  invite_code: string;
  description: string | null;
  category: "public" | "private";
  is_paid: boolean;
  status: string;
};

type MemberRow = {
  user_id: string;
  role: string;
  display_name: string;
};

type RequestRow = {
  id: string;
  user_id: string;
  request_status: string;
  created_at: string | null;
  updated_at: string | null;
  display_name: string;
};

export default function GrupoDetail() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [grupo, setGrupo] = useState<GroupData | null>(null);
  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!grupoId) {
      return;
    }

    setLoading(true);
    try {
      const gSnap = await getDoc(doc(db, "grupos", grupoId));
      if (!gSnap.exists()) {
        setGrupo(null);
        setLoading(false);
        return;
      }

      const groupData = {
        id: gSnap.id,
        name: String(gSnap.data().name || "Grupo"),
        emoji: String(gSnap.data().emoji || "👥"),
        description: (gSnap.data().description as string | null) ?? null,
        invite_code: String(gSnap.data().invite_code || ""),
        creator_id: String(gSnap.data().creator_id || ""),
        visibility:
          (gSnap.data().visibility as "private" | "public") ||
          (gSnap.data().category === "public" ? "public" : "private"),
        featured_bolao_id: (gSnap.data().featured_bolao_id as string | null) ?? null,
      } satisfies GroupData;
      setGrupo(groupData);

      const [boloesSnap, membersSnap, requestSnap] = await Promise.all([
        getDocs(query(collection(db, "boloes"), where("grupo_id", "==", grupoId))),
        getDocs(query(collection(db, "grupo_members"), where("grupo_id", "==", grupoId))),
        getDocs(query(collection(db, "grupo_join_requests"), where("grupo_id", "==", grupoId))),
      ]);

      const activeMemberDocs = membersSnap.docs.filter((memberDoc) => {
        const membershipStatus = String(memberDoc.data().membership_status || "active");
        return !["left", "removed"].includes(membershipStatus);
      });

      const memberIds = activeMemberDocs.map((memberDoc) => String(memberDoc.data().user_id));
      const requestUserIds = requestSnap.docs.map((requestDoc) => String(requestDoc.data().user_id));
      const profilesMap = await getPublicProfilesByIds(Array.from(new Set([...memberIds, ...requestUserIds])));

      setBoloes(
        boloesSnap.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          name: String(docSnapshot.data().name || "Bolão"),
          avatar_url: (docSnapshot.data().avatar_url as string | null) ?? null,
          invite_code: String(docSnapshot.data().invite_code || ""),
          description: (docSnapshot.data().description as string | null) ?? null,
          category: (docSnapshot.data().category as "public" | "private") || "private",
          is_paid: Boolean(docSnapshot.data().is_paid),
          status: String(docSnapshot.data().status || "open"),
        })),
      );
      setMembers(
        activeMemberDocs.map((memberDoc) => {
          const userId = String(memberDoc.data().user_id);
          const profile = profilesMap.get(userId);
          return {
            user_id: userId,
            role: String(memberDoc.data().role || "member"),
            display_name: profile?.nickname || profile?.name || userId,
          };
        }),
      );
      setRequests(
        requestSnap.docs
          .map((requestDoc) => {
            const userId = String(requestDoc.data().user_id);
            const profile = profilesMap.get(userId);
            return {
              id: requestDoc.id,
              user_id: userId,
              request_status: String(requestDoc.data().request_status || "pending"),
              created_at: (requestDoc.data().created_at as string | null) ?? null,
              updated_at: (requestDoc.data().updated_at as string | null) ?? null,
              display_name: profile?.nickname || profile?.name || userId,
            };
          })
          .filter((request) => request.request_status === "pending"),
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível carregar o grupo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [grupoId, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const myMember = useMemo(
    () => members.find((member) => member.user_id === user?.id),
    [members, user?.id],
  );
  const isManager = Boolean(grupo && (grupo.creator_id === user?.id || myMember?.role === "admin"));

  const featuredBolao = useMemo(() => {
    if (!grupo) {
      return null;
    }

    if (grupo.featured_bolao_id) {
      const explicit = boloes.find((bolao) => bolao.id === grupo.featured_bolao_id);
      if (explicit) {
        return explicit;
      }
    }

    return boloes.find((bolao) => ["open", "active"].includes(bolao.status)) || boloes[0] || null;
  }, [boloes, grupo]);

  const requestItems = useMemo(
    () =>
      requests.map((request) => ({
        id: request.id,
        title: request.display_name,
        subtitle: "Quer entrar neste grupo.",
        meta: request.updated_at ? `Atualizado em ${new Date(request.updated_at).toLocaleString("pt-BR")}` : null,
        status: "Pendente",
        primaryActionLabel: "Aprovar",
        secondaryActionLabel: "Recusar",
        onPrimaryAction: () =>
          void (async () => {
            try {
              await approveGroupJoin({
                payload: {
                  group_id: grupoId || "",
                  request_id: request.id,
                },
              });
              const latencyMinutes = request.created_at
                ? Math.max(Math.round((Date.now() - new Date(request.created_at).getTime()) / 60000), 0)
                : null;
              trackSocialEvent("approval_completed", { kind: "group" });
              if (latencyMinutes != null) {
                trackSocialEvent("approval_latency", {
                  kind: "group",
                  latency_minutes: latencyMinutes,
                });
              }
              toast({ title: "Solicitação aprovada" });
              void loadData();
            } catch {
              toast({
                title: "Não foi possível aprovar",
                variant: "destructive",
              });
            }
          })(),
        onSecondaryAction: () =>
          void (async () => {
            try {
              await rejectGroupJoin({
                payload: {
                  group_id: grupoId || "",
                  request_id: request.id,
                },
              });
              toast({ title: "Solicitação recusada" });
              void loadData();
            } catch {
              toast({
                title: "Não foi possível recusar",
                variant: "destructive",
              });
            }
          })(),
      })),
    [grupoId, loadData, requests, toast],
  );

  const handleShare = async () => {
    if (!grupo) {
      return;
    }
    const url = `${getSiteUrl()}/grupos/entrar/${grupo.invite_code}`;
    if (navigator.share) {
      await navigator.share({ title: grupo.name, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    toast({ title: "Link copiado" });
  };

  const handleFeature = async (bolaoId: string | null) => {
    if (!grupoId) {
      return;
    }

    try {
      await setFeaturedGroupBolao({
        payload: {
          group_id: grupoId,
          bolao_id: bolaoId,
        },
      });
      toast({ title: "Bolão em destaque atualizado" });
      void loadData();
    } catch {
      toast({
        title: "Não foi possível atualizar o destaque",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async () => {
    if (!grupoId) {
      return;
    }

    try {
      await leaveGroup({
        payload: {
          group_id: grupoId,
        },
      });
      toast({ title: "Você saiu do grupo" });
      navigate("/grupos");
    } catch {
      toast({
        title: "Não foi possível sair",
        description: "Verifique se você não é o criador do grupo.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!grupoId) {
      return;
    }

    try {
      await removeGroupMember({
        payload: {
          group_id: grupoId,
          member_id: `${memberUserId}_${grupoId}`,
          reason_code: "group_admin_removed_member",
        },
      });
      toast({ title: "Membro removido" });
      void loadData();
    } catch {
      toast({
        title: "Não foi possível remover",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!grupo) {
    return <EmptyState icon="👥" title="Grupo não encontrado" description="Verifique o link ou volte para a lista." />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Voltar"
            onClick={() => navigate("/grupos")}
            className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-white/5"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-primary/10 text-2xl">{grupo.emoji}</div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Grupo</p>
            <h1 className="text-3xl font-black">{grupo.name}</h1>
            {grupo.description ? <p className="text-sm text-zinc-400">{grupo.description}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"
          >
            <Share2 className="h-4 w-4 text-primary" />
            Convidar
          </button>
          {isManager ? (
            <Link
              to={`/boloes/criar?grupoId=${grupo.id}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-widest text-black"
            >
              Criar bolão
            </Link>
          ) : (
            <button
              onClick={() => void handleLeaveGroup()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-white"
            >
              <LogOut className="h-4 w-4 text-primary" />
              Sair do grupo
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <FeaturedBolaoCard bolao={featuredBolao} />

        {isManager ? (
          <AdmissionInbox
            title="Solicitações para entrar"
            description="Aqui ficam só as entradas pendentes, sem misturar com os bolões do grupo."
            emptyTitle="Nenhuma solicitação pendente"
            emptyDescription="Quando alguém pedir entrada, ela aparece aqui."
            items={requestItems}
          />
        ) : null}

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Bolões do grupo</p>
          <p className="mt-2 text-sm text-zinc-400">
            O grupo pode ter vários bolões, mas só um fica em destaque para não poluir a experiência.
          </p>

          {boloes.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon="⚽" title="Nenhum bolão ainda" description="Crie um bolão e vincule a este grupo." />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {boloes.map((bolao) => {
                const isFeatured = featuredBolao?.id === bolao.id;
                return (
                  <div key={bolao.id} className="rounded-3xl border border-white/10 bg-[#0c1811] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/boloes/${bolao.id}`} className="flex-1">
                        <p className="font-black">{bolao.name}</p>
                        {bolao.description ? <p className="mt-1 text-sm text-zinc-400">{bolao.description}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                          <span className="rounded-full bg-white/10 px-3 py-1">{bolao.category === "public" ? "Público" : "Privado"}</span>
                          {bolao.is_paid ? <span className="rounded-full bg-white/10 px-3 py-1">Pago</span> : null}
                        </div>
                      </Link>
                      {isManager ? (
                        <button
                          onClick={() => void handleFeature(isFeatured ? null : bolao.id)}
                          className={`rounded-2xl p-3 ${isFeatured ? "bg-primary text-black" : "bg-white/10 text-white"}`}
                        >
                          <Star className={`h-4 w-4 ${isFeatured ? "fill-current" : ""}`} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Membros</p>
          <div className="mt-4 space-y-2">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center justify-between rounded-2xl bg-[#0c1811] px-4 py-3">
                <div>
                  <p className="text-sm font-bold">{member.display_name}</p>
                  <p className="text-xs text-zinc-500">{member.user_id.substring(0, 8)}…</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                    {member.role === "admin" ? "Admin" : "Membro"}
                  </span>
                  {isManager && member.user_id !== grupo.creator_id && member.user_id !== user?.id ? (
                    <button
                      onClick={() => void handleRemoveMember(member.user_id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
