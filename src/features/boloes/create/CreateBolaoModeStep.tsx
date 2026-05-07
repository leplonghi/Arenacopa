import { useNavigate } from "react-router-dom";
import { Users, Store, ArrowRight, Trophy, Megaphone } from "lucide-react";
import type { CreateAudienceMode } from "./useBolaoCreateFlow";
import { ModeChoiceCard } from "@/features/boloes/components/ModeChoiceCard";
import { tStatic } from "@/i18n/staticText";

interface Props {
  onSelect: (mode: CreateAudienceMode) => void;
}

export function CreateBolaoModeStep({ onSelect }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#061a10] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-4 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Voltar
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-4 pb-8 gap-6 justify-center max-w-md mx-auto w-full">
        {/* Title */}
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 font-medium tracking-wide uppercase mb-3">
            <Trophy className="w-3.5 h-3.5 text-[#22c55e]" />
            Criar Bolão
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Qual é o seu objetivo?
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Passe o mouse para saber mais sobre cada opção
          </p>
        </div>

        {/* Mode Cards */}
        <div className="flex flex-col gap-4">
          <ModeChoiceCard
            index={0}
            title="Bolão Tradicional"
            description="Para amigos, família ou grupo privado. Gratuito e divertido."
            tags={["Gratuito", "Amigos & Família", "Grupos"]}
            icon={Users}
            variant="traditional"
            tooltipTitle="Bolão com a turma"
            tooltipDescription="Crie bolões privados ou públicos para disputar com quem você conhece. Sem custos, sem complicação."
            onClick={() => onSelect("personal")}
          />

          <ModeChoiceCard
            index={1}
            title="Para Negócios"
            description="Bares, empresas e eventos. Crie campanhas com patrocínio e prêmios."
            tags={["Bares & Restaurantes", "Empresas", "Eventos"]}
            icon={Store}
            variant="business"
            badge="Negócio"
            tooltipTitle="Campanha comercial"
            tooltipDescription="Ideal para bares, restaurantes e empresas que querem engajar clientes com bolões patrocinados e prêmios reais."
            onClick={() => navigate("/negocios/criar")}
          />
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-center gap-2 text-white/25 text-xs">
          <Megaphone className="w-3.5 h-3.5" />
          <span>{tStatic("Você pode mudar o tipo a qualquer momento")}</span>
        </div>
      </div>
    </div>
  );
}
