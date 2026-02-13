import { Link } from "react-router-dom";
import { MatchCard } from "@/components/MatchCard";
import { Flag } from "@/components/Flag";
import { getTodayMatches, getTeam, boloes, userProfile, matches, formatMatchTime } from "@/data/mockData";
import { ChevronRight, TrendingUp, TrendingDown, Minus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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

const Index = () => {
  const todayMatches = getTodayMatches();
  const favoriteTeam = getTeam(userProfile.favoriteTeam);
  const myBoloes = boloes.filter(b => b.status === "active").slice(0, 3);

  const nextFavMatch = matches.find(
    m => (m.homeTeam === userProfile.favoriteTeam || m.awayTeam === userProfile.favoriteTeam) && m.status !== "finished"
  );

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Meu Time */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={0}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meu Time</h2>
          <Link to="/copa/grupos" className="text-xs text-primary font-semibold">Detalhes</Link>
        </div>
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="glass-card p-4 border-l-2 border-l-copa-green"
        >
          <div className="flex items-center gap-3">
            <Flag code={favoriteTeam.code} size="xl" className="border-2 border-copa-green/30" />
            <div className="flex-1">
              <h3 className="font-black text-lg">{favoriteTeam.name}</h3>
              {nextFavMatch && (
                <span className="text-xs text-muted-foreground">
                  Próximo Jogo: <span className="text-primary font-semibold">Hoje, {formatMatchTime(nextFavMatch.date)}</span>
                </span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Grupo {favoriteTeam.group}</span>
              <span className="text-2xl font-black">1º</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Meus Bolões */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Meus Bolões</h2>
          <Link to="/boloes" className="text-xs text-primary font-semibold">Ranking</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {myBoloes.map((bolao, i) => (
            <motion.div key={bolao.id} variants={cardVariants} initial="hidden" animate="visible" custom={i} whileTap={{ scale: 0.97 }}>
              <Link
                to={`/boloes/${bolao.id}`}
                className="glass-card p-4 border-l-2 border-l-copa-green relative block"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-copa-green/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-copa-green-light" />
                  </div>
                  {bolao.myDelta > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-copa-success/20 text-copa-success ml-auto">
                      +{bolao.myDelta > 0 ? `${bolao.myDelta * 3}pts` : ""}
                    </span>
                  )}
                  {bolao.myRank === 1 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary ml-auto">
                      Líder
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold block truncate mb-1">{bolao.name}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{bolao.myRank}º</span>
                  <span className="text-xs text-muted-foreground">/ {bolao.participants.length}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Jogos de Hoje */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black">Jogos de Hoje</h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground uppercase tracking-wider">
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
