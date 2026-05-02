import { useTranslation, Trans } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  ChevronRight,
  Radio,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";
import { cn } from "@/lib/utils";
import { ArenaMetric, ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";
import { RankingListRow } from "@/components/ranking/RankingListRow";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useChampionship } from "@/contexts/ChampionshipContext";
import { useDashboardMatches } from "@/hooks/useDashboardMatches";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { listUserBoloes, type BolaoListingCard } from "@/services/boloes/bolao-listing.service";
import { getArenaLevel } from "@/lib/profile-level";
import { useFriendIds } from "@/hooks/useFriendIds";

// ─── Types ─────────────────────────────────────────────────────────────────

type UserStanding = {
  userId: string;
  name: string;
  avatar: string;
  points: number;
};

// ─── Fade-in animation variant ─────────────────────────────────────────────

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ─── Live Match Pill ───────────────────────────────────────────────────────

function LiveMatchPill({
  home,
  away,
  homeScore,
  awayScore,
  status,
  matchDate,
  onClick,
}: {
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  matchDate: string;
  onClick: () => void;
}) {
  const { t } = useTranslation('arena');
  const isLive = status === "live";
  const kickoff = useMemo(() => {
    const d = new Date(matchDate);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }, [matchDate]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex min-h-[72px] w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-3 text-left transition-all",
        isLive
          ? "border-green-500/35 bg-green-500/[0.06] hover:bg-green-500/[0.1]"
          : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      {/* Status badge */}
      <div className="shrink-0">
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-950/60 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-green-400">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            {t('matches.status.live')}
          </span>
        ) : (
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
            {kickoff}
          </span>
        )}
      </div>

      {/* Match */}
      <div className="flex flex-1 items-center justify-center gap-3 text-sm font-semibold text-white">
        <span className="min-w-[2.5rem] text-right">{home}</span>
        {isLive || status === "finished" ? (
          <span className="rounded-[10px] border border-white/15 bg-white/10 px-2.5 py-0.5 text-lg font-black tabular-nums">
            {homeScore ?? "?"} — {awayScore ?? "?"}
          </span>
        ) : (
          <span className="text-zinc-500">vs</span>
        )}
        <span className="min-w-[2.5rem] text-left">{away}</span>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
    </button>
  );
}

// ─── Open Bolão Card ───────────────────────────────────────────────────────

function OpenBolaoCard({ bolao }: { bolao: BolaoListingCard }) {
  const { t } = useTranslation('arena');
  return (
    <motion.article variants={item} className="flex flex-col justify-between rounded-[22px] border border-white/10 bg-white/[0.035] p-4 transition hover:border-primary/25 hover:bg-primary/[0.05]">
      <div>
        <p className="text-lg font-semibold leading-tight text-white">
          {bolao.name}
        </p>
        {bolao.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
            {bolao.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
            {bolao.is_paid ? t('open_boloes.card.paid') : t('open_boloes.card.free')}
          </span>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
            {bolao.status}
          </span>
        </div>
      </div>
      <Link
        to={`/b/${bolao.invite_code}`}
        aria-label={t('open_boloes.card.cta') + " " + bolao.name}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105 active:scale-95"
      >
        <Zap className="h-3.5 w-3.5" />
        {t('open_boloes.card.cta')}
      </Link>
    </motion.article>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function Descobrir() {
  const { t } = useTranslation('arena');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { current: championship } = useChampionship();
  const { data: allMatches, isLoading: matchesLoading } = useDashboardMatches();

  // ── Live / upcoming matches filtered to current championship ──────────────
  const relevantMatches = useMemo(() => {
    return allMatches
      .filter(
        (m) =>
          (m.status === "live" || m.status === "upcoming") &&
          m.championshipId === championship.id,
      )
      .slice(0, 5);
  }, [allMatches, championship.id]);

  // ── Open bolões (public, user not yet member) ─────────────────────────────
  const [openBoloes, setOpenBoloes] = useState<BolaoListingCard[]>([]);
  const [boloesLoading, setBoloesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setBoloesLoading(true);
    listUserBoloes()
      .then((result) => {
        if (!cancelled) {
          setOpenBoloes(result.discoverBoloes.slice(0, 6));
        }
      })
      .catch(() => {
        if (!cancelled) setOpenBoloes([]);
      })
      .finally(() => {
        if (!cancelled) setBoloesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Global ranking top 5 + my position ───────────────────────────────────
  const [rankRows, setRankRows] = useState<UserStanding[]>([]);
  const [rankLoading, setRankLoading] = useState(true);
  const [rankFilter, setRankFilter] = useState<"all" | "friends">("all");
  const { friendIds } = useFriendIds();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setRankLoading(true);
      try {
        let snap;
        if (rankFilter === "all") {
          snap = await getDocs(
            query(collection(db, "bolao_rankings"), orderBy("total_points", "desc"), limit(100)),
          );
        } else {
          // If filtering by friends, we need to fetch specifically for those IDs
          // and then aggregate points (since bolao_rankings is per bolao)
          const fids = Array.from(friendIds);
          if (fids.length === 0) {
            if (!cancelled) {
              setRankRows([]);
              setRankLoading(false);
            }
            return;
          }
          
          // Chunked query for 'in' operator (limit 30)
          const allDocs: any[] = [];
          for (let i = 0; i < fids.length; i += 30) {
            const chunk = fids.slice(i, i + 30);
            const chunkSnap = await getDocs(
              query(collection(db, "bolao_rankings"), where("user_id", "in", chunk))
            );
            allDocs.push(...chunkSnap.docs);
          }
          
          const totals = new Map<string, number>();
          allDocs.forEach((d) => {
            const uid = d.data().user_id as string;
            totals.set(uid, (totals.get(uid) ?? 0) + ((d.data().total_points as number) ?? 0));
          });
          
          const sorted = [...totals.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
            
          const profileMap = await getPublicProfilesByIds(sorted.map(([id]) => id));
          if (!cancelled) {
            setRankRows(
              sorted.map(([userId, points]) => {
                const p = profileMap.get(userId);
                return {
                  userId,
                  name: p?.name ?? p?.nickname ?? "Jogador",
                  avatar: p?.avatar_url ?? "",
                  points,
                };
              }),
            );
          }
          setRankLoading(false);
          return;
        }

        const totals = new Map<string, number>();
        snap.docs.forEach((d) => {
          const uid = d.data().user_id as string;
          totals.set(uid, (totals.get(uid) ?? 0) + ((d.data().total_points as number) ?? 0));
        });
        const sorted = [...totals.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8);
        if (!sorted.length) {
          if (!cancelled) setRankRows([]);
          return;
        }
        const profileMap = await getPublicProfilesByIds(sorted.map(([id]) => id));
        if (!cancelled) {
          setRankRows(
            sorted.map(([userId, points]) => {
              const p = profileMap.get(userId);
              return {
                userId,
                name: p?.name ?? p?.nickname ?? "Jogador",
                avatar: p?.avatar_url ?? "",
                points,
              };
            }),
          );
        }
      } catch (err) {
        console.error("Error loading ranking:", err);
        if (!cancelled) setRankRows([]);
      } finally {
        if (!cancelled) setRankLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [rankFilter, friendIds.size]);

  const myRankPosition = useMemo(() => {
    if (!user?.id) return null;
    const idx = rankRows.findIndex((r) => r.userId === user.id);
    return idx === -1 ? null : { rank: idx + 1, ...rankRows[idx] };
  }, [rankRows, user?.id]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="arena-screen space-y-5">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] bg-[radial-gradient(circle_at_50%_-8%,rgba(145,255,59,0.14),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(255,197,77,0.08),transparent_30%)]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 space-y-5"
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <p className="arena-kicker text-primary">{t('eyebrow')}</p>
          <h1 className="mt-1 text-[2.5rem] font-bold leading-tight text-white sm:text-[3.8rem]">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t('description')}
          </p>
        </motion.div>

        {/* ── JOGOS AO VIVO / PRÓXIMOS ───────────────────────────────────── */}
        <motion.div variants={item}>
          <ArenaPanel className="p-5">
            <ArenaSectionHeader
              eyebrow={championship.name}
              title={t('matches.title')}
              action={
                <button
                  onClick={() =>
                    navigate(
                      championship.id === "wc2026"
                        ? "/copa"
                        : `/campeonato/${championship.id}`,
                    )
                  }
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
                >
                  {t('matches.action')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              }
            />

            {matchesLoading ? (
              <SkeletonRows count={3} />
            ) : relevantMatches.length === 0 ? (
              <EmptyState
                icon="⚽"
                title={t('matches.empty.title')}
                description={t('matches.empty.description', { championship: championship.name })}
                className="mt-4 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
                glowColor="green"
              />
            ) : (
              <div className="mt-4 space-y-2">
                {relevantMatches.map((m) => (
                  <LiveMatchPill
                    key={m.id}
                    home={m.homeTeamCode}
                    away={m.awayTeamCode}
                    homeScore={m.homeScore}
                    awayScore={m.awayScore}
                    status={m.status}
                    matchDate={m.matchDate}
                    onClick={() =>
                      navigate(
                        championship.id === "wc2026"
                          ? "/copa"
                          : `/campeonato/${championship.id}`,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </ArenaPanel>
        </motion.div>

        {/* ── RANKINGS ───────────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <ArenaPanel className="p-5">
            <ArenaSectionHeader
              eyebrow="Temporada 2026"
              title={t('rankings.title')}
              action={
                <Link
                  to="/ranking"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary/15"
                >
                  {t('rankings.action')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              }
            />

            {/* Filter Toggle */}
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center p-1 rounded-2xl bg-white/5 border border-white/10">
                <button
                  onClick={() => setRankFilter("all")}
                  className={cn(
                    "px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    rankFilter === "all" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {t('rankings.filter_all', { defaultValue: "Geral" })}
                </button>
                <button
                  onClick={() => setRankFilter("friends")}
                  className={cn(
                    "px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    rankFilter === "friends" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Users className="w-3 h-3" />
                  {t('rankings.filter_friends', { defaultValue: "Turma" })}
                </button>
              </div>
            </div>

            {/* My position callout */}
            {myRankPosition && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ArenaMetric
                  label={t('rankings.my_position')}
                  value={`${myRankPosition.rank}º`}
                  accent
                  icon={<Trophy className="h-5 w-5" />}
                />
                <ArenaMetric
                  label={t('rankings.my_points')}
                  value={myRankPosition.points.toLocaleString("pt-BR")}
                  icon={<Award className="h-5 w-5" />}
                />
              </div>
            )}

            {/* Top players */}
            <div className="mt-5 space-y-2">
              {rankLoading ? (
                <SkeletonRows count={5} />
              ) : rankRows.length === 0 ? (
                <EmptyState
                  icon="🏆"
                  title={t('rankings.empty.title')}
                  description={t('rankings.empty.description')}
                  className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
                  glowColor="gold"
                />
              ) : (
                rankRows.map((row, idx) => (
                  <RankingListRow
                    key={row.userId}
                    row={row}
                    rank={idx + 1}
                    level={getArenaLevel(row.points).level}
                    isCurrentUser={row.userId === user?.id}
                  />
                ))
              )}
            </div>

            {/* Competitive summary */}
            {!rankLoading && rankRows.length > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3">
                <Users className="h-4 w-4 shrink-0 text-zinc-500" />
                <p className="text-sm text-zinc-400">
                  <Trans i18nKey="rankings.summary" ns="arena" values={{ count: rankRows.length }}>
                    <span className="font-bold text-white">{{count}}</span> jogadores no ranking geral desta temporada.
                  </Trans>
                </p>
              </div>
            )}
          </ArenaPanel>
        </motion.div>

        {/* ── BOLÕES ABERTOS ─────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <ArenaPanel className="p-5">
            <ArenaSectionHeader
              eyebrow={t('open_boloes.eyebrow')}
              title={t('open_boloes.title')}
              action={
                <Link
                  to="/boloes"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-white transition hover:bg-white/[0.07]"
                >
                  {t('open_boloes.action')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              }
            />
            <p className="mt-1 text-sm text-zinc-500">
              {t('open_boloes.description')}
            </p>

            {boloesLoading ? (
              <SkeletonRows count={3} />
            ) : openBoloes.length === 0 ? (
              <EmptyState
                icon="🎯"
                title={t('open_boloes.empty.title')}
                description={t('open_boloes.empty.description')}
                className="mt-4 rounded-[22px] border border-dashed border-white/10 bg-white/[0.03]"
                glowColor="green"
                action={
                  <Link
                    to="/criar-bolao"
                    className="inline-flex items-center gap-1.5 rounded-[16px] bg-primary px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-black transition hover:brightness-105"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {t('open_boloes.empty.cta')}
                  </Link>
                }
              />
            ) : (
              <motion.div
                variants={container}
                className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              >
                {openBoloes.map((bolao) => (
                  <OpenBolaoCard key={bolao.id} bolao={bolao} />
                ))}
              </motion.div>
            )}
          </ArenaPanel>
        </motion.div>

        {/* ── CTA CRIAR BOLÃO ────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <Link
            to="/criar-bolao"
            className="group flex min-h-[96px] w-full items-center justify-between gap-4 rounded-[26px] border border-primary/25 bg-primary/[0.07] px-6 py-5 transition hover:border-primary/40 hover:bg-primary/[0.11]"
          >
            <div>
              <p className="arena-kicker text-primary">{t('cta.eyebrow')}</p>
              <p className="mt-0.5 text-lg font-semibold leading-tight text-white">
                {t('cta.title')}
              </p>
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-black transition group-hover:scale-105">
              <Zap className="h-6 w-6" />
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-[22px] border border-white/10 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}
