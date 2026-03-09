import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Plus, Users, Search, UserPlus, Trophy, ChevronRight, X, Compass, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface BolaoRow {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  invite_code: string;
  created_at: string;
  avatar_url: string;
  memberCount: number;
  isCreator: boolean;
}

interface PublicBolaoRow extends BolaoRow {
  leader_score: number;
}

const Boloes = () => {
  const { t } = useTranslation('bolao');
  const { user } = useAuth();
  const { toast } = useToast();

  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [publicBoloes, setPublicBoloes] = useState<PublicBolaoRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      // Load user's boloes
      const { data: myMemberships } = await supabase
        .from('bolao_members')
        .select('bolao_id, role')
        .eq('user_id', user.id);

      if (myMemberships && myMemberships.length > 0) {
        const bolaoIds = myMemberships.map(m => m.bolao_id);
        const { data: myBoloesData } = await supabase
          .from('boloes')
          .select('*, bolao_members(count)')
          .in('id', bolaoIds)
          .order('created_at', { ascending: false });

        if (myBoloesData) {
          const mapped = myBoloesData.map(b => ({
            id: b.id,
            name: b.name,
            description: b.description,
            creator_id: b.creator_id,
            invite_code: b.invite_code,
            created_at: b.created_at,
            avatar_url: b.avatar_url || '🏆',
            memberCount: b.bolao_members[0].count,
            isCreator: b.creator_id === user.id
          }));
          setBoloes(mapped);
        }
      } else {
        setBoloes([]);
      }

      // Load public active boloes (explore)
      const excludeIds = myMemberships?.map(m => m.bolao_id) || [];

      let publicQuery = supabase
        .from('boloes')
        .select('*, bolao_members(count)')
        .eq('category', 'public')
        .eq('status', 'active');

      if (excludeIds.length > 0) {
        // Can't easily not.in if array is huge, but it's fine for now
      }

      const { data: publicData } = await publicQuery.limit(20);

      if (publicData) {
        // Find leader score from bolao_rankings for each
        const pMapped: PublicBolaoRow[] = await Promise.all(publicData.map(async (b) => {
          // Skip if already a member
          if (excludeIds.includes(b.id)) return null;

          const { data: ranks } = await supabase
            .from('bolao_rankings')
            .select('total_points')
            .eq('bolao_id', b.id)
            .order('total_points', { ascending: false })
            .limit(1);

          return {
            id: b.id,
            name: b.name,
            description: b.description,
            creator_id: b.creator_id,
            invite_code: b.invite_code,
            created_at: b.created_at,
            avatar_url: b.avatar_url || '🏆',
            memberCount: b.bolao_members[0].count,
            isCreator: false,
            leader_score: ranks && ranks.length > 0 ? ranks[0].total_points : 0
          };
        }));
        setPublicBoloes(pMapped.filter(Boolean) as PublicBolaoRow[]);
      }

    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeJoin = async (bolaoId: string) => {
    try {
      await supabase.from('bolao_members').insert({
        bolao_id: bolaoId,
        user_id: user!.id,
        role: "member",
        payment_status: "exempt"
      });
      toast({
        title: "Sucesso!",
        description: "Você entrou na arena.",
        className: "bg-emerald-500 text-white font-black"
      });
      loadData();
    } catch (error) {
      toast({ title: "Erro ao entrar", variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const verifyAndPrepareJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);

    try {
      const { data, error } = await supabase
        .from('boloes')
        .select('id, name')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (error || !data) throw new Error("Código inválido.");

      const { data: member } = await supabase
        .from('bolao_members')
        .select('id')
        .eq('bolao_id', data.id)
        .eq('user_id', user.id);

      if (member && member.length > 0) {
        toast({ title: "Você já está neste bolão!" });
        setJoining(false);
        return;
      }

      await completeJoin(data.id);
      setJoinCode("");
      setShowJoin(false);
    } catch (error) {
      toast({ title: "Código de convite inválido ou expirado.", variant: "destructive" });
      setJoining(false);
    }
  };

  const filtered = boloes.filter(b =>
    !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myBoloes = filtered.filter(b => b.isCreator);
  const joinedBoloes = filtered.filter(b => !b.isCreator);

  return (
    <div className="px-4 py-4 pb-24 min-h-screen bg-[#050505]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-primary font-black block">Ligas</span>
          <h1 className="text-3xl font-black text-white tracking-tighter">Meus Bolões</h1>
        </div>
        <div className="flex gap-2 relative z-10">
          <button onClick={() => setShowJoin(!showJoin)} className={cn("p-3 rounded-[20px] transition-all", showJoin ? "bg-primary text-black" : "bg-white/5 border border-white/10 text-white")}>
            <UserPlus className="w-5 h-5" />
          </button>
          <Link to="/boloes/criar" className="flex items-center gap-2 px-5 py-3 rounded-[20px] bg-primary text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <Plus className="w-4 h-4" /> CRIAR
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <div className="bg-white/5 border border-white/10 p-5 rounded-[24px]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">CÓDIGO DE CONVITE</span>
              </div>
              <div className="flex gap-2">
                <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Ex: AX7T9Q" className="flex-1 px-4 py-3 rounded-[16px] bg-white/[0.03] border border-white/10 text-lg font-black uppercase placeholder:normal-case placeholder:text-gray-600 focus:border-primary/50 outline-none" />
                <button onClick={verifyAndPrepareJoin} disabled={joining || !joinCode.trim()} className="px-6 rounded-[16px] bg-primary text-black font-black text-xs uppercase disabled:opacity-50">
                  {joining ? "VERIFICANDO..." : "ENTRAR"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && boloes.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Pesquisar minhas ligas..." className="w-full pl-12 pr-4 py-4 rounded-[24px] bg-white/5 border border-white/5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-primary/30 font-medium" />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-[24px] bg-white/5" />)}
        </div>
      ) : (boloes.length === 0 && publicBoloes.length === 0) ? (
        <div className="mt-12 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-xl font-black mb-2">Nenhuma liga encontrada</h3>
          <p className="text-gray-500 text-sm">Crie a sua própria arena ou participe através de um código de convite.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {myBoloes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" /> MINHAS ARENAS (CRIADAS POR MIM)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myBoloes.map(b => (
                  <BolaoCard key={b.id} bolao={b} type="mine" />
                ))}
              </div>
            </section>
          )}

          {joinedBoloes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" /> PARTICIPANDO
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joinedBoloes.map(b => (
                  <BolaoCard key={b.id} bolao={b} type="joined" />
                ))}
              </div>
            </section>
          )}

          {publicBoloes.length > 0 && !searchQuery && (
            <section className="pt-8 border-t border-white/10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-2">
                <Compass className="w-5 h-5 text-blue-400" /> EXPLORE BOLÕES PÚBLICOS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicBoloes.map(b => (
                  <div key={b.id} className="p-5 rounded-[24px] bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{b.avatar_url}</div>
                      <div>
                        <div className="font-black truncate max-w-[150px]">{b.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">{b.memberCount} membros • LÍDER: {b.leader_score} pts</div>
                      </div>
                    </div>
                    <button onClick={() => { setJoining(true); completeJoin(b.id); }} disabled={joining} className="px-4 py-2 bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-blue-600 transition">
                      ENTRAR
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

function BolaoCard({ bolao, type }: { bolao: BolaoRow, type: 'mine' | 'joined' }) {
  return (
    <Link to={`/boloes/${bolao.id}`} className="block p-5 rounded-[24px] bg-white/[0.03] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-center gap-4 relative z-10">
        <div className={cn("w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl shrink-0 border", type === 'mine' ? "bg-primary/20 border-primary/30" : "bg-white/5 border-white/10")}>
          {bolao.avatar_url}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black truncate">{bolao.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest", type === 'mine' ? "bg-primary/20 text-primary" : "bg-white/10 text-gray-400")}>
              {type === 'mine' ? 'ADMIN' : 'MEMBRO'}
            </span>
            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
              <Users className="w-3 h-3" /> {bolao.memberCount}
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default Boloes;
