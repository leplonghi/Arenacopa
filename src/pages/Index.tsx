import { Link } from "react-router-dom";
import { MatchCard } from "@/components/MatchCard";
import { Flag } from "@/components/Flag";
import { NewsFeed } from "@/components/NewsFeed";
import { getTeam, matches, formatMatchTime } from "@/data/mockData";
import { Users, Trophy as TrophyIcon, Loader2, Newspaper, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const COPA_START = new Date("2026-06-11T00:00:00-04:00");

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.15 + i * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

interface MyBolao {
  id: string;
  name: string;
  memberCount: number;
}

interface ProfileData {
  name: string;
  favorite_team: string | null;
  notifications: Record<string, boolean> | null;
}

/** Countdown to Copa 2026 opening match */
function useCountdown(target: Date) {
  const [diff, setDiff] = useState(() => Math.max(0, target.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setDiff(Math.max(0, target.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const started = diff === 0;
  return { days, hours, mins, secs, started };
}

const Index = () => {
  const { user } = useAuth();
  const countdown = useCountdown(COPA_START);

  const [myBoloes, setMyBoloes] = useState<MyBolao[]>([]);
  const [boloesLoading, setBoloesLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      // ✅ Fixed: filter bolões by user membership
      supabase
        .from("bolao_members")
        .select("bolao_id, boloes(id, name, bolao_members(count))")
        .eq("user_id", user.id)
        .limit(4),
      // ✅ Fixed: read favorite_team and notifications from profile
      supabase
        .from("profiles")
        .select("name, favorite_team, notifications")
        .eq("user_id", user.id)
        .single(),
    ]).then(([membersRes, profileRes]) => {
      if (membersRes.data) {
        setMyBoloes(
          (membersRes.data as any[]).map((m) => ({
            id: m.bolao_id,
            name: m.boloes?.name || "Bolão",
            memberCount: m.boloes?.bolao_members?.[0]?.count || 0,
          }))
        );
      }
      if (profileRes.data) {
        setProfile({
          name: profileRes.data.name,
          favorite_team: (profileRes.data as any).favorite_team || "BRA",
          notifications: (profileRes.data as any).notifications || null,
        });
      }
      setBoloesLoading(false);
    });
  }, [user]);

  // ✅ Fixed: use profile favorite_team instead of hardcoded "BRA"
  const favoriteTeamCode = profile?.favorite_team || "BRA";
  const favoriteTeam = getTeam(favoriteTeamCode);

  // Next matches for the favorite team
  const nextFavMatches = useMemo(() => {
    return matches
      .filter(
        (m) =>
          (m.homeTeam === favoriteTeamCode || m.awayTeam === favoriteTeamCode) &&
          m.status !== "finished"
      )
      .slice(0, 2);
  }, [favoriteTeamCode]);

  // Today's live/ongoing matches
  const todayMatches = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    return matches.filter((m) => m.date.split("T")[0] === todayStr);
  }, []);

  // News enabled from profile preferences
  const newsEnabled = profile?.notifications?.news ?? true;

  const displayName = profile?.name || user?.email?.split("@")[0] || "Jogador";

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Welcome */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={0}>
        <p className="text-xs text-muted-foreground">Olá,</p>
        <h1 className="text-xl font-black">{displayName} 👋</h1>
      </motion.div>

      {/* Countdown to Copa (only if Copa hasn't started) */}
      {!countdown.started && (
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={0.4}>
          <div className="rounded-2xl bg-gradient-to-br from-copa-green/20 via-secondary to-background border border-copa-green/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 text-6xl opacity-10 leading-none select-none mt-1 mr-2">⚽</div>
            <span className="text-[9px] font-black uppercase tracking-widest text-copa-green-light block mb-2">
              Contagem Regressiva
            </span>
            <div className="flex items-end gap-3">
              {[
                { value: countdown.days, label: "dias" },
                { value: countdown.hours, label: "horas" },
                { value: countdown.mins, label: "min" },
                { value: countdown.secs, label: "seg" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <span className="text-2xl font-black text-primary tabular-nums">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] text-muted-foreground block uppercase tracking-wider">{label}</span>
                </div>
              ))}
              <div className="flex-1 text-right">
                <span className="text-xs font-black block">para a</span>
                <span className="text-xs font-black text-primary">Copa 2026</span>
                <span className="text-[9px] text-muted-foreground block">11 Jun · Azteca, México</span>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Meu Time */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meu Time</h2>
          <Link to={`/copa/grupos`} className="text-xs text-primary font-semibold flex items-center gap-0.5">
            Grupo {favoriteTeam.group} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {boloesLoading ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : (
          <motion.div whileTap={{ scale: 0.98 }} className="glass-card p-4 border border-copa-green/30">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-copa-green/40 flex items-center justify-center overflow-hidden shrink-0">
                <Flag code={favoriteTeam.code} size="xl" className="w-14 h-14" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-xl">{favoriteTeam.name}</h3>
                {nextFavMatches[0] ? (
                  <span className="text-xs text-muted-foreground">
                    Próximo: <span className="text-primary font-semibold">
                      {new Date(nextFavMatches[0].date).toLocaleDateString("pt-BR", {
                        day: "numeric", month: "short",
                      }).toUpperCase()} · {formatMatchTime(nextFavMatches[0].date)}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Calendário disponível em breve</span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">
                  Grupo {favoriteTeam.group}
                </span>
                <span className="text-[9px] text-muted-foreground">{favoriteTeam.confederation}</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* Meus Bolões */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meus Bolões</h2>
          <Link to="/boloes" className="text-xs text-primary font-semibold">Ver todos</Link>
        </div>
        {boloesLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : myBoloes.length === 0 ? (
          <Link to="/boloes/criar" className="glass-card p-6 text-center block">
            <span className="text-2xl mb-2 block">🏆</span>
            <p className="text-sm font-bold">Crie seu primeiro bolão</p>
            <p className="text-[11px] text-muted-foreground">Convide amigos e faça seus palpites</p>
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {myBoloes.map((bolao, i) => (
              <motion.div key={bolao.id} variants={cardVariants} initial="hidden" animate="visible" custom={i} whileTap={{ scale: 0.97 }}>
                <Link
                  to={`/boloes/${bolao.id}`}
                  className="glass-card p-4 relative block border border-copa-green/20 h-full"
                >
                  <div className="w-10 h-10 rounded-xl bg-copa-green/15 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-copa-green-light" />
                  </div>
                  <span className="text-xs font-bold block truncate mb-1">{bolao.name}</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px]">{bolao.memberCount} membros</span>
                  </div>
                </Link>
              </motion.div>
            ))}
            {/* Add bolão shortcut */}
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={myBoloes.length} whileTap={{ scale: 0.97 }}>
              <Link
                to="/boloes/criar"
                className="glass-card p-4 relative block border border-dashed border-copa-green/20 h-full flex flex-col items-center justify-center"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-2 text-xl text-muted-foreground">
                  +
                </div>
                <span className="text-[11px] text-muted-foreground font-bold text-center">Criar bolão</span>
              </Link>
            </motion.div>
          </div>
        )}
      </motion.section>

      {/* Jogos de Hoje / Próximos Jogos */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={3}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">
            {todayMatches.length > 0 ? "Jogos de Hoje" : `Próximos Jogos — ${favoriteTeam.flag}`}
          </h2>
          <Link to="/copa/calendario" className="text-xs text-primary font-semibold">Ver calendário</Link>
        </div>
        <div className="space-y-3">
          {todayMatches.length > 0 ? (
            todayMatches.map((match, i) => (
              <MatchCard key={match.id} match={match} index={i} />
            ))
          ) : nextFavMatches.length > 0 ? (
            nextFavMatches.map((match, i) => (
              <MatchCard key={match.id} match={match} index={i} />
            ))
          ) : (
            <div className="glass-card p-6 text-center">
              <span className="text-2xl mb-2 block">📅</span>
              <p className="text-sm text-muted-foreground">Calendário completo disponível a partir de 11/06/2026</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Notícias da Copa */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={4}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black">Notícias da Copa</h2>
            {favoriteTeam && (
              <span className="text-sm">{favoriteTeam.flag}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">NewsAPI</span>
          </div>
        </div>

        {!newsEnabled ? (
          <Link
            to="/perfil"
            className="glass-card p-5 text-center block border border-dashed border-border/40"
          >
            <Newspaper className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-bold">Notícias desativadas</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Ative em <span className="text-primary font-semibold">Perfil → Notificações → Notícias & Transferências</span>
            </p>
          </Link>
        ) : (
          <NewsFeed teamCode={favoriteTeamCode} compact={false} limit={4} />
        )}
      </motion.section>
    </div>
  );
};

export default Index;
