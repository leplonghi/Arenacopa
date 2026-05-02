import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Loader2,
  Plus,
  Search,
  Store,
  Users,
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
import { useOpportunities } from "@/hooks/useOpportunities";
import {
  listUserBoloes,
  type BolaoListingCard,
  type BolaoListingRequestCard,
} from "@/services/boloes/bolao-listing.service";
import { ModeChoiceCard } from "@/features/boloes/components/ModeChoiceCard";

const QUICK_ACTIONS = [
  {
    id: "explore",
    to: "/descobrir/boloes",
    icon: Compass,
    label: "Explorar",
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
] as const;

type BoloesView = "hub" | "traditional";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

export default function Boloes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [view, setView] = useState<BoloesView>("hub");
  const [loading, setLoading] = useState(true);
  const [myBoloes, setMyBoloes] = useState<BolaoListingCard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BolaoListingRequestCard[]>([]);
  const [discoverBoloes, setDiscoverBoloes] = useState<BolaoListingCard[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<"meus" | "descobrir" | "entradas">("meus");

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

  // ── Hub view ──────────────────────────────────────────────────────────────
  if (view === "hub") {
    return (
      <div className="arena-screen flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center space-y-1.5 pt-2"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Bolões</p>
          <h1 className="font-display text-2xl font-black uppercase leading-none text-white sm:text-3xl">
            Escolha o tipo
          </h1>
          <p className="max-w-sm mx-auto text-[12px] leading-5 text-zinc-500">
            Passe o mouse para saber mais sobre cada opção
          </p>
        </motion.div>

        <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
          <ModeChoiceCard
            index={0}
            title="Bolão Tradicional"
            description="Para amigos, família ou grupo privado. Gratuito e divertido."
            tags={["Gratuito", "Amigos & Família", "Grupos"]}
            icon={Users}
            variant="traditional"
            tooltipTitle="Bolão com a turma"
            tooltipDescription="Crie bolões privados ou públicos para disputar com quem você conhece. Sem custos, sem complicação."
            onClick={() => setView("traditional")}
          />

          <ModeChoiceCard
            index={1}
            title="Para Negócios"
            description="Bares, empresas e eventos. Crie campanhas com patrocínio e prêmios."
            tags={["Bares & Restaurantes", "Empresas", "Eventos"]}
            icon={Store}
            variant="business"
            badge="Negócio"
            tooltipTitle="Campanha comercial"
            tooltipDescription="Ideal para bares, restaurantes e empresas que querem engajar clientes com bolões patrocinados e prêmios reais."
            onClick={() => navigate("/negocios")}
          />
        </div>

        <p className="text-center text-white/20 text-[11px]">
          Você pode alternar entre os tipos a qualquer momento
        </p>
      </div>
    );
  }

  // ── Traditional view ──────────────────────────────────────────────────────
  return (
    <div className="arena-screen space-y-4">
      {/* Header compacto com ações */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <button
            onClick={() => setView("hub")}
            className="text-[10px] font-black uppercase tracking-[0.22em] text-primary hover:underline"
          >
            ← Bolões
          </button>
          <h1 className="mt-0.5 font-display text-xl font-black uppercase leading-none text-white">
            {myBoloes.length > 0 ? "Sua mesa" : "Comece a jogar"}
          </h1>
        </div>
        <Link
          to="/boloes/criar"
          className="flex shrink-0 items-center gap-1.5 rounded-[14px] border border-primary/35 bg-primary/10 px-3.5 py-2 text-xs font-black text-primary transition hover:bg-primary/15"
        >
          <Plus className="h-3.5 w-3.5" />
          Criar
        </Link>
      </motion.div>

      {/* Métricas + Quick nav em linha */}
      <motion.div
        custom={0}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center gap-2"
      >
        <StatPill value={activeCount} label="Ativos" accent />
        <StatPill value={pendingRequests.length} label="Pendentes" />
        <div className="flex-1" />
        {QUICK_ACTIONS.map((action) => {
          const colorMap = {
            emerald: "border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/10",
            blue: "border-blue-500/20 text-blue-400 hover:border-blue-500/40 hover:bg-blue-500/10",
          };
          return (
            <Link
              key={action.id}
              to={action.to}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all",
                colorMap[action.color as keyof typeof colorMap]
              )}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Link>
          );
        })}
      </motion.div>

      {/* Entrar por código - inline compacto */}
      <motion.div
        custom={1}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-2 rounded-[16px] border border-white/8 bg-white/[0.03] px-3 py-2"
      >
        <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Código de entrada"
          maxLength={8}
          className="min-w-0 flex-1 bg-transparent text-xs font-black uppercase tracking-[0.2em] text-white placeholder:text-zinc-600 focus:outline-none"
        />
        <button
          onClick={() => void handleJoinByCode()}
          disabled={joining || joinCode.trim().length < 6}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-primary text-black transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {joining ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
        </button>
      </motion.div>

      {/* Tabs de conteúdo principal */}
      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
        <div className="flex gap-1 rounded-[14px] border border-white/8 bg-white/[0.03] p-1">
          {[
            { key: "meus" as const, label: `Meus (${myBoloes.length})` },
            { key: "descobrir" as const, label: `Abertos (${discoverBoloes.length})` },
            { key: "entradas" as const, label: `Entradas (${pendingRequests.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 rounded-[10px] py-2 text-[10px] font-black uppercase tracking-[0.1em] transition-all ${
                activeTab === tab.key
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Conteúdo das tabs */}
      <AnimatePresence mode="wait">
        {activeTab === "meus" && (
          <motion.div
            key="meus"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BolaoCardSkeleton key={i} />
                ))}
              </div>
            ) : myBoloes.length === 0 ? (
              <EmptyState
                icon="⚽"
                title="Nenhum bolão ainda"
                description="Crie o seu ou entre por código."
                className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] py-8"
                glowColor="green"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {myBoloes.map((bolao) => (
                  <BolaoCard key={bolao.id} bolao={bolao} variant="my" />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "descobrir" && (
          <motion.div
            key="descobrir"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BolaoCardSkeleton key={i} />
                ))}
              </div>
            ) : discoverBoloes.length === 0 ? (
              <EmptyState
                icon="🌍"
                title="Nenhum bolão aberto"
                description="Quando aparecer algum, ele vai surgir aqui."
                className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] py-8"
                glowColor="gold"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {discoverBoloes.map((bolao) => (
                  <BolaoCard key={bolao.id} bolao={bolao} variant="discover" />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "entradas" && (
          <motion.div
            key="entradas"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <AdmissionInbox
              title="Entradas"
              description="Convites e pedidos ficam reunidos aqui."
              emptyTitle="Nada pendente"
              emptyDescription="Pedidos para bolões privados aparecem aqui."
              items={requestItems}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dica rápida */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-[16px] border border-white/8 bg-white/[0.03] p-4"
      >
        <BolaoEntryGuidance />
      </motion.div>
    </div>
  );
}

function StatPill({ value, label, accent = false }: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 rounded-full border px-2.5 py-1",
      accent ? "border-primary/25 bg-primary/10" : "border-white/10 bg-white/[0.04]"
    )}>
      <span className={cn("text-sm font-black leading-none", accent ? "text-primary" : "text-white")}>
        {value}
      </span>
      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-zinc-400">
        {label}
      </span>
    </div>
  );
}
