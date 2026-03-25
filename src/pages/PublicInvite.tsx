
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, getDocs, limit, getCountFromServer, setDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type PublicInviteBolao = {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    category: string | null;
    memberCount: number;
};

export default function PublicInvite() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation('bolao');
  const { toast } = useToast();

    const [bolao, setBolao] = useState<PublicInviteBolao | null>(null);
    const [loading, setLoading] = useState(true);

    const loadBolao = useCallback(async () => {
        if (!inviteCode) return;

        const code = inviteCode.toUpperCase();
        try {
            const boloesRef = collection(db, 'boloes');
            const q = query(boloesRef, where('invite_code', '==', code), limit(1));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({ title: t('invite.bolao_not_found'), variant: "destructive" });
                navigate('/');
                return;
            }

            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            const bolaoId = docSnap.id;

            // Get member count
            const membersRef = collection(db, 'bolao_members');
            const membersCountSnap = await getCountFromServer(query(membersRef, where('bolao_id', '==', bolaoId)));
            const memberCount = membersCountSnap.data().count;

            if (user) {
                const memberRef = collection(db, 'bolao_members');
                const mq = query(memberRef, where('bolao_id', '==', bolaoId), where('user_id', '==', user.id), limit(1));
                const memberSnap = await getDocs(mq);

                if (!memberSnap.empty) {
                    navigate(`/boloes/${bolaoId}`);
                    return;
                }
            }

            setBolao({
                id: bolaoId,
                name: data.name,
                description: data.description || null,
                avatar_url: data.avatar_url || null,
                category: data.category || null,
                memberCount
            });
        } catch (error) {
            console.error("Error loading bolao:", error);
            toast({ title: t('invite.load_error'), variant: "destructive" });
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inviteCode, navigate, toast, user]);

    useEffect(() => {
        loadBolao();
    }, [loadBolao]);

    const handleJoin = async () => {
        if (!bolao) return;

        if (!user) {
            navigate(`/auth?redirect=/b/${inviteCode}`);
            return;
        }

        try {
            const memberId = `${user.id}_${bolao.id}`;
            await setDoc(doc(db, 'bolao_members', memberId), {
                bolao_id: bolao.id,
                user_id: user.id,
                role: "member",
                payment_status: "exempt",
                joined_at: new Date().toISOString()
            });
            toast({ title: t('invite.joined'), className: "bg-emerald-500 text-white" });
            navigate(`/boloes/${bolao.id}`);
        } catch (error) {
            console.error("Error joining bolao:", error);
            toast({ title: t('invite.join_error'), variant: "destructive" });
        }
    };

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

                    <div className="text-[60px] mb-6 inline-block bg-white/5 p-4 rounded-3xl border border-white/10">{bolao.avatar_url || '🏆'}</div>
                    <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-primary mb-2">Vem pra Arena</h3>
                    <h1 className="text-4xl font-black text-white tracking-tighter mb-4">{bolao.name}</h1>
                    {bolao.description && <p className="text-sm text-gray-400 font-medium mb-8 px-4">{bolao.description}</p>}

                    <div className="flex justify-center gap-6 mb-8">
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white">{bolao.memberCount}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Membros</span>
                        </div>
                        <div className="w-[1px] bg-white/10" />
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white uppercase">{bolao.category || "Aberto"}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Acesso</span>
                        </div>
                    </div>

                    <button onClick={handleJoin} className="w-full bg-primary text-black font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:scale-105 transition flex items-center justify-center gap-2">
                        <Target className="w-5 h-5" /> Entrar no Bolão
                    </button>

                    {!user && (
                        <p className="mt-6 text-xs text-gray-500 font-medium">Faça o login ou instale o app para participar gratuitamente.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
