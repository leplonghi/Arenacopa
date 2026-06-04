import { Link } from "react-router-dom";
import { CalendarDays, Clock, Radio } from "lucide-react";
import { TeamMark } from "@/components/TeamMark";
import { formatMatchDate, formatMatchTime } from "@/data/mockData";
import type { MatchFeedItem } from "@/types/match-feed";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function useCountdown(matchDate: string) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.floor((new Date(matchDate).getTime() - Date.now()) / 1000)
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft(Math.floor((new Date(matchDate).getTime() - Date.now()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [matchDate, secondsLeft]);

  return secondsLeft;
}

function formatCountdown(seconds: number): { text: string; urgency: "normal" | "soon" | "imminent" } {
  if (seconds <= 0) return { text: "Agora!", urgency: "imminent" };
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h >= 24) {
    const days = Math.floor(h / 24);
    return { text: `em ${days}d ${h % 24}h`, urgency: "normal" };
  }
  if (h >= 1) return { text: `em ${h}h ${m}m`, urgency: h < 2 ? "soon" : "normal" };
  if (m >= 1) return { text: `em ${m}m ${s}s`, urgency: m < 30 ? "soon" : "normal" };
  return { text: `em ${s}s`, urgency: "imminent" };
}

export function SpotlightMatchCard({
  match,
  href,
  locale,
  compact = false,
  contextLabel,
}: {
  match: MatchFeedItem;
  href: string;
  locale: string;
  compact?: boolean;
  contextLabel?: string;
}) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const scoreLabel = isLive || isFinished
    ? `${match.homeScore ?? 0} x ${match.awayScore ?? 0}`
    : "VS";

  const secondsLeft = useCountdown(match.matchDate);
  const { text: countdownText, urgency } = formatCountdown(secondsLeft);
  const showCountdown = !isLive && !isFinished && secondsLeft > 0;

  const urgencyClass = {
    normal: "text-zinc-400",
    soon: "text-amber-400",
    imminent: "text-red-400 animate-pulse",
  }[urgency];

  return (
    <Link
      to={href}
      className="group block rounded-[20px] border border-[#8d8158]/28 bg-[#03120e]/84 p-3 transition hover:border-primary/35 hover:bg-[#051914]/92"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-[9px] bg-red-700 px-2.5 py-0.5 font-display text-[0.95rem] font-bold uppercase tracking-[0.04em] text-white shadow-[0_0_18px_rgba(185,28,28,0.25)]">
              <Radio className="h-3 w-3 animate-pulse" />
              Ao vivo
            </span>
          ) : isFinished ? (
            <span className="inline-flex rounded-[9px] bg-zinc-700/60 px-2.5 py-0.5 font-display text-[0.95rem] font-bold uppercase tracking-[0.04em] text-zinc-300">
              Encerrado
            </span>
          ) : (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-[9px] px-2.5 py-0.5 font-display text-[0.95rem] font-bold uppercase tracking-[0.04em]",
              urgency === "imminent"
                ? "bg-red-700/30 text-red-400"
                : urgency === "soon"
                ? "bg-amber-700/25 text-amber-300"
                : "bg-primary/[0.1] text-primary/80"
            )}>
              <Clock className="h-3 w-3" />
              {countdownText}
            </span>
          )}
          {contextLabel ? (
            <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-primary/80">
              {contextLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className={compact ? "mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2" : "mt-3 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3"}>
        <div className="min-w-0 text-center">
          <div className="mx-auto flex justify-center">
            <TeamMark
              code={match.homeTeamCode}
              teamId={match.homeTeamId}
              crestUrl={match.homeCrest}
              name={match.homeTeamName}
              size={compact ? "sm" : "md"}
            />
          </div>
          <p className={compact ? "mt-1 truncate font-display text-[1rem] font-bold leading-none text-white" : "mt-1 truncate font-display text-[1.25rem] font-bold leading-none text-white"}>
            {match.homeTeamName}
          </p>
        </div>

        <p className={compact ? "font-display text-[1.75rem] font-bold uppercase leading-none tracking-[0.02em] text-white" : "font-display text-[2.35rem] font-bold uppercase leading-none tracking-[0.02em] text-white"}>
          {scoreLabel}
        </p>

        <div className="min-w-0 text-center">
          <div className="mx-auto flex justify-center">
            <TeamMark
              code={match.awayTeamCode}
              teamId={match.awayTeamId}
              crestUrl={match.awayCrest}
              name={match.awayTeamName}
              size={compact ? "sm" : "md"}
            />
          </div>
          <p className={compact ? "mt-1 truncate font-display text-[1rem] font-bold leading-none text-white" : "mt-1 truncate font-display text-[1.25rem] font-bold leading-none text-white"}>
            {match.awayTeamName}
          </p>
        </div>
      </div>

      <div className={compact ? "mt-2 flex items-center justify-between gap-3 border-t border-[#8d8158]/20 pt-2" : "mt-3 flex items-center justify-between gap-3 border-t border-[#8d8158]/20 pt-2.5"}>
        <div className={cn("flex min-w-0 items-center gap-2", showCountdown ? urgencyClass : "text-zinc-400")}>
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className={compact ? "truncate font-display text-[0.95rem] font-bold" : "truncate font-display text-[1.05rem] font-bold"}>
            {formatMatchDate(match.matchDate, locale)} • {formatMatchTime(match.matchDate, locale)}
          </span>
        </div>
        <span className="shrink-0 font-display text-[1.05rem] font-bold uppercase tracking-[0.08em] text-primary transition group-hover:text-primary/80">
          Palpitar →
        </span>
      </div>
    </Link>
  );
}
