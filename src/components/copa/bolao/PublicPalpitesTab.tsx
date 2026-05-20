import React, { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { 
    collection, 
    query, 
    where, 
    getDocs,
    onSnapshot,
    doc,
    getDoc
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag } from "@/components/Flag";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";

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
    const { t } = useTranslation("bolao");
    const [palpites, setPalpites] = useState<PublicPalpite[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewableMatchIds, setViewableMatchIds] = useState<string[]>([]);
    const [allMatches, setAllMatches] = useState<any[]>([]);
    const [now, setNow] = useState(Date.now());

    // 1. Update 'now' periodically to unlock matches as they close
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // every minute
        return () => clearInterval(interval);
    }, []);

    // 2. Listen to matches data (real-time for status updates)
    useEffect(() => {
        let unsubscribes: (() => void)[] = [];
        
        const setupMatchListeners = async () => {
            try {
                const bolaoRef = doc(db, "boloes", bolaoId);
                const bolaoSnap = await getDoc(bolaoRef);
                const allowedMatchIds = bolaoSnap.data()?.allowed_match_ids || [];

                if (allowedMatchIds.length === 0) {
                    setAllMatches([]);
                    return;
                }

                const matchesRef = collection(db, "matches");
                const chunks = Array.from({ length: Math.ceil(allowedMatchIds.length / 30) }, (_, i) => 
                    allowedMatchIds.slice(i * 30, (i + 1) * 30)
                );

                unsubscribes = chunks.map((chunk) => {
                    const q = query(matchesRef, where("__name__", "in", chunk));
                    return onSnapshot(q, (snapshot) => {
                        const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        setAllMatches(current => {
                            const otherChunks = current.filter(m => !chunk.includes(m.id));
                            return [...otherChunks, ...loaded];
                        });
                    });
                });
            } catch (err) {
                console.error("Error setting up match listeners:", err);
            }
        };

        setupMatchListeners();
        return () => unsubscribes.forEach(unsub => unsub());
    }, [bolaoId]);

    // 3. All allowed matches are viewable
    useEffect(() => {
        if (allMatches.length === 0) return;
        setViewableMatchIds(allMatches.map(m => m.id));
    }, [allMatches]);

    // 4. Real-time listener for predictions of viewable matches
    useEffect(() => {
        if (viewableMatchIds.length === 0) {
            setPalpites([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const palpitesRef = collection(db, "bolao_palpites");
        
        // We might need multiple listeners if viewableMatchIds > 30
        const chunks = Array.from({ length: Math.ceil(viewableMatchIds.length / 30) }, (_, index) => 
            viewableMatchIds.slice(index * 30, (index + 1) * 30)
        );

        const unsubscribes = chunks.map((chunk) => {
            const q = query(
                palpitesRef,
                where("bolao_id", "==", bolaoId),
                where("match_id", "in", chunk)
            );
            
            return onSnapshot(q, async (snapshot) => {
                const rawPreds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
                
                // Get profiles (cached by the service if possible)
                const userIds = [...new Set(rawPreds.map(p => p.user_id))];
                const profiles = await getPublicProfilesByIds(userIds);

                const enriched = rawPreds.map(p => {
                    const match = allMatches.find(m => m.id === p.match_id);
                    return {
                        ...p,
                        match: {
                            home_team_code: match?.home_team_code,
                            away_team_code: match?.away_team_code
                        },
                        profile: profiles.get(p.user_id)
                    };
                });

                // Update state - merge if multiple listeners
                setPalpites(current => {
                    const otherChunks = current.filter(p => !chunk.includes(p.match_id));
                    const next = [...otherChunks, ...enriched].sort((a, b) => {
                        const dateA = new Date(allMatches.find(m => m.id === a.match_id)?.match_date || 0).getTime();
                        const dateB = new Date(allMatches.find(m => m.id === b.match_id)?.match_date || 0).getTime();
                        if (dateB !== dateA) return dateB - dateA;
                        return (a.profile?.name || "").localeCompare(b.profile?.name || "");
                    });
                    return next;
                });
                setLoading(false);
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [viewableMatchIds, bolaoId, allMatches]);

    if (loading) {
        return <div className="text-center text-gray-400 py-10 font-bold uppercase tracking-widest text-xs">{t("public_picks.loading")}</div>;
    }

    if (palpites.length === 0) {
        return <div className="text-center text-gray-400 py-10 font-bold uppercase tracking-widest text-xs">{t("public_picks.empty")}</div>;
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
                        <span className="font-bold text-sm tracking-widest uppercase text-gray-400">{p.profile?.name || t("public_picks.hidden_member")}</span>
                        {p.is_exact && <span className="ml-auto px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase">{t("public_picks.exact_badge")}</span>}
                    </div>

                    <div className="flex items-center justify-between px-2 bg-black/40 py-4 rounded-xl border border-white/5">
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <Flag code={p.match.home_team_code} size="sm" />
                            <span className="text-[10px] font-bold text-gray-500">{p.match.home_team_code}</span>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="text-3xl font-black text-white">{p.home_score}</div>
                            <div className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-1">{t("public_picks.versus")}</div>
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
