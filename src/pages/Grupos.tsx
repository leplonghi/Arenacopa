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
import { tStatic } from "@/i18n/staticText";

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
            name: String(snapshot.data().name || "Comunidade"),
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
            groupName: snapshot.exists() ? String(snapshot.data().name || "Comunidade") : "Comunidade",
            updatedAt: (request.updated_at as string | null) ?? null,
          };
        }),
      );

      setGroups(loadedGroups.filter(Boolean) as GroupCard[]);
      setPendingRequests(pendingCards);
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível carregar suas comunidades",
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
        subtitle: "Sua entrada está aguardando aprovação da comunidade.",
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
      { label: "Comunidades", value: groups.length },
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
        navigate(`/comunidades/${result.group_id}`);
        return;
      }

      trackSocialEvent("join_requested", { kind: "group" });
      toast({
        title: "Solicitação enviada",
        description: "Agora é só aguardar a aprovação da comunidade.",
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
      description: "Agora é só compartilhar com a turma.",
    });
  };

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="mb-7 p-5 sm:p-6">
        <ArenaSectionHeader
          eyebrow="Comunidades"
          title="Suas comunidades"
          hint="Comunidades servem para reunir a mesma turma em vários bolões. Se você quer só uma disputa rápida, crie um bolão avulso."
          action={
            <Link
              to="/comunidades/criar"
              className="inline-flex items-center gap-2 rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              Criar comunidade
            </Link>
          }
        />

        <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-zinc-200">
          Comunidade é sua base recorrente. Crie vários bolões com a mesma turma ao longo da temporada.
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
          <ArenaSectionHeader
            eyebrow="Minhas comunidades"
            title="Turmas recorrentes"
            hint="Comunidades em que você participa ou administra. Dentro de cada comunidade você pode destacar bolões e controlar pedidos de entrada."
          />

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Você ainda não participa de nenhuma comunidade"
              description="Crie o seu ou entre com um código."
              className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
              glowColor="green"
            />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {groups.map((group) => (
                <Link key={group.id} to={`/comunidades/${group.id}`} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition hover:border-primary/20 hover:bg-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl">
                      {group.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="truncate font-display text-[1.4rem] font-semibold uppercase leading-none text-white">{group.name}</p>
                      {group.description ? <p className="mt-2 line-clamp-2 text-sm leading-snug text-zinc-400">{group.description}</p> : null}
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
            title="Pedidos"
            description="Pedidos de entrada em comunidades privadas ficam aqui."
            emptyTitle="Nada pendente agora"
            emptyDescription="Pedidos para comunidades privadas aparecem aqui."
            items={pendingItems}
          />

          <ArenaPanel className="p-5">
            <ArenaSectionHeader
              eyebrow="Código"
              title="Entrar rápido"
              hint="Cole o código da comunidade. Em comunidade privada, o pedido vai para aprovação do admin."
            />
            <div className="mt-4 flex gap-2">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Código da comunidade"
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
          <ArenaSectionHeader
            eyebrow="Convites"
            title="Chamar a turma"
            hint="Admins copiam o link certo daqui. O link deixa claro se a pessoa entra direto ou precisa pedir aprovação."
          />

          {invitationGroups.length === 0 ? (
            <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-7">
              <p className="font-display text-[1.35rem] font-semibold uppercase leading-none text-white">{tStatic("Você ainda não administra nenhuma comunidade")}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{tStatic("Quando criar uma comunidade, os atalhos de convite aparecem aqui.")}</p>
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
            eyebrow="Criar comunidade"
            title="Nova turma"
            hint="Crie a comunidade primeiro quando quiser controlar membros, aprovar entradas e reunir vários bolões no mesmo lugar."
            action={
              <Link
                to="/comunidades/criar"
                className="inline-flex items-center gap-2 rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
              >
                <Plus className="h-4 w-4" />
                Abrir fluxo
              </Link>
            }
          />
        </ArenaPanel>
      </div>
    </div>
  );
}
