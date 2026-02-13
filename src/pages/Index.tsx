import { Link } from "react-router-dom";
import { MatchCard } from "@/components/MatchCard";
import { Flag } from "@/components/Flag";
import { getTodayMatches, getTeam, matches, formatMatchTime } from "@/data/mockData";
import { Users, Trophy as TrophyIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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

const Index = () => {
  const { user } = useAuth();
  const todayMatches = getTodayMatches();
  const favoriteTeam = getTeam("BRA");
  const [myBoloes, setMyBoloes] = useState<MyBolao[]>([]);
  const [boloesLoading, setBoloesLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("boloes").select("id, name, bolao_members(count)").limit(3),
      supabase.from("profiles").select("name").eq("user_id", user.id).single(),
    ]).then(([boloesRes, profileRes]) => {
      if (boloesRes.data) {
        setMyBoloes(boloesRes.data.map((b: any) => ({
          id: b.id,
          name: b.name,
          memberCount: b.bolao_members?.[0]?.count || 0,
        })));
      }
      if (profileRes.data) setProfile(profileRes.data);
      setBoloesLoading(false);
    });
  }, [user]);

  const nextFavMatch = matches.find(
    m => (m.homeTeam === "BRA" || m.awayTeam === "BRA") && m.status !== "finished"
  );

  const displayName = profile?.name || user?.email?.split("@")[0] || "Jogador";

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Welcome */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={0}>
        <p className="text-xs text-muted-foreground">Olá,</p>
        <h1 className="text-xl font-black">{displayName} 👋</h1>
      </motion.div>

      {/* Meu Time */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={0.5}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meu Time</h2>
          <Link to="/copa/grupos" className="text-xs text-primary font-semibold">Detalhes</Link>
        </div>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="glass-card p-4 border border-copa-green/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary/80 border-2 border-copa-green/40 flex items-center justify-center overflow-hidden shrink-0">
              <Flag code={favoriteTeam.code} size="xl" className="w-14 h-14" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-xl">{favoriteTeam.name}</h3>
              {nextFavMatch && (
                <span className="text-xs text-muted-foreground">
                  Próximo Jogo: <span className="text-primary font-semibold">Hoje, {formatMatchTime(nextFavMatch.date)}</span>
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block font-bold">Grupo {favoriteTeam.group}</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Meus Bolões */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
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
                  className="glass-card p-4 relative block border border-copa-green/20"
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
          </div>
        )}
      </motion.section>

      {/* Jogos de Hoje */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Jogos de Hoje</h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-secondary-foreground uppercase tracking-wider">
            {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).toUpperCase()}
          </span>
        </div>
        <div className="space-y-3">
          {todayMatches.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <span className="text-2xl mb-2 block">😴</span>
              <p className="text-sm text-muted-foreground">Sem jogos hoje</p>
            </div>
          ) : (
            todayMatches.map((match, i) => (
              <MatchCard key={match.id} match={match} index={i} />
            ))
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Index;
