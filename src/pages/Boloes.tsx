import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Plus, Search, Trophy } from "lucide-react";
import { collection, doc, documentId, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { BolaoEntryGuidance } from "@/features/boloes/shared/BolaoEntryGuidance";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

type BolaoCard = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  avatar_url: string | null;
  category: "public" | "private";
  is_paid: boolean;
  status: string;
};

type RequestCard = {
  id: string;
  bolaoId: string;
  bolaoName: string;
  requestStatus: string;
  updatedAt: string | null;
};

function chunk<T>(values: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    groups.push(values.slice(index, index + size));
  }
  return groups;
}

export default function Boloes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myBoloes, setMyBoloes] = useState<BolaoCard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RequestCard[]>([]);
  const [discoverBoloes, setDiscoverBoloes] = useState<BolaoCard[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setMyBoloes([]);
      setPendingRequests([]);
      setDiscoverBoloes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const membershipSnapshot = await getDocs(
        query(collection(db, "bolao_members"), where("user_id", "==", user.id)),
      );
      const bolaoIds = Array.from(
        new Set(
          membershipSnapshot.docs
            .filter((docSnapshot) => {
              const membershipStatus = String(docSnapshot.data().membership_status || "active");
              return !["left", "removed", "withdrawn_by_owner"].includes(membershipStatus);
            })
            .map((docSnapshot) => docSnapshot.data().bolao_id as string),
        ),
      );

      const myBoloesDocs = await Promise.all(
        chunk(bolaoIds, 30).map(async (ids) => {
          if (!ids.length) {
            return [];
          }
          const snapshot = await getDocs(
            query(collection(db, "boloes"), where(documentId(), "in", ids)),
          );
          return snapshot.docs;
        }),
      );

      const mine = myBoloesDocs
        .flat()
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          name: String(docSnapshot.data().name || "Bolão"),
          description: (docSnapshot.data().description as string | null) ?? null,
          invite_code: String(docSnapshot.data().invite_code || ""),
          avatar_url: (docSnapshot.data().avatar_url as string | null) ?? null,
          category: (docSnapshot.data().category as "public" | "private") || "private",
          is_paid: Boolean(docSnapshot.data().is_paid),
          status: String(docSnapshot.data().status || "open"),
        }))
        .sort((left, right) => right.id.localeCompare(left.id));

      const requestSnapshot = await getDocs(
        query(collection(db, "bolao_join_requests"), where("user_id", "==", user.id)),
      );
      const pending = requestSnapshot.docs
        .map((docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() }))
        .filter((request) => request.request_status === "pending");

      const pendingBolaoDocs = await Promise.all(
        pending.map(async (request) => {
          const poolSnapshot = await getDocs(
            query(collection(db, "boloes"), where(documentId(), "==", request.bolao_id)),
          );
          const poolDoc = poolSnapshot.docs[0];
          return {
            id: request.id,
            bolaoId: String(request.bolao_id),
            bolaoName: poolDoc ? String(poolDoc.data().name || "Bolão") : "Bolão",
            requestStatus: String(request.request_status || "pending"),
            updatedAt: (request.updated_at as string | null) ?? null,
          };
        }),
      );

      const publicSnapshot = await getDocs(
        query(collection(db, "boloes"), where("category", "==", "public"), orderBy("created_at", "desc"), limit(12)),
      );
      const discover = publicSnapshot.docs
        .filter((docSnapshot) => !bolaoIds.includes(docSnapshot.id))
        .map((docSnapshot) => ({
          id: docSnapshot.id,
          name: String(docSnapshot.data().name || "Bolão"),
          description: (docSnapshot.data().description as string | null) ?? null,
          invite_code: String(docSnapshot.data().invite_code || ""),
          avatar_url: (docSnapshot.data().avatar_url as string | null) ?? null,
          category: "public" as const,
          is_paid: Boolean(docSnapshot.data().is_paid),
          status: String(docSnapshot.data().status || "open"),
        }));

      setMyBoloes(mine);
      setPendingRequests(pendingBolaoDocs);
      setDiscoverBoloes(discover);
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível carregar seus bolões",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const requestItems = useMemo(
    () =>
      pendingRequests.map((request) => ({
        id: request.id,
        title: request.bolaoName,
        subtitle: "Sua entrada está aguardando aprovação do criador.",
        meta: request.updatedAt ? `Atualizado em ${new Date(request.updatedAt).toLocaleString("pt-BR")}` : null,
        status: "Pendente",
      })),
    [pendingRequests],
  );

  const spotlightMetrics = useMemo(
    () => [
      { label: "Ativos", value: myBoloes.length },
      { label: "Pendentes", value: pendingRequests.length },
      { label: "Descobrir", value: discoverBoloes.length },
    ],
    [discoverBoloes.length, myBoloes.length, pendingRequests.length],
  );

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      return;
    }

    try {
      setJoining(true);
      trackSocialEvent("join_cta_viewed", { source: "pool_code_entry" });
      const result = await joinViaInvite({
        payload: {
          kind: "bolao",
          invite_code: joinCode.trim().toUpperCase(),
        },
      });

      if (result.status === "joined" || result.status === "already_member") {
        trackSocialEvent("join_direct_success", { kind: "bolao" });
        navigate(`/boloes/${result.bolao_id}`);
        return;
      }

      trackSocialEvent("join_requested", { kind: "bolao" });
      toast({
        title: "Solicitação enviada",
        description: "Agora é só aguardar a aprovação do criador.",
      });
      setJoinCode("");
      void loadData();
    } catch (error) {
      toast({
        title: "Não foi possível entrar",
        description:
          error instanceof Error && error.message === "join_requires_group"
            ? "Esse bolão exige entrada prévia no grupo vinculado."
            : "Revise o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="arena-screen">
      <ArenaPanel tone="strong" className="mb-7 p-5 sm:p-6">
        <ArenaSectionHeader
          eyebrow="Bolões"
          title="Entrar, descobrir e criar sem confusão"
          action={
            <Link
              to="/boloes/criar"
              className="inline-flex items-center gap-2 rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              Criar bolão
            </Link>
          }
        />
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
          Seus bolões ficam aqui. Entrada, descoberta e criação agora aparecem em blocos separados, com menos ruído e mais contexto.
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
          <ArenaSectionHeader eyebrow="Meus bolões" title="Onde você já está jogando" />
          <p className="mt-3 text-sm leading-6 text-zinc-400">Os bolões em que você já está dentro e pode agir agora.</p>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : myBoloes.length === 0 ? (
            <EmptyState
              icon="⚽"
              title="Você ainda não participa de nenhum bolão"
              description="Entre por convite, código ou crie o seu."
              className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
              glowColor="green"
            />
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {myBoloes.map((bolao) => (
                <Link key={bolao.id} to={`/boloes/${bolao.id}`} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition hover:border-primary/20 hover:bg-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <BolaoAvatar
                      avatarUrl={bolao.avatar_url}
                      fallback="⚽"
                      alt={bolao.name}
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl"
                    />
                    <div className="flex-1">
                      <p className="font-display text-[1.4rem] font-semibold uppercase leading-none text-white">{bolao.name}</p>
                      {bolao.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{bolao.description}</p> : null}
                    </div>
                    <Trophy className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{bolao.category === "public" ? "Público" : "Privado"}</span>
                    {bolao.is_paid ? <span className="rounded-full border border-[#ffc54d]/20 bg-[#ffc54d]/10 px-3 py-1 text-[#ffc54d]">Pago</span> : null}
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">{bolao.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ArenaPanel>

        <div className="grid items-start gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <AdmissionInbox
            title="Convites e solicitações"
            description="Tudo que depende de aprovação ou está esperando uma resposta fica aqui."
            emptyTitle="Nada pendente agora"
            emptyDescription="Quando você pedir entrada em um bolão privado, ele vai aparecer aqui."
            items={requestItems}
          />

          <ArenaPanel className="p-5">
            <ArenaSectionHeader eyebrow="Código" title="Entrar com código" />
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Se alguém te mandou um código, aqui é o caminho mais rápido.
            </p>

            <div className="mt-4 flex gap-2">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Código do bolão"
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
          <ArenaSectionHeader eyebrow="Descobrir" title="Bolões abertos para encontrar" />
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Aqui entram só os bolões públicos ou abertos para descoberta, sem misturar com os seus.
          </p>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
          ) : discoverBoloes.length === 0 ? (
            <EmptyState
              icon="🌍"
              title="Nenhum bolão público disponível agora"
              description="Quando aparecer algum bolão aberto, ele vai surgir aqui."
              className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
              glowColor="gold"
            />
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {discoverBoloes.map((bolao) => (
                <div key={bolao.id} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <BolaoAvatar
                      avatarUrl={bolao.avatar_url}
                      fallback="⚽"
                      alt={bolao.name}
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl"
                    />
                    <div>
                      <p className="font-display text-[1.4rem] font-semibold uppercase leading-none text-white">{bolao.name}</p>
                      {bolao.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{bolao.description}</p> : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Público</span>
                    {bolao.is_paid ? <span className="rounded-full border border-[#ffc54d]/20 bg-[#ffc54d]/10 px-3 py-1 text-[#ffc54d]">Pago</span> : null}
                  </div>
                  <Link
                    to={`/b/${bolao.invite_code}`}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.06]"
                  >
                    Ver entrada
                  </Link>
                </div>
              ))}
            </div>
          )}
        </ArenaPanel>

        <ArenaPanel className="p-5">
          <BolaoEntryGuidance />
        </ArenaPanel>
      </div>
    </div>
  );
}
