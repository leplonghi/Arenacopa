import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc, getDocs, collection, query, where, limit } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeMatchDateValue, normalizeMatchFeedStatus } from "@/lib/match-feed";
import { TeamCrest, MatchRow } from "../CommonComponents";

interface StandingRow {
  position: number;
  team_id: string;
  team_name: string;
  team_short: string;
  team_tla: string;
  crest: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  form?: string;
}

interface StandingsDoc {
  id: string;
  championship_id: string;
  season: string;
  updated_at: string;
  table: StandingRow[];
  source?: "official" | "derived";
}

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

function formColor(result: string): string {
  if (result === "W") return "bg-emerald-500 text-white";
  if (result === "D") return "bg-amber-500 text-white";
  if (result === "L") return "bg-red-500 text-white";
  return "bg-white/10 text-white/30";
}

function buildDerivedStandings(matches: MatchRow[]): StandingRow[] {
  type TeamStats = Omit<StandingRow, "position" | "form"> & { formValues: string[] };
  const teams = new Map<string, TeamStats>();

  const ensureTeam = (
    teamKey: string,
    teamName: string | undefined,
    teamCode: string,
    crest?: string
  ) => {
    if (!teams.has(teamKey)) {
      teams.set(teamKey, {
        team_id: teamKey,
        team_name: teamName || teamCode,
        team_short: teamName?.split(" ").pop() || teamCode,
        team_tla: teamCode,
        crest: crest || "",
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        formValues: [],
      });
    }

    return teams.get(teamKey)!;
  };

  for (const match of matches) {
    if (match.home_score == null || match.away_score == null) continue;

    const homeKey = match.home_team_code || match.home_team_name || `${match.id}-home`;
    const awayKey = match.away_team_code || match.away_team_name || `${match.id}-away`;
    const home = ensureTeam(homeKey, match.home_team_name, match.home_team_code, match.home_crest);
    const away = ensureTeam(awayKey, match.away_team_name, match.away_team_code, match.away_crest);

    home.played += 1;
    away.played += 1;
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
      home.formValues.push("W");
      away.formValues.push("L");
    } else if (match.home_score < match.away_score) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
      home.formValues.push("L");
      away.formValues.push("W");
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.formValues.push("D");
      away.formValues.push("D");
    }
  }

  const table = Array.from(teams.values()).map((team) => ({
    position: 0,
    team_id: team.team_id,
    team_name: team.team_name,
    team_short: team.team_short,
    team_tla: team.team_tla,
    crest: team.crest,
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    goals_for: team.goals_for,
    goals_against: team.goals_against,
    goal_difference: team.goals_for - team.goals_against,
    points: team.points,
    form: team.formValues.slice(-5).join(","),
  }));

  table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return a.team_name.localeCompare(b.team_name, "pt-BR");
  });

  return table.map((team, index) => ({ ...team, position: index + 1 }));
}

export function ClassificacaoTab({ championshipId, color }: { championshipId: string; color: string }) {
  const { t } = useTranslation("championships");
  const { data: standings, isLoading } = useQuery({
    queryKey: ["standings", championshipId],
    queryFn: async () => {
      const ref = doc(db, "standings", championshipId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return { ...(snap.data() as StandingsDoc), source: "official" as const };
      }

      const matchesSnap = await getDocs(
        query(collection(db, "matches"), where("championship_id", "==", championshipId), limit(380))
      );
      const matches = matchesSnap.docs.map((docSnapshot) => {
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
      });
      const finishedMatches = matches.filter(
        (match) => match.status === "finished" && match.home_score != null && match.away_score != null
      );

      if (!finishedMatches.length) return null;

      return {
        id: championshipId,
        championship_id: championshipId,
        season: "",
        updated_at: finishedMatches.map((match) => match.match_date).sort().at(-1) || "",
        table: buildDerivedStandings(finishedMatches),
        source: "derived" as const,
      } satisfies StandingsDoc;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-1 mt-1">
        <div className="h-8 rounded-t-2xl bg-white/[0.06] animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!standings?.table?.length) {
    return (
      <div className="mt-1">
        <div className="flex items-center gap-0 px-3 py-2 rounded-t-2xl bg-white/[0.06] border border-white/[0.08]">
          {["#", "Clube", "J", "V", "E", "D", "SG", "Pts"].map((col, i) => (
            <span key={col} className={cn("text-[10px] font-bold uppercase tracking-wider text-white/40",
              i === 0 ? "w-6 text-center shrink-0" : i === 1 ? "flex-1 text-left pl-2" : "w-8 text-center shrink-0")}>
              {col}
            </span>
          ))}
        </div>
        <div className="rounded-b-2xl border-x border-b border-white/[0.08] bg-white/[0.02] py-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
            <BarChart3 className="w-7 h-7" style={{ color }} />
          </div>
          <p className="text-sm font-extrabold text-white/80">{t("hub.table.unavailable_title", { defaultValue: "Classificação ainda indisponível" })}</p>
          <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
            {t("hub.table.unavailable_desc", { defaultValue: "Assim que os resultados oficiais entrarem, a tabela aparece automaticamente aqui." })}
          </p>
        </div>
      </div>
    );
  }

  const cols = ["#", "Clube", "J", "V", "E", "D", "SG", "Pts"];
  const zoneColors = (pos: number, total: number) => {
    if (pos <= 1) return "border-l-2 border-amber-400";
    if (pos <= 4) return "border-l-2 border-emerald-500";
    if (pos <= 6) return "border-l-2 border-blue-400";
    if (pos > total - 3) return "border-l-2 border-red-500";
    return "border-l-2 border-transparent";
  };

  return (
    <div className="mt-1">
      <div className="mb-1 flex items-center justify-between px-1">
        {standings.updated_at ? (
          <p className="text-[10px] text-white/25">
            {t("hub.table.updated_at", {
              defaultValue: "Atualizado: {{date}}",
              date: new Date(standings.updated_at).toLocaleDateString("pt-BR"),
            })}
          </p>
        ) : (
          <span />
        )}
        {standings.source === "derived" && (
          <p className="text-[10px] text-amber-300/70">{t("hub.table.derived_badge", { defaultValue: "Tabela provisória pelos resultados confirmados" })}</p>
        )}
      </div>

      <div className="flex items-center px-2 py-2 rounded-t-2xl bg-white/[0.07] border border-white/[0.08]">
        {cols.map((col, i) => (
          <span key={col} className={cn("text-[10px] font-bold uppercase tracking-wider text-white/50",
            i === 0 ? "w-7 text-center shrink-0" : i === 1 ? "flex-1 text-left pl-1" : "w-8 text-center shrink-0 font-black",
            i === cols.length - 1 ? "text-white/80" : "")}>
            {col}
          </span>
        ))}
        <span className="w-16 text-center shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/30">{t("hub.table.form", { defaultValue: "Forma" })}</span>
      </div>

      <div className="rounded-b-2xl border-x border-b border-white/[0.08] overflow-hidden">
        {standings.table.map((row, idx) => {
          const zone = zoneColors(row.position, standings.table.length);
          return (
            <div
              key={row.team_id || idx}
              className={cn(
                "flex items-center px-2 py-2 transition-colors hover:bg-white/[0.04]",
                idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent",
                zone
              )}
            >
              <span className="w-7 text-center text-[11px] font-black text-white/50 shrink-0">
                {row.position}
              </span>

              <div className="flex-1 flex items-center gap-2 min-w-0 pl-1">
                <TeamCrest
                  crest={row.crest}
                  code={row.team_tla}
                  teamId={row.team_id}
                  size={20}
                />
                <span className="text-xs font-bold text-white truncate">
                  {row.team_short || row.team_name}
                </span>
              </div>

              {[row.played, row.won, row.drawn, row.lost].map((v, i) => (
                <span key={i} className="w-8 text-center text-[11px] text-white/50 shrink-0">
                  {v}
                </span>
              ))}
              <span className="w-8 text-center text-[11px] text-white/50 shrink-0">
                {row.goal_difference > 0 ? "+" : ""}{row.goal_difference}
              </span>
              <span className="w-8 text-center text-[12px] font-black text-white shrink-0">
                {row.points}
              </span>

              <div className="w-16 flex items-center justify-center gap-0.5 shrink-0">
                {(row.form || "").split(",").filter(Boolean).slice(-5).map((r, i) => (
                  <span
                    key={i}
                    className={cn("w-3.5 h-3.5 rounded-sm text-[7px] font-black flex items-center justify-center", formColor(r))}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-2 px-1">
        {[
          { color: "bg-amber-400", label: t("hub.table.legend_champion", { defaultValue: "Campeão" }) },
          { color: "bg-emerald-500", label: t("hub.table.legend_ucl", { defaultValue: "UCL" }) },
          { color: "bg-blue-400", label: t("hub.table.legend_uel", { defaultValue: "UEL" }) },
          { color: "bg-red-500", label: t("hub.table.legend_relegation", { defaultValue: "Rebaixamento" }) },
        ].map(({ color: c, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-sm", c)} />
            <span className="text-[9px] text-white/30">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
