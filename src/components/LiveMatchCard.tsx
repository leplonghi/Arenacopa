import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Trophy, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TeamMark } from "@/components/TeamMark";
import { getMatchStageLabel } from "@/lib/match-feed";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";

export function LiveMatchCard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("home");
  const { data: matches = [] } = useDashboardMatches();
  const [countdown, setCountdown] = useState("");

  const liveMatch = useMemo(
    () => matches.find((match) => match.status === "live") ?? null,
    [matches]
  );

  const nextMatch = useMemo(() => {
    if (liveMatch) return null;
    const now = Date.now();
    return (
      matches.find(
        (match) =>
          match.status === "scheduled" &&
          new Date(match.matchDate).getTime() >= now
      ) ?? null
    );
  }, [liveMatch, matches]);

  useEffect(() => {
    if (!nextMatch) return;

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const matchTime = new Date(nextMatch.matchDate).getTime();
      const distance = matchTime - now;

      if (distance <= 0) {
        setCountdown(t("live_card.loading"));
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(
        `${days > 0 ? `${days}d ` : ""}${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [nextMatch, t]);

  if (!liveMatch && !nextMatch) return null;

  const activeMatch = liveMatch ?? nextMatch;
  if (!activeMatch) return null;

  const competitionName =
    activeMatch.championship?.shortName ||
    activeMatch.championship?.name ||
    t("live_card.competition_fallback", { defaultValue: "Competição oficial" });
  const stageLabel = getMatchStageLabel(activeMatch, i18n.language);
  const destination = activeMatch.championship
    ? activeMatch.championshipId
      ? `/campeonato/${activeMatch.championshipId}`
      : "/campeonatos"
    : "/campeonatos";

  if (liveMatch) {
    return (
      <button
        type="button"
        onClick={() => navigate(destination)}
        className="group relative mb-4 flex w-full flex-col gap-2.5 overflow-hidden rounded-[24px] border border-copa-live/25 bg-gradient-to-r from-white/[0.05] to-copa-live/10 px-3.5 py-3.5 text-left shadow-xl backdrop-blur-xl transition-colors hover:bg-copa-live/10"
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-[26px] bg-copa-live/80" />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-copa-live shadow-[0_0_8px_rgba(255,59,48,0.8)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-copa-live">
                {t("live_card.live_badge", { defaultValue: "Ao vivo" })}
              </span>
            </div>
            <p className="mt-1.5 truncate text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
              {competitionName}
            </p>
          </div>

          {stageLabel ? (
            <span className="rounded-full border border-copa-live/20 bg-copa-live/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-copa-live">
              {stageLabel}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamMark
              code={liveMatch.homeTeamCode}
              teamId={liveMatch.homeTeamId}
              crestUrl={liveMatch.homeCrest}
              name={liveMatch.homeTeamName}
              size="sm"
              className="h-9 w-9 rounded-lg p-1"
            />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-white">{liveMatch.homeTeamName}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                {liveMatch.homeTeamCode}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-copa-live/15 bg-copa-live/10 px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tabular-nums text-white">
                {liveMatch.homeScore ?? 0}
              </span>
              <span className="text-sm font-bold text-white/35">-</span>
              <span className="text-base font-black tabular-nums text-white">
                {liveMatch.awayScore ?? 0}
              </span>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-white">{liveMatch.awayTeamName}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                {liveMatch.awayTeamCode}
              </p>
            </div>
            <TeamMark
              code={liveMatch.awayTeamCode}
              teamId={liveMatch.awayTeamId}
              crestUrl={liveMatch.awayCrest}
              name={liveMatch.awayTeamName}
              size="sm"
              className="h-9 w-9 rounded-lg p-1"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
            {t("live_card.open_match_center", { defaultValue: "Abrir campeonato" })}
          </span>
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-copa-live/20 bg-copa-live/10 px-2.5 py-1">
            <Trophy className="h-3.5 w-3.5 text-copa-live" />
            <ChevronRight className="h-3.5 w-3.5 text-copa-live transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </button>
    );
  }

  if (!nextMatch) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(destination)}
      className="group relative mb-4 flex w-full flex-col gap-2.5 rounded-[24px] border border-white/10 bg-white/[0.04] px-3.5 py-3.5 text-left backdrop-blur-xl transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
              {t("live_card.next_game")}
            </span>
          </div>
          <p className="mt-1.5 truncate text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
            {competitionName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
            {countdown}
          </p>
          {stageLabel ? (
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">
              {stageLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeamMark
            code={nextMatch.homeTeamCode}
            teamId={nextMatch.homeTeamId}
            crestUrl={nextMatch.homeCrest}
            name={nextMatch.homeTeamName}
            size="sm"
            className="h-9 w-9 rounded-lg p-1"
          />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-white">{nextMatch.homeTeamName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {nextMatch.homeTeamCode}
          </p>
        </div>
        </div>

        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-500">vs</span>

        <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-black text-white">{nextMatch.awayTeamName}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">
            {nextMatch.awayTeamCode}
          </p>
        </div>
          <TeamMark
            code={nextMatch.awayTeamCode}
            teamId={nextMatch.awayTeamId}
            crestUrl={nextMatch.awayCrest}
            name={nextMatch.awayTeamName}
            size="sm"
            className="h-9 w-9 rounded-lg p-1"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
          {new Date(nextMatch.matchDate).toLocaleDateString(i18n.language, {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
