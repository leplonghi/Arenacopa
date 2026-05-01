import { motion, AnimatePresence } from "framer-motion";
import { Clock, UserCheck, UserX } from "lucide-react";
import { ArenaPanel, ArenaSectionHeader } from "@/components/arena/ArenaPrimitives";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdmissionInboxItem = {
  id: string;
  title: string;
  subtitle: string;
  /** ISO date string of when request was submitted */
  createdAt?: string | null;
  avatarUrl?: string | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function isUrgent(isoDate: string | null | undefined): boolean {
  if (!isoDate) return false;
  const diffHours = (Date.now() - new Date(isoDate).getTime()) / 3_600_000;
  return diffHours > 24;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function RequestAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-2 ring-primary/30">
      <span className="text-xs font-black text-primary">{initials}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdmissionInbox({
  title,
  description,
  emptyTitle,
  emptyDescription,
  items,
}: AdmissionInboxProps) {
  return (
    <ArenaPanel className="p-5 text-white">
      <ArenaSectionHeader eyebrow="Entrada" title={title} hint={description} />

      {items.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] px-5 py-7">
          <p className="font-display text-[1.35rem] font-semibold uppercase leading-none text-white">
            {emptyTitle}
          </p>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{emptyDescription}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const urgent = isUrgent(item.createdAt);

              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.22 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className={[
                    "rounded-[24px] border p-4 backdrop-blur-xl transition-colors",
                    urgent
                      ? "border-amber-500/30 bg-amber-500/[0.06]"
                      : "border-white/10 bg-white/[0.04]",
                  ].join(" ")}
                >
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <RequestAvatar name={item.title} avatarUrl={item.avatarUrl} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-display text-base font-semibold uppercase leading-none text-white">
                          {item.title}
                        </p>
                        {item.status && (
                          <span
                            className={[
                              "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]",
                              urgent
                                ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                                : "border border-primary/20 bg-primary/10 text-primary",
                            ].join(" ")}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs leading-5 text-zinc-400">{item.subtitle}</p>

                      {item.createdAt && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                          <Clock className="h-3 w-3 shrink-0" />
                          {timeAgo(item.createdAt)}
                          {urgent && (
                            <span className="ml-1 text-amber-400">· Aguardando há mais de 24h</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {(item.primaryActionLabel ?? item.secondaryActionLabel) ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.primaryActionLabel && (
                        <button
                          onClick={item.onPrimaryAction}
                          className="flex items-center gap-1.5 rounded-[18px] bg-primary px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105 active:scale-95"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          {item.primaryActionLabel}
                        </button>
                      )}
                      {item.secondaryActionLabel && (
                        <button
                          onClick={item.onSecondaryAction}
                          className="flex items-center gap-1.5 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/80 transition hover:bg-white/[0.06] active:scale-95"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          {item.secondaryActionLabel}
                        </button>
                      )}
                    </div>
                  ) : null}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </ArenaPanel>
  );
}
