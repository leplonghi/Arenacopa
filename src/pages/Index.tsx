import { Link } from "react-router-dom";
import { Flag } from "@/components/Flag";
import { getTeam, matches, formatMatchTime, formatMatchDate, type Match } from "@/data/mockData";
import { Users, Trophy, ChevronRight, AlertTriangle, Dices, Zap, Bell, Crown, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ElitePassModal } from "@/components/ElitePassModal";
import { LiveMatchCard } from "@/components/LiveMatchCard";
import { useMonetization } from "@/contexts/MonetizationContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardData, type DashboardBolaoSummary, type DashboardNewsItem } from "@/services/dashboard/dashboard.service";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Index = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation('home');

  const { data: dbFavoriteTeamCode } = useQuery({
    queryKey: ['favoriteTeam', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('favorite_team')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching favorite team from Supabase:", error);
      }
      return data?.favorite_team || null;
    },
    enabled: !!user?.id,
  });

  const favoriteTeamCode = dbFavoriteTeamCode || localStorage.getItem("favorite_team") || "BRA";
  const favoriteTeam = getTeam(favoriteTeamCode);

  const [myBoloes, setMyBoloes] = useState<DashboardBolaoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [miniNews, setMiniNews] = useState<DashboardNewsItem[]>([]);
  const [isEliteModalOpen, setIsEliteModalOpen] = useState(false);
  const { isPremium } = useMonetization();

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const isDemo = localStorage.getItem("demo_mode") === "true";
        if (isDemo) {
          setProfile({ name: "Demo User", avatar: "https://github.com/shadcn.png" });
          setMyBoloes([
            { id: "demo1", name: "Bolão da Família", memberCount: 12, myPoints: 145, myRank: 2, pendingCount: 3 },
            { id: "demo2", name: "Bolão da Firma", memberCount: 25, myPoints: 88, myRank: 5, pendingCount: 1 },
            { id: "demo3", name: "Amigos do Futebol", memberCount: 8, myPoints: 42, myRank: 1, pendingCount: 0 },
          ]);
          setMiniNews([
            { id: "n1", title: "Brasil faz último treino antes da estreia", category: "Seleção", time: "2h", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400", url: "#" },
            { id: "n2", title: "Estádio MetLife recebe ajustes finais", category: "Sedes", time: "4h", image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=400", url: "#" },
            { id: "n3", title: "Mbappé é dúvida para jogo da França", category: "Seleções", time: "6h", image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=400", url: "#" },
          ]);
          setLoading(false);
          return;
        }

        const dashboardData = await getDashboardData(user.id);
        setProfile({
          name: dashboardData.profile?.name || "",
          avatar: dashboardData.profile?.avatar_url || "",
        });
        setMyBoloes(dashboardData.myBoloes);
        setMiniNews(dashboardData.news);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const nextFavMatch = useMemo(() =>
    matches.find(
      m => (m.homeTeam === favoriteTeamCode || m.awayTeam === favoriteTeamCode) && m.status !== "finished"
    ), [favoriteTeamCode]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "Torcedor";
  const totalPoints = myBoloes.reduce((acc, curr) => acc + (curr.myPoints || 0), 0);
  const bestRank = myBoloes.length > 0 ? Math.min(...myBoloes.map(b => b.myRank || 999).filter(r => r > 0)) : 999;
  const totalPending = myBoloes.reduce((acc, curr) => acc + (curr.pendingCount || 0), 0);

  return (
    <div className="min-h-screen bg-black/70 pb-24 overflow-hidden relative">
      {/* Immersive Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent opacity-40" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <MatchDetailsModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

      <ElitePassModal
        isOpen={isEliteModalOpen}
        onClose={() => setIsEliteModalOpen(false)}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-6 pt-8 space-y-10 relative z-10 max-w-2xl mx-auto"
      >
        <LiveMatchCard />

        {/* Profile Header HUD */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="p-1 rounded-[24px] bg-gradient-to-br from-primary/40 to-transparent">
                <Avatar className="w-16 h-16 rounded-[22px] border-none bg-black shadow-2xl">
                  <AvatarImage src={profile?.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-[10px] bg-primary flex items-center justify-center shadow-lg border-2 border-[#050505]">
                <Zap className="w-4 h-4 text-black" strokeWidth={3} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] block">DASHBOARD CENTRAL</span>
                {!isPremium ? (
                  <button
                    onClick={() => setIsEliteModalOpen(true)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-gradient-to-r from-yellow-600 to-yellow-500 hover:scale-105 transition-transform"
                  >
                    <Crown className="w-2.5 h-2.5 text-black" />
                    <span className="text-[8px] font-black text-black uppercase tracking-widest">OBTER ELITE</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-white/10">
                    <Crown className="w-2.5 h-2.5 text-yellow-500" />
                    <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">MEMBRO ELITE</span>
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter leading-none">{displayName}</h1>
            </div>
          </div>
          <Link to="/perfil">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-[22px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all backdrop-blur-3xl"
            >
              <Settings className="w-6 h-6" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Intelligence / Alerts Bar */}
        {totalPending > 0 && (
          <motion.div variants={itemVariants}>
            <Link to="/boloes" className="group">
              <div className="relative p-7 rounded-[40px] bg-gradient-to-r from-orange-500/20 to-transparent border border-orange-500/30 overflow-hidden shadow-2xl backdrop-blur-md">
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700">
                  <Bell className="w-20 h-20 text-orange-500" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-14 h-14 rounded-[22px] bg-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/50 shrink-0">
                    <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tight">CUIDADO, CAPITÃO!</h2>
                    <p className="text-[10px] text-orange-200/60 font-black mt-1 uppercase tracking-widest leading-none">VOCÊ POSSUI {totalPending} PALPITES PENDENTES</p>
                  </div>
                  <motion.div
                    whileHover={{ x: 3 }}
                    className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 group-hover:bg-orange-500 group-hover:text-black transition-all"
                  >
                    <ChevronRight className="w-6 h-6 stroke-[3px]" />
                  </motion.div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Stats Grid - High Tech Stat Blocks */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="MELHOR RANK"
            value={bestRank === 999 ? "-" : `${bestRank}º`}
            color="text-yellow-500"
          />
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="PONTOS GERAIS"
            value={totalPoints}
            highlight
            color="text-primary"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="LIGAS ATIVAS"
            value={myBoloes.length}
            color="text-blue-400"
          />
        </motion.div>

        {/* Favorite Team Focus */}
        {!user ? (
          <motion.section variants={itemVariants} className="space-y-6">
            <SectionHeader color="bg-primary" title="MINHA SELEÇÃO" rightElement={null} />
            <Link to="/auth" className="block group">
              <div className="relative overflow-hidden rounded-[48px] p-8 border border-white/10 group-hover:border-primary/50 bg-black/70 transition-all shadow-2xl flex flex-col items-center justify-center text-center gap-4">
                <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 pointer-events-none relative overflow-hidden">
                  <Trophy className="absolute w-8 h-8 text-primary shadow-2xl z-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter leading-none mb-2 uppercase">Junte-se à Torcida!</h3>
                  <p className="text-sm font-medium text-gray-400">Crie sua conta gratuita, escolha sua seleção do coração e entre oficialmente no clima da Copa de 2026.</p>
                </div>
                <div className="mt-2 px-8 py-4 rounded-[24px] bg-white text-black font-black uppercase tracking-widest text-[11px] shadow-2xl group-hover:bg-primary transition-colors flex items-center gap-2">
                  CRIAR CONTA <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.section>
        ) : favoriteTeam ? (
          <motion.section variants={itemVariants} className="space-y-6">
            <SectionHeader color="bg-primary" title="MINHA SELEÇÃO" rightElement={
              <Link to="/copa/grupos" className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
                VER GRUPO {favoriteTeam.group} <ChevronRight className="w-3 h-3 inline ml-1" />
              </Link>
            } />

            <Link to={`/team/${favoriteTeam.code}`} className="block group">
              <div className="relative overflow-hidden rounded-[48px] p-8 bg-white/[0.03] border border-white/10 group-hover:bg-white/[0.05] transition-all shadow-2xl backdrop-blur-3xl group">
                <div className="absolute -top-10 -right-10 opacity-5 group-hover:opacity-10 transition-all rotate-12 group-hover:rotate-6 scale-150 duration-700 pointer-events-none">
                  <Flag code={favoriteTeam.code} size="lg" className="w-64 h-64 blur-[2px]" />
                </div>

                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[28px] bg-white/5 p-1.5 border border-white/10 overflow-hidden shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                      <Flag code={favoriteTeam.code} size="md" className="w-full h-full object-cover rounded-[20px]" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-white tracking-tighter leading-none mb-2 uppercase">{favoriteTeam.name}</h3>
                      <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-primary">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>NAÇÃO EM BUSCA DO HEXA</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between">
                  {nextFavMatch ? (
                    <>
                      <div className="space-y-2">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em]">PRÓXIMO DESAFIO</span>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                          <span className="text-lg font-black text-white tracking-widest uppercase tabular-nums">
                            {(() => {
                              const date = new Date(nextFavMatch.date);
                              const today = new Date();
                              const isToday = date.toDateString() === today.toDateString();
                              return isToday ? formatMatchTime(nextFavMatch.date, i18n.language) : formatMatchDate(nextFavMatch.date, i18n.language);
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-[24px] border border-white/10 group-hover:border-primary/40 transition-colors">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">ENFRENTA</span>
                        <Flag code={nextFavMatch.homeTeam === favoriteTeam.code ? nextFavMatch.awayTeam : nextFavMatch.homeTeam} size="sm" className="w-8 h-8 rounded-lg shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 font-black uppercase tracking-widest">CALENDÁRIO EM DEFINIÇÃO</span>
                  )}
                </div>
              </div>
            </Link>
          </motion.section>
        ) : null}

        {/* Active Leagues - HUD Style Cards */}
        <motion.section variants={itemVariants} className="space-y-6">
          <SectionHeader color="bg-blue-500" title="MINHAS ARENAS" rightElement={
            <Link to="/boloes" className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
              GERENCIAR LIGAS <ChevronRight className="w-3 h-3 inline ml-1" />
            </Link>
          } />

          {loading ? (
            <div className="grid gap-4">
              <Skeleton className="h-32 w-full rounded-[40px] bg-white/5" />
              <Skeleton className="h-32 w-full rounded-[40px] bg-white/5" />
            </div>
          ) : myBoloes.length === 0 ? (
            <Link to="/boloes/criar" className="group block">
              <div className="rounded-[48px] border-2 border-dashed border-white/10 p-12 flex flex-col items-center text-center gap-8 hover:border-primary/50 hover:bg-primary/5 transition-all backdrop-blur-3xl shadow-2xl">
                <div className="w-24 h-24 rounded-[32px] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 shadow-2xl border border-primary/20">
                  <Trophy className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">CRIAR SUA LIGA</h3>
                  <p className="text-sm text-gray-500 font-medium max-w-[280px] leading-relaxed mx-auto">Chame seus amigos e comece a maior competição privarda da Copa 2026.</p>
                </div>
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-12 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl"
                >
                  INICIAR AGORA
                </motion.span>
              </div>
            </Link>
          ) : (
            <div className="grid gap-5">
              {myBoloes.map((bolao) => (
                <Link key={bolao.id} to={`/boloes/${bolao.id}`} className="group relative">
                  <div className="p-[1.5px] rounded-[40px] bg-gradient-to-br from-white/10 to-transparent group-hover:from-primary/50 transition-all duration-500 shadow-2xl">
                    <div className="bg-black/70 rounded-[39px] p-6 flex items-center justify-between group-hover:bg-black/80 transition-all backdrop-blur-3xl overflow-hidden relative">
                      {/* Interactive background pulse */}
                      {(bolao.pendingCount ?? 0) > 0 && <div className="absolute inset-0 bg-orange-500/5 animate-pulse pointer-events-none" />}

                      <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-3xl shadow-inner relative group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 border border-white/5">
                          ⚽
                          <AnimatePresence>
                            {(bolao.pendingCount ?? 0) > 0 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute -top-2 -right-2 w-7 h-7 bg-orange-500 rounded-xl text-[11px] font-black text-white flex items-center justify-center shadow-2xl border-2 border-[#0b0b0b]"
                              >
                                {bolao.pendingCount}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white tracking-tight leading-none group-hover:text-primary transition-colors">{bolao.name}</h3>
                          <div className="flex items-center gap-5 mt-2.5">
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-gray-600" />
                              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{bolao.memberCount} MEMBROS</span>
                            </div>
                            {bolao.myRank && bolao.myRank > 0 && (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                                <Crown className="w-3 h-3 text-primary" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">#{bolao.myRank} LUGAR</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 relative z-10">
                        <div className="text-right">
                          <span className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none block mb-1">{bolao.myPoints}</span>
                          <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">PONTOS</span>
                        </div>
                        <div className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:bg-primary group-hover:text-black transition-all shadow-xl">
                          <ChevronRight className="w-6 h-6 stroke-[2.5px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* Global News Section */}
        {miniNews.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-6">
            <SectionHeader color="bg-emerald-400" title="ÚLTIMAS DO FRONT" rightElement={
              <Link to="/copas/central" className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] hover:text-white transition-colors">
                CENTRAL DE NOTÍCIAS <ChevronRight className="w-3 h-3 inline ml-1" />
              </Link>
            } />

            <div className="grid gap-4">
              {miniNews.map((item) => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex gap-6 p-5 rounded-[28px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all backdrop-blur-md shadow-lg">
                  <div className="w-28 h-20 rounded-[20px] overflow-hidden shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-700 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                    <img src={item.imageUrl || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400"} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2.5">
                      <span className="text-[8px] font-black uppercase tracking-[0.25em] text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {item.category}
                      </span>
                      <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                        {new Date(item.publishedAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-100 leading-tight line-clamp-2 transition-colors group-hover:text-white tracking-tight">
                      {item.title}
                    </h3>
                  </div>
                </a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Floating Strategic CTA */}
        <motion.div
          variants={itemVariants}
          className="pt-4 sticky bottom-8 left-0 right-0"
        >
          <Link
            to="/boloes"
            className="w-full bg-white text-black font-black py-6 rounded-[28px] flex items-center justify-center gap-4 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-[11px] tracking-[0.4em] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <Dices className="w-6 h-6 stroke-[2.5px]" />
            LANÇAR PALPITES
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

/* --- Refined UI Components --- */

function StatCard({ icon, label, value, highlight = false, color = "text-white" }: { icon: React.ReactNode; label: string; value: string | number; highlight?: boolean; color?: string }) {
  return (
    <div
      className={cn(
        "p-6 rounded-[32px] border flex flex-col items-center justify-center text-center gap-3 transition-all shadow-2xl backdrop-blur-3xl group relative overflow-hidden",
        highlight
          ? "bg-primary/10 border-primary/40 shadow-primary/5"
          : "bg-white/[0.04] border-white/10 hover:border-white/20"
      )}
    >
      {highlight && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/40 group-hover:bg-primary transition-colors" />
      )}
      <div className={cn(
        "w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-6",
        highlight ? "bg-primary text-black" : "bg-white/5 text-gray-400 group-hover:text-white"
      )}>
        {icon}
      </div>
      <div className="mt-1 space-y-1">
        <span className={cn("text-3xl font-black tracking-tighter block leading-none tabular-nums", highlight ? "text-primary shadow-primary/20" : "text-white")}>{value}</span>
        <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
    </div>
  );
}

function SectionHeader({ color, title, rightElement }: { color: string; title: string; rightElement: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-2">
      <h2 className="text-sm font-black text-white flex items-center gap-4 tracking-[0.15em] uppercase">
        <div className={cn("w-2.5 h-2.5 rounded-sm rotate-45", color)} />
        {title}
      </h2>
      {rightElement}
    </div>
  );
}

export default Index;
