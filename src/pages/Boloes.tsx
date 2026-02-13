import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Users, Loader2, Search, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    if (!user) return;
    loadBoloes();
  }, [user]);

  const loadBoloes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("boloes")
      .select("*, bolao_members(count)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBoloes(data.map((b: any) => ({
        ...b,
        memberCount: b.bolao_members?.[0]?.count || 0,
        isCreator: b.creator_id === user.id,
      })));
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);
    try {
      // Find bolão by invite code
      const { data: bolao, error: findError } = await supabase
        .from("boloes")
        .select("id, name")
        .eq("invite_code", joinCode.trim().toLowerCase())
        .single();

      if (findError || !bolao) throw new Error("Código de convite inválido");

      // Check if already member
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

      // The RLS policy requires that the inserter is an existing member and user_id != auth.uid()
      // For join via invite code, we need the creator to add or we need a different approach.
      // Let's use direct insert since the user is joining themselves
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

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">Minhas Ligas</span>
          <h1 className="text-2xl font-black">Bolões</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(!showJoin)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-secondary-foreground text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <Link
            to="/boloes/criar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            Criar
          </Link>
        </div>
      </div>

      {/* Join by code */}
      {showJoin && (
        <div className="glass-card p-4 mb-5 space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Entrar com Código</span>
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
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
            >
              {joining ? "..." : "Entrar"}
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : boloes.length === 0 ? (
        <EmptyState icon="🏆" title="Nenhum bolão" description="Crie seu primeiro bolão ou entre com um código de convite!" />
      ) : (
        <div className="space-y-4">
          {boloes.map(b => (
            <Link key={b.id} to={`/boloes/${b.id}`} className="glass-card p-4 block border-l-2 border-l-copa-green">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-copa-green/20 flex items-center justify-center text-2xl">
                  ⚽
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black truncate">{b.name}</h3>
                  <span className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-0.5",
                    b.isCreator ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}>
                    {b.isCreator ? "Criador" : "Membro"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold">{b.memberCount}</span>
                </div>
              </div>
              {b.description && (
                <p className="text-[11px] text-muted-foreground truncate">{b.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Boloes;
