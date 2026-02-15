import { useState, useEffect } from "react";
import { X, Clock } from "lucide-react";
import { AdBanner } from "./AdBanner";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface InterstitialAdProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InterstitialAd({ isOpen, onClose }: InterstitialAdProps) {
    const [countdown, setCountdown] = useState(5);
    const [canClose, setCanClose] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCountdown(5);
            setCanClose(false);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setCanClose(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-background/95 flex flex-col items-center justify-center p-4"
            >
                <div className="w-full max-w-md space-y-4 text-center relative">
                    <h2 className="text-xl font-bold mb-4">Apoie o ArenaCopa</h2>

                    <div className="min-h-[300px] flex items-center justify-center bg-secondary/20 rounded-xl border border-border/50">
                        {/* 
                    TODO: Replace 'slotId' with a real interstitial ad unit ID if using Google AdManager/AdMob Interstitials, 
                    or just use a big distinct ad unit here.
                 */}
                        <AdBanner variant="box" className="w-full h-full" />
                    </div>

                    <div className="pt-4">
                        {canClose ? (
                            <Button onClick={onClose} className="w-full" variant="secondary">
                                Fechar Anúncio <X className="ml-2 w-4 h-4" />
                            </Button>
                        ) : (
                            <Button disabled className="w-full" variant="ghost">
                                Fechar em {countdown}s <Clock className="ml-2 w-4 h-4 animate-pulse" />
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        Quer remover os anúncios? <span className="font-bold text-primary cursor-pointer" onClick={() => {
                            // Logic to open premium modal would go here, 
                            // but since this is usually covering the screen, maybe just close and trigger premium?
                            onClose();
                            // trigger premium modal logic (requires parent callback or global event)
                        }}>Seja Premium</span>
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
