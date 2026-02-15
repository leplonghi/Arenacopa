import { Link } from "react-router-dom";
import { Flag } from "@/components/Flag";
import { getTeam, matches, formatMatchTime, formatMatchDate, type Match } from "@/data/mockData";
import { Users, Trophy, TrendingUp, ChevronRight, Calendar, AlertTriangle, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchDetailsModal } from "@/components/copa/MatchDetailsModal";
import { useTranslation } from "react-i18next";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface MyBolaoData {
  id: string;
  name: string;
  memberCount: number;
  myPoints?: number;
  myRank?: number;
  pendingCount?: number;
}

interface MiniNewsItem {
  id: string;
  title: string;
  category: string;
  time: string;
  image: string;
  url: string;
}

const Index = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation('home');

  // Favorite team from profile or localStorage
  const [favoriteTeamCode, setFavoriteTeamCode] = useState<string>(() => {
    return localStorage.getItem("favorite_team") || "BRA";
  });
  const favoriteTeam = getTeam(favoriteTeamCode);

  const [myBoloes, setMyBoloes] = useState<MyBolaoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; avatar?: string } | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [miniNews, setMiniNews] = useState<MiniNewsItem[]>([]);

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

        // Fetch profile + favorite team
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("user_id", user.id)
          .single() as { data: any };

        if (profileData) {
          setProfile({ name: profileData.name, avatar: profileData.avatar_url });
        }

        // Fetch boloes
        const { data: membersData } = await supabase
          .from("bolao_members")
          .select(`
            bolao_id,
            bolao:boloes (
              id,
              name,
              bolao_members (count)
            )
          `)
          .eq("user_id", user.id);

        if (membersData) {
          const boloesWithPoints = await Promise.all(membersData.map(async (item: { bolao: { id: string; name: string; bolao_members: { count: number }[] } }) => {
            const { data: palpites } = await supabase
              .from("bolao_palpites")
              .select("*")
              .eq("bolao_id", item.bolao.id)
              .eq("user_id", user.id);

            const totalPoints = (palpites as unknown as { points: number }[])?.reduce((sum, p) => sum + (p.points || 0), 0) || 0;

            // Count pending (matches without palpites)
            const palpiteMatchIds = new Set((palpites || []).map((p: { match_id: string }) => p.match_id));
            const scheduledMatches = matches.filter(m => m.status === "scheduled");
            const pendingCount = scheduledMatches.filter(m => !palpiteMatchIds.has(m.id)).length;

            return {
              id: item.bolao.id,
              name: item.bolao.name,
              memberCount: item.bolao.bolao_members?.[0]?.count || 0,
              myPoints: totalPoints,
              myRank: 0,
              pendingCount,
            };
          }));

          setMyBoloes(boloesWithPoints);
        }

        // Fetch 3 news max
        const { data: newsData } = await supabase
          .from('news')
          .select('id, title, category, published_at, image_url, url')
          .order('published_at', { ascending: false })
          .limit(3);

        if (newsData) {
          setMiniNews(newsData.map((item: { id: string; title: string; category: string; published_at: string; image_url: string; url: string }) => ({
            id: item.id,
            title: item.title,
            category: item.category || t('highlights.general'),
            time: new Date(item.published_at).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' }),
            image: item.image_url || "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400",
            url: item.url || "#",
          })));
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Next match for favorite team only
  const nextFavMatch = useMemo(() =>
    matches.find(
      m => (m.homeTeam === favoriteTeamCode || m.awayTeam === favoriteTeamCode) && m.status !== "finished"
    ), [favoriteTeamCode]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "Torcedor";
  const totalPoints = myBoloes.reduce((acc, curr) => acc + (curr.myPoints || 0), 0);
  const bestRank = myBoloes.length > 0 ? Math.min(...myBoloes.map(b => b.myRank || 999).filter(r => r > 0)) : 999;

  // Centro de Pendências
  const totalPending = myBoloes.reduce((acc, curr) => acc + (curr.pendingCount || 0), 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-4 py-4 space-y-5 pb-20 relative min-h-screen"
    >
      {/* Background Field */}
      <div className="fixed inset-0 -z-50 pointer-events-none opacity-[0.03]">
        <img
          src="https://images.unsplash.com/photo-1522770179533-24471fcdba45?w=1200&q=80"
          alt="Background"
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <MatchDetailsModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />

      {/* Header & Welcome */}
      <motion.div variants={itemVariants}>
        <p className="text-xs text-muted-foreground font-medium mb-0">{t('welcome')}</p>
        <h1 className="text-xl font-black tracking-tight leading-tight">{displayName}</h1>
      </motion.div>

      {/* 🔥 Centro de Pendências (conditional) */}
      {totalPending > 0 && (
        <motion.div variants={itemVariants}>
          <Link to="/boloes" className="block">
            <div className="glass-card p-3.5 border-l-4 border-l-orange-500 flex items-center gap-3 hover:bg-orange-500/5 transition-colors">
              <div className="w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{t('pending.title', { count: totalPending })}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t('pending.subtitle')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* Quick Stats Dashboard */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <div className="glass-card p-2 flex flex-col items-center justify-center text-center gap-0.5">
          <Trophy className="w-4 h-4 text-yellow-500 mb-0.5" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('stats.rank')}</span>
          <span className="text-base font-black">{bestRank === 999 ? "-" : `${bestRank}º`}</span>
        </div>
        <div className="glass-card p-2 flex flex-col items-center justify-center text-center gap-0.5 border-primary/30 bg-primary/5">
          <TrendingUp className="w-4 h-4 text-primary mb-0.5" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('stats.points')}</span>
          <span className="text-base font-black text-primary">{totalPoints}</span>
        </div>
        <div className="glass-card p-2 flex flex-col items-center justify-center text-center gap-0.5">
          <Users className="w-4 h-4 text-blue-400 mb-0.5" />
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{t('stats.pools')}</span>
          <span className="text-base font-black">{myBoloes.length}</span>
        </div>
      </motion.div>

      {/* My Team Spotlight (uses configurable favorite) */}
      {favoriteTeam && (
        <motion.section variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-primary block" />
              {t('my_team.title')}
            </h2>
            <Link to="/copa/grupos" className="text-[10px] text-primary font-bold hover:underline">
              {t('my_team.view_group')}
            </Link>
          </div>

          <div className="glass-card p-0 overflow-hidden relative group user-select-none">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Flag code={favoriteTeam.code} size="lg" className="w-20 h-20 rotate-12" />
            </div>

            <div className="p-3 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                  <Flag code={favoriteTeam.code} size="md" className="w-12 h-12 object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-none mb-0.5">{favoriteTeam.name}</h3>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/50 px-1.5 py-0.5 rounded-md">
                    {t('my_team.group', { group: favoriteTeam.group })}
                  </span>
                </div>
              </div>

              {nextFavMatch ? (
                <div className="text-right cursor-pointer" onClick={() => setSelectedMatch(nextFavMatch)}>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">{t('my_team.next_match')}</span>
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] font-black bg-secondary px-1.5 py-0.5 rounded text-primary">
                      {(() => {
                        const date = new Date(nextFavMatch.date);
                        const today = new Date();
                        const isToday = date.toDateString() === today.toDateString();
                        return isToday ? formatMatchTime(nextFavMatch.date, i18n.language) : formatMatchDate(nextFavMatch.date, i18n.language);
                      })()}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-muted-foreground">vs</span>
                      <Flag code={nextFavMatch.homeTeam === favoriteTeam.code ? nextFavMatch.awayTeam : nextFavMatch.homeTeam} size="sm" className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground">{t('my_team.no_matches')}</span>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* My Boloes List */}
      <motion.section variants={itemVariants} className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black flex items-center gap-1.5">
            <span className="w-1 h-3 rounded-full bg-blue-500 block" />
            {t('my_pools.title')}
          </h2>
          <Link to="/boloes" className="text-[10px] text-primary font-bold hover:underline">
            {t('my_pools.manage')}
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : myBoloes.length === 0 ? (
          <Link to="/boloes/criar" className="group">
            <div className="glass-card p-6 border-dashed border-2 flex flex-col items-center justify-center gap-3 hover:bg-secondary/50 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-sm">{t('my_pools.join_title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('my_pools.join_desc')}</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-4 py-2 rounded-full mt-2">
                {t('my_pools.start_now')}
              </span>
            </div>
          </Link>
        ) : (
          <div className="grid gap-3">
            {myBoloes.map((bolao) => (
              <Link
                key={bolao.id}
                to={`/boloes/${bolao.id}`}
                className="glass-card p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-lg shadow-sm relative">
                    🏆
                    {(bolao.pendingCount ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                        {bolao.pendingCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black group-hover:text-primary transition-colors">{bolao.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> {bolao.memberCount}
                      </span>
                      {bolao.myRank && bolao.myRank > 0 && (
                        <span className="text-[10px] font-bold text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                          {t('my_pools.rank_place', { rank: bolao.myRank })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <span className="text-sm font-black block">{bolao.myPoints} <span className="text-[10px] font-medium text-muted-foreground">pts</span></span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.section>

      {/* Mini News (max 3, personalized) */}
      {miniNews.length > 0 && (
        <motion.section variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black flex items-center gap-1.5">
              <span className="w-1 h-3 rounded-full bg-copa-green-light block" />
              {t('highlights.title')}
            </h2>
            <Link to="/copa" className="text-[10px] text-muted-foreground font-bold hover:text-primary transition-colors">
              {t('highlights.view_all')}
            </Link>
          </div>

          <div className="space-y-2">
            {miniNews.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[8px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span className="text-[8px] text-muted-foreground">{item.time}</span>
                  </div>
                  <h3 className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </motion.section>
      )}

      {/* CTA Palpites */}
      <motion.div variants={itemVariants} className="pt-2">
        <Link
          to="/boloes"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          <Dices className="w-4 h-4" />
          {t('cta_predict')}
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default Index;
