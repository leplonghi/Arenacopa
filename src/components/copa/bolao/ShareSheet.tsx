import { X, MessageCircle, Link2, Instagram } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { type BolaoData } from "@/types/bolao";
import { QRCodeSVG } from "qrcode.react";
import { ShareCardGenerator } from "./ShareCardGenerator";
import { getInviteUrl } from "@/utils/site-url";
import { openWhatsAppShare } from "@/lib/security";

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

    const shareUrl = getInviteUrl(`/b/${bolao.invite_code}?utm_source=app&utm_medium=share_sheet&utm_campaign=bolao_invite`);
    const shareText = t('share.invite_msg', { name: bolao.name, code: bolao.invite_code, url: shareUrl });

    const handleShareImage = async () => {
        if (!shareRef.current) return;
        try {
            setIsGenerating(true);
            const dataUrl = await toPng(shareRef.current, { cacheBust: true, quality: 0.95, pixelRatio: 2 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `bolao-${bolao.invite_code}.png`, { type: "image/png" });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ title: bolao.name, text: shareText, files: [file] });
            } else {
                const link = document.createElement("a");
                link.download = `bolao-${bolao.invite_code}.png`;
                link.href = dataUrl;
                link.click();
                toast({ title: t('share.image_downloaded') });
            }
            onClose();
        } catch (err) {
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
                if (!openWhatsAppShare(shareText)) {
                    navigator.clipboard.writeText(shareText);
                    toast({ title: t('share.copied') });
                    onClose();
                    return;
                }
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
                            <div className="p-4 rounded-[24px] bg-secondary border border-border flex flex-col items-center justify-center text-center space-y-4 mb-4">
                                <QRCodeSVG value={shareUrl} size={150} bgColor="transparent" fgColor="#fff" level="Q" className="p-2 bg-white/5 rounded-2xl" />
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('share.code_label')}</span>
                                    <div className="text-3xl font-black tracking-[0.25em] text-primary">{bolao.invite_code}</div>
                                </div>
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

                    <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true" ref={shareRef}>
                        <ShareCardGenerator type="join_bolao" format="story" data={bolao} />
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

