import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWABanner() {
    const { t } = useTranslation("common");
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            const promptEvent = e as BeforeInstallPromptEvent;
            promptEvent.preventDefault();
            setDeferredPrompt(promptEvent);
            setTimeout(() => {
                setShowBanner(true);
            }, 30000); // 30 seconds wait
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the A2HS prompt');
            if (window.plausible) {
                window.plausible('PWA_Install', { props: { success: true } });
            }
        }

        setDeferredPrompt(null);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-[80px] left-4 right-4 md:bottom-4 md:left-auto md:w-96 glass-card p-4 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-white">{t('pwa.title')}</h4>
                <p className="text-[11px] text-muted-foreground">{t('pwa.description')}</p>
            </div>
            <div className="flex flex-col gap-2">
                <button
                    onClick={handleInstallClick}
                    className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                    {t('pwa.install')}
                </button>
            </div>
            <button aria-label={t('common.close')} onClick={() => setShowBanner(false)} className="absolute top-2 right-2 text-muted-foreground p-1">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
