import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Crown, ImageDown, Loader2, Megaphone, Plus, QrCode, Sparkles, Users2 } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { EmptyState } from "@/components/EmptyState";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import { useAuth } from "@/contexts/AuthContext";
import { useOpportunities } from "@/hooks/useOpportunities";
import { listCreatorBoloes, type CreatorBolaoSummary } from "@/services/boloes/creator-pro.service";
import { tStatic } from "@/i18n/staticText";

const creatorTools = [
  {
    title: "Kit de divulgação",
    description: "Links, QR e textos prontos para chamar participantes sem montar tudo do zero.",
    icon: QrCode,
    cta: "Criar bolão",
    to: "/boloes/criar",
  },
  {
    title: "Comunidades",
    description: "Organize várias edições com a mesma turma ao longo da temporada.",
    icon: Users2,
    cta: "Abrir comunidades",
    to: "/comunidades",
  },
  {
    title: "Sponsor próprio",
    description: "Prepare espaços para marcas apoiadoras em bolões, rankings e cards compartilháveis.",
    icon: Megaphone,
    cta: "Ver Negócios",
    to: "/negocios",
  },
  {
    title: "Analytics",
    description: "Acompanhe sinais simples de participação, convites e evolução dos seus bolões.",
    icon: BarChart3,
    cta: "Ver ranking",
    to: "/ranking",
  },
];

export default function CreatorPro() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [createdBoloes, setCreatedBoloes] = useState<CreatorBolaoSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatorBoloes() {
      if (!user?.id) {
        setCreatedBoloes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const nextBoloes = await listCreatorBoloes({ userId: user.id });
        if (!cancelled) {
          setCreatedBoloes(nextBoloes);
        }
      } catch {
        if (!cancelled) {
          setCreatedBoloes([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCreatorBoloes();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const creatorMetrics = useMemo(
    () => [
      { label: "Criados", value: createdBoloes.length },
      { label: "Públicos", value: createdBoloes.filter((bolao) => bolao.category === "public").length },
      { label: "Ativos", value: createdBoloes.filter((bolao) => bolao.status !== "deleted").length },
    ],
    [createdBoloes],
  );
  const opportunities = useOpportunities({
    user,
    activeBoloes: createdBoloes,
    createdBoloes,
    surface: "creator_pro",
  });

  return (
    <div className="arena-screen space-y-6 pb-28">
      <ArenaPanel tone="strong" className="p-5 sm:p-6">
        <ArenaSectionHeader
          eyebrow="Bolões"
          title="Creator Pro"
          hint="Organize bolões com cara profissional, engaje sua comunidade e gere materiais prontos para divulgação."
          action={
            <Link
              to="/boloes/criar"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] bg-primary px-4 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
            >
              <Plus className="h-4 w-4" />
              Criar bolão
            </Link>
          }
        />

        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
          Organize bolões com cara profissional, engaje sua comunidade e gere materiais prontos para divulgação.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {creatorMetrics.map((metric, index) => (
            <div
              key={metric.label}
              className={
                index === 0
                  ? "rounded-[18px] border border-primary/30 bg-primary/[0.08] p-4"
                  : "rounded-[18px] border border-white/10 bg-white/[0.04] p-4"
              }
            >
              <p className="font-display text-[1rem] font-bold uppercase tracking-[0.12em] text-primary">
                {metric.label}
              </p>
              <p className="mt-2 font-display text-[2.4rem] font-bold leading-none text-white">{metric.value}</p>
            </div>
          ))}
        </div>
      </ArenaPanel>

      <div className="grid gap-3 lg:grid-cols-4">
        {creatorTools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              key={tool.title}
              to={tool.to}
              className="group rounded-[22px] border border-white/10 bg-white/[0.04] p-5 text-white transition hover:border-primary/30 hover:bg-primary/[0.06]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-primary/25 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-[0.04em]">{tool.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{tool.description}</p>
              <span className="mt-4 inline-flex text-[11px] font-black uppercase tracking-[0.16em] text-primary transition group-hover:translate-x-0.5">
                {tool.cta}
              </span>
            </Link>
          );
        })}
      </div>

      <OpportunityRail opportunities={opportunities} title="Oportunidades do criador" />

      <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <ArenaPanel className="p-5">
          <ArenaSectionHeader
            eyebrow="Organização"
            title="Meus bolões criados"
            hint="Lista seus bolões em que você aparece como criador. Se a regra de leitura bloquear algo, a página continua em estado vazio."
          />

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : createdBoloes.length === 0 ? (
            <EmptyState
              icon="🏆"
              title="Você ainda não tem bolões criados"
              description="Crie sua primeira edição e depois volte aqui para organizar divulgação, comunidade e materiais."
              className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03]"
              glowColor="green"
            />
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {createdBoloes.map((bolao) => (
                <Link
                  key={bolao.id}
                  to={`/boloes/${bolao.id}`}
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-primary/30 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <BolaoAvatar
                      avatarUrl={bolao.avatarUrl}
                      fallback="⚽"
                      alt={bolao.name}
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/15 bg-primary/10 text-2xl"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-[1.4rem] font-semibold uppercase leading-none text-white">
                        {bolao.name}
                      </h3>
                      {bolao.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{bolao.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {bolao.category === "public" ? "Público" : "Privado"}
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                      {bolao.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ArenaPanel>

        <ArenaPanel className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-primary/25 bg-primary/10 text-primary">
              <ImageDown className="h-5 w-5" />
            </span>
            <div>
              <p className="arena-kicker text-primary">{tStatic("Materiais")}</p>
              <h2 className="mt-1 font-display text-[2rem] font-bold uppercase leading-none tracking-[0.035em] text-white">
                Cards e QR prontos
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Use o painel Compartilhar dentro de cada bolão para copiar link, código e mensagem pronta.
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-zinc-300">
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">{tStatic("Card quadrado")}</div>
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">{tStatic("Story")}</div>
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">{tStatic("Cartaz com QR")}</div>
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3">{tStatic("Card de ranking")}</div>
          </div>

          <Link
            to="/premium"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-primary/30 bg-primary/10 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-primary transition hover:bg-primary/15"
          >
            <Crown className="h-4 w-4" />
            Ver upgrade
          </Link>
        </ArenaPanel>
      </div>

      <ArenaPanel className="p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-primary/25 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-white">{tStatic("Upgrade preparado, checkout fora desta etapa")}</p>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                Esta primeira versão cria a casa do Creator Pro sem assinatura nova, cobrança ou automação comercial.
              </p>
            </div>
          </div>
          <Link
            to="/boloes"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
          >
            Voltar para Bolões
          </Link>
        </div>
      </ArenaPanel>
    </div>
  );
}
