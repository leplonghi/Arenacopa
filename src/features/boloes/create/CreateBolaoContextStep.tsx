import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users2 } from "lucide-react";
import { useUserGroups } from "@/hooks/useUserGroups";
import { cn } from "@/lib/utils";
import { CreateGroupDialog } from "@/features/groups/create/CreateGroupDialog";
import { getToneClasses } from "@/features/boloes/create/stepColors";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

const CONTEXT_OPTIONS = [
  {
    id: "standalone" as const,
    emoji: "🏠",
    title: "Bolão independente",
    description: "Sem vínculo com grupo. Qualquer pessoa com o link pode entrar.",
  },
  {
    id: "existing_group" as const,
    emoji: "👥",
    title: "Dentro de um grupo",
    description: "Vincula o bolão a uma turma que você já administra.",
  },
];

export function CreateBolaoContextStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const { groups: availableGroups, isLoading } = useUserGroups();
  const tone = getToneClasses(3);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const selectedMode = flow.state.contextMode;



  return (
    <div className="mx-auto max-w-5xl pb-8 text-white">
      <p className="break-words text-[11px] font-black uppercase leading-tight tracking-[0.2em] text-primary mt-4">
        Etapa 3 de 6
      </p>
      <h1 className="mt-2 text-3xl font-black leading-tight">
        Quem vai participar?
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Escolha como este bolão será organizado e quem poderá entrar.
      </p>

      {/* Mode cards */}
      <div className="mt-8 grid gap-3">
        {CONTEXT_OPTIONS.filter(
          (opt) => opt.id !== "existing_group" || availableGroups.length > 0
        ).map((opt) => {
          const selected = selectedMode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() =>
                flow.setState((current) => ({
                  ...current,
                  contextMode: opt.id,
                  accessMode:
                    opt.id === "existing_group" && current.selectedGrupoId
                      ? "group_gated"
                      : opt.id === "standalone"
                      ? current.accessMode === "group_gated"
                        ? "approval"
                        : current.accessMode
                      : current.accessMode,
                }))
              }
              className={cn(
                "flex items-start gap-3 rounded-3xl border p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]",
                selected
                  ? cn(tone.border, tone.bg)
                  : "border-white/10 bg-white/5 hover:bg-white/8"
              )}
            >
              <span className="mt-0.5 text-2xl">{opt.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-black text-white">{opt.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{opt.description}</p>
              </div>
              <div
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-all",
                  selected ? "border-primary bg-primary scale-110" : "border-white/20"
                )}
              />
            </button>
          );
        })}
      </div>

      {/* ── Existing group picker ── */}
      {selectedMode === "existing_group" && (
        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
            Escolha o grupo
          </p>
          {isLoading ? (
            <div className="mt-3 h-12 w-full animate-pulse rounded-2xl bg-white/5" />
          ) : (
            <div className="mt-3 grid gap-2">
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() =>
                    flow.setState((current) => ({
                      ...current,
                      selectedGrupoId: group.id,
                      accessMode: "group_gated",
                    }))
                  }
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-colors",
                    flow.state.selectedGrupoId === group.id
                      ? cn(tone.border, tone.bg)
                      : "border-white/10 bg-[#0c1811] hover:bg-white/5"
                  )}
                >
                  <p className="text-sm font-bold">{group.name}</p>
                </button>
              ))}
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 p-4 text-[11px] font-black uppercase tracking-widest text-zinc-400 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
              >
                <Users2 className="h-4 w-4" />
                Criar novo grupo
              </button>
            </div>
          )}
        </div>
      )}


      {/* Selected summary pill */}
      {selectedMode && (
        <div className={cn("mt-4 rounded-2xl border px-4 py-3 animate-in fade-in duration-200", tone.border, tone.bg)}>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
            Contexto escolhido
          </p>
          <p className="mt-0.5 font-bold text-white text-sm">
            {CONTEXT_OPTIONS.find((o) => o.id === selectedMode)?.emoji}{" "}
            {CONTEXT_OPTIONS.find((o) => o.id === selectedMode)?.title}
          </p>
        </div>
      )}

      {/* Nav */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => flow.setStep("catalog")}
          className="inline-flex min-w-0 items-center gap-2 rounded-[20px] border border-white/10 bg-black/20 px-5 py-3 text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-zinc-400 transition-all hover:bg-white/5"
        >
          {t("wizard.back")}
        </button>
        <button
          onClick={() => flow.setStep("type")}
          disabled={!flow.canAdvance}
          className="rounded-2xl bg-primary px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-black disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
        >
          {t("wizard.next")}
        </button>
      </div>
      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={isCreateGroupOpen}
        onOpenChange={setIsCreateGroupOpen}
        onSuccess={(groupId) => {
          flow.setState((current) => ({
            ...current,
            contextMode: "existing_group",
            selectedGrupoId: groupId,
            accessMode: "group_gated",
          }));
        }}
      />
    </div>
  );
}
