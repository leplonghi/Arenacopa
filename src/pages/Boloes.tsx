import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Users, Search, UserPlus, Trophy, ChevronRight, X } from "lucide-react";
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
  memberCount: number;
  isCreator: boolean;
}

const Boloes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    loadBoloes();
  }, [user]);

  const loadBoloes = async () => {
    if (!user) return;
    // ✅ Fixed: only load bolões where the user is a member (via bolao_members join)
    const { data, error } = await supabase
      .from("bolao_members")
      .select("bolao_id, role, boloes(*, bolao_members(count))")
      .eq("user_id", user.id)
      .order("created_at", { referencedTable: "boloes", ascending: false });

    if (!error && data) {
      setBoloes((data as any[]).map((m) => ({
        ...m.boloes,
        memberCount: m.boloes?.bolao_members?.[0]?.count || 0,
        isCreator: m.boloes?.creator_id === user.id,
      })).filter(Boolean));
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      const { data: bolao, error: findError } = await supabase
        .from("boloes")
        .select("id, name")
        .eq("invite_code", joinCode.trim().toLowerCase())
        .single();

      if (findError || !bolao) throw new Error("Código de convite inválido");

      const { data: existing } = await supabase
        .from("bolao_members")
        .select("id")
        .eq("bolao_id", bolao.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        toast({ title: "Você já participa deste bolão!", description: bolao.name });
        setJoinCode("");
        setShowJoin(false);
        return;
      }

      const { error: joinError } = await supabase
        .from("bolao_members")
        .insert({ bolao_id: bolao.id, user_id: user.id, role: "member" });

      if (joinError) throw joinError;

      toast({ title: "Entrou no bolão! 🎉", description: bolao.name });
      setJoinCode("");
      setShowJoin(false);
      loadBoloes();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const filtered = boloes.filter(b =>
    !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myBoloes = filtered.filter(b => b.isCreator);
  const joinedBoloes = filtered.filter(b => !b.isCreator);

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">Minhas Ligas</span>
          <h1 className="text-2xl font-black">Bolões</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(!showJoin)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-colors",
              showJoin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <Link
            to="/boloes/criar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Criar
          </Link>
        </div>
      </div>

      {/* Join by code */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Entrar com Código</span>
                <button onClick={() => setShowJoin(false)} className="p-1 rounded-md bg-secondary"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value)}
                  placeholder="Cole o código de convite"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleJoin}
                  disabled={joining || !joinCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                >
                  {joining ? "..." : "Entrar"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search (when has bolões) */}
      {!loading && boloes.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar bolão..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/60 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : boloes.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon="🏆" title="Nenhum bolão" description="Crie seu primeiro bolão ou entre com um código de convite!" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Created by me */}
          {myBoloes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Meus Bolões
              </h3>
              <div className="space-y-2">
                {myBoloes.map(b => (
                  <BolaoCard key={b.id} bolao={b} />
                ))}
              </div>
            </section>
          )}

          {/* Joined */}
          {joinedBoloes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Participando
              </h3>
              <div className="space-y-2">
                {joinedBoloes.map(b => (
                  <BolaoCard key={b.id} bolao={b} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && searchQuery && (
            <EmptyState icon="🔍" title="Nenhum resultado" description={`Nenhum bolão encontrado para "${searchQuery}"`} />
          )}
        </div>
      )}
    </div>
  );
};

function BolaoCard({ bolao }: { bolao: BolaoRow }) {
  return (
    <Link to={`/boloes/${bolao.id}`} className="glass-card-hover p-4 block">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
          bolao.isCreator ? "bg-primary/20" : "bg-secondary"
        )}>
          ⚽
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black truncate">{bolao.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
              bolao.isCreator ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {bolao.isCreator ? "Admin" : "Membro"}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> {bolao.memberCount}
            </span>
          </div>
          {bolao.description && (
            <p className="text-[10px] text-muted-foreground truncate mt-1">{bolao.description}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
}

export default Boloes;
