import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Store,
  Users2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { BolaoEntryGuidance } from "@/features/boloes/shared/BolaoEntryGuidance";
import { BolaoCard, BolaoCardSkeleton } from "@/features/boloes/listing/BolaoCard";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import { useOpportunities } from "@/hooks/useOpportunities";
import {
  listUserBoloes,
  type BolaoListingCard,
  type BolaoListingRequestCard,
} from "@/services/boloes/bolao-listing.service";

// ─── Quick-action entry cards ────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: "explore",
    to: "/descobrir/boloes",
    icon: Compass,
    label: "Explorar bolões",
    description: "Públicos e abertos",
    accent: false,
  },
  {
    id: "communities",
    to: "/comunidades",
    icon: Users2,
    label: "Comunidades",
    description: "Turma recorrente",
    accent: false,
  },
  {
    id: "creator",
    to: "/boloes/creator",
    icon: Sparkles,
    label: "Creator Pro",
    description: "Divulgação profissional",
    accent: false,
  },
] as const;

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
        meta: request.updatedAt
          ? `Atualizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(request.updatedAt))}`
          : null,
        status: "Pendente",
      })),
    [pendingRequests],
  );

  const opportunities = useOpportunities({
    user,
    activeBoloes: myBoloes,
    surface: "boloes",
  });

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
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

  const activeCount = myBoloes.filter((b) =>
    ["active", "open", "published", "live"].includes(b.status),
  ).length;

  return (
    <div className="arena-screen space-y-6">

      {/* ── HERO HEADER ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[28px] border border-primary/20 bg-[linear-gradient(145deg,rgba(145,255,59,0.12),rgba(255,197,77,0.06),rgba(0,0,0,0.5))] p-6">
        {/* Decorative glow orb */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: title + stat pills */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              Seus bolões
            </p>
            <h1 className="mt-1.5 font-display text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-4xl">
              Escolha seu caminho
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
              Crie bolões para a turma ou ative campanhas para público externo.
            </p>

            {/* Stat pills */}
            <div className="mt-5 flex flex-wrap gap-3">
              <StatPill value={activeCount} label="Ativos" accent />
              <StatPill value={pendingRequests.length} label="Pendentes" />
              <StatPill value={discoverBoloes.length} label="Disponíveis" />
            </div>
          </div>

          {/* Right: two CTA cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px] lg:shrink-0">
            {/* Social pool CTA */}
            <Link
              to="/boloes/criar"
              aria-label="Criar bolão da turma"
              className="group relative overflow-hidden rounded-[22px] border border-primary/30 bg-primary/10 p-4 transition-all duration-200 hover:border-primary/60 hover:bg-primary/15 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(145,255,59,0.12)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-primary/30 bg-primary/15 text-primary">
                  <Users2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-black uppercase tracking-[0.03em] text-white">
                    Bolão da turma
                  </p>
                  <p className="text-[11px] text-zinc-400">Social · Amigos · Ranking</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                <Plus className="h-3.5 w-3.5" />
                Criar agora
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </Link>

            {/* Business CTA */}
            <Link
              to="/negocios"
              aria-label="Bolões para negócios"
              className="group relative overflow-hidden rounded-[22px] border border-amber-400/25 bg-amber-400/8 p-4 transition-all duration-200 hover:border-amber-400/45 hover:bg-amber-400/12 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-amber-400/25 bg-amber-400/10 text-amber-300">
                  <Store className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-black uppercase tracking-[0.03em] text-white">
                    Para negócios
                  </p>
                  <p className="text-[11px] text-zinc-400">Campanha · Público · QR</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-amber-300">
                <Store className="h-3.5 w-3.5" />
                Explorar planos
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK NAVIGATION ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.id}
            to={action.to}
            className="group flex flex-col items-center gap-2 rounded-[18px] border border-white/8 bg-white/[0.03] p-4 text-center transition-all duration-200 hover:border-primary/25 hover:bg-primary/[0.05] hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-white/10 bg-white/5 text-zinc-400 transition-colors duration-200 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
              <action.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.08em] text-white">
                {action.label}
              </p>
              <p className="text-[10px] text-zinc-500">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── OPPORTUNITIES ─────────────────────────────────────────── */}
      {opportunities.length > 0 && (
        <div>
          <OpportunityRail opportunities={opportunities} title="Próximas ações em Bolões" />
        </div>
      )}

      {/* ── MY POOLS ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Meus bolões</p>
            <h2 className="mt-0.5 font-display text-xl font-black uppercase text-white">Sua mesa</h2>
          </div>
          {myBoloes.length > 0 && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
              {myBoloes.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <BolaoCardSkeleton key={i} />
            ))}
          </div>
        ) : myBoloes.length === 0 ? (
          <EmptyState
            icon="⚽"
            title="Você ainda não participa de nenhum bolão"
            description="Entre por convite, código ou crie o seu."
            className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
            glowColor="green"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {myBoloes.map((bolao) => (
              <BolaoCard key={bolao.id} bolao={bolao} variant="my" />
            ))}
          </div>
        )}
      </section>

      {/* ── ENTRY BY CODE + ADMISSION INBOX ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        {/* Admission inbox */}
        <AdmissionInbox
          title="Entradas"
          description="Convites e pedidos ficam reunidos aqui."
          emptyTitle="Nada pendente agora"
          emptyDescription="Pedidos para bolões privados aparecem aqui."
          items={requestItems}
        />

        {/* Join by code */}
        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Código</p>
          <h3 className="mt-1 font-display text-lg font-black uppercase text-white">Entrar rápido</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Cole o código enviado por WhatsApp ou outro convite.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              id="bolao-join-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO"
              maxLength={8}
              className="min-w-0 flex-1 rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black uppercase tracking-[0.24em] text-white placeholder:text-zinc-600 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <button
              onClick={() => void handleJoinByCode()}
              disabled={joining || joinCode.trim().length < 6}
              aria-label="Entrar por código"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary text-black transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── DISCOVER POOLS ───────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Descobrir</p>
            <h2 className="mt-0.5 font-display text-xl font-black uppercase text-white">Mesas abertas</h2>
          </div>
          <Link
            to="/descobrir/boloes"
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-primary transition-all hover:gap-1.5"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <BolaoCardSkeleton key={i} />
            ))}
          </div>
        ) : discoverBoloes.length === 0 ? (
          <EmptyState
            icon="🌍"
            title="Nenhum bolão público disponível agora"
            description="Quando aparecer algum bolão aberto, ele vai surgir aqui."
            className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
            glowColor="gold"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {discoverBoloes.map((bolao) => (
              <BolaoCard key={bolao.id} bolao={bolao} variant="discover" />
            ))}
          </div>
        )}
      </section>

      {/* ── ENTRY GUIDANCE ───────────────────────────────────────── */}
      <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
        <BolaoEntryGuidance />
      </div>
    </div>
  );
}

// ─── Stat pill sub-component ──────────────────────────────────────────────────
function StatPill({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={[
      "flex items-center gap-2 rounded-full border px-3 py-1.5",
      accent
        ? "border-primary/25 bg-primary/10"
        : "border-white/10 bg-white/[0.04]",
    ].join(" ")}>
      <span className={`text-lg font-black leading-none ${accent ? "text-primary" : "text-white"}`}>
        {value}
      </span>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
        {label}
      </span>
    </div>
  );
}
