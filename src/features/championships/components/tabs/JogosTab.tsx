import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { CalendarDays } from "lucide-react";
import { normalizeMatchDateValue, normalizeMatchFeedStatus } from "@/lib/match-feed";
import { MatchSection, MatchRow, formatMatchDate } from "../CommonComponents";

interface FirestoreMatchRow {
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
  match_date?: string | { toDate?: () => Date } | null;
  status?: string | null;
  stage?: string | null;
  round?: number | null;
  group_id?: string | null;
}

function getLocalDayKey(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "0000-00-00";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function groupByDate(
  matches: MatchRow[],
  locale: string
): Array<{ date: string; label: string; matches: MatchRow[] }> {
  const map = new Map<string, { labelSource: string; matches: MatchRow[] }>();

  for (const match of matches) {
    const key = getLocalDayKey(match.match_date);
    if (!map.has(key)) {
      map.set(key, { labelSource: match.match_date, matches: [] });
    }

    map.get(key)!.matches.push(match);
  }

  return Array.from(map.entries()).map(([date, group]) => ({
    date,
    label: formatMatchDate(group.labelSource, locale),
    matches: group.matches,
  }));
}

export function JogosTab({ championshipId, color }: { championshipId: string; color: string }) {
  const { t, i18n } = useTranslation("championships");
  const { data: matches, isLoading } = useQuery({
    queryKey: ["championship-matches", championshipId],
    queryFn: async () => {
      const ref = collection(db, "matches");
      const q = query(
        ref,
        where("championship_id", "==", championshipId),
        limit(200)
      );
      const snap = await getDocs(q);

      return snap.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data() as FirestoreMatchRow;
          const matchDate = normalizeMatchDateValue(data.match_date);

          return {
            id: docSnapshot.id,
            home_team_id: data.home_team_id ?? null,
            away_team_id: data.away_team_id ?? null,
            home_team_code: data.home_team_code || "---",
            away_team_code: data.away_team_code || "---",
            home_team_name: data.home_team_name || data.home_team_code || "---",
            away_team_name: data.away_team_name || data.away_team_code || "---",
            home_crest: data.home_crest || "",
            away_crest: data.away_crest || "",
            home_score: data.home_score ?? null,
            away_score: data.away_score ?? null,
            match_date: matchDate,
            status: normalizeMatchFeedStatus({
              status: data.status,
              matchDate,
              homeScore: data.home_score ?? null,
              awayScore: data.away_score ?? null,
            }),
            stage: data.stage ?? null,
            round: typeof data.round === "number" ? data.round : null,
            group_id: data.group_id ?? null,
          } satisfies MatchRow;
        })
        .sort(
          (left, right) =>
            new Date(left.match_date).getTime() - new Date(right.match_date).getTime()
        );
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 mt-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }

  const upcomingCutoff = Date.now() - 30 * 60 * 1000;
  const liveMatches = (matches ?? []).filter((match) => match.status === "live");
  const upcomingMatches = (matches ?? []).filter(
    (match) =>
      match.status === "scheduled" &&
      new Date(match.match_date).getTime() >= upcomingCutoff
  );
  const recentFinishedMatches = [...(matches ?? [])]
    .filter((match) => match.status === "finished")
    .sort(
      (left, right) =>
        new Date(right.match_date).getTime() - new Date(left.match_date).getTime()
    )
    .slice(0, 6);

  if (!liveMatches.length && !upcomingMatches.length && !recentFinishedMatches.length) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 text-center py-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
          <CalendarDays className="w-7 h-7" style={{ color }} />
        </div>
        <p className="text-sm font-extrabold text-white/80">{t("hub.games.unavailable_title", { defaultValue: "Calendário ainda não sincronizado" })}</p>
        <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
          {t("hub.games.unavailable_desc", { defaultValue: "Os jogos oficiais deste campeonato vão aparecer aqui assim que forem publicados." })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-1">
      <MatchSection
        title={t("hub.games.live_title", { defaultValue: "Ao vivo agora" })}
        countLabel={t("hub.games.live_count", {
          defaultValue: "{{count}} em andamento",
          count: liveMatches.length,
        })}
        accentClassName="text-emerald-400"
        groups={groupByDate(liveMatches, i18n.language)}
        locale={i18n.language}
      />

      <MatchSection
        title={t("hub.games.upcoming_title", { defaultValue: "Próximos jogos" })}
        countLabel={t("hub.games.upcoming_count", {
          defaultValue: "{{count}} agendado(s)",
          count: upcomingMatches.length,
        })}
        accentClassName="text-white/70"
        groups={groupByDate(upcomingMatches, i18n.language)}
        locale={i18n.language}
      />

      <MatchSection
        title={t("hub.games.results_title", { defaultValue: "Resultados recentes" })}
        countLabel={t("hub.games.results_count", {
          defaultValue: "Últimos {{count}}",
          count: recentFinishedMatches.length,
        })}
        accentClassName="text-amber-300"
        groups={groupByDate(recentFinishedMatches, i18n.language)}
        locale={i18n.language}
      />
    </div>
  );
}
