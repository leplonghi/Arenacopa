import { useNavigate } from "react-router-dom";
import { Users, Store, ArrowRight, Trophy, Megaphone } from "lucide-react";
import type { CreateAudienceMode } from "./useBolaoCreateFlow";

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
            Escolha o tipo de bolão que melhor se encaixa na sua necessidade
          </p>
        </div>

        {/* Mode Cards */}
        <div className="flex flex-col gap-3">
          {/* Traditional */}
          <button
            onClick={() => onSelect("personal")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-[#22c55e]/40 transition-all duration-200 text-left p-5 active:scale-[0.98]"
          >
            {/* Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-[#22c55e]/8 via-transparent to-transparent pointer-events-none" />

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/25 flex items-center justify-center group-hover:bg-[#22c55e]/20 transition-colors">
                <Users className="w-6 h-6 text-[#22c55e]" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-base">Bolão Tradicional</span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#22c55e] group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Para amigos, família ou grupo privado. Gratuito e divertido.
                </p>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["Gratuito", "Amigos & Família", "Grupos"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-[#22c55e]/80 bg-[#22c55e]/10 border border-[#22c55e]/15 rounded-full px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>

          {/* Business */}
          <button
            onClick={() => navigate("/negocios/criar")}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 hover:border-amber-400/40 transition-all duration-200 text-left p-5 active:scale-[0.98]"
          >
            {/* Glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-amber-400/8 via-transparent to-transparent pointer-events-none" />

            {/* PRO badge */}
            <div className="absolute top-3 right-3 bg-amber-400/15 border border-amber-400/30 rounded-full px-2 py-0.5 text-[10px] font-bold text-amber-400 tracking-wide">
              NEGÓCIO
            </div>

            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center group-hover:bg-amber-400/20 transition-colors">
                <Store className="w-6 h-6 text-amber-400" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 pr-14">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-base">Para Negócios</span>
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all absolute right-5" />
                </div>
                <p className="text-white/50 text-sm leading-relaxed">
                  Bares, empresas e eventos. Crie campanhas com patrocínio e prêmios.
                </p>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["Bares & Restaurantes", "Empresas", "Eventos"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-amber-400/80 bg-amber-400/10 border border-amber-400/15 rounded-full px-2 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom hint */}
        <div className="flex items-center justify-center gap-2 text-white/25 text-xs">
          <Megaphone className="w-3.5 h-3.5" />
          <span>Você pode mudar o tipo a qualquer momento</span>
        </div>
      </div>
    </div>
  );
}
