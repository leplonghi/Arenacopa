import React, { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { 
    collection, 
    query, 
    where, 
    getDocs,
    onSnapshot
} from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flag } from "@/components/Flag";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getPublicProfilesByIds } from "@/services/profile/profile.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type MatchPublicPalpite = {
    id: string;
    user_id: string;
    match_id: string;
    home_score: number;
    away_score: number;
    is_exact?: boolean;
    profile?: {
        user_id: string;
        name: string | null;
        avatar_url: string | null;
    };
};

interface MatchPublicPalpitesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bolaoId: string;
    matchId: string;
    matchHomeCode: string;
    matchAwayCode: string;
}

export function MatchPublicPalpitesDialog({ 
    open, 
    onOpenChange, 
    bolaoId, 
    matchId, 
    matchHomeCode, 
    matchAwayCode
}: MatchPublicPalpitesDialogProps) {
    const { t } = useTranslation("bolao");
    const [palpites, setPalpites] = useState<MatchPublicPalpite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!open || !bolaoId || !matchId) return;

        setLoading(true);
        const palpitesRef = collection(db, "bolao_palpites");
        const q = query(
            palpitesRef,
            where("bolao_id", "==", bolaoId),
            where("match_id", "==", matchId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            try {
                const preds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
                
                if (preds.length === 0) {
                    setPalpites([]);
                    setLoading(false);
                    return;
                }

                const userIds = [...new Set(preds.map((p) => p.user_id as string))];
                const publicProfiles = await getPublicProfilesByIds(userIds);

                const enriched = preds.map((p) => ({
                    ...p,
                    profile: publicProfiles.get(p.user_id)
                })).sort((a, b) => (a.profile?.name || "").localeCompare(b.profile?.name || ""));

                setPalpites(enriched);
            } catch (error) {
                console.error("Error loading match public palpites:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [open, bolaoId, matchId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-[32px] border-white/10 bg-[#050505] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center justify-center gap-3">
                        <Flag code={matchHomeCode} size="sm" />
                        <span className="font-display text-xl font-semibold uppercase text-white">{matchHomeCode} x {matchAwayCode}</span>
                        <Flag code={matchAwayCode} size="sm" />
                    </DialogTitle>
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">
                        {t("public_picks.title_match", "Palpites da Galera")}
                    </p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-16 rounded-2xl bg-white/5" />
                            ))}
                        </div>
                    ) : palpites.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{t("public_picks.empty")}</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {palpites.map(p => (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={p.id} 
                                    className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 rounded-full border border-white/10">
                                            <AvatarImage src={p.profile?.avatar_url || undefined} />
                                            <AvatarFallback className="bg-white/10 text-xs font-bold text-gray-500 uppercase">{p.profile?.name?.substring(0, 2) || 'US'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs tracking-wide text-white">{p.profile?.name || t("public_picks.hidden_member")}</span>
                                            {p.is_exact && <span className="text-[8px] font-black uppercase text-emerald-400">{t("public_picks.exact_badge")}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-black text-white">{p.home_score}</span>
                                            <span className="text-[10px] text-zinc-600 font-bold">x</span>
                                            <span className="text-lg font-black text-white">{p.away_score}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
