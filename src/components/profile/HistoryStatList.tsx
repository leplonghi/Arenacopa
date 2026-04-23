export function HistoryStatList({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="divide-y divide-white/8 rounded-[28px] border border-white/10 bg-white/[0.03]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 px-5 py-4">
          <span className="text-base font-semibold text-zinc-300">{item.label}</span>
          <span className="font-display text-[1.8rem] font-semibold uppercase leading-none text-primary">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
