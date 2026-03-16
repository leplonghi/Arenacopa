import { CircleHelp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function MarketTooltip({ title, description }: { title: string; description?: string }) {
    if (!description) {
        return null;
    }

    return (
        <TooltipProvider delayDuration={120}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:text-white"
                        aria-label={`Entender mercado ${title}`}
                    >
                        <CircleHelp className="h-3.5 w-3.5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] rounded-2xl border-white/10 bg-zinc-950 px-4 py-3 text-left text-xs leading-relaxed text-zinc-200">
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.16em] text-primary">{title}</p>
                    <p>{description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
