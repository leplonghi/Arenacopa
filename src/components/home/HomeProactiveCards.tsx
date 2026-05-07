import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Newspaper, Sparkles, Target, Trophy } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { getHomeNextAction } from "@/lib/home-next-action";
import type { MatchFeedItem } from "@/types/match-feed";
import { tStatic } from "@/i18n/staticText";

export function TodayArenaCard({
  pendingCount,
  matchCount,
  poolCount,
}: {
  pendingCount: number;
  matchCount: number;
  poolCount: number;
}) {
  return (
    <ArenaPanel tone="strong" className="p-4 sm:p-5">
      <ArenaSectionHeader
        eyebrow="Home"
        title="Hoje na Arena"
        hint="O que importa agora nos seus campeonatos, bolões e rankings."
        action={
          <Link
            to="/descobrir"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15"
          >
            Descobrir
          </Link>
        }
      />
      <p className="mt-3 max-w-[680px] text-sm leading-6 text-zinc-300">
        O que importa agora nos seus campeonatos, bolões e rankings.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <DailyStatCard
          label="Chutes"
          value={pendingCount}
          caption={pendingCount === 1 ? "pendente agora" : "pendentes agora"}
          to="/boloes"
          accent
        />
        <DailyStatCard
          label="Jogos"
          value={matchCount}
          caption={matchCount === 1 ? "em foco" : "em foco"}
          to="/campeonatos"
        />
        <DailyStatCard
          label="Bolões"
          value={poolCount}
          caption={poolCount === 1 ? "ativo" : "ativos"}
          to="/boloes"
        />
      </div>
    </ArenaPanel>
  );
}

export function NextActionCard({
  pendingCount,
  firstPendingBolaoId,
  poolCount,
  hasFeaturedMatch,
  pendingJoinRequestCount = 0,
  firstPendingRequestBolaoId,
}: {
  pendingCount: number;
  firstPendingBolaoId?: string;
  poolCount: number;
  hasFeaturedMatch: boolean;
  pendingJoinRequestCount?: number;
  firstPendingRequestBolaoId?: string | null;
}) {
  const action = getHomeNextAction({
    pendingCount,
    firstPendingBolaoId,
    poolCount,
    hasFeaturedMatch,
    pendingJoinRequestCount,
    firstPendingRequestBolaoId,
  });

  const hasUrgentJoinRequest = pendingJoinRequestCount > 0;

  return (
    <ArenaPanel className={["p-4 sm:p-5", hasUrgentJoinRequest ? "border-red-500/20 bg-red-500/[0.04]" : ""].join(" ")}>
      <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-center">
        <div>
          <p className={["arena-kicker", hasUrgentJoinRequest ? "text-red-400" : "text-primary"].join(" ")}>
            {hasUrgentJoinRequest ? "⚠️ Atenção necessária" : "Próxima ação"}
          </p>
          <h2 className="mt-2 font-display text-[2.25rem] font-bold uppercase leading-[0.9] tracking-[0.035em] text-white">
            {action.title}
          </h2>
          <p className="mt-3 max-w-[620px] text-sm leading-6 text-zinc-300">{action.description}</p>
        </div>

        <Link
          to={action.ctaRoute}
          className={[
            "inline-flex min-h-14 items-center justify-center gap-2 rounded-[18px] px-5 font-display text-[1.45rem] font-bold uppercase tracking-[0.04em] transition hover:brightness-105",
            hasUrgentJoinRequest
              ? "bg-red-500 text-white"
              : "bg-primary text-black",
          ].join(" ")}
        >
          <Target className="h-5 w-5" />
          {action.ctaLabel}
        </Link>
      </div>
    </ArenaPanel>
  );
}

export function DailyStatCard({
  label,
  value,
  caption,
  to,
  accent = false,
}: {
  label: string;
  value: number | string;
  caption: string;
  to: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        accent
          ? "group rounded-[18px] border border-primary/30 bg-primary/[0.09] p-3 transition hover:bg-primary/[0.13]"
          : "group rounded-[18px] border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20 hover:bg-white/[0.06]"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[1rem] font-bold uppercase tracking-[0.12em] text-primary">{label}</p>
          <p className="mt-1 font-display text-[2.35rem] font-bold leading-none text-white">{value}</p>
          <p className="mt-1 text-xs font-semibold text-zinc-400">{caption}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function CuriosityCard({ match }: { match: MatchFeedItem | null }) {
  const title = match ? `${match.homeTeamName} x ${match.awayTeamName}` : "Conteúdo para você";
  const description = match
    ? `Partida em foco para acompanhar contexto, rodada e possíveis chutes.`
    : "Notícias, estatísticas e curiosidades ajudam você a voltar mesmo fora do momento de palpitar.";

  return (
    <ArenaPanel className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-primary/25 bg-primary/10 text-primary">
            <Newspaper className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="arena-kicker text-primary">{tStatic("Conteúdo para você")}</p>
            <h2 className="mt-1 truncate font-display text-[1.9rem] font-bold uppercase tracking-[0.035em] text-white">
              {title}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-snug text-zinc-300">{description}</p>
          </div>
        </div>
        <Link
          to="/noticias"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
        >
          Ver notícias
        </Link>
      </div>
    </ArenaPanel>
  );
}

export function RankingHighlightCard({
  bestRank,
  totalPoints,
}: {
  bestRank: number;
  totalPoints: number;
}) {
  const hasRank = bestRank !== 999;

  return (
    <ArenaPanel className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="arena-kicker text-primary">{tStatic("Ranking em destaque")}</p>
          <h2 className="mt-1 font-display text-[2rem] font-bold uppercase leading-none tracking-[0.035em] text-white">
            {hasRank ? `Sua melhor posição é #${bestRank}` : "Entre em um ranking"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {hasRank
              ? `${totalPoints.toLocaleString("pt-BR")} pontos somados nos seus bolões.`
              : "Participe de um bolão para acompanhar evolução, pontos e status."}
          </p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-primary/25 bg-primary/10 text-primary">
          {hasRank ? <Trophy className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
        </span>
      </div>
      <Link
        to="/ranking"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15"
      >
        <Sparkles className="h-4 w-4" />
        Abrir ranking
      </Link>
    </ArenaPanel>
  );
}
