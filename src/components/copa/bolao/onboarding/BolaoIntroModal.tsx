import { Compass, Layers3, Sparkles, Swords, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BolaoIntroModalProps = {
    open: boolean;
    bolaoName: string;
    formatLabel: string | null;
    matchMarketsCount: number;
    phaseMarketsCount: number;
    tournamentMarketsCount: number;
    specialMarketsCount: number;
    onClose: () => void;
    onGoToPredictions: () => void;
};

function ScopeCard({
    icon,
    title,
    description,
    count,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    count: number;
}) {
    return (
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-black text-white">{title}</p>
                    <p className="text-xs text-zinc-400">{description}</p>
                </div>
            </div>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                {count} mercado{count === 1 ? "" : "s"} ativo{count === 1 ? "" : "s"}
            </p>
        </div>
    );
}

export function BolaoIntroModal({
    open,
    bolaoName,
    formatLabel,
    matchMarketsCount,
    phaseMarketsCount,
    tournamentMarketsCount,
    specialMarketsCount,
    onClose,
    onGoToPredictions,
}: BolaoIntroModalProps) {
    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
            <DialogContent className="surface-dialog overflow-hidden sm:max-w-2xl">
                <DialogHeader>
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[24px] bg-primary/12 text-primary">
                        <Compass className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-2xl font-black text-white">
                        Como funciona o bolão <span className="text-primary">{bolaoName}</span>
                    </DialogTitle>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                        Este bolão usa o formato <span className="font-black text-white">{formatLabel ?? "Clássico"}</span>.
                        Você pode entrar pelos palpites de jogo e depois explorar os mercados extras conforme a liga evoluir.
                    </p>
                </DialogHeader>

                <div className="grid gap-4 md:grid-cols-2">
                    <ScopeCard
                        icon={<Swords className="h-5 w-5" />}
                        title="Por jogo"
                        description="Placares, vencedor, total de gols e mercados da partida."
                        count={matchMarketsCount}
                    />
                    <ScopeCard
                        icon={<Layers3 className="h-5 w-5" />}
                        title="Por fase"
                        description="Classificados, semifinalistas, finalistas e outros marcos."
                        count={phaseMarketsCount}
                    />
                    <ScopeCard
                        icon={<Trophy className="h-5 w-5" />}
                        title="Campeonato"
                        description="Campeão, vice, artilheiro e leituras do torneio."
                        count={tournamentMarketsCount}
                    />
                    <ScopeCard
                        icon={<Sparkles className="h-5 w-5" />}
                        title="Especiais"
                        description="Power play, confidence, survivor e formatos avançados."
                        count={specialMarketsCount}
                    />
                </div>

                <div className="mt-2 rounded-[24px] border border-white/10 bg-black/10 p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Melhor caminho para começar</p>
                    <p className="mt-2 text-sm text-zinc-400">
                        Comece pela aba de palpites da partida. Nela você salva seus resultados principais e, quando o formato pedir, também registra mercados extras ligados ao jogo.
                    </p>
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onClose}
                        className="surface-card-soft flex-1 rounded-[22px] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200"
                    >
                        Entendi
                    </button>
                    <button
                        type="button"
                        onClick={onGoToPredictions}
                        className="flex-1 rounded-[22px] bg-primary px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-black"
                    >
                        Ir para meus palpites
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
