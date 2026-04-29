import { formatMatchDate, formatMatchTime } from "@/data/mockData";
import { TeamMark } from "@/components/TeamMark";
import { getMatchStageLabel } from "@/lib/match-feed";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import { CalendarDays, ChevronRight, Clock3 } from "lucide-react";
import type { MatchFeedItem } from "@/types/match-feed";

export function HomeFeaturedMatch({
  match,
  locale,
}: {
  match: MatchFeedItem;
  locale: string;
}) {
  return (
    <ArenaPanel className="p-3.5 sm:p-4">
      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_45%_0%,rgba(145,255,59,0.08),transparent_58%)]" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-display text-[1rem] font-bold uppercase tracking-[0.18em] text-primary">
            <Clock3 className="h-4 w-4" />
            {match.status === "live" ? "Jogo em destaque" : "Próximo jogo"}
          </p>
          <h2 className="mt-1 truncate font-display text-[1.35rem] font-bold uppercase tracking-[0.04em] text-white">
            {match.championship?.shortName || match.championship?.name || "ArenaCup"}
          </h2>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-[1.3rem] font-bold leading-none text-zinc-300">
            {match.status === "live"
              ? "AO VIVO"
              : formatMatchTime(match.matchDate, locale)}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-500">
            {getMatchStageLabel(match, locale)}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMark
            code={match.homeTeamCode}
            teamId={match.homeTeamId}
            crestUrl={match.homeCrest}
            name={match.homeTeamName}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-[1.45rem] font-bold leading-none text-white">{match.homeTeamName}</p>
            <p className="mt-0.5 font-display text-[1.05rem] font-bold uppercase tracking-[0.12em] text-zinc-500">{match.homeTeamCode}</p>
          </div>
        </div>

        <div className="px-2 text-center">
          <p className="font-display text-[2.15rem] font-bold uppercase leading-none text-zinc-400 sm:text-[2.45rem]">
            {match.status === "scheduled" ? "VS" : `${match.homeScore ?? 0} x ${match.awayScore ?? 0}`}
          </p>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <p className="truncate font-display text-[1.45rem] font-bold leading-none text-white">{match.awayTeamName}</p>
            <p className="mt-0.5 font-display text-[1.05rem] font-bold uppercase tracking-[0.12em] text-zinc-500">{match.awayTeamCode}</p>
          </div>
          <TeamMark
            code={match.awayTeamCode}
            teamId={match.awayTeamId}
            crestUrl={match.awayCrest}
            name={match.awayTeamName}
            size="md"
          />
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between gap-3 border-t border-[#8d8158]/22 pt-3">
        <div className="flex min-w-0 items-center gap-2 text-zinc-400">
          <CalendarDays className="h-4 w-4" />
          <span className="truncate font-display text-[1.15rem] font-bold">
            {formatMatchDate(match.matchDate, locale)} • {formatMatchTime(match.matchDate, locale)}
          </span>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
      </div>
    </ArenaPanel>
  );
}
