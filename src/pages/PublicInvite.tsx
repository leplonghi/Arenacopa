
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Target } from "lucide-react";
import { BolaoAvatar } from "@/components/BolaoAvatar";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { resolvePublicBolaoInvite } from "@/services/public-invite/public-invite.service";

type PublicInviteBolao = {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    category: string | null;
    is_paid: boolean;
    memberCount: number;
};

export default function PublicInvite() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { t } = useTranslation('bolao');
    const { toast } = useToast();

    const [bolao, setBolao] = useState<PublicInviteBolao | null>(null);
    const [loading, setLoading] = useState(true);
    const accessLabel =
        bolao?.category === "public"
            ? t("wizard.details_step.public_title")
            : bolao?.category === "private"
                ? t("wizard.details_step.private_title")
                : t("invite.access_open");

    const loadBolao = useCallback(async () => {
        if (!inviteCode) {
            setLoading(false);
            return;
        }

        const code = inviteCode.toUpperCase();
        try {
            const resolvedBolao = await resolvePublicBolaoInvite(code);

            if (!resolvedBolao) {
                toast({ title: t('invite.bolao_not_found'), variant: "destructive" });
                navigate('/');
                return;
            }

            if (user) {
                const memberSnap = await getDoc(doc(db, "bolao_members", `${user.id}_${resolvedBolao.id}`));

                if (memberSnap.exists()) {
                    navigate(`/boloes/${resolvedBolao.id}`);
                    return;
                }
            }

            setBolao(resolvedBolao);
        } catch (error) {
            console.error("Error loading bolao:", error);
            toast({ title: t('invite.load_error'), variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [inviteCode, navigate, t, toast, user]);

    useEffect(() => {
        loadBolao();
    }, [loadBolao]);

    const handleJoin = useCallback(async () => {
        if (!bolao) return;

        if (!user) {
            navigate(`/auth?redirect=${encodeURIComponent(`/b/${inviteCode}?action=join`)}`);
            return;
        }

        try {
            const memberId = `${user.id}_${bolao.id}`;
            await setDoc(doc(db, 'bolao_members', memberId), {
                bolao_id: bolao.id,
                user_id: user.id,
                role: "member",
                payment_status: bolao.is_paid ? "pending" : "exempt",
                invite_code: inviteCode?.toUpperCase() || null,
                joined_at: new Date().toISOString()
            });
            toast({ title: t('invite.joined'), className: "bg-emerald-500 text-white" });
            navigate(`/boloes/${bolao.id}`);
        } catch (error) {
            console.error("Error joining bolao:", error);
            toast({ title: t('invite.join_error'), variant: "destructive" });
        }
    }, [bolao, inviteCode, navigate, toast, t, user]);

    useEffect(() => {
        // Auto-join if user was redirected from auth with action=join
        const autoJoin = async () => {
            if (user && bolao && new URLSearchParams(location.search).get("action") === "join") {
                await handleJoin();
            }
        };
        autoJoin();
    }, [bolao, handleJoin, location.search, user]);

    if (loading) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (!bolao) return null;

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-0 right-[-100px] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none animate-pulse opacity-50" />

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 w-full max-w-md">
                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[60px] p-10 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-transparent via-primary to-transparent" />

                    <BolaoAvatar
                        avatarUrl={bolao.avatar_url}
                        alt={bolao.name}
                        className="mb-6 inline-flex h-[108px] w-[108px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-4 text-[60px]"
                    />
                    <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-primary mb-2">{t('invite.kicker')}</h3>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-4">{bolao.name}</h1>
                    {bolao.description && <p className="text-sm text-gray-400 font-medium mb-8 px-4">{bolao.description}</p>}

                    <div className="flex justify-center gap-6 mb-8">
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white">{bolao.memberCount}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('invite.members_label')}</span>
                        </div>
                        <div className="w-[1px] bg-white/10" />
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white uppercase">{accessLabel}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('invite.access_label')}</span>
                        </div>
                    </div>

                    <button onClick={handleJoin} className="w-full bg-primary text-black font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:scale-105 transition flex items-center justify-center gap-2">
                        <Target className="w-5 h-5" /> {t('invite.join_cta')}
                    </button>

                    {!user && (
                        <p className="mt-6 text-xs text-gray-500 font-medium">{t('invite.login_hint')}</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
