import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Clock } from "lucide-react";
import { Flag } from "@/components/Flag";

export function FabWithPending({ className, isActive }: { className?: string; isActive?: boolean }) {
    const { user } = useAuth();
    const [pendingMatches, setPendingMatches] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchPending = async () => {
            // Find all boloes the user is part of
            const { data: userMemberships } = await supabase
                .from("bolao_members")
                .select("bolao_id")
                .eq("user_id", user.id);

            if (!userMemberships || userMemberships.length === 0) return;

            const bolaoIds = userMemberships.map((m) => m.bolao_id);

            // Find incoming matches that have not started
            const { data: upcomingMatches } = await supabase
                .from("matches")
                .select("*")
                .in("status", ["scheduled", "timed"])
                .order("timestamp", { ascending: true })
                .limit(10);

            if (!upcomingMatches || upcomingMatches.length === 0) return;

            // Find user predictions for these matches in their boloes
            const matchIds = upcomingMatches.map(m => m.id);

            const { data: existingPredictions } = await supabase
                .from("predictions")
                .select("match_id")
                .eq("user_id", user.id)
                .in("match_id", matchIds);

            const predictedMatchIds = new Set(existingPredictions?.map(p => p.match_id) || []);

            const pending = upcomingMatches.filter(m => !predictedMatchIds.has(m.id));
            setPendingMatches(pending);
        };

        fetchPending();

        // Setup realtime listener for predictions to update the badge
        const channel = supabase
            .channel('public:predictions')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'predictions', filter: `user_id=eq.${user.id}` },
                () => {
                    fetchPending();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fabButton = (
        <div
            className={cn(
                "flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-b from-primary to-[hsl(var(--copa-gold))] shadow-lg shadow-primary/40 -mt-7 border-4 border-background transition-transform active:scale-95 cursor-pointer relative",
                isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                className
            )}
        >
            <span className="text-2xl">⚽</span>
            {pendingMatches.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-copa-live text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-background animate-pulse">
                    {pendingMatches.length}
                </span>
            )}
        </div>
    );

    if (pendingMatches.length === 0) {
        return (
            <NavLink to="/boloes" className={({ isActive: isLinkActive }) => cn(isActive && isLinkActive ? "" : "")}>
                {fabButton}
            </NavLink>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                {fabButton}
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] bg-zinc-950 border-white/10 text-white rounded-t-[32px] px-4 pt-6 pb-20">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-left flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="font-black text-xl tracking-tighter">Palpites Pendentes</span>
                    </SheetTitle>
                </SheetHeader>

                <div className="space-y-3 overflow-y-auto max-h-full pb-10 scrollbar-hide">
                    {pendingMatches.map(match => {
                        const date = new Date(match.timestamp * 1000);
                        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const dateString = date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });

                        return (
                            <div key={match.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                    <span>{match.stage || 'Fase de Grupos'}</span>
                                    <span>{dateString} - {timeString}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Flag code={match.home_team_code} size="md" />
                                        <span className="font-black text-sm">{match.home_team_code}</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs font-bold px-2">X</span>
                                    <div className="flex items-center gap-2 flex-1 justify-end">
                                        <span className="font-black text-sm">{match.away_team_code}</span>
                                        <Flag code={match.away_team_code} size="md" />
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        // Logic or navigation to predict modal. Will navigate to Guia where they can predict
                                        window.location.href = `/guia?match=${match.id}`;
                                    }}
                                    className="w-full bg-primary/20 text-primary border border-primary/30 font-black text-[11px] uppercase tracking-widest py-2.5 rounded-xl hover:bg-primary/30 transition-colors mt-2"
                                >
                                    Fazer Palpite Agora
                                </button>
                            </div>
                        );
                    })}
                </div>
            </SheetContent>
        </Sheet>
    );
}
