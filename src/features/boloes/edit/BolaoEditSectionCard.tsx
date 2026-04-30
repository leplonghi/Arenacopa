import { Lock, Unlock, Loader2 } from "lucide-react";

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
  return (
    <section
      className={[
        "relative overflow-hidden rounded-[20px] border p-4 transition-all duration-200",
        editable
          ? "border-primary/20 bg-[linear-gradient(145deg,rgba(145,255,59,0.06),rgba(0,0,0,0.3))]"
          : "border-white/8 bg-white/[0.03]",
      ].join(" ")}
    >
      {/* Editable accent bar */}
      {editable && (
        <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-[20px] bg-primary" />
      )}

      <div className="flex items-start justify-between gap-3 pl-1">
        <div className="min-w-0">
          <h3 className="text-sm font-black uppercase tracking-[0.06em] text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-400">{description}</p>
        </div>

        {/* Status chip */}
        <span
          className={[
            "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]",
            editable
              ? "border border-primary/25 bg-primary/10 text-primary"
              : "border border-white/10 bg-white/5 text-zinc-500",
          ].join(" ")}
        >
          {editable
            ? <><Unlock className="h-2.5 w-2.5" />Editável</>
            : <><Lock className="h-2.5 w-2.5" />Travado</>
          }
        </span>
      </div>

      {/* Action button */}
      {(actionLabel || onAction) && (
        <button
          type="button"
          onClick={onAction}
          disabled={!onAction || busy}
          className={[
            "mt-4 inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-40",
            editable
              ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
              : "border-white/10 bg-white/5 text-white hover:bg-white/8",
          ].join(" ")}
        >
          {busy ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" />Processando…</>
          ) : (
            actionLabel ?? (editable ? "Editar seção" : "Duplicar para mudar")
          )}
        </button>
      )}
    </section>
  );
}
