import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { createGroup } from "@/services/groups/group-access.service";
import type { GroupAdmissionMode, GroupVisibility } from "@/types/group-access";
import { useToast } from "@/hooks/use-toast";
import { trackSocialEvent } from "@/lib/analytics/social.telemetry";
import { tStatic } from "@/i18n/staticText";

type GroupCreateStep = "purpose" | "identity" | "launch";

export function GroupCreationFlow() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<GroupCreateStep>("purpose");
  const [loading, setLoading] = useState(false);
  const [objective, setObjective] = useState("friends");
  const [visibility, setVisibility] = useState<GroupVisibility>("private");
  const [admissionMode, setAdmissionMode] = useState<GroupAdmissionMode>("approval");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("👥");
  const completedRef = useRef(false);
  const stepRef = useRef<GroupCreateStep>(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => () => {
    if (!completedRef.current) {
      trackSocialEvent("step_abandoned", {
        flow: "group_create",
        step: stepRef.current,
      });
    }
  }, []);

  const create = async (nextAction: "group_only" | "group_and_pool") => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Dê um nome claro para o grupo antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      trackSocialEvent("group_create_started", {
        visibility,
        admission_mode: admissionMode,
      });
      const group = await createGroup({
        payload: {
          presentation: {
            name: name.trim(),
            description: description.trim(),
            emoji,
            objective,
          },
          visibility,
          admission_mode: admissionMode,
        },
      });

      toast({
        title: "Grupo criado",
        description: `Código de convite: ${group.inviteCode}`,
      });
      completedRef.current = true;
      trackSocialEvent("group_create_completed", {
        visibility,
        admission_mode: admissionMode,
      });

      if (nextAction === "group_and_pool") {
        navigate(`/boloes/criar?grupoId=${group.id}`);
        return;
      }

      navigate(`/grupos/${group.id}`);
    } catch {
      toast({
        title: "Não foi possível criar o grupo",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{tStatic("Criar grupo")}</p>

      {step === "purpose" ? (
        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-3xl font-black">{tStatic("Qual é o papel desse grupo?")}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Primeiro definimos o contexto social. A identidade vem depois.
            </p>
          </div>

          <div className="grid gap-3">
            {[
              {
                id: "friends",
                title: "Turma privada",
                description: "Ideal para equipe, sala, familia, amigos ou qualquer grupo fechado.",
              },
              {
                id: "community",
                title: "Comunidade aberta",
                description: "Grupo público, pensado para descoberta e crescimento.",
              },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  setObjective(option.id);
                  if (option.id === "community") {
                    setVisibility("public");
                    setAdmissionMode("direct_code_or_invite");
                  } else {
                    setVisibility("private");
                    setAdmissionMode("approval");
                  }
                }}
                className={`rounded-3xl border p-4 text-left transition-colors ${
                  objective === option.id ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                }`}
              >
                <p className="font-black">{option.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">{tStatic("Privacidade e entrada")}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <button
                onClick={() => {
                  setVisibility("private");
                  setAdmissionMode("approval");
                }}
                className={`rounded-2xl border p-4 text-left ${
                  visibility === "private" ? "border-primary bg-primary/10" : "border-white/10 bg-[#0c1811]"
                }`}
              >
                <p className="font-black">{tStatic("Privado com aprovação")}</p>
                <p className="mt-1 text-sm text-zinc-400">{tStatic("Quem chega pede entrada. Você aprova com calma.")}</p>
              </button>
              <button
                onClick={() => {
                  setVisibility("public");
                  setAdmissionMode("direct_code_or_invite");
                }}
                className={`rounded-2xl border p-4 text-left ${
                  visibility === "public" ? "border-primary bg-primary/10" : "border-white/10 bg-[#0c1811]"
                }`}
              >
                <p className="font-black">{tStatic("Público com link ou código")}</p>
                <p className="mt-1 text-sm text-zinc-400">{tStatic("Mais simples para compartilhar sem abrir tudo demais.")}</p>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep("identity")}
              className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === "identity" ? (
        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-3xl font-black">{tStatic("Agora sim, dê identidade ao grupo")}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              O nome vem depois da estrutura, para fazer sentido de verdade para quem entra.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["👥", "⚽", "🏆", "🔥", "🎯", "🎉", "🦁", "🚀"].map((value) => (
              <button
                key={value}
                onClick={() => setEmoji(value)}
                className={`rounded-2xl border p-3 text-2xl ${
                  emoji === value ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="grid gap-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome do grupo"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-lg font-black text-white"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Uma frase curta para explicar a vibe do grupo"
              className="min-h-[120px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("purpose")}
              className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
            >
              Voltar
            </button>
            <button
              onClick={() => setStep("launch")}
              className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black"
            >
              Continuar
            </button>
          </div>
        </div>
      ) : null}

      {step === "launch" ? (
        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-3xl font-black">{tStatic("Grupo pronto. O que você quer fazer agora?")}</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Você pode subir o grupo e parar por aí, ou já seguir direto para o bolão.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
            <p><strong className="text-white">{tStatic("Grupo:")}</strong> {name || "Sem nome"}</p>
            <p className="mt-2"><strong className="text-white">{tStatic("Entrada:")}</strong> {visibility === "public" ? "Público com link ou código" : "Privado com aprovação"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => void create("group_only")}
              disabled={loading}
              className="rounded-3xl border border-white/10 bg-white/5 px-5 py-5 text-left"
            >
              <p className="font-black">{tStatic("Criar grupo primeiro")}</p>
              <p className="mt-1 text-sm text-zinc-400">{tStatic("Crie o grupo e convide sua turma. O bolão pode vir depois.")}</p>
            </button>
            <button
              onClick={() => void create("group_and_pool")}
              disabled={loading}
              className="rounded-3xl bg-primary px-5 py-5 text-left text-black"
            >
              <p className="font-black">{tStatic("Criar grupo e já seguir para o bolão")}</p>
              <p className="mt-1 text-sm text-black/80">{tStatic("Ideal para não quebrar o fluxo quando a intenção já está clara.")}</p>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("identity")}
              className="rounded-2xl border border-white/10 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white"
            >
              Voltar
            </button>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
