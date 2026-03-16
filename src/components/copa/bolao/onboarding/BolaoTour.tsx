import type { ReactNode } from "react";
import { BarChart3, Compass, Layers3, Sparkles, Swords, X } from "lucide-react";

type TourTab = "ranking" | "jogos" | "fase" | "extras" | "especiais";

const tourContent: Record<TourTab, { title: string; description: string; icon: ReactNode }> = {
    ranking: {
        title: "Leia o ranking como um painel tático",
        description: "Agora o ranking mostra de onde vêm seus pontos: jogo, fase, campeonato e especiais. Isso ajuda a entender onde você está crescendo ou ficando para trás.",
        icon: <BarChart3 className="h-5 w-5" />,
    },
    jogos: {
        title: "Comece pelos mercados de partida",
        description: "Aqui ficam os palpites mais frequentes do bolão. Salve placar, vencedor e mercados ligados ao jogo para montar sua base de pontos.",
        icon: <Swords className="h-5 w-5" />,
    },
    fase: {
        title: "Mercados de fase viram o jogo",
        description: "Classificados, semifinalistas e finalistas costumam mudar muito o ranking. Vale revisar essa aba sempre que uma fase nova estiver perto de começar.",
        icon: <Layers3 className="h-5 w-5" />,
    },
    extras: {
        title: "Mercados de campeonato dão personalidade ao bolão",
        description: "Campeão, vice, artilheiro e totais do torneio são apostas mais estratégicas e valiosas ao longo do campeonato.",
        icon: <Compass className="h-5 w-5" />,
    },
    especiais: {
        title: "Especiais são o diferencial da liga",
        description: "Use survivor, confidence, power play e bracket para buscar vantagem fora do palpite clássico de placar.",
        icon: <Sparkles className="h-5 w-5" />,
    },
};

export function BolaoTour({
    tab,
    onDismiss,
}: {
    tab: TourTab;
    onDismiss: () => void;
}) {
    const content = tourContent[tab];

    return (
        <div className="mb-6 rounded-[28px] border border-primary/20 bg-primary/8 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        {content.icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">Dica rápida do bolão</p>
                        <h3 className="mt-2 text-lg font-black text-white">{content.title}</h3>
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">{content.description}</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onDismiss}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:text-white"
                    aria-label="Fechar dica do bolão"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
