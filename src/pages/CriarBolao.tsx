import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Lock, Globe, Trophy, Camera, HelpCircle } from "lucide-react";

const steps = ["Info", "Configurações", "Pontuação"];

const CriarBolao = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [hasEntryFee, setHasEntryFee] = useState(false);

  return (
    <div className="px-4 py-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Passo {step + 1} de {steps.length}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {steps[step]}
        </span>
      </div>
      <div className="w-full h-1 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step 1: Settings */}
      {step === 0 && (
        <div className="space-y-6">
          {/* Upload cover */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-2 relative">
              <Trophy className="w-8 h-8 text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Upload Pool Cover</span>
          </div>

          {/* Pool Name */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Nome do Bolão</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Copa dos Amigos 2026"
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Motto / Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="May the best predictor win!"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          {/* Privacy */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Privacidade</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "private" as const, icon: Lock, label: "Private", desc: "Invite only via code" },
                { id: "public" as const, icon: Globe, label: "Public", desc: "Anyone can join" },
              ]).map(p => (
                <button
                  key={p.id}
                  onClick={() => setPrivacy(p.id)}
                  className={cn(
                    "glass-card p-4 text-left transition-all relative",
                    privacy === p.id && "ring-2 ring-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p.icon className="w-5 h-5 text-muted-foreground" />
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 transition-colors",
                      privacy === p.id ? "bg-primary border-primary" : "border-muted-foreground"
                    )} />
                  </div>
                  <span className="text-sm font-bold block">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prize Distribution */}
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider">Distribuição</span>
              </div>
              <button className="text-[10px] font-bold px-3 py-1 rounded-full border border-border text-muted-foreground">
                Editar
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { rank: 1, label: "Winner", pct: 60 },
                { rank: 2, label: "Runner Up", pct: 30 },
                { rank: 3, label: "Third Place", pct: 10 },
              ].map(d => (
                <div key={d.rank} className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black",
                    d.rank === 1 ? "bg-copa-success text-background" :
                    d.rank === 2 ? "bg-copa-success/70 text-background" :
                    "bg-copa-success/40 text-background"
                  )}>
                    {d.rank}
                  </div>
                  <span className="text-sm font-medium flex-1">{d.label}</span>
                  <span className="text-sm font-black text-primary">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Entry Fee */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold block">Entry Fee</span>
              <span className="text-[11px] text-muted-foreground">Require payment to join pool</span>
            </div>
            <button
              onClick={() => setHasEntryFee(!hasEntryFee)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                hasEntryFee ? "bg-primary" : "bg-secondary"
              )}
            >
              <span className={cn(
                "absolute top-1 w-5 h-5 rounded-full bg-foreground shadow transition-transform",
                hasEntryFee ? "left-6" : "left-1"
              )} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="glass-card p-6 text-center">
            <span className="text-3xl mb-3 block">⚙️</span>
            <h3 className="text-base font-black mb-1">Configurações de Pontuação</h3>
            <p className="text-xs text-muted-foreground">Defina como os pontos serão calculados para cada palpite.</p>
          </div>
          {[
            { label: "Resultado Exato", pts: "5 pts", desc: "Acertar placar exato" },
            { label: "Vencedor Correto", pts: "3 pts", desc: "Acertar quem ganha" },
            { label: "Empate Correto", pts: "2 pts", desc: "Acertar empate" },
            { label: "Campeão", pts: "20 pts", desc: "Acertar o campeão" },
          ].map(r => (
            <div key={r.label} className="glass-card p-4 flex items-center gap-3">
              <div className="flex-1">
                <span className="text-sm font-bold block">{r.label}</span>
                <span className="text-[11px] text-muted-foreground">{r.desc}</span>
              </div>
              <span className="text-sm font-black text-primary">{r.pts}</span>
            </div>
          ))}
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="glass-card p-6 text-center">
            <span className="text-3xl mb-3 block">🎯</span>
            <h3 className="text-base font-black mb-1">Revisar e Criar</h3>
            <p className="text-xs text-muted-foreground">Confira as configurações do seu bolão.</p>
          </div>
          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Nome</span><span className="text-xs font-bold">{name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Privacidade</span><span className="text-xs font-bold">{privacy === "private" ? "Privado" : "Público"}</span></div>
            <div className="flex justify-between"><span className="text-xs text-muted-foreground">Entry Fee</span><span className="text-xs font-bold">{hasEntryFee ? "Sim" : "Não"}</span></div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        )}
        <button
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else navigate("/boloes");
          }}
          className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-1 uppercase tracking-wider"
        >
          {step < 2 ? (
            <>Próximo Passo <ChevronRight className="w-4 h-4" /></>
          ) : (
            "Criar Bolão"
          )}
        </button>
      </div>
    </div>
  );
};

export default CriarBolao;
