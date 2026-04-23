type AdmissionInboxItem = {
  id: string;
  title: string;
  subtitle: string;
  meta?: string | null;
  status?: string | null;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

type AdmissionInboxProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  items: AdmissionInboxItem[];
};

export function AdmissionInbox({
  title,
  description,
  emptyTitle,
  emptyDescription,
  items,
}: AdmissionInboxProps) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 text-white">
      <div className="mb-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">{title}</p>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-[#0c1811] px-4 py-6">
          <p className="text-sm font-black">{emptyTitle}</p>
          <p className="mt-1 text-sm text-zinc-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-[#0c1811] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">{item.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.subtitle}</p>
                  {item.meta ? <p className="mt-2 text-xs text-zinc-500">{item.meta}</p> : null}
                </div>
                {item.status ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">
                    {item.status}
                  </span>
                ) : null}
              </div>

              {item.primaryActionLabel || item.secondaryActionLabel ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.primaryActionLabel ? (
                    <button
                      onClick={item.onPrimaryAction}
                      className="rounded-2xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black"
                    >
                      {item.primaryActionLabel}
                    </button>
                  ) : null}
                  {item.secondaryActionLabel ? (
                    <button
                      onClick={item.onSecondaryAction}
                      className="rounded-2xl border border-white/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white"
                    >
                      {item.secondaryActionLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
