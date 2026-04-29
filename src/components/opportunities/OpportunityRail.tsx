import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import {
  BarChart3,
  Crown,
  ImageDown,
  Megaphone,
  Newspaper,
  Plus,
  Share2,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import type { Opportunity, OpportunityType } from "@/hooks/useOpportunities";

const opportunityIcons: Record<OpportunityType, ComponentType<{ className?: string }>> = {
  predict_now: Target,
  join_pool: Trophy,
  create_pool: Plus,
  read_news: Newspaper,
  view_stat: BarChart3,
  share_ranking: Share2,
  discover_local_offer: Megaphone,
  upgrade_creator: Crown,
  generate_media_kit: ImageDown,
  create_campaign: Sparkles,
};

export function OpportunityRail({
  opportunities,
  title = "Oportunidades",
  eyebrow = "Próximas ações",
  limit = 3,
}: {
  opportunities: Opportunity[];
  title?: string;
  eyebrow?: string;
  limit?: number;
}) {
  const visibleOpportunities = opportunities.slice(0, limit);

  if (!visibleOpportunities.length) {
    return null;
  }

  return (
    <ArenaPanel className="p-4 sm:p-5">
      <ArenaSectionHeader
        eyebrow={eyebrow}
        title={title}
        hint="Sugestões locais calculadas no app a partir dos dados já carregados nesta tela."
      />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {visibleOpportunities.map((opportunity) => {
          const Icon = opportunityIcons[opportunity.type];

          return (
            <Link
              key={opportunity.id}
              to={opportunity.ctaRoute}
              className="group flex min-h-[170px] flex-col justify-between rounded-[18px] border border-white/10 bg-white/[0.04] p-4 text-white transition hover:border-primary/35 hover:bg-primary/[0.06]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-xl font-bold uppercase tracking-[0.04em]">
                    {opportunity.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{opportunity.description}</p>
                </div>
              </div>
              <span className="mt-4 inline-flex text-[11px] font-black uppercase tracking-[0.16em] text-primary transition group-hover:translate-x-0.5">
                {opportunity.ctaLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </ArenaPanel>
  );
}
