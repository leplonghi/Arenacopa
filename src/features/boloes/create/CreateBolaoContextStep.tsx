import { useTranslation } from "react-i18next";
import { PoolContextChooser } from "@/features/boloes/create/PoolContextChooser";
import { CreateBolaoStepRail } from "@/features/boloes/create/CreateBolaoStepRail";
import { useUserGroups } from "@/hooks/useUserGroups";
import { cn } from "@/lib/utils";
import { getToneClasses } from "@/features/boloes/create/stepColors";
import type { useBolaoCreateFlow } from "@/features/boloes/create/useBolaoCreateFlow";

type Flow = ReturnType<typeof useBolaoCreateFlow>;

export function CreateBolaoContextStep({ flow }: { flow: Flow }) {
  const { t } = useTranslation("bolao");
  const { groups: availableGroups, isLoading } = useUserGroups();
  const tone = getToneClasses(3);

  const contextModeSelected = flow.state.contextMode;

  const contextModeLabels: Record<string, string> = {
    standalone: t("creation.context.modes.standalone"),
    existing_group: t("creation.context.modes.existing_group"),
    new_group: t("creation.context.modes.new_group"),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white">
      <div className="mb-8">
        <CreateBolaoStepRail activeStep={3} />
      </div>
      <p className={cn("text-[11px] font-black uppercase tracking-[0.22em]", tone.labelText)}>
        {t("creation.context.step_label")}
      </p>
      <h1 className="mt-2 text-3xl font-black">{t("creation.context.title")}</h1>
      <p className="mt-2 text-sm text-zinc-400">
        {t("creation.context.desc")}
      </p>

      <div className="mt-8">
        {contextModeSelected ? (
          <div className={cn("rounded-3xl border p-4", tone.border, tone.bg)}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
              {t("creation.context.selected_title")}
            </p>
            <p className="mt-1 font-black text-white">{contextModeLabels[contextModeSelected] || contextModeSelected}</p>
          </div>
        ) : (
          <PoolContextChooser
            value={flow.state.contextMode}
            onChange={(value) =>
              flow.setState((current) => ({
                ...current,
                contextMode: value,
                accessMode:
                  value === "existing_group" && current.selectedGrupoId
                    ? "group_gated"
                    : value === "standalone"
                      ? current.accessMode === "group_gated"
                        ? "approval"
                        : current.accessMode
                      : current.accessMode,
              }))
            }
            hasGroups={availableGroups.length > 0 || Boolean(flow.state.selectedGrupoId)}
          />
        )}
      </div>

      {flow.state.contextMode === "existing_group" ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
            {t("creation.context.choose_group")}
          </p>
          
          {isLoading ? (
            <div className="mt-3 h-12 w-full animate-pulse rounded-2xl bg-white/5" />
          ) : flow.state.selectedGrupoId ? (
            <div className={cn("mt-3 rounded-2xl border px-4 py-4", tone.border, tone.bg)}>
              <p className="font-black">
                {availableGroups.find(g => g.id === flow.state.selectedGrupoId)?.name || t("creation.context.selected_group")}
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {availableGroups.length === 0 && flow.state.selectedGrupoId ? (
                <div className={cn("rounded-2xl border px-4 py-4", tone.border, tone.bg)}>
                  <p className="font-black">{t("creation.context.preselected_group")}</p>
                  <p className="mt-1 text-sm text-zinc-300">{flow.state.selectedGrupoId}</p>
                </div>
              ) : null}

              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() =>
                    flow.setState((current) => ({
                      ...current,
                      selectedGrupoId: group.id,
                      accessMode: current.accessMode === "public" ? "public" : "group_gated",
                    }))
                  }
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    flow.state.selectedGrupoId === group.id
                      ? cn(tone.border, tone.bg)
                      : "border-white/10 bg-[#0c1811]"
                  )}
                >
                  <p className="font-black">{group.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {t("creation.context.group_desc")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {flow.state.contextMode === "new_group" ? (
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
            {t("creation.context.create_group_title")}
          </p>
          
          {flow.state.newGroupName.trim().length >= 3 && flow.state.newGroupVisibility ? (
            <div className="mt-3 space-y-3">
              <div className={cn("rounded-2xl border px-4 py-4", tone.border, tone.bg)}>
                <p className="font-black">{flow.state.newGroupEmoji} {flow.state.newGroupName}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {flow.state.newGroupDescription || t("creation.context.no_desc")}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {t("creation.context.visibility")}: {flow.state.newGroupVisibility === "private" 
                    ? t("creation.context.group_private") 
                    : t("creation.context.group_public")}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {["👥", "⚽", "🏆", "🔥", "🎯", "🎉"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => flow.setState((current) => ({ ...current, newGroupEmoji: emoji }))}
                    className={cn(
                      "rounded-2xl border p-3 text-2xl transition-colors",
                      flow.state.newGroupEmoji === emoji
                        ? cn(tone.border, tone.bg)
                        : "border-white/10 bg-[#0c1811]"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  value={flow.state.newGroupName}
                  onChange={(event) =>
                    flow.setState((current) => ({ ...current, newGroupName: event.target.value }))
                  }
                  placeholder={t("creation.context.placeholder_name")}
                  className="rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-base text-white focus:outline-none focus:border-primary/50"
                />
                <textarea
                  value={flow.state.newGroupDescription}
                  onChange={(event) =>
                    flow.setState((current) => ({ ...current, newGroupDescription: event.target.value }))
                  }
                  placeholder={t("creation.context.placeholder_desc")}
                  className="min-h-[100px] rounded-2xl border border-white/10 bg-[#0c1811] px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  onClick={() =>
                    flow.setState((current) => ({
                      ...current,
                      newGroupVisibility: "private",
                      newGroupAdmissionMode: "approval",
                    }))
                  }
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    flow.state.newGroupVisibility === "private"
                      ? cn(tone.border, tone.bg)
                      : "border-white/10 bg-[#0c1811]"
                  )}
                >
                  <p className="font-black">{t("creation.context.group_private")}</p>
                  <p className="mt-1 text-sm text-zinc-400">{t("creation.context.group_private_desc")}</p>
                </button>
                <button
                  onClick={() =>
                    flow.setState((current) => ({
                      ...current,
                      newGroupVisibility: "public",
                      newGroupAdmissionMode: "direct_code_or_invite",
                    }))
                  }
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    flow.state.newGroupVisibility === "public"
                      ? cn(tone.border, tone.bg)
                      : "border-white/10 bg-[#0c1811]"
                  )}
                >
                  <p className="font-black">{t("creation.context.group_public")}</p>
                  <p className="mt-1 text-sm text-zinc-400">{t("creation.context.group_public_desc")}</p>
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => flow.setStep("catalog")}
          className="inline-flex min-w-0 items-center gap-2 whitespace-normal rounded-[20px] border border-white/10 bg-black/20 px-5 py-3 text-center text-[11px] font-black uppercase leading-tight tracking-[0.14em] text-zinc-400 transition-all hover:bg-white/5"
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
    </div>
  );
}
