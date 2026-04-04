import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Clock,
  Radio,
  CalendarDays,
  BarChart3,
  Plus,
  Lock,
  ChevronRight,
  Swords,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { getChampionshipById } from "@/data/championships/definitions";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  limit,
} from "firebase/firestore";
import { cn } from "@/lib/utils";
import { tabContentVariants } from "@/components/copa/animations";
import type { BolaoData } from "@/types/bolao";
import { useRealtimeNews } from "@/hooks/useRealtimeNews";

// ─── Types ────────────────────────────────────────────────────
type HubTab = "jogos" | "classificacao" | "noticias" | "boloes";

interface MatchRow {
  id: string;
  home_team_code: string;
  away_team_code: string;
  home_team_name?: string;
  away_team_name?: string;
  home_crest?: string;
  away_crest?: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: string;
  stage: string;
  round?: number | null;
  group_id?: string | null;
}

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

// ─── Helpers ─────────────────────────────────────────────────
function formatMatchDate(dateStr: string): string {
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`);
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function formatMatchTime(dateStr: string): string {
  if (!dateStr.includes("T")) return "--:--";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(matches: MatchRow[]): Array<{ date: string; label: string; matches: MatchRow[] }> {
  const map = new Map<string, MatchRow[]>();
  for (const m of matches) {
    const key = m.match_date.split("T")[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries()).map(([date, matches]) => ({
    date,
    label: formatMatchDate(date),
    matches,
  }));
}

function formColor(result: string): string {
  if (result === "W") return "bg-emerald-500 text-white";
  if (result === "D") return "bg-amber-500 text-white";
  if (result === "L") return "bg-red-500 text-white";
  return "bg-white/10 text-white/30";
}

function stageLabel(stage: string, round?: number | null): string {
  const map: Record<string, string> = {
    REGULAR_SEASON: round ? `Rod. ${round}` : "Liga",
    GROUP_STAGE: "Fase de Grupos",
    ROUND_OF_16: "Oitavas",
    QUARTER_FINALS: "Quartas",
    SEMI_FINALS: "Semifinal",
    FINAL: "Final",
    "3RD_PLACE": "3° Lugar",
  };
  return map[stage] ?? (round ? `Rod. ${round}` : stage.replace(/_/g, " "));
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

// ─── Team Crest ───────────────────────────────────────────────
function TeamCrest({
  crest,
  code,
  size = 28,
}: {
  crest?: string;
  code: string;
  size?: number;
}) {
  const [err, setErr] = useState(false);
  if (crest && !err) {
    return (
      <img
        src={crest}
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

// ─── MatchCard ───────────────────────────────────────────────
function MatchCard({ match, color }: { match: MatchRow; color: string }) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const hasScore = match.home_score !== null && match.away_score !== null;
  const stageTxt = stageLabel(match.stage, match.round);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
      {/* Home */}
      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
        <span className="text-xs font-bold text-white text-right truncate leading-none hidden xs:block">
          {match.home_team_name?.split(" ").pop() || match.home_team_code}
        </span>
        <span className="text-[11px] font-bold text-white/70 text-right leading-none xs:hidden">
          {match.home_team_code}
        </span>
        <TeamCrest crest={match.home_crest} code={match.home_team_code} size={26} />
      </div>

      {/* Score / Time */}
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
              {formatMatchTime(match.match_date)}
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

      {/* Away */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <TeamCrest crest={match.away_crest} code={match.away_team_code} size={26} />
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

// ─── Jogos Tab ───────────────────────────────────────────────
function JogosTab({ championshipId, color }: { championshipId: string; color: string }) {
  const { data: matches, isLoading } = useQuery({
    queryKey: ["championship-matches", championshipId],
    queryFn: async () => {
      const ref = collection(db, "matches");
      const q = query(
        ref,
        where("championship_id", "==", championshipId),
        orderBy("match_date", "asc"),
        limit(200)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MatchRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter to show: last 3 finished + all upcoming (or all if few)
  const filtered = (() => {
    if (!matches) return [];
    const finished = matches.filter((m) => m.status === "finished");
    const rest = matches.filter((m) => m.status !== "finished");
    return [...finished.slice(-6), ...rest];
  })();

  if (isLoading) {
    return (
      <div className="space-y-2 mt-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 text-center py-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
          <CalendarDays className="w-7 h-7" style={{ color }} />
        </div>
        <p className="text-sm font-extrabold text-white/80">Calendário ainda não sincronizado</p>
        <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
          Os jogos oficiais deste campeonato vão aparecer aqui assim que forem publicados.
        </p>
      </div>
    );
  }

  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-4 mt-1">
      {matches && matches.filter(m => m.status === "finished").length > 6 && (
        <div className="text-center py-1">
          <span className="text-[10px] text-white/30 font-medium">
            Mostrando últimos 6 jogos + próximos
          </span>
        </div>
      )}
      {grouped.map(({ date, label, matches: dayMatches }) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">
              {label}
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] text-white/20">{dayMatches.length} jogo{dayMatches.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-1.5">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} color={color} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Classificação Tab ───────────────────────────────────────
function ClassificacaoTab({ championshipId, color }: { championshipId: string; color: string }) {
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
      const matches = matchesSnap.docs.map((item) => ({ id: item.id, ...item.data() })) as MatchRow[];
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
        {/* Header placeholder */}
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
          <p className="text-sm font-extrabold text-white/80">Classificação ainda indisponível</p>
          <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
            Assim que os resultados oficiais entrarem, a tabela aparece automaticamente aqui.
          </p>
        </div>
      </div>
    );
  }

  const cols = ["#", "Clube", "J", "V", "E", "D", "SG", "Pts"];
  // Show top zone highlight (top 4 for UEFA, top 6 for descending etc.)
  const zoneColors = (pos: number, total: number) => {
    if (pos <= 1) return "border-l-2 border-amber-400";        // Champion
    if (pos <= 4) return "border-l-2 border-emerald-500";      // UCL
    if (pos <= 6) return "border-l-2 border-blue-400";         // UEL/Conference
    if (pos > total - 3) return "border-l-2 border-red-500";   // Relegation
    return "border-l-2 border-transparent";
  };

  return (
    <div className="mt-1">
      <div className="mb-1 flex items-center justify-between px-1">
        {standings.updated_at ? (
          <p className="text-[10px] text-white/25">
            Atualizado: {new Date(standings.updated_at).toLocaleDateString("pt-BR")}
          </p>
        ) : (
          <span />
        )}
        {standings.source === "derived" && (
          <p className="text-[10px] text-amber-300/70">Tabela provisória pelos resultados confirmados</p>
        )}
      </div>

      {/* Table header */}
      <div className="flex items-center px-2 py-2 rounded-t-2xl bg-white/[0.07] border border-white/[0.08]">
        {cols.map((col, i) => (
          <span key={col} className={cn("text-[10px] font-bold uppercase tracking-wider text-white/50",
            i === 0 ? "w-7 text-center shrink-0" : i === 1 ? "flex-1 text-left pl-1" : "w-8 text-center shrink-0 font-black",
            i === cols.length - 1 ? "text-white/80" : "")}>
            {col}
          </span>
        ))}
        <span className="w-16 text-center shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/30">Forma</span>
      </div>

      {/* Rows */}
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
              {/* Position */}
              <span className="w-7 text-center text-[11px] font-black text-white/50 shrink-0">
                {row.position}
              </span>

              {/* Team */}
              <div className="flex-1 flex items-center gap-2 min-w-0 pl-1">
                <TeamCrest crest={row.crest} code={row.team_tla} size={20} />
                <span className="text-xs font-bold text-white truncate">
                  {row.team_short || row.team_name}
                </span>
              </div>

              {/* Stats */}
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

              {/* Form */}
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

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-1">
        {[
          { color: "bg-amber-400", label: "Campeão" },
          { color: "bg-emerald-500", label: "UCL" },
          { color: "bg-blue-400", label: "UEL" },
          { color: "bg-red-500", label: "Rebaixamento" },
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

// ─── BolaoCard ───────────────────────────────────────────────
function BolaoCard({ bolao, onPress }: { bolao: BolaoData; onPress: () => void }) {
  const isPrivate = bolao.category === "private";
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-white/[0.06] border border-white/[0.08] overflow-hidden">
        {bolao.avatar_url ? (
          <img src={bolao.avatar_url} alt={bolao.name} className="w-full h-full object-cover" />
        ) : (
          <Trophy className="w-5 h-5 text-white/30" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-white truncate">{bolao.name}</p>
          {isPrivate && <Lock className="w-3 h-3 text-zinc-500 shrink-0" />}
        </div>
        <p className="text-xs text-zinc-500 capitalize">
          {bolao.status === "open" ? "Aberto para entrar" : bolao.status === "active" ? "Em andamento" : bolao.status}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
    </button>
  );
}

// ─── Bolões Tab ──────────────────────────────────────────────
function BolõesTab({
  championshipId,
  championship,
  color,
}: {
  championshipId: string;
  championship: ReturnType<typeof getChampionshipById>;
  color: string;
}) {
  const navigate = useNavigate();

  const { data: boloes, isLoading } = useQuery({
    queryKey: ["championship-boloes", championshipId],
    queryFn: async () => {
      const ref = collection(db, "boloes");
      const q = query(ref, where("championship_id", "==", championshipId), where("status", "in", ["active", "open"]), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BolaoData[];
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <div className="space-y-3 mt-1">
      <button
        onClick={() => navigate("/boloes/criar", { state: { championship_id: championshipId } })}
        className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl border border-dashed transition-all hover:opacity-80"
        style={{ borderColor: `${color}50`, background: `${color}0d` }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}35` }}>
          <Plus className="w-5 h-5" style={{ color }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-white">Criar Bolão</p>
          <p className="text-xs text-zinc-500">{championship?.shortName} · {championship?.season}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-500 ml-auto shrink-0" />
      </button>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />)}
        </div>
      ) : boloes && boloes.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 px-1">Bolões ativos ({boloes.length})</p>
          {boloes.map((b) => <BolaoCard key={b.id} bolao={b} onPress={() => navigate(`/boloes/${b.id}`)} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center py-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
            <Swords className="w-7 h-7" style={{ color }} />
          </div>
          <p className="text-sm font-extrabold text-white/80">Nenhum bolão ainda</p>
          <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">Seja o primeiro a criar um bolão para este campeonato!</p>
        </div>
      )}
    </div>
  );
}

// ─── News Tab ────────────────────────────────────────────────
function NotíciasTab({ championshipId, color }: { championshipId: string; color: string }) {
  const { news, isLoading } = useRealtimeNews({
    championshipId,
    limitCount: 10,
  });

  if (isLoading) return (
    <div className="space-y-3 mt-1">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/[0.04] animate-pulse" />)}</div>
  );

  if (!news?.length) return (
    <div className="flex flex-col items-center gap-3 text-center py-10 mt-1">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/[0.08]" style={{ background: `${color}18` }}>
        <Newspaper className="w-7 h-7" style={{ color }} />
      </div>
      <p className="text-sm font-extrabold text-white/80">Ainda sem notícias desse campeonato</p>
      <p className="text-xs text-zinc-500 max-w-[220px] leading-relaxed">
        Quando o feed for atualizado, os destaques e notícias mais recentes aparecem aqui.
      </p>
    </div>
  );

  return (
    <div className="space-y-3 mt-1">
      {news.map((item) => (
        <a key={item.id} href={item.url || "#"} target="_blank" rel="noopener noreferrer"
          className="block rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors">
          {(item.image_url || item.url_to_image) && (
            <div className="h-32 overflow-hidden">
              <img src={item.image_url || item.url_to_image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          )}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
                {item.source_name || item.source_country || item.category || "Destaque"}
              </span>
              <span className="text-[9px] text-white/30">{item.published_at ? new Date(item.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}</span>
            </div>
            <p className="text-xs font-bold text-white leading-relaxed line-clamp-2">{item.title}</p>
            {(item.summary || item.description) && (
              <p className="mt-1 text-[11px] leading-relaxed text-white/45 line-clamp-2">
                {item.summary || item.description}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function CampeonatoHub() {
  const { championshipId } = useParams<{ championshipId: string }>();
  const navigate = useNavigate();
  const { setChampionship } = useChampionship();
  const [tab, setTab] = useState<HubTab>("jogos");

  const championship = championshipId ? getChampionshipById(championshipId) : null;

  useEffect(() => {
    if (championship) setChampionship(championship.id);
  }, [championship, setChampionship]);

  useEffect(() => {
    if (championshipId === "wc2026") navigate("/copa", { replace: true });
  }, [championshipId, navigate]);

  if (!championship || championship.id === "wc2026") return null;

  const [from, to] = championship.gradient;
  const { color } = championship;

  const statusLabel = championship.status === "live" ? "Ao Vivo" : championship.status === "upcoming" ? "Em Breve" : "Encerrado";
  const statusColor = championship.status === "live"
    ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
    : championship.status === "upcoming"
    ? "text-amber-400 bg-amber-500/15 border-amber-500/30"
    : "text-zinc-400 bg-white/10 border-white/20";

  const tabs: { id: HubTab; label: string; icon: React.ReactNode }[] = [
    { id: "jogos",         label: "Jogos",    icon: <CalendarDays className="w-4 h-4" /> },
    { id: "classificacao", label: "Tabela",   icon: <BarChart3 className="w-4 h-4" /> },
    { id: "noticias",      label: "Notícias", icon: <Newspaper className="w-4 h-4" /> },
    { id: "boloes",        label: "Bolões",   icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* ── Sticky header ──────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.08] px-4 pt-[calc(var(--safe-area-top,0px)+0.75rem)] pb-3"
        style={{ background: `linear-gradient(135deg, ${from}cc, ${to}cc)` }}
      >
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex items-center gap-3">
          <button onClick={() => navigate("/campeonatos")}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            {championship.logoUrl ? (
              <img src={championship.logoUrl} alt={championship.shortName} className="w-7 h-7 object-contain shrink-0" />
            ) : (
              <span className="text-xl shrink-0">{championship.logo}</span>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 leading-none mb-0.5">
                {championship.confederation ?? championship.country} · {championship.season}
              </p>
              <h1 className="text-lg font-extrabold text-white leading-none truncate">{championship.shortName}</h1>
            </div>
          </div>
          <div className="ml-auto shrink-0">
            <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", statusColor)}>
              {championship.status === "live" && <Radio className="w-2.5 h-2.5 animate-pulse" />}
              {championship.status === "upcoming" && <Clock className="w-2.5 h-2.5" />}
              {statusLabel}
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── Stats row ──────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06] bg-white/[0.02]">
        {[
          { icon: Users, label: "Times", value: String(championship.maxTeams) },
          { icon: Calendar, label: "Início", value: new Date(championship.dateStart + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) },
          { icon: TrendingUp, label: "Formato", value: championship.format === "league" ? "Liga" : championship.format === "mixed" ? "Copa" : "Torneio" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center py-3 gap-0.5">
            <Icon className="w-3.5 h-3.5 text-white/30 mb-0.5" />
            <span className="text-sm font-bold text-white">{value}</span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Tab bar ────────────────────────────────────────── */}
      <div className="sticky z-10 border-b border-white/[0.08] bg-[#061a10]/80 backdrop-blur-xl"
        style={{ top: "calc(3.5rem + var(--safe-area-top, 0px))" }}>
        <div className="grid grid-cols-2 gap-2 px-3 py-2.5 sm:grid-cols-4">
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} aria-current={isActive ? "page" : undefined}
                className={cn("relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-all duration-200",
                  isActive ? "text-black" : "bg-white/[0.05] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.1] hover:text-zinc-200")}>
                {isActive && (
                  <motion.div layoutId="hubActiveTabBg" className="absolute inset-0 rounded-2xl"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 0 16px ${color}55` }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className={cn("relative z-10 transition-transform duration-200", isActive && "scale-110")}>{t.icon}</span>
                <span className="relative z-10 text-[10px] font-bold leading-none whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-4">
        <AnimatePresence mode="wait">
          <motion.div key={tab} variants={tabContentVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeInOut" }}>
            {tab === "jogos"         && <JogosTab         championshipId={championship.id} color={color} />}
            {tab === "classificacao" && <ClassificacaoTab championshipId={championship.id} color={color} />}
            {tab === "noticias"      && <NotíciasTab      championshipId={championship.id} color={color} />}
            {tab === "boloes"        && <BolõesTab        championshipId={championship.id} championship={championship} color={color} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
