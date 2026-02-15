import { X, MessageCircle, Link2, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { BolaoData } from "@/types/bolao";

interface ShareSheetProps {
    open: boolean;
    onClose: () => void;
    bolao: BolaoData;
}

export function ShareSheet({ open, onClose, bolao }: ShareSheetProps) {
    const { t } = useTranslation('bolao');
    const { toast } = useToast();
    const shareRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const shareUrl = `${window.location.origin}/boloes/${bolao.id}?invite=${bolao.invite_code}`;
    const shareText = t('share.invite_msg', { name: bolao.name, code: bolao.invite_code, url: shareUrl });
    const shareTextEncoded = encodeURIComponent(shareText);

    const handleShareImage = async () => {
        if (!shareRef.current) return;

        try {
            setIsGenerating(true);
            const dataUrl = await toPng(shareRef.current, { cacheBust: true, quality: 0.95, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "convite-bolao.png", { type: "image/png" });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Bolão ${bolao.name}`,
                    text: shareText,
                    files: [file]
                });
            } else {
                // Fallback: Download image
                const link = document.createElement("a");
                link.download = `convite-${bolao.invite_code}.png`;
                link.href = dataUrl;
                link.click();
                toast({ title: t('share.image_downloaded'), description: t('share.image_download_desc') });
            }
            onClose();
        } catch (err) {
            console.error("Error generating image:", err);
            toast({ title: t('share.error_image'), variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const options = [
        {
            label: t('share.whatsapp'),
            desc: t('share.whatsapp_desc'),
            icon: MessageCircle,
            color: "bg-[#25D366]",
            bgClass: "bg-[#25D366]/10 border-[#25D366]/20",
            action: () => {
                window.open(`https://wa.me/?text=${shareTextEncoded}`, "_blank");
                onClose();
            }
        },
        {
            label: t('share.instagram'),
            desc: t('share.instagram_desc'),
            icon: Instagram,
            color: "bg-gradient-to-tr from-[#f09433] via-[#bc1888] to-[#285AEB]", // Insta gradient approx
            bgClass: "bg-pink-500/10 border-pink-500/20",
            action: handleShareImage
        },
        {
            label: t('share.copy_link'),
            desc: t('share.copy_desc'),
            icon: Link2,
            color: "bg-blue-500",
            bgClass: "bg-blue-500/10 border-blue-500/20",
            action: () => {
                navigator.clipboard.writeText(shareText);
                toast({ title: t('share.copied') });
                onClose();
            }
        },
    ];

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 400 }}
                        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-border/50 safe-bottom shadow-2xl"
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
                        </div>
                        <div className="px-6 pb-4 pt-2">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-lg font-black tracking-tight">{t('share.title')}</h3>
                                    <p className="text-xs text-muted-foreground">{t('share.subtitle', { name: bolao.name })}</p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 pb-8 space-y-3">
                            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 flex flex-col items-center justify-center text-center space-y-2 mb-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('share.code_label')}</span>
                                <div className="text-3xl font-black tracking-[0.25em] text-primary">{bolao.invite_code}</div>
                            </div>

                            <div className="grid gap-3">
                                {options.map(o => (
                                    <button
                                        key={o.label}
                                        onClick={o.action}
                                        disabled={isGenerating}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98]",
                                            o.bgClass
                                        )}
                                    >
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", o.color)}>
                                            <o.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="text-base font-bold block leading-none mb-1.5">{o.label}</span>
                                            <span className="text-xs text-muted-foreground opacity-80">{o.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Hidden Container for Image Generation - Mobile Story Format (9:16) */}
                    <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
                        <div
                            ref={shareRef}
                            className="relative w-[1080px] h-[1920px] bg-[#09090b] text-white flex flex-col items-center justify-between overflow-hidden font-sans p-16"
                        >
                            {/* Background Elements */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-500/20 via-transparent to-transparent opacity-60"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-60"></div>

                            {/* Header */}
                            <div className="w-full flex justify-between items-start z-10 pt-20">
                                <div className="flex flex-col">
                                    <span className="text-4xl font-black uppercase tracking-widest text-green-500">Arena</span>
                                    <span className="text-4xl font-black uppercase tracking-widest text-white">Copa</span>
                                </div>
                                <div className="px-6 py-2 rounded-full border-2 border-white/20 backdrop-blur-md">
                                    <span className="text-3xl font-bold">2026</span>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col items-center justify-center w-full z-10 space-y-12">
                                <div className="relative">
                                    <div className="absolute -inset-10 bg-green-500/20 blur-3xl rounded-full"></div>
                                    <TrophyIcon className="w-48 h-48 text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
                                </div>

                                <div className="text-center space-y-6 max-w-2xl">
                                    <h2 className="text-5xl font-medium text-white/80">{t('share.image_title')}</h2>
                                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-yellow-400 to-blue-500 leading-tight py-4">
                                        {bolao.name}
                                    </h1>
                                </div>

                                <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 flex flex-col items-center space-y-4">
                                    <span className="text-3xl uppercase tracking-widest font-bold text-white/60">{t('share.code_label')}</span>
                                    <span className="text-9xl font-black tracking-[0.1em] text-white font-mono">{bolao.invite_code}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="z-10 w-full text-center pb-20 space-y-6">
                                <div className="inline-block px-12 py-6 rounded-full bg-white text-black text-4xl font-bold shadow-xl">
                                    {t('share.image_cta')}
                                </div>
                                <p className="text-3xl text-white/60 font-medium">arenacopa.app</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

// Icon helper for the share image
function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}

