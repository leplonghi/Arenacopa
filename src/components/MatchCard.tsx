import { getTeam, formatMatchTime, getStadium, type Match } from "@/data/mockData";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  className?: string;
}

export function MatchCard({ match, compact = false, className }: MatchCardProps) {
  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);
  const stadium = getStadium(match.stadium);

  if (compact) {
    return (
      <div className={cn("glass-card p-3 flex items-center gap-3", className)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">{home.flag}</span>
          <span className="text-xs font-semibold truncate">{home.code}</span>
        </div>
        <div className="flex flex-col items-center shrink-0">
          {match.status === "finished" || match.status === "live" ? (
            <span className="text-sm font-bold">{match.homeScore} - {match.awayScore}</span>
          ) : (
            <span className="text-xs text-muted-foreground">{formatMatchTime(match.date)}</span>
          )}
          <StatusBadge status={match.status} minute={match.minute} />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs font-semibold truncate">{away.code}</span>
          <span className="text-lg">{away.flag}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {match.group ? `Grupo ${match.group}` : match.phase}
        </span>
        <StatusBadge status={match.status} minute={match.minute} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-2xl">{home.flag}</span>
          <span className="text-xs font-bold">{home.code}</span>
        </div>

        <div className="flex flex-col items-center px-4">
          {match.status === "finished" || match.status === "live" ? (
            <div className="flex items-center gap-2">
              <span className={cn("text-2xl font-black", match.status === "live" && "text-copa-live")}>{match.homeScore}</span>
              <span className="text-muted-foreground text-lg">-</span>
              <span className={cn("text-2xl font-black", match.status === "live" && "text-copa-live")}>{match.awayScore}</span>
            </div>
          ) : (
            <span className="text-xl font-bold">{formatMatchTime(match.date)}</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-2xl">{away.flag}</span>
          <span className="text-xs font-bold">{away.code}</span>
        </div>
      </div>

      {stadium && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-muted-foreground">{stadium.name} • {stadium.city}</span>
        </div>
      )}
    </div>
  );
}
