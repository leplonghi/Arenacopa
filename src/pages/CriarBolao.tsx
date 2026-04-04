import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Crown, Globe,
  Loader2, Lock, Share2, Settings2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Share } from "@capacitor/share";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { useMonetization } from "@/contexts/MonetizationContext";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { cn } from "@/lib/utils";
import { monetizationEnv } from "@/lib/env";
import { PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE } from "@/services/monetization/stripe.service";
import { getDefaultMarketIdsForFormat } from "@/services/boloes/bolao-format.service";
import { useCreateBolao } from "@/hooks/useCreateBolao";
import { getSiteUrl } from "@/utils/site-url";
import type { BolaoFormatSlug, MarketTemplateSlug, ScoringRules } from "@/types/bolao";

// ─── constants ────────────────────────────────────────────────────────────────

const EMOJIS = ["⚽", "🏆", "🎯", "🎉", "🦁", "🔥", "💪", "🏅", "🌟", "🎪", "🐅", "🦅"];

const PRESETS: Record<"standard" | "risky" | "conservative", ScoringRules> = {
  standard:     { exact: 10, winner: 3, draw: 3, participation: 1 },
  risky:        { exact: 20, winner: 5, draw: 5, participation: 0 },
  conservative: { exact: 5,  winner: 2, draw: 2, participation: 1 },
};

type Category = "private" | "public";
type PresetKey = "standard" | "risky" | "conservative";

const POOL_TYPES = [
  {
    id: "rachao",
    emoji: "⚽",
    title: "Rachão",
    subtitle: "Galera assistindo junto",
    desc: "Cada um chuta um placar, o app calcula tudo e entrega o resultado pronto. Zero complicação.",
    example: "Formato Clássico · Pontuação Padrão",
    formatId: "classic" as BolaoFormatSlug,
    scoringRule: "standard" as PresetKey,
    badge: "Recomendado",
    badgeColor: "bg-primary text-black",
  },
  {
    id: "campeonato",
    emoji: "🏆",
    title: "Campeonato",
    subtitle: "Temporada completa",
    desc: "Placar e fases. Quem avança de fase também pontua. Ideal para acompanhar o torneio inteiro.",
    example: "Formato Completo · Pontuação Padrão",
    formatId: "detailed" as BolaoFormatSlug,
    scoringRule: "standard" as PresetKey,
    badge: "Mais completo",
    badgeColor: "bg-copa-blue/20 text-copa-blue",
  },
  {
    id: "classico",
    emoji: "🔥",
    title: "Clássico",
    subtitle: "Só cravar ganha",
    desc: "Pontuação máxima só pra quem acertar o placar exato. Para disputas sérias ou bolões pagos.",
    example: "Formato Clássico · Pontuação Arriscada",
    formatId: "classic" as BolaoFormatSlug,
    scoringRule: "risky" as PresetKey,
    badge: "Alta Pressão",
    badgeColor: "bg-orange-500/20 text-orange-500",
  },
] as const;

type PoolTypeId = "rachao" | "campeonato" | "classico";

// ─── component ────────────────────────────────────────────────────────────────

export default function CriarBolao() {
  const { t } = useTranslation("bolao");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const grupoIdParam = searchParams.get("grupoId");
  const { user } = useAuth();
  const { toast } = useToast();
  const { current: championship } = useChampionship();
  const { purchasePremium, isLoading: isPurchasing } = useMonetization();
  const { canCreateGrupo } = usePlanLimits();
  const canStartCheckout = monetizationEnv.enablePremiumSimulation || monetizationEnv.premiumCheckoutEnabled;
  const { createBolao, creating } = useCreateBolao();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("⚽");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("private");
  const [selectedTypeId, setSelectedTypeId] = useState<PoolTypeId>("rachao");
  const [formatId, setFormatId] = useState<BolaoFormatSlug>("classic");
  const [selectedMarketIds, setSelectedMarketIds] = useState<MarketTemplateSlug[]>(
    getDefaultMarketIdsForFormat("classic").filter((m) => m !== "champion") as MarketTemplateSlug[]
  );
  const [presetKey, setPresetKey] = useState<PresetKey>("standard");
  const [scoringRules, setScoringRules] = useState(PRESETS.standard);
  const [isPaid, setIsPaid] = useState(false);
  const [entryFee, setEntryFee] = useState<number | "">("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [prizeDistribution, setPrizeDistribution] = useState<"winner_takes_all" | "70_20_10" | "custom">("winner_takes_all");
  const [customPrizeDist, setCustomPrizeDist] = useState("");
  const [scoringMode, setScoringMode] = useState<"default" | "exclusive">("default");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createdBolaoId, setCreatedBolaoId] = useState<string | null>(null);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!canCreateGrupo) setShowPaywall(true);
  }, [canCreateGrupo]);

  const selectedType = POOL_TYPES.find((t) => t.id === selectedTypeId)!;
  const canProceedStep0 = name.trim().length >= 3;

  const handleSelectType = (typeId: PoolTypeId) => {
    const t = POOL_TYPES.find((x) => x.id === typeId)!;
    setSelectedTypeId(typeId);
    setFormatId(t.formatId);
    setPresetKey(t.scoringRule);
    setScoringRules(PRESETS[t.scoringRule]);
    const mkts = getDefaultMarketIdsForFormat(t.formatId)
      .filter((m) => m !== "champion") as MarketTemplateSlug[];
    setSelectedMarketIds(mkts);
  };

  const handleCreate = async () => {
    const finalDistribution = prizeDistribution === "custom" ? customPrizeDist : prizeDistribution;
    const result = await createBolao({
      name, description, emoji, category,
      formatId, selectedMarketIds, scoringRules, champion: "",
      isPaid,
      scoringMode,
      grupoId: grupoIdParam,
      championshipId: championship.id,
      entryFee: typeof entryFee === "number" ? entryFee : undefined,
      prizeDistribution: isPaid ? finalDistribution : undefined,
      paymentDetails: isPaid ? paymentDetails : undefined,
    });
    if (result) {
      toast({ title: "Bolão criado! 🎉", className: "bg-emerald-500 text-white border-none font-black" });
      setCreatedBolaoId(result.bolaoId);
      setCreatedInviteCode(result.inviteCode);
    }
  };

  // ─── Paywall ────────────────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-10 text-white">
        <div className="surface-card-strong w-full rounded-[32px] p-6">
          <div className="mb-4 inline-flex rounded-full bg-primary/15 p-3 text-primary">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black">Limite atingido</h1>
          <p className="mt-2 text-sm text-zinc-300">
            O plano gratuito permite criar até 2 grupos. O Copa Pass libera grupos e bolões ilimitados.
          </p>
          <div className="surface-card-soft mt-5 space-y-3 rounded-2xl p-4 text-sm text-zinc-200">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Grupos e bolões ilimitados</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sem anúncios</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Badge Torcedor Oficial</div>
          </div>
          <div className="mt-6 grid gap-3">
            <button onClick={() => void purchasePremium()} disabled={isPurchasing || !canStartCheckout}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60">
              {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {isPurchasing ? "Aguarde..." : canStartCheckout ? "Copa Pass — R$ 19,90" : "Em preparação"}
            </button>
            {!canStartCheckout && <p className="text-center text-xs text-zinc-400">{PREMIUM_CHECKOUT_UNAVAILABLE_MESSAGE}</p>}
            <button onClick={() => navigate(-1)} className="surface-input h-12 rounded-2xl bg-transparent text-sm font-bold text-zinc-300">Voltar</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success ────────────────────────────────────────────────────────────────
  if (createdBolaoId && createdInviteCode) {
    const inviteUrl = `${getSiteUrl()}/b/${createdInviteCode}`;
    const msg = `🔥 Fui convocado! Vem pro meu bolão "${name}" no Arena Copa! Código de acesso: ${createdInviteCode}`;
    const handleShareNative = async () => {
      try { await Share.share({ title: "Arena Copa Bolão", text: msg, url: inviteUrl }); }
      catch { await navigator.clipboard.writeText(inviteUrl); toast({ title: t('bolao_detail.link_copied') }); }
    };
    return (
      <div className="mx-auto max-w-xl px-4 py-10 text-white">
        <div className="surface-card-strong rounded-[32px] p-8 text-center">
          <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 text-5xl">{emoji}</div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">Bolão criado! 🎉</p>
          <h1 className="mt-1 text-3xl font-black">{name}</h1>
          <p className="mt-2 text-sm text-zinc-300">Agora chama os amigos pra entrar!</p>
          <div className="surface-card-soft mt-5 rounded-2xl p-4">
            <p className="text-xs text-zinc-400">Código de convite</p>
            <p className="mt-1 text-3xl font-black tracking-widest text-primary">{createdInviteCode}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${msg} ${inviteUrl}`)}`, "_blank")}
              className="rounded-2xl bg-[#25D366] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[#25D366]/20 shadow-xl transition-transform hover:scale-105 active:scale-95 shadow-lg">
              Convoque a Galera no WhatsApp
            </button>
            <button onClick={handleShareNative}
              className="surface-card-soft inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em]">
              <Share2 className="h-4 w-4" /> Mais opções
            </button>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(inviteUrl); toast({ title: t('bolao_detail.link_copied') }); }}
            className="surface-card-soft mt-3 w-full truncate rounded-2xl px-4 py-3 text-xs font-bold text-zinc-300">
            {inviteUrl}
          </button>
          <button onClick={() => navigate(`/boloes/${createdBolaoId}`)}
            className="mt-4 w-full rounded-[24px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black">
            Ver meu bolão →
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 0: Nome ───────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
        <div className="mb-8 flex items-center gap-3">
          <button aria-label="Voltar" onClick={() => navigate(-1)}
            className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Passo 1 de 3</p>
            <h1 className="text-2xl font-black leading-tight">Nome do bolão</h1>
          </div>
        </div>
        <div className="mb-8 flex gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        </div>
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-bold text-zinc-300">Escolha um emoji pra representar seu bolão</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={cn(
                    "rounded-2xl border p-3 text-2xl transition-all",
                    emoji === e ? "scale-110 border-primary bg-primary/20" : "surface-card-soft border-transparent"
                  )}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-zinc-200">Como vai se chamar?</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bolão da firma, Copa da família..."
              autoFocus
              maxLength={40}
              className="surface-input w-full rounded-[20px] px-5 py-4 text-xl font-black placeholder:text-zinc-500"
            />
            <p className="mt-1.5 text-right text-xs text-zinc-500">{name.length}/40</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-zinc-200">
              Descrição <span className="font-normal text-zinc-400">(opcional)</span>
            </p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Regras, premiação, contexto do bolão..."
              maxLength={140}
              className="surface-input min-h-[80px] w-full rounded-[20px] px-5 py-4 text-sm placeholder:text-zinc-500"
            />
          </div>
          <div className="surface-card-soft rounded-[20px] p-4 border-white/5">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">Prévia</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{emoji}</span>
              <div>
                <p className="font-black">{name || "Nome do bolão"}</p>
                {description && <p className="mt-0.5 text-xs text-zinc-300 line-clamp-1">{description}</p>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={!canProceedStep0}
            className="w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-40 flex items-center justify-center gap-2">
            Próximo <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 1: Tipo ────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
        <div className="mb-8 flex items-center gap-3">
          <button aria-label="Voltar" onClick={() => setStep(0)}
            className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Passo 2 de 3</p>
            <h1 className="text-2xl font-black leading-tight">Que tipo de bolão?</h1>
          </div>
        </div>
        <div className="mb-8 flex gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        </div>
        <div className="space-y-3">
          {POOL_TYPES.map((type) => {
            const isSelected = selectedTypeId === type.id;
            return (
              <button key={type.id} onClick={() => handleSelectType(type.id)}
                className={cn(
                  "w-full rounded-[24px] border p-5 text-left transition-all",
                  isSelected ? "border-primary bg-primary/10 scale-[1.01]" : "surface-card-strong border-transparent"
                )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-3xl">{type.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black">{type.title}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", type.badgeColor)}>
                          {type.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300 leading-snug">{type.desc}</p>
                      <p className="mt-2 rounded-lg bg-black/20 px-3 py-1.5 text-xs text-zinc-300 font-medium inline-block">{type.example}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "mt-1 h-5 w-5 shrink-0 rounded-full border-2 transition-all",
                    isSelected ? "border-primary bg-primary" : "border-zinc-500 bg-black/30"
                  )}>
                    {isSelected && <div className="flex h-full w-full items-center justify-center"><div className="h-2 w-2 rounded-full bg-black" /></div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => setStep(2)}
          className="mt-6 w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black flex items-center justify-center gap-2">
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ─── Step 2: Detalhes + Criar ────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg px-4 pb-28 pt-6 text-white">
      <div className="mb-8 flex items-center gap-3">
        <button aria-label="Voltar" onClick={() => setStep(1)}
          className="surface-card-soft flex h-11 w-11 items-center justify-center rounded-[18px]">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Passo 3 de 3</p>
          <h1 className="text-2xl font-black leading-tight">Últimos detalhes</h1>
        </div>
      </div>
      <div className="mb-8 flex gap-1.5">
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
        <div className="h-1.5 flex-1 rounded-full bg-primary" />
      </div>
      <div className="space-y-4">
        <div className="surface-card-soft rounded-[20px] p-4 border-white/5">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">Resumo</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-black truncate">{name}</p>
              <p className="mt-0.5 text-xs text-zinc-300">{selectedType.title} · {selectedType.subtitle}</p>
            </div>
            <button onClick={() => setStep(0)} className="text-xs text-primary font-bold shrink-0 hover:underline">Editar</button>
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold">Quem pode entrar?</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setCategory("private")}
              className={cn("rounded-[20px] border p-4 text-left transition-all",
                category === "private" ? "border-primary bg-primary/10 scale-[1.02]" : "surface-card-strong border-transparent hover:border-white/10")}>
              <Lock className={cn("mb-2 h-5 w-5", category === "private" ? "text-primary" : "text-zinc-400")} />
              <p className="text-sm font-black">Privado</p>
              <p className="mt-0.5 text-xs text-zinc-400">Só quem tiver o link ou código</p>
            </button>
            <button onClick={() => setCategory("public")}
              className={cn("rounded-[20px] border p-4 text-left transition-all",
                category === "public" ? "border-primary bg-primary/10 scale-[1.02]" : "surface-card-strong border-transparent hover:border-white/10")}>
              <Globe className={cn("mb-2 h-5 w-5", category === "public" ? "text-primary" : "text-zinc-400")} />
              <p className="text-sm font-black">Público</p>
              <p className="mt-0.5 text-xs text-zinc-400">Qualquer pessoa pode entrar</p>
            </button>
          </div>
        </div>

        <div>
           <p className="mb-3 text-sm font-bold">Modo de Palpite</p>
           <div className="grid gap-3">
             <button onClick={() => setScoringMode("default")}
               className={cn("rounded-[20px] border p-4 text-left transition-all",
                 scoringMode === "default" ? "border-primary bg-primary/10" : "surface-card-strong border-transparent hover:border-white/10")}>
               <div className="flex items-center justify-between">
                 <p className="text-sm font-black text-zinc-100">Padrão</p>
                 {scoringMode === "default" && <CheckCircle2 className="h-4 w-4 text-primary" />}
               </div>
               <p className="mt-1 text-xs text-zinc-400">Palpites livres para todos os participantes.</p>
             </button>
             <button onClick={() => setScoringMode("exclusive")}
               className={cn("rounded-[20px] border p-4 text-left transition-all",
                 scoringMode === "exclusive" ? "border-primary bg-primary/10" : "surface-card-strong border-transparent hover:border-white/10")}>
               <div className="flex items-center justify-between">
                 <p className="text-sm font-black text-zinc-100">Placar Exclusivo 🎯</p>
                 {scoringMode === "exclusive" && <CheckCircle2 className="h-4 w-4 text-primary" />}
               </div>
               <p className="mt-1 text-xs text-zinc-400">Cada placar só pode ser escolhido por uma pessoa. Se alguém já cravou 1-0, esse placar está fechado.</p>
             </button>
           </div>
        </div>

        <div className="surface-card-soft rounded-[20px] p-4 border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-100">É um bolão pago? 💸</p>
              <p className="text-xs text-zinc-400">Arrecade entre amigos (pagamento por fora)</p>
            </div>
            <button 
              onClick={() => setIsPaid(!isPaid)}
              className={cn("w-12 h-6 rounded-full transition-colors relative", isPaid ? "bg-emerald-500" : "bg-white/10")}
            >
              <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", isPaid ? "left-7" : "left-1")} />
            </button>
          </div>

          {isPaid && (
            <div className="pt-2 space-y-4 border-t border-white/5">
              <div>
                <p className="mb-2 text-xs font-bold text-zinc-300">Valor da entrada (R$)</p>
                <input
                  type="number"
                  value={entryFee}
                  onChange={(e) => setEntryFee(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Ex: 50"
                  className="surface-input w-full rounded-xl px-4 py-3 text-sm font-black placeholder:text-zinc-600"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-bold text-zinc-300">Chave PIX (Para receber)</p>
                <input
                  type="text"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="Ex: 11999999999 ou seunome@email.com"
                  className="surface-input w-full rounded-xl px-4 py-3 text-sm font-black placeholder:text-zinc-600"
                  maxLength={100}
                />
              </div>
              
              <div>
                <p className="mb-2 text-xs font-bold text-zinc-300">Como dividir o prêmio?</p>
                <div className="grid gap-2">
                  <button onClick={() => setPrizeDistribution("winner_takes_all")}
                    className={cn("rounded-xl border p-3 text-left transition-all flex items-center justify-between",
                      prizeDistribution === "winner_takes_all" ? "border-emerald-500/50 bg-emerald-500/10" : "surface-card-strong border-transparent hover:border-white/10")}>
                    <div>
                      <p className="text-xs font-black">🥇 O Vencedor leva tudo</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">100% do valor para o primeiro lugar</p>
                    </div>
                    {prizeDistribution === "winner_takes_all" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </button>
                  <button onClick={() => setPrizeDistribution("70_20_10")}
                    className={cn("rounded-xl border p-3 text-left transition-all flex items-center justify-between",
                      prizeDistribution === "70_20_10" ? "border-emerald-500/50 bg-emerald-500/10" : "surface-card-strong border-transparent hover:border-white/10")}>
                    <div>
                      <p className="text-xs font-black">📊 Pódio Justo (70% - 20% - 10%)</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Paga bem ao 1º e recompensa 2º e 3º</p>
                    </div>
                    {prizeDistribution === "70_20_10" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </button>
                  <button onClick={() => setPrizeDistribution("custom")}
                    className={cn("rounded-xl border p-3 text-left transition-all flex items-center justify-between",
                      prizeDistribution === "custom" ? "border-emerald-500/50 bg-emerald-500/10" : "surface-card-strong border-transparent hover:border-white/10")}>
                    <div>
                      <p className="text-xs font-black">⚙️ Personalizado</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Definir as próprias regras de rateio</p>
                    </div>
                    {prizeDistribution === "custom" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </button>
                </div>
                
                {prizeDistribution === "custom" && (
                  <textarea
                    value={customPrizeDist}
                    onChange={(e) => setCustomPrizeDist(e.target.value)}
                    placeholder="Ex: 50% pro 1º, 30% pro 2º, devolução pro 3º..."
                    className="surface-input mt-2 min-h-[60px] w-full rounded-xl px-4 py-3 text-[11px] placeholder:text-zinc-600"
                  />
                )}
              </div>

              <p className="mt-2 text-[10px] text-zinc-500 text-center leading-relaxed">
                ⚠️ O ArenaCopa é apenas uma ferramenta de diversão e <strong>NÃO realiza</strong> cobranças, split de pagamentos ou intermediação financeira. Toda a responsabilidade de arrecadação e pagamento é do administrador do bolão.
              </p>
            </div>
          )}
        </div>

        <div>
          <button onClick={() => setShowAdvanced(!showAdvanced)}
            className="surface-card-soft flex w-full items-center justify-between rounded-[20px] px-4 py-3 border-white/5">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-zinc-300" />
              <div className="text-left">
                <p className="text-sm font-bold text-zinc-100">Sistema de pontuação</p>
                <p className="text-xs text-zinc-400">
                  {presetKey === "standard" ? "Padrão (recomendado)" : presetKey === "risky" ? "Arriscado" : "Conservador"}
                </p>
              </div>
            </div>
            <ChevronRight className={cn("h-4 w-4 text-zinc-400 transition-transform", showAdvanced && "rotate-90")} />
          </button>
          {showAdvanced && (
            <div className="mt-3 surface-card-soft rounded-[20px] p-4 space-y-3 border-white/5">
              <p className="text-xs text-zinc-300 mb-2">Quanto vale cada tipo de acerto? Escolha o sistema que combina com o seu grupo.</p>
              {(["standard", "risky", "conservative"] as const).map((k) => (
                <button key={k} onClick={() => { setPresetKey(k); setScoringRules(PRESETS[k]); }}
                  className={cn("w-full rounded-[16px] border p-3 text-left transition-all",
                    presetKey === k ? "border-primary bg-primary/10" : "surface-card-strong border-transparent hover:border-white/10")}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">
                      {k === "standard" ? "⚖️ Padrão" : k === "risky" ? "🎲 Arriscado" : "🛡️ Conservador"}
                    </p>
                    {presetKey === k && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    {k === "standard" && "Placar exato: 10pts · Vencedor: 3pts · Participação: 1pt"}
                    {k === "risky"    && "Placar exato: 20pts · Vencedor: 5pts · Sem bônus de participação"}
                    {k === "conservative" && "Placar exato: 5pts · Vencedor: 2pts · Participação: 1pt"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleCreate} disabled={creating}
          className="w-full rounded-[20px] bg-primary px-6 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-black disabled:opacity-60">
          {creating
            ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Criando...</span>
            : "Criar bolão 🎉"}
        </button>
        <p className="text-center text-xs text-zinc-400">Você poderá convidar amigos logo depois de criar.</p>
      </div>
    </div>
  );
}
