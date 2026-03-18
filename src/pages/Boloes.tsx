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
import { useTranslation } from "react-i18next";

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
  const { user, session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation('bolao');

  const [boloes, setBoloes] = useState<BolaoRow[]>([]);
  const [publicBoloes, setPublicBoloes] = useState<PublicBolaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joiningPublicBolaoId, setJoiningPublicBolaoId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicBoloesUnavailable, setPublicBoloesUnavailable] = useState(false);
  const isDemoMode = localStorage.getItem("demo_mode") === "true";

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setPublicBoloesUnavailable(false);

    if (isDemoMode || !session) {
      setBoloes([
        {
          id: "demo-bolao-1",
          name: t("page.demo_1_name"),
          description: t("page.demo_1_desc"),
          creator_id: user.id,
          invite_code: "DEMO26",
          created_at: new Date().toISOString(),
          avatar_url: null,
          category: "private",
          status: "active",
          memberCount: 12,
          isCreator: true,
        },
        {
          id: "demo-bolao-2",
          name: t("page.demo_2_name"),
          description: t("page.demo_2_desc"),
          creator_id: "demo-friend",
          invite_code: "ARENA7",
          created_at: new Date(Date.now() - 86_400_000).toISOString(),
          avatar_url: null,
          category: "public",
          status: "open",
          memberCount: 27,
          isCreator: false,
        },
      ]);
      setPublicBoloes([]);
      setLoading(false);
      return;
    }

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
        title: t('page.load_error_title'),
        description: t('page.load_error_desc'),
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
  }, [isDemoMode, session, t, toast, user]);

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
        title: t('page.join_success_title'),
        description: t('page.join_success_desc'),
        className: "bg-emerald-500 text-white font-black",
      });

      await loadData();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.toLowerCase().includes("duplicate")) {
        console.error("Error joining bolao:", error);
        toast({
          title: t('page.join_error_title'),
          description: t('page.join_error_desc'),
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
        toast({ title: t('page.already_joined') });
        setJoining(false);
        return;
      }

      await completeJoin(bolaoDoc.id);
      setJoinCode("");
      setShowJoin(false);
    } catch (error) {
      toast({
        title: t('page.invalid_code_title'),
        description: error instanceof Error ? error.message : t('page.invalid_code_desc'),
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
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{t('page.kicker')}</p>
          <h1 className="mt-1 text-3xl font-black">{t('page.kicker')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {t('page.description')}
          </p>
        </div>

        <Link
          to="/boloes/criar"
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
        >
          <Plus className="h-4 w-4" />
          {t('page.create')}
        </Link>
      </div>

      <div className="surface-card mb-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-400">{t('page.quick_join_kicker')}</p>
            <h2 className="mt-1 text-lg font-black">{t('page.quick_join_title')}</h2>
          </div>
          <button
            onClick={() => setShowJoin((prev) => !prev)}
            className="surface-chip rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em]"
          >
            {showJoin ? t('page.close_join') : t('page.use_invite')}
          </button>
        </div>

        {showJoin && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={t('page.code_placeholder')}
              className="surface-input flex-1 rounded-2xl px-4 py-3 text-lg font-black uppercase"
            />
            <button
              onClick={verifyAndPrepareJoin}
              disabled={joining || !joinCode.trim()}
              className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {joining ? t('page.joining') : t('page.join_action')}
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
            placeholder={t('page.search_placeholder')}
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
          title={t('page.empty_title')}
          description={t('page.empty_desc')}
        />
      ) : (
        <div className="space-y-8">
          {myBoloes.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">{t('page.section_created')}</h2>
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
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">{t('page.section_participating')}</h2>
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
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-primary">{t('page.section_explore')}</h2>
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
                            <p className="text-sm text-zinc-400">{b.description || t("page.no_description")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">{t('page.public_label')}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-3 text-sm text-zinc-300">
                        <span>{t('page.members_count', { count: b.memberCount })}</span>
                        <span>•</span>
                        <span>{t('page.leader_score', { points: b.leader_score })}</span>
                      </div>

                      <button
                        onClick={() => void handleJoinPublicBolao(b.id)}
                        disabled={joiningPublicBolaoId === b.id}
                        className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-60"
                      >
                        {joiningPublicBolaoId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        {joiningPublicBolaoId === b.id ? t('page.joining') : t('page.join_now')}
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
                  {t('page.public_unavailable_title')}
                </p>
                <p className="mt-2 text-sm text-zinc-400">
                  {t('page.public_unavailable_desc')}
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
  const { t } = useTranslation('bolao');

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
            <p className="text-sm text-zinc-400">{bolao.description || t("page.no_description")}</p>
          </div>
        </div>
        <div className="surface-chip rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-300">
          {bolao.category === "public" ? t('page.public_label') : t('page.private_label')}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-300">
        <span>{t('page.members_count', { count: bolao.memberCount })}</span>
        <span>•</span>
        <span>{t('page.code_label', { code: bolao.invite_code })}</span>
      </div>
    </Link>
  );
}
