import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type ExtraBet } from "@/types/bolao";
import { teams } from "@/data/mockData";
import { Trophy, Medal, Loader2, Save, Target, Star, ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "../animations";

interface ExtrasTabProps {
    bolaoId: string;
    userId: string;
}

export function ExtrasTab({ bolaoId, userId }: ExtrasTabProps) {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const [extras, setExtras] = useState<ExtraBet[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [topScorerInput, setTopScorerInput] = useState("");

    useEffect(() => {
        const loadExtras = async () => {
            try {
                const q = query(collection(db, "bolao_extra_bets"), where("bolao_id", "==", bolaoId), where("user_id", "==", userId));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                if (data.length > 0) {
                    const typedData = data as unknown as ExtraBet[];
                    setExtras(typedData);
                    const ts = typedData.find(e => e.category === 'top_scorer');
                    if (ts) setTopScorerInput(ts.value);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadExtras();
    }, [bolaoId, userId]);

    const saveExtra = async (category: 'champion' | 'top_scorer', value: string) => {
        if (!value) return;
        setSaving(category);
        try {
            const q = query(collection(db, "bolao_extra_bets"), where("bolao_id", "==", bolaoId), where("user_id", "==", userId), where("category", "==", category));
            const snapshot = await getDocs(q);

            let newExtra: ExtraBet;

            if (!snapshot.empty) {
                const docRef = snapshot.docs[0].ref;
                await updateDoc(docRef, { value });
                newExtra = { id: docRef.id, bolao_id: bolaoId, user_id: userId, category, value } as any;
            } else {
                const ref = collection(db, "bolao_extra_bets");
                const docRef = await addDoc(ref, { bolao_id: bolaoId, user_id: userId, category, value });
                newExtra = { id: docRef.id, bolao_id: bolaoId, user_id: userId, category, value } as any;
            }

            setExtras(prev => {
                const filtered = prev.filter(e => e.category !== category);
                return [...filtered, newExtra];
            });
            toast({
                title: t('extras.saved_success'),
                className: "bg-emerald-500 border-emerald-600 text-white font-black uppercase text-[10px] tracking-widest"
            });
        } catch (error) {
            console.error(error);
            toast({ title: t('palpites.error_save'), variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    const championBet = extras.find(e => e.category === 'champion');

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 animate-pulse">{t('common.loading')}</span>
            </div>
        );
    }

    return (
        <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
        >
            {/* Header / Banner */}
            <motion.div
                variants={staggerItem}
                className="relative glass-card p-6 overflow-hidden group border-2 border-amber-500/20"
            >
                <div className="absolute top-0 right-0 p-8 transform translate-x-1/4 -translate-y-1/4 opacity-10 group-hover:scale-110 transition-transform">
                    <Trophy className="w-32 h-32 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="font-black text-xl uppercase tracking-tighter text-white">
                            {t('extras.title')}
                        </h3>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium tracking-tight leading-normal max-w-[80%]">
                        {t('extras.subtitle')}
                    </p>
                </div>
            </motion.div>

            {/* ARTILHEIRO (TOP SCORER) */}
            <motion.div variants={staggerItem} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t('extras.top_scorer_title')}</h4>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">+15 PTS</span>
                    </div>
                </div>

                <div className="glass-card p-6 space-y-4 border-2 border-white/5">
                    <div className="flex gap-2">
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                placeholder={t('extras.top_scorer_placeholder')}
                                className="w-full rounded-2xl bg-white/5 border-2 border-white/5 px-6 py-4 text-sm font-black placeholder:font-bold placeholder:text-gray-600 outline-none focus:border-primary/50 focus:bg-white/10 transition-all uppercase tracking-wider"
                                value={topScorerInput}
                                onChange={(e) => setTopScorerInput(e.target.value)}
                            />
                            <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => saveExtra('top_scorer', topScorerInput)}
                            disabled={saving === 'top_scorer' || !topScorerInput || topScorerInput === extras.find(e => e.category === 'top_scorer')?.value}
                            className="bg-primary text-primary-foreground rounded-2xl px-6 flex items-center justify-center disabled:opacity-50 disabled:grayscale hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all"
                        >
                            {saving === 'top_scorer' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 fill-current" />}
                        </motion.button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 p-3 rounded-xl border border-white/5">
                        <Medal className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <p className="italic leading-relaxed">
                            {t('extras.top_scorer_hint')}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* CAMPEÃO (CHAMPION) */}
            <motion.div variants={staggerItem} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{t('extras.champion_title')}</h4>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">+20 PTS</span>
                    </div>
                </div>

                <div className="glass-card p-4 space-y-6 border-2 border-white/5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {championBet && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                animate={{ opacity: 1, height: "auto", scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                className="relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-xl opacity-50" />
                                <div className="relative bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-5xl shadow-2xl group-hover:scale-110 transition-transform">
                                        {teams.find(t => t.name === championBet.value)?.flag}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] mb-1">{t('extras.your_guess')}</p>
                                        <p className="font-black text-3xl text-white tracking-tighter uppercase">{championBet.value}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-none snap-y pt-4">
                        {teams.map(team => {
                            const isSelected = championBet?.value === team.name;
                            return (
                                <motion.button
                                    key={team.code}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => saveExtra('champion', team.name)}
                                    disabled={saving === 'champion'}
                                    className={cn(
                                        "group flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all relative overflow-hidden snap-start",
                                        isSelected
                                            ? "bg-amber-500/20 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                                            : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "text-4xl filter drop-shadow-xl transition-transform group-hover:scale-110",
                                        !isSelected && "grayscale-[0.3] group-hover:grayscale-0"
                                    )}>
                                        {team.flag}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest text-center leading-tight transition-colors",
                                        isSelected ? "text-amber-500" : "text-gray-500 group-hover:text-white"
                                    )}>
                                        {team.name}
                                    </span>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="flex justify-center pt-2">
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-600 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5">
                            <ChevronDown className="w-3 h-3 animate-bounce" />
                            SEE ALL TEAMS
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
