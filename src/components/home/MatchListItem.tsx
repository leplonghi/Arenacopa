import { Link } from "react-router-dom";
import { BellDot } from "lucide-react";
import { cn } from "@/lib/utils";
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
      className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
    >
      <div className="min-w-[62px]">
        <p className="font-display text-[1.7rem] font-black leading-none text-primary">
          {formatMatchTime(match.matchDate, locale)}
        </p>
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
          {match.championship?.shortName || "Liga"}
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-3">
          <TeamMark code={match.homeTeamCode} teamId={match.homeTeamId} crestUrl={match.homeCrest} name={match.homeTeamName} size="sm" />
          <span className="font-bold text-white">{match.homeTeamName}</span>
        </div>
        <div className="flex gap-1">
          {["1", "X", "2"].map((option, optionIndex) => (
            <div
              key={option}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border font-display text-lg font-black",
                optionIndex === 0 ? "border-primary/40 bg-primary/15 text-primary" : "border-white/10 bg-white/[0.03] text-zinc-400",
              )}
            >
              {option}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 text-right">
          <span className="font-bold text-white">{match.awayTeamName}</span>
          <TeamMark code={match.awayTeamCode} teamId={match.awayTeamId} crestUrl={match.awayCrest} name={match.awayTeamName} size="sm" />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-black text-primary">
        <BellDot className="h-4 w-4" />
        {audienceCount.toLocaleString("pt-BR")}
      </div>
    </Link>
  );
}
