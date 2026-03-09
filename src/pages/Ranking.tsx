import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Medal, Trophy, Users, ChevronRight, Loader2, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flag } from "@/components/Flag";
import { Skeleton } from "@/components/ui/skeleton";

interface BolaoRankEntry {
  bolaoId: string;
  bolaoName: string;
  myPosition: number | null;
  totalMembers: number;
  myPoints: number;
}

interface TopBolao {
  id: string;
  name: string;
  memberCount: number;
  description: string | null;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

// Medal display for top 3
function PodiumMedal({ position }: { position: number }) {
  if (position === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (position === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (position === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-xs font-black text-muted-foreground w-5 text-center">#{position}</span>;
}

function BolaoRankCard({ bolao }: { bolao: BolaoRankEntry }) {
  return (
    <Link
      to={`/boloes/${bolao.bolaoId}`}
      className="glass-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="w-10 h-10 rounded-xl bg-copa-green/15 flex items-center justify-center shrink-0">
        <Trophy className="w-5 h-5 text-copa-green-light" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-black block truncate">{bolao.bolaoName}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{bolao.totalMembers} membros</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        {bolao.myPosition !== null ? (
          <>
            <div className="flex items-center justify-end gap-1 mb-0.5">
              <PodiumMedal position={bolao.myPosition} />
              <span className="text-sm font-black">{bolao.myPosition}º</span>
            </div>
            <span className="text-[10px] text-primary font-bold">{bolao.myPoints} pts</span>
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground">Sem palpites</span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
    </Link>
  );
}

const Ranking = () => {
  const { user } = useAuth();
  const [myBoloes, setMyBoloes] = useState<BolaoRankEntry[]>([]);
  const [topBoloes, setTopBoloes] = useState<TopBolao[]>([]);
  const [profile, setProfile] = useState<{ name: string; favorite_team: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalBoloes, setTotalBoloes] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      try {
        // Load user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, favorite_team")
          .eq("user_id", user!.id)
          .single();

        if (profileData) setProfile(profileData as { name: string; favorite_team: string | null });

        // Load bolões the user is in
        const { data: memberData } = await supabase
          .from("bolao_members")
          .select("bolao_id, boloes(id, name, bolao_members(count))")
          .eq("user_id", user!.id);

        if (memberData) {
          setTotalBoloes(memberData.length);
          const entries: BolaoRankEntry[] = (memberData as any[]).map((m) => ({
            bolaoId: m.bolao_id,
            bolaoName: m.boloes?.name || "Bolão",
            myPosition: null, // Will need scoring engine to calculate
            totalMembers: m.boloes?.bolao_members?.[0]?.count || 0,
            myPoints: 0,
          }));
          setMyBoloes(entries);
        }

        // Load top public bolões by member count
        const { data: topData } = await supabase
          .from("boloes")
          .select("id, name, description, bolao_members(count)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (topData) {
          setTopBoloes(
            (topData as any[]).map((b) => ({
              id: b.id,
              name: b.name,
              memberCount: b.bolao_members?.[0]?.count || 0,
              description: b.description,
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "Jogador";

  return (
    <div className="px-4 py-4 space-y-6 pb-6">
      {/* Header */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible" custom={0}>
        <p className="text-xs text-muted-foreground">Sua posição</p>
        <h1 className="text-xl font-black">Ranking 🏅</h1>
      </motion.div>

      {/* My stats card */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={1}>
        <div className="rounded-2xl bg-gradient-to-br from-copa-green/20 via-secondary to-background border border-copa-green/20 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 text-6xl opacity-5 leading-none select-none mt-2 mr-2">🏆</div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-copa-green to-copa-green-light flex items-center justify-center text-xl font-black border-2 border-copa-green/30">
              {profile?.favorite_team ? (
                <Flag code={profile.favorite_team} size="lg" />
              ) : (
                displayName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-base font-black">{displayName}</h2>
              {loading ? (
                <Skeleton className="h-3 w-28 mt-1" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  {totalBoloes === 0 ? "Nenhum bolão ainda" : `Participando de ${totalBoloes} bolão${totalBoloes !== 1 ? "es" : ""}`}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Bolões", value: loading ? "…" : String(totalBoloes), icon: "🏆" },
              { label: "Palpites", value: "—", icon: "🎯" },
              { label: "Pontos", value: "—", icon: "⭐" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background/40 rounded-xl p-3 text-center">
                <span className="text-lg">{stat.icon}</span>
                <span className="text-xl font-black block mt-0.5">{stat.value}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Global Ranking — Coming Soon */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={2}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-black">Ranking Global</h2>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-copa-gold/20 text-copa-gold px-2.5 py-1 rounded-full border border-copa-gold/30">
            Em Breve
          </span>
        </div>

        <div className="glass-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-copa-gold/15 border border-copa-gold/30 flex items-center justify-center mx-auto">
            <Crown className="w-8 h-8 text-copa-gold" />
          </div>
          <div>
            <h3 className="text-sm font-black">Ranking entre todos os jogadores</h3>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
              Em breve você poderá ver sua posição global entre todos os usuários do ArenaCopa, com filtros semanais, mensais e gerais.
            </p>
          </div>

          {/* Preview of how it will look */}
          <div className="space-y-2 opacity-50 pointer-events-none select-none">
            {[
              { pos: 1, name: "Palpiteiro Pro", pts: 347, flag: "🇧🇷" },
              { pos: 2, name: "Craques FC", pts: 298, flag: "🇦🇷" },
              { pos: 3, name: "Bolada 2026", pts: 275, flag: "🇩🇪" },
            ].map((p) => (
              <div key={p.pos} className="flex items-center gap-3 py-2 px-3 bg-secondary/50 rounded-xl">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                  p.pos === 1 ? "bg-yellow-400/20 text-yellow-400" :
                  p.pos === 2 ? "bg-slate-300/20 text-slate-300" :
                  "bg-amber-600/20 text-amber-600"
                )}>
                  {p.pos}
                </div>
                <span className="text-lg">{p.flag}</span>
                <span className="text-xs font-bold flex-1">{p.name}</span>
                <span className="text-xs font-black text-primary">{p.pts} pts</span>
              </div>
            ))}
          </div>

          <p className="text-[9px] text-muted-foreground">
            Disponível quando a Copa começar · 11/06/2026
          </p>
        </div>
      </motion.section>

      {/* Meus Bolões — Minha Posição */}
      <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={3}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <h2 className="text-base font-black">Meus Bolões</h2>
          </div>
          <Link to="/boloes" className="text-xs text-primary font-semibold">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : myBoloes.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <span className="text-2xl mb-2 block">🎯</span>
            <p className="text-sm font-bold">Nenhum bolão ainda</p>
            <p className="text-[11px] text-muted-foreground mt-1">Crie ou entre em um bolão para ver seu ranking</p>
            <Link
              to="/boloes/criar"
              className="inline-block mt-3 text-xs font-black text-primary border border-primary/30 px-4 py-2 rounded-xl"
            >
              Criar bolão
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myBoloes.map((bolao) => (
              <BolaoRankCard key={bolao.bolaoId} bolao={bolao} />
            ))}
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Pontuação detalhada disponível dentro de cada bolão
            </p>
          </div>
        )}
      </motion.section>

      {/* Bolões em Destaque */}
      {topBoloes.length > 0 && (
        <motion.section variants={sectionVariants} initial="hidden" animate="visible" custom={4}>
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-base font-black">Bolões em Destaque</h2>
          </div>
          <div className="space-y-2.5">
            {topBoloes.map((bolao, i) => (
              <Link
                key={bolao.id}
                to={`/boloes/${bolao.id}`}
                className="glass-card p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                  i === 0 ? "bg-yellow-400/20 text-yellow-400" :
                  i === 1 ? "bg-slate-300/20 text-slate-300" :
                  i === 2 ? "bg-amber-600/20 text-amber-600" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black truncate block">{bolao.name}</span>
                  {bolao.description && (
                    <span className="text-[10px] text-muted-foreground truncate block">{bolao.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{bolao.memberCount}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default Ranking;
