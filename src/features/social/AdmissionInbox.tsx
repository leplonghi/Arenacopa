import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

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
    <ArenaPanel className="p-5 text-white">
      <ArenaSectionHeader eyebrow="Inbox" title={title} />
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>

      {items.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-7">
          <p className="font-display text-[1.35rem] font-semibold uppercase leading-none text-white">{emptyTitle}</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{emptyDescription}</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[1.35rem] font-semibold uppercase leading-none text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.subtitle}</p>
                  {item.meta ? <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{item.meta}</p> : null}
                </div>
                {item.status ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                    {item.status}
                  </span>
                ) : null}
              </div>

              {item.primaryActionLabel || item.secondaryActionLabel ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.primaryActionLabel ? (
                    <button
                      onClick={item.onPrimaryAction}
                      className="rounded-[18px] bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105"
                    >
                      {item.primaryActionLabel}
                    </button>
                  ) : null}
                  {item.secondaryActionLabel ? (
                    <button
                      onClick={item.onSecondaryAction}
                      className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.06]"
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
    </ArenaPanel>
  );
}
