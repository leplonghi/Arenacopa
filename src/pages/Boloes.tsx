import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight,
  Archive,
  Compass,
  Loader2,
  Plus,
  Search,
  Store,
  Users,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdmissionInbox } from "@/features/social/AdmissionInbox";
import { usePendingPredictions } from "@/hooks/usePendingPredictions";

import { BolaoCard, BolaoCardSkeleton } from "@/features/boloes/listing/BolaoCard";
import { joinViaInvite } from "@/services/groups/group-access.service";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { deleteBolao, archiveBolao } from "@/services/boloes/bolao-config.service";
import {
  listUserBoloes,
  invalidateBolaoListingCache,
  type BolaoListingCard,
  type BolaoListingRequestCard,
} from "@/services/boloes/bolao-listing.service";
import { ModeChoiceCard } from "@/features/boloes/components/ModeChoiceCard";
import { CreateGroupDialog } from "@/features/groups/create/CreateGroupDialog";
import { tStatic } from "@/i18n/staticText";
import { ArenaImageButton, ArenaPageHeader, ArenaSegmentedTabs, ArenaStateBlock } from "@/components/arena/ArenaExperience";
import { getArenaAssetSrc } from "@/lib/arena-assets";

type BolaoTab = "meus" | "passados" | "arquivo" | "descobrir" | "entradas";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
  }),
};

export default function Boloes() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [myBoloes, setMyBoloes] = useState<BolaoListingCard[]>([]);
  const [archivedBoloes, setArchivedBoloes] = useState<BolaoListingCard[]>([]);
  const [pendingRequests, setPendingRequests] = useState<BolaoListingRequestCard[]>([]);
  const [discoverBoloes, setDiscoverBoloes] = useState<BolaoListingCard[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<BolaoTab>(() => {
    const tab = searchParams.get("tab") as BolaoTab | null;
    return tab && ["meus", "passados", "arquivo", "descobrir", "entradas"].includes(tab) ? tab : "meus";
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { pendingCounts } = usePendingPredictions();

  const handleTabChange = useCallback((tab: BolaoTab) => {
    setActiveTab(tab);
    setSearchParams(tab === "meus" ? {} : { tab });
  }, [setSearchParams]);

  useEffect(() => {
    const tab = searchParams.get("tab") as BolaoTab | null;
    if (tab && ["meus", "passados", "arquivo", "descobrir", "entradas"].includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab, searchParams]);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setMyBoloes([]);
      setPendingRequests([]);
      setDiscoverBoloes([]);
      setLoading(false);
      return;
    }
    // Force fresh fetch when explicitly retrying (clears stale error cache)
    if (forceRefresh) {
      invalidateBolaoListingCache(user.id);
    }
    setLoading(true);
    setLoadError(false);
    try {
      const listing = await listUserBoloes(
        { userId: user.id },
        (fresh) => {
          setMyBoloes(fresh.myBoloes);
          setArchivedBoloes(fresh.archivedBoloes ?? []);
          setPendingRequests(fresh.pendingRequests);
          setDiscoverBoloes(fresh.discoverBoloes);
        },
      );

      setMyBoloes(listing.myBoloes);
      setArchivedBoloes(listing.archivedBoloes ?? []);
      setPendingRequests(listing.pendingRequests);
      setDiscoverBoloes(listing.discoverBoloes);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "Autenticação obrigatória.") {
        setMyBoloes([]);
      } else if (msg.startsWith("function_timeout:")) {
        setLoadError(true);
        toast({
          title: "Conexão lenta",
          description: "O servidor demorou demais. Tente novamente.",
          variant: "destructive",
        });
      } else {
        setLoadError(true);
        toast({
          title: "Não foi possível carregar seus bolões",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user?.id]);

  // Wait for auth to stabilize before fetching
  useEffect(() => {
    if (authLoading) return;
    void loadData();
  }, [loadData, authLoading]);

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
        invalidateBolaoListingCache(user?.id);
        // result is a union: BolaoJoinResponse | GroupJoinResponse — narrow with 'bolao_id'
        const bolaoId = "bolao_id" in result ? result.bolao_id : null;
        if (bolaoId) navigate(`/boloes/${bolaoId}`);
        return;
      }
      trackSocialEvent("join_requested", { kind: "bolao" });
      toast({
        title: "Solicitação enviada",
        description: "Agora é só aguardar a aprovação do criador.",
      });
      setJoinCode("");
      invalidateBolaoListingCache(user?.id);
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

  const handleToggleSelection = (id: string, selected: boolean) => {
    setSelectedIds(prev =>
      selected ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setSelectedIds([]);
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      type DeleteResult = { id: string; ok: true } | { id: string; ok: false; code: string };

      const results = await Promise.all(
        selectedIds.map(async (id): Promise<DeleteResult> => {
          try {
            await deleteBolao({ payload: { bolao_id: id } });
            return { id, ok: true };
          } catch (err) {
            const code = err instanceof Error ? err.message : "unknown";
            return { id, ok: false, code };
          }
        }),
      );

      const successes = results.filter((r) => r.ok);
      const failures = results.filter((r) => !r.ok) as { id: string; ok: false; code: string }[];

      const hasMemberError = failures.some((f) => f.code === "external_member_exists");
      const hasPermissionError = failures.some((f) => f.code === "permission_denied");

      if (successes.length > 0) {
        invalidateBolaoListingCache(user?.id);
        void loadData();
        setSelectedIds(failures.map((f) => f.id)); // keep only the ones that failed
      }

      setIsDeleteDialogOpen(false);

      if (failures.length === 0) {
        setIsSelectionMode(false);
        toast({
          title: "Exclusão concluída",
          description: `${successes.length} bolão(ões) removido(s) com sucesso.`,
        });
        return;
      }

      // Build a human-readable description of what went wrong
      let description = "";
      if (hasMemberError) {
        description = "Bolões com membros ativos não podem ser excluídos. Remova os participantes primeiro.";
      } else if (hasPermissionError) {
        description = "Você não tem permissão para excluir um ou mais bolões selecionados.";
      } else {
        description = `${successes.length} removido(s), ${failures.length} falhou. Tente novamente.`;
      }

      toast({
        title: successes.length > 0 ? "Exclusão parcial" : "Não foi possível excluir",
        description,
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBatchArchive = async () => {
    if (selectedIds.length === 0) return;
    setIsArchiving(true);
    try {
      type ArchiveResult = { id: string; ok: true } | { id: string; ok: false };
      const results = await Promise.all(
        selectedIds.map(async (id): Promise<ArchiveResult> => {
          try {
            await archiveBolao({ payload: { bolao_id: id } });
            return { id, ok: true };
          } catch {
            return { id, ok: false };
          }
        }),
      );
      const successes = results.filter((r) => r.ok);
      const failures = results.filter((r) => !r.ok);
      if (successes.length > 0) {
        invalidateBolaoListingCache(user?.id);
        void loadData();
        setSelectedIds(failures.map((f) => f.id));
      }
      setIsArchiveDialogOpen(false);
      if (failures.length === 0) {
        setIsSelectionMode(false);
        toast({
          title: "Arquivado com sucesso",
          description: `${successes.length} bolão(ões) movido(s) para o arquivo.`,
        });
      } else {
        toast({
          title: "Arquivamento parcial",
          description: `${successes.length} arquivado(s), ${failures.length} falhou.`,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleQuickDelete = useCallback(async (bolaoId: string) => {
    try {
      await deleteBolao({ payload: { bolao_id: bolaoId } });
      invalidateBolaoListingCache(user?.id);
      // Optimistic update: remove from local state immediately
      setMyBoloes(prev => prev.filter(b => b.id !== bolaoId));
      setArchivedBoloes(prev => prev.filter(b => b.id !== bolaoId));
      toast({ title: "Bolão excluído", description: "Removido com sucesso." });
    } catch (err) {
      const code = err instanceof Error ? err.message : "unknown";
      const description = code === "external_member_exists"
        ? "Bolões com membros não podem ser excluídos. Use Arquivar."
        : code === "permission_denied"
          ? "Você não tem permissão para excluir este bolão."
          : "Não foi possível excluir. Tente novamente.";
      toast({ title: "Erro ao excluir", description, variant: "destructive" });
      throw err; // Re-throw so BolaoCard knows the operation failed
    }
  }, [toast, user?.id]);

  const currentBoloes = useMemo(
    () => myBoloes.filter((bolao) => !bolao.is_past),
    [myBoloes],
  );
  const pastBoloes = useMemo(
    () => myBoloes.filter((bolao) => bolao.is_past),
    [myBoloes],
  );
  const activeCount = currentBoloes.filter((b) =>
    ["active", "open", "published", "live"].includes(b.status),
  ).length;
  const cockpitSrc = getArenaAssetSrc("generated/creator-cockpit.webp");
  const emptyPoolsSrc = getArenaAssetSrc("generated/empty-pools.webp");
  const tabItems = [
    { value: "meus" as const, label: "Atuais", count: currentBoloes.length },
    { value: "passados" as const, label: "Passados", count: pastBoloes.length },
    { value: "descobrir" as const, label: "Explorar", count: discoverBoloes.length, icon: Compass },
    { value: "arquivo" as const, label: "Arquivo", count: archivedBoloes.length },
    { value: "entradas" as const, label: "Solicitações", count: pendingRequests.length, alert: pendingRequests.length > 0 },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-2"
      >
        <ArenaPageHeader
          eyebrow="Cockpit do criador"
          title={myBoloes.length > 0 ? "Meus Bolões" : "Comece a jogar"}
          description="Gerencie convites, acompanhe pendências e mantenha suas ligas prontas para a próxima rodada."
          image={{ src: cockpitSrc, alt: "", eager: true, position: "center" }}
          actions={
            <>
              <ArenaImageButton onClick={() => navigate("/boloes/criar?mode=traditional")} icon={Plus}>Criar bolão</ArenaImageButton>
              {myBoloes.length > 0 ? (
                <ArenaImageButton
                  onClick={() => selectedIds.length > 0 ? setIsDeleteDialogOpen(true) : toggleSelectionMode()}
                  icon={selectedIds.length > 0 ? Trash2 : CheckSquare}
                  variant={selectedIds.length > 0 ? "ghost" : "ghost"}
                >
                  {selectedIds.length > 0 ? tStatic("Excluir") : tStatic("Gerenciar")}
                </ArenaImageButton>
              ) : null}
            </>
          }
          metrics={[
            { label: "Ativos", value: activeCount, accent: true },
            { label: "Pedidos", value: pendingRequests.length },
            { label: "Arquivo", value: archivedBoloes.length },
          ]}
        />
      </motion.div>

      {/* Entrar por código + Ações rápidas */}
      <div className="flex flex-col gap-3">
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2"
        >
          <Search className="h-3 w-3 text-zinc-500 shrink-0" />
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Código de entrada"
            maxLength={8}
            className="min-w-0 flex-1 bg-transparent text-[10px] font-black uppercase tracking-[0.15em] text-white placeholder:text-zinc-600 focus:outline-none"
          />
          <button
            onClick={() => void handleJoinByCode()}
            disabled={joining || joinCode.trim().length < 6}
            className="flex h-7 px-3 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary text-[10px] font-black uppercase tracking-wider text-black transition-all hover:brightness-110 disabled:opacity-40"
          >
            {joining ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Entrar <ArrowRight className="h-3 w-3" /></>}
          </button>
        </motion.div>
      </div>

      {/* Tabs / Filtros */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="relative overflow-x-auto scrollbar-none py-1">
        <ArenaSegmentedTabs items={tabItems} value={activeTab} onChange={handleTabChange} />
      </motion.div>

      {/* Conteúdo Principal (Lista de Bolões) */}
      {/* Conteúdo das tabs */}

      <AnimatePresence mode="wait">
        {activeTab === "meus" && (() => {
          const activeBoloes = currentBoloes.filter((b) =>
            ["active", "open", "published", "live"].includes(b.status)
          );
          const draftBoloes = currentBoloes.filter((b) => b.status === "draft");
          const otherBoloes = currentBoloes.filter((b) =>
            !["active", "open", "published", "live", "draft"].includes(b.status)
          );

          return (
            <motion.div
              key="meus"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <BolaoCardSkeleton key={i} />
                  ))}
                </div>
              ) : loadError ? (
                <div className="flex flex-col items-center gap-4 rounded-[20px] border border-dashed border-red-500/20 bg-red-500/[0.03] py-10 text-center">
                  <span className="text-3xl">⚡</span>
                  <div>
                    <p className="text-sm font-bold text-white">Falha ao carregar bolões</p>
                    <p className="mt-1 text-[11px] text-zinc-500">Verifique sua conexão e tente novamente.</p>
                  </div>
                  <button
                    onClick={() => void loadData(true)}
                    className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary transition-all hover:bg-primary/20 active:scale-95"
                  >
                    <Loader2 className="h-3 w-3" />
                    Tentar novamente
                  </button>
                </div>
              ) : currentBoloes.length === 0 ? (
                <ArenaStateBlock
                  image={{ src: emptyPoolsSrc, alt: "" }}
                  icon={<Trophy className="h-7 w-7" />}
                  title={myBoloes.length === 0 ? "Nenhum bolão ainda" : "Nenhum bolão atual"}
                  description={myBoloes.length === 0 ? "Crie o seu ou entre por código." : "Bolões com jogos encerrados ficam na aba Passados."}
                  action={<ArenaImageButton onClick={() => navigate("/boloes/criar?mode=traditional")} icon={Plus}>Criar bolão</ArenaImageButton>}
                  className="min-h-[320px]"
                />
              ) : (
                <>
                  {/* Active / published bolões — full-width, prominent */}
                  {activeBoloes.length > 0 && (
                    <div className="space-y-2">
                      {activeBoloes.map((bolao) => (
                        <BolaoCard
                          key={bolao.id}
                          bolao={bolao}
                          variant="my"
                          isSelectionMode={isSelectionMode}
                          selectable={bolao.is_creator}
                          selected={selectedIds.includes(bolao.id)}
                          onSelect={handleToggleSelection}
                          onQuickDelete={handleQuickDelete}
                          pendingCount={pendingCounts[bolao.id]}
                        />
                      ))}
                    </div>
                  )}

                  {/* Drafts — compact amber chips row */}
                  {draftBoloes.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-amber-400/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
                        Rascunhos ({draftBoloes.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {draftBoloes.map((bolao) => (
                          <Link
                            key={bolao.id}
                            to={`/boloes/${bolao.id}`}
                            className="group flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 transition-all hover:border-amber-400/40 hover:bg-amber-400/10"
                          >
                            <span className="text-sm">{bolao.emoji ?? "📝"}</span>
                            <span className="text-[11px] font-semibold text-amber-200 group-hover:text-amber-100 truncate max-w-[120px]">
                              {bolao.name}
                            </span>
                            {bolao.is_creator && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-400/60">
                                rascunho
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other statuses */}
                  {otherBoloes.length > 0 && (
                    <div className="space-y-2">
                      {otherBoloes.map((bolao) => (
                        <BolaoCard
                          key={bolao.id}
                          bolao={bolao}
                          variant="my"
                          isSelectionMode={isSelectionMode}
                          selectable={bolao.is_creator}
                          selected={selectedIds.includes(bolao.id)}
                          onSelect={handleToggleSelection}
                          onQuickDelete={handleQuickDelete}
                          pendingCount={pendingCounts[bolao.id]}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })()}

        {activeTab === "passados" && (
          <motion.div
            key="passados"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BolaoCardSkeleton key={i} />
                ))}
              </div>
            ) : pastBoloes.length === 0 ? (
              <ArenaStateBlock
                image={{ src: emptyPoolsSrc, alt: "" }}
                icon={<Archive className="h-7 w-7" />}
                title="Nenhum bolão passado"
                description="Quando todos os jogos escolhidos encerrarem, eles aparecem aqui."
                className="min-h-[280px]"
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {pastBoloes.map((bolao) => (
                  <BolaoCard
                    key={bolao.id}
                    bolao={bolao}
                    variant="my"
                    isSelectionMode={isSelectionMode}
                    selectable={bolao.is_creator}
                    selected={selectedIds.includes(bolao.id)}
                    onSelect={handleToggleSelection}
                    onQuickDelete={handleQuickDelete}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "arquivo" && (
          <motion.div
            key="arquivo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <BolaoCardSkeleton key={i} />
                ))}
              </div>
            ) : archivedBoloes.length === 0 ? (
              <ArenaStateBlock
                image={{ src: emptyPoolsSrc, alt: "" }}
                icon={<Archive className="h-7 w-7" />}
                title="Arquivo vazio"
                description="Bolões arquivados aparecem aqui. Use o botão Arquivar para guardar bolões concluídos sem perder os dados."
                className="min-h-[280px]"
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Archive className="h-3.5 w-3.5 text-zinc-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Bolões arquivados — dados preservados, fora do dashboard
                  </p>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {archivedBoloes.map((bolao) => (
                    <BolaoCard
                      key={bolao.id}
                      bolao={bolao}
                      variant="my"
                      isSelectionMode={isSelectionMode}
                      selectable={bolao.is_creator}
                      selected={selectedIds.includes(bolao.id)}
                      onSelect={handleToggleSelection}
                      onQuickDelete={handleQuickDelete}
                    />
                  ))}
                </div>
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
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <BolaoCardSkeleton key={i} />
                ))}
              </div>
            ) : discoverBoloes.length === 0 ? (
              <ArenaStateBlock
                image={{ src: emptyPoolsSrc, alt: "" }}
                icon={<Compass className="h-7 w-7" />}
                title="Nenhum bolão aberto"
                description="Quando aparecer algum, ele vai surgir aqui."
                className="min-h-[280px]"
              />
            ) : (
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* Novo Bolão / Criação - Seção Inferior */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="mt-4 space-y-3 pb-12"
      >
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Novo Bolão
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ModeChoiceCard
            variant="traditional"
            title="Pessoal"
            description="Bolão clássico para amigos"
            icon={Plus}
            tags={["Grátis"]}
            tooltipTitle="Bolão Tradicional"
            tooltipDescription="Crie seu próprio bolão, escolha as partidas e convide seus amigos por código ou link."
            onClick={() => navigate("/boloes/criar?mode=traditional")}
          />
          <ModeChoiceCard
            variant="business"
            title="Business"
            description="Bolão para sua marca"
            icon={Store}
            tags={["Marketing"]}
            tooltipTitle="Soluções Corporativas"
            tooltipDescription="Ideal para empresas, bares e influenciadores que querem engajar sua audiência."
            onClick={() => navigate("/boloes/criar?mode=business")}
          />
        </div>

        <button
          onClick={() => setIsCreateGroupOpen(true)}
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">Criar Grupo</h3>
              <p className="text-[11px] text-zinc-500">Gerencie múltiplos bolões com a mesma turma</p>
            </div>
          </div>
          <Plus className="h-5 w-5 text-zinc-600 transition-transform group-hover:scale-110 group-hover:text-zinc-400" />
        </button>
      </motion.div>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-widest text-red-400">
              ⚠️ Excluir permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 space-y-2">
              <span className="block">
                Você tem certeza que deseja <strong className="text-white">excluir permanentemente</strong> {selectedIds.length} bolão(ões)?
                Todos os dados (palpites, pontuações, membros) serão apagados.
              </span>
              <span className="block text-amber-400/80 text-[11px]">
                💡 Dica: bolões com membros não podem ser excluídos. Use <strong>Arquivar</strong> para guardar o histórico sem apagar dados.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">{tStatic("Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBatchDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tStatic("Excluindo...")}
                </>
              ) : (
                tStatic("Sim, excluir todos")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <AlertDialogContent className="border-amber-500/20 bg-zinc-950 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display uppercase tracking-widest text-amber-400">
              📦 Arquivar bolão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Arquivar move {selectedIds.length} bolão(ões) para a seção <strong className="text-white">Arquivo</strong>.
              Os dados, palpites e pontuações ficam preservados, mas o bolão sai do dashboard e da lista principal.
              Você pode consultar os arquivados a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">{tStatic("Cancelar")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleBatchArchive();
              }}
              disabled={isArchiving}
              className="bg-amber-500 text-black hover:bg-amber-400 font-bold"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Arquivando...
                </>
              ) : (
                "Sim, arquivar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onSuccess={() => {
          invalidateBolaoListingCache(user?.id);
          void loadData();
        }}
      />
    </div>
  );
}
