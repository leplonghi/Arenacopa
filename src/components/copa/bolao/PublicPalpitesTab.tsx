import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    documentId 
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag } from "@/components/Flag";
import { motion } from "framer-motion";

type PublicPalpite = {
    id: string;
    user_id: string;
    match_id: string;
    home_score: number;
    away_score: number;
    is_exact?: boolean;
    match: {
        home_team_code: string;
        away_team_code: string;
    };
    profile?: {
        user_id: string;
        name: string | null;
        avatar_url: string | null;
    };
};

export function PublicPalpitesTab({ bolaoId }: { bolaoId: string }) {
    const [palpites, setPalpites] = useState<PublicPalpite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Get live/finished matches
                const matchesRef = collection(db, "matches");
                const qMatches = query(matchesRef, where("status", "in", ["live", "finished"]));
                const matchSnapshot = await getDocs(qMatches);
                
                const matches = matchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                if (matches.length === 0) {
                    setPalpites([]);
                    setLoading(false);
                    return;
                }
                const matchIds = matches.map(m => m.id);

                // 2. Get predictions for those matches in this bolao
                const palpitesRef = collection(db, "bolao_palpites");
                const predictionSnapshots = await Promise.all(
                    Array.from({ length: Math.ceil(matchIds.length / 30) }, (_, index) => {
                        const currentChunk = matchIds.slice(index * 30, (index + 1) * 30);
                        const qPreds = query(
                            palpitesRef,
                            where("bolao_id", "==", bolaoId),
                            where("match_id", "in", currentChunk)
                        );
                        return getDocs(qPreds);
                    })
                );
                
                interface RawPalpite {
                    id: string;
                    user_id: string;
                    match_id: string;
                    home_score: number;
                    away_score: number;
                    is_exact?: boolean;
                }

                const preds = predictionSnapshots
                    .flatMap(snapshot => snapshot.docs)
                    .map(doc => ({ id: doc.id, ...doc.data() })) as unknown as RawPalpite[];

                if (preds.length === 0) {
                    setPalpites([]);
                    setLoading(false);
                    return;
                }

                const userIds = [...new Set(preds.map((p) => p.user_id as string))];
                
                // 3. Get profiles
                const profilesRef = collection(db, "profiles");
                const profileChunks: { user_id: string; name: string | null; avatar_url: string | null }[] = [];
                for (let i = 0; i < userIds.length; i += 30) {
                    const chunkIds = userIds.slice(i, i + 30);
                    const qProfiles = query(profilesRef, where(documentId(), "in", chunkIds));
                    const pSnap = await getDocs(qProfiles);
                    pSnap.forEach(doc => {
                        const data = doc.data();
                        profileChunks.push({ 
                            user_id: doc.id, 
                            name: data.displayName || data.name || null,
                            avatar_url: data.photoURL || data.avatar_url || null
                        });
                    });
                }

                interface RawMatch {
                    id: string;
                    home_team_code: string;
                    away_team_code: string;
                }

                const enriched = preds.map((p) => {
                    const match = matches.find(m => m.id === p.match_id) as RawMatch;
                    const profile = profileChunks.find(prof => prof.user_id === p.user_id);
                    return {
                        ...p,
                        match: {
                            home_team_code: match?.home_team_code || '??',
                            away_team_code: match?.away_team_code || '??'
                        },
                        profile
                    } as PublicPalpite;
                });

                setPalpites(enriched);
            } catch (error) {
                console.error("Error loading public palpites:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [bolaoId]);

    if (loading) {
        return <div className="text-center text-gray-400 py-10 font-bold uppercase tracking-widest text-xs">Carregando palpites...</div>;
    }

    if (palpites.length === 0) {
        return <div className="text-center text-gray-400 py-10 font-bold uppercase tracking-widest text-xs">Os palpites dos membros aparecerão aqui quando a primeira partida começar!</div>;
    }

    return (
        <div className="space-y-4">
            {palpites.map(p => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={p.id} className="p-4 rounded-[24px] bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <Avatar className="w-8 h-8 rounded-full border border-white/10">
                            <AvatarImage src={p.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-white/10 text-xs font-bold text-gray-500 uppercase">{p.profile?.name?.substring(0, 2) || 'US'}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-sm tracking-widest uppercase text-gray-400">{p.profile?.name || 'Membro Oculto'}</span>
                        {p.is_exact && <span className="ml-auto px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">Cravou!</span>}
                    </div>

                    <div className="flex items-center justify-between px-2 bg-black/40 py-4 rounded-xl border border-white/5">
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <Flag code={p.match.home_team_code} size="sm" />
                            <span className="text-[10px] font-bold text-gray-500">{p.match.home_team_code}</span>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="text-3xl font-black text-white">{p.home_score}</div>
                            <div className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-1">VS</div>
                            <div className="text-3xl font-black text-white">{p.away_score}</div>
                        </div>

                        <div className="flex flex-col items-center gap-2 flex-1">
                            <Flag code={p.match.away_team_code} size="sm" />
                            <span className="text-[10px] font-bold text-gray-500">{p.match.away_team_code}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
