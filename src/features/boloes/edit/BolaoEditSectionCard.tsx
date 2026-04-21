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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          <p className="mt-1 text-xs text-zinc-400">{description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
            editable ? "bg-primary/15 text-primary" : "bg-white/10 text-zinc-300"
          }`}
        >
          {editable ? "Editável" : "Travado"}
        </span>
      </div>

      <button
        onClick={onAction}
        disabled={!onAction || busy}
        className="mt-4 rounded-2xl border border-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Processando..." : actionLabel || (editable ? "Editar seção" : "Duplicar para mudar")}
      </button>
    </section>
  );
}
