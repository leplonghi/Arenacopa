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
import { cn } from "@/lib/utils";
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
    color: "emerald",
  },
  {
    id: "communities",
    to: "/comunidades",
    icon: Users2,
    label: "Comunidades",
    description: "Turma recorrente",
    color: "blue",
  },
  {
    id: "creator",
    to: "/boloes/creator",
    icon: Sparkles,
    label: "Creator Pro",
    description: "Divulgação profissional",
    color: "gold",
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

      {/* ── PAGE HEADER ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Bolões</p>
          <h1 className="mt-1 font-display text-2xl font-black uppercase leading-none text-white sm:text-3xl">
            {myBoloes.length > 0 ? "Sua mesa" : "Comece a jogar"}
          </h1>
          <p className="mt-1.5 max-w-sm text-[12px] leading-5 text-zinc-500">
            {myBoloes.length > 0
              ? `${activeCount} ativo${activeCount !== 1 ? "s" : ""} · dispute chutes com sua turma`
              : "Crie um bolão, convide amigos e dispute quem acerta mais."}
          </p>
        </div>
        <Link
          to="/boloes/criar"
          aria-label="Criar bolão"
          className="flex shrink-0 items-center gap-2 rounded-[16px] border border-primary/35 bg-primary/10 px-4 py-2.5 text-sm font-black text-primary transition hover:bg-primary/15"
        >
          <Plus className="h-4 w-4" />
          Criar
        </Link>
      </div>

      {/* ── METRICS ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 px-0.5">
        <StatPill value={activeCount} label="Ativos" accent />
        <StatPill value={pendingRequests.length} label="Pendentes" />
        <StatPill value={discoverBoloes.length} label="Abertos para entrar" />
      </div>

      {/* ── QUICK NAVIGATION ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {QUICK_ACTIONS.map((action) => {
          const colorMap = {
            emerald: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400",
            blue: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 hover:bg-blue-500/10 text-blue-400",
            gold: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 text-amber-400",
          };
          const colorClass = colorMap[action.color as keyof typeof colorMap];

          return (
            <Link
              key={action.id}
              to={action.to}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-[20px] border p-3 text-center transition-all duration-200 hover:-translate-y-0.5",
                colorClass
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-current/20 bg-current/10">
                <action.icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.05em] text-white">
                  {action.label}
                </p>
                <p className="hidden text-[9px] opacity-70 sm:block">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

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
