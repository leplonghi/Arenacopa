import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { type ExtraBet } from "@/types/bolao";
import { teams } from "@/data/mockData";
import { Trophy, Medal, Loader2, Save } from "lucide-react";

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

    // Initial load
    useEffect(() => {
        const loadExtras = async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data } = await (supabase as any)
                .from("bolao_extra_bets")
                .select("*")
                .eq("bolao_id", bolaoId)
                .eq("user_id", userId);

            if (data) {
                const typedData = data as unknown as ExtraBet[];
                setExtras(typedData);
                const ts = typedData.find(e => e.category === 'top_scorer');
                if (ts) setTopScorerInput(ts.value);
            }
            setLoading(false);
        };
        loadExtras();
    }, [bolaoId, userId]);

    const saveExtra = async (category: 'champion' | 'top_scorer', value: string) => {
        if (!value) return;
        setSaving(category);
        try {
            // Check if matching row exists to update locally optimistically
            const existing = extras.find(e => e.category === category);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase as any)
                .upsert({
                    bolao_id: bolaoId,
                    user_id: userId,
                    category,
                    value
                }, { onConflict: 'bolao_id,user_id,category' })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setExtras(prev => {
                    const filtered = prev.filter(e => e.category !== category);
                    return [...filtered, data as unknown as ExtraBet];
                });
                toast({ title: t('extras.saved_success') });
            }
        } catch (error) {
            console.error(error);
            toast({ title: t('palpites.error_save'), variant: "destructive" });
        } finally {
            setSaving(null);
        }
    };

    const championBet = extras.find(e => e.category === 'champion');

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 rounded-xl border border-amber-500/20">
                <h3 className="font-black text-lg text-amber-500 flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> {t('extras.title')}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {t('extras.subtitle')}
                </p>
            </div>

            {/* ARTILHEIRO */}
            <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Medal className="w-5 h-5" />
                        <h4 className="font-bold">{t('extras.top_scorer_title')}</h4>
                    </div>
                    <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-full text-foreground/70">15 pts</span>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder={t('extras.top_scorer_placeholder')}
                            className="w-full rounded-lg bg-secondary/50 border border-white/5 px-4 py-3 text-sm font-bold placeholder:font-normal outline-none focus:ring-2 focus:ring-primary transition-all"
                            value={topScorerInput}
                            onChange={(e) => setTopScorerInput(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => saveExtra('top_scorer', topScorerInput)}
                        disabled={saving === 'top_scorer' || !topScorerInput || topScorerInput === extras.find(e => e.category === 'top_scorer')?.value}
                        className="bg-primary text-primary-foreground rounded-lg px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                    >
                        {saving === 'top_scorer' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                    {t('extras.top_scorer_hint')}
                </p>
            </div>

            {/* CAMPEÃO */}
            <div className="glass-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Trophy className="w-5 h-5" />
                        <h4 className="font-bold">{t('extras.champion_title')}</h4>
                    </div>
                    <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-full text-foreground/70">20 pts</span>
                </div>

                {championBet && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-2">
                        <span className="text-2xl">{teams.find(t => t.name === championBet.value)?.flag}</span>
                        <div>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{t('extras.your_guess')}</p>
                            <p className="font-black text-lg">{championBet.value}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                    {teams.map(team => {
                        const isSelected = championBet?.value === team.name;
                        return (
                            <button
                                key={team.code}
                                onClick={() => saveExtra('champion', team.name)}
                                disabled={saving === 'champion'}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:bg-white/5 active:scale-95 relative overflow-hidden",
                                    isSelected
                                        ? "bg-amber-500/20 border-amber-500 ring-1 ring-amber-500 z-10"
                                        : "bg-secondary/20 border-white/5 opacity-80 hover:opacity-100"
                                )}
                            >
                                <span className="text-2xl filter drop-shadow-lg">{team.flag}</span>
                                <span className={cn("text-xs font-bold truncate", isSelected && "text-amber-500")}>{team.name}</span>
                                {
                                    isSelected && (
                                        <div className="absolute inset-0 bg-amber-500/10 animate-pulse" />
                                    )
                                }
                            </button>
                        );
                    })}
                </div>
            </div>
        </div >
    );
}
