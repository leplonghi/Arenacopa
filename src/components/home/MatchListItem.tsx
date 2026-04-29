import { Link } from "react-router-dom";
import { BellDot } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import type { MatchFeedItem } from "@/types/match-feed";
import { formatMatchTime } from "@/data/mockData";

export function MatchListItem({
  match,
  locale,
  href,
  audienceCount,
}: {
  match: MatchFeedItem;
  locale: string;
  href: string;
  audienceCount: number;
}) {
  return (
    <Link
      to={href}
      className="grid grid-cols-[auto,minmax(0,1fr)] items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2.5 transition hover:bg-white/[0.05] sm:grid-cols-[auto,minmax(0,1fr),auto] sm:gap-3 sm:px-4"
    >
      <div className="min-w-[54px]">
        <p className="font-display text-[1.2rem] font-semibold leading-none text-primary sm:text-[1.35rem]">
          {formatMatchTime(match.matchDate, locale)}
        </p>
        <p className="max-w-[52px] truncate text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500 sm:max-w-[58px] sm:text-[10px] sm:tracking-[0.12em]">
          {match.championship?.shortName || "Liga"}
        </p>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <TeamMark code={match.homeTeamCode} teamId={match.homeTeamId} crestUrl={match.homeCrest} name={match.homeTeamName} size="sm" />
          <span className="hidden min-w-0 truncate text-[10px] font-semibold leading-tight text-zinc-500 sm:block">
            {match.homeTeamName}
          </span>
        </div>
        <div className="flex shrink-0 gap-0.5 sm:gap-1">
          {["1", "X", "2"].map((option, optionIndex) => (
            <div
              key={option}
              className={
                optionIndex === 0
                  ? "flex h-7 w-7 items-center justify-center rounded-[10px] border border-primary/40 bg-primary/15 font-display text-sm font-semibold text-primary sm:h-8 sm:w-8 sm:rounded-xl sm:text-base"
                  : "flex h-7 w-7 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.03] font-display text-sm font-semibold text-zinc-400 sm:h-8 sm:w-8 sm:rounded-xl sm:text-base"
              }
            >
              {option}
            </div>
          ))}
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5 text-right sm:gap-2">
          <span className="hidden min-w-0 truncate text-[10px] font-semibold leading-tight text-zinc-500 sm:block">
            {match.awayTeamName}
          </span>
          <TeamMark code={match.awayTeamCode} teamId={match.awayTeamId} crestUrl={match.awayCrest} name={match.awayTeamName} size="sm" />
        </div>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary sm:flex">
        <BellDot className="h-4 w-4" />
        {audienceCount.toLocaleString("pt-BR")}
      </div>
    </Link>
  );
}
