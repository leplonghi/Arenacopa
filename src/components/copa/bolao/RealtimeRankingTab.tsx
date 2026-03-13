import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type RankingProfile = {
    user_id: string;
    name: string | null;
    avatar_url: string | null;
};

type RankingRow = {
    user_id: string;
    total_points: number;
    exact_matches: number;
    correct_results: number;
    profile?: RankingProfile;
};

export function RealtimeRankingTab({ bolaoId }: { bolaoId: string, rules?: unknown }) {
    const [rankings, setRankings] = useState<RankingRow[]>([]);
    const { user } = useAuth();

    const loadRankings = useCallback(async () => {
        const { data } = await supabase
            .from('bolao_rankings')
            .select('user_id, total_points, exact_matches, correct_results')
            .eq('bolao_id', bolaoId)
            .order('total_points', { ascending: false });

        if (data) {
            const userIds = data.map(d => d.user_id);
            const { data: profiles } = await supabase.from('profiles').select('user_id, name, avatar_url').in('user_id', userIds);
            const joined = data.map(d => {
                const p = profiles?.find(p => p.user_id === d.user_id);
                return { ...d, profile: p };
            });
            setRankings(joined);
        }
    }, [bolaoId]);

    useEffect(() => {
        loadRankings();

        const channel = supabase.channel(`public:bolao_rankings:bolao_id=eq.${bolaoId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bolao_rankings', filter: `bolao_id=eq.${bolaoId}` }, () => {
                loadRankings();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [bolaoId, loadRankings]);

    return (
        <div className="space-y-4">
            {rankings.map((r, i) => (
                <div key={r.user_id} className={cn("flex items-center gap-4 p-4 rounded-[24px] border", r.user_id === user?.id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/5")}>
                    <div className="w-8 text-center font-black text-xl text-gray-500">{i + 1}</div>
                    <Avatar className="w-12 h-12 rounded-xl">
                        <AvatarImage src={r.profile?.avatar_url} />
                        <AvatarFallback className="bg-white/10 text-white rounded-xl uppercase">{r.profile?.name?.substring(0, 2) || 'US'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{r.profile?.name || 'Membro Oculto'}</div>
                        <div className="flex gap-3 text-[10px] font-bold uppercase text-gray-500 mt-1">
                            <span className="flex items-center gap-1 text-emerald-400"><Target className="w-3 h-3" /> {r.exact_matches} Exatos</span>
                            <span className="flex items-center gap-1 text-blue-400"><Star className="w-3 h-3" /> {r.correct_results} Acertos</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-black">{r.total_points}</div>
                        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">PTS</div>
                    </div>
                </div>
            ))}
            {rankings.length === 0 && <div className="text-center text-gray-500 py-10">O ranking começará a ser formado assim que o primeiro jogo acabar!</div>}
        </div>
    );
}
