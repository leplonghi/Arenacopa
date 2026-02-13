import { useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FilterOption {
  id: string;
  label: string;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  filters: { label: string; options: FilterOption[]; selected: string[]; onSelect: (ids: string[]) => void; multi?: boolean }[];
}

export function FilterSheet({ open, onClose, title, filters }: FilterSheetProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-2xl border-t border-border animate-slide-up max-h-[70vh] overflow-y-auto safe-bottom">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-5">
          {filters.map((filter, idx) => (
            <div key={idx}>
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">{filter.label}</span>
              <div className="flex flex-wrap gap-2">
                {filter.options.map(opt => {
                  const isActive = filter.selected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        if (filter.multi) {
                          filter.onSelect(
                            isActive ? filter.selected.filter(s => s !== opt.id) : [...filter.selected, opt.id]
                          );
                        } else {
                          filter.onSelect(isActive ? [] : [opt.id]);
                        }
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-secondary-foreground border-border hover:border-primary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function FilterChips({ chips, onRemove }: { chips: { id: string; label: string }[]; onRemove: (id: string) => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-4 pb-2">
      {chips.map(c => (
        <button
          key={c.id}
          onClick={() => onRemove(c.id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-[11px] font-medium"
        >
          {c.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
