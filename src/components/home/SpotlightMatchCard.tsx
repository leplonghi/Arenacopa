import { Link } from "react-router-dom";
import { CalendarDays, ChevronRight } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import { formatMatchDate, formatMatchTime } from "@/data/mockData";
import type { MatchFeedItem } from "@/types/match-feed";

export function SpotlightMatchCard({
  match,
  href,
  locale,
}: {
  match: MatchFeedItem;
  href: string;
  locale: string;
}) {
  const isLive = match.status === "live";
  const scoreLabel = isLive
    ? `${match.homeScore ?? 0} x ${match.awayScore ?? 0}`
    : "VS";

  return (
    <Link
      to={href}
      className="group block rounded-[20px] border border-[#8d8158]/28 bg-[#03120e]/84 p-3 transition hover:border-primary/35 hover:bg-[#051914]/92"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex rounded-[9px] bg-red-700 px-2.5 py-0.5 font-display text-[0.95rem] font-bold uppercase tracking-[0.04em] text-white shadow-[0_0_18px_rgba(185,28,28,0.25)]">
          {isLive ? "Ao vivo" : "Em breve"}
        </span>
        <div className="flex items-center gap-2 font-display text-[1.15rem] font-bold text-zinc-500">
          Ver jogo
          <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="min-w-0 text-center">
          <div className="mx-auto flex justify-center">
            <TeamMark
              code={match.homeTeamCode}
              teamId={match.homeTeamId}
              crestUrl={match.homeCrest}
              name={match.homeTeamName}
              size="md"
            />
          </div>
          <p className="mt-1 truncate font-display text-[1.25rem] font-bold leading-none text-white">
            {match.homeTeamName}
          </p>
        </div>

        <p className="font-display text-[2.35rem] font-bold uppercase leading-none tracking-[0.02em] text-white">
          {scoreLabel}
        </p>

        <div className="min-w-0 text-center">
          <div className="mx-auto flex justify-center">
            <TeamMark
              code={match.awayTeamCode}
              teamId={match.awayTeamId}
              crestUrl={match.awayCrest}
              name={match.awayTeamName}
              size="md"
            />
          </div>
          <p className="mt-1 truncate font-display text-[1.25rem] font-bold leading-none text-white">
            {match.awayTeamName}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#8d8158]/20 pt-2.5 text-zinc-400">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate font-display text-[1.05rem] font-bold">
            {formatMatchDate(match.matchDate, locale)} • {formatMatchTime(match.matchDate, locale)}
          </span>
        </div>
        <span className="shrink-0 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary">
          Abrir
        </span>
      </div>
    </Link>
  );
}
