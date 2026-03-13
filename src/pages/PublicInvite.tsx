import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Loader2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PublicInviteBolao = {
    id: string;
    name: string;
    description: string | null;
    avatar_url: string | null;
    category: string | null;
    bolao_members: { count: number }[];
};

export default function PublicInvite() {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [bolao, setBolao] = useState<PublicInviteBolao | null>(null);
    const [loading, setLoading] = useState(true);

    const loadBolao = useCallback(async () => {
        if (!inviteCode) return;

        const code = inviteCode.toUpperCase();
        const { data, error } = await supabase.from('boloes')
            .select('id, name, description, avatar_url, category, bolao_members(count)')
            .eq('invite_code', code)
            .single();

        if (error || !data) {
            toast({ title: "Bolão não encontrado", variant: "destructive" });
            navigate('/');
            return;
        }

        if (user) {
            const { data: member } = await supabase.from('bolao_members')
                .select('id')
                .eq('bolao_id', data.id)
                .eq('user_id', user.id)
                .maybeSingle();

            if (member) {
                navigate(`/boloes/${data.id}`);
                return;
            }
        }

        setBolao(data);
        setLoading(false);
    }, [inviteCode, navigate, toast, user]);

    useEffect(() => {
        loadBolao();
    }, [loadBolao]);

    const handleJoin = async () => {
        if (!bolao) {
            return;
        }

        if (!user) {
            // Redireciona para login e depois para cá
            navigate(`/auth?redirect=/b/${inviteCode}`);
            return;
        }

        try {
            await supabase.from('bolao_members').insert({
                bolao_id: bolao.id,
                user_id: user.id,
                role: "member",
                payment_status: "exempt"
            });
            toast({ title: "Entrou com sucesso!", className: "bg-emerald-500 text-white" });
            navigate(`/boloes/${bolao.id}`);
        } catch {
            toast({ title: "Erro ao entrar.", variant: "destructive" });
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

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
                            <span className="block text-2xl font-black text-white">{bolao.bolao_members[0].count}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Membros</span>
                        </div>
                        <div className="w-[1px] bg-white/10" />
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white uppercase">{bolao.category}</span>
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
