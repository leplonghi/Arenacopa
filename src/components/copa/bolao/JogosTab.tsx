import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Flag } from "@/components/Flag";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import { Lock, Share2, Download, Copy, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShareCardGenerator } from "./ShareCardGenerator";
import { toPng } from "html-to-image";

export function JogosTab({ bolaoId, rules }: { bolaoId: string; rules: any }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [matches, setMatches] = useState<any[]>([]);
    const [palpites, setPalpites] = useState<Record<string, { id?: string; home: string; away: string; points: number; is_exact: boolean }>>({});

    // Share States
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [shareData, setShareData] = useState<any>(null);
    const shareRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!user) return;
        const loadMatchesAndPalpites = async () => {
            const { data: mData } = await supabase.from('matches').select('*').order('match_date', { ascending: true });
            const { data: pData } = await supabase.from('bolao_palpites').select('*').eq('bolao_id', bolaoId).eq('user_id', user.id);

            if (mData) {
                setMatches(mData);
            }

            if (pData) {
                const m = pData.reduce((acc, p) => ({ ...acc, [p.match_id]: { id: p.id, home: p.home_score.toString(), away: p.away_score.toString(), points: p.points, is_exact: p.is_exact } }), {});
                setPalpites(m);
            }
        };
        loadMatchesAndPalpites();

        // Listen for calculated points
        const chan = supabase.channel(`palpites_updates:${user.id}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bolao_palpites', filter: `user_id=eq.${user.id}` }, (payload) => {
                const np = payload.new;
                if (np.bolao_id === bolaoId) {
                    setPalpites(prev => ({ ...prev, [np.match_id]: { id: np.id, home: np.home_score.toString(), away: np.away_score.toString(), points: np.points, is_exact: np.is_exact } }));
                    if (np.is_exact) {
                        // Confetti celebration
                        toast({ title: "Na mosca!", description: "Você cravou o placar exato!", className: "bg-primary text-black font-black" });
                        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                    }
                }
            }).subscribe();

        return () => { supabase.removeChannel(chan); };
    }, [bolaoId, user]);

    const handleSave = async (matchId: string, homeTeam: string, awayTeam: string) => {
        const palpite = palpites[matchId];
        if (!palpite || !palpite.home || !palpite.away) return;

        const hs = parseInt(palpite.home);
        const as = parseInt(palpite.away);
        if (isNaN(hs) || isNaN(as)) return;

        try {
            if (palpite.id) {
                await supabase.from('bolao_palpites').update({ home_score: hs, away_score: as }).eq('id', palpite.id);
            } else {
                const { data } = await supabase.from('bolao_palpites').insert({
                    bolao_id: bolaoId,
                    user_id: user!.id,
                    match_id: matchId,
                    home_score: hs,
                    away_score: as
                }).select().single();
                if (data) setPalpites(prev => ({ ...prev, [matchId]: { ...prev[matchId], id: data.id } }));
            }
            toast({ title: "Salvo!" });

            // Open Share Dialog
            setShareData({
                homeTeam,
                awayTeam,
                homeScore: hs,
                awayScore: as
            });
            setShareModalOpen(true);
        } catch (error) {
            toast({ title: "Erro ao salvar palpite", variant: "destructive" });
        }
    };

    const updateScore = (matchId: string, type: 'home' | 'away', val: string) => {
        if (isNaN(Number(val)) && val !== '') return;
        setPalpites(p => ({ ...p, [matchId]: { ...p[matchId], [type]: val } }));
    };

    const generateImageBlob = async () => {
        if (!shareRef.current) throw new Error("Ref not found");
        const dataUrl = await toPng(shareRef.current, { cacheBust: true, quality: 0.95 });
        return await (await fetch(dataUrl)).blob();
    };

    const handleShare = async (method: 'whatsapp' | 'copy' | 'download') => {
        try {
            setIsGenerating(true);
            const blob = await generateImageBlob();
            const file = new File([blob], `palpite.png`, { type: "image/png" });

            if (method === 'download') {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'meu-palpite.png';
                link.click();
                toast({ title: "Imagem salva com sucesso!" });
            } else if (method === 'copy') {
                if (navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                    toast({ title: "Copiado para a área de transferência!" });
                } else {
                    toast({ title: "Não suportado no seu navegador", variant: 'destructive' });
                }
            } else if (method === 'whatsapp') {
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: `Meu Palpite`,
                        text: `Olha meu palpite no ArenaCopa!`,
                        files: [file]
                    });
                } else {
                    toast({ title: "Download da imagem foi iniciado. Compartilhe no seu WhatsApp. " });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'meu-palpite.png';
                    link.click();
                }
            }
        } catch (err) {
            toast({ title: "Erro ao compartilhar", variant: "destructive" });
        } finally {
            setIsGenerating(false);
            setShareModalOpen(false);
        }
    };

    return (
        <div className="space-y-4">
            {matches.map(m => {
                const isStarted = m.status === 'live' || m.status === 'finished';
                const p = palpites[m.id] || { home: '', away: '', points: 0, is_exact: false };

                return (
                    <div key={m.id} className="relative p-6 bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden">
                        {isStarted && <div className="absolute inset-0 bg-black/50 z-10 backdrop-blur-sm pointer-events-none flex flex-col items-center justify-center">
                            <Lock className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Palpites Encerrados</span>
                            {m.status === 'finished' && p.id && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-4 flex flex-col items-center">
                                    <span className="text-4xl font-black text-white">{p.points}</span>
                                    <span className="text-[10px] text-primary uppercase font-bold tracking-widest">{p.is_exact ? "Exato 🎯" : "Pts"}</span>
                                </motion.div>
                            )}
                        </div>}

                        <div className="flex justify-between items-center mb-6">
                            <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-500">{new Date(m.match_date).toLocaleDateString('pt-BR')}</div>
                            <div className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-500">{m.stage}</div>
                        </div>

                        <div className="flex items-center justify-center gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <Flag code={m.home_team_code} size="md" />
                                <span className="text-xs font-bold text-gray-400">{m.home_team_code}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={p.home}
                                    onChange={e => updateScore(m.id, 'home', e.target.value)}
                                    className="w-14 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black text-white outline-none focus:border-primary/50"
                                    disabled={isStarted}
                                />
                                <span className="text-gray-600 font-bold">x</span>
                                <input
                                    type="text"
                                    maxLength={2}
                                    value={p.away}
                                    onChange={e => updateScore(m.id, 'away', e.target.value)}
                                    className="w-14 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black text-white outline-none focus:border-primary/50"
                                    disabled={isStarted}
                                />
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <Flag code={m.away_team_code} size="md" />
                                <span className="text-xs font-bold text-gray-400">{m.away_team_code}</span>
                            </div>
                        </div>

                        {!isStarted && (
                            <div className="flex gap-2">
                                <button onClick={() => handleSave(m.id, m.home_team_code, m.away_team_code)} className="flex-1 mt-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">
                                    Salvar Palpite
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent className="bg-[#050505] border-white/10 rounded-[40px] p-8 max-w-sm text-center shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tighter mx-auto uppercase">Compartilhar Palpite</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-6">
                        <button disabled={isGenerating} onClick={() => handleShare('whatsapp')} className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest disabled:opacity-50 hover:bg-[#1EBE5C] transition">
                            <MessageCircle className="w-5 h-5" /> Compartilhar no Zap
                        </button>
                        <button disabled={isGenerating} onClick={() => handleShare('copy')} className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition disabled:opacity-50">
                            <Copy className="w-5 h-5" /> Copiar Imagem
                        </button>
                        <button disabled={isGenerating} onClick={() => handleShare('download')} className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition disabled:opacity-50 border border-white/5">
                            <Download className="w-5 h-5" /> Salvar na Galeria
                        </button>
                    </div>

                    {/* Rendering off-screen */}
                    <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true" ref={shareRef}>
                        {shareData && <ShareCardGenerator type="my_palpite" format="story" data={shareData} />}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
