import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Loader2, Plus, Search, Sparkles, Store, Trophy, Users2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { BolaoEntryGuidance } from "@/features/boloes/shared/BolaoEntryGuidance";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { ArenaHint, ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import { getBolaoCardShellClass } from "@/features/boloes/listing/bolaoCardVisuals";
import { useOpportunities } from "@/hooks/useOpportunities";
import { listUserBoloes, type BolaoListingCard, type BolaoListingRequestCard } from "@/services/boloes/bolao-listing.service";

export default function Boloes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myBoloes, setMyBoloes] = useState<BolaoListingCard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BolaoListingRequestCard[]>([]);
  const [discoverBoloes, setDiscoverBoloes] = useState<BolaoListingCard[]>([]);
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
      const listing = await listUserBoloes();
      setMyBoloes(listing.myBoloes);
      setPendingRequests(listing.pendingRequests);
      setDiscoverBoloes(listing.discoverBoloes);
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
  const opportunities = useOpportunities({
    user,
    activeBoloes: myBoloes,
    surface: "boloes",
  });

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
            : error instanceof Error && error.message === "commercial_participant_limit_reached"
              ? "Este pacote atingiu o limite de participantes."
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
          title="Escolha seu caminho"
          hint="Crie bolões sociais para sua turma ou siga para negócios quando a intenção for campanha, ativação comercial ou público externo."
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-primary/35 bg-[linear-gradient(145deg,rgba(145,255,59,0.14),rgba(255,197,77,0.08),rgba(0,0,0,0.18))] p-5 shadow-[0_0_0_1px_rgba(145,255,59,0.08)]">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
                    <Users2 className="h-5 w-5" />
                  </span>
                  <h3 className="break-words font-display text-[1.7rem] font-bold uppercase leading-tight tracking-[0.02em] text-white [overflow-wrap:anywhere]">
                    Bolão da turma
                  </h3>
                  <ArenaHint label="Sobre bolão da turma">
                    Para amigos, família, comunidade ou grupo recorrente. O foco é convidar pessoas, registrar palpites e acompanhar ranking.
                  </ArenaHint>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-300">
                  Crie uma disputa social, escolha quem entra e publique o convite para a galera palpitar.
                </p>
              </div>
            </div>
            <Link
              to="/boloes/criar"
              aria-label="Criar bolão da turma"
              className="mt-5 inline-flex w-full min-w-0 items-center justify-center gap-2 whitespace-normal rounded-[20px] bg-primary px-5 py-4 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-black transition hover:brightness-105 sm:w-auto"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Criar bolão da turma
            </Link>
          </div>

          <div className="rounded-[28px] border border-[#ffc54d]/25 bg-[linear-gradient(145deg,rgba(255,197,77,0.12),rgba(255,255,255,0.035),rgba(0,0,0,0.16))] p-5">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ffc54d]/25 bg-[#ffc54d]/10 text-[#ffc54d]">
                    <Store className="h-5 w-5" />
                  </span>
                  <h3 className="break-words font-display text-[1.45rem] font-bold uppercase leading-tight tracking-[0.02em] text-white [overflow-wrap:anywhere]">
                    Bolões para negócios
                  </h3>
                  <ArenaHint label="Sobre bolões para negócios">
                    Para bares, marcas, empresas e eventos que precisam de campanhas, ativações, QR code e alcance com público externo.
                  </ArenaHint>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-300">
                  Use quando o bolão faz parte de uma campanha comercial ou experiência para clientes.
                </p>
              </div>
            </div>
            <Link
              to="/negocios"
              aria-label="Bolões para negócios"
              className="mt-5 inline-flex w-full min-w-0 items-center justify-center gap-2 whitespace-normal rounded-[20px] border border-[#ffc54d]/30 bg-[#ffc54d]/10 px-5 py-4 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-[#ffc54d] transition hover:bg-[#ffc54d]/15"
            >
              <Store className="h-4 w-4 shrink-0" />
              Bolões para negócios
            </Link>
          </div>
        </div>
      </ArenaPanel>

      <ArenaPanel className="mb-6 p-5">
        <ArenaSectionHeader
          eyebrow="Painel"
          title="Status dos bolões"
          hint="Aqui ficam os números operacionais da sua área: bolões ativos, entradas pendentes e mesas públicas para descobrir."
        />
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

      <div className="mb-6 grid gap-3 lg:grid-cols-3">
        <Link
          to="/descobrir/boloes"
          className="group rounded-[22px] border border-primary/25 bg-primary/[0.08] p-5 text-white transition hover:border-primary/45 hover:bg-primary/[0.12]"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
              <Compass className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="break-words font-display text-xl font-bold uppercase leading-tight tracking-[0.03em] [overflow-wrap:anywhere]">
                Quer encontrar novos bolões?
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Explore bolões públicos, campanhas e disputas perto de você.
              </p>
              <span className="mt-4 inline-flex whitespace-normal text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-primary transition group-hover:translate-x-0.5">
                Explorar bolões
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/comunidades"
          className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-5 text-white transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-primary">
              <Users2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="break-words font-display text-xl font-bold uppercase leading-tight tracking-[0.03em] [overflow-wrap:anywhere]">
                Comunidades
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Reúna a mesma turma em vários bolões ao longo da temporada.
              </p>
              <span className="mt-4 inline-flex whitespace-normal text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-primary transition group-hover:translate-x-0.5">
                Abrir comunidades
              </span>
            </div>
          </div>
        </Link>

        <Link
          to="/boloes/creator"
          className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-5 text-white transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="break-words font-display text-xl font-bold uppercase leading-tight tracking-[0.03em] [overflow-wrap:anywhere]">
                Creator Pro
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Prepare bolões com materiais de divulgação e uma presença mais profissional.
              </p>
              <span className="mt-4 inline-flex whitespace-normal text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-primary transition group-hover:translate-x-0.5">
                Conhecer recursos
              </span>
            </div>
          </div>
        </Link>
      </div>

      <div className="mb-6">
        <OpportunityRail opportunities={opportunities} title="Próximas ações em Bolões" />
      </div>

      <div className="grid gap-6">
        <ArenaPanel className="p-5">
          <ArenaSectionHeader
            eyebrow="Meus bolões"
            title="Sua mesa"
            hint="Bolões em que você participa. Toque em um card para abrir tabela, jogos, membros e compartilhamento."
          />
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
                <Link key={bolao.id} to={`/boloes/${bolao.id}`} className={getBolaoCardShellClass("action")}>
                  <div className="flex items-center gap-3">
                    <BolaoAvatar
                      avatarUrl={bolao.avatar_url}
                      fallback="⚽"
                      alt={bolao.name}
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl"
                    />
                    <div className="flex-1">
                      <p className="break-words font-display text-[1.35rem] font-semibold uppercase leading-tight text-white [overflow-wrap:anywhere]">{bolao.name}</p>
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
            title="Entradas"
            description="Convites e pedidos ficam reunidos aqui."
            emptyTitle="Nada pendente agora"
            emptyDescription="Pedidos para bolões privados aparecem aqui."
            items={requestItems}
          />

          <ArenaPanel className="p-5">
            <ArenaSectionHeader
              eyebrow="Código"
              title="Entrar rápido"
              hint="Cole o código enviado por WhatsApp, Telegram ou outro convite. Se o bolão for privado, sua entrada pode depender de aprovação."
            />

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
          <ArenaSectionHeader
            eyebrow="Descobrir"
            title="Mesas abertas"
            hint="Lista apenas bolões públicos ou abertos para descoberta. Os seus ficam na seção de cima."
          />

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
                <div key={bolao.id} className={getBolaoCardShellClass("info")}>
                  <div className="flex items-center gap-3">
                    <BolaoAvatar
                      avatarUrl={bolao.avatar_url}
                      fallback="⚽"
                      alt={bolao.name}
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl"
                    />
                    <div className="min-w-0">
                      <p className="break-words font-display text-[1.35rem] font-semibold uppercase leading-tight text-white [overflow-wrap:anywhere]">{bolao.name}</p>
                      {bolao.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{bolao.description}</p> : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Público</span>
                    {bolao.is_paid ? <span className="rounded-full border border-[#ffc54d]/20 bg-[#ffc54d]/10 px-3 py-1 text-[#ffc54d]">Pago</span> : null}
                  </div>
                  <Link
                    to={`/b/${bolao.invite_code}`}
                    className="mt-4 inline-flex w-full min-w-0 items-center justify-center whitespace-normal rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-[11px] font-black uppercase leading-tight tracking-[0.12em] text-white transition hover:bg-white/[0.06]"
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
