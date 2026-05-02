import { useState } from "react";
import { getMatchStageLabel } from "@/lib/match-feed";
import { getTeamImageUrl } from "@/lib/team-flags";
import { cn } from "@/lib/utils";

export interface MatchRow {
  id: string;
  home_team_id?: string | null;
  away_team_id?: string | null;
  home_team_code: string;
  away_team_code: string;
  home_team_name?: string;
  away_team_name?: string;
  home_crest?: string;
  away_crest?: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: "scheduled" | "live" | "finished";
  stage: string | null;
  round?: number | null;
  group_id?: string | null;
}

export function formatMatchDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
  return d.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function formatMatchTime(dateStr: string, locale: string): string {
  if (!dateStr.includes("T")) return "--:--";
  const d = new Date(dateStr);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function TeamCrest({
  crest,
  code,
  teamId,
  size = 28,
}: {
  crest?: string;
  code: string;
  teamId?: string | null;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  const imageUrl = !err
    ? getTeamImageUrl({
        code,
        crestUrl: crest,
        teamId,
      })
    : null;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={code}
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white/60"
      style={{ width: size, height: size, fontSize: Math.max(7, size * 0.32) }}
    >
      {code.slice(0, 3)}
    </div>
  );
}

export function MatchCard({
  match,
  locale,
}: {
  match: MatchRow;
  locale: string;
}) {
  const isLive = match.status === "live";
  const hasScore = match.home_score !== null && match.away_score !== null;
  const stageTxt = getMatchStageLabel(
    {
      groupId: match.group_id,
      round: match.round,
      stage: match.stage,
    },
    locale
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span className="text-xs font-bold text-white text-right truncate leading-none hidden xs:block">
          {match.home_team_name?.split(" ").pop() || match.home_team_code}
        </span>
        <span className="text-[11px] font-bold text-white/70 text-right leading-none xs:hidden">
          {match.home_team_code}
        </span>
        <TeamCrest
          crest={match.home_crest}
          code={match.home_team_code}
          teamId={match.home_team_id}
          size={26}
        />
      </div>

      <div className="flex flex-col items-center shrink-0" style={{ minWidth: 72 }}>
        {hasScore ? (
          <div
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-black",
              isLive ? "text-emerald-300" : "text-white"
            )}
            style={{ background: hasScore ? (isLive ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.08)") : "transparent" }}
          >
            <span>{match.home_score}</span>
            <span className="text-white/30 text-[10px]">—</span>
            <span>{match.away_score}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[12px] font-black text-white/70 leading-none">
              {formatMatchTime(match.match_date, locale)}
            </span>
            {isLive && (
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                • AO VIVO
              </span>
            )}
          </div>
        )}
        <span className="mt-0.5 text-[9px] text-white/25 font-medium truncate max-w-[68px] text-center">
          {stageTxt}
        </span>
      </div>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        <TeamCrest
          crest={match.away_crest}
          code={match.away_team_code}
          teamId={match.away_team_id}
          size={26}
        />
        <span className="text-xs font-bold text-white truncate leading-none hidden xs:block">
          {match.away_team_name?.split(" ").pop() || match.away_team_code}
        </span>
        <span className="text-[11px] font-bold text-white/70 leading-none xs:hidden">
          {match.away_team_code}
        </span>
      </div>
    </div>
  );
}

export function MatchSection({
  title,
  countLabel,
  accentClassName,
  groups,
  locale,
}: {
  title: string;
  countLabel: string;
  accentClassName: string;
  groups: Array<{ date: string; label: string; matches: MatchRow[] }>;
  locale: string;
}) {
  if (!groups.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className={cn("text-[11px] font-black uppercase tracking-[0.18em]", accentClassName)}>
          {title}
        </span>
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[10px] text-white/25">{countLabel}</span>
      </div>

      <div className="space-y-4">
        {groups.map(({ date, label, matches }) => (
          <div key={date}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">
                {label}
              </span>
              <div className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[10px] text-white/20">
                {matches.length} jogo{matches.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-1.5">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
