import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Copy, Loader2, Plus, Search, Share2, Users2 } from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { getSiteUrl } from "@/utils/site-url";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

type GroupCard = {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  invite_code: string;
  visibility: "private" | "public";
  admission_mode: string;
  role: string;
};

type PendingRequest = {
  id: string;
  groupId: string;
  groupName: string;
  updatedAt: string | null;
};

export default function Grupos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const loadGroups = useCallback(async () => {
    if (!user?.id) {
      setGroups([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const membershipSnapshot = await getDocs(
        query(collection(db, "grupo_members"), where("user_id", "==", user.id)),
      );
      const memberships = membershipSnapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        grupo_id: String(docSnapshot.data().grupo_id),
        role: String(docSnapshot.data().role || "member"),
        membership_status: String(docSnapshot.data().membership_status || "active"),
      }));

      const loadedGroups = await Promise.all(
        memberships
          .filter((membership) => !["left", "removed"].includes(membership.membership_status))
          .map(async (membership) => {
          const snapshot = await getDoc(doc(db, "grupos", membership.grupo_id));
          if (!snapshot.exists()) {
            return null;
          }
          return {
            id: snapshot.id,
            name: String(snapshot.data().name || "Grupo"),
            description: (snapshot.data().description as string | null) ?? null,
            emoji: String(snapshot.data().emoji || "👥"),
            invite_code: String(snapshot.data().invite_code || ""),
            visibility:
              (snapshot.data().visibility as "private" | "public") ||
              (snapshot.data().category === "public" ? "public" : "private"),
            admission_mode: String(snapshot.data().admission_mode || "approval"),
            role: membership.role,
          } satisfies GroupCard;
          }),
      );

      const requestSnapshot = await getDocs(
        query(collection(db, "grupo_join_requests"), where("user_id", "==", user.id)),
      );
      const pending = requestSnapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
        .filter((request) => request.request_status === "pending");

      const pendingCards = await Promise.all(
        pending.map(async (request) => {
          const snapshot = await getDoc(doc(db, "grupos", String(request.grupo_id)));
          return {
            id: String(request.id),
            groupId: String(request.grupo_id),
            groupName: snapshot.exists() ? String(snapshot.data().name || "Grupo") : "Grupo",
            updatedAt: (request.updated_at as string | null) ?? null,
          };
        }),
      );

      setGroups(loadedGroups.filter(Boolean) as GroupCard[]);
      setPendingRequests(pendingCards);
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível carregar seus grupos",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  const pendingItems = useMemo(
    () =>
      pendingRequests.map((request) => ({
        id: request.id,
        title: request.groupName,
        subtitle: "Sua entrada está aguardando aprovação do grupo.",
        meta: request.updatedAt ? `Atualizado em ${new Date(request.updatedAt).toLocaleString("pt-BR")}` : null,
        status: "Pendente",
      })),
    [pendingRequests],
  );

  const invitationGroups = useMemo(
    () => groups.filter((group) => group.role === "admin"),
    [groups],
  );

  const spotlightMetrics = useMemo(
    () => [
      { label: "Meus grupos", value: groups.length },
      { label: "Pendentes", value: pendingRequests.length },
      { label: "Admin", value: invitationGroups.length },
    ],
    [groups.length, invitationGroups.length, pendingRequests.length],
  );

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      return;
    }

    try {
      setJoining(true);
      trackSocialEvent("join_cta_viewed", { source: "group_code_entry" });
      const result = await joinViaInvite({
        payload: {
          kind: "group",
          invite_code: joinCode.trim().toUpperCase(),
        },
      });

      if (result.status === "joined" || result.status === "already_member") {
        trackSocialEvent("join_direct_success", { kind: "group" });
        navigate(`/grupos/${result.group_id}`);
        return;
      }

      trackSocialEvent("join_requested", { kind: "group" });
      toast({
        title: "Solicitação enviada",
        description: "Agora é só aguardar a aprovação do grupo.",
      });
      setJoinCode("");
      void loadGroups();
    } catch {
      toast({
        title: "Não foi possível entrar",
        description: "Revise o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleCopyInvite = async (inviteCode: string) => {
    const url = `${getSiteUrl()}/grupos/entrar/${inviteCode}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link copiado",
      description: "Agora é só compartilhar com a galera.",
    });
  };

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="mb-7 p-5 sm:p-6">
        <ArenaSectionHeader
          eyebrow="Grupos"
          title="Comunidades organizadas sem ruído"
          action={
            <Link
              to="/grupos/criar"
              className="inline-flex items-center gap-2 rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              Criar grupo
            </Link>
          }
        />
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
          Aqui você organiza a comunidade. Depois decide qual bolão vai viver dentro dela, sem misturar governança com participação.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {spotlightMetrics.map((item, index) => (
            <ArenaMetric
              key={item.label}
              label={item.label}
              value={item.value}
              accent={index === 0}
              className="bg-black/20"
            />
          ))}
        </div>
      </ArenaPanel>

      <div className="grid gap-6">
        <ArenaPanel className="p-5">
          <ArenaSectionHeader eyebrow="Meus grupos" title="Onde sua comunidade já existe" />
          <p className="mt-3 text-sm leading-6 text-zinc-400">Os grupos em que você já participa e pode organizar a galera.</p>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Você ainda não participa de nenhum grupo"
              description="Crie o seu ou entre com um código."
              className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
              glowColor="green"
            />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {groups.map((group) => (
                <Link key={group.id} to={`/grupos/${group.id}`} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition hover:border-primary/20 hover:bg-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl">
                      {group.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-[1.4rem] font-semibold uppercase leading-none text-white">{group.name}</p>
                      {group.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{group.description}</p> : null}
                    </div>
                    <Users2 className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{group.visibility === "public" ? "Público" : "Privado"}</span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">{group.role === "admin" ? "Admin" : "Membro"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ArenaPanel>

        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <AdmissionInbox
            title="Solicitações pendentes"
            description="Tudo que ainda depende de aprovação do grupo fica aqui, separado da navegação principal."
            emptyTitle="Nada pendente agora"
            emptyDescription="Se você pedir entrada em um grupo privado, ele vai aparecer aqui."
            items={pendingItems}
          />

          <ArenaPanel className="p-5">
            <ArenaSectionHeader eyebrow="Código" title="Entrar com código" />
            <p className="mt-3 text-sm leading-6 text-zinc-400">Recebeu um código? Esse é o caminho curto.</p>
            <div className="mt-4 flex gap-2">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Código do grupo"
                className="flex-1 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.2em] text-white placeholder:text-zinc-500"
              />
              <button
                onClick={() => void handleJoinByCode()}
                disabled={joining || joinCode.trim().length < 6}
                className="inline-flex items-center justify-center rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105 disabled:opacity-50"
              >
                {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </div>
          </ArenaPanel>
        </div>

        <ArenaPanel className="p-5">
          <ArenaSectionHeader eyebrow="Convites" title="Compartilhar sem procurar em menus" />
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Se você administra um grupo, compartilhe o link certo sem precisar cavar menus.
          </p>

          {invitationGroups.length === 0 ? (
            <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-7">
              <p className="font-display text-[1.35rem] font-semibold uppercase leading-none text-white">Você ainda não administra nenhum grupo</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Quando criar um grupo, os atalhos de convite aparecem aqui.</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {invitationGroups.map((group) => (
                <div key={group.id} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl">
                      {group.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-[1.4rem] font-semibold uppercase leading-none text-white">{group.name}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {group.visibility === "public" ? "Entrada pública por link ou código." : "Entrada por solicitação e aprovação."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => void handleCopyInvite(group.invite_code)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.06]"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar link
                    </button>
                    <button
                      onClick={() => void handleCopyInvite(group.invite_code)}
                      className="inline-flex items-center justify-center rounded-[18px] bg-primary px-4 py-3 text-black transition hover:brightness-105"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ArenaPanel>

        <ArenaPanel className="p-5">
          <ArenaSectionHeader
            eyebrow="Criar grupo"
            title="Montar a comunidade antes do bolão"
            action={
              <Link
                to="/grupos/criar"
                className="inline-flex items-center gap-2 rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Abrir fluxo
              </Link>
            }
          />
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Monte a comunidade primeiro e só depois escolha se ela já nasce com um bolão.
          </p>
        </ArenaPanel>
      </div>
    </div>
  );
}
