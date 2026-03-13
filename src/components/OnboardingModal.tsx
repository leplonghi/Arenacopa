import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { teams } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateFavoriteTeam } from "@/services/profile/profile.service";

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<string>("BRA");
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if seen
        const hasSeen = localStorage.getItem("arenacopa_onboarding_done");
        if (!hasSeen) {
            setIsOpen(true);
        }
    }, []);

    useEffect(() => {
        // Migration logic for when they create an account later
        const hasSeen = localStorage.getItem("arenacopa_onboarding_done");
        const migrated = localStorage.getItem("arenacopa_onboarding_migrated");
        const fav = localStorage.getItem("favorite_team");

        if (user && hasSeen && fav && !migrated) {
            const migrate = async () => {
                try {
                    await updateFavoriteTeam(user.id, fav);
                    localStorage.setItem("arenacopa_onboarding_migrated", "true");
                } catch (e) {
                    console.error("Migration error:", e);
                }
            };
            migrate();
        }
    }, [user]);

    const handleConfirm = async () => {
        setLoading(true);
        localStorage.setItem("favorite_team", selectedTeam);
        localStorage.setItem("arenacopa_onboarding_done", "true");

        if (user) {
            try {
                await updateFavoriteTeam(user.id, selectedTeam);
                localStorage.setItem("arenacopa_onboarding_migrated", "true");
            } catch (e) {
                console.error(e);
            }
        }

        setLoading(false);
        setIsOpen(false);

        // Reload page to instantly apply changes across the app, especially localStorage fallbacks 
        // for not-logged-in users seeing the Index tab.
        window.location.reload();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-[#0b0b0b] border-white/10 rounded-[32px] w-[92%] overflow-hidden shadow-2xl backdrop-blur-3xl">
                <DialogHeader className="flex flex-col items-center pt-2">
                    <div className="w-20 h-20 mb-3 flex items-center justify-center p-3 rounded-[24px] bg-primary/10 border border-primary/20 shadow-2xl">
                        <img src="/logo-mark.svg" alt="ArenaCopa Logo" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-center uppercase tracking-tighter text-white shadow-black drop-shadow-md">
                        Bem-vindo à ArenaCopa
                    </DialogTitle>
                    <DialogDescription className="text-center font-medium text-gray-400 mt-1.5 px-2">
                        Escolha seu time favorito para a Copa 2026.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[40vh] overflow-y-auto px-2 py-4 scrollbar-hide relative mask-edges">
                    {teams.map(t => (
                        <button
                            key={t.code}
                            onClick={() => setSelectedTeam(t.code)}
                            className={cn(
                                "flex flex-col items-center justify-center aspect-square gap-1.5 p-2 rounded-2xl transition-all duration-300 shadow-xl",
                                selectedTeam === t.code
                                    ? "bg-primary/20 ring-2 ring-primary scale-105 border border-primary/30"
                                    : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/5"
                            )}
                        >
                            <Flag code={t.code} size="md" className={cn("transition-transform", selectedTeam === t.code && "scale-110")} />
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                selectedTeam === t.code ? "text-primary mix-blend-plus-lighter" : "text-gray-400"
                            )}>{t.code}</span>
                        </button>
                    ))}
                </div>

                <div className="mt-2 pb-2 px-2">
                    <Button onClick={handleConfirm} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-[0.2em] rounded-[20px] h-14 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-[1.02] active:scale-[0.98]">
                        {loading ? "Confirmando..." : "Confirmar e Entrar na Arena"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
