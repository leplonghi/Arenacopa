import { formatMatchDate, formatMatchTime } from "@/data/mockData";
import { TeamMark } from "@/components/TeamMark";
import { getMatchStageLabel } from "@/lib/match-feed";
import { ArenaPanel } from "@/components/arena/ArenaPrimitives";
import type { MatchFeedItem } from "@/types/match-feed";

export function HomeFeaturedMatch({
  match,
  locale,
}: {
  match: MatchFeedItem;
  locale: string;
}) {
  return (
    <ArenaPanel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="arena-kicker text-primary">
            {match.status === "live" ? "Jogo em destaque" : "Próximo jogo"}
          </p>
          <h2 className="mt-2 font-display text-[2rem] font-black uppercase text-white">
            {match.championship?.shortName || match.championship?.name || "ArenaCup"}
          </h2>
        </div>
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-right">
          <p className="font-display text-xl font-black text-primary">
            {match.status === "live"
              ? "AO VIVO"
              : `${formatMatchDate(match.matchDate, locale)} • ${formatMatchTime(match.matchDate, locale)}`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-3 text-center">
          <TeamMark
            code={match.homeTeamCode}
            teamId={match.homeTeamId}
            crestUrl={match.homeCrest}
            name={match.homeTeamName}
            size="lg"
            className="h-20 w-20 rounded-[24px] border-primary/15 bg-white/[0.05] p-3"
          />
          <div>
            <p className="text-[2rem] font-black leading-none text-white">
              {match.homeScore ?? " "}
            </p>
            <p className="mt-2 text-lg font-bold text-white">{match.homeTeamName}</p>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-500">{match.homeTeamCode}</p>
          </div>
        </div>

        <div className="px-2 text-center">
          <p className="font-display text-[3rem] font-black uppercase text-zinc-400">
            {match.status === "scheduled" ? "VS" : "x"}
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
            {getMatchStageLabel(match, locale)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <TeamMark
            code={match.awayTeamCode}
            teamId={match.awayTeamId}
            crestUrl={match.awayCrest}
            name={match.awayTeamName}
            size="lg"
            className="h-20 w-20 rounded-[24px] border-primary/15 bg-white/[0.05] p-3"
          />
          <div>
            <p className="text-[2rem] font-black leading-none text-white">
              {match.awayScore ?? " "}
            </p>
            <p className="mt-2 text-lg font-bold text-white">{match.awayTeamName}</p>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-500">{match.awayTeamCode}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "1", value: "44%" },
          { label: "X", value: "26%" },
          { label: "2", value: "30%" },
        ].map((option, index) => (
          <div
            key={option.label}
            className={
              index === 0
                ? "rounded-[20px] border border-[#8ff935] bg-[#1f5f19]/70 px-4 py-4 text-center shadow-[0_0_24px_rgba(119,255,49,0.18)]"
                : "rounded-[20px] border border-white/10 bg-white/[0.04] px-4 py-4 text-center"
            }
          >
            <p className="font-display text-[2rem] font-black text-white">{option.label}</p>
            <p className="text-xl font-black text-zinc-200">{option.value}</p>
          </div>
        ))}
      </div>
    </ArenaPanel>
  );
}
