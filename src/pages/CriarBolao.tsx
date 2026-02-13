import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Lock, Globe, Trophy, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const steps = ["Informações", "Revisar"];

const CriarBolao = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"private" | "public">("private");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("boloes")
        .insert({
          name: name.trim(),
          description: description.trim(),
          creator_id: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Auto-join as admin
      await supabase.from("bolao_members").insert({
        bolao_id: data.id,
        user_id: user.id,
        role: "admin",
      });

      toast({ title: "Bolão criado! 🎉", description: "Compartilhe o código de convite com seus amigos." });
      navigate(`/boloes/${data.id}`);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const canProceed = name.trim().length >= 3;

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

      {/* Step 1: Info */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-muted-foreground/30 flex items-center justify-center mb-2 relative">
              <Trophy className="w-8 h-8 text-muted-foreground" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Camera className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Capa do Bolão</span>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Nome do Bolão *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Copa dos Amigos 2026"
              className="w-full px-4 py-3.5 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {name.length > 0 && name.trim().length < 3 && (
              <span className="text-[10px] text-destructive mt-1 block">Mínimo de 3 caracteres</span>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Que o melhor palpiteiro vença!"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 block">Privacidade</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: "private" as const, icon: Lock, label: "Privado", desc: "Apenas com convite" },
                { id: "public" as const, icon: Globe, label: "Público", desc: "Qualquer um pode entrar" },
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

          {/* Scoring info */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider">Pontuação</span>
            </div>
            <div className="space-y-2">
              {[
                { label: "Resultado Exato", pts: "5 pts", desc: "Acertar placar exato" },
                { label: "Vencedor Correto", pts: "3 pts", desc: "Acertar quem ganha" },
                { label: "Empate Correto", pts: "2 pts", desc: "Acertar empate" },
                { label: "Campeão", pts: "20 pts", desc: "Acertar o campeão" },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-xs font-bold">{r.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">— {r.desc}</span>
                  </div>
                  <span className="text-xs font-black text-primary">{r.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass-card p-3 border-dashed border-muted-foreground/20">
            <p className="text-[10px] text-muted-foreground leading-relaxed text-center">
              ⚠️ O ArenaCopa <span className="font-bold">não realiza</span> processamento de pagamentos ou transações financeiras. Eventuais valores devem ser combinados entre os participantes, fora do aplicativo.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="glass-card p-6 text-center">
            <span className="text-3xl mb-3 block">🎯</span>
            <h3 className="text-base font-black mb-1">Revisar e Criar</h3>
            <p className="text-xs text-muted-foreground">Confira as configurações do seu bolão.</p>
          </div>
          <div className="glass-card p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Nome</span>
              <span className="text-xs font-bold">{name || "—"}</span>
            </div>
            {description && (
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Descrição</span>
                <span className="text-xs font-bold truncate max-w-[180px]">{description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Privacidade</span>
              <span className="text-xs font-bold">{privacy === "private" ? "Privado" : "Público"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">Premiação</span>
              <span className="text-xs font-bold">Definida entre participantes</span>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="text-xs font-black uppercase tracking-wider mb-2">O que acontece depois?</h4>
            <div className="space-y-2">
              {[
                "Um código de convite será gerado automaticamente",
                "Você será o administrador do bolão",
                "Compartilhe o código com seus amigos para convidá-los",
                "Cada participante faz seus palpites nos jogos da Copa",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
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
            if (step < 1) setStep(step + 1);
            else handleCreate();
          }}
          disabled={!canProceed || creating}
          className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-1 uppercase tracking-wider disabled:opacity-50"
        >
          {step < 1 ? (
            <>Próximo <ChevronRight className="w-4 h-4" /></>
          ) : creating ? (
            "Criando..."
          ) : (
            "Criar Bolão 🏆"
          )}
        </button>
      </div>
    </div>
  );
};

export default CriarBolao;
