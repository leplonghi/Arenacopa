import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Globe2,
  MapPinned,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Flag } from "@/components/Flag";
import { MatchDetailsModal } from "./MatchDetailsModal";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { useMatches } from "@/hooks/useMatches";
import { getTeam, groupStandings, groups, type Match } from "@/data/mockData";
import { cn } from "@/lib/utils";

const PHASES = [
  {
    id: "groups",
    title: "Fase de grupos",
    date: "11 jun - 27 jun",
    active: true,
  },
  {
    id: "round16",
    title: "Oitavas",
    date: "28 jun - 03 jul",
  },
  {
    id: "quarters",
    title: "Quartas",
    date: "04 jul - 07 jul",
  },
  {
    id: "semis",
    title: "Semifinais",
    date: "08 jul - 09 jul",
  },
  {
    id: "final",
    title: "Final",
    date: "19 jul",
  },
];

function formatCountdownParts(target: Date, nowMs: number) {
  const diff = Math.max(target.getTime() - nowMs, 0);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return [
    { label: "Dias", value: String(days).padStart(2, "0") },
    { label: "Horas", value: String(hours).padStart(2, "0") },
    { label: "Min", value: String(minutes).padStart(2, "0") },
    { label: "Seg", value: String(seconds).padStart(2, "0") },
  ];
}

function FeaturedFixture({
  match,
  onOpen,
}: {
  match: Match;
  onOpen: () => void;
}) {
  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);

  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 text-left transition hover:bg-white/[0.07]"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="arena-kicker text-primary">Jogo em destaque</p>
          <p className="mt-2 text-sm text-zinc-300">
            {new Date(match.date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
            })}{" "}
            •{" "}
            {new Date(match.date).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="arena-badge">
          <Clock3 className="h-3.5 w-3.5" />
          {match.status === "live" ? "Ao vivo" : "Em breve"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/5">
            <Flag code={home.code} size="lg" />
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-black uppercase text-white">{home.name}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.18em] text-zinc-500">{home.code}</p>
          </div>
        </div>

        <div className="flex flex-col items-center">
          {match.status === "finished" || match.status === "live" ? (
            <div className="font-display text-[4rem] font-black leading-none tracking-[0.02em] text-white">
              {match.homeScore ?? 0} <span className="text-white/30">x</span> {match.awayScore ?? 0}
            </div>
          ) : (
            <div className="font-display text-[3.4rem] font-black uppercase tracking-[0.04em] text-white/30">
              VS
            </div>
          )}
          {match.minute ? <span className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-primary">{match.minute}'</span> : null}
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-white/10 bg-white/5">
            <Flag code={away.code} size="lg" />
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-black uppercase text-white">{away.name}</p>
            <p className="mt-1 text-sm uppercase tracking-[0.18em] text-zinc-500">{away.code}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <p className="text-sm text-zinc-400">Toque para abrir detalhes, palpite e contexto da partida.</p>
        <ArrowRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1 group-hover:text-white/80" />
      </div>
    </button>
  );
}

export function CopaOverview() {
  const navigate = useNavigate();
  const { data: matches = [], isLoading } = useMatches();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const tournamentStart = useMemo(() => new Date("2026-06-11T15:00:00-03:00"), []);
  const countdownParts = useMemo(() => formatCountdownParts(tournamentStart, nowTick), [tournamentStart, nowTick]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const upcomingMatches = useMemo(
    () =>
      matches
        .filter((match) => match.status === "scheduled")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [matches],
  );

  const featuredMatch = upcomingMatches[0] ?? matches[0] ?? null;
  const visibleGroups = groups.slice(0, 4).map((groupId) => ({
    id: groupId,
    teams: (groupStandings[groupId] ?? []).slice(0, 4),
  }));

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        <div className="h-72 animate-pulse rounded-[34px] bg-white/5" />
        <div className="h-48 animate-pulse rounded-[30px] bg-white/5" />
        <div className="h-40 animate-pulse rounded-[30px] bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20">
      <ArenaPanel tone="strong" className="overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,194,0,0.24),transparent_22%),radial-gradient(circle_at_15%_5%,rgba(145,255,59,0.12),transparent_28%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="arena-kicker text-primary">FIFA · 2026</p>
            <h1 className="mt-2 font-display text-[3.5rem] font-black uppercase leading-[0.88] tracking-[0.02em] text-white sm:text-[4.6rem]">
              Copa do Mundo 2026
            </h1>
            <div className="mt-4">
              <div className="arena-badge border-amber-400/30 text-amber-300">
                <Clock3 className="h-3.5 w-3.5" />
                Em breve
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="arena-badge bg-primary/12 border-primary/30 text-primary">48 seleções</span>
              <span className="arena-badge">16 cidades</span>
              <span className="arena-badge">3 países-sede</span>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              Acompanhe a preparação completa da Copa: fases, grupos, calendário e entrada nos bolões sem ficar pulando entre telas.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/copa/calendario")}
                className="arena-button-green"
              >
                Ver calendário
              </button>
              <button
                onClick={() => navigate("/boloes/criar", { state: { championship_id: "wc2026" } })}
                className="arena-button-gold"
              >
                Entrar na Copa
              </button>
            </div>
          </div>

          <div className="relative flex min-h-[260px] items-center justify-center">
            <div className="absolute h-52 w-52 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute h-40 w-40 rounded-full border border-amber-300/25" />
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(255,214,102,0.22),rgba(0,0,0,0.15))] shadow-[0_0_80px_rgba(255,186,0,0.18)]">
              <img
                src="/images/championships/wc2026.svg?v=20260405b"
                alt="Copa do Mundo 2026"
                className="h-36 w-36 object-contain drop-shadow-[0_0_24px_rgba(255,215,0,0.22)]"
              />
            </div>
            <div className="absolute bottom-3 left-3 rounded-[20px] border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
              <p className="arena-kicker text-zinc-400">Abertura</p>
              <p className="font-display text-[1.8rem] font-semibold uppercase leading-none text-white">11 jun</p>
            </div>
            <div className="absolute right-3 top-3 rounded-[20px] border border-primary/20 bg-primary/10 px-4 py-3 backdrop-blur-xl">
              <p className="arena-kicker text-primary">Meta</p>
              <p className="font-display text-[1.8rem] font-semibold uppercase leading-none text-white">Top ranking</p>
            </div>
          </div>
        </div>
      </ArenaPanel>

      <ArenaPanel className="p-5">
        <ArenaSectionHeader eyebrow="Faltam" title="Contagem regressiva" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {countdownParts.map((part) => (
            <div key={part.label} className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-5 text-center">
              <p className="font-display text-[3rem] font-black uppercase leading-none text-[#ffc107]">
                {part.value}
              </p>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                {part.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ArenaMetric label="Jogos" value={matches.length || 64} icon={<CalendarDays className="h-5 w-5" />} />
          <ArenaMetric label="Cidades" value={16} icon={<MapPinned className="h-5 w-5" />} />
          <ArenaMetric label="Países" value={3} icon={<Globe2 className="h-5 w-5" />} />
          <ArenaMetric label="Sonho" value="1" icon={<Trophy className="h-5 w-5" />} accent />
        </div>
      </ArenaPanel>

      <ArenaPanel className="p-5">
        <ArenaSectionHeader
          eyebrow="Fases"
          title="Caminho do torneio"
          action={<div className="arena-badge">5 etapas principais</div>}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {PHASES.map((phase, index) => (
            <div key={phase.id} className="relative">
              {index < PHASES.length - 1 ? (
                <div className="absolute left-[calc(100%-0.35rem)] top-5 hidden h-px w-6 bg-white/10 xl:block" />
              ) : null}
              <div
                className={cn(
                  "rounded-[24px] border px-4 py-4",
                  phase.active ? "border-primary/35 bg-primary/10" : "border-white/10 bg-white/[0.04]",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-[14px] border", phase.active ? "border-primary/35 bg-primary/15 text-primary" : "border-white/10 bg-black/20 text-zinc-500")}>
                    <span className="font-display text-lg font-semibold">{index + 1}</span>
                  </div>
                  {index < PHASES.length - 1 ? <ArrowRight className="h-4 w-4 text-white/20 xl:hidden" /> : null}
                </div>
                <p className={cn("mt-4 font-display text-[1.45rem] font-semibold uppercase leading-none", phase.active ? "text-primary" : "text-white")}>
                  {phase.title}
                </p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                  {phase.date}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ArenaPanel>

      <ArenaPanel className="p-5">
        <ArenaSectionHeader
          eyebrow="Grupos"
          title="Panorama inicial"
          action={<button onClick={() => navigate("/copa/grupos")} className="arena-button-green px-4 py-2 text-sm">Ver grupos</button>}
        />
        <div className="mt-4 grid gap-3 xl:grid-cols-4">
          {visibleGroups.map((group) => (
            <div key={group.id} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <p className="font-display text-[1.8rem] font-semibold uppercase text-white">Grupo {group.id}</p>
                <div className="arena-badge border-primary/25 text-primary">4 seleções</div>
              </div>
              <div className="mt-4 space-y-3">
                {group.teams.map((standing) => {
                  const team = getTeam(standing.teamCode);
                  return (
                    <div key={standing.teamCode} className="flex items-center gap-3">
                      <Flag code={standing.teamCode} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-white">{team.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ArenaPanel>

      {featuredMatch ? (
        <ArenaPanel className="p-4">
          <FeaturedFixture match={featuredMatch} onOpen={() => setSelectedMatch(featuredMatch)} />
        </ArenaPanel>
      ) : null}

      <ArenaPanel className="p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-[#ffc107]/35 bg-[#ffc107]/12 text-[#ffc107]">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <p className="font-display text-[2.1rem] font-semibold uppercase leading-none text-white">
                Participe e conquiste recompensas
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
                Entre na Copa para palpitar, subir no ranking e transformar cada rodada em progresso real dentro do app.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/boloes")}
              className="arena-button-green"
            >
              Ver bolões
            </button>
            <button
              onClick={() => navigate("/boloes/criar", { state: { championship_id: "wc2026" } })}
              className="arena-button-gold"
            >
              Entrar na Copa
            </button>
          </div>
        </div>
      </ArenaPanel>

      <MatchDetailsModal match={selectedMatch} isOpen={Boolean(selectedMatch)} onClose={() => setSelectedMatch(null)} />
    </div>
  );
}
