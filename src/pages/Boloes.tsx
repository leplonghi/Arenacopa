import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, Loader2, Plus, Search, Trophy, UserPlus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

type BolaoRow = {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  invite_code: string;
  created_at: string;
  avatar_url?: string | null;
  category?: "public" | "private";
  status?: string;
  memberCount: number;
  isCreator: boolean;
};

type PublicBolaoRow = BolaoRow & {
  leader_score: number;
};

const statusWhitelist = ["open", "active"];

export default function Boloes() {
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
    setLoading(true);

    try {
      const { data: myMemberships, error: membershipError } = await supabase
        .from("bolao_members")
        .select("bolao_id, role")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      const membershipIds = (myMemberships || []).map((m: any) => m.bolao_id);

      if (membershipIds.length) {
        const { data: myBoloesData, error: myBoloesError } = await supabase
          .from("boloes")
          .select("id, name, description, creator_id, invite_code, created_at, avatar_url, category, status, bolao_members(count)")
          .in("id", membershipIds)
          .order("created_at", { ascending: false });

        if (myBoloesError) throw myBoloesError;

        setBoloes(
          (myBoloesData || []).map((b: any) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            creator_id: b.creator_id,
            invite_code: b.invite_code,
            created_at: b.created_at,
            avatar_url: b.avatar_url,
            category: b.category,
            status: b.status,
            memberCount: b.bolao_members?.[0]?.count ?? 0,
            isCreator: b.creator_id === user.id,
          }))
        );
      } else {
        setBoloes([]);
      }

      const { data: publicData, error: publicError } = await supabase
        .from("boloes")
        .select("id, name, description, creator_id, invite_code, created_at, avatar_url, category, status, bolao_members(count)")
        .eq("category", "public")
        .in("status", statusWhitelist)
        .order("created_at", { ascending: false })
        .limit(20);

      if (publicError) throw publicError;

      const filteredPublic = (publicData || []).filter((b: any) => !membershipIds.includes(b.id));

      const enriched = await Promise.all(
        filteredPublic.map(async (b: any) => {
          const { data: ranks } = await supabase
            .from("bolao_rankings")
            .select("total_points")
            .eq("bolao_id", b.id)
            .order("total_points", { ascending: false })
            .limit(1);

          return {
            id: b.id,
            name: b.name,
            description: b.description,
            creator_id: b.creator_id,
            invite_code: b.invite_code,
            created_at: b.created_at,
            avatar_url: b.avatar_url,
            category: b.category,
            status: b.status,
            memberCount: b.bolao_members?.[0]?.count ?? 0,
            isCreator: false,
            leader_score: ranks?.[0]?.total_points ?? 0,
          } satisfies PublicBolaoRow;
        })
      );

      setPublicBoloes(enriched);
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível carregar seus bolões.",
        description: "Tenta novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeJoin = async (bolaoId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("bolao_members").insert({
        bolao_id: bolaoId,
        user_id: user.id,
        role: "member",
        payment_status: "exempt",
      });

      if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
        throw error;
      }

      toast({
        title: "Você entrou na arena.",
        description: "Agora é só palpitar e subir no ranking.",
        className: "bg-emerald-500 text-white font-black",
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Erro ao entrar no bolão.",
        description: "Confere o código e tenta de novo.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const verifyAndPrepareJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);

    try {
      const normalizedCode = joinCode.trim().toUpperCase();
      const { data, error } = await supabase
        .from("boloes")
        .select("id, name, status")
        .eq("invite_code", normalizedCode)
        .single();

      if (error || !data) throw new Error("Código inválido.");
      if (!statusWhitelist.includes(data.status)) {
        throw new Error("Este bolão não está disponível para entrada.");
      }

      const { data: member } = await supabase
        .from("bolao_members")
        .select("id")
        .eq("bolao_id", data.id)
        .eq("user_id", user.id);

      if (member?.length) {
        toast({ title: "Você já está neste bolão." });
        setJoining(false);
        return;
      }

      await completeJoin(data.id);
      setJoinCode("");
      setShowJoin(false);
    } catch (error: any) {
      toast({
        title: "Não consegui entrar com esse código.",
        description: error?.message || "Código inválido ou expirado.",
        variant: "destructive",
      });
      setJoining(false);
    }
  };

  const filtered = useMemo(
    () => boloes.filter((b) => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [boloes, searchQuery]
  );

  const myBoloes = filtered.filter((b) => b.isCreator);
  const joinedBoloes = filtered.filter((b) => !b.isCreator);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 text-white">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Ligas</p>
          <h1 className="mt-1 text-3xl font-black">Bolões</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Crie sua arena, entre por convite ou explore ligas públicas sem bagunçar o fluxo principal.
          </p>
        </div>

        <Link
          to="/boloes/criar"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
        >
          <Plus className="h-4 w-4" />
          Criar bolão
        </Link>
      </div>

      <div className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Entrada rápida</p>
            <h2 className="mt-1 text-lg font-black">Entrar com código</h2>
          </div>
          <button
            onClick={() => setShowJoin((prev) => !prev)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
          >
            {showJoin ? "Fechar" : "Usar convite"}
          </button>
        </div>

        {showJoin && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex: AX7T9Q"
              className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-lg font-black uppercase outline-none"
            />
            <button
              onClick={verifyAndPrepareJoin}
              disabled={joining || !joinCode.trim()}
              className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {joining ? "Entrando..." : "Entrar no bolão"}
            </button>
          </div>
        )}
      </div>

      {!loading && boloes.length > 0 && (
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar minhas ligas..."
            className="w-full rounded-3xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-sm outline-none"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl bg-white/10" />
          ))}
        </div>
      ) : boloes.length === 0 && publicBoloes.length === 0 ? (
        <EmptyState
          title="Nenhuma liga encontrada"
          description="Crie sua própria arena ou participe usando um código de convite."
        />
      ) : (
        <div className="space-y-8">
          {myBoloes.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">Minhas arenas</h2>
              </div>
              <div className="grid gap-4">
                {myBoloes.map((b) => (
                  <BolaoCard key={b.id} bolao={b} href={`/boloes/${b.id}`} />
                ))}
              </div>
            </section>
          )}

          {joinedBoloes.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">Participando</h2>
              </div>
              <div className="grid gap-4">
                {joinedBoloes.map((b) => (
                  <BolaoCard key={b.id} bolao={b} href={`/boloes/${b.id}`} />
                ))}
              </div>
            </section>
          )}

          {publicBoloes.length > 0 && !searchQuery && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">Explorar bolões públicos</h2>
              </div>
              <div className="grid gap-4">
                {publicBoloes.map((b) => (
                  <Link
                    key={b.id}
                    to={`/boloes/${b.id}`}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xl">
                            {b.avatar_url || "🏆"}
                          </div>
                          <div>
                            <h3 className="text-lg font-black">{b.name}</h3>
                            <p className="text-sm text-zinc-400">{b.description || "Sem descrição."}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                        Público
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-300">
                      <span>{b.memberCount} membros</span>
                      <span>•</span>
                      <span>Líder: {b.leader_score} pts</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BolaoCard({ bolao, href }: { bolao: BolaoRow; href: string }) {
  return (
    <Link
      to={href}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-xl">
            {bolao.avatar_url || "⚽"}
          </div>
          <div>
            <h3 className="text-lg font-black">{bolao.name}</h3>
            <p className="text-sm text-zinc-400">{bolao.description || "Sem descrição."}</p>
          </div>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
          {bolao.category === "public" ? "Público" : "Privado"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-300">
        <span>{bolao.memberCount} membros</span>
        <span>•</span>
        <span>Código: {bolao.invite_code}</span>
      </div>
    </Link>
  );
}
