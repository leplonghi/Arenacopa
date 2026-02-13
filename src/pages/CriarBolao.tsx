import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, AlertTriangle } from "lucide-react";

const steps = ["Info", "Pontuação", "Contribuição"];

const modules = [
  { id: "resultado", label: "Resultado", desc: "Acertar vencedor ou empate" },
  { id: "placar", label: "Placar Exato", desc: "Acertar o placar exato do jogo" },
  { id: "campeao", label: "Campeão", desc: "Acertar o campeão da Copa" },
  { id: "classificacao", label: "Classificação Grupo", desc: "Acertar a ordem final do grupo" },
];

const scoringTemplates = [
  { id: "classico", label: "Clássico", rules: "Resultado: 3pts, Placar: 5pts, Campeão: 20pts" },
  { id: "arrojado", label: "Arrojado", rules: "Resultado: 2pts, Placar: 7pts, Campeão: 30pts" },
  { id: "custom", label: "Personalizado", rules: "Defina suas próprias regras" },
];

const distributions = [
  { id: "top3", label: "Top 3", splits: "50% / 30% / 20%" },
  { id: "top5", label: "Top 5", splits: "35% / 25% / 20% / 12% / 8%" },
  { id: "custom", label: "Personalizado", splits: "Defina seus %" },
];

const CriarBolao = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [selectedModules, setSelectedModules] = useState<string[]>(["resultado"]);
  const [scoring, setScoring] = useState("classico");
  const [hasContribution, setHasContribution] = useState(false);
  const [distribution, setDistribution] = useState("top3");

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="px-4 py-4">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
              i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            )}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={cn("text-xs ml-1.5 font-medium hidden sm:block", i <= step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            {i < steps.length - 1 && <div className={cn("flex-1 h-0.5 mx-2 rounded", i < step ? "bg-primary" : "bg-secondary")} />}
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Nome do Bolão</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Copa dos Amigos"
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Privacidade</label>
            <div className="grid grid-cols-2 gap-2">
              {(["private", "public"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPrivacy(p)}
                  className={cn(
                    "glass-card p-3 text-center transition-all",
                    privacy === p && "ring-2 ring-primary"
                  )}
                >
                  <span className="text-lg block mb-1">{p === "private" ? "🔒" : "🌍"}</span>
                  <span className="text-xs font-bold">{p === "private" ? "Privado" : "Público"}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Módulos de Palpite</label>
            <div className="space-y-2">
              {modules.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={cn(
                    "glass-card w-full p-3 flex items-center gap-3 text-left transition-all",
                    selectedModules.includes(m.id) && "ring-1 ring-primary bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    selectedModules.includes(m.id) ? "bg-primary border-primary" : "border-muted-foreground"
                  )}>
                    {selectedModules.includes(m.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{m.label}</span>
                    <span className="text-xs text-muted-foreground">{m.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Scoring */}
      {step === 1 && (
        <div className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Template de Pontuação</label>
          <div className="space-y-2">
            {scoringTemplates.map(t => (
              <button
                key={t.id}
                onClick={() => setScoring(t.id)}
                className={cn(
                  "glass-card w-full p-4 text-left transition-all",
                  scoring === t.id && "ring-2 ring-primary"
                )}
              >
                <span className="text-sm font-bold block mb-0.5">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.rules}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Contribution */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Contribuição Externa</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setHasContribution(false)}
                className={cn("glass-card p-3 text-center", !hasContribution && "ring-2 ring-primary")}
              >
                <span className="text-lg block mb-1">🤝</span>
                <span className="text-xs font-bold">Social (sem grana)</span>
              </button>
              <button
                onClick={() => setHasContribution(true)}
                className={cn("glass-card p-3 text-center", hasContribution && "ring-2 ring-primary")}
              >
                <span className="text-lg block mb-1">💰</span>
                <span className="text-xs font-bold">Com contribuição</span>
              </button>
            </div>
          </div>

          {hasContribution && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Distribuição da Premiação</label>
              <div className="space-y-2 mb-4">
                {distributions.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDistribution(d.id)}
                    className={cn(
                      "glass-card w-full p-3 text-left transition-all",
                      distribution === d.id && "ring-2 ring-primary"
                    )}
                  >
                    <span className="text-sm font-bold">{d.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{d.splits}</span>
                  </button>
                ))}
              </div>

              <div className="glass-card p-3 flex items-start gap-2 border-primary/30">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">ArenaCopa não processa dinheiro.</span> A contribuição é registrada apenas para controle entre os participantes. Toda movimentação financeira é de responsabilidade dos organizadores.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        )}
        <button
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else navigate("/boloes");
          }}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-1"
        >
          {step < 2 ? (
            <>Próximo <ChevronRight className="w-4 h-4" /></>
          ) : (
            "Criar Bolão"
          )}
        </button>
      </div>
    </div>
  );
};

export default CriarBolao;
