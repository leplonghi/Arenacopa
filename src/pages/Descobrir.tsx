import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Compass, Loader2, Megaphone, Newspaper, Trophy, Users2 } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { EmptyState } from "@/components/EmptyState";
import { OpportunityRail } from "@/components/opportunities/OpportunityRail";
import { cn } from "@/lib/utils";
import { useOpportunities } from "@/hooks/useOpportunities";
import { listUserBoloes, type BolaoListingCard } from "@/services/boloes/bolao-listing.service";
import {
  listDiscoverCommercialCampaigns,
  type DiscoverCommercialCampaign,
} from "@/services/commercial/commercial-discovery.service";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";

type DiscoverCard = {
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
};

const discoverCards: DiscoverCard[] = [
  {
    title: "Bolões",
    description: "Encontre bolões ativos, volte para os seus favoritos e descubra novas disputas.",
    href: "/descobrir/boloes",
    cta: "Explorar bolões",
    icon: Trophy,
  },
  {
    title: "Campanhas",
    description: "Veja campanhas e benefícios criados por negócios parceiros para dias de jogo.",
    href: "/descobrir/campanhas",
    cta: "Ver campanhas",
    icon: Megaphone,
  },
  {
    title: "Rankings",
    description: "Acompanhe disputas, evolução de participantes e destaques da comunidade.",
    href: "/descobrir/rankings",
    cta: "Abrir rankings",
    icon: Users2,
  },
  {
    title: "Conteúdo",
    description: "Notícias e informações úteis para acompanhar campeonatos sem perder contexto.",
    href: "/noticias",
    cta: "Ler conteúdo",
    icon: Newspaper,
  },
];

const sectionLabels: Record<string, string> = {
  "/descobrir": "Para você",
  "/descobrir/boloes": "Bolões",
  "/descobrir/locais": "Locais",
  "/descobrir/campanhas": "Campanhas",
  "/descobrir/rankings": "Rankings",
};

export default function Descobrir() {
  const location = useLocation();
  const currentSection = sectionLabels[location.pathname] ?? "Para você";
  const [loadingPools, setLoadingPools] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [discoverBoloes, setDiscoverBoloes] = useState<BolaoListingCard[]>([]);
  const [campaigns, setCampaigns] = useState<DiscoverCommercialCampaign[]>([]);
  const { news, isLoading: loadingNews } = useRealtimeNews({ limitCount: 3 });
  const opportunities = useOpportunities({
    activeBoloes: [],
    campaigns,
    surface: "descobrir",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPools() {
      setLoadingPools(true);
      try {
        const listing = await listUserBoloes();
        if (!cancelled) {
          setDiscoverBoloes(listing.discoverBoloes.slice(0, 6));
        }
      } catch {
        if (!cancelled) {
          setDiscoverBoloes([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPools(false);
        }
      }
    }

    void loadPools();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaigns() {
      setLoadingCampaigns(true);
      try {
        const nextCampaigns = await listDiscoverCommercialCampaigns({ limitCount: 6 });
        if (!cancelled) {
          setCampaigns(nextCampaigns);
        }
      } catch {
        if (!cancelled) {
          setCampaigns([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingCampaigns(false);
        }
      }
    }

    void loadCampaigns();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 px-4 py-4 md:px-6">
      <ArenaPanel tone="strong" className="space-y-5">
        <ArenaSectionHeader
          eyebrow="ArenaCup"
          title="Descobrir"
          hint="A nova área de descoberta reúne caminhos seguros para bolões, campanhas, rankings e conteúdo sem alterar os fluxos antigos."
        />
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(sectionLabels).map(([href, label]) => (
            <Link
              key={href}
              to={href}
              className={cn(
                "rounded-full border px-3 py-2 text-sm font-semibold transition-colors",
                currentSection === label
                  ? "border-primary/45 bg-primary/15 text-primary"
                  : "border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:text-white",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </ArenaPanel>

      <ArenaPanel className="space-y-5">
        <ArenaSectionHeader
          eyebrow="Caminhos rápidos"
          title={currentSection}
          action={
            <Link
              to="/boloes"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15"
            >
              Meus bolões
            </Link>
          }
        />

        <div className="grid gap-3 md:grid-cols-2">
          {discoverCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                to={card.href}
                className="group flex min-h-[154px] flex-col justify-between rounded-[18px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-primary/35 hover:bg-primary/[0.06]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold uppercase tracking-[0.04em] text-white">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{card.description}</p>
                  </div>
                </div>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition group-hover:translate-x-0.5">
                  {card.cta}
                </span>
              </Link>
            );
          })}
        </div>
      </ArenaPanel>

      <OpportunityRail opportunities={opportunities} title="Para você agora" />

      <ArenaPanel className="space-y-5">
        <ArenaSectionHeader
          eyebrow="Bolões"
          title="Bolões públicos"
          hint="Cards vindos da mesma listagem pública usada em Bolões. Se não houver dados, a área fica em estado vazio."
          action={
            <Link
              to="/boloes"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
            >
              Meus bolões
            </Link>
          }
        />

        {loadingPools ? (
          <LoadingRow />
        ) : discoverBoloes.length === 0 ? (
          <EmptyState
            icon="⚽"
            title="Nenhum bolão público disponível agora"
            description="Quando surgirem bolões abertos, eles aparecem aqui primeiro."
            className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
            glowColor="green"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {discoverBoloes.map((bolao) => (
              <article key={bolao.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-bold uppercase tracking-[0.04em] text-white">
                      {bolao.name}
                    </h3>
                    {bolao.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{bolao.description}</p>
                    ) : null}
                  </div>
                  <Trophy className="h-5 w-5 shrink-0 text-primary" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                    {bolao.status}
                  </span>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                    {bolao.is_paid ? "Pago" : "Grátis"}
                  </span>
                </div>
                <Link
                  to={`/b/${bolao.invite_code}`}
                  aria-label={`Entrar no bolão ${bolao.name}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-[16px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
                >
                  Entrar
                </Link>
              </article>
            ))}
          </div>
        )}
      </ArenaPanel>

      <ArenaPanel className="space-y-5">
        <ArenaSectionHeader
          eyebrow="Campanhas"
          title="Campanhas oficiais"
          hint="Campanhas publicadas existentes em commercial_campaigns. Nenhuma regra comercial nova é criada nesta etapa."
          action={
            <Link
              to="/negocios"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
            >
              Negócios
            </Link>
          }
        />

        {loadingCampaigns ? (
          <LoadingRow />
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon="🎟️"
            title="Nenhuma campanha disponível agora"
            description="Campanhas publicadas por negócios parceiros aparecem aqui."
            className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
            glowColor="gold"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                  {campaign.merchantName}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold uppercase tracking-[0.04em] text-white">
                  {campaign.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">{campaign.benefitSummary}</p>
                {campaign.city || campaign.neighborhood ? (
                  <p className="mt-3 text-xs font-semibold text-zinc-500">
                    {[campaign.neighborhood, campaign.city].filter(Boolean).join(" • ")}
                  </p>
                ) : null}
                <Link
                  to={`/c/${campaign.shareCode}`}
                  aria-label={`Ver campanha ${campaign.title}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-[16px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
                >
                  Ver campanha
                </Link>
              </article>
            ))}
          </div>
        )}
      </ArenaPanel>

      <ArenaPanel className="space-y-5">
        <ArenaSectionHeader
          eyebrow="Conteúdo"
          title="Conteúdo em alta"
          hint="Usa o feed de notícias já existente. Links externos continuam tratados pelo navegador."
          action={
            <Link
              to="/noticias"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
            >
              Ver notícias
            </Link>
          }
        />

        {loadingNews ? (
          <LoadingRow />
        ) : news.length === 0 ? (
          <EmptyState
            icon="📰"
            title="Nenhum conteúdo em alta agora"
            description="Quando houver notícias publicadas, elas aparecem aqui."
            className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
            glowColor="none"
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {news.slice(0, 3).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                  {item.source_name || item.category || "ArenaCup"}
                </p>
                <h3 className="mt-2 line-clamp-2 font-display text-xl font-bold uppercase tracking-[0.04em] text-white">
                  {item.title}
                </h3>
                {item.summary || item.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-300">
                    {item.summary || item.description}
                  </p>
                ) : null}
              </a>
            ))}
          </div>
        )}
      </ArenaPanel>

      <ArenaPanel className="space-y-5">
        <ArenaSectionHeader
          eyebrow="Rankings"
          title="Rankings locais"
          hint="Nesta etapa, rankings usam o caminho existente. Contextos locais entram depois por feature flag."
          action={
            <Link
              to="/ranking"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15"
            >
              Abrir ranking
            </Link>
          }
        />
        <EmptyState
          icon="🏆"
          title="Rankings contextuais em breve"
          description="Por enquanto, use o ranking geral enquanto preparamos recortes por cidade, comunidade e campanha."
          className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
          glowColor="gold"
        />
      </ArenaPanel>

      <ArenaPanel className="grid gap-3 md:grid-cols-2">
        <Link
          to="/comunidades"
          className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20"
        >
          <Users2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">Comunidades</span>
        </Link>
        <Link
          to="/negocios"
          className="flex items-center gap-3 rounded-[18px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/20"
        >
          <Compass className="h-5 w-5 text-primary" />
          <span className="font-semibold text-white">Negócios</span>
        </Link>
      </ArenaPanel>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.03]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
