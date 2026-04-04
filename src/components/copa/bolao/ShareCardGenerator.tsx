import React, { forwardRef, useEffect, useState } from "react";
import * as htmlToImage from "html-to-image";
import { Flag } from "@/components/Flag";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

export type ShareCardType = 'join_bolao' | 'my_palpite' | 'goal_reaction' | 'exact_score' | 'leader_rank' | 'phase_summary' | 'champion';
export type ShareCardFormat = 'story' | 'feed' | 'twitter';

interface ShareCardProps {
    type: ShareCardType;
    format: ShareCardFormat;
    data: {
        avatar_url?: string | null;
        name?: string;
        description?: string | null;
        invite_code?: string;
        homeTeam?: string;
        awayTeam?: string;
        homeScore?: number | string;
        awayScore?: number | string;
    };
    onReady?: (dataUrl: string) => void;
}

export const ShareCardGenerator = forwardRef<HTMLDivElement, ShareCardProps>(({ type, format, data, onReady }, ref) => {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    const getContainerSize = () => {
        switch (format) {
            case 'story': return { width: 1080, height: 1920, scale: 0.5 };
            case 'twitter': return { width: 1200, height: 628, scale: 0.8 };
            case 'feed':
            default: return { width: 1080, height: 1080, scale: 0.8 };
        }
    };

    const dims = getContainerSize();

    useEffect(() => {
        if (!ref || typeof ref === 'function') return;
        const node = ref.current;
        if (!node) return;

        // Small delay to ensure all assets (flags/fonts) are loaded
        const timer = setTimeout(() => {
            htmlToImage.toPng(node, {
                width: dims.width,
                height: dims.height,
                pixelRatio: 1, // To avoid massive files on high DPI devices
                skipFonts: false,
                style: {
                    transform: 'scale(1)', // Reset the scale used for hiding it visually
                }
            })
                .then((dataUrl) => {
                    setDataUrl(dataUrl);
                    if (onReady) onReady(dataUrl);
                })
                .catch((err) => {
                    console.error("Error generating share card", err);
                    toast({ title: t('palpites.error_generate'), variant: 'destructive' });
                });
        }, 800);

        return () => clearTimeout(timer);
    }, [data, dims.height, dims.width, format, onReady, ref, t, toast, type]);

    // We render off-screen with transform scale so it doesn't take space
    return (
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
            <div
                ref={ref}
                style={{
                    width: `${dims.width}px`,
                    height: `${dims.height}px`,
                    overflow: 'hidden',
                    backgroundColor: '#050505',
                    fontFamily: 'Inter, sans-serif'
                }}
                className="flex flex-col items-center justify-center relative p-10 bg-gradient-to-br from-[#050505] via-[#082016] to-[#0a0a0a]"
            >
                {/* Visual elements shared across all cards */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[200px] rounded-full mix-blend-screen pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />

                {/* Content switch */}
                {type === 'join_bolao' && (
                    <div className="flex flex-col items-center text-center z-10 w-full max-w-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[60px] p-20 shadow-[0_0_100px_rgba(34,197,94,0.1)]">
                        <div className="text-[100px] mb-8">{data.avatar_url || '🏆'}</div>
                        <h3 className="text-[32px] font-black uppercase tracking-[0.3em] text-primary mb-4">Vem pro Bolão</h3>
                        <h1 className="text-[80px] font-black leading-[0.9] text-white tracking-tighter mb-8">{data.name}</h1>
                        <p className="text-[32px] font-medium text-gray-400 mb-12">{data.description || 'Entre na arena e prove quem manda.'}</p>
                        <div className="px-16 py-8 rounded-3xl bg-white/10 border border-white/20 inline-block">
                            <span className="text-[24px] uppercase tracking-widest text-gray-400 font-black block mb-2">CÓDIGO SECRETO</span>
                            <span className="text-[64px] font-mono text-white tracking-[0.2em]">{data.invite_code}</span>
                        </div>
                        <div className="mt-16 text-[24px] text-gray-500 font-bold uppercase tracking-widest">Acesse: arenacopa.app/b/{data.invite_code}</div>
                    </div>
                )}

                {type === 'my_palpite' && (
                    <div className="flex flex-col items-center text-center z-10 w-full max-w-4xl pt-20">
                        <div className="px-12 py-4 bg-primary text-black rounded-full font-black text-[32px] uppercase tracking-widest mb-16 shadow-[0_0_50px_rgba(34,197,94,0.5)]">MEU PALPITE ESTÁ LANÇADO!</div>

                        <div className="flex items-center justify-between w-full bg-white/[0.03] border border-white/10 rounded-[60px] p-24 backdrop-blur-2xl">
                            <div className="flex flex-col items-center gap-8">
                                <div className="w-[200px] h-[200px]"><Flag code={data.homeTeam} size="lg" /></div>
                                <span className="text-[40px] font-bold text-gray-400">{data.homeTeam}</span>
                            </div>

                            <div className="flex gap-16 items-center">
                                <div className="text-[120px] font-black text-white bg-white/5 px-12 py-8 rounded-[40px]">{data.homeScore}</div>
                                <div className="text-[40px] text-gray-600 font-bold uppercase">VS</div>
                                <div className="text-[120px] font-black text-white bg-white/5 px-12 py-8 rounded-[40px]">{data.awayScore}</div>
                            </div>

                            <div className="flex flex-col items-center gap-8">
                                <div className="w-[200px] h-[200px]"><Flag code={data.awayTeam} size="lg" /></div>
                                <span className="text-[40px] font-bold text-gray-400">{data.awayTeam}</span>
                            </div>
                        </div>

                        <div className="mt-16 text-[32px] font-black text-white flex items-center gap-4">
                            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center text-black">🎯</div>
                            Arena CUP 2026
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
});

ShareCardGenerator.displayName = 'ShareCardGenerator';
