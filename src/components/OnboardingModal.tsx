import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { teams, type Team } from "@/data/mockData";
import { Flag } from "@/components/Flag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateFavoriteTeam } from "@/services/profile/profile.service";
import { setStoredFavoriteTeam } from "@/lib/favorite-team";
import { useTranslation } from "react-i18next";
import { Bell, BellOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2;

export function OnboardingModal() {
    const logoUrl = "/logo.png?v=20260316";
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<Step>(1);
    const [selectedTeam, setSelectedTeam] = useState<string>("BRA");
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied">("idle");
    const { t } = useTranslation("common");

    useEffect(() => {
        if (!user) {
            setIsOpen(false);
            return;
        }

        const hasSeen = localStorage.getItem("arenacopa_onboarding_done");
        const hasFavoriteTeam = Boolean(localStorage.getItem("favorite_team"));
        if (!hasSeen && !hasFavoriteTeam) {
            setIsOpen(true);
            return;
        }

        setIsOpen(false);
    }, [user]);

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

    const handleNextStep = async () => {
        setLoading(true);
        setStoredFavoriteTeam(selectedTeam);

        if (user) {
            try {
                await updateFavoriteTeam(user.id, selectedTeam);
                localStorage.setItem("arenacopa_onboarding_migrated", "true");
            } catch (e) {
                console.error(e);
            }
        }

        setLoading(false);
        setStep(2);
    };

    const requestNotifications = async () => {
        if (!("Notification" in window)) {
            handleFinish();
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setNotifStatus(permission === "granted" ? "granted" : "denied");
        } catch {
            setNotifStatus("denied");
        }
        // Small delay so user sees the feedback before modal closes
        setTimeout(() => handleFinish(), 800);
    };

    const handleFinish = () => {
        localStorage.setItem("arenacopa_onboarding_done", "true");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md bg-[#0b0b0b] border-white/10 rounded-[32px] w-[92%] overflow-hidden shadow-2xl backdrop-blur-3xl">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <DialogHeader className="flex flex-col items-center pt-2">
                                <div className="w-20 h-20 mb-3 flex items-center justify-center p-3 rounded-[24px] bg-primary/10 border border-primary/20 shadow-2xl">
                                    <img src={logoUrl} alt="ArenaCopa Logo" className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]" />
                                </div>
                                <DialogTitle className="text-2xl font-black text-center uppercase tracking-tighter text-white shadow-black drop-shadow-md">
                                    {t("onboarding.title")}
                                </DialogTitle>
                                <DialogDescription className="text-center font-medium text-gray-400 mt-1.5 px-2">
                                    {t("onboarding.description")}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[40vh] overflow-y-auto px-2 py-4 scrollbar-hide relative mask-edges">
                                {teams.map((team: Team) => (
                                    <button
                                        key={team.code}
                                        onClick={() => setSelectedTeam(team.code)}
                                        className={cn(
                                            "flex flex-col items-center justify-center aspect-square gap-1.5 p-2 rounded-2xl transition-all duration-300 shadow-xl",
                                            selectedTeam === team.code
                                                ? "bg-primary/20 ring-2 ring-primary scale-105 border border-primary/30"
                                                : "bg-white/[0.03] hover:bg-white/[0.08] border border-white/5"
                                        )}
                                    >
                                        <Flag code={team.code} size="md" className={cn("transition-transform", selectedTeam === team.code && "scale-110")} />
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-widest",
                                            selectedTeam === team.code ? "text-primary mix-blend-plus-lighter" : "text-gray-400"
                                        )}>{team.code}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Step indicator */}
                            <div className="flex justify-center gap-1.5 py-2">
                                <span className="h-1.5 w-5 rounded-full bg-primary" />
                                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                            </div>

                            <div className="mt-2 pb-2 px-2">
                                <Button onClick={handleNextStep} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-[0.2em] rounded-[20px] h-14 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-[1.02] active:scale-[0.98]">
                                    {loading ? t("onboarding.loading") : "Próximo →"}
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center text-center px-2 py-4 gap-5"
                        >
                            <div className={cn(
                                "w-20 h-20 flex items-center justify-center rounded-[24px] border shadow-2xl transition-all duration-300",
                                notifStatus === "granted"
                                    ? "bg-primary/20 border-primary/30"
                                    : notifStatus === "denied"
                                    ? "bg-red-500/10 border-red-500/20"
                                    : "bg-white/5 border-white/10"
                            )}>
                                {notifStatus === "denied"
                                    ? <BellOff className="w-9 h-9 text-red-400" />
                                    : <Bell className={cn("w-9 h-9", notifStatus === "granted" ? "text-primary" : "text-white/60")} />
                                }
                            </div>

                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                                    Fique por dentro
                                </h2>
                                <p className="mt-2 text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                                    Ative as notificações para receber alertas de jogos, resultados e atualizações do seu bolão em tempo real.
                                </p>
                            </div>

                            {/* Step indicator */}
                            <div className="flex gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                                <span className="h-1.5 w-5 rounded-full bg-primary" />
                            </div>

                            <div className="w-full flex flex-col gap-3 pb-2">
                                {notifStatus === "idle" && (
                                    <>
                                        <Button
                                            onClick={requestNotifications}
                                            className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase tracking-[0.2em] rounded-[20px] h-14 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Bell className="w-4 h-4 mr-2" />
                                            Ativar notificações
                                        </Button>
                                        <button
                                            onClick={handleFinish}
                                            className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors py-1"
                                        >
                                            Agora não
                                        </button>
                                    </>
                                )}
                                {notifStatus === "granted" && (
                                    <div className="flex items-center justify-center gap-2 text-primary font-black">
                                        ✓ Notificações ativadas!
                                    </div>
                                )}
                                {notifStatus === "denied" && (
                                    <div className="text-sm text-gray-400">
                                        Tudo bem! Você pode ativar depois nas configurações do seu dispositivo.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
