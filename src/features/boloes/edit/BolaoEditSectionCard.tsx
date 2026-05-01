import { Lock, Unlock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type BolaoEditSectionCardProps = {
  title: string;
  description: string;
  editable: boolean;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
};

export function BolaoEditSectionCard({
  title,
  description,
  editable,
  actionLabel,
  onAction,
  busy = false,
}: BolaoEditSectionCardProps) {
  const { t } = useTranslation("bolao");

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 transition-all duration-300",
        editable
          ? "border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent shadow-lg shadow-primary/[0.02]"
          : "border-white/10 bg-white/[0.03]"
      )}
    >
      {/* Editable accent bar */}
      {editable && (
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-3xl bg-primary/60" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-white/90">
            {title}
          </h3>
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>

        {/* Status chip */}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] transition-colors",
            editable
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-white/10 bg-white/5 text-zinc-500"
          )}
        >
          {editable ? (
            <>
              <Unlock className="h-2.5 w-2.5" />
              {t("edit.card.editable")}
            </>
          ) : (
            <>
              <Lock className="h-2.5 w-2.5" />
              {t("edit.card.locked")}
            </>
          )}
        </div>
      </div>

      {/* Action button */}
      {(actionLabel || onAction) && (
        <button
          type="button"
          onClick={onAction}
          disabled={!onAction || busy}
          className={cn(
            "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-40",
            editable
              ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/5"
              : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("edit.card.processing")}
            </>
          ) : (
            actionLabel ?? (editable ? t("common.edit") : t("edit.participation.action_duplicate"))
          )}
        </button>
      )}
    </section>
  );
}
