import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Compass, Loader2, Plus, Search, Trophy, UserPlus, Users } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  setDoc,
  getCountFromServer,
  documentId
} from "firebase/firestore";
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

type MembershipRow = {
  bolao_id: string;
  role: string;
};

type BolaoSelectRow = {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  invite_code: string;
  created_at: string;
  avatar_url: string | null;
  category: "public" | "private";
  status: string;
  bolao_members: { count: number }[];
};

const statusWhitelist = ["open", "active"];

function chunkValues<T>(values: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

export default function Boloes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [publicBoloes, setPublicBoloes] = useState<PublicBolaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joiningPublicBolaoId, setJoiningPublicBolaoId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicBoloesUnavailable, setPublicBoloesUnavailable] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setPublicBoloesUnavailable(false);
    let membershipIds: string[] = [];

    try {
      // 1. Get user's memberships
      const membersRef = collection(db, "bolao_members");
      const qMembers = query(membersRef, where("user_id", "==", user.id));
      const memberSnap = await getDocs(qMembers);
      
      membershipIds = memberSnap.docs.map(doc => doc.data().bolao_id);

      if (membershipIds.length > 0) {
        const boloesRef = collection(db, "boloes");
        const myBoloesDocs = await Promise.all(
          chunkValues(membershipIds, 30).map(async (membershipChunk) => {
            const qMyBoloes = query(
              boloesRef,
              where(documentId(), "in", membershipChunk)
            );
            const snapshot = await getDocs(qMyBoloes);
            return snapshot.docs;
          })
        );
        const myBoloesSnap = myBoloesDocs.flat();

        const myBoloesEnriched = await Promise.all(
          myBoloesSnap.map(async (docElem) => {
            const data = docElem.data();
            
            // Get member count
            const countQuery = query(collection(db, "bolao_members"), where("bolao_id", "==", docElem.id));
            const countSnap = await getCountFromServer(countQuery);
            
            return {
              id: docElem.id,
              name: data.name,
              description: data.description,
              creator_id: data.creator_id,
              invite_code: data.invite_code,
              created_at: data.created_at,
              avatar_url: data.avatar_url,
              category: data.category,
              status: data.status,
              memberCount: countSnap.data().count,
              isCreator: data.creator_id === user.id,
            } as BolaoRow;
          })
        );
        
        // Sort by created_at (since we manually enriched, orderBy in query isn't enough for the final list if we want to preserve order)
        setBoloes(myBoloesEnriched.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } else {
        setBoloes([]);
      }
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

    try {
      // Busca pública separada para não derrubar a tela inteira
      // nem depender de índice composto para category + status + created_at.
      const publicBoloesQuery = query(
        collection(db, "boloes"),
        where("category", "==", "public"),
        orderBy("created_at", "desc"),
        limit(20)
      );

      const publicSnap = await getDocs(publicBoloesQuery);
      const filteredPublicData = publicSnap.docs.filter((docSnapshot) => {
        const data = docSnapshot.data();
        return !membershipIds.includes(docSnapshot.id) && statusWhitelist.includes(data.status);
      });

      const enrichedPublic = await Promise.all(
        filteredPublicData.map(async (docElem) => {
          const b = docElem.data();

          const countQuery = query(collection(db, "bolao_members"), where("bolao_id", "==", docElem.id));
          const countSnap = await getCountFromServer(countQuery);

          let leaderScore = 0;
          try {
            const rankingQuery = query(
              collection(db, "bolao_rankings"),
              where("bolao_id", "==", docElem.id),
              orderBy("total_points", "desc"),
              limit(1)
            );
            const rankingSnap = await getDocs(rankingQuery);
            leaderScore = rankingSnap.docs[0]?.data()?.total_points ?? 0;
          } catch (rankingError) {
            console.error("Erro ao carregar ranking público do bolão:", rankingError);
          }

          return {
            id: docElem.id,
            name: b.name,
            description: b.description,
            creator_id: b.creator_id,
            invite_code: b.invite_code,
            created_at: b.created_at,
            avatar_url: b.avatar_url,
            category: b.category,
            status: b.status,
            memberCount: countSnap.data().count,
            isCreator: false,
            leader_score: leaderScore,
          } as PublicBolaoRow;
        })
      );

      setPublicBoloes(enrichedPublic);
    } catch (error) {
      console.error("Erro ao carregar bolões públicos:", error);
      setPublicBoloes([]);
      setPublicBoloesUnavailable(true);
    }
  }, [toast, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const completeJoin = async (bolaoId: string) => {
    if (!user) return;
    try {
      const memberId = `${user.id}_${bolaoId}`;
      await setDoc(doc(db, "bolao_members", memberId), {
        bolao_id: bolaoId,
        user_id: user.id,
        role: "member",
        payment_status: "exempt",
        created_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
      });

      toast({
        title: "Você entrou na arena.",
        description: "Agora é só palpitar e subir no ranking.",
        className: "bg-emerald-500 text-white font-black",
      });

      await loadData();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("duplicate")) {
        console.error("Error joining bolao:", error);
        toast({
          title: "Erro ao entrar no bolão.",
          description: "Confere o código e tenta de novo.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const verifyAndPrepareJoin = async () => {
    if (!user || !joinCode.trim()) return;
    setJoining(true);

    try {
      const normalizedCode = joinCode.trim().toUpperCase();
      
      const q = query(collection(db, "boloes"), where("invite_code", "==", normalizedCode), limit(1));
      const querySnap = await getDocs(q);

      if (querySnap.empty) throw new Error("Código inválido.");
      
      const bolaoDoc = querySnap.docs[0];
      const bolaoData = bolaoDoc.data();

      if (!statusWhitelist.includes(bolaoData.status)) {
        throw new Error("Este bolão não está disponível para entrada.");
      }

      // Check if already a member
      const memberId = `${user.id}_${bolaoDoc.id}`;
      const memberSnap = await getDoc(doc(db, "bolao_members", memberId));

      if (memberSnap.exists()) {
        toast({ title: "Você já está neste bolão." });
        setJoining(false);
        return;
      }

      await completeJoin(bolaoDoc.id);
      setJoinCode("");
      setShowJoin(false);
    } catch (error) {
      toast({
        title: "Não consegui entrar com esse código.",
        description: error instanceof Error ? error.message : "Código inválido ou expirado.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

  const handleJoinPublicBolao = async (bolaoId: string) => {
    setJoiningPublicBolaoId(bolaoId);
    try {
      const joined = await completeJoin(bolaoId);
      if (joined) {
        navigate(`/boloes/${bolaoId}`);
      }
    } finally {
      setJoiningPublicBolaoId(null);
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

      <div className="surface-card mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">Entrada rápida</p>
            <h2 className="mt-1 text-lg font-black">Entrar com código</h2>
          </div>
          <button
            onClick={() => setShowJoin((prev) => !prev)}
            className="surface-chip rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
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
              className="surface-input flex-1 rounded-2xl px-4 py-3 text-lg font-black uppercase"
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
            className="surface-input w-full rounded-3xl py-4 pl-12 pr-4 text-sm"
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
                  <article
                    key={b.id}
                    className="surface-card-hover p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-2xl text-xl">
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                        <span>{b.memberCount} membros</span>
                        <span>•</span>
                        <span>Líder: {b.leader_score} pts</span>
                      </div>

                      <button
                        onClick={() => void handleJoinPublicBolao(b.id)}
                        disabled={joiningPublicBolaoId === b.id}
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                      >
                        {joiningPublicBolaoId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        {joiningPublicBolaoId === b.id ? "Entrando..." : "Entrar agora"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {publicBoloesUnavailable && !searchQuery && (
            <section>
              <div className="surface-card-soft p-5 text-sm text-zinc-300">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                  Explorar bolões públicos indisponível no momento
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  Suas arenas continuam funcionando normalmente. Tente novamente em alguns instantes.
                </p>
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
      className="surface-card-hover p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="surface-card-soft flex h-12 w-12 items-center justify-center rounded-2xl text-xl">
            {bolao.avatar_url || "⚽"}
          </div>
          <div>
            <h3 className="text-lg font-black">{bolao.name}</h3>
            <p className="text-sm text-zinc-400">{bolao.description || "Sem descrição."}</p>
          </div>
        </div>
        <div className="surface-chip rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
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
