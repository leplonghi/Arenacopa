import React, { useEffect } from 'react';
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useMonetization } from "@/contexts/MonetizationContext";

interface AdBannerProps {
    className?: string;
    variant?: "banner" | "large" | "box";
    slotId?: string; // Google AdSense Slot ID
    format?: "auto" | "fluid" | "rectangle";
    onRemove?: () => void;
}

export function AdBanner({ className, variant = "banner", slotId, format = "auto", onRemove }: AdBannerProps) {
    const { isPremium } = useMonetization();

    useEffect(() => {
        if (!isPremium && slotId) {
            try {
                // @ts-expect-error adsbygoogle is injected by Google AdSense script
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error("AdSense error", e);
            }
        }
    }, [isPremium, slotId]);

    if (isPremium) return null;

    // Production Mode: Render Google Ad
    if (slotId) {
        return (
            <div className={cn("w-full flex justify-center overflow-hidden my-2", className)}>
                <ins className="adsbygoogle"
                    style={{ display: 'block', width: '100%' }}
                    data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // TODO: Replace with user's ID
                    data-ad-slot={slotId}
                    data-ad-format={format}
                    data-full-width-responsive="true"></ins>
            </div>
        );
    }

    // Dev/Placeholder Mode
    return (
        <div className={cn(
            "relative w-full bg-secondary/50 border border-border/50 rounded-lg overflow-hidden flex flex-col items-center justify-center text-center p-4 gap-2",
            variant === "banner" && "h-[60px] flex-row justify-between px-4",
            variant === "large" && "h-[120px]",
            variant === "box" && "aspect-square max-w-[300px] mx-auto",
            className
        )}>
            <div className="absolute top-0 right-0 p-1">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest bg-background/80 px-1 rounded-bl">
                    Publicidade
                </span>
            </div>

            <div className="flex flex-col items-center justify-center w-full h-full opacity-70 hover:opacity-100 transition-opacity cursor-pointer group">
                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    Espaço para Anúncio <span className='text-[9px] opacity-50 block'>(Google AdSense)</span>
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                    {variant === "banner" ? "320 x 50" : variant === "large" ? "320 x 100" : "300 x 250"}
                </span>
            </div>

            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-background/50 hover:bg-background text-foreground/50 hover:text-foreground transition-colors z-10"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
